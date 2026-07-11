import { extractZipRecursively } from "../../../lib/gerber/extractor";
import { detectFileType, isGerberOrDrill } from "./layerDetector";
import { parseGerberContent } from "./parser";
import { calculateDimensions } from "./dimension";
import { analyzeDrills } from "./drill";
import { renderPCBToSVG } from "./renderer";
import { GerberFile, PCBInfo, ParsedGerberFile } from "./types";

/**
 * Main orchestration entrypoint to extract and analyze Gerber files inside a ZIP using Tracespace.
 */
export async function extractAndAnalyzeGerber(buffer: ArrayBuffer): Promise<{
    files: GerberFile[];
    parsedGerberFiles: ParsedGerberFile[];
    info: PCBInfo;
    previewFront: string;
    previewBack: string;
}> {
    // 1. Extract ZIP files
    const extracted = await extractZipRecursively(buffer);
    const files: GerberFile[] = [];
    const parsedGerberFiles: ParsedGerberFile[] = [];
    
    // File availability trackers
    const detectedFilesMap: Record<string, boolean> = {};
    let drillFileDetected = false;
    let outlineFileDetected = false;

    // 2. Classify and parse every valid Gerber/Excellon file
    for (const file of extracted) {
        if (!isGerberOrDrill(file.content)) continue;

        const type = detectFileType(file.name, file.content);
        if (type !== "unknown") {
            detectedFilesMap[type] = true;
            if (type === "outline") outlineFileDetected = true;
            if (type === "drill") drillFileDetected = true;

            const parsed = parseGerberContent(file.name, file.content, type);
            parsedGerberFiles.push(parsed);
        }

        files.push({
            name: file.name,
            type,
            content: file.content
        });
    }

    if (parsedGerberFiles.length === 0) {
        throw new Error("No valid Gerber or Excellon Drill files found in the ZIP archive.");
    }

    // 3. Select best outline candidate
    const outlineCandidates = parsedGerberFiles.filter(f => f.type === "outline");
    let bestOutline = outlineCandidates.length > 0 ? outlineCandidates[0] : null;

    // 4. Generate outline fallback if missing
    if (!bestOutline) {
        const tempDim = calculateDimensions(null, parsedGerberFiles);
        const minX = tempDim.minX;
        const maxX = tempDim.maxX;
        const minY = tempDim.minY;
        const maxY = tempDim.maxY;

        // Dummy/generated ImageTree for outline fallback
        bestOutline = {
            name: "generated_outline.gko",
            type: "outline",
            bounds: { minX, maxX, minY, maxY },
            units: "mm",
            imageTree: {
                type: "image",
                units: "mm",
                size: [minX, minY, maxX, maxY],
                children: [
                    {
                        type: "imagePath",
                        width: 0.2,
                        segments: [
                            { type: "line", start: [minX, minY], end: [maxX, minY] },
                            { type: "line", start: [maxX, minY], end: [maxX, maxY] },
                            { type: "line", start: [maxX, maxY], end: [minX, maxY] },
                            { type: "line", start: [minX, maxY], end: [minX, minY] }
                        ]
                    }
                ]
            }
        };
        parsedGerberFiles.push(bestOutline);
        detectedFilesMap["outline"] = true;
        outlineFileDetected = true;
    }

    // 5. Calculate dimensions and board shape
    const dimensions = calculateDimensions(bestOutline, parsedGerberFiles);
    const { width, height, boardShape, outlineType } = dimensions;

    // 6. Layer count detection (up to 32 layers)
    const topCopperDetected = detectedFilesMap["copper_top"];
    const bottomCopperDetected = detectedFilesMap["copper_bottom"];
    let layers = 2;

    if (topCopperDetected && !bottomCopperDetected) {
        layers = 1;
    } else if (topCopperDetected && bottomCopperDetected) {
        const innerFilesCount = files.filter(f => 
            f.type === "inner" || 
            f.name.toLowerCase().match(/\.(g[1-9]|ly[2-9]|inner|in[0-9]|in[1-3][0-9])/i)
        ).length;

        if (innerFilesCount > 0) {
            layers = Math.min(2 + innerFilesCount, 32);
        } else {
            layers = 2;
        }
    }

    // 7. Drill hit count and details
    const drillInfo = analyzeDrills(parsedGerberFiles);

    // 8. Warnings compile
    const warnings: string[] = [];
    if (!detectedFilesMap["copper_top"]) warnings.push("Top Copper layer missing");
    if (!detectedFilesMap["copper_bottom"] && layers > 1) warnings.push("Bottom Copper layer missing");
    if (!detectedFilesMap["solder_mask_top"]) warnings.push("Top Solder Mask missing");
    if (!detectedFilesMap["solder_mask_bottom"] && layers > 1) warnings.push("Bottom Solder Mask missing");
    if (!detectedFilesMap["silkscreen_top"]) warnings.push("Top Silkscreen missing");
    if (!detectedFilesMap["silkscreen_bottom"] && layers > 1) warnings.push("Bottom Silkscreen missing");
    if (!outlineFileDetected) warnings.push("Outline file missing (auto-generated fallback outline)");

    // 9. Generate file list report
    const standardTypes = [
        { key: "copper_top", label: "Top Copper" },
        { key: "copper_bottom", label: "Bottom Copper" },
        { key: "solder_mask_top", label: "Top Mask" },
        { key: "solder_mask_bottom", label: "Bottom Mask" },
        { key: "silkscreen_top", label: "Top Silk" },
        { key: "silkscreen_bottom", label: "Bottom Silk" },
        { key: "drill", label: "Drill" },
        { key: "outline", label: "Outline" }
    ];
    const detectedFiles = standardTypes.map(t => ({
        name: t.label,
        type: t.key,
        found: !!detectedFilesMap[t.key]
    }));

    const info: PCBInfo = {
        width,
        height,
        layers,
        detectedFiles,
        drillFileDetected,
        outlineFileDetected,
        warnings,
        boardShape,
        outlineType,
        drillCount: drillInfo.drillCount
    };

    // 10. Generate composite front and back SVG strings
    const svgFront = renderPCBToSVG(parsedGerberFiles, "top", "#52c41a", dimensions);
    const svgBack = renderPCBToSVG(parsedGerberFiles, "bottom", "#52c41a", dimensions);

    // Encode to data URLs
    const previewFront = "data:image/svg+xml;base64," + Buffer.from(svgFront).toString("base64");
    const previewBack = "data:image/svg+xml;base64," + Buffer.from(svgBack).toString("base64");

    return {
        files,
        parsedGerberFiles,
        info,
        previewFront,
        previewBack
    };
}
