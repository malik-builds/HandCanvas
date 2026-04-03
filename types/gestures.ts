/** High-level mode derived from hand pose + UI toggles */
export type GestureMode = "draw" | "erase" | "pause" | "clear" | "idle";

/** Normalized MediaPipe landmark (0–1 in image space) */
export interface HandLandmark {
  x: number;
  y: number;
  z: number;
}

export interface Point2D {
  x: number;
  y: number;
}

export interface StrokeOptions {
  color: string;
  lineWidth: number;
}

export interface HandTrackingSnapshot {
  gestureMode: GestureMode;
  fingerPosition: Point2D | null;
  isTracking: boolean;
  landmarks: HandLandmark[] | null;
  /** Progress 0–1 while fist is held for clear (optional UI) */
  clearHoldProgress: number;
}

/** MediaPipe hand skeleton edges (for drawConnectors) — static data, safe to import anywhere */
export const HAND_CONNECTIONS: Array<[number, number]> = [
  [0, 1],
  [1, 2],
  [2, 3],
  [3, 4],
  [0, 5],
  [5, 6],
  [6, 7],
  [7, 8],
  [5, 9],
  [9, 10],
  [10, 11],
  [11, 12],
  [9, 13],
  [13, 14],
  [14, 15],
  [15, 16],
  [13, 17],
  [0, 17],
  [17, 18],
  [18, 19],
  [19, 20],
];
