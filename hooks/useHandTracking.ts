"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  GestureMode,
  HandLandmark,
  HandTrackingSnapshot,
  Point2D,
} from "@/types/gestures";

const MEDIAPIPE_HANDS_VER = "0.4.1675469240";
const MEDIAPIPE_CAMERA_VER = "0.3.1675466862";
const MEDIAPIPE_DRAWING_VER = "0.3.1675466124";

const CLEAR_HOLD_MS = 2000;

const CDN_SCRIPTS = [
  `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${MEDIAPIPE_HANDS_VER}/hands.js`,
  `https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@${MEDIAPIPE_CAMERA_VER}/camera_utils.js`,
  `https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@${MEDIAPIPE_DRAWING_VER}/drawing_utils.js`,
] as const;

function loadScriptOnce(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) { resolve(); return; }
    const s = document.createElement("script");
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

function isFingerExtendedY(lm: HandLandmark[], tipIdx: number, pipIdx: number): boolean {
  return lm[tipIdx].y < lm[pipIdx].y;
}

function isThumbExtended(lm: HandLandmark[], handedLabel: string): boolean {
  const tip = lm[4]; const ip = lm[3];
  if (handedLabel === "Right") { return tip.x > ip.x; }
  return tip.x < ip.x;
}

function classifyGesture(lm: HandLandmark[], handedLabel: string): GestureMode {
  const index = isFingerExtendedY(lm, 8, 6);
  const middle = isFingerExtendedY(lm, 12, 10);
  const ring = isFingerExtendedY(lm, 16, 14);
  const pinky = isFingerExtendedY(lm, 20, 18);
  const thumb = isThumbExtended(lm, handedLabel);
  const fourOpen = index && middle && ring && pinky;
  const peace = index && middle && !ring && !pinky;
  if (fourOpen && thumb) { return "pause"; }
  if (peace) { return "erase"; }
  const fist = !index && !middle && !ring && !pinky && !thumb;
  if (fist) { return "idle"; }
  if (index && !middle) { return "draw"; }
  return "pause";
}

function mirrorX(x: number, width: number): number {
  return width - x * width;
}

function toCanvasPoint(lm: HandLandmark[], width: number, height: number, mode: GestureMode): Point2D {
  if (mode === "erase") {
    const ix = mirrorX(lm[8].x, width); const iy = lm[8].y * height;
    const mx = mirrorX(lm[12].x, width); const my = lm[12].y * height;
    return { x: (ix + mx) / 2, y: (iy + my) / 2 };
  }
  return { x: mirrorX(lm[8].x, width), y: lm[8].y * height };
}

export interface UseHandTrackingOptions {
  videoElement: HTMLVideoElement | null;
  canvasWidth: number;
  canvasHeight: number;
  enabled: boolean;
  onFrame?: (snapshot: HandTrackingSnapshot) => void;
  onClearHoldComplete?: () => void;
}

export interface UseHandTrackingResult {
  gestureMode: GestureMode;
  fingerPosition: Point2D | null;
  isTracking: boolean;
  clearHoldProgress: number;
  snapshotRef: React.MutableRefObject<HandTrackingSnapshot>;
}

export function useHandTracking(options: UseHandTrackingOptions): UseHandTrackingResult {
  const { videoElement, canvasWidth, canvasHeight, enabled, onFrame, onClearHoldComplete } = options;

  const snapshotRef = useRef<HandTrackingSnapshot>({
    gestureMode: "idle", fingerPosition: null, isTracking: false, landmarks: null, clearHoldProgress: 0,
  });

  const [gestureMode, setGestureMode] = useState<GestureMode>("idle");
  const [fingerPosition, setFingerPosition] = useState<Point2D | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [clearHoldProgress, setClearHoldProgress] = useState(0);

  const handsRef = useRef<{ close: () => void } | null>(null);
  const cameraRef = useRef<{ stop: () => void } | null>(null);
  const prevGestureRef = useRef<GestureMode>("idle");

  const onFrameRef = useRef(onFrame);
  onFrameRef.current = onFrame;

  const updateUiIfNeeded = useCallback((snap: HandTrackingSnapshot) => {
    if (snap.gestureMode !== prevGestureRef.current) {
      prevGestureRef.current = snap.gestureMode;
      setGestureMode(snap.gestureMode);
    }
    setIsTracking(snap.isTracking);
    setFingerPosition(snap.fingerPosition);
    setClearHoldProgress(snap.clearHoldProgress);
  }, []);

  useEffect(() => {
    if (!enabled || !videoElement) return;
    const video = videoElement;
    let cancelled = false;

    async function setup() {
      for (const src of CDN_SCRIPTS) {
        await loadScriptOnce(src);
        if (cancelled) return;
      }
      const Hands = window.Hands;
      const Camera = window.Camera;
      if (!Hands || !Camera) { console.error("MediaPipe globals missing after script load"); return; }

      const hands = new Hands({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/hands@${MEDIAPIPE_HANDS_VER}/${file}`,
      });

      hands.setOptions({
        modelComplexity: 1,
        maxNumHands: 1,
        minDetectionConfidence: 0.9,
        minTrackingConfidence: 0.5,
      });

      hands.onResults((results) => {
        if (cancelled) return;
        const w = canvasWidth; const h = canvasHeight;
        const handLm = results.multiHandLandmarks?.[0] as HandLandmark[] | undefined;
        const label = results.multiHandedness?.[0]?.label === "Left" ? "Left" : "Right";

        if (!handLm) {
          const snap: HandTrackingSnapshot = {
            gestureMode: "idle", fingerPosition: null, isTracking: false, landmarks: null, clearHoldProgress: 0,
          };
          snapshotRef.current = snap;
          updateUiIfNeeded(snap);
          onFrameRef.current?.(snap);
          return;
        }

        const mode = classifyGesture(handLm, label);
        const pos = mode === "pause" || mode === "idle" || mode === "clear"
          ? null
          : toCanvasPoint(handLm, w, h, mode);

        const snap: HandTrackingSnapshot = {
          gestureMode: mode, fingerPosition: pos, isTracking: true, landmarks: handLm, clearHoldProgress: 0,
        };
        snapshotRef.current = snap;
        updateUiIfNeeded(snap);
        onFrameRef.current?.(snap);
      });

      handsRef.current = hands;

      const cam = new Camera(video, {
        onFrame: async () => { await hands.send({ image: video }); },
        width: 1280, height: 720,
      });
      cameraRef.current = cam;
      cam.start();
    }

    setup().catch((e) => console.error("Hand tracking setup failed:", e));

    return () => {
      cancelled = true;
      cameraRef.current?.stop();
      cameraRef.current = null;
      handsRef.current?.close();
      handsRef.current = null;
    };
  }, [enabled, videoElement, canvasWidth, canvasHeight, updateUiIfNeeded]);

  return { gestureMode, fingerPosition, isTracking, clearHoldProgress, snapshotRef };
}
