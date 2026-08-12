"use client";

import React, { useState, useRef, useEffect } from "react";
import { Info, Check, ChevronUp, ChevronDown, Pencil } from "lucide-react";
import { QuoteFormData, ParsedGerberFile } from "../../lib/gerber/types";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface QuoteFormProps {
    formData: QuoteFormData;
    setFormData: React.Dispatch<React.SetStateAction<QuoteFormData>>;
    specsOpen: boolean;
    setSpecsOpen: (val: boolean) => void;
    highSpecsOpen: boolean;
    setHighSpecsOpen: (val: boolean) => void;
    isUploaded: boolean;
    parsedFiles: ParsedGerberFile[];
    topSvg?: string;
    bottomSvg?: string;
}

const Pill = ({
    active,
    children,
    onClick,
    activeColor = "blue",
    badge,
    disabled = false
}: {
    active: boolean;
    children: React.ReactNode;
    onClick: () => void;
    activeColor?: "blue" | "orange" | "green";
    badge?: string;
    disabled?: boolean;
}) => {
    const baseClasses = "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all relative border";
    const colors = {
        blue: "border-primary bg-primary/10 text-primary",
        orange: "border-[#f5821f] bg-[#fff5eb] text-[#f5821f]",
        green: "border-[#52c41a] bg-[#f6ffed] text-[#52c41a]"
    };
    const inactiveClasses = "border-gray-200 bg-white text-gray-700 hover:border-primary/50 hover:text-primary cursor-pointer";
    const disabledClasses = "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed";

    return (
        <button
            type="button"
            disabled={disabled}
            onClick={disabled ? undefined : onClick}
            className={`${baseClasses} ${disabled ? disabledClasses : (active ? colors[activeColor] : inactiveClasses)}`}
        >
            {children}
            {badge && (
                <span className="absolute -top-2 -right-2 bg-[#52c41a] text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                    {badge}
                </span>
            )}
        </button>
    );
};

const MaterialPill = ({
    name,
    img,
    active,
    onClick
}: {
    name: string;
    img: string;
    active: boolean;
    onClick: () => void;
}) => {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative flex flex-col items-center justify-between p-2 sm:px-4 sm:py-2.5 rounded-lg border transition-all cursor-pointer min-w-[95px] sm:min-w-[110px] select-none overflow-hidden ${active
                ? "border-primary bg-primary/5 text-primary font-bold shadow-xs"
                : "border-gray-200 bg-white text-gray-700 font-semibold hover:border-primary/50 hover:text-primary"
                }`}
        >
            <div className="w-12 h-8 sm:w-14 sm:h-9 mb-1.5 flex items-center justify-center overflow-hidden">
                <img src={img} alt={name} className="w-full h-full object-contain transform scale-110" />
            </div>
            <span className="text-xs sm:text-sm text-center leading-tight tracking-tight">{name}</span>

            {active && (
                <div className="absolute bottom-0 right-0 w-0 h-0 border-t-[14px] border-t-transparent border-r-[14px] border-r-primary">
                    <svg className="absolute -top-[5px] right-[0px] w-2 h-2 text-white" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M2.5 6L5 8.5L9.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
            )}
        </button>
    );
};

const ColorCirclePill = ({ color, name, active, onClick }: { color: string; name: string; active: boolean; onClick: () => void }) => (
    <button
        type="button"
        onClick={onClick}
        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border flex items-center gap-2 cursor-pointer transition-all ${active ? "border-primary bg-primary/10 text-primary" : "border-gray-200 bg-white text-gray-700 hover:border-primary/50"
            }`}
    >
        <span className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: color }} />
        {name}
    </button>
);

const ConfigRow = ({ label, children, tooltip }: { label: string; children: React.ReactNode; tooltip?: string }) => (
    <div className="flex flex-col sm:flex-row py-2.5 border-b border-slate-100 gap-4 sm:gap-0">
        <div className="w-full sm:w-[180px] shrink-0 flex items-center gap-1.5 text-sm text-gray-600 font-semibold">
            {label}
            {tooltip && (
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="bg-slate-900 text-white border-none shadow-md">
                        <p className="max-w-[200px] text-xs leading-normal">{tooltip}</p>
                    </TooltipContent>
                </Tooltip>
            )}
        </div>
        <div className="flex flex-wrap gap-2.5 flex-1 items-center">
            {children}
        </div>
    </div>
);

