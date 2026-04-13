"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useHandTracking } from "@/hooks/useHandTracking";
import type { GestureMode, HandTrackingSnapshot } from "@/types/gestures";
import { GestureBadge } from "./GestureBadge";
import { ToolPanel } from "./ToolPanel";
import { WebcamPreview } from "./WebcamPreview";

export function GestureCanvas() {
  const [size, setSize] = useState({ width: 1280, height: 720 });
  const [color, setColor] = useState("#22e3c9");
  const [brushSize, setBrushSize] = useState(3);
  const [eraserOn, setEraserOn] = useState(false);
  const [camReady, setCamReady] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  const penDownRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const bindVideo = useCallback((node: HTMLVideoElement | null) => {
    videoRef.current = node;
    setVideoEl(node);
  }, []);

  const { gestureMode, isTracking, clearHoldProgress, snapshotRef } =
    useHandTracking({
      videoElement: videoEl,
      canvasWidth: size.width,
      canvasHeight: size.height,
      enabled: camReady && !!videoEl,
      onFrame: () => {},
      onClearHoldComplete: () => {},
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
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, size.width, size.height);
    }
    penDownRef.current = false;
    lastPointRef.current = null;
  }, [size.width, size.height]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#0d0d0d]">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full touch-none"
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
              onClearCanvas={() => {}}
              onDownloadPng={() => {}}
              gestureMode={gestureMode}
              isTracking={isTracking}
            />
          </div>
          <div className="order-2 flex w-full flex-col items-end gap-2 sm:w-auto">
            <WebcamPreview videoRef={bindVideo} snapshotRef={snapshotRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
