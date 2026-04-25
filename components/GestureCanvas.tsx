"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useHandTracking } from "@/hooks/useHandTracking";
import type { GestureMode, HandTrackingSnapshot } from "@/types/gestures";
import { GestureBadge } from "./GestureBadge";
import { ToolPanel } from "./ToolPanel";
import { WebcamPreview } from "./WebcamPreview";

const CANVAS_BG = "#000000";

function resolveEffectiveMode(
  raw: GestureMode,
  eraserToggle: boolean
): "draw" | "erase" | "lift" {
  if (raw === "pause" || raw === "idle" || raw === "clear") {
    return "lift";
  }
  if (raw === "erase" || (eraserToggle && raw === "draw")) {
    return "erase";
  }
  if (raw === "draw") {
    return "draw";
  }
  return "lift";
}

export function GestureCanvas() {
  const [size, setSize] = useState({ width: 1280, height: 720 });
  const [color, setColor] = useState("#22e3c9");
  const [brushSize, setBrushSize] = useState(4);
  const [eraserOn, setEraserOn] = useState(false);
  const [camReady, setCamReady] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  const bindVideo = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    setVideoEl(node);
  }, []);

  const colorRef = useRef(color);
  const brushRef = useRef(brushSize);
  const eraserRef = useRef(eraserOn);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { brushRef.current = brushSize; }, [brushSize]);
  useEffect(() => { eraserRef.current = eraserOn; }, [eraserOn]);

  const penDownRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const clearCanvasPixels = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = CANVAS_BG;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleClearHoldComplete = useCallback(() => {
    clearCanvasPixels();
    penDownRef.current = false;
    lastPointRef.current = null;
  }, [clearCanvasPixels]);

  const paintFrame = useCallback((snap: HandTrackingSnapshot) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const effective = resolveEffectiveMode(snap.gestureMode, eraserRef.current);

    if (effective === "lift") {
      penDownRef.current = false;
      lastPointRef.current = null;
      return;
    }

    const pos = snap.fingerPosition;
    if (!pos) return;

    const { x, y } = pos;

    if (effective === "erase") {
      const r = Math.max(10, brushRef.current * 2);
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = CANVAS_BG;
      ctx.fill();
      return;
    }

    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = colorRef.current;
    ctx.lineWidth = brushRef.current;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (!penDownRef.current) {
      penDownRef.current = true;
      lastPointRef.current = { x, y };
      ctx.beginPath();
      ctx.moveTo(x, y);
      return;
    }

    const last = lastPointRef.current;
    if (!last) { lastPointRef.current = { x, y }; return; }

    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPointRef.current = { x, y };
  }, []);

  const paintRef = useRef(paintFrame);
  paintRef.current = paintFrame;
  const stableOnFrame = useCallback((snap: HandTrackingSnapshot) => {
    paintRef.current(snap);
  }, []);

  const { gestureMode, isTracking, clearHoldProgress, snapshotRef } =
    useHandTracking({
      videoElement: videoEl,
      canvasWidth: size.width,
      canvasHeight: size.height,
      enabled: camReady && !!videoEl,
      onFrame: stableOnFrame,
      onClearHoldComplete: handleClearHoldComplete,
    });

  useEffect(() => {
    function measure() {
      setSize({ width: window.innerWidth, height: window.innerHeight });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(size.width * dpr);
    canvas.height = Math.floor(size.height * dpr);
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = CANVAS_BG;
      ctx.fillRect(0, 0, size.width, size.height);
    }
    penDownRef.current = false;
    lastPointRef.current = null;
  }, [size.width, size.height]);

  useEffect(() => {
    if (!videoEl) return;
    const video = videoEl;
    let cancelled = false;
    let stream: MediaStream | null = null;

    async function startCam() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        video.srcObject = stream;
        await video.play().catch(() => undefined);
        if (!cancelled) { setCamReady(true); }
      } catch (e) {
        console.error("Camera error:", e);
      }
    }
    startCam();
    return () => {
      cancelled = true;
      setCamReady(false);
      if (stream) { stream.getTracks().forEach((t) => t.stop()); }
      video.srcObject = null;
    };
  }, [videoEl]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `gesture-draw-${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d0d0d]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full touch-none ring-1 ring-inset ring-[#22e3c9]/15 shadow-[inset_0_0_120px_rgba(34,227,201,0.04)]"
        aria-label="Drawing canvas"
      />
      <div className="pointer-events-none absolute inset-0 flex min-h-0 flex-col justify-between p-4 sm:p-6">
        <div className="flex shrink-0 justify-end">
          <GestureBadge mode={gestureMode} clearHoldProgress={clearHoldProgress} />
        </div>
        <div className="flex w-full shrink-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="pointer-events-auto order-1 w-full sm:w-auto sm:max-w-[min(100vw-2rem,280px)]">
            <ToolPanel
              color={color}
              onColorChange={setColor}
              brushSize={brushSize}
              onBrushSizeChange={setBrushSize}
              eraserOn={eraserOn}
              onEraserToggle={() => setEraserOn((v) => !v)}
              onClearCanvas={() => {
                clearCanvasPixels();
                penDownRef.current = false;
                lastPointRef.current = null;
              }}
              onDownloadPng={handleDownload}
              gestureMode={gestureMode}
              isTracking={isTracking}
            />
          </div>
          <div className="order-2 flex w-full flex-col items-end gap-2 sm:w-auto">
            <p className="pointer-events-auto hidden max-w-xs text-right font-mono text-[10px] leading-relaxed text-zinc-600 sm:block">
              Draw: index only · Erase: peace or eraser · Pause: open palm ·
              Clear: fist 2s
            </p>
            <WebcamPreview videoRef={bindVideo} snapshotRef={snapshotRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
