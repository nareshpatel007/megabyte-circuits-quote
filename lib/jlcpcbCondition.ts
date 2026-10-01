/**
 * Helper to determine if a PCB item or Quote configuration requires JLCPCB API quotation.
 * 
 * Core Business Rule:
 * - FR-4 with 1 and 2 layers calculates from the LOCAL PRICING METHOD.
 * - All other options calculate from JLCPCB:
 *   1. Multilayer boards (> 2 layers: 4, 6, 8, 10, etc.)
 *   2. Non-FR-4 base materials (Flex, Rogers, PTFE Teflon, Aluminum, etc.)
 *   3. Special manufacturing features: Gold Fingers, Castellated Holes, Edge Plating, Blind Slots,
 *      large dimensions (>= 350mm), advanced via plating/covering, min hole <= 0.25mm.
 */

export interface JlcpcbConditionCheckInput {
    productType?: string;
    layers?: string | number;
    layer?: string | number;
    material?: string;
    baseMaterial?: string;
    base_material?: string;
    width?: string | number;
    height?: string | number;
    length?: string | number;
    dimensions?: string;
    thickness?: string | number;
    surfaceFinish?: string;
    surface_finish?: string;
    viaCovering?: string;
    via_covering?: string;
    viaPlating?: string;
    via_plating?: string;
    minHole?: string;
    min_hole?: string;
    goldFingers?: string | boolean | number;
    gold_fingers?: string | boolean | number;
    goldFinger?: string | boolean | number;
    castellated?: string | boolean | number;
    castellatedHoles?: string | boolean | number;
    castellated_holes?: string | boolean | number;
    edgePlating?: string | boolean | number;
    edge_plating?: string | boolean | number;
    edgeRounding?: string | boolean | number;
    blindSlots?: string | boolean | number;
    blind_slots?: string | boolean | number;
    quotation_source?: string;
    order_type?: string;
    jlcpcb_file_key?: string;
    jlcpcbFileKey?: string;
    fileKey?: string;
}

export function getMatchedJlcpcbConditions(data: JlcpcbConditionCheckInput | null | undefined): string[] {
    if (!data) return [];
    if (data.productType === "part" || data.productType === "stencil") return [];

    const matches: string[] = [];

    // Parse layer count
    const layers = parseInt(String(data.layers ?? data.layer ?? "2"), 10) || 2;

    // Base material check
    const mat = String(data.baseMaterial || data.base_material || data.material || "FR-4").trim().toLowerCase();
    const isFr4 = !mat || mat === "fr-4" || mat === "fr4" || mat === "fr_4" || mat.includes("fr-4") || mat.includes("fr4") || mat.includes("fr_4") || mat.includes("standard") || mat.includes("tg135") || mat.includes("tg140") || mat.includes("tg150") || mat.includes("tg170");

    // CORE BUSINESS RULE:
    // FR-4 for 1 and 2 layers always calculates from the LOCAL PRICING METHOD.
    // For other options (layers > 2, non-FR-4 base materials, etc.), calculate from JLCPCB.
    if (isFr4 && layers <= 2) {
        return [];
    }

    // 1. Multilayer PCB (> 2 layers: 4, 6, 8, 10...) must use JLCPCB
    if (layers > 2) {
        matches.push(`Multilayer PCB (${layers} Layers)`);
    }

    // 2. Base Material other than FR-4 must use JLCPCB
    if (!isFr4) {
        if (mat.includes("flex")) {
            matches.push("Base Material: Flex");
        } else if (mat.includes("roger")) {
            matches.push("Base Material: Rogers");
        } else if (mat.includes("ptfe") || mat.includes("teflon")) {
            matches.push("Base Material: PTFE Teflon");
        } else if (mat.includes("aluminum")) {
            matches.push("Base Material: Aluminum");
        } else {
            matches.push(`Base Material: ${data.baseMaterial || data.material}`);
        }
    }

    // 3. Special manufacturing features requiring JLCPCB:
    // Gold Fingers
    const gf = String(data.goldFingers ?? data.gold_fingers ?? data.goldFinger ?? "").trim().toLowerCase();
    if (gf === "yes" || gf === "true" || gf === "1") {
        matches.push("Gold Fingers: Yes");
    }

    // Castellated Holes
    const ch = String(data.castellated ?? data.castellatedHoles ?? data.castellated_holes ?? "").trim().toLowerCase();
    if (ch === "yes" || ch === "true" || ch === "1") {
        matches.push("Castellated Holes: Yes");
    }

    // Edge Plating
    const ep = String(data.edgePlating ?? data.edge_plating ?? data.edgeRounding ?? "").trim().toLowerCase();
    if (ep === "yes" || ep === "true" || ep === "1") {
        matches.push("Edge Plating: Yes");
    }

    // Blind Slots
    const bs = String(data.blindSlots ?? data.blind_slots ?? "").trim().toLowerCase();
    if (bs === "yes" || bs === "true" || bs === "1") {
        matches.push("Blind Slots: Yes");
    }

    // Dimensions: 350 x 350 MM or above (width >= 350 || height >= 350)
    let w = Number(data.width) || 0;
    let h = Number(data.height || data.length) || 0;
    if (data.dimensions) {
        const dimMatch = String(data.dimensions).match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i);
        if (dimMatch) {
            const dimW = parseFloat(dimMatch[1]);
            const dimH = parseFloat(dimMatch[2]);
            if (!w) w = dimW;
            if (!h) h = dimH;
            if (dimW >= 350 || dimH >= 350) {
                w = Math.max(w, dimW);
                h = Math.max(h, dimH);
            }
        }
    }
    if (w >= 350 || h >= 350) {
        matches.push(`Dimensions: ${w || "?"}x${h || "?"}mm (≥350mm)`);
    }

    // Via Plating Method: Conductive Adhesive, Horizontal Electroless Copper Plating
    const vp = String(data.viaPlating || data.via_plating || "").trim().toLowerCase();
    if (vp.includes("conductive") && vp.includes("adhesive")) {
        matches.push("Via Plating: Conductive Adhesive");
    } else if (vp.includes("horizontal") || vp.includes("electroless")) {
        matches.push("Via Plating: Horizontal Electroless Copper");
    }

    // Via Covering: Plugged, Epoxy Filled&Capped, Copper Paste Filled&Capped
    const vc = String(data.viaCovering || data.via_covering || "").trim().toLowerCase();
    if (vc.includes("copper") && (vc.includes("paste") || vc.includes("fill"))) {
        matches.push("Via Covering: Copper Paste Filled&Capped");
    } else if (vc.includes("epoxy")) {
        matches.push("Via Covering: Epoxy Filled&Capped");
    } else if (vc.includes("plugged")) {
        matches.push("Via Covering: Plugged");
    }

    // Min via hole size <= 0.25mm
    const mh = String(data.minHole || data.min_hole || "").trim().toLowerCase();
    if (mh.includes("0.15")) {
        matches.push("Min Hole: 0.15mm/(0.25/0.3mm)");
    } else if (mh.includes("0.25")) {
        matches.push("Min Hole: 0.25mm/(0.35/0.4mm)");
    } else if (mh.includes("0.2mm") || mh.startsWith("0.2/") || (mh.includes("0.2") && !mh.includes("0.25"))) {
        matches.push("Min Hole: 0.2mm/(0.3/0.35mm)");
    }

    return matches;
}

export function isJlcpcbRequired(data: JlcpcbConditionCheckInput | null | undefined): boolean {
    if (!data) return false;
    if (data.productType === "part" || data.productType === "stencil") return false;
    return getMatchedJlcpcbConditions(data).length > 0;
}
