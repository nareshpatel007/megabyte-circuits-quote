/**
 * ManufacturingProviderResolver (Frontend)
 *
 * Centralized business logic for determining whether a PCB configuration qualifies for
 * IN-HOUSE manufacturing or must be routed to external JLCPCB manufacturing.
 *
 * This resolver supports:
 * 1. Dynamic database-driven rules (fetched from /api/provider-rules/active and configurable from Admin)
 * 2. High-speed local evaluation against loaded/cached rules
 * 3. Fallback to canonical built-in rules (100% equivalent to seeded DB rules)
 */

export interface DynamicProviderRuleCondition {
    id?: number;
    rule_id?: number;
    field: string;
    operator: string;
    value: any;
    sort_order?: number;
}

export interface DynamicProviderRule {
    id: number;
    name: string;
    slug?: string;
    provider: "IN_HOUSE" | "JLCPCB";
    priority: number;
    match_type: "all" | "any";
    description?: string;
    is_active: boolean | number;
    conditions: DynamicProviderRuleCondition[];
}

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
    rule_id?: number | null;
    rule_name?: string | null;
}

let cachedDynamicRules: DynamicProviderRule[] | null = null;
let rulesFetchPromise: Promise<DynamicProviderRule[]> | null = null;

export function setActiveProviderRules(rules: DynamicProviderRule[]): void {
    cachedDynamicRules = Array.isArray(rules) ? rules : [];
}

export function getActiveProviderRules(): DynamicProviderRule[] | null {
    return cachedDynamicRules;
}

