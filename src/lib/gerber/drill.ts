import { ParsedGerberFile } from "./types";
import { toMM } from "./utils";

export interface DrillInfo {
    drillCount: number;
    holeSizes: { diameter: number; count: number }[];
    pthCount: number;
    npthCount: number;
}

/**
 * Parses drill layers to count hits, classify PTH vs NPTH, and calculate hole sizes.
 */
export function analyzeDrills(parsedFiles: ParsedGerberFile[]): DrillInfo {
    const drillFiles = parsedFiles.filter(f => f.type === "drill");
    let drillCount = 0;
    const holeSizesMap = new Map<number, number>();
    let pthCount = 0;
    let npthCount = 0;

    const copperTop = parsedFiles.find(f => f.type === "copper_top");
    const copperBottom = parsedFiles.find(f => f.type === "copper_bottom");

    drillFiles.forEach(df => {
        const isFilenameNPTH = df.name.toLowerCase().includes("npth") ||
            df.name.toLowerCase().includes("nonplated") ||
            df.name.toLowerCase().includes("unplated");

        df.imageTree.children.forEach((child: any) => {
            // Drill hits are represented as circles/shapes in plotted tree
            if (child.type === "imageShape" && child.shape?.type === "circle") {
                drillCount++;
                const radius = child.shape.r;
                const diameterMM = parseFloat(toMM(radius * 2, df.units).toFixed(3));

                // Track hole size counts
                holeSizesMap.set(diameterMM, (holeSizesMap.get(diameterMM) || 0) + 1);

                // Classify PTH vs NPTH
                // If it is in an NPTH file, it's NPTH.
                // Otherwise, check if there's an overlapping copper pad on top/bottom layers.
                if (isFilenameNPTH) {
                    npthCount++;
                } else {
                    const cx = toMM(child.shape.cx, df.units);
                    const cy = toMM(child.shape.cy, df.units);

                    const overlapsCopper = hasOverlappingCopperPad(cx, cy, copperTop, copperBottom);
                    if (overlapsCopper) {
                        pthCount++;
                    } else {
                        npthCount++;
                    }
                }
            }
        });
    });

    const holeSizes = Array.from(holeSizesMap.entries()).map(([diameter, count]) => ({
        diameter,
        count
    })).sort((a, b) => a.diameter - b.diameter);

    return {
        drillCount,
        holeSizes,
        pthCount,
        npthCount
    };
}

/**
 * Checks if a coordinate overlaps with any copper pad (flash) on top or bottom copper layers.
 */
function hasOverlappingCopperPad(
    cx: number,
    cy: number,
    copperTop?: ParsedGerberFile,
    copperBottom?: ParsedGerberFile
): boolean {
    const checkFile = (file?: ParsedGerberFile) => {
        if (!file) return false;
        return file.imageTree.children.some((child: any) => {
            if (child.type === "imageShape" && child.shape) {
                const shape = child.shape;
                const sx = toMM(shape.cx ?? shape.x ?? 0, file.units);
                const sy = toMM(shape.cy ?? shape.y ?? 0, file.units);

                // Radius or half-width check
                let size = 0.5; // default tolerance range
                if (shape.type === "circle") size = shape.r;
                else if (shape.type === "rectangle") size = Math.max(shape.xSize, shape.ySize) / 2;

                const mmSize = toMM(size, file.units);
                const dist = Math.sqrt((cx - sx) ** 2 + (cy - sy) ** 2);

                // Overlaps if distance is smaller than pad size + tolerance
                return dist <= (mmSize + 0.15);
            }
            return false;
        });
    };

    return checkFile(copperTop) || checkFile(copperBottom);
}
