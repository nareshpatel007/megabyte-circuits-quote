"use client";

import React from "react";
import { Info, Check, ChevronUp, ChevronDown } from "lucide-react";
import { QuoteFormData } from "../../lib/gerber/types";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

interface QuoteFormProps {
    formData: QuoteFormData;
    setFormData: React.Dispatch<React.SetStateAction<QuoteFormData>>;
    specsOpen: boolean;
    setSpecsOpen: (val: boolean) => void;
    highSpecsOpen: boolean;
    setHighSpecsOpen: (val: boolean) => void;
}

const Pill = ({
    active,
    children,
    onClick,
    activeColor = "blue",
    badge
}: {
    active: boolean;
    children: React.ReactNode;
    onClick: () => void;
    activeColor?: "blue" | "orange" | "green";
    badge?: string;
}) => {
    const baseClasses = "px-4 py-1.5 rounded-lg text-sm font-semibold transition-all relative border cursor-pointer";
    const colors = {
        blue: "border-primary bg-primary/10 text-primary",
        orange: "border-[#f5821f] bg-[#fff5eb] text-[#f5821f]",
        green: "border-[#52c41a] bg-[#f6ffed] text-[#52c41a]"
    };
    const inactiveClasses = "border-gray-200 bg-white text-gray-700 hover:border-primary/50 hover:text-primary";
    return (
        <button
            type="button"
            onClick={onClick}
            className={`${baseClasses} ${active ? colors[activeColor] : inactiveClasses}`}
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

const ConfigRow = ({ label, children, tooltip }: { label: string; children: React.ReactNode; tooltip?: string }) => (
    <div className="flex flex-col sm:flex-row py-4 border-b border-slate-100 gap-4 sm:gap-0">
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

const ColorCircle = ({ color, active, onClick, checkColor = "white" }: any) => (
    <button
        type="button"
        onClick={onClick}
        className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer ${active ? "border-primary scale-110 shadow-md" : "border-transparent shadow hover:scale-115"
            }`}
        style={{ backgroundColor: color }}
    >
        {active && <Check className="w-4 h-4" style={{ color: checkColor }} />}
    </button>
);

export default function QuoteForm({
    formData,
    setFormData,
    specsOpen,
    setSpecsOpen,
    highSpecsOpen,
    setHighSpecsOpen
}: QuoteFormProps) {
    const updateField = (field: keyof QuoteFormData, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <TooltipProvider>
            <div className="space-y-1">
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
                    {["1", "2", "4", "6", "8", "10", "12", "14", "16"].map(l => (
                        <Pill
                            key={l}
                            active={formData.layers === l}
                            onClick={() => updateField("layers", l)}
                            badge={l === "4" ? "High Precision" : undefined}
                        >
                            {l}
                        </Pill>
                    ))}
                </ConfigRow>

                <ConfigRow label="Dimensions" tooltip="Input custom board dimensions in millimeters or inches.">
                    <div className="flex items-center gap-2.5">
                        <input
                            type="number"
                            value={formData.width}
                            onChange={(e) => updateField("width", e.target.value)}
                            placeholder="100"
                            className="w-24 h-9 px-3 border border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-sm transition-all"
                        />
                        <span className="text-gray-400 font-semibold">×</span>
                        <input
                            type="number"
                            value={formData.height}
                            onChange={(e) => updateField("height", e.target.value)}
                            placeholder="100"
                            className="w-24 h-9 px-3 border border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-sm transition-all"
                        />
                        <select
                            value={formData.unit}
                            onChange={(e) => updateField("unit", e.target.value)}
                            className="h-9 px-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none bg-white shadow-sm font-semibold text-gray-700"
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

                            <ConfigRow label="Delivery Format">
                                {["Single PCB", "Panel by Customer", "Panel by Megabyte"].map(d => (
                                    <Pill
                                        key={d}
                                        active={formData.deliveryFormat === d}
                                        onClick={() => updateField("deliveryFormat", d)}
                                    >
                                        {d}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="PCB Thickness">
                                {["0.4mm", "0.6mm", "0.8mm", "1.0mm", "1.2mm", "1.6mm", "2.0mm"].map(t => (
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
                                <div className="flex gap-3">
                                    <ColorCircle color="#52c41a" active={formData.pcbColor === "#52c41a"} onClick={() => updateField("pcbColor", "#52c41a")} />
                                    <ColorCircle color="#722ed1" active={formData.pcbColor === "#722ed1"} onClick={() => updateField("pcbColor", "#722ed1")} />
                                    <ColorCircle color="#f5222d" active={formData.pcbColor === "#f5222d"} onClick={() => updateField("pcbColor", "#f5222d")} />
                                    <ColorCircle color="#fadb14" active={formData.pcbColor === "#fadb14"} onClick={() => updateField("pcbColor", "#fadb14")} checkColor="black" />
                                    <ColorCircle color="#1677ff" active={formData.pcbColor === "#1677ff"} onClick={() => updateField("pcbColor", "#1677ff")} />
                                    <ColorCircle color="#ffffff" active={formData.pcbColor === "#ffffff"} onClick={() => updateField("pcbColor", "#ffffff")} checkColor="black" />
                                    <ColorCircle color="#000000" active={formData.pcbColor === "#000000"} onClick={() => updateField("pcbColor", "#000000")} />
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
                                {["FR4-TG135", "KB6164-TG135", "Nan Ya NP-140F", "S1141-TG140", "S1000H-TG155"].map(m => (
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
                                {["1oz", "2oz", "3oz", "4oz"].map(w => (
                                    <Pill
                                        key={w}
                                        active={formData.copperWeight === w}
                                        onClick={() => updateField("copperWeight", w)}
                                    >
                                        {w}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="Via Covering">
                                {["Not Specified", "Tented", "Untented", "Plugged", "Epoxy Filled & Capped"].map(v => (
                                    <Pill
                                        key={v}
                                        active={formData.viaCovering === v}
                                        onClick={() => updateField("viaCovering", v)}
                                    >
                                        {v}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="Via Plating Method">
                                {["Not Specified", "Conductive Adhesive", "Horizontal Electroless Copper"].map(v => (
                                    <Pill
                                        key={v}
                                        active={formData.viaPlating === v}
                                        onClick={() => updateField("viaPlating", v)}
                                    >
                                        {v}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            <ConfigRow label="Electrical Test">
                                {["Flying Probe Fully Test", "Not Tested"].map(t => (
                                    <Pill
                                        key={t}
                                        active={formData.elecTest === t}
                                        onClick={() => updateField("elecTest", t)}
                                    >
                                        {t}
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
                        </div>
                    )}
                </div>
            </div>
        </TooltipProvider>
    );
}
