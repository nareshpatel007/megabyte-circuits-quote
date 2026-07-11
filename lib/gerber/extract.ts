import JSZip from "jszip";
import { detectFileType } from "./detect";
import { GerberFile, ParsedGerberFile } from "./types";
import { parseGerberFile } from "./parser";
import { extractAndAnalyzeGerber as tracespaceExtractAndAnalyze } from "../../src/lib/gerber";
import { ParsedGerberFile as TracespaceParsedFile, PCBInfo as TracespacePCBInfo } from "../../src/lib/gerber/types";

export async function extractAndAnalyzeGerber(buffer: ArrayBuffer): Promise<{
    files: GerberFile[];
    parsedGerberFiles: ParsedGerberFile[];
    tracespaceFiles: TracespaceParsedFile[];
    info: TracespacePCBInfo;
    previewFront: string;
    previewBack: string;
}> {
    const zip = await JSZip.loadAsync(buffer);
    const files: GerberFile[] = [];
    const parsedGerberFiles: ParsedGerberFile[] = [];
    
    const fileNames = Object.keys(zip.files);

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
            // Generate parsed vector file structure using custom parser for QuoteForm canvas rendering
            const parsed = parseGerberFile(name, content, type, defaultUnits, defaultDivisor);
            parsedGerberFiles.push(parsed);
        }

        files.push({
            name,
            type,
            content
        });
    }

    // Call tracespace parser for SVG preview and metadata details
    const tracespaceResult = await tracespaceExtractAndAnalyze(buffer);

    return {
        files,
        parsedGerberFiles,
        tracespaceFiles: tracespaceResult.parsedGerberFiles,
        info: tracespaceResult.info,
        previewFront: tracespaceResult.previewFront,
        previewBack: tracespaceResult.previewBack
    };
}
