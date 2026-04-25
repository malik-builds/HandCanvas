# HandCanvas

Draw on a full-screen canvas using only your hands — no mouse, no touch, no stylus. HandCanvas uses your webcam and [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html) to classify hand gestures in real time and route them into a drawing engine built on HTML5 Canvas.

**Live demo → [hand-canvas-malik.vercel.app](https://hand-canvas-malik.vercel.app)**

Built with [Next.js 15](https://nextjs.org/), TypeScript, and Tailwind CSS v4.

---

## Gesture Reference

| Hand | Gesture | Action |
|------|---------|--------|
| Right | ☝️ Index finger only | **Draw** — traces a smooth bezier curve from your fingertip |
| Right | ✌️ Peace sign (index + middle) | **Erase** — circular eraser at the fingertip midpoint |
| Right | ✊ Fist held 2 s | **Clear** — wipes the canvas; a progress bar shows the hold |
| Left | ✋ Any pose | **Pause** — lifts the pen; right-hand cursor stays visible so you know where you'll resume |

> **Two-hand mode:** raise your left hand to pause drawing at any time without changing your right-hand pose. Lower it to resume instantly.

You can also toggle **Eraser**, **Clear**, and **background color** via the tool panel.

---

## Tool Panel

| Control | Description |
|---------|-------------|
| Color swatches | 8 presets + custom color picker |
| Brush slider | Stroke width 1–40 px |
| Eraser slider | Eraser radius 5–60 px (independent of brush) |
| Eraser toggle | Force erase mode on right hand |
| Clear button | Instant canvas wipe |
| Canvas toggle | Switch background between black and white |
| Download PNG | Saves the current canvas as a PNG |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5 |
| Framework | Next.js 15 (App Router) |
| UI library | React 19 |
| Styling | Tailwind CSS v4 (CSS-first) |
| Hand tracking | MediaPipe Hands 0.4 (CDN) |
| Rendering | HTML5 Canvas (DPR-aware, cursor overlay) |
| Font | JetBrains Mono |
| Hosting | Vercel |
| Container | Docker + docker-compose |

---

## Run Locally

Requires **Node.js 20+** and a webcam. Allow camera access when the browser prompts.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Run with Docker

```bash
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000). Use this to verify the production build; `npm run dev` is faster for day-to-day work.

---

## Project Structure

```
app/
  layout.tsx              # Root layout — JetBrains Mono, dark bg, metadata
  page.tsx                # Single route: renders <GestureCanvas />
  icon.svg                # SVG favicon (hand icon in brand teal)
  globals.css             # Tailwind v4 import + CSS variables + badge-pop keyframe

components/
  GestureCanvas.tsx       # Root smart component — camera, drawing, cursor, orchestration
  ToolPanel.tsx           # Left-side UI panel (colors, brush, eraser, bg toggle, save)
  GestureBadge.tsx        # Top-right gesture mode badge + clear-hold progress bar
  WebcamPreview.tsx       # Webcam feed + MediaPipe skeleton overlay (rAF loop)

hooks/
  useHandTracking.ts      # Loads MediaPipe from CDN, two-hand classification, fires onFrame

types/
  gestures.ts             # GestureMode, HandLandmark, Point2D, HandTrackingSnapshot
  mediapipe-globals.d.ts  # window.Hands / window.Camera / window.drawConnectors types
```

---

## How It Works

1. **MediaPipe Hands** is loaded from the jsDelivr CDN at runtime — no npm install, no SSR issues.
2. A `Camera` instance feeds raw webcam frames into `Hands`, which returns 21 normalized landmarks per detected hand (up to 2 hands).
3. `useHandTracking` separates hands by handedness: MediaPipe labels the user's left hand `"Right"` in the raw (un-mirrored) frame, so labels are swapped accordingly. Left hand = pause signal; right hand = gesture classification.
4. Gesture classification compares fingertip Y positions against PIP joints — no ML model beyond MediaPipe's built-in landmark detector.
5. `GestureCanvas` applies **EMA smoothing** (α = 0.35) and a **2 px dead zone** to the position before drawing, then uses **midpoint bezier curves** for a continuous, smooth stroke.
6. A separate **cursor overlay canvas** runs its own rAF loop with independent EMA (α = 0.3), displaying a live cursor that stays visible even when drawing is paused.
7. A mirrored X-coordinate transform maps the webcam's flipped axis back to screen space.

---

## Notes

- Runs entirely in the browser — no server, no database, no API keys.
- Requires `getUserMedia` — HTTPS or `localhost` only.
- Tested on Chrome (desktop). Safari support depends on webcam permissions.
