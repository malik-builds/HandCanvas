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
        <h1 className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
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

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onEraserToggle}
            className={[
              "rounded-lg border px-3 py-2 font-mono text-xs transition-all duration-200",
              eraserOn
                ? "border-[#a78bfa] bg-[#a78bfa]/15 text-[#c4b5fd] shadow-[0_0_16px_rgba(167,139,250,0.25)]"
                : "border-white/10 bg-white/5 text-zinc-300 hover:border-white/20",
            ].join(" ")}
          >
            Eraser {eraserOn ? "on" : "off"}
          </button>
          <button
            type="button"
            onClick={onClearCanvas}
            className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-zinc-300 transition-all hover:border-[#f87171]/50 hover:text-[#fca5a5]"
          >
            Clear
          </button>
        </div>

        <button
          type="button"
          onClick={onDownloadPng}
          className="w-full rounded-lg border border-[#22e3c9]/40 bg-[#22e3c9]/10 py-2.5 font-mono text-xs font-medium text-[#22e3c9] transition-all hover:bg-[#22e3c9]/20"
        >
          Download PNG
        </button>

        <div className="rounded-lg border border-white/5 bg-black/30 px-3 py-2 font-mono text-[10px] text-zinc-500">
          <div className="flex justify-between gap-2">
            <span>Gesture</span>
            <span className={isTracking ? "text-[#22e3c9]" : "text-zinc-600"}>
              {isTracking ? "tracking" : "no hand"}
            </span>
          </div>
          <div className="mt-1 text-zinc-400">
            Mode:{" "}
            <span className="uppercase text-zinc-300">{gestureMode}</span>
          </div>
        </div>
      </section>
    </aside>
  );
}
