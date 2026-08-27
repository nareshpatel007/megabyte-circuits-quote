import { DrillData, PCBAnalysis } from "../types/analysis";
import { ParsedLayerData, combineBoardBounds } from "../geometry/geometryEngine";

export function analyzePCBProject(
  layers: ParsedLayerData[],
  drillData?: DrillData
): PCBAnalysis {
  const outlineLayer = layers.find((l) => l.type === "outline");
  const bounds = combineBoardBounds(layers, outlineLayer);

  const width = Number(bounds.width.toFixed(2));
  const height = Number(bounds.height.toFixed(2));
  const area = Number((width * height).toFixed(2));
  const perimeter = Number(((width + height) * 2).toFixed(2));

  // Layer breakdown
  const copperLayers = layers.filter((l) => l.type === "copper");
  const topCopper = copperLayers.some((l) => l.side === "top");
  const bottomCopper = copperLayers.some((l) => l.side === "bottom");
  const innerCopperCount = copperLayers.filter((l) => l.side === "inner" || (!l.side && l !== copperLayers[0])).length;

  const topSolderMask = layers.some((l) => l.type === "solder-mask" && l.side === "top");
  const bottomSolderMask = layers.some((l) => l.type === "solder-mask" && l.side === "bottom");

  const topSilkscreen = layers.some((l) => l.type === "silkscreen" && l.side === "top");
  const bottomSilkscreen = layers.some((l) => l.type === "silkscreen" && l.side === "bottom");

  const topPaste = layers.some((l) => l.type === "paste" && l.side === "top");
  const bottomPaste = layers.some((l) => l.type === "paste" && l.side === "bottom");

  const hasOutline = !!outlineLayer || layers.some((l) => l.type === "outline");
  const hasDrill = (drillData && drillData.holeCount > 0) || layers.some((l) => l.type === "drill");

  const copperCount = copperLayers.length || (topCopper || bottomCopper ? (topCopper && bottomCopper ? 2 : 1) : 2);
  const totalLayers = Math.max(copperCount, 1);

  // Geometry stats
  let minTrackWidth = Infinity;
  let maxTrackWidth = -Infinity;
  let padCount = 0;
  let trackCount = 0;

  for (const layer of copperLayers) {
    for (const geom of layer.geometry) {
      if (geom.type === "line") {
        trackCount++;
        if (geom.width > 0) {
          minTrackWidth = Math.min(minTrackWidth, geom.width);
          maxTrackWidth = Math.max(maxTrackWidth, geom.width);
        }
      } else if (geom.type === "flash") {
        padCount++;
      }
    }
  }

  const geometryStats = {
    minimumTrackWidth: isFinite(minTrackWidth) ? Number(minTrackWidth.toFixed(3)) : 0.15,
    maximumTrackWidth: isFinite(maxTrackWidth) ? Number(maxTrackWidth.toFixed(3)) : 1.2,
    padCount,
    viaCount: drillData ? Math.max(0, drillData.holeCount - padCount) : undefined,
    trackCount
  };

  // Drills
  const finalDrills: DrillData = drillData || {
    holes: [],
    tools: [],
    holeCount: 0,
    minimumDiameter: 0.3,
    maximumDiameter: 1.0,
    sizes: [],
    slotsCount: 0
  };

  // Manufacturing Feature Heuristics
  const hasSlots = (drillData?.slotsCount || 0) > 0;
  const hasGoldFingers = layers.some((l) => l.filename.toLowerCase().includes("finger"));
  const hasCastellated = layers.some((l) => l.filename.toLowerCase().includes("castellated"));

  return {
    dimensions: {
      width,
      height,
      area,
      perimeter,
      unit: "mm",
      bounds
    },
    layers: {
      total: totalLayers,
      copper: copperCount,
      topCopper,
      bottomCopper,
      innerCopper: innerCopperCount,
      topSolderMask,
      bottomSolderMask,
      topSilkscreen,
      bottomSilkscreen,
      topPaste,
      bottomPaste,
      outline: hasOutline,
      drill: hasDrill
    },
    drills: finalDrills,
    geometry: geometryStats,
    features: {
      blindVias: "unknown",
      buriedVias: "unknown",
      slots: hasSlots ? true : "unknown",
      goldFingers: hasGoldFingers ? true : "unknown",
      castellatedHoles: hasCastellated ? true : "unknown",
      edgePlating: "unknown"
    },
    fileCount: layers.length,
    detectedFiles: layers.map((l) => ({
      name: l.filename,
      type: l.type,
      side: l.side,
      confidence: "high"
    }))
  };
}
