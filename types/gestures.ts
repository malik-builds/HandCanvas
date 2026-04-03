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
