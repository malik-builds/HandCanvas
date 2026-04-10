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
        <div>
          <label className="mb-2 block font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            Color
          </label>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onColorChange(c)}
                className={[
                  "h-8 w-8 rounded-md border-2 transition-transform duration-200",
                  color === c
                    ? "border-[#22e3c9] scale-110 shadow-[0_0_12px_rgba(34,227,201,0.45)]"
                    : "border-white/10 hover:border-white/25",
                ].join(" ")}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
              />
            ))}
            <label className="flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-white/20">
              <span className="sr-only">Custom color</span>
              <input
                type="color"
                value={color}
                onChange={(e) => onColorChange(e.target.value)}
                className="h-10 w-10 cursor-pointer border-0 bg-transparent p-0"
              />
            </label>
          </div>
        </div>

        <div>
          <div className="mb-2 flex justify-between font-mono text-[10px] uppercase tracking-wider text-zinc-500">
            <label htmlFor="brush">Brush</label>
            <span className="text-[#22e3c9]">{brushSize}px</span>
          </div>
          <input
            id="brush"
            type="range"
            min={1}
            max={40}
            value={brushSize}
            onChange={(e) => onBrushSizeChange(Number(e.target.value))}
            className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-zinc-800 accent-[#22e3c9]"
          />
        </div>
      </section>
    </aside>
  );
}
