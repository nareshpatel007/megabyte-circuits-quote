export interface Point {
  x: number; // in mm
  y: number; // in mm
}

export interface LineGeometry {
  type: "line";
  start: Point;
  end: Point;
  width: number;
  polarity: "dark" | "clear";
}

export interface ArcGeometry {
  type: "arc";
  start: Point;
  end: Point;
  center: Point;
  radius: number;
  startAngle: number;
  endAngle: number;
  clockwise: boolean;
  width: number;
  polarity: "dark" | "clear";
}

export interface CircleGeometry {
  type: "circle";
  center: Point;
  radius: number;
  filled: boolean;
  polarity: "dark" | "clear";
}

export interface RectangleGeometry {
  type: "rectangle";
  center: Point;
  width: number;
  height: number;
  rotation?: number;
  polarity: "dark" | "clear";
}

export interface PolygonGeometry {
  type: "polygon";
  center: Point;
  outerRadius: number;
  vertices: number;
  rotation?: number;
  polarity: "dark" | "clear";
}

export interface RegionGeometry {
  type: "region";
  contours: Point[][];
  polarity: "dark" | "clear";
}


export interface FlashGeometry {
  type: "flash";
  point: Point;
  apertureCode: number;
  shape: "circle" | "rect" | "obround" | "polygon" | "macro" | "custom";
  size: { width: number; height: number; radius?: number };
  polarity: "dark" | "clear";
  macroPrimitives?: Array<{
    type: string;
    points?: Point[];
    center?: Point;
    radius?: number;
    width?: number;
    height?: number;
  }>;
}

export type Geometry =
  | LineGeometry
  | ArcGeometry
  | CircleGeometry
  | RectangleGeometry
  | PolygonGeometry
  | RegionGeometry
  | FlashGeometry;

export interface PolarityBlock {
  polarity: "dark" | "clear";
  geometry: Geometry[];
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}
