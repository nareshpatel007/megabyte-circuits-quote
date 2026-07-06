import { GerberFile } from "./types";

export const GERBER_PATTERNS = {
    copper_top: /\.(gtl|g1|top|cmp)$/i,
    copper_bottom: /\.(gbl|g2|bot|sol)$/i,
    solder_mask_top: /\.(gts|tsm|stp)$/i,
    solder_mask_bottom: /\.(gbs|bsm|sbs)$/i,
    silkscreen_top: /\.(gto|tsk|plc|sst)$/i,
    silkscreen_bottom: /\.(gbo|bsk|pls|ssb)$/i,
    drill: /\.(drl|txt|xln|tap|drd)$/i,
    outline: /\.(gml|gko|outline|dim|gbr)$/i
};

export function detectFileType(filename: string): GerberFile["type"] {
    const lower = filename.toLowerCase();
    if (GERBER_PATTERNS.copper_top.test(filename)) return "copper_top";
    if (GERBER_PATTERNS.copper_bottom.test(filename)) return "copper_bottom";
    if (GERBER_PATTERNS.solder_mask_top.test(filename)) return "solder_mask_top";
    if (GERBER_PATTERNS.solder_mask_bottom.test(filename)) return "solder_mask_bottom";
    if (GERBER_PATTERNS.silkscreen_top.test(filename)) return "silkscreen_top";
    if (GERBER_PATTERNS.silkscreen_bottom.test(filename)) return "silkscreen_bottom";
    if (GERBER_PATTERNS.drill.test(filename)) return "drill";
    if (GERBER_PATTERNS.outline.test(filename) || lower.endsWith('.gbr')) return "outline";
    return "unknown";
}
