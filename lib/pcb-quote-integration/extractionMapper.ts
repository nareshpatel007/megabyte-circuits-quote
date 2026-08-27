import { PCBAnalysis } from "../gerber-engine/types/analysis";

export interface QuoteAutoSelection {
  layers: string; // e.g. "2"
  width: string; // e.g. "91.62"
  height: string; // e.g. "54.35"
  unit: "mm" | "inches";
  detectedFields: Record<string, boolean>; // e.g. { layers: true, dimensions: true }
}

export function mapPCBAnalysisToQuoteOptions(analysis: PCBAnalysis): QuoteAutoSelection {
  let layersStr = "2";
  const numLayers = analysis.layers.copper;

  if (numLayers <= 1) layersStr = "1";
  else if (numLayers <= 2) layersStr = "2";
  else if (numLayers <= 4) layersStr = "4";
  else if (numLayers <= 6) layersStr = "6";
  else if (numLayers <= 8) layersStr = "8";
  else if (numLayers <= 10) layersStr = "10";
  else if (numLayers <= 12) layersStr = "12";
  else if (numLayers <= 14) layersStr = "14";
  else layersStr = "16";

  const width = analysis.dimensions.width > 0 ? analysis.dimensions.width.toString() : "100";
  const height = analysis.dimensions.height > 0 ? analysis.dimensions.height.toString() : "100";

  return {
    layers: layersStr,
    width,
    height,
    unit: "mm",
    detectedFields: {
      layers: true,
      dimensions: true,
      drills: analysis.drills.holeCount > 0
    }
  };
}
