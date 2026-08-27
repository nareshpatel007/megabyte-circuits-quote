import { BoundingBox } from "./geometry";

export interface BoardDimensions {
  width: number; // in mm
  height: number; // in mm
  area: number; // in mm²
  perimeter: number; // in mm
  unit: "mm";
  bounds: BoundingBox;
}

export interface LayerBreakdown {
  total: number;
  copper: number;
  topCopper: boolean;
  bottomCopper: boolean;
  innerCopper: number;
  topSolderMask: boolean;
  bottomSolderMask: boolean;
  topSilkscreen: boolean;
  bottomSilkscreen: boolean;
  topPaste: boolean;
  bottomPaste: boolean;
  outline: boolean;
  drill: boolean;
}

export interface DrillTool {
  toolNumber: number;
  diameter: number; // in mm
  count: number;
  plated?: boolean;
}

export interface DrillHole {
  x: number; // in mm
  y: number; // in mm
  diameter: number; // in mm
  plated?: boolean;
  toolNumber: number;
}

export interface DrillData {
  holes: DrillHole[];
  tools: DrillTool[];
  holeCount: number;
  minimumDiameter: number;
  maximumDiameter: number;
  sizes: number[];
  slotsCount: number;
  bounds?: BoundingBox;
}

export interface GeometryStats {
  minimumTrackWidth?: number; // mm
  maximumTrackWidth?: number; // mm
  padCount: number;
  viaCount?: number;
  trackCount: number;
  copperAreaEstimate?: number; // mm²
}

export type FeatureDetectionStatus = boolean | "unknown";

export interface PCBManufacturingFeatures {
  blindVias: FeatureDetectionStatus;
  buriedVias: FeatureDetectionStatus;
  slots: FeatureDetectionStatus;
  goldFingers: FeatureDetectionStatus;
  castellatedHoles: FeatureDetectionStatus;
  edgePlating: FeatureDetectionStatus;
  copperWeight?: string;
}

export interface PCBAnalysis {
  dimensions: BoardDimensions;
  layers: LayerBreakdown;
  drills: DrillData;
  geometry: GeometryStats;
  features: PCBManufacturingFeatures;
  fileCount: number;
  detectedFiles: Array<{
    name: string;
    type: string;
    side?: string;
    confidence: "high" | "medium" | "low";
  }>;
}
