/**
 * ManufacturingProviderResolver (Frontend)
 *
 * Centralized business logic for determining whether a PCB configuration qualifies for
 * IN-HOUSE manufacturing or must be routed to external JLCPCB manufacturing.
 *
 * Mandatory Business Rules:
 * Rule 1: Base Material: FR-4 only
 * Rule 2: Material Type: FR4 TG135 only (KB6164, Nan Ya, S1141, S1000H, etc. force JLCPCB)
 * Rule 3: Layers: 1 or 2 layers only (4, 6, 8, 10, 12, 14, 16 force JLCPCB)
 * Rule 4: Surface Finish: HASL (Leaded) only (LeadFree HASL, ENIG, OSP force JLCPCB)
 * Rule 5: PCB Thickness: Except 0.6 mm (0.8, 1.0, 1.2, 1.6, 2.0 mm qualify)
 * Rule 6: PCB Color: All supported colors qualify (Green, Red, Yellow, Blue, White, Black, Purple)
 * Rule 7: Outer Copper Weight: All supported weights qualify (1 oz, 2 oz)
 * Rule 8: Minimum Via Hole: >= 0.30 mm (< 0.30 mm e.g. 0.25, 0.20, 0.15 force JLCPCB)
 * Rule 9: Gold Fingers: No (Yes forces JLCPCB)
 * Rule 10: Castellated Holes: No (Yes forces JLCPCB)
 * Rule 11: Edge Plating: No (Yes forces JLCPCB)
 * Rule 12: Blind Slots: No (Yes forces JLCPCB)
 * Rule 13: Via Covering: Tented, Untented, Not Specified qualify;
 *         Plugged, Epoxy Filled & Capped, Copper Paste Filled & Capped force JLCPCB
 * Rule 14: Via Plating: Not Specified qualifies;
 *         Conductive Adhesive, Horizontal Electroless Copper Plating force JLCPCB
 */

