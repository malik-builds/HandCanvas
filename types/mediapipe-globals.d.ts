export {};

declare global {
  interface Window {
    Hands: new (config?: {
      locateFile?: (file: string) => string;
    }) => {
      setOptions: (opts: Record<string, unknown>) => void;
      onResults: (cb: (results: MediaPipeHandsResults) => void) => void;
      send: (input: { image: HTMLVideoElement | HTMLCanvasElement }) => Promise<void>;
      close: () => void;
    };
    Camera: new (
      video: HTMLVideoElement,
      options: {
        onFrame: () => Promise<void>;
        width?: number;
        height?: number;
      }
    ) => {
      start: () => void;
      stop: () => void;
    };
    drawConnectors: (
      ctx: CanvasRenderingContext2D,
      landmarks: Array<{ x: number; y: number; z?: number }>,
      connections: Array<[number, number]>,
      style?: { color?: string; lineWidth?: number }
    ) => void;
    drawLandmarks: (
      ctx: CanvasRenderingContext2D,
      landmarks: Array<{ x: number; y: number; z?: number }>,
      style?: {
        color?: string;
        lineWidth?: number;
        radius?: number;
        fillColor?: string;
      }
    ) => void;
    HAND_CONNECTIONS: Array<{ start: number; end: number }>;
  }
}

export interface MediaPipeHandsResults {
  multiHandLandmarks?: Array<Array<{ x: number; y: number; z: number }>>;
  multiHandedness?: Array<{ score: number; index: number; categoryName: string; label: string }>;
  image?: CanvasImageSource;
}
