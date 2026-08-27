import { BoundingBox, Geometry, PolarityBlock } from "../types/geometry";

export interface NormalizedLayer {
  id: string;
  type: string;
  side?: string;
  geometry: Geometry[];
  polarityBlocks: PolarityBlock[];
  bounds: BoundingBox;
}

export function createNormalizedLayer(
  id: string,
  type: string,
  side: string | undefined,
  geometry: Geometry[],
  polarityBlocks: PolarityBlock[],
  bounds: BoundingBox
): NormalizedLayer {
  return {
    id,
    type,
    side,
    geometry,
    polarityBlocks: polarityBlocks && polarityBlocks.length > 0 ? polarityBlocks : [{ polarity: "dark", geometry }],
    bounds
  };
}
