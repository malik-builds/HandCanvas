"use client";

import type { GestureMode } from "@/types/gestures";

const PRESET_COLORS = [
  "#22e3c9",
  "#4ade80",
  "#a78bfa",
  "#f472b6",
  "#fbbf24",
  "#38bdf8",
  "#f87171",
  "#e5e5e5",
];

interface ToolPanelProps {
  color: string;
  onColorChange: (c: string) => void;
  brushSize: number;
  onBrushSizeChange: (n: number) => void;
  eraserOn: boolean;
  onEraserToggle: () => void;
  onClearCanvas: () => void;
  onDownloadPng: () => void;
  gestureMode: GestureMode;
  isTracking: boolean;
}

export function ToolPanel({
  color,
  onColorChange,
  brushSize,
  onBrushSizeChange,
  eraserOn,
  onEraserToggle,
  onClearCanvas,
  onDownloadPng,
  gestureMode,
  isTracking,
}: ToolPanelProps) {
  return (
    <aside
      className={[
        "pointer-events-auto w-[min(100vw-2rem,280px)] rounded-xl border border-white/[0.08]",
        "bg-[#0a0a0a]/75 p-4 shadow-[0_8px_40px_rgba(0,0,0,0.55)] backdrop-blur-xl",
        "transition-all duration-300",
      ].join(" ")}
    >
      <header className="mb-4 border-b border-white/10 pb-3">
        <h1 className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-400">
          Gesture Draw
        </h1>
        <p className="mt-1 font-mono text-[10px] leading-relaxed text-zinc-500">
          Webcam gestures · no pointer required
        </p>
      </header>

      <section className="space-y-4">
        <p className="font-mono text-[10px] text-zinc-600">Controls coming soon…</p>
      </section>
    </aside>
  );
}
