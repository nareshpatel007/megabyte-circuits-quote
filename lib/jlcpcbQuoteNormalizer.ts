export interface PcbChargeItem {
    code: string;
    label: string;
    amount: number;
}

export interface BuildTimeOption {
    name: string;
    price: number;
    checked?: boolean;
    hours?: number;
}

export interface ShippingOptionItem {
    code: string;
    name: string;
    price: number;
    deliveryDays: string;
}

export interface NormalizedJlcpcbQuote {
    pcbCharges: PcbChargeItem[];
    basePcbPrice: number;
    buildTimeOptions: BuildTimeOption[];
    shippingOptions: ShippingOptionItem[];
    providerTotalFee: number;
    providerPriceWithoutFreight: number;
    weight: number | null;
    chargeWeight: number | null;
}

export interface NormalizerOptions {
    surfaceFinish?: string | number;
    isHaslWithLead?: boolean;
    confirmProductionFileFee?: number;
}

/**
 * Normalizes raw JLCPCB quotation response into a standardized quote object.
 * Maps individual cost buckets and excludes internal provider testing buckets from customer-facing Base PCB Price.
 */
export function normalizeJlcpcbQuote(
    rawResultData: any,
    requestPayload: any = {},
    options: NormalizerOptions = {}
): NormalizedJlcpcbQuote {
    // If backend already attached normalized_quote, return it directly or normalize from data
    if (rawResultData?.normalized_quote && typeof rawResultData.normalized_quote === "object") {
        return rawResultData.normalized_quote as NormalizedJlcpcbQuote;
    }

    const data = rawResultData?.data && typeof rawResultData.data === "object"
        ? rawResultData.data
        : (rawResultData || {});

    const cost = data.pcbCostInfo && typeof data.pcbCostInfo === "object"
        ? data.pcbCostInfo
        : {};

    // 1. Engineering Fee (projectFee)
    const projectFee = round2(parseFloat(cost.projectFee ?? 0) || 0);

    // 2. Via Covering (viaCoveringMoney)
    const viaCoveringMoney = round2(parseFloat(cost.viaCoveringMoney ?? 0) || 0);

    // 3. Surface Finish (adornPutFee)
    // Check if request payload specifies HASL with lead (code 0 / "HASL(with lead)" / "HASL(Leaded)" / "HASL")
    const rawSf = requestPayload?.pcbParam?.surfaceFinish ?? requestPayload?.surfaceFinish ?? options?.surfaceFinish;
    let isHaslWithLead = Boolean(options?.isHaslWithLead);

    if (rawSf !== undefined && rawSf !== null) {
        if (typeof rawSf === "number" && rawSf === 0) {
            isHaslWithLead = true;
        } else if (typeof rawSf === "string") {
            const clean = rawSf.toLowerCase().trim();
            if ((clean.includes("hasl") && clean.includes("lead") && !clean.includes("free")) || clean === "hasl") {
                isHaslWithLead = true;
            }
        }
    }

    const adornPutFee = round2(parseFloat(cost.adornPutFee ?? 0) || 0);
    const surfaceFinishAmount = isHaslWithLead ? 0.00 : adornPutFee;

    // 4. Film (fillFee)
    const fillFee = round2(parseFloat(cost.fillFee ?? 0) || 0);

    // 5. Board (stencilFee in JLCPCB API represents board fabrication fee)
    const stencilFee = round2(parseFloat(cost.stencilFee ?? cost.originStencilMoney ?? 0) || 0);

    // 6. Confirm Production File Fee (from serviceConfigFeeInfo or options)
    let confirmFileFee = 0.00;
    let hasCpfConfig = false;

    const serviceConfigFeeInfo = Array.isArray(data.serviceConfigFeeInfo) ? data.serviceConfigFeeInfo : [];
    for (const service of serviceConfigFeeInfo) {
        if (service && service.serviceConfigCode === "CPF") {
            confirmFileFee = round2(parseFloat(service.serviceFee ?? 0) || 0);
            hasCpfConfig = true;
            break;
        }
    }

    if (!hasCpfConfig && options?.confirmProductionFileFee !== undefined) {
        confirmFileFee = round2(Number(options.confirmProductionFileFee) || 0);
        hasCpfConfig = true;
    }

    // Determine if Confirm Production File was requested in payload
    let isCpfRequested = false;
    const reqVos = requestPayload?.pcbParam?.serviceConfigVos;
    if (Array.isArray(reqVos)) {
        for (const vo of reqVos) {
            if (vo?.serviceConfigCode === "CPF" && String(vo?.configOptionShow).toLowerCase() === "yes") {
                isCpfRequested = true;
                break;
            }
        }
    }
    if (!isCpfRequested) {
        const reqCpf = requestPayload?.confirmFile ?? requestPayload?.confirm_file ?? requestPayload?.pcbParam?.confirmFile;
        if (reqCpf && String(reqCpf).toLowerCase().trim() === "yes") {
            isCpfRequested = true;
        }
    }

    // 7. Assemble Standard PCB Charges
    const pcbCharges: PcbChargeItem[] = [
        {
            code: "engineering_fee",
            label: "Engineering fee",
            amount: projectFee
        },
        {
            code: "via_covering",
            label: "Via Covering",
            amount: viaCoveringMoney
        },
        {
            code: "surface_finish",
            label: "Surface Finish",
            amount: surfaceFinishAmount
        },
        {
            code: "film",
            label: "Film",
            amount: fillFee
        },
        {
            code: "board",
            label: "Board",
            amount: stencilFee
        }
    ];

    // Include Confirm Production file if present in serviceConfigFeeInfo, requested, or fee > 0
    if (hasCpfConfig || isCpfRequested || confirmFileFee > 0) {
        pcbCharges.push({
            code: "confirm_production_file",
            label: "Confirm Production file",
            amount: confirmFileFee
        });
    }

    // Include any additional process fees from pcbCostInfo if > 0
    const optionalFees: { key: string; code: string; label: string }[] = [
        { key: "goldThicknessMoney", code: "gold_thickness", label: "Gold Thickness" },
        { key: "edgeGrindingMoney", code: "edge_grinding", label: "Edge Plating" },
        { key: "specialProcessMoney", code: "special_process", label: "Special Process" },
        { key: "halfHoleFee", code: "castellated_holes", label: "Castellated Holes" },
        { key: "insideCuprumThicknessFee", code: "inner_copper", label: "Inner Copper Thickness" },
        { key: "cuprumThicknessFee", code: "outer_copper", label: "Outer Copper Thickness" },
        { key: "noCodeMoney", code: "no_code", label: "Specify Order Number" }
    ];

    for (const opt of optionalFees) {
        const amt = round2(parseFloat(cost[opt.key] ?? 0) || 0);
        if (amt > 0) {
            pcbCharges.push({
                code: opt.code,
                label: opt.label,
                amount: amt
            });
        }
    }

    // Include any other active service config fees > 0
    for (const service of serviceConfigFeeInfo) {
        if (service) {
            const scCode = String(service.serviceConfigCode || "");
            const scAmt = round2(parseFloat(service.serviceFee ?? 0) || 0);
            if (scCode !== "CPF" && scCode !== "PPBP" && scAmt > 0) {
                pcbCharges.push({
                    code: scCode.toLowerCase(),
                    label: String(service.serviceConfigShow || scCode),
                    amount: scAmt
                });
            }
        }
    }

    // 8. Calculate Base PCB Price (Sum of normalized customer-facing charges)
    let basePcbPrice = round2(pcbCharges.reduce((acc, c) => acc + c.amount, 0));

    // Fallback: If basePcbPrice computed to 0, attempt fallback
    if (basePcbPrice <= 0) {
        const totalFee = round2(parseFloat(cost.totalFee ?? data.priceWithoutFreight ?? 0) || 0);
        const testsFee = round2(parseFloat(cost.testsFee ?? 0) || 0);
        if (totalFee > 0) {
            basePcbPrice = round2(Math.max(0, totalFee - testsFee));
        }
    }

    // 9. Build Time Options
    const buildTimeOptions: BuildTimeOption[] = [];
    const rawAchieveList = Array.isArray(data.achieveDateList) ? data.achieveDateList : [];
    if (rawAchieveList.length > 0) {
        for (const item of rawAchieveList) {
            if (item) {
                buildTimeOptions.push({
                    name: String(item.achieveName || (item.achieveDate ? `${item.achieveDate} hours` : "Standard")),
                    price: round2(parseFloat(item.achievePrice ?? 0) || 0),
                    checked: item.achieveChecked === "checked",
                    hours: parseInt(item.achieveDate ?? "48", 10) || 48
                });
            }
        }
    } else {
        buildTimeOptions.push(
            { name: "5-6 days", price: 0.00, checked: true, hours: 120 },
            { name: "3-4 days", price: 0.00, checked: false, hours: 72 }
        );
    }

    // 10. Shipping Options
    const shippingOptions: ShippingOptionItem[] = [];
    const rawShipList = Array.isArray(data.shipList) ? data.shipList : [];
    for (const ship of rawShipList) {
        if (ship && ship.cost !== undefined) {
            shippingOptions.push({
                code: String(ship.options || ""),
                name: String(ship.showOptions || ship.options || "Standard Shipping"),
                price: round2(parseFloat(ship.cost ?? 0) || 0),
                deliveryDays: String(ship.day || "")
            });
        }
    }

    // 11. Provider Totals & Weights
    const providerTotalFee = round2(parseFloat(cost.totalFee ?? data.priceWithoutFreight ?? 0) || 0);
    const providerPriceWithoutFreight = round2(parseFloat(data.priceWithoutFreight ?? cost.totalFee ?? 0) || 0);

    let weight: number | null = null;
    if (cost.weight !== undefined && parseFloat(cost.weight) > 0) {
        weight = parseFloat(cost.weight);
    } else if (data.weight !== undefined && parseFloat(data.weight) > 0) {
        const w = parseFloat(data.weight);
        weight = w > 10 ? round4(w / 1000) : round4(w);
    } else if (data.orderTotalWeight !== undefined && parseFloat(data.orderTotalWeight) > 0) {
        const w = parseFloat(data.orderTotalWeight);
        weight = w > 10 ? round4(w / 1000) : round4(w);
    }

    const chargeWeight = cost.chargeWeight !== undefined ? round4(parseFloat(cost.chargeWeight) || 0) : (data.chargeWeight !== undefined ? round4(parseFloat(data.chargeWeight) || 0) : null);

    return {
        pcbCharges,
        basePcbPrice,
        buildTimeOptions,
        shippingOptions,
        providerTotalFee,
        providerPriceWithoutFreight,
        weight,
        chargeWeight
    };
}

function round2(val: number): number {
    return Math.round(val * 100) / 100;
}

function round4(val: number): number {
    return Math.round(val * 10000) / 10000;
}