export default function QuoteForm({
    formData,
    setFormData,
    specsOpen,
    setSpecsOpen,
    highSpecsOpen,
    setHighSpecsOpen,
    isUploaded,
    parsedFiles,
    topSvg = "",
    bottomSvg = ""
}: QuoteFormProps) {
    const updateField = (field: keyof QuoteFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const validateDimensions = (w: number, h: number, l: number) => {
        if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) return;
        const unitMultiplier = formData.unit === "inches" ? 25.4 : 1;
        const wMm = w * unitMultiplier;
        const hMm = h * unitMultiplier;

        const minLength = 20;
        const minWidth = 20;
        let maxLength = 300;
        let maxWidth = 300;

        if (l === 1) {
            maxLength = 400;
            maxWidth = 400;
        } else if (l === 2) {
            maxLength = 300;
            maxWidth = 300;
        } else if ([4, 6, 8, 10].includes(l)) {
            maxLength = 400;
            maxWidth = 500;
        }

        let newW = w;
        let newH = h;
        let reset = false;

        if (wMm < minLength) {
            newW = minLength / unitMultiplier;
        }
        if (hMm < minWidth) {
            newH = minWidth / unitMultiplier;
        }

        if (wMm > maxLength || hMm > maxWidth) {
            alert(`For ${l}-layer boards, the board size must be between ${minLength}mm x ${minWidth}mm and ${maxLength}mm x ${maxWidth}mm.`);
            newW = 100 / unitMultiplier;
            newH = 100 / unitMultiplier;
            reset = true;
        }

        if (newW !== w || newH !== h || reset) {
            setFormData(prev => ({ ...prev, width: newW.toFixed(2), height: newH.toFixed(2) }));
        }
    };

    // Keep state track for advanced options accordion & PCB remark toggle
    const [advancedOpen, setAdvancedOpen] = useState(true);
    const [showRemarkTextarea, setShowRemarkTextarea] = useState(false);



    const singleWidth = parseFloat(formData.width) || 100;
    const singleHeight = parseFloat(formData.height) || 100;



    return (
        <TooltipProvider>
            <div className="space-y-4">

                {/* SMT Stencil Specifications Section */}
                {formData.stencilOn && (
                    <div className="bg-blue-50/50 p-4 sm:p-5 rounded-xl border border-blue-200/90 mb-5 space-y-3.5 shadow-sm">
                        <div className="flex items-center justify-between pb-3 border-b border-blue-200/60">
                            <h3 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                                <span className="text-base">📐</span> SMT Stencil Parameters
                            </h3>
                            <span className="text-xs font-semibold text-blue-700 bg-blue-100/90 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                                High Precision Laser Cut
                            </span>
                        </div>

                        <ConfigRow label="Stencil Type" tooltip="Framework comes with an aluminum frame; Frameless is a bare stainless steel sheet.">
                            {["Frameless", "Framework"].map(t => (
                                <Pill
                                    key={t}
                                    active={(formData.stencilType || "Frameless") === t}
                                    onClick={() => updateField("stencilType", t)}
                                >
                                    {t === "Frameless" ? "Frameless (Bare Sheet)" : "Framework (With Aluminum Frame)"}
                                </Pill>
                            ))}
                        </ConfigRow>

                        <ConfigRow label="Stencil Side" tooltip="Select component side for SMD pad apertures.">
                            {["Top", "Bottom", "Top & Bottom"].map(s => (
                                <Pill
                                    key={s}
                                    active={(formData.stencilSide || "Top") === s}
                                    onClick={() => updateField("stencilSide", s)}
                                >
                                    {s}
                                </Pill>
                            ))}
                        </ConfigRow>

                        <ConfigRow label="Stencil Size" tooltip="Outer frame or sheet size dimensions.">
                            {[
                                { label: "290 × 370 mm", val: "290x370mm" },
                                { label: "370 × 470 mm", val: "370x470mm" },
                                { label: "420 × 520 mm", val: "420x520mm" },
                                { label: "450 × 550 mm", val: "450x550mm" },
                                { label: "584 × 584 mm", val: "584x584mm" }
                            ].map(sz => (
                                <Pill
                                    key={sz.val}
                                    active={(formData.stencilSize || "290x370mm") === sz.val}
                                    onClick={() => updateField("stencilSize", sz.val)}
                                >
                                    {sz.label}
                                </Pill>
                            ))}
                        </ConfigRow>

                        <ConfigRow label="Thickness" tooltip="Stainless steel foil thickness. 0.12mm is industry standard.">
                            {["0.10mm", "0.12mm", "0.13mm", "0.15mm", "0.18mm", "0.20mm"].map(th => (
                                <Pill
                                    key={th}
                                    active={(formData.stencilThickness || "0.12mm") === th}
                                    onClick={() => updateField("stencilThickness", th)}
                                >
                                    {th}
                                </Pill>
                            ))}
                        </ConfigRow>

                        <ConfigRow label="Fiducial Badges" tooltip="Optical alignment fiducials cut method.">
                            {["Half Cut", "Through Cut", "None"].map(f => (
                                <Pill
                                    key={f}
                                    active={(formData.stencilFiducials || "Half Cut") === f}
                                    onClick={() => updateField("stencilFiducials", f)}
                                >
                                    {f}
                                </Pill>
                            ))}
                        </ConfigRow>

                        <ConfigRow label="Electropolishing" tooltip="Smoothes aperture walls for crisp paste release.">
                            {["No", "Yes"].map(ep => (
                                <Pill
                                    key={ep}
                                    active={(formData.electropolishing || "No") === ep}
                                    onClick={() => updateField("electropolishing", ep)}
                                >
                                    {ep}
                                </Pill>
                            ))}
                        </ConfigRow>
                    </div>
                )}

                {/* Basic specs */}
                <ConfigRow label="Base Material" tooltip="Standard FR-4 is recommended for most digital circuit designs.">
                    {[
                        { name: "FR-4", img: "/images/materials/fr4.png" },
                        { name: "Flex", img: "/images/materials/flex.png" },
                        { name: "Rogers", img: "/images/materials/rogers.png" },
                        { name: "PTFE Teflon", img: "/images/materials/ptfe.png" }
                    ].map(m => (
                        <MaterialPill
                            key={m.name}
                            name={m.name}
                            img={m.img}
                            active={formData.baseMaterial === m.name}
                            onClick={() => updateField("baseMaterial", m.name)}
                        />
                    ))}
                </ConfigRow>

                <ConfigRow label="Layers" tooltip="Total layers count. Matches coordinates in drill outline files.">
                    <div className="flex items-center gap-2">
                        {["1", "2", "4"].map(l => (
                            <Pill
                                key={l}
                                active={formData.layers === l}
                                onClick={() => {
                                    updateField("layers", l);
                                    validateDimensions(parseFloat(formData.width) || 0, parseFloat(formData.height) || 0, parseInt(l));
                                }}
                            >
                                {l}
                            </Pill>
                        ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 px-3 py-1.5 bg-primary/5 border border-primary/30 rounded-lg shadow-2xs">
                        <span className="text-xs font-bold text-primary flex items-center gap-1">
                            ✨ High Precision PCB
                        </span>
                        <div className="flex items-center gap-1.5">
                            {["6", "8", "10", "12", "14", "16"].map(l => (
                                <Pill
                                    key={l}
                                    active={formData.layers === l}
                                    onClick={() => {
                                        updateField("layers", l);
                                        validateDimensions(parseFloat(formData.width) || 0, parseFloat(formData.height) || 0, parseInt(l));
                                    }}
                                >
                                    <span className="flex items-center gap-0.5">{l}</span>
                                </Pill>
                            ))}
                        </div>
                    </div>
                </ConfigRow>

                <ConfigRow label="Dimensions" tooltip="Input custom board dimensions in millimeters or inches.">
                    <div className="flex items-center gap-2.5">
                        <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={formData.width}
                            onKeyDown={(e) => {
                                if (e.key === "-" || e.key === "e" || e.key === "E") {
                                    e.preventDefault();
                                }
                            }}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || parseFloat(val) >= 0) {
                                    updateField("width", val);
                                }
                            }}
                            onBlur={(e) => {
                                let val = parseFloat(e.target.value);
                                if (isNaN(val) || val <= 0) val = 100;
                                updateField("width", val.toString());
                                validateDimensions(val, parseFloat(formData.height) || 0, parseInt(formData.layers));
                            }}
                            placeholder="100"
                            readOnly={isUploaded}
                            className={`w-24 h-9 px-3 border border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-sm transition-all ${isUploaded ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-100" : ""
                                }`}
                        />
                        <span className="text-gray-400 font-semibold">×</span>
                        <input
                            type="number"
                            min="0.1"
                            step="any"
                            value={formData.height}
                            onKeyDown={(e) => {
                                if (e.key === "-" || e.key === "e" || e.key === "E") {
                                    e.preventDefault();
                                }
                            }}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val === "" || parseFloat(val) >= 0) {
                                    updateField("height", val);
                                }
                            }}
                            onBlur={(e) => {
                                let val = parseFloat(e.target.value);
                                if (isNaN(val) || val <= 0) val = 100;
                                updateField("height", val.toString());
                                validateDimensions(parseFloat(formData.width) || 0, val, parseInt(formData.layers));
                            }}
                            placeholder="100"
                            readOnly={isUploaded}
                            className={`w-24 h-9 px-3 border border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-sm transition-all ${isUploaded ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-100" : ""
                                }`}
                        />
                        <select
                            value={formData.unit}
                            onChange={(e) => updateField("unit", e.target.value)}
                            disabled={isUploaded}
                            className={`h-9 px-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none bg-white shadow-sm font-semibold text-gray-700 ${isUploaded ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100" : ""
                                }`}
                        >
                            <option value="mm">mm</option>
                            <option value="inches">inches</option>
                        </select>
                    </div>
                </ConfigRow>

                <ConfigRow label="PCB Qty" tooltip="Enter any custom quantity for your PCB order.">
                    <div className="flex flex-wrap items-center gap-2">
                        {["5", "10", "15", "20", "25", "30", "50", "100"].map(q => (
                            <Pill
                                key={q}
                                active={formData.qty === q}
                                onClick={() => updateField("qty", q)}
                            >
                                {q}
                            </Pill>
                        ))}
                        <div className="flex items-center gap-1.5 ml-1">
                            <span className="text-xs text-gray-500 font-semibold">Other:</span>
                            <input
                                type="number"
                                min="1"
                                value={formData.qty}
                                onKeyDown={(e) => {
                                    if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === ".") {
                                        e.preventDefault();
                                    }
                                }}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    if (val === "" || parseInt(val, 10) >= 0) {
                                        updateField("qty", val);
                                    }
                                }}
                                onBlur={(e) => {
                                    let val = parseInt(e.target.value, 10);
                                    if (isNaN(val) || val < 1) val = 1;
                                    updateField("qty", val.toString());
                                }}
                                className="w-20 h-9 px-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none shadow-sm font-semibold"
                            />
                        </div>
                    </div>
                </ConfigRow>

                <ConfigRow label="Product Type" tooltip="Specify target operational standard environment.">
                    {["Industrial/Consumer electronics", "Aerospace", "Medical"].map(t => (
                        <Pill
                            key={t}
                            active={formData.productType === t}
                            onClick={() => updateField("productType", t)}
                        >
                            {t}
                        </Pill>
                    ))}
                </ConfigRow>

                {/* Specs Accordion */}
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={() => setSpecsOpen(!specsOpen)}
                        className="w-full flex items-center justify-between px-4 py-2 bg-[#f0f4f8] hover:bg-[#e4ebf3] transition-colors rounded-xs cursor-pointer select-none"
                    >
                        <span className="text-sm font-bold text-gray-900">PCB Specifications</span>
                        {specsOpen ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                    </button>

                    {specsOpen && (
                        <div className="py-2 space-y-1">
                            <ConfigRow label="Different Design">
                                {["1", "2", "3", "4"].map(d => (
                                    <Pill
                                        key={d}
                                        active={formData.differentDesign === d}
                                        onClick={() => updateField("differentDesign", d)}
                                    >
                                        {d}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="PCB Thickness">
                                {["0.6mm", "0.8mm", "1.0mm", "1.2mm", "1.6mm", "2.0mm"].map(t => (
                                    <Pill
                                        key={t}
                                        active={formData.thickness === t}
                                        onClick={() => updateField("thickness", t)}
                                    >
                                        {t}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="PCB Color">
                                <div className="flex flex-wrap gap-2.5">
                                    <ColorCirclePill color="#52c41a" name="Green" active={formData.pcbColor === "#52c41a"} onClick={() => updateField("pcbColor", "#52c41a")} />
                                    <ColorCirclePill color="#722ed1" name="Purple" active={formData.pcbColor === "#722ed1"} onClick={() => updateField("pcbColor", "#722ed1")} />
                                    <ColorCirclePill color="#f5222d" name="Red" active={formData.pcbColor === "#f5222d"} onClick={() => updateField("pcbColor", "#f5222d")} />
                                    <ColorCirclePill color="#fadb14" name="Yellow" active={formData.pcbColor === "#fadb14"} onClick={() => updateField("pcbColor", "#fadb14")} />
                                    <ColorCirclePill color="#1677ff" name="Blue" active={formData.pcbColor === "#1677ff"} onClick={() => updateField("pcbColor", "#1677ff")} />
                                    <ColorCirclePill color="#ffffff" name="White" active={formData.pcbColor === "#ffffff"} onClick={() => updateField("pcbColor", "#ffffff")} />
                                    <ColorCirclePill color="#000000" name="Black" active={formData.pcbColor === "#000000"} onClick={() => updateField("pcbColor", "#000000")} />
                                </div>
                            </ConfigRow>

                            <ConfigRow label="Silkscreen">
                                <Pill
                                    active={formData.silkscreen === "White"}
                                    onClick={() => updateField("silkscreen", "White")}
                                >
                                    White
                                </Pill>
                            </ConfigRow>

                             <ConfigRow label="Material Type">
                                {["FR4 TG135"].map(m => (
                                    <Pill
                                        key={m}
                                        active={(formData.materialType || "FR4 TG135") === m}
                                        onClick={() => updateField("materialType", m)}
                                    >
                                        {m}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="Surface Finish">
                                {["OSP", "HASL(with lead)", "LeadFree HASL", "ENIG"].map(s => (
                                    <Pill
                                        key={s}
                                        active={formData.surfaceFinish === s}
                                        onClick={() => updateField("surfaceFinish", s)}
                                    >
                                        {s}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            {formData.surfaceFinish === "ENIG" && (
                                <ConfigRow label="Gold Thickness">
                                    {["1 U*", "2 U*"].map(gt => (
                                        <Pill
                                            key={gt}
                                            active={(formData.goldThickness || "1 U*") === gt}
                                            onClick={() => updateField("goldThickness", gt)}
                                        >
                                            {gt}
                                        </Pill>
                                    ))}
                                </ConfigRow>
                            )}
                        </div>
                    )}
                </div>

                {/* High-spec Options Accordion */}
                <div className="mt-4">
                    <button
                        type="button"
                        onClick={() => setHighSpecsOpen(!highSpecsOpen)}
                        className="w-full flex items-center justify-between px-4 py-2 bg-[#f0f4f8] hover:bg-[#e4ebf3] transition-colors rounded-xs cursor-pointer select-none"
                    >
                        <span className="text-sm font-bold text-gray-900">High-spec Options</span>
                        {highSpecsOpen ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                    </button>

                    {highSpecsOpen && (
                        <div className="py-2 space-y-1">
                            <ConfigRow label="Outer Copper Weight">
                                {["1 oz", "2 oz", "3.5 oz", "4.5 oz"].map(w => (
                                    <Pill
                                        key={w}
                                        disabled={w === "3.5 oz" || w === "4.5 oz"}
                                        active={formData.copperWeight === w || (w === "1 oz" && (!formData.copperWeight || formData.copperWeight === "1oz"))}
                                        onClick={() => updateField("copperWeight", w)}
                                    >
                                        {w}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="Via Covering">
                                {["Plugged", "Epoxy Filled & Capped", "Copper paste Filled & Capped"].map(v => (
                                    <Pill
                                        key={v}
                                        disabled={v === "Copper paste Filled & Capped"}
                                        active={formData.viaCovering === v}
                                        onClick={() => updateField("viaCovering", v)}
                                    >
                                        {v}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="Via Plating Method">
                                <div className="w-full flex flex-col gap-2">
                                    <div className="flex flex-wrap gap-2.5">
                                        {["Not Specified", "Conductive Adhesive", "Horizontal Electroless Copper Plating"].map(v => (
                                            <Pill
                                                key={v}
                                                active={formData.viaPlating === v}
                                                onClick={() => updateField("viaPlating", v)}
                                            >
                                                {v}
                                            </Pill>
                                        ))}
                                    </div>
                                </div>
                            </ConfigRow>

                            <ConfigRow label="Min via hole size/diameter">
                                {["0.3mm/(0.4/0.45mm)", "0.25mm/(0.35/0.4mm)", "0.2mm/(0.3/0.35mm)", "0.15mm/(0.25/0.3mm)"].map(h => (
                                    <Pill
                                        key={h}
                                        active={formData.minHole === h}
                                        onClick={() => updateField("minHole", h)}
                                    >
                                        {h}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="Gold Fingers">
                                {["No", "Yes"].map(g => (
                                    <Pill
                                        key={g}
                                        active={formData.goldFingers === g}
                                        onClick={() => updateField("goldFingers", g)}
                                    >
                                        {g}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="Castellated Holes">
                                {["No", "Yes"].map(c => (
                                    <Pill
                                        key={c}
                                        active={formData.castellated === c}
                                        onClick={() => updateField("castellated", c)}
                                    >
                                        {c}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="Edge Plating">
                                {["No", "Yes"].map(e => (
                                    <Pill
                                        key={e}
                                        disabled={e === "Yes"}
                                        active={formData.edgePlating === e}
                                        onClick={() => updateField("edgePlating", e)}
                                    >
                                        {e}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="Blind Slots">
                                {["No", "Yes"].map(b => (
                                    <Pill
                                        key={b}
                                        active={formData.blindSlots === b}
                                        onClick={() => updateField("blindSlots", b)}
                                    >
                                        {b}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="UL Marking">
                                {["No", "Yes (Any Position)", "Yes (Specify Position)"].map(u => (
                                    <Pill
                                        key={u}
                                        disabled={u === "Yes (Any Position)" || u === "Yes (Specify Position)"}
                                        active={formData.ulMarking === u}
                                        onClick={() => updateField("ulMarking", u)}
                                    >
                                        {u}
                                    </Pill>
                                ))}
                            </ConfigRow>
                        </div>
                    )}
                </div>

                {/* Advanced Options Accordion */}
                {/* <div className="mt-4">
                    <button
                        type="button"
                        onClick={() => setAdvancedOpen(!advancedOpen)}
                        className="w-full flex items-center justify-between px-4 py-2 bg-[#f0f4f8] hover:bg-[#e4ebf3] transition-colors rounded-xs cursor-pointer select-none"
                    >
                        <span className="text-sm font-bold text-gray-900">Advanced Options</span>
                        {advancedOpen ? <ChevronUp className="w-4 h-4 text-gray-600" /> : <ChevronDown className="w-4 h-4 text-gray-600" />}
                    </button>

                    {advancedOpen && (
                        <div className="py-2 space-y-1">
                            <ConfigRow label="4-Wire Kelvin Test">
                                {["No", "Yes"].map(k => (
                                    <Pill
                                        key={k}
                                        active={formData.kelvinTest === k}
                                        onClick={() => updateField("kelvinTest", k)}
                                    >
                                        {k}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="Paper between PCBs">
                                {["No", "Yes"].map(p => (
                                    <Pill
                                        key={p}
                                        active={formData.paperBetween === p}
                                        onClick={() => updateField("paperBetween", p)}
                                    >
                                        {p}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="Appearance Quality">
                                {["IPC Class 2 Standard", "Superb Quality"].map(q => (
                                    <Pill
                                        key={q}
                                        disabled={q === "Superb Quality"}
                                        active={formData.appearanceQuality === q}
                                        onClick={() => updateField("appearanceQuality", q)}
                                    >
                                        {q}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="Silkscreen Technology">
                                {["Ink-jet Printing Silkscreen", "High-precision Printing Silkscreen", "EasyEDA multi-color silkscreen", "High-definition Exposure Silkscreen"].map(s => (
                                    <Pill
                                        key={s}
                                        disabled={s === "EasyEDA multi-color silkscreen" || s === "High-definition Exposure Silkscreen"}
                                        active={formData.silkscreenTech === s}
                                        onClick={() => updateField("silkscreenTech", s)}
                                    >
                                        {s}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="Inspection Report">
                                {["No", "Final Inspection Report", "Electrical Test Report", "ROHS Test Report"].map(i => (
                                    <Pill
                                        key={i}
                                        disabled={i === "ROHS Test Report"}
                                        active={formData.inspectionReport === i}
                                        onClick={() => updateField("inspectionReport", i)}
                                    >
                                        {i}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <div className="py-2.5">
                                <button
                                    type="button"
                                    onClick={() => setShowRemarkTextarea(!showRemarkTextarea)}
                                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-primary transition-colors cursor-pointer group"
                                >
                                    <span>PCB Remark</span>
                                    <Pencil className="w-3.5 h-3.5 text-gray-400 group-hover:text-primary transition-colors" />
                                </button>

                                {(showRemarkTextarea || formData.pcbRemark) && (
                                    <div className="mt-2.5">
                                        <textarea
                                            rows={3}
                                            value={formData.pcbRemark}
                                            onChange={(e) => updateField("pcbRemark", e.target.value)}
                                            placeholder="Enter additional remarks or request special design specifications here..."
                                            className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-sm transition-all bg-white"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div> */}


            </div>
        </TooltipProvider>
    );
}
