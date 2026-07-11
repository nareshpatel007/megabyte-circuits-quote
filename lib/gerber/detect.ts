import { GerberFile } from "./types";

export function detectFileType(filename: string): GerberFile["type"] {
    const lower = filename.toLowerCase();
    
    // Drill files check
    if (/\.(drl|txt|xln|tap|drd)$/i.test(filename) || lower.includes("drill")) {
        return "drill";
    }
    
    // Top Copper
    if (/\.(gtl|g1|cmp)$/i.test(filename) || lower.includes("f_cu") || lower.includes("top_copper") || (lower.includes("top") && lower.includes("cu"))) {
        return "copper_top";
    }
    
    // Bottom Copper
    if (/\.(gbl|g2|sol)$/i.test(filename) || lower.includes("b_cu") || lower.includes("bottom_copper") || (lower.includes("bot") && lower.includes("cu"))) {
        return "copper_bottom";
    }
    
    // Top Solder Mask
    if (/\.(gts|tsm|stp)$/i.test(filename) || lower.includes("f_mask") || lower.includes("top_mask") || (lower.includes("top") && lower.includes("mask"))) {
        return "solder_mask_top";
    }
    
    // Bottom Solder Mask
    if (/\.(gbs|bsm|sbs)$/i.test(filename) || lower.includes("b_mask") || lower.includes("bottom_mask") || (lower.includes("bot") && lower.includes("mask"))) {
        return "solder_mask_bottom";
    }
    
    // Top Silkscreen
    if (/\.(gto|tsk|plc|sst)$/i.test(filename) || lower.includes("f_silk") || lower.includes("top_silk") || (lower.includes("top") && (lower.includes("silk") || lower.includes("legend")))) {
        return "silkscreen_top";
    }
    
    // Bottom Silkscreen
    if (/\.(gbo|bsk|pls|ssb)$/i.test(filename) || lower.includes("b_silk") || lower.includes("bottom_silk") || (lower.includes("bot") && (lower.includes("silk") || lower.includes("legend")))) {
        return "silkscreen_bottom";
    }
    
    // Outline
    if (/\.(gml|gko|outline|dim)$/i.test(filename) || lower.includes("edge_cuts") || lower.includes("edge.cuts") || lower.includes("outline") || lower.includes("profile") || lower.includes("contour") || lower.endsWith(".gml") || lower.endsWith(".gko")) {
        return "outline";
    }

    // Default fallbacks if filename ends in .gbr
    if (lower.endsWith(".gbr")) {
        if (lower.includes("top") || lower.includes("gtl") || lower.includes("front") || lower.includes("f_")) return "copper_top";
        if (lower.includes("bot") || lower.includes("gbl") || lower.includes("back") || lower.includes("b_")) return "copper_bottom";
        if (lower.includes("gml") || lower.includes("gko") || lower.includes("cuts") || lower.includes("dim") || lower.includes("outline")) return "outline";
        return "outline";
    }
    
    return "unknown";
}
