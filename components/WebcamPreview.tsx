"use client";

import { useEffect, useRef } from "react";
import type { HandTrackingSnapshot } from "@/types/gestures";
import { HAND_CONNECTIONS } from "@/types/gestures";

interface WebcamPreviewProps {
  videoRef: (el: HTMLVideoElement | null) => void;
  snapshotRef: React.MutableRefObject<HandTrackingSnapshot>;
}

export function WebcamPreview({ videoRef, snapshotRef }: WebcamPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoLocalRef = useRef<HTMLVideoElement | null>(null);

  const setVideo = (el: HTMLVideoElement | null) => {
    videoLocalRef.current = el;
    videoRef(el);
  };

  useEffect(() => {
    let raf = 0;
    let cancelled = false;

    const paint = () => {
      if (cancelled) return;
      const video = videoLocalRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) {
        raf = requestAnimationFrame(paint);
        return;
      }

      const w = video.videoWidth || video.clientWidth;
      const h = video.videoHeight || video.clientHeight;
      if (w && h) {
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
      }

      const ctx = canvas.getContext("2d");
      if (!ctx) {
        raf = requestAnimationFrame(paint);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const lm = snapshotRef.current.landmarks;
      if (
        lm &&
        typeof window !== "undefined" &&
        typeof window.drawConnectors === "function"
      ) {
        window.drawConnectors(ctx, lm, HAND_CONNECTIONS, {
          color: "#22e3c9",
          lineWidth: 2,
        });
        if (typeof window.drawLandmarks === "function") {
          window.drawLandmarks(ctx, lm, {
            color: "#4ade80",
            lineWidth: 1,
            radius: 2,
          });
        }
      }

      raf = requestAnimationFrame(paint);
    };

    raf = requestAnimationFrame(paint);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [snapshotRef]);

  return (
    <div
      className={[
        "pointer-events-none overflow-hidden rounded-xl border border-[#22e3c9]/25",
        "bg-black/60 shadow-[0_0_32px_rgba(34,227,201,0.15)]",
      ].join(" ")}
    >
      <div className="relative aspect-video w-[min(42vw,280px)] scale-x-[-1] sm:w-[280px]">
        <video
          ref={setVideo}
          className="absolute inset-0 h-full w-full object-cover"
          playsInline
          muted
          autoPlay
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />
      </div>
      <p className="pointer-events-none border-t border-white/5 px-2 py-1 text-center font-mono text-[9px] uppercase tracking-wider text-zinc-500">
        Camera
      </p>
    </div>
  );
}
