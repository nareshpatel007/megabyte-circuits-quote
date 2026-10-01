/**
 * Helper to determine if a PCB item or Quote configuration requires JLCPCB API quotation.
 * 
 * Criteria (triggers JLCPCB):
 * - Base Material: Flex, Rogers, PTFE Teflon
 * - Dimensions: 350 x 350 MM or above (width >= 350 || height >= 350)
 * - PCB Thickness: 0.6 MM
 * - Surface Finish: LeadFree HASL, ENIG, OSP
 * - Via Covering: Plugged, Epoxy Filled&Capped, Copper Paste Filled&Capped
 * - Via Plating Method: Conductive Adhesive, Horizontal Electroless Copper Plating
 * - Min via hole size/diameter: 0.25mm/(0.35/0.4mm), 0.2mm/(0.3/0.35mm), 0.15mm/(0.25/0.3mm)
 * - Gold Fingers: Yes
 * - Castellated Holes: Yes
 * - Edge Plating: Yes
 * - Blind Slots: Yes
 * 
 * If user selected other than these options, use local pricing (which is already set up in the flow).
 * Layer count alone (e.g. 4, 6 layers) or uploading a Gerber file does NOT trigger JLCPCB.
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

    // 1. Base Material: Flex, Rogers, PTFE Teflon
    const mat = String(data.baseMaterial || data.base_material || data.material || "").trim().toLowerCase();
    if (mat.includes("flex")) {
        matches.push("Base Material: Flex");
    } else if (mat.includes("roger")) {
        matches.push("Base Material: Rogers");
    } else if (mat.includes("ptfe") || mat.includes("teflon")) {
        matches.push("Base Material: PTFE Teflon");
    }

    // 2. Dimensions: 350 x 350 MM or above (width >= 350 || height >= 350)
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

    // 3. PCB Thickness: 0.6 MM
    const rawThick = String(data.thickness || "").trim().toLowerCase();
    const parsedThick = parseFloat(rawThick.replace(/[^0-9.]/g, ""));
    if (parsedThick === 0.6 || rawThick.startsWith("0.6")) {
        matches.push("PCB Thickness: 0.6mm");
    }

    // 4. Surface Finish: LeadFree HASL, ENIG, OSP
    const sf = String(data.surfaceFinish || data.surface_finish || "").trim().toLowerCase();
    if (sf.includes("leadfree") || sf.includes("lead-free") || sf.includes("lead free")) {
        matches.push("Surface Finish: LeadFree HASL");
    } else if (sf.includes("enig")) {
        matches.push("Surface Finish: ENIG");
    } else if (sf.includes("osp")) {
        matches.push("Surface Finish: OSP");
    }

    // 5. Via Covering: Plugged, Epoxy Filled&Capped, Copper Paste Filled&Capped
    const vc = String(data.viaCovering || data.via_covering || "").trim().toLowerCase();
    if (vc.includes("copper") && (vc.includes("paste") || vc.includes("fill"))) {
        matches.push("Via Covering: Copper Paste Filled&Capped");
    } else if (vc.includes("epoxy")) {
        matches.push("Via Covering: Epoxy Filled&Capped");
    } else if (vc.includes("plugged")) {
        matches.push("Via Covering: Plugged");
    }

    // 6. Via Plating Method: Conductive Adhesive, Horizontal Electroless Copper Plating
    const vp = String(data.viaPlating || data.via_plating || "").trim().toLowerCase();
    if (vp.includes("conductive") && vp.includes("adhesive")) {
        matches.push("Via Plating: Conductive Adhesive");
    } else if (vp.includes("horizontal") || vp.includes("electroless")) {
        matches.push("Via Plating: Horizontal Electroless Copper");
    }

    // 7. Min via hole size/diameter: 0.25mm/(0.35/0.4mm), 0.2mm/(0.3/0.35mm), 0.15mm/(0.25/0.3mm)
    const mh = String(data.minHole || data.min_hole || "").trim().toLowerCase();
    if (mh.includes("0.15")) {
        matches.push("Min Hole: 0.15mm/(0.25/0.3mm)");
    } else if (mh.includes("0.25")) {
        matches.push("Min Hole: 0.25mm/(0.35/0.4mm)");
    } else if (mh.includes("0.2mm") || mh.startsWith("0.2/") || (mh.includes("0.2") && !mh.includes("0.25"))) {
        matches.push("Min Hole: 0.2mm/(0.3/0.35mm)");
    }

    // 8. Gold Fingers: Yes
    const gf = String(data.goldFingers ?? data.gold_fingers ?? data.goldFinger ?? "").trim().toLowerCase();
    if (gf === "yes" || gf === "true" || gf === "1") {
        matches.push("Gold Fingers: Yes");
    }

    // 9. Castellated Holes: Yes
    const ch = String(data.castellated ?? data.castellatedHoles ?? data.castellated_holes ?? "").trim().toLowerCase();
    if (ch === "yes" || ch === "true" || ch === "1") {
        matches.push("Castellated Holes: Yes");
    }

    // 10. Edge Plating: Yes
    const ep = String(data.edgePlating ?? data.edge_plating ?? data.edgeRounding ?? "").trim().toLowerCase();
    if (ep === "yes" || ep === "true" || ep === "1") {
        matches.push("Edge Plating: Yes");
    }

    // 11. Blind Slots: Yes
    const bs = String(data.blindSlots ?? data.blind_slots ?? "").trim().toLowerCase();
    if (bs === "yes" || bs === "true" || bs === "1") {
        matches.push("Blind Slots: Yes");
    }

    return matches;
}

export function isJlcpcbRequired(data: JlcpcbConditionCheckInput | null | undefined): boolean {
    if (!data) return false;
    if (data.productType === "part" || data.productType === "stencil") return false;
    return getMatchedJlcpcbConditions(data).length > 0;
}
