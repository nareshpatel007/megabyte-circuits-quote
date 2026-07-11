import JSZip from "jszip";
import { detectFileType } from "./detect";
import { GerberFile, PCBInfo, ParsedGerberFile } from "./types";
import { parseGerberFile, parseGerberOutline } from "./parser";

export async function extractAndAnalyzeGerber(buffer: ArrayBuffer): Promise<{
    files: GerberFile[];
    parsedGerberFiles: ParsedGerberFile[];
    info: PCBInfo;
}> {
    const zip = await JSZip.loadAsync(buffer);
    const files: GerberFile[] = [];
    const parsedGerberFiles: ParsedGerberFile[] = [];
    
    const fileNames = Object.keys(zip.files);
    let outlineContent = "";
    let topCopperDetected = false;
    let bottomCopperDetected = false;
    let drillFileDetected = false;
    let outlineFileDetected = false;

    const detectedFilesMap: { [key: string]: boolean } = {
        copper_top: false,
        copper_bottom: false,
        solder_mask_top: false,
        solder_mask_bottom: false,
        silkscreen_top: false,
        silkscreen_bottom: false,
        drill: false,
        outline: false
    };

    // Pre-scan files to find default coordinate format and units
    let defaultUnits: "mm" | "in" = "mm";
    let defaultDivisor = 100000; // standard default for modern Gerbers (5 decimal places for mm)

    for (const name of fileNames) {
        if (zip.files[name].dir) continue;
        const content = await zip.files[name].async("string");
        if (content.includes("%MOMM")) {
            defaultUnits = "mm";
        } else if (content.includes("%MOIN")) {
            defaultUnits = "in";
        }
        const fsMatch = content.match(/%FSLAX\d(\d)Y/i) || content.match(/%FSTAX\d(\d)Y/i);
        if (fsMatch) {
            const decDigits = parseInt(fsMatch[1], 10);
            defaultDivisor = Math.pow(10, decDigits);
        }
    }

    for (const name of fileNames) {
        if (zip.files[name].dir) continue;

        const type = detectFileType(name);
        const content = await zip.files[name].async("string");

        if (type !== "unknown") {
            detectedFilesMap[type] = true;
            if (type === "outline") {
                outlineFileDetected = true;
                outlineContent = content;
            }
            if (type === "copper_top") topCopperDetected = true;
            if (type === "copper_bottom") bottomCopperDetected = true;
            if (type === "drill") drillFileDetected = true;

            // Generate parsed vector file structure
            const parsed = parseGerberFile(name, content, type, defaultUnits, defaultDivisor);
            parsedGerberFiles.push(parsed);
        }

        files.push({
            name,
            type,
            content
        });
    }

    // Determine Layer Count
    let layers = 2;
    if (topCopperDetected && !bottomCopperDetected) {
        layers = 1;
    } else if (topCopperDetected && bottomCopperDetected) {
        const innerFilesCount = fileNames.filter(name => 
            name.toLowerCase().match(/\.(g[1-9]|ly[2-9]|inner)/)
        ).length;
        
        if (innerFilesCount >= 4) {
            layers = 6;
        } else if (innerFilesCount >= 2) {
            layers = 4;
        } else {
            layers = 2;
        }
    }

    // Determine dimensions from outline Gerber first
    let { width, height } = parseGerberOutline(outlineContent, defaultUnits, defaultDivisor);

    // Robust fallback: if outline has 0 width or height, extract from parsed files union bounds
    if (width <= 0 || height <= 0) {
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        parsedGerberFiles.forEach(f => {
            if (["outline", "copper_top", "copper_bottom"].includes(f.type)) {
                if (f.bounds.minX < minX) minX = f.bounds.minX;
                if (f.bounds.maxX > maxX) maxX = f.bounds.maxX;
                if (f.bounds.minY < minY) minY = f.bounds.minY;
                if (f.bounds.maxY > maxY) maxY = f.bounds.maxY;
            }
        });
        if (minX !== Infinity && maxX !== -Infinity && minY !== Infinity && maxY !== -Infinity) {
            width = parseFloat((maxX - minX).toFixed(2));
            height = parseFloat((maxY - minY).toFixed(2));
        }
    }

    // Default fallback if still 0
    if (width <= 0 || height <= 0) {
        width = 100;
        height = 100;
    }

    const detectedFiles = Object.entries(detectedFilesMap).map(([type, found]) => ({
        name: type.replace(/_/g, " ").toUpperCase(),
        type,
        found
    }));

    const debugInfo = parsedGerberFiles.map(f => {
        return `${f.name.substring(f.name.lastIndexOf('/') + 1)} (${f.type}): bounds=[${f.bounds.minX.toFixed(2)}, ${f.bounds.maxX.toFixed(2)}, ${f.bounds.minY.toFixed(2)}, ${f.bounds.maxY.toFixed(2)}]`;
    }).join(" | ");

    const info: PCBInfo = {
        width,
        height,
        layers,
        detectedFiles,
        drillFileDetected,
        outlineFileDetected,
        debugInfo
    };

    return {
        files,
        parsedGerberFiles,
        info
    };
}