export async function fetchActiveProviderRules(): Promise<DynamicProviderRule[]> {
    if (cachedDynamicRules) {
        return cachedDynamicRules;
    }
    if (rulesFetchPromise) {
        return rulesFetchPromise;
    }

    rulesFetchPromise = (async () => {
        try {
            const res = await fetch("/api/provider-rules/active", {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                const json = await res.json();
                if (json.success && Array.isArray(json.rules)) {
                    cachedDynamicRules = json.rules;
                    return json.rules;
                }
            }
        } catch {
            // Silently fall back to built-in rules if fetch fails
        } finally {
            rulesFetchPromise = null;
        }
        return [];
    })();

    return rulesFetchPromise;
}

function parseBooleanOption(val: unknown): boolean {
    if (val === null || val === undefined) return false;
    if (typeof val === "boolean") return val;
    const str = String(val).trim().toLowerCase();
    return str === "yes" || str === "true" || str === "1" || str === "on";
}

function extractFieldValue(data: JlcpcbConditionCheckInput, field: string): any {
    switch (field.toLowerCase()) {
        case "base_material":
        case "basematerial":
        case "material":
            return data.baseMaterial ?? data.base_material ?? data.material ?? "FR-4";

        case "material_type":
        case "materialtype":
            return data.materialType ?? data.material_type ?? "";

        case "layers":
        case "layer":
        case "layer_count":
        case "layercount": {
            const raw = String(data.layers ?? data.layer ?? data.layerCount ?? data.layer_count ?? "2");
            const parsed = parseInt(raw.replace(/\D/g, ""), 10);
            return isNaN(parsed) ? 2 : parsed;
        }

        case "surface_finish":
        case "surfacefinish":
            return data.surfaceFinish ?? data.surface_finish ?? "HASL(Leaded)";

        case "thickness":
        case "board_thickness": {
            const raw = String(data.thickness ?? data.board_thickness ?? "1.6").replace(/[^0-9.]/g, "");
            const parsed = parseFloat(raw);
            return isNaN(parsed) ? 1.6 : parsed;
        }

        case "pcb_color":
        case "pcbcolor":
            return data.pcbColor ?? data.pcb_color ?? "Green";

        case "copper_weight":
        case "copperweight":
            return data.copperWeight ?? data.copper_weight ?? "1 oz";

        case "min_via_hole":
        case "minhole":
        case "min_hole":
        case "minimum_via_hole": {
            const raw = String(data.minHole ?? data.min_hole ?? data.minimum_via_hole ?? "0.3mm");
            const match = raw.match(/(\d+(?:\.\d+)?)/);
            return match ? parseFloat(match[1]) : 0.3;
        }

        case "gold_fingers":
        case "goldfingers":
        case "goldfinger":
            return parseBooleanOption(data.goldFingers ?? data.gold_fingers ?? data.goldFinger);

        case "castellated_holes":
        case "castellated":
        case "castellatedholes":
            return parseBooleanOption(data.castellated ?? data.castellatedHoles ?? data.castellated_holes);

        case "edge_plating":
        case "edgeplating":
        case "edgerounding":
            return parseBooleanOption(data.edgePlating ?? data.edge_plating ?? data.edgeRounding);

        case "blind_slots":
        case "blindslots":
            return parseBooleanOption(data.blindSlots ?? data.blind_slots);

        case "via_covering":
        case "viacovering":
            return data.viaCovering ?? data.via_covering ?? "";

        case "via_plating":
        case "viaplating":
        case "via_plating_method":
        case "viaplatingmethod":
            return data.viaPlating ?? data.via_plating ?? data.viaPlatingMethod ?? "";

        default:
            return (data as any)[field] ?? null;
    }
}

function normalizeForComparison(val: any): string {
    if (val === null || val === undefined) return "";
    if (typeof val === "boolean") return val ? "true" : "false";
    return String(val).trim().toLowerCase().replace(/[\s\-_()]/g, "");
}

function evaluateSingleCondition(actualVal: any, operator: string, ruleVal: any): boolean {
    const op = operator.toLowerCase();

    // In or Not In operator
    if (op === "in" || op === "not_in") {
        let expectedArray: any[] = [];
        if (Array.isArray(ruleVal)) {
            expectedArray = ruleVal;
        } else if (typeof ruleVal === "string") {
            try {
                const parsed = JSON.parse(ruleVal);
                expectedArray = Array.isArray(parsed) ? parsed : [ruleVal];
            } catch {
                expectedArray = ruleVal.split(",").map((s) => s.trim());
            }
        } else {
            expectedArray = [ruleVal];
        }

        const normalizedActual = normalizeForComparison(actualVal);
        const matches = expectedArray.some((item) => normalizeForComparison(item) === normalizedActual);
        return op === "in" ? matches : !matches;
    }

    // Numeric comparisons
    if (op === ">=" || op === "<=" || op === ">" || op === "<") {
        const numActual = typeof actualVal === "number" ? actualVal : parseFloat(String(actualVal).replace(/[^0-9.]/g, ""));
        const numRule = typeof ruleVal === "number" ? ruleVal : parseFloat(String(ruleVal).replace(/[^0-9.]/g, ""));

        if (isNaN(numActual) || isNaN(numRule)) return false;

        switch (op) {
            case ">=":
                return numActual >= numRule - 0.0001;
            case "<=":
                return numActual <= numRule + 0.0001;
            case ">":
                return numActual > numRule + 0.0001;
            case "<":
                return numActual < numRule - 0.0001;
        }
    }

    // Equality or Inequality
    if (op === "equals" || op === "==" || op === "not_equals" || op === "!=") {
        let matches = false;
        if (typeof actualVal === "boolean" || typeof ruleVal === "boolean") {
            matches = parseBooleanOption(actualVal) === parseBooleanOption(ruleVal);
        } else if (typeof actualVal === "number" || typeof ruleVal === "number") {
            const nA = typeof actualVal === "number" ? actualVal : parseFloat(String(actualVal));
            const nR = typeof ruleVal === "number" ? ruleVal : parseFloat(String(ruleVal));
            matches = !isNaN(nA) && !isNaN(nR) ? Math.abs(nA - nR) < 0.001 : false;
        } else {
            matches = normalizeForComparison(actualVal) === normalizeForComparison(ruleVal);
        }

        return op === "equals" || op === "==" ? matches : !matches;
    }

    return false;
}

export function resolveManufacturingProvider(
    data: JlcpcbConditionCheckInput | null | undefined,
    rulesOverride?: DynamicProviderRule[] | null
): ProviderResolutionResult {
    if (!data) {
        return {
            provider: "IN_HOUSE",
            isEligible: true,
            reasons: [],
            quotationSource: "internal",
            orderType: "normal",
            series: "M",
            rule_name: "Default In-House",
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
            series: "M",
            rule_name: "Parts / Stencils",
        };
    }

    const activeRules = rulesOverride !== undefined ? rulesOverride : cachedDynamicRules;

    // If dynamic rules exist, evaluate them by priority
    if (activeRules && activeRules.length > 0) {
        const sortedRules = [...activeRules].sort((a, b) => a.priority - b.priority);

        for (const rule of sortedRules) {
            if (!rule.is_active) continue;

            const isAll = (rule.match_type || "all").toLowerCase() === "all";
            let matched = isAll;
            const failedReasons: string[] = [];

            for (const condition of rule.conditions || []) {
                const actual = extractFieldValue(data, condition.field);
                const conditionPassed = evaluateSingleCondition(actual, condition.operator, condition.value);

                if (isAll) {
                    if (!conditionPassed) {
                        matched = false;
                        failedReasons.push(`${condition.field} (${actual}) did not satisfy ${condition.operator} ${JSON.stringify(condition.value)}`);
                    }
                } else {
                    if (conditionPassed) {
                        matched = true;
                        break;
                    }
                }
            }

            if (matched) {
                const provider = rule.provider.toUpperCase() === "IN_HOUSE" ? "IN_HOUSE" : "JLCPCB";
                const isEligible = provider === "IN_HOUSE";
                return {
                    provider,
                    isEligible,
                    reasons: isEligible ? [] : failedReasons,
                    quotationSource: isEligible ? "internal" : "jlcpcb",
                    orderType: isEligible ? "normal" : "jlcpcb",
                    series: isEligible ? "M" : "JL",
                    rule_id: rule.id,
                    rule_name: rule.name,
                };
            }
        }

        // If no rule matched, default fallback is JLCPCB
        return {
            provider: "JLCPCB",
            isEligible: false,
            reasons: ["No active In-House rule matched configuration. Defaulting to JLCPCB."],
            quotationSource: "jlcpcb",
            orderType: "jlcpcb",
            series: "JL",
            rule_name: "Fallback JLCPCB",
        };
    }

    // CANONICAL FALLBACK (Identical to seeded default DB rule)
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

    // 6. Minimum Via Hole: >= 0.30 mm
    const rawMinHole = String(data.minHole || data.min_hole || data.minimum_via_hole || "0.3mm").trim();
    const matchHole = rawMinHole.match(/(\d+(?:\.\d+)?)/);
    if (matchHole) {
        const holeVal = parseFloat(matchHole[1]);
        if (holeVal < 0.299) {
            reasons.push(`Min Via Hole: '${rawMinHole}' (${holeVal}mm < 0.30mm) requires JLCPCB.`);
        }
    }

    // 7. Gold Fingers: No
    if (parseBooleanOption(data.goldFingers ?? data.gold_fingers ?? data.goldFinger)) {
        reasons.push("Gold Fingers: Yes requires JLCPCB.");
    }

    // 8. Castellated Holes: No
    if (parseBooleanOption(data.castellated ?? data.castellatedHoles ?? data.castellated_holes)) {
        reasons.push("Castellated Holes: Yes requires JLCPCB.");
    }

    // 9. Edge Plating: No
    if (parseBooleanOption(data.edgePlating ?? data.edge_plating ?? data.edgeRounding)) {
        reasons.push("Edge Plating: Yes requires JLCPCB.");
    }

    // 10. Blind Slots: No
    if (parseBooleanOption(data.blindSlots ?? data.blind_slots)) {
        reasons.push("Blind Slots: Yes requires JLCPCB.");
    }

    // 11. Via Covering: Only Tented, Untented, and Not Specified qualify for In-House
    const rawVc = String(data.viaCovering || data.via_covering || "").trim().toLowerCase();
    if (rawVc && rawVc !== "not specified" && rawVc !== "tented" && rawVc !== "untented") {
        if (rawVc.includes("plugged")) {
            reasons.push("Via Covering: Plugged requires JLCPCB.");
        } else if (rawVc.includes("epoxy")) {
            reasons.push("Via Covering: Epoxy Filled & Capped requires JLCPCB.");
        } else if (rawVc.includes("copper") || (rawVc.includes("paste") && rawVc.includes("fill"))) {
            reasons.push("Via Covering: Copper Paste Filled & Capped requires JLCPCB.");
        } else {
            reasons.push(`Via Covering: ${data.viaCovering || data.via_covering} requires JLCPCB.`);
        }
    }

    // 12. Via Plating Method: Only Not Specified qualifies for In-House
    const rawVp = String(data.viaPlating || data.via_plating || data.viaPlatingMethod || "").trim().toLowerCase();
    if (rawVp && rawVp !== "not specified") {
        if (rawVp.includes("conductive") && rawVp.includes("adhesive")) {
            reasons.push("Via Plating: Conductive Adhesive requires JLCPCB.");
        } else if (rawVp.includes("horizontal") || rawVp.includes("electroless")) {
            reasons.push("Via Plating: Horizontal Electroless Copper Plating requires JLCPCB.");
        } else {
            reasons.push(`Via Plating: ${data.viaPlating || data.via_plating || data.viaPlatingMethod} requires JLCPCB.`);
        }
    }


    const isEligible = reasons.length === 0;

    if (isEligible) {
        return {
            provider: "IN_HOUSE",
            isEligible: true,
            reasons: [],
            quotationSource: "internal",
            orderType: "normal",
            series: "M",
            rule_name: "In-House Standard 1-2 Layer (Built-in)",
        };
    }

    return {
        provider: "JLCPCB",
        isEligible: false,
        reasons,
        quotationSource: "jlcpcb",
        orderType: "jlcpcb",
        series: "JL",
        rule_name: "JLCPCB (Fallback)",
    };
}

export function isJlcpcbRequired(data: JlcpcbConditionCheckInput | null | undefined, rulesOverride?: DynamicProviderRule[] | null): boolean {
    const res = resolveManufacturingProvider(data, rulesOverride);
    return res.provider === "JLCPCB";
}

export function isEligibleForInHouse(data: JlcpcbConditionCheckInput | null | undefined, rulesOverride?: DynamicProviderRule[] | null): boolean {
    const res = resolveManufacturingProvider(data, rulesOverride);
    return res.isEligible;
}

export function getMatchedJlcpcbConditions(data: JlcpcbConditionCheckInput | null | undefined, rulesOverride?: DynamicProviderRule[] | null): string[] {
    const res = resolveManufacturingProvider(data, rulesOverride);
    return res.reasons;
}
