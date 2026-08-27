import { BoundingBox, Geometry, PolarityBlock } from "../types/geometry";
import { ParseStatistics, ParserWarning } from "../types/gerber";
import { computeGeometryBounds } from "./bounds";

export interface ParsedLayerData {
  filename: string;
  type: string;
  side?: string;
  geometry: Geometry[];
  polarityBlocks?: PolarityBlock[];
  bounds: BoundingBox;
  statistics?: ParseStatistics;
  warnings?: ParserWarning[];
}

export function combineBoardBounds(
  layers: ParsedLayerData[],
  outlineLayer?: ParsedLayerData
): BoundingBox {
  if (outlineLayer && outlineLayer.geometry.length > 0) {
    const outlineBounds = computeGeometryBounds(outlineLayer.geometry);
    if (outlineBounds.width > 1 && outlineBounds.height > 1) {
      return outlineBounds;
    }
  }

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const layer of layers) {
    if (layer.bounds && isFinite(layer.bounds.minX)) {
      minX = Math.min(minX, layer.bounds.minX);
      minY = Math.min(minY, layer.bounds.minY);
      maxX = Math.max(maxX, layer.bounds.maxX);
      maxY = Math.max(maxY, layer.bounds.maxY);
    }
  }

  if (!isFinite(minX) || !isFinite(minY) || !isFinite(maxX) || !isFinite(maxY)) {
    return { minX: 0, minY: 0, maxX: 100, maxY: 100, width: 100, height: 100 };
  }

  const width = Math.max(maxX - minX, 1);
  const height = Math.max(maxY - minY, 1);

  return {
    minX,
    minY,
    maxX,
    maxY,
    width,
    height
  };
}
