import { ParsedGerberFile } from "./types";
import { toMM } from "./utils";

export interface DimensionResult {
    width: number;
    height: number;
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
    boardShape: "Rectangle" | "Square" | "Circular" | "Custom";
    outlineType: "Outline Layer" | "Computed Bounding Box";
}

/**
 * Calculates the board dimensions by merging the geometries of all parsed layers
 * and validating them against the board outline if available.
 */
export function calculateDimensions(
    outlineFile: ParsedGerberFile | null,
    allParsedFiles: ParsedGerberFile[]
): DimensionResult {
    // 1. Calculate merged bounds of ALL files (normalized to mm)
    let mergedMinX = Infinity;
    let mergedMaxX = -Infinity;
    let mergedMinY = Infinity;
    let mergedMaxY = -Infinity;

    allParsedFiles.forEach(f => {
        if (f.bounds.maxX > f.bounds.minX && f.bounds.maxY > f.bounds.minY) {
            const fileMinX = toMM(f.bounds.minX, f.units);
            const fileMaxX = toMM(f.bounds.maxX, f.units);
            const fileMinY = toMM(f.bounds.minY, f.units);
            const fileMaxY = toMM(f.bounds.maxY, f.units);

            if (fileMinX < mergedMinX) mergedMinX = fileMinX;
            if (fileMaxX > mergedMaxX) mergedMaxX = fileMaxX;
            if (fileMinY < mergedMinY) mergedMinY = fileMinY;
            if (fileMaxY > mergedMaxY) mergedMaxY = fileMaxY;
        }
    });

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    let outlineType: DimensionResult["outlineType"] = "Computed Bounding Box";

    // 2. Load outline bounds if outline exists and is valid
    if (outlineFile && outlineFile.bounds.maxX > outlineFile.bounds.minX && outlineFile.bounds.maxY > outlineFile.bounds.minY) {
        minX = toMM(outlineFile.bounds.minX, outlineFile.units);
        maxX = toMM(outlineFile.bounds.maxX, outlineFile.units);
        minY = toMM(outlineFile.bounds.minY, outlineFile.units);
        maxY = toMM(outlineFile.bounds.maxY, outlineFile.units);
        outlineType = "Outline Layer";
    } else {
        // Fallback to merged bounds
        minX = mergedMinX;
        maxX = mergedMaxX;
        minY = mergedMinY;
        maxY = mergedMaxY;
    }

    // Default if bounds remain uncalculated
    if (minX === Infinity || maxX === -Infinity || minY === Infinity || maxY === -Infinity) {
        minX = 0;
        maxX = 100;
        minY = 0;
        maxY = 100;
    }

    const width = parseFloat((maxX - minX).toFixed(2));
    const height = parseFloat((maxY - minY).toFixed(2));

    // Determine board shape
    let boardShape: DimensionResult["boardShape"] = "Rectangle";
    if (width > 0 && height > 0) {
        const diff = Math.abs(width - height);
        if (diff < 0.5) {
            // Check if outline is circular
            let isCircle = false;
            if (outlineFile) {
                // If there are many arc segments, or shape is circular
                const childArcs = outlineFile.imageTree.children.filter((c: any) => c.type === "imagePath" && c.segments?.some((s: any) => s.type === "arc"));
                if (childArcs.length > 0) {
                    isCircle = true;
                }
            }
            boardShape = isCircle ? "Circular" : "Square";
        }
    }

    return {
        width,
        height,
        minX,
        maxX,
        minY,
        maxY,
        boardShape,
        outlineType
    };
}
