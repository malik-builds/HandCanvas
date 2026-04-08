"use client";

import { useRef } from "react";
import type { HandTrackingSnapshot } from "@/types/gestures";

interface WebcamPreviewProps {
  videoRef: (el: HTMLVideoElement | null) => void;
  snapshotRef: React.MutableRefObject<HandTrackingSnapshot>;
}

export function WebcamPreview({ videoRef, snapshotRef }: WebcamPreviewProps) {
  const videoLocalRef = useRef<HTMLVideoElement | null>(null);

  const setVideo = (el: HTMLVideoElement | null) => {
    videoLocalRef.current = el;
    videoRef(el);
  };

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
      </div>
      <p className="pointer-events-none border-t border-white/5 px-2 py-1 text-center font-mono text-[9px] uppercase tracking-wider text-zinc-500">
        Camera
      </p>
    </div>
  );
}
