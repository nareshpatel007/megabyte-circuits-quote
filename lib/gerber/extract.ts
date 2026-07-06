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
            const parsed = parseGerberFile(name, content, type);
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

    // Determine dimensions from outline Gerber
    const { width, height } = parseGerberOutline(outlineContent);

    const detectedFiles = Object.entries(detectedFilesMap).map(([type, found]) => ({
        name: type.replace(/_/g, " ").toUpperCase(),
        type,
        found
    }));

    const info: PCBInfo = {
        width,
        height,
        layers,
        detectedFiles,
        drillFileDetected,
        outlineFileDetected
    };

    return {
        files,
        parsedGerberFiles,
        info
    };
}