export interface JlcpcbConditionCheckInput {
    productType?: string;
    product_type?: string;
    layers?: string | number;
    layer?: string | number;
    layerCount?: string | number;
    layer_count?: string | number;
    material?: string;
    baseMaterial?: string;
    base_material?: string;
    materialType?: string;
    material_type?: string;
    width?: string | number;
    height?: string | number;
    length?: string | number;
    dimensions?: string;
    thickness?: string | number;
    board_thickness?: string | number;
    surfaceFinish?: string;
    surface_finish?: string;
    pcbColor?: string;
    pcb_color?: string;
    copperWeight?: string;
    copper_weight?: string;
    viaCovering?: string;
    via_covering?: string;
    viaPlating?: string;
    via_plating?: string;
    viaPlatingMethod?: string;
    minHole?: string;
    min_hole?: string;
    minimum_via_hole?: string;
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

export type ManufacturingProvider = "IN_HOUSE" | "JLCPCB";

export interface ProviderResolutionResult {
    provider: ManufacturingProvider;
    isEligible: boolean;
    reasons: string[];
    quotationSource: "internal" | "jlcpcb";
    orderType: "normal" | "jlcpcb";
    series: "M" | "JL";
}

function parseBooleanOption(val: unknown): boolean {
    if (val === null || val === undefined) return false;
    if (typeof val === "boolean") return val;
    const str = String(val).trim().toLowerCase();
    return str === "yes" || str === "true" || str === "1" || str === "on";
}

export function resolveManufacturingProvider(data: JlcpcbConditionCheckInput | null | undefined): ProviderResolutionResult {
    if (!data) {
        return {
            provider: "IN_HOUSE",
            isEligible: true,
            reasons: [],
            quotationSource: "internal",
            orderType: "normal",
            series: "M"
        };
    }

    const pType = String(data.productType || data.product_type || "pcb").toLowerCase();
    if (pType === "part" || pType === "stencil") {
        return {
            provider: "IN_HOUSE",
            isEligible: true,
            reasons: [],
            quotationSource: "internal",
            orderType: "normal",
            series: "M"
        };
    }

    const reasons: string[] = [];

    // 1. Base Material: Must be FR-4
    const rawMat = String(data.baseMaterial || data.base_material || data.material || "FR-4").trim();
    const matNorm = rawMat.toLowerCase().replace(/[\s\-_]/g, "");
    const isFr4 = !matNorm || matNorm === "fr4" || matNorm.startsWith("fr4");
    if (!isFr4) {
        reasons.push(`Base Material: '${rawMat}' requires JLCPCB (In-House supports FR-4 only).`);
    }

    // 2. Material Type: Only FR4 TG135 qualifies
    const rawMt = String(data.materialType || data.material_type || (isFr4 ? "FR4 TG135" : "")).trim();
    const mtNorm = rawMt.toLowerCase().replace(/[\s\-_]/g, "");
    const isFr4Tg135 = !mtNorm || mtNorm === "fr4tg135" || mtNorm === "tg135";
    if (!isFr4Tg135) {
        reasons.push(`Material Type: '${rawMt}' requires JLCPCB (In-House supports FR4 TG135 only).`);
    }

    // 3. Layer Count: Only 1 and 2 layers qualify
    const rawLayers = String(data.layers ?? data.layer ?? data.layerCount ?? data.layer_count ?? "2");
    const layers = parseInt(rawLayers.replace(/\D/g, ""), 10) || 2;
    if (layers !== 1 && layers !== 2) {
        reasons.push(`Layer Count: ${layers} Layers (In-House supports 1L & 2L only)`);
    }

    // 4. Surface Finish: Only HASL (Leaded) qualifies
    const rawSf = String(data.surfaceFinish || data.surface_finish || "HASL(Leaded)").trim();
    const sfLower = rawSf.toLowerCase();
    const isLeadFreeOrEnigOrOsp = sfLower.includes("free") ||
        sfLower.includes("enig") ||
        sfLower.includes("osp") ||
        sfLower.includes("gold") ||
        sfLower.includes("immersion") ||
        sfLower.includes("rohs");
    const isLeadedHasl = !isLeadFreeOrEnigOrOsp && (
        !sfLower ||
        sfLower.includes("hasl") ||
        sfLower.includes("leaded") ||
        sfLower.includes("with lead")
    );
    if (!isLeadedHasl) {
        reasons.push(`Surface Finish: '${rawSf}' requires JLCPCB (In-House supports HASL Leaded only).`);
    }

    // 5. PCB Thickness: Any supported thickness except 0.6 mm
    const rawThicknessStr = String(data.thickness ?? data.board_thickness ?? "1.6").replace(/[^0-9.]/g, "");
    const thickness = parseFloat(rawThicknessStr);
    if (!isNaN(thickness) && Math.abs(thickness - 0.6) < 0.05) {
        reasons.push("PCB Thickness: 0.6mm requires JLCPCB.");
    }

    // 6. PCB Color: All supported colors qualify, does not force JLCPCB.
    // 7. Outer Copper Weight: All supported weights qualify (1 oz, 2 oz), does not force JLCPCB.

    // 8. Minimum Via Hole: >= 0.30 mm
    const rawMinHole = String(data.minHole || data.min_hole || data.minimum_via_hole || "0.3mm").trim();
    const matchHole = rawMinHole.match(/(\d+(?:\.\d+)?)/);
    if (matchHole) {
        const holeVal = parseFloat(matchHole[1]);
        if (holeVal < 0.299) {
            reasons.push(`Min Via Hole: '${rawMinHole}' (${holeVal}mm < 0.30mm) requires JLCPCB.`);
        }
    }

    // 9. Gold Fingers: No
    if (parseBooleanOption(data.goldFingers ?? data.gold_fingers ?? data.goldFinger)) {
        reasons.push("Gold Fingers: Yes requires JLCPCB.");
    }

    // 10. Castellated Holes: No
    if (parseBooleanOption(data.castellated ?? data.castellatedHoles ?? data.castellated_holes)) {
        reasons.push("Castellated Holes: Yes requires JLCPCB.");
    }

    // 11. Edge Plating: No
    if (parseBooleanOption(data.edgePlating ?? data.edge_plating ?? data.edgeRounding)) {
        reasons.push("Edge Plating: Yes requires JLCPCB.");
    }

    // 12. Blind Slots: No
    if (parseBooleanOption(data.blindSlots ?? data.blind_slots)) {
        reasons.push("Blind Slots: Yes requires JLCPCB.");
    }

    // 13. Via Covering: Plugged, Epoxy Filled & Capped, Copper Paste Filled & Capped force JLCPCB
    const rawVc = String(data.viaCovering || data.via_covering || "").trim().toLowerCase();
    if (rawVc.includes("plugged")) {
        reasons.push("Via Covering: Plugged requires JLCPCB.");
    } else if (rawVc.includes("epoxy")) {
        reasons.push("Via Covering: Epoxy Filled & Capped requires JLCPCB.");
    } else if (rawVc.includes("copper") && (rawVc.includes("paste") || rawVc.includes("fill"))) {
        reasons.push("Via Covering: Copper Paste Filled & Capped requires JLCPCB.");
    }

    // 14. Via Plating Method: Conductive Adhesive, Horizontal Electroless Copper force JLCPCB
    const rawVp = String(data.viaPlating || data.via_plating || data.viaPlatingMethod || "").trim().toLowerCase();
    if (rawVp.includes("conductive") && rawVp.includes("adhesive")) {
        reasons.push("Via Plating: Conductive Adhesive requires JLCPCB.");
    } else if (rawVp.includes("horizontal") || rawVp.includes("electroless")) {
        reasons.push("Via Plating: Horizontal Electroless Copper Plating requires JLCPCB.");
    }

    const isEligible = reasons.length === 0;

    if (isEligible) {
        return {
            provider: "IN_HOUSE",
            isEligible: true,
            reasons: [],
            quotationSource: "internal",
            orderType: "normal",
            series: "M"
        };
    }

    return {
        provider: "JLCPCB",
        isEligible: false,
        reasons,
        quotationSource: "jlcpcb",
        orderType: "jlcpcb",
        series: "JL"
    };
}

export function isJlcpcbRequired(data: JlcpcbConditionCheckInput | null | undefined): boolean {
    const res = resolveManufacturingProvider(data);
    return res.provider === "JLCPCB";
}

export function isEligibleForInHouse(data: JlcpcbConditionCheckInput | null | undefined): boolean {
    const res = resolveManufacturingProvider(data);
    return res.isEligible;
}

export function getMatchedJlcpcbConditions(data: JlcpcbConditionCheckInput | null | undefined): string[] {
    const res = resolveManufacturingProvider(data);
    return res.reasons;
}
