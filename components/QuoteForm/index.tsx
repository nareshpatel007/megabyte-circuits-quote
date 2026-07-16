"use client";

import React, { useState, useRef, useEffect } from "react";
import { Info, Check, ChevronUp, ChevronDown } from "lucide-react";
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

    // Keep state track for advanced options accordion
    const [advancedOpen, setAdvancedOpen] = useState(true);



    const singleWidth = parseFloat(formData.width) || 100;
    const singleHeight = parseFloat(formData.height) || 100;



    return (
        <TooltipProvider>
            <div className="space-y-4">

                {/* Basic specs */}
                <ConfigRow label="Base Material" tooltip="Standard FR-4 is recommended for most digital circuit designs.">
                    {["FR-4", "Flex", "Aluminum", "Rogers", "PTFE Teflon"].map(m => (
                        <Pill
                            key={m}
                            active={formData.baseMaterial === m}
                            onClick={() => updateField("baseMaterial", m)}
                        >
                            {m}
                        </Pill>
                    ))}
                </ConfigRow>

                <ConfigRow label="Layers" tooltip="Total layers count. Matches coordinates in drill outline files.">
                    <div className="flex items-center gap-2">
                        {["1", "2"].map(l => (
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

                    <div className="flex flex-wrap items-center gap-2.5 px-3 py-1.5 bg-[#fefce8]/60 border border-yellow-400 rounded-lg shadow-sm">
                        <span className="text-xs font-bold text-amber-700 flex items-center gap-1">
                            ✨ High Precision PCB
                        </span>
                        <div className="flex items-center gap-1.5">
                            {["4", "6", "8", "10", "12", "14", "16"].map(l => (
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
                            value={formData.width}
                            onChange={(e) => updateField("width", e.target.value)}
                            onBlur={(e) => validateDimensions(parseFloat(e.target.value) || 0, parseFloat(formData.height) || 0, parseInt(formData.layers))}
                            placeholder="100"
                            readOnly={isUploaded}
                            className={`w-24 h-9 px-3 border border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-sm transition-all ${isUploaded ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-100" : ""
                                }`}
                        />
                        <span className="text-gray-400 font-semibold">×</span>
                        <input
                            type="number"
                            value={formData.height}
                            onChange={(e) => updateField("height", e.target.value)}
                            onBlur={(e) => validateDimensions(parseFloat(formData.width) || 0, parseFloat(e.target.value) || 0, parseInt(formData.layers))}
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

                <ConfigRow label="PCB Qty" tooltip="Order quantities. Higher volumes reduce unit costs substantially.">
                    <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={formData.qty}
                            onChange={(e) => updateField("qty", e.target.value)}
                            className="w-24 h-9 px-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none shadow-sm font-semibold"
                        />
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
                <div className="mt-8 border border-gray-200/80 rounded-2xl overflow-hidden shadow-sm bg-white">
                    <button
                        type="button"
                        onClick={() => setSpecsOpen(!specsOpen)}
                        className="w-full flex items-center justify-between px-6 py-4.5 bg-slate-50/60 hover:bg-slate-50 transition-colors border-b border-gray-200/80 cursor-pointer"
                    >
                        <span className="text-sm font-bold text-slate-800">PCB Specifications</span>
                        {specsOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                    </button>

                    {specsOpen && (
                        <div className="p-6 pt-2 space-y-1">
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
                                {["0.4mm", "0.6mm", "0.8mm", "1.0mm", "1.2mm", "1.6mm", "2.0mm"].map(t => (
                                    <Pill
                                        key={t}
                                        disabled={t === "0.6mm"}
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
                                {["FR4 TG135", "KB6164 - TG135", "Nan Ya NP-140F", "S1141 TG140", "S1000H TG155"].map(m => (
                                    <Pill
                                        key={m}
                                        active={formData.materialType === m}
                                        onClick={() => updateField("materialType", m)}
                                    >
                                        {m}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="Surface Finish">
                                {["HASL(with lead)", "LeadFree HASL", "ENIG"].map(s => (
                                    <Pill
                                        key={s}
                                        active={formData.surfaceFinish === s}
                                        onClick={() => updateField("surfaceFinish", s)}
                                    >
                                        {s}
                                    </Pill>
                                ))}
                            </ConfigRow>
                        </div>
                    )}
                </div>

                {/* High-spec Options Accordion */}
                <div className="mt-4 border border-gray-200/80 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <button
                        type="button"
                        onClick={() => setHighSpecsOpen(!highSpecsOpen)}
                        className="w-full flex items-center justify-between px-6 py-4.5 bg-slate-50/60 hover:bg-slate-50 transition-colors border-b border-gray-200/80 cursor-pointer"
                    >
                        <span className="text-sm font-bold text-slate-800">High-spec Options</span>
                        {highSpecsOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                    </button>

                    {highSpecsOpen && (
                        <div className="p-6 pt-2 space-y-1">
                            <ConfigRow label="Outer Copper Weight">
                                {["1 oz", "2 oz", "2.5 oz", "3.5 oz", "4.5 oz"].map(w => (
                                    <Pill
                                        key={w}
                                        disabled={w === "2.5 oz" || w === "3.5 oz" || w === "4.5 oz"}
                                        active={formData.copperWeight === w}
                                        onClick={() => updateField("copperWeight", w)}
                                    >
                                        {w}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="Via Covering">
                                {["Tented", "Untented", "Plugged", "Epoxy Filled & Capped", "Copper paste Filled & Capped"].map(v => (
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
                                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-gray-500 flex items-center justify-between">
                                        <span>Epoxy-filled or copper-paste-filled vias require Horizontal Electroless Copper Plating.</span>
                                        <button type="button" className="text-gray-400 hover:text-gray-600 text-sm font-bold">×</button>
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

                            <ConfigRow label="Board Outline Tolerance">
                                {["±0.2mm(Regular)", "±0.1mm(Precision)"].map(t => (
                                    <Pill
                                        key={t}
                                        active={formData.tolerance === t}
                                        onClick={() => updateField("tolerance", t)}
                                    >
                                        {t}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="Confirm Production file">
                                {["No", "Yes"].map(c => (
                                    <Pill
                                        key={c}
                                        active={formData.confirmFile === c}
                                        onClick={() => updateField("confirmFile", c)}
                                    >
                                        {c}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="Mark on PCB">
                                {["Remove Mark", "2D barcode (Serial Number)"].map(m => (
                                    <Pill
                                        key={m}
                                        active={formData.markOnPcb === m}
                                        onClick={() => updateField("markOnPcb", m)}
                                    >
                                        {m}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="Electrical Test">
                                <Pill
                                    active={formData.elecTest === "Flying Probe Fully Test"}
                                    onClick={() => updateField("elecTest", "Flying Probe Fully Test")}
                                >
                                    Flying Probe Fully Test
                                </Pill>
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

                            <ConfigRow label="Humidity Indicator Card">
                                {["No", "Yes"].map(h => (
                                    <Pill
                                        key={h}
                                        active={formData.humidity === h}
                                        onClick={() => updateField("humidity", h)}
                                    >
                                        {h}
                                    </Pill>
                                ))}
                            </ConfigRow>
                        </div>
                    )}
                </div>

                {/* Advanced Options Accordion */}
                <div className="mt-4 border border-gray-200/80 rounded-2xl overflow-hidden bg-white shadow-sm">
                    <button
                        type="button"
                        onClick={() => setAdvancedOpen(!advancedOpen)}
                        className="w-full flex items-center justify-between px-6 py-4.5 bg-slate-50/60 hover:bg-slate-50 transition-colors border-b border-gray-200/80 cursor-pointer"
                    >
                        <span className="text-sm font-bold text-slate-800">Advanced Options</span>
                        {advancedOpen ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                    </button>

                    {advancedOpen && (
                        <div className="p-6 pt-2 space-y-1">
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

                            <div className="flex flex-col py-4 gap-2">
                                <label className="text-sm text-gray-600 font-semibold flex items-center gap-1">
                                    PCB Remark 📝
                                </label>
                                <textarea
                                    rows={3}
                                    value={formData.pcbRemark}
                                    onChange={(e) => updateField("pcbRemark", e.target.value)}
                                    placeholder="Enter additional remarks or request special design specifications here..."
                                    className="w-full p-3 border border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-sm transition-all"
                                />
                            </div>
                        </div>
                    )}
                </div>


            </div>
        </TooltipProvider>
    );
}
