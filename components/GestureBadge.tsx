"use client";

import type { GestureMode } from "@/types/gestures";

const MODE_META: Record<
  GestureMode,
  { label: string; emoji: string; accent: string }
> = {
  draw: {
    label: "Draw",
    emoji: "✏️",
    accent: "text-[#22e3c9]",
  },
  erase: {
    label: "Erase",
    emoji: "🗑️",
    accent: "text-[#a78bfa]",
  },
  pause: {
    label: "Pause",
    emoji: "✋",
    accent: "text-[#fbbf24]",
  },
  clear: {
    label: "Clear",
    emoji: "❌",
    accent: "text-[#f87171]",
  },
  idle: {
    label: "Idle",
    emoji: "◯",
    accent: "text-zinc-500",
  },
};

interface GestureBadgeProps {
  mode: GestureMode;
  clearHoldProgress: number;
}

export function GestureBadge({ mode, clearHoldProgress }: GestureBadgeProps) {
  const meta = MODE_META[mode];
  const isHoldingClear = clearHoldProgress > 0 && clearHoldProgress < 1;

  return (
    <div
      className="pointer-events-none flex flex-col items-end gap-2"
      aria-live="polite"
    >
      <div
        key={mode}
        className={[
          "flex items-center gap-2 rounded-lg border border-white/10 px-3 py-1.5",
          "bg-black/40 backdrop-blur-md shadow-[0_0_24px_rgba(34,227,201,0.12)]",
          "animate-[badge-pop_0.35s_ease-out]",
          meta.accent,
        ].join(" ")}
      >
        <span className="text-lg leading-none" aria-hidden>
          {meta.emoji}
        </span>
        <span className="font-mono text-xs font-medium tracking-wide uppercase">
          {meta.label}
        </span>
      </div>
      {isHoldingClear && (
        <div className="h-1 w-32 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[#22e3c9] to-[#4ade80] transition-[width] duration-100"
            style={{ width: `${clearHoldProgress * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}
