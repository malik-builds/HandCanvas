# HandCanvas

Draw on a full-screen canvas using only your hand — no mouse, no touch, no stylus. HandCanvas uses your webcam and [MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html) to classify hand gestures in real time and route them into a drawing engine built on HTML5 Canvas. The frontend is [Next.js 15](https://nextjs.org/) with TypeScript and Tailwind CSS v4.

## Gesture Reference

| Gesture | Action |
|---------|--------|
| ☝️ **Index finger only** | Draw — traces your fingertip on the canvas |
| ✌️ **Peace sign** (index + middle) | Erase — circular eraser at the fingertip midpoint |
| 🖐 **Open palm** (all fingers out) | Pause — lifts the pen without ending the session |
| ✊ **Closed fist** held 2 s | Clear — wipes the entire canvas; a progress bar shows the hold |

> You can also toggle the **Eraser** and **Clear** via the tool panel on the left.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5 |
| Framework | Next.js 15 (App Router) |
| UI library | React 19 |
| Styling | Tailwind CSS v4 (CSS-first) |
| Hand tracking | MediaPipe Hands 0.4 (CDN) |
| Rendering | HTML5 Canvas (DPR-aware) |
| Font | JetBrains Mono |
| Container | Docker + docker-compose |

## Run Locally

Requires **Node.js 20+** and a webcam. Allow camera access when the browser prompts.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Run with Docker

The image builds a production bundle — edits on disk don't appear until you rebuild.

```bash
docker compose up --build
```

Then open [http://localhost:3000](http://localhost:3000).

For day-to-day work, `npm run dev` is faster. Use Docker to verify the production build.

## Project Structure

```
app/
  layout.tsx          # Root layout — JetBrains Mono, dark bg, metadata
  page.tsx            # Single route: renders <GestureCanvas />
  globals.css         # Tailwind v4 import + CSS variables + badge-pop keyframe

components/
  GestureCanvas.tsx   # Root smart component — camera, drawing, orchestration
  ToolPanel.tsx       # Left-side UI panel (colors, brush, eraser, save)
  GestureBadge.tsx    # Top-right gesture mode badge + clear-hold progress bar
  WebcamPreview.tsx   # Webcam feed + MediaPipe skeleton overlay (rAF loop)

hooks/
  useHandTracking.ts  # Loads MediaPipe from CDN, classifies gestures, fires onFrame

types/
  gestures.ts         # GestureMode, HandLandmark, Point2D, HandTrackingSnapshot
  mediapipe-globals.d.ts  # window.Hands / window.Camera / window.drawConnectors types
```

## How It Works

1. **MediaPipe Hands** is loaded from the jsDelivr CDN at runtime (no npm install, no SSR issues).
2. A `Camera` instance feeds webcam frames into `Hands`, which returns 21 normalized landmarks per detected hand.
3. `useHandTracking` classifies each frame into a `GestureMode` using tip-vs-PIP-joint comparisons and fires `onFrame` with a snapshot.
4. `GestureCanvas` receives the snapshot and paints strokes (or erases) on the main canvas using the `source-over` / `destination-out` composite operations.
5. A mirrored coordinate transform maps the webcam's flipped X axis back to screen space.

## Notes

- Runs entirely in the browser — no server, no database, no API keys.
- Requires `getUserMedia` — HTTPS or `localhost` only.
- Tested on Chrome and Firefox (desktop). Safari support depends on webcam permissions.
