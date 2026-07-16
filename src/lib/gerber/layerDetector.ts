import { GerberLayerType } from "./types";

export const GERBER_EXTENSIONS = {
    copper_top: /\.(gtl|cmp|top|copper_top|art01|art.*top|f_cu|topcopper|l1|top\.gbr)$/i,
    copper_bottom: /\.(gbl|sol|bot|copper_bottom|art02|art.*bot|b_cu|bottomcopper|l2|bottom\.gbr)$/i,
    solder_mask_top: /\.(gts|stc|mask_top|topmask|f_mask|smtop|gtsmask|sm.*top|topmask\.gbr)$/i,
    solder_mask_bottom: /\.(gbs|sts|mask_bottom|bottommask|b_mask|smbot|gbsmask|sm.*bot|bottommask\.gbr)$/i,
    silkscreen_top: /\.(gto|plc|ssk|silk_top|topsilk|f_silk|gtolegend|ss.*top|topsilk\.gbr)$/i,
    silkscreen_bottom: /\.(gbo|pls|silk_bottom|bottomsilk|b_silk|gbolegend|ss.*bot|bottomsilk\.gbr)$/i,
    outline: /\.(gko|gm1|gml|dim|mil|out|rul|board_outline|contour|edge_cuts|edge\.cuts|outline\.gbr|gm.*outline|edge.*cuts\.gbr)$/i,
    drill: /\.(drl|txt|xln|ncdrill|drill|tap|gd1|gg1|npth|pth)$/i,
    mechanical: /\.(gm2|gm3|gm4|gm5|gm6|gm7|gm8|gm9|gm\d+|mech|mechanical|gmech)$/i,
    inner: /\.(g[1-9]|ly[2-9]|inner|in[0-9]|in[1-3][0-9]|gp[1-9]|g.*in|l[2-9]|ly\d+|g\d+|gp\d+)$/i
};

export const GERBER_SIGNATURES = [
    "%FS",
    "%MO",
    "%ADD",
    "G01",
    "G02",
    "G03",
    "D01",
    "D02",
    "D03",
    "M02"
];

export const EXCELLON_SIGNATURES = [
    "M48",
    "METRIC",
    "INCH",
    "INCH,TZ",
    "INCH,LZ",
    "T01",
    "T1"
];

export function isGerberOrDrill(content: string): boolean {
    const head = content.slice(0, 4000);
    return GERBER_SIGNATURES.some(sig => head.includes(sig)) || 
           EXCELLON_SIGNATURES.some(sig => head.includes(sig));
}

