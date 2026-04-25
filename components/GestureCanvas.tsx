"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useHandTracking } from "@/hooks/useHandTracking";
import type { GestureMode, HandTrackingSnapshot } from "@/types/gestures";
import { GestureBadge } from "./GestureBadge";
import { ToolPanel } from "./ToolPanel";
import { WebcamPreview } from "./WebcamPreview";

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
  const [canvasBg, setCanvasBg] = useState<"#000000" | "#ffffff">("#000000");
  const [camReady, setCamReady] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  const bindVideo = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    setVideoEl(node);
  }, []);

  const colorRef = useRef(color);
  const brushRef = useRef(brushSize);
  const eraserRef = useRef(eraserOn);
  const canvasBgRef = useRef(canvasBg);
  useEffect(() => { colorRef.current = color; }, [color]);
  useEffect(() => { brushRef.current = brushSize; }, [brushSize]);
  useEffect(() => { eraserRef.current = eraserOn; }, [eraserOn]);
  useEffect(() => { canvasBgRef.current = canvasBg; }, [canvasBg]);

  const penDownRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastMidRef = useRef<{ x: number; y: number } | null>(null);
  const smoothedPosRef = useRef<{ x: number; y: number } | null>(null);

  // EMA smoothing factor — lower = smoother but laggier, higher = more responsive
  const SMOOTH_ALPHA = 0.35;

  const clearCanvasPixels = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = canvasBgRef.current;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const handleClearHoldComplete = useCallback(() => {
    clearCanvasPixels();
    penDownRef.current = false;
    lastPointRef.current = null;
    lastMidRef.current = null;
    smoothedPosRef.current = null;
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
      lastMidRef.current = null;
      smoothedPosRef.current = null;
      return;
    }

    const pos = snap.fingerPosition;
    if (!pos) return;

    // EMA smoothing — reduces per-frame jitter before drawing
    const prev = smoothedPosRef.current;
    const sx = prev ? prev.x + SMOOTH_ALPHA * (pos.x - prev.x) : pos.x;
    const sy = prev ? prev.y + SMOOTH_ALPHA * (pos.y - prev.y) : pos.y;
    smoothedPosRef.current = { x: sx, y: sy };

    if (effective === "erase") {
      const r = Math.max(10, brushRef.current * 2);
      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fillStyle = canvasBgRef.current;
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
      lastPointRef.current = { x: sx, y: sy };
      lastMidRef.current = { x: sx, y: sy };
      return;
    }

    const last = lastPointRef.current;
    if (!last) { lastPointRef.current = { x: sx, y: sy }; return; }

    // Correct midpoint bezier: draw from prevMid → curMid using lastPoint as
    // the control point. Consecutive segments share endpoints (the midpoints)
    // so the path is continuous and genuinely curved — no more segmented look.
    const curMid = { x: (last.x + sx) / 2, y: (last.y + sy) / 2 };
    const prevMid = lastMidRef.current ?? last;

    ctx.beginPath();
    ctx.moveTo(prevMid.x, prevMid.y);
    ctx.quadraticCurveTo(last.x, last.y, curMid.x, curMid.y);
    ctx.stroke();

    lastPointRef.current = { x: sx, y: sy };
    lastMidRef.current = curMid;
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

  // Cursor overlay rAF loop — reads snapshotRef every frame, never causes re-renders
  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    const lastPos = { x: 0, y: 0, valid: false };

    const drawCursor = () => {
      if (cancelled) return;
      const canvas = cursorCanvasRef.current;
      if (!canvas) { raf = requestAnimationFrame(drawCursor); return; }
      const ctx = canvas.getContext("2d");
      if (!ctx) { raf = requestAnimationFrame(drawCursor); return; }

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      const snap = snapshotRef.current;
      const effective = resolveEffectiveMode(snap.gestureMode, eraserRef.current);
      const pos = snap.fingerPosition;

      if (pos) { lastPos.x = pos.x; lastPos.y = pos.y; lastPos.valid = true; }

      // Contrast color flips with the background so the cursor is always visible
      const contrastColor = canvasBgRef.current === "#ffffff" ? "#000000" : "#ffffff";

      if (effective === "draw" && pos) {
        // Filled dot in current brush color + faint outer ring
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 5, 0, Math.PI * 2);
        ctx.fillStyle = colorRef.current;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 9, 0, Math.PI * 2);
        ctx.strokeStyle = colorRef.current;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.4;
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (effective === "erase" && pos) {
        // Hollow circle matching the exact eraser footprint
        const r = Math.max(10, brushRef.current * 2);
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.strokeStyle = contrastColor;
        ctx.lineWidth = 1.5;
        ctx.globalAlpha = 0.7;
        ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (lastPos.valid) {
        // Ghost dot at last known position so you know where you left off
        ctx.beginPath();
        ctx.arc(lastPos.x, lastPos.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = contrastColor;
        ctx.globalAlpha = 0.2;
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      raf = requestAnimationFrame(drawCursor);
    };

    raf = requestAnimationFrame(drawCursor);
    return () => { cancelled = true; cancelAnimationFrame(raf); };
  }, [snapshotRef]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    penDownRef.current = false;
    lastPointRef.current = null;
  }, [canvasBg]);

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
      ctx.fillStyle = canvasBgRef.current;
      ctx.fillRect(0, 0, size.width, size.height);
    }

    const cursor = cursorCanvasRef.current;
    if (cursor) {
      cursor.width = Math.floor(size.width * dpr);
      cursor.height = Math.floor(size.height * dpr);
      cursor.style.width = `${size.width}px`;
      cursor.style.height = `${size.height}px`;
      const cctx = cursor.getContext("2d");
      if (cctx) cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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
      <canvas
        ref={cursorCanvasRef}
        className="pointer-events-none absolute inset-0 block h-full w-full touch-none"
        aria-hidden
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
              canvasBg={canvasBg}
              onBgToggle={() => setCanvasBg((bg) => bg === "#000000" ? "#ffffff" : "#000000")}
              gestureMode={gestureMode}
              isTracking={isTracking}
            />
          </div>
          <div className="order-2 flex w-full flex-col items-end gap-2 sm:w-auto">
            <p className="pointer-events-auto hidden max-w-xs text-right font-mono text-[10px] leading-relaxed text-zinc-600 sm:block">
              Draw: index only · Erase: peace or eraser · Pause: left hand or open palm ·
              Clear: fist 2s
            </p>
            <WebcamPreview videoRef={bindVideo} snapshotRef={snapshotRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
