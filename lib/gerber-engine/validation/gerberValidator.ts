import { PCBAnalysis } from "../types/analysis";
import { GerberValidationResult, ValidationError, ValidationWarning } from "../types/validation";
import { ParsedLayerData } from "../geometry/geometryEngine";

export function validateGerberProject(
  layers: ParsedLayerData[],
  analysis: PCBAnalysis
): GerberValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  if (layers.length === 0) {
    errors.push({
      code: "NO_LAYERS",
      message: "No valid Gerber files found in upload."
    });
  }

  if (!analysis.layers.topCopper && !analysis.layers.bottomCopper) {
    errors.push({
      code: "MISSING_COPPER",
      message: "Neither Top Copper nor Bottom Copper layer was detected."
    });
  }

  if (!analysis.layers.outline) {
    warnings.push({
      code: "MISSING_OUTLINE",
      message: "Board outline layer could not be detected. Dimension was calculated from geometry bounding box.",
      suggestion: "Please ensure board outline layer (.GKO or .GM1) is included."
    });
  }

  if (!analysis.layers.drill) {
    warnings.push({
      code: "MISSING_DRILL",
      message: "Drill file (.DRL or .XLN) was not detected.",
      suggestion: "If your PCB requires holes, please include an Excellon drill file."
    });
  }

  if (analysis.dimensions.width > 500 || analysis.dimensions.height > 500) {
    warnings.push({
      code: "LARGE_DIMENSIONS",
      message: `Extracted board dimensions (${analysis.dimensions.width} x ${analysis.dimensions.height} mm) are unusually large.`,
      suggestion: "Verify Gerber file units (mm vs inches)."
    });
  }

  if (analysis.dimensions.width <= 0 || analysis.dimensions.height <= 0) {
    errors.push({
      code: "INVALID_DIMENSIONS",
      message: "Computed board dimensions are invalid or zero."
    });
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}
