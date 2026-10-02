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

    // 1. Layer Count check (Only 1 Layer and 2 Layers are eligible for in-house)
    const layers = parseInt(String(data.layers ?? data.layer ?? "2"), 10) || 2;
    if (layers !== 1 && layers !== 2) {
        matches.push(`Layer Count: ${layers} Layers (In-House supports 1L & 2L only)`);
    }

    // 2. Base Material check (Only FR-4 is eligible for in-house)
    const mat = String(data.baseMaterial || data.base_material || data.material || "FR-4").trim().toLowerCase();
    const isFr4 = !mat || mat === "fr-4" || mat === "fr4" || mat === "fr_4" || mat.includes("fr-4") || mat.includes("fr4") || mat.includes("fr_4") || mat.includes("standard") || mat.includes("tg135") || mat.includes("tg140") || mat.includes("tg150") || mat.includes("tg170");

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

    // 3. Surface Finish check (Only Leaded HASL is eligible for in-house)
    const sf = String(data.surfaceFinish || data.surface_finish || "").trim().toLowerCase();
    const isLeadFreeOrEnigOrOsp = sf.includes("free") || sf.includes("enig") || sf.includes("osp") || sf.includes("gold") || sf.includes("immersion") || sf.includes("rohs");
    const isLeadedHasl = !isLeadFreeOrEnigOrOsp && (!sf || sf.includes("hasl") || sf.includes("leaded") || sf.includes("with lead"));

    if (!isLeadedHasl) {
        matches.push(`Surface Finish: ${data.surfaceFinish || data.surface_finish || "Non-Leaded HASL"}`);
    }

    // 4. PCB Thickness check (0.6mm requires JLCPCB)
    const rawThicknessStr = String(data.thickness ?? "1.6").replace(/[^0-9.]/g, "");
    const thickness = parseFloat(rawThicknessStr);
    if (!isNaN(thickness) && Math.abs(thickness - 0.6) < 0.05) {
        matches.push("PCB Thickness: 0.6mm");
    }

    // 5. Min via hole size (< 0.30mm requires JLCPCB)
    const mhStr = String(data.minHole || data.min_hole || "").trim().toLowerCase();
    let minHoleVal: number | null = null;
    if (mhStr) {
        const match = mhStr.match(/(\d+(?:\.\d+)?)/);
        if (match) {
            minHoleVal = parseFloat(match[1]);
        }
    } else {
        // UI default is 0.3mm
        minHoleVal = 0.3;
    }

    if (minHoleVal === null || minHoleVal < 0.299) {
        matches.push(`Min Hole: ${mhStr || (minHoleVal !== null ? `${minHoleVal}mm` : "Unknown")}`);
    }

    // 6. Special manufacturing features:
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

    // Via Plating Method
    const vp = String(data.viaPlating || data.via_plating || "").trim().toLowerCase();
    if (vp.includes("conductive") && vp.includes("adhesive")) {
        matches.push("Via Plating: Conductive Adhesive");
    } else if (vp.includes("horizontal") || vp.includes("electroless")) {
        matches.push("Via Plating: Horizontal Electroless Copper");
    }

    // Via Covering
    const vc = String(data.viaCovering || data.via_covering || "").trim().toLowerCase();
    if (vc.includes("copper") && (vc.includes("paste") || vc.includes("fill"))) {
        matches.push("Via Covering: Copper Paste Filled&Capped");
    } else if (vc.includes("epoxy")) {
        matches.push("Via Covering: Epoxy Filled&Capped");
    } else if (vc.includes("plugged")) {
        matches.push("Via Covering: Plugged");
    }

    return matches;
}

export function isJlcpcbRequired(data: JlcpcbConditionCheckInput | null | undefined): boolean {
    if (!data) return false;
    if (data.productType === "part" || data.productType === "stencil") return false;
    return getMatchedJlcpcbConditions(data).length > 0;
}
