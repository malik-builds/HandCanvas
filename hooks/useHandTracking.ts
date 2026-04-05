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
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

function isFingerExtendedY(
  lm: HandLandmark[],
  tipIdx: number,
  pipIdx: number
): boolean {
  return lm[tipIdx].y < lm[pipIdx].y;
}

function isThumbExtended(lm: HandLandmark[], handedLabel: string): boolean {
  const tip = lm[4];
  const ip = lm[3];
  if (handedLabel === "Right") {
    return tip.x > ip.x;
  }
  return tip.x < ip.x;
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

export function useHandTracking(
  options: UseHandTrackingOptions
): UseHandTrackingResult {
  const { videoElement, canvasWidth, canvasHeight, enabled, onFrame, onClearHoldComplete } = options;

  const snapshotRef = useRef<HandTrackingSnapshot>({
    gestureMode: "idle",
    fingerPosition: null,
    isTracking: false,
    landmarks: null,
    clearHoldProgress: 0,
  });

  const [gestureMode, setGestureMode] = useState<GestureMode>("idle");
  const [fingerPosition, setFingerPosition] = useState<Point2D | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [clearHoldProgress, setClearHoldProgress] = useState(0);

  return { gestureMode, fingerPosition, isTracking, clearHoldProgress, snapshotRef };
}