export function detectFileType(filename: string, content: string): GerberLayerType {
    const lower = filename.toLowerCase();
    
    const ignoreKeywords = [
        "assembly", "fab", "mech", "dimension", "drawing", "notes", 
        "rat", "keepout", "courtyard", "user", "comment", "construction"
    ];
    if (ignoreKeywords.some(kw => lower.includes(kw))) {
        return "unknown";
    }

    const cleanContent = content.replace(/\r/g, "");

    // 1. Detect Drill (Excellon) files
    const isDrill = cleanContent.includes("M48") || 
                    cleanContent.includes("METRIC") || 
                    cleanContent.includes("INCH,TZ") || 
                    cleanContent.includes("INCH,LZ") || 
                    (cleanContent.includes("T1") && cleanContent.includes("C") && !cleanContent.includes("%ADD")) ||
                    lower.includes("drill") ||
                    lower.includes("drl") ||
                    lower.endsWith(".xln") ||
                    lower.endsWith(".txt");
    if (isDrill) return "drill";

    // 2. Count Gerber-specific commands
    const lines = cleanContent.split("*");
    let hasGerberHeader = false;
    let drawCount = 0;
    let flashCount = 0;
    let regionCount = 0;

    for (let i = 0; i < Math.min(lines.length, 5000); i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith("%FS") || line.startsWith("%MO") || line.startsWith("%AD")) {
            hasGerberHeader = true;
        }
        if (line.includes("D01") || line.endsWith("D1")) {
            drawCount++;
        }
        if (line.includes("D03") || line.endsWith("D3")) {
            flashCount++;
        }
        if (line.includes("G36") || line.includes("G37")) {
            regionCount++;
        }
    }

    if (!hasGerberHeader && drawCount === 0 && flashCount === 0) {
        // Fallback check on extensions
        return detectFileTypeByExtension(filename);
    }

    // 3. Geometry & File name analysis to classify layers
    const isOutlineName = lower.includes("outline") || lower.includes("gko") || lower.includes("gml") || lower.includes("edge_cuts") || lower.includes("edge.cuts") || lower.includes("dim") || lower.includes("border");
    const isSilkName = lower.includes("silk") || lower.includes("legend") || lower.includes("gto") || lower.includes("gbo") || lower.includes("sst") || lower.includes("ssb") || lower.includes("pos");
    const isMaskName = lower.includes("mask") || lower.includes("solder") || lower.includes("gts") || lower.includes("gbs") || lower.includes("smtop") || lower.includes("smbot");
    const isCopperName = lower.includes("copper") || lower.includes("copper_") || lower.includes("gtl") || lower.includes("gbl") || lower.includes("art") || lower.includes("l1") || lower.includes("l2") || lower.includes("cu");

    // Outline Layer
    if (isOutlineName || (drawCount > 2 && drawCount < 150 && flashCount === 0 && regionCount === 0)) {
        return "outline";
    }

    // Solder Mask Layer
    if (isMaskName || (flashCount > 0 && drawCount < 50 && regionCount < 100)) {
        return (lower.includes("bot") || lower.includes("back") || lower.includes("b_") || lower.includes("gbs")) 
            ? "solder_mask_bottom" 
            : "solder_mask_top";
    }

    // Silkscreen Layer
    if (isSilkName || (drawCount > 50 && flashCount === 0)) {
        return (lower.includes("bot") || lower.includes("back") || lower.includes("b_") || lower.includes("gbo")) 
            ? "silkscreen_bottom" 
            : "silkscreen_top";
    }

    // Copper Layers (Top, Bottom, or Inner)
    if (isCopperName || (drawCount > 10 || flashCount > 5)) {
        const isInner = lower.includes("in") || lower.includes("gp") || lower.match(/\.g[1-9]/i) || lower.match(/\.ly[2-9]/i);
        if (isInner) {
            return "inner";
        }
        return (lower.includes("bot") || lower.includes("back") || lower.includes("b_") || lower.includes("gbl") || lower.includes("sol")) 
            ? "copper_bottom" 
            : "copper_top";
    }

    return detectFileTypeByExtension(filename);
}

function detectFileTypeByExtension(filename: string): GerberLayerType {
    const lower = filename.toLowerCase();
    
    if (GERBER_EXTENSIONS.copper_top.test(lower)) return "copper_top";
    if (GERBER_EXTENSIONS.copper_bottom.test(lower)) return "copper_bottom";
    if (GERBER_EXTENSIONS.solder_mask_top.test(lower)) return "solder_mask_top";
    if (GERBER_EXTENSIONS.solder_mask_bottom.test(lower)) return "solder_mask_bottom";
    if (GERBER_EXTENSIONS.silkscreen_top.test(lower)) return "silkscreen_top";
    if (GERBER_EXTENSIONS.silkscreen_bottom.test(lower)) return "silkscreen_bottom";
    if (GERBER_EXTENSIONS.outline.test(lower)) return "outline";
    if (GERBER_EXTENSIONS.drill.test(lower)) return "drill";
    if (GERBER_EXTENSIONS.mechanical.test(lower)) return "mechanical";
    if (GERBER_EXTENSIONS.inner.test(lower)) return "inner";

    return "unknown";
}
