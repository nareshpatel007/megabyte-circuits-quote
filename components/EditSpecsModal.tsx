"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, Sparkles, Loader2, Check, AlertCircle, RefreshCw, Zap } from "lucide-react";
import { isJlcpcbRequired, getMatchedJlcpcbConditions } from "@/lib/jlcpcbCondition";
import { useCurrency } from "@/context/CurrencyContext";

export interface EditSpecsModalProps {
    isOpen: boolean;
    item: any;
    onClose: () => void;
    onSave: (updatedItem: any) => Promise<void> | void;
}

export default function EditSpecsModal({
    isOpen,
    item,
    onClose,
    onSave
}: EditSpecsModalProps) {
    const { formatPrice } = useCurrency();

    // Editable PCB specification state
    const [baseMaterial, setBaseMaterial] = useState("FR-4");
    const [layers, setLayers] = useState("2");
    const [materialType, setMaterialType] = useState("FR4 TG135");
    const [width, setWidth] = useState(100);
    const [height, setHeight] = useState(100);
    const [thickness, setThickness] = useState("1.6mm");
    const [surfaceFinish, setSurfaceFinish] = useState("HASL(Leaded)");
    const [viaCovering, setViaCovering] = useState("Not Specified");
    const [viaPlating, setViaPlating] = useState("Not Specified");
    const [minHole, setMinHole] = useState("0.3mm/(0.4/0.45mm)");
    const [goldFingers, setGoldFingers] = useState("No");
    const [castellated, setCastellated] = useState("No");
    const [edgePlating, setEdgePlating] = useState("No");
    const [blindSlots, setBlindSlots] = useState("No");

    // Calculation states
    const [isCalculating, setIsCalculating] = useState(false);
    const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
    const [calculatedShipping, setCalculatedShipping] = useState<number>(0);
    const [jlcQuoteData, setJlcQuoteData] = useState<any>(null);
    const [calcError, setCalcError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const calcDebounceRef = useRef<NodeJS.Timeout | null>(null);

    // Sync state when item opens
    useEffect(() => {
        if (!item || !isOpen) return;

        const currentMat = item.baseMaterial || item.material || "FR-4";
        setBaseMaterial(currentMat);

        const defaultMt = currentMat.includes("Flex")
            ? "Polyimide (PI)"
            : currentMat.includes("Rogers")
                ? "RO4350B(Dk=3.48,Df=0.0037)"
                : currentMat.includes("PTFE")
                    ? "ZYF300CA-P(Dk=3.0,Df=0.0016)"
                    : "FR4 TG135";
        const rawMt = item.materialType;
        const normalizedMt = (rawMt === "FR4-TG135" || !rawMt) ? "FR4 TG135" : rawMt;
        setMaterialType(normalizedMt || defaultMt);

        const lNum = parseInt(String(item.layers || "2").replace(/\D/g, ""), 10) || 2;
        setLayers(String(lNum));

        let w = Number(item.width);
        let h = Number(item.height);
        if ((!w || !h) && item.dimensions) {
            const match = String(item.dimensions).match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i);
            if (match) {
                w = parseFloat(match[1]);
                h = parseFloat(match[2]);
            }
        }
        setWidth(w || 100);
        setHeight(h || 100);

        setThickness(item.thickness || "1.6mm");
        setSurfaceFinish(item.surfaceFinish || "HASL(Leaded)");
        const rawVc = item.viaCovering || "Not Specified";
        setViaCovering((rawVc === "Tented" || rawVc === "Untented") ? "Not Specified" : rawVc);
        setViaPlating(item.viaPlating || "Not Specified");
        setMinHole(item.minHole || "0.3mm/(0.4/0.45mm)");
        setGoldFingers(item.goldFingers || "No");
        setCastellated(item.castellated || "No");
        setEdgePlating(item.edgePlating || "No");
        setBlindSlots(item.blindSlots || "No");

        setCalculatedPrice(item.price || null);
        setCalculatedShipping(item.shippingCharge || 0);
        setJlcQuoteData(item.jlcpcb_quote || null);
        setCalcError(null);
    }, [item, isOpen]);

    const handleBaseMaterialChange = (mat: string) => {
        setBaseMaterial(mat);
        if (mat === "FR-4") {
            if (!["FR4 TG135", "KB6164 - TG135", "Nan Ya NP-140F", "S1141 TG140", "S1000H TG155"].includes(materialType)) {
                setMaterialType("FR4 TG135");
            }
            setSurfaceFinish(parseInt(layers, 10) >= 6 ? "LeadFree HASL" : "HASL(Leaded)");
        } else if (mat === "Rogers") {
            setMaterialType("RO4350B(Dk=3.48,Df=0.0037)");
            setSurfaceFinish("ENIG");
        } else if (mat === "PTFE Teflon") {
            setMaterialType("ZYF300CA-P(Dk=3.0,Df=0.0016)");
            setSurfaceFinish("ENIG");
        } else if (mat === "Flex") {
            setMaterialType("Polyimide (PI)");
            setSurfaceFinish("ENIG");
        }
    };

    // Construct spec object for condition checking
    const currentSpecs = {
        productType: "pcb",
        layers,
        baseMaterial,
        material: baseMaterial,
        materialType,
        width,
        height,
        dimensions: `${width}x${height}mm`,
        thickness,
        surfaceFinish,
        viaCovering,
        viaPlating,
        minHole,
        goldFingers,
        castellated,
        edgePlating,
        blindSlots,
        elecTest: baseMaterial === "Rogers" ? "Flying Probe Fully Test" : (item?.elecTest || ""),
        jlcpcb_file_key: item?.jlcpcb_file_key || item?.fileKey
    };

    const isJlc = isJlcpcbRequired(currentSpecs);
    const matchedReasons = getMatchedJlcpcbConditions(currentSpecs);

    // Live quotation calculation when specifications change
    useEffect(() => {
        if (!isOpen || !item) return;

        if (calcDebounceRef.current) {
            clearTimeout(calcDebounceRef.current);
        }

        setIsCalculating(true);
        setCalcError(null);

        calcDebounceRef.current = setTimeout(async () => {
            const currentQty = Math.max(5, item.qty || 5);
            const layersCount = parseInt(layers, 10) || 2;
            const rawThickness = parseFloat(thickness.replace(/[^0-9.]/g, "")) || 1.6;

            if (isJlc) {
                // Call JLCPCB calculate endpoint
                try {
                    const finishMap: Record<string, number> = {
                        "HASL(with lead)": 0,
                        "HASL(Leaded)": 0,
                        "HASL": 0,
                        "LeadFree HASL": 1,
                        "LeadFree HASL (RoHS)": 1,
                        "ENIG": 2,
                        "OSP": 3
                    };

                    let surfaceFinishVal = finishMap[surfaceFinish] ?? 0;
                    if (layersCount >= 6 && surfaceFinishVal === 0) {
                        surfaceFinishVal = 2;
                    }

                    let plateTypeVal = 1;
                    const matLower = baseMaterial.toLowerCase();
                    if (matLower.includes("flex")) plateTypeVal = 7;
                    else if (matLower.includes("roger")) plateTypeVal = 5;
                    else if (matLower.includes("ptfe") || matLower.includes("teflon")) plateTypeVal = 6;
                    else if (matLower.includes("aluminum")) plateTypeVal = 2;
                    else if (matLower.includes("hdi")) plateTypeVal = layersCount >= 4 ? 8 : 1;

                    let copperWeightVal = (item.copperWeight || "").includes("2") ? 2 : 1;
                    if (plateTypeVal === 7) {
                        // For Flex PCB: 1-2 layers uses 0.33 oz (12µm foil); 4 layers uses 1 oz
                        copperWeightVal = layersCount >= 4 ? 1 : 0.33;
                    }

                    let viaCoveringVal = 1;
                    const vc = viaCovering.toLowerCase();
                    if (vc.includes("copper") || (vc.includes("paste") && vc.includes("fill"))) {
                        viaCoveringVal = 5;
                    } else if (vc.includes("epoxy")) {
                        viaCoveringVal = 4;
                    } else if (vc.includes("plugged")) {
                        viaCoveringVal = 3;
                    } else if (vc.includes("untented")) {
                        viaCoveringVal = 2;
                    } else {
                        viaCoveringVal = 1;
                    }

                    let minHoleVal = 0.3;
                    const mh = minHole.toLowerCase();
                    if (mh.includes("0.15")) minHoleVal = 0.15;
                    else if (mh.includes("0.2mm") || mh.startsWith("0.2/")) minHoleVal = 0.2;
                    else if (mh.includes("0.25")) minHoleVal = 0.25;

                    const colorMap: Record<string, number> = {
                        "Green": 0, "#52c41a": 0, "Red": 1, "#f5222d": 1, "Yellow": 2, "#fadb14": 2,
                        "Blue": 3, "#1677ff": 3, "White": 4, "#ffffff": 4, "Black": 5, "#000000": 5,
                        "Purple": 6, "#722ed1": 6
                    };

                    const fileKey = item.jlcpcb_file_key || item.fileKey || "";
                    const gerberId = item.gerber_file_id || item.uploadedGerberFileId || undefined;

                    let materialDetailsVal = 0;
                    const mtLower = (materialType || "").toLowerCase();
                    if (mtLower.includes("kb6164")) materialDetailsVal = 1;
                    else if (mtLower.includes("nan ya") || mtLower.includes("np-140f")) materialDetailsVal = 2;
                    else if (mtLower.includes("s1141")) materialDetailsVal = 3;
                    else if (mtLower.includes("s1000h")) materialDetailsVal = 4;
                    else materialDetailsVal = 0;

                    const modalServiceConfigs: any[] = [];
                    if (plateTypeVal === 7) {
                        modalServiceConfigs.push({
                            serviceConfigCode: "CTC",
                            configOptionShow: layersCount >= 4 ? "PI:25um/AD:25um" : "PI:12.5um/AD:15um"
                        });
                        if (item.coverlayColor) {
                            modalServiceConfigs.push({
                                serviceConfigCode: "PCYB",
                                configOptionShow: item.coverlayColor
                            });
                        }
                        if (item.copperType) {
                            modalServiceConfigs.push({
                                serviceConfigCode: "CT",
                                configOptionShow: item.copperType
                            });
                        }
                    } else if (plateTypeVal === 5) {
                        modalServiceConfigs.push({
                            serviceConfigCode: "HFMT",
                            configOptionShow: materialType || "RO4350B(Dk=3.48,Df=0.0037)"
                        });
                    } else if (plateTypeVal === 6) {
                        modalServiceConfigs.push({
                            serviceConfigCode: "HFMT",
                            configOptionShow: materialType || "ZYF300CA-C(Dk=2.94,Df=0.0016)"
                        });
                    }

                    if (viaPlating && viaPlating !== "Not Specified") {
                        modalServiceConfigs.push({
                            serviceConfigCode: "VAPG",
                            configOptionShow: viaPlating
                        });
                    }

                    const payload = {
                        orderType: 1,
                        achieveDate: 48,
                        country: "IN",
                        gerber_id: gerberId,
                        fileKey: fileKey,
                        pcbParam: {
                            layer: layersCount,
                            width: Number(width) || 100,
                            length: Number(height) || 100,
                            qty: currentQty,
                            thickness: rawThickness,
                            pcbColor: colorMap[item.pcbColor || "Green"] ?? 0,
                            surfaceFinish: surfaceFinishVal,
                            ...(surfaceFinishVal === 2 || plateTypeVal === 7 ? {
                                goldThickness: (item.goldThickness && String(item.goldThickness).includes("2")) ? 2 : 1
                            } : {}),
                            copperWeight: copperWeightVal,
                            ...(layersCount >= 4 ? { insideCuprumThickness: "0.5" } : {}),
                            goldFinger: goldFingers === "Yes" ? 1 : 0,
                            materialDetails: materialDetailsVal,
                            panelFlag: 0,
                            differentDesign: parseInt(item.differentDesign || "1", 10) || 1,
                            flyingProbeTest: (plateTypeVal === 7 || plateTypeVal === 5 || item.elecTest === "Flying Probe Fully Test") ? 2 : 1,
                            castellatedHoles: castellated === "Yes" ? 1 : 0,
                            orderDetailsRemark: "Cart Specification Edit",
                            impedanceFlag: "no",
                            isAddCustomerCode: "nocode",
                            plateType: plateTypeVal,
                            autoConfirmProductionFile: true,
                            markOnPcb: 1,
                            viaCovering: viaCoveringVal,
                            needTechnics: 0,
                            edgeRounding: edgePlating === "Yes",
                            blindSlots: blindSlots === "Yes" ? 1 : 0,
                            minHole: minHoleVal,
                            serviceConfigVos: modalServiceConfigs
                        }
                    };

                    const res = await fetch("/api/jlcpcb/calculate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(payload)
                    });
                    const json = await res.json();

                    if (json.success && json.code === 200) {
                        const jlcBasePrice = parseFloat(json.subtotal ?? json.selling_price_before_gst ?? (json.pcb_price || 0));
                        let weightKg = 0;
                        if (json.weight_kg !== undefined && json.weight_kg !== null && parseFloat(json.weight_kg) > 0) {
                            weightKg = parseFloat(json.weight_kg);
                        } else if (json.pcbCostInfo?.weight !== undefined && parseFloat(json.pcbCostInfo.weight) > 0) {
                            weightKg = parseFloat(json.pcbCostInfo.weight);
                        }

                        let newShippingCharge = item.shippingCharge || 0;
                        if (item.shippingOption) {
                            const defaultShippingOptions = [
                                { key: "standard", location: "Standard", method: "Standard", rate: 0 },
                                { key: "plus", location: "Plus", method: "Plus", rate: 150 },
                                { key: "fasttrack", location: "Fasttrack", method: "Fasttrack", rate: 450 }
                            ];
                            const foundOpt = defaultShippingOptions.find(o =>
                                `${o.location} - ${o.method}` === item.shippingOption ||
                                o.location === item.shippingOption ||
                                o.key === item.shippingOptionKey
                            ) || defaultShippingOptions[0];

                            const totalAreaInSqM = ((Number(width) || 100) / 1000) * ((Number(height) || 100) / 1000) * currentQty;
                            const estimatedWeightKg = weightKg > 0 ? weightKg : Math.max(0.1, parseFloat((totalAreaInSqM * 3.8).toFixed(2)));
                            const chargedWeightKg = Math.max(1.0, estimatedWeightKg);
                            newShippingCharge = Math.round(foundOpt.rate * chargedWeightKg);
                        }

                        setCalculatedPrice(jlcBasePrice + newShippingCharge);
                        setCalculatedShipping(newShippingCharge);
                        setJlcQuoteData(json);
                        setCalcError(null);
                    } else {
                        setCalcError(json.message || "Failed to calculate JLCPCB quotation.");
                    }
                } catch (err: any) {
                    setCalcError("Error calculating JLCPCB quotation. Please check your options.");
                } finally {
                    setIsCalculating(false);
                }
            } else {
                // Internal standard PCB price estimation
                const prevShipping = item.shippingCharge || 0;
                const prevBase = Math.max((item.price || 0) - prevShipping, 0);
                const unitP = item.unitPrice || (currentQty > 0 ? prevBase / currentQty : prevBase);
                const newBase = Math.max(Math.round(unitP * currentQty), 10);
                setCalculatedPrice(newBase + prevShipping);
                setCalculatedShipping(prevShipping);
                setJlcQuoteData(null);
                setIsCalculating(false);
            }
        }, 400);

        return () => {
            if (calcDebounceRef.current) clearTimeout(calcDebounceRef.current);
        };
    }, [
        isOpen,
        layers,
        baseMaterial,
        materialType,
        width,
        height,
        thickness,
        surfaceFinish,
        viaCovering,
        viaPlating,
        minHole,
        goldFingers,
        castellated,
        edgePlating,
        blindSlots,
        isJlc
    ]);

    const handleApply = async () => {
        if (!item) return;
        setIsSaving(true);

        try {
            const finalPcbPrice = calculatedPrice !== null ? calculatedPrice : item.price;
            const currentQty = Math.max(5, item.qty || 5);
            const unitPrice = currentQty > 0 ? Math.round(((finalPcbPrice - calculatedShipping) / currentQty) * 100) / 100 : finalPcbPrice;

            const updatedItem = {
                ...item,
                baseMaterial,
                material: baseMaterial,
                materialType,
                layers: `${layers} Layer${Number(layers) > 1 ? "s" : ""}`,
                width: Number(width) || 100,
                height: Number(height) || 100,
                dimensions: `${width}x${height}mm`,
                thickness,
                surfaceFinish,
                goldThickness: (surfaceFinish === "ENIG" || baseMaterial === "Flex") ? (item.goldThickness && item.goldThickness !== "N/A" && item.goldThickness !== "1 U*" ? item.goldThickness : "1 U\"") : "N/A",
                viaCovering,
                viaPlating,
                minHole,
                goldFingers,
                castellated,
                edgePlating,
                blindSlots,
                elecTest: baseMaterial === "Rogers" ? "Flying Probe Fully Test" : (item.elecTest || ""),
                price: finalPcbPrice,
                unitPrice: unitPrice,
                shippingCharge: calculatedShipping,
                quotation_source: isJlc ? "jlcpcb" : "internal",
                order_type: isJlc ? "jlcpcb" : "normal",
                jlcpcb_price: isJlc ? (finalPcbPrice - calculatedShipping) : undefined,
                jlcpcb_quote: isJlc ? (jlcQuoteData || item.jlcpcb_quote) : undefined,
                jlcpcb_quotation_snapshot: isJlc ? (jlcQuoteData || item.jlcpcb_quotation_snapshot) : undefined,
                jlcpcb_file_key: isJlc ? (jlcQuoteData?.fileKey || item.jlcpcb_file_key) : undefined
            };

            await onSave(updatedItem);
            onClose();
        } catch (e) {
            console.error("Failed to save edited specs", e);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen || !item) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/70">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-base sm:text-lg font-extrabold text-gray-900">
                                Edit PCB Specifications
                            </h2>
                            {isJlc ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200">
                                    <Zap className="w-3 h-3 text-purple-600 fill-purple-500" />
                                    JLCPCB Live Quotation
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 border border-gray-200">
                                    Standard Pricing
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
                            {item.boardName || "Custom PCB"} &bull; Qty: {item.qty || 5}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Active JLCPCB Banner */}
                {isJlc && (
                    <div className="px-6 py-2.5 bg-purple-50/80 border-b border-purple-100 flex flex-wrap items-center gap-1.5 text-xs text-purple-900">
                        <span className="font-extrabold flex items-center gap-1 text-purple-800 shrink-0">
                            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                            Active JLCPCB Options:
                        </span>
                        {matchedReasons.map((reason, idx) => (
                            <span
                                key={idx}
                                className="inline-block px-2 py-0.5 bg-white font-bold text-purple-700 rounded-md border border-purple-200 text-[11px]"
                            >
                                {reason}
                            </span>
                        ))}
                    </div>
                )}

                {/* Modal Body / Specification Form */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
                    {/* Base Material */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                        <label className="font-bold text-gray-700 sm:w-44">Base Material</label>
                        <div className="flex flex-wrap gap-2 flex-1">
                            {["FR-4", "Flex", "Rogers", "PTFE Teflon"].map((mat) => (
                                <button
                                    key={mat}
                                    type="button"
                                    onClick={() => handleBaseMaterialChange(mat)}
                                    className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                                        baseMaterial === mat
                                            ? "border-primary bg-primary/10 text-primary shadow-2xs"
                                            : "border-gray-200 bg-white text-gray-700 hover:border-primary/40"
                                    }`}
                                >
                                    {mat}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Material Type */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-3 border-b border-gray-100">
                        <div className="sm:w-44">
                            <label className="font-bold text-gray-700 flex items-center gap-1.5">
                                <span>Material Type</span>
                                <span
                                    className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold cursor-help"
                                    title="Core laminate selection & Tg specifications"
                                >
                                    ?
                                </span>
                            </label>
                            <p className="text-[10px] text-gray-400 font-medium">Core laminate options</p>
                        </div>
                        <div className="flex flex-wrap gap-2 flex-1">
                            {baseMaterial === "FR-4" || (!baseMaterial.includes("Flex") && !baseMaterial.includes("Rogers") && !baseMaterial.includes("PTFE")) ? (
                                ["FR4 TG135", "KB6164 - TG135", "Nan Ya NP-140F", "S1141 TG140", "S1000H TG155"].map((mt) => {
                                    const isSelected =
                                        materialType === mt ||
                                        (mt === "FR4 TG135" && (materialType === "FR4-TG135" || !materialType));
                                    return (
                                        <button
                                            key={mt}
                                            type="button"
                                            onClick={() => setMaterialType(mt)}
                                            className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                                                isSelected
                                                    ? "border-primary bg-primary/10 text-primary font-bold shadow-2xs"
                                                    : "border-gray-200 bg-white text-gray-700 hover:border-primary/40 font-medium"
                                            }`}
                                        >
                                            <span>{mt}</span>
                                            {isSelected && <Check className="w-3.5 h-3.5 text-primary stroke-[2.5]" />}
                                        </button>
                                    );
                                })
                            ) : baseMaterial === "Rogers" ? (
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary bg-primary/10 text-primary font-bold shadow-2xs cursor-default text-xs"
                                >
                                    <span>RO4350B(Dk=3.48,Df=0.0037)</span>
                                    <Check className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
                                </button>
                            ) : baseMaterial === "PTFE Teflon" ? (
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary bg-primary/10 text-primary font-bold shadow-2xs cursor-default text-xs"
                                >
                                    <span>ZYF300CA-P(Dk=3.0,Df=0.0016)</span>
                                    <Check className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary bg-primary/10 text-primary font-bold shadow-2xs cursor-default text-xs"
                                >
                                    <span>Polyimide (PI)</span>
                                    <Check className="w-3.5 h-3.5 text-primary stroke-[2.5]" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Dimensions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                        <div className="sm:w-44">
                            <label className="font-bold text-gray-700">Dimensions (mm)</label>
                            <p className="text-[10px] text-gray-400 font-medium">≥350mm triggers JLCPCB</p>
                        </div>
                        <div className="flex items-center gap-2 flex-1">
                            <input
                                type="number"
                                min={1}
                                max={1000}
                                value={width}
                                onChange={(e) => setWidth(Math.max(1, parseFloat(e.target.value) || 10))}
                                className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:border-primary focus:outline-none"
                                placeholder="Width"
                            />
                            <span className="text-gray-400 font-bold">&times;</span>
                            <input
                                type="number"
                                min={1}
                                max={1000}
                                value={height}
                                onChange={(e) => setHeight(Math.max(1, parseFloat(e.target.value) || 10))}
                                className="w-24 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-bold text-gray-800 focus:border-primary focus:outline-none"
                                placeholder="Height"
                            />
                            <span className="text-gray-500 font-semibold">mm</span>
                        </div>
                    </div>

                    {/* Layers */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                        <label className="font-bold text-gray-700 sm:w-44">Layer Count</label>
                        <div className="flex flex-wrap gap-2 flex-1">
                            {["1", "2", "4", "6"].map((l) => (
                                <button
                                    key={l}
                                    type="button"
                                    onClick={() => setLayers(l)}
                                    className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                                        layers === l
                                            ? "border-primary bg-primary/10 text-primary shadow-2xs"
                                            : "border-gray-200 bg-white text-gray-700 hover:border-primary/40"
                                    }`}
                                >
                                    {l} Layer{Number(l) > 1 ? "s" : ""}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* PCB Thickness */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                        <label className="font-bold text-gray-700 sm:w-44">PCB Thickness</label>
                        <div className="flex flex-wrap gap-2 flex-1">
                            {["0.6mm", "0.8mm", "1.0mm", "1.2mm", "1.6mm", "2.0mm"].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => setThickness(t)}
                                    className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                                        thickness === t
                                            ? "border-primary bg-primary/10 text-primary shadow-2xs"
                                            : "border-gray-200 bg-white text-gray-700 hover:border-primary/40"
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Surface Finish */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                        <label className="font-bold text-gray-700 sm:w-44">Surface Finish</label>
                        <div className="flex flex-wrap gap-2 flex-1">
                            {["HASL(Leaded)", "LeadFree HASL", "ENIG", "OSP"].map((sf) => (
                                <button
                                    key={sf}
                                    type="button"
                                    onClick={() => setSurfaceFinish(sf)}
                                    className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                                        surfaceFinish === sf
                                            ? "border-primary bg-primary/10 text-primary shadow-2xs"
                                            : "border-gray-200 bg-white text-gray-700 hover:border-primary/40"
                                    }`}
                                >
                                    {sf}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Via Covering */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                        <label className="font-bold text-gray-700 sm:w-44">Via Covering</label>
                        <div className="flex flex-wrap gap-2 flex-1">
                            {["Plugged", "Epoxy Filled & Capped", "Copper paste Filled & Capped"].map((vc) => (
                                <button
                                    key={vc}
                                    type="button"
                                    onClick={() => setViaCovering(viaCovering === vc ? "Not Specified" : vc)}
                                    className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                                        viaCovering === vc
                                            ? "border-primary bg-primary/10 text-primary shadow-2xs"
                                            : "border-gray-200 bg-white text-gray-700 hover:border-primary/40"
                                    }`}
                                >
                                    {vc}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Via Plating Method */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                        <label className="font-bold text-gray-700 sm:w-44">Via Plating Method</label>
                        <div className="flex flex-wrap gap-2 flex-1">
                            {["Not Specified", "Conductive Adhesive", "Horizontal Electroless Copper Plating"].map((vp) => (
                                <button
                                    key={vp}
                                    type="button"
                                    onClick={() => setViaPlating(vp)}
                                    className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                                        viaPlating === vp
                                            ? "border-primary bg-primary/10 text-primary shadow-2xs"
                                            : "border-gray-200 bg-white text-gray-700 hover:border-primary/40"
                                    }`}
                                >
                                    {vp}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Min via hole size/diameter */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                        <label className="font-bold text-gray-700 sm:w-44">Min Via Hole Size</label>
                        <div className="flex flex-wrap gap-2 flex-1">
                            {[
                                "0.3mm/(0.4/0.45mm)",
                                "0.25mm/(0.35/0.4mm)",
                                "0.2mm/(0.3/0.35mm)",
                                "0.15mm/(0.25/0.3mm)"
                            ].map((mh) => (
                                <button
                                    key={mh}
                                    type="button"
                                    onClick={() => setMinHole(mh)}
                                    className={`px-3 py-1.5 rounded-lg font-bold border transition-all cursor-pointer ${
                                        minHole === mh
                                            ? "border-primary bg-primary/10 text-primary shadow-2xs"
                                            : "border-gray-200 bg-white text-gray-700 hover:border-primary/40"
                                    }`}
                                >
                                    {mh}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Gold Fingers, Castellated Holes, Edge Plating, Blind Slots */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                        {/* Gold Fingers */}
                        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                            <div>
                                <div className="font-bold text-gray-800">Gold Fingers</div>
                                <div className="text-[10px] text-gray-400">ENIG / Edge Fingers</div>
                            </div>
                            <div className="flex gap-1.5">
                                {["No", "Yes"].map((g) => (
                                    <button
                                        key={g}
                                        type="button"
                                        onClick={() => setGoldFingers(g)}
                                        className={`px-2.5 py-1 rounded-md font-bold text-xs border cursor-pointer ${
                                            goldFingers === g
                                                ? "border-primary bg-primary text-white"
                                                : "border-gray-200 bg-white text-gray-700"
                                        }`}
                                    >
                                        {g}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Castellated Holes */}
                        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                            <div>
                                <div className="font-bold text-gray-800">Castellated Holes</div>
                                <div className="text-[10px] text-gray-400">Half-cut side vias</div>
                            </div>
                            <div className="flex gap-1.5">
                                {["No", "Yes"].map((c) => (
                                    <button
                                        key={c}
                                        type="button"
                                        onClick={() => setCastellated(c)}
                                        className={`px-2.5 py-1 rounded-md font-bold text-xs border cursor-pointer ${
                                            castellated === c
                                                ? "border-primary bg-primary text-white"
                                                : "border-gray-200 bg-white text-gray-700"
                                        }`}
                                    >
                                        {c}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Edge Plating */}
                        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                            <div>
                                <div className="font-bold text-gray-800">Edge Plating</div>
                                <div className="text-[10px] text-gray-400">Copper on board edge</div>
                            </div>
                            <div className="flex gap-1.5">
                                {["No", "Yes"].map((e) => (
                                    <button
                                        key={e}
                                        type="button"
                                        onClick={() => setEdgePlating(e)}
                                        className={`px-2.5 py-1 rounded-md font-bold text-xs border cursor-pointer ${
                                            edgePlating === e
                                                ? "border-primary bg-primary text-white"
                                                : "border-gray-200 bg-white text-gray-700"
                                        }`}
                                    >
                                        {e}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Blind Slots */}
                        <div className="flex items-center justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50">
                            <div>
                                <div className="font-bold text-gray-800">Blind Slots</div>
                                <div className="text-[10px] text-gray-400">Milled depth routing</div>
                            </div>
                            <div className="flex gap-1.5">
                                {["No", "Yes"].map((b) => (
                                    <button
                                        key={b}
                                        type="button"
                                        onClick={() => setBlindSlots(b)}
                                        className={`px-2.5 py-1 rounded-md font-bold text-xs border cursor-pointer ${
                                            blindSlots === b
                                                ? "border-primary bg-primary text-white"
                                                : "border-gray-200 bg-white text-gray-700"
                                        }`}
                                    >
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer with Quotation Breakdown */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="text-left">
                            <div className="text-[10px] uppercase font-bold text-gray-400">
                                {isJlc ? "JLCPCB API Quotation" : "Estimated Price"}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-primary">
                                    {calculatedPrice !== null ? formatPrice(calculatedPrice) : formatPrice(item.price)}
                                </span>
                                {isCalculating && (
                                    <span className="flex items-center gap-1 text-[11px] font-bold text-purple-600">
                                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                        Calling JLCPCB API...
                                    </span>
                                )}
                            </div>
                            {calcError && (
                                <p className="text-[11px] font-semibold text-rose-600 mt-0.5">
                                    {calcError}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-full border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            disabled={isCalculating || isSaving}
                            onClick={handleApply}
                            className="flex-1 sm:flex-none px-6 py-2.5 rounded-full bg-primary hover:bg-secondary text-white font-bold transition-all shadow-xs cursor-pointer active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Updating...</span>
                                </>
                            ) : (
                                <>
                                    <Check className="w-4 h-4" />
                                    <span>Apply & Update Cart</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
