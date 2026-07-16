"use client";

import React, { useState, useRef, useEffect } from "react";
import { Info, Check, ChevronUp, ChevronDown, X } from "lucide-react";
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
        className={`px-3 py-1.5 rounded-lg text-sm font-semibold border flex items-center gap-2 cursor-pointer transition-all ${
            active ? "border-primary bg-primary/10 text-primary" : "border-gray-200 bg-white text-gray-700 hover:border-primary/50"
        }`}
    >
        <span className="w-3.5 h-3.5 rounded-full border border-gray-300" style={{ backgroundColor: color }} />
        {name}
    </button>
);

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

export default function QuoteForm({
    formData,
    setFormData,
    specsOpen,
    setSpecsOpen,
    highSpecsOpen,
    setHighSpecsOpen,
    isUploaded,
    parsedFiles
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
            setFormData(prev => ({ ...prev, width: newW.toFixed(1), height: newH.toFixed(1) }));
        }
    };

    // Keep state track for advanced options accordion
    const [advancedOpen, setAdvancedOpen] = useState(true);

    // Panel by Megabytes options and states
    const [panelColumns, setPanelColumns] = useState(2);
    const [panelRows, setPanelRows] = useState(2);
    const [panelColSpacing, setPanelColSpacing] = useState(0);
    const [panelRowSpacing, setPanelRowSpacing] = useState(0);
    const [panelEdgeRails, setPanelEdgeRails] = useState("No rails");
    const [panelRailWidth, setPanelRailWidth] = useState(5);

    const [showMegabytesModal, setShowMegabytesModal] = useState(false);
    const [tempColumns, setTempColumns] = useState(2);
    const [tempRows, setTempRows] = useState(2);
    const [tempColSpacing, setTempColSpacing] = useState(0);
    const [tempRowSpacing, setTempRowSpacing] = useState(0);
    const [tempEdgeRails, setTempEdgeRails] = useState("No rails");
    const [tempRailWidth, setTempRailWidth] = useState(5);
    const [modalActiveTab, setModalActiveTab] = useState<"outline" | "preview">("outline");
    const [tempModalSide, setTempModalSide] = useState<"top" | "bottom">("top");

    const panelCanvasRef = useRef<HTMLCanvasElement | null>(null);

    const singleWidth = parseFloat(formData.width) || 100;
    const singleHeight = parseFloat(formData.height) || 100;

    const calculatePanelWidth = (cols: number, colSpacing: number, rails: string, railW: number) => {
        let w = (singleWidth * cols) + (colSpacing * (cols - 1));
        if (rails === "On left and right sides" || rails === "On four sides") {
            w += railW * 2;
        }
        return w.toFixed(2);
    };

    const calculatePanelHeight = (rows: number, rowSpacing: number, rails: string, railW: number) => {
        let h = (singleHeight * rows) + (rowSpacing * (rows - 1));
        if (rails === "On top and bottom sides" || rails === "On four sides") {
            h += railW * 2;
        }
        return h.toFixed(2);
    };

    // Helper to draw hollow tool holes and solid fiducial markers inside edge rails
    const drawRailMarkers = (
        ctx: CanvasRenderingContext2D,
        x: number,
        y: number,
        type: "tool-hole" | "fiducial",
        drawScale: number
    ) => {
        ctx.save();
        if (type === "tool-hole") {
            // Hollow drill hole
            ctx.fillStyle = "#111827"; // Dark center matching background
            ctx.strokeStyle = "#808080";
            ctx.lineWidth = 0.5 / drawScale;
            ctx.beginPath();
            ctx.arc(x, y, 1.4, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
        } else {
            // Solid silver fiducial marker
            ctx.fillStyle = "#D9D9D9";
            ctx.beginPath();
            ctx.arc(x, y, 0.7, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    };

    // Draw dynamic panel simulation
    useEffect(() => {
        if (!showMegabytesModal) return;
        const canvas = panelCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "#1E293B"; // Dark slate background
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw panel grid parameters
        const cols = tempColumns;
        const rows = tempRows;
        const colSpacingVal = tempColSpacing;
        const rowSpacingVal = tempRowSpacing;
        const railVal = tempEdgeRails;
        const railW = tempRailWidth;

        const singleW = singleWidth;
        const singleH = singleHeight;

        // Calculate panel dimensions
        let hasLeftRightRails = railVal === "On left and right sides" || railVal === "On four sides";
        let hasTopBottomRails = railVal === "On top and bottom sides" || railVal === "On four sides";

        const totalW = (singleW * cols) + (colSpacingVal * (cols - 1)) + (hasLeftRightRails ? railW * 2 : 0);
        const totalH = (singleH * rows) + (rowSpacingVal * (rows - 1)) + (hasTopBottomRails ? railW * 2 : 0);

        // Calculate scale to fit canvas
        const padding = 24;
        const scaleX = (canvas.width - padding * 2) / totalW;
        const scaleY = (canvas.height - padding * 2) / totalH;
        const drawScale = Math.min(scaleX, scaleY, 2.5); // limit scale

        const offsetLeft = (canvas.width - totalW * drawScale) / 2;
        const offsetTop = (canvas.height - totalH * drawScale) / 2;

        ctx.save();
        ctx.translate(offsetLeft, offsetTop);
        ctx.scale(drawScale, drawScale);

        // Pre-render reference placeholder
        let offscreenCanvas: HTMLCanvasElement | null = null;

        // Draw rail background and borders in green theme if 2D Preview is enabled
        const greenBaseTheme = "#1F7A35";
        const outlineTheme = "#C5C5C5";

        if (modalActiveTab === "preview") {
            ctx.fillStyle = greenBaseTheme;
            ctx.strokeStyle = outlineTheme;
            ctx.lineWidth = 1 / drawScale;
            // Draw background rectangle for the entire panel board
            ctx.beginPath();
            ctx.rect(0, 0, totalW, totalH);
            ctx.fill();
            ctx.stroke();
        }

        // Draw Edge Rails outlines/rectangles
        if (hasTopBottomRails) {
            if (modalActiveTab === "outline") {
                ctx.fillStyle = "rgba(229, 193, 88, 0.12)";
                ctx.fillRect(0, 0, totalW, railW);
                ctx.fillRect(0, totalH - railW, totalW, railW);

                ctx.strokeStyle = "#e5c158";
                ctx.lineWidth = 1 / drawScale;
                ctx.strokeRect(0, 0, totalW, railW);
                ctx.strokeRect(0, totalH - railW, totalW, railW);
            } else {
                // Overlay darker green separators or draw edge rails boundary
                ctx.fillStyle = "#155D27";
                ctx.fillRect(0, 0, totalW, railW);
                ctx.fillRect(0, totalH - railW, totalW, railW);
            }

            const topY = railW / 2;
            const bottomY = totalH - railW / 2;

            // Draw top rail markers (hollow drill + solid fiducial)
            drawRailMarkers(ctx, totalW * 0.15, topY, "tool-hole", drawScale);
            drawRailMarkers(ctx, totalW * 0.15 + 5, topY, "fiducial", drawScale);
            drawRailMarkers(ctx, totalW * 0.85 - 5, topY, "fiducial", drawScale);
            drawRailMarkers(ctx, totalW * 0.85, topY, "tool-hole", drawScale);

            // Draw bottom rail markers (solid fiducial + hollow drill)
            drawRailMarkers(ctx, totalW * 0.15, bottomY, "tool-hole", drawScale);
            drawRailMarkers(ctx, totalW * 0.15 + 5, bottomY, "fiducial", drawScale);
            drawRailMarkers(ctx, totalW * 0.85 - 5, bottomY, "fiducial", drawScale);
            drawRailMarkers(ctx, totalW * 0.85, bottomY, "tool-hole", drawScale);
        }

        if (hasLeftRightRails) {
            if (modalActiveTab === "outline") {
                ctx.fillStyle = "rgba(229, 193, 88, 0.12)";
                ctx.fillRect(0, 0, railW, totalH);
                ctx.fillRect(totalW - railW, 0, railW, totalH);

                ctx.strokeStyle = "#e5c158";
                ctx.lineWidth = 1 / drawScale;
                ctx.strokeRect(0, 0, railW, totalH);
                ctx.strokeRect(totalW - railW, 0, railW, totalH);
            } else {
                ctx.fillStyle = "#155D27";
                ctx.fillRect(0, 0, railW, totalH);
                ctx.fillRect(totalW - railW, 0, railW, totalH);
            }

            const leftX = railW / 2;
            const rightX = totalW - railW / 2;

            // Draw left rail markers
            drawRailMarkers(ctx, leftX, totalH * 0.15, "tool-hole", drawScale);
            drawRailMarkers(ctx, leftX, totalH * 0.15 + 5, "fiducial", drawScale);
            drawRailMarkers(ctx, leftX, totalH * 0.85 - 5, "fiducial", drawScale);
            drawRailMarkers(ctx, leftX, totalH * 0.85, "tool-hole", drawScale);

            // Draw right rail markers
            drawRailMarkers(ctx, rightX, totalH * 0.15, "tool-hole", drawScale);
            drawRailMarkers(ctx, rightX, totalH * 0.15 + 5, "fiducial", drawScale);
            drawRailMarkers(ctx, rightX, totalH * 0.85 - 5, "fiducial", drawScale);
            drawRailMarkers(ctx, rightX, totalH * 0.85, "tool-hole", drawScale);
        }

        // Draw individual boards inside grid boundaries
        const startX = hasLeftRightRails ? railW : 0;
        const startY = hasTopBottomRails ? railW : 0;

        for (let c = 0; c < cols; c++) {
            for (let r = 0; r < rows; r++) {
                const bx = startX + c * (singleW + colSpacingVal);
                const by = startY + r * (singleH + rowSpacingVal);

                if (modalActiveTab === "outline") {
                    ctx.strokeStyle = "#ec4899"; // Pink outline
                    ctx.lineWidth = 1.5 / drawScale;
                    ctx.strokeRect(bx, by, singleW, singleH);
                } else {
                    if (offscreenCanvas) {
                        ctx.drawImage(offscreenCanvas, bx, by, singleW, singleH);
                    } else {
                        // Fallback green PCB
                        ctx.fillStyle = greenBaseTheme; 
                        ctx.fillRect(bx, by, singleW, singleH);
                        ctx.strokeStyle = "#155D27";
                        ctx.lineWidth = 1 / drawScale;
                        ctx.strokeRect(bx, by, singleW, singleH);
                    }
                }
            }
        }

        ctx.restore();
    }, [showMegabytesModal, tempColumns, tempRows, tempColSpacing, tempRowSpacing, tempEdgeRails, tempRailWidth, modalActiveTab, tempModalSide, singleWidth, singleHeight, parsedFiles, formData.pcbColor]);

    const handleModalSubmit = () => {
        setPanelColumns(tempColumns);
        setPanelRows(tempRows);
        setPanelColSpacing(tempColSpacing);
        setPanelRowSpacing(tempRowSpacing);
        setPanelEdgeRails(tempEdgeRails);
        setPanelRailWidth(tempRailWidth);
        setShowMegabytesModal(false);
    };

    const handleModalCancel = () => {
        setTempColumns(panelColumns);
        setTempRows(panelRows);
        setTempColSpacing(panelColSpacing);
        setTempRowSpacing(panelRowSpacing);
        setTempEdgeRails(panelEdgeRails);
        setTempRailWidth(panelRailWidth);
        setShowMegabytesModal(false);
    };

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
                            className={`w-24 h-9 px-3 border border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-sm transition-all ${
                                isUploaded ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-100" : ""
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
                            className={`w-24 h-9 px-3 border border-gray-200 rounded-xl text-sm focus:border-primary focus:ring-1 focus:ring-primary outline-none shadow-sm transition-all ${
                                isUploaded ? "bg-gray-100 text-gray-500 cursor-not-allowed border-gray-100" : ""
                            }`}
                        />
                        <select
                            value={formData.unit}
                            onChange={(e) => updateField("unit", e.target.value)}
                            disabled={isUploaded}
                            className={`h-9 px-3 border border-gray-200 rounded-xl text-sm focus:border-primary outline-none bg-white shadow-sm font-semibold text-gray-700 ${
                                isUploaded ? "bg-gray-100 text-gray-400 cursor-not-allowed border-gray-100" : ""
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

                            <ConfigRow label="Delivery Format">
                                {["Single PCB", "Panel by Customer", "Panel by Megabytes"].map(d => (
                                    <Pill
                                        key={d}
                                        active={formData.deliveryFormat === d}
                                        onClick={() => {
                                            updateField("deliveryFormat", d);
                                            if (d === "Panel by Megabytes") {
                                                setShowMegabytesModal(true);
                                            }
                                        }}
                                    >
                                        {d}
                                    </Pill>
                                ))}
                            </ConfigRow>

                            {formData.deliveryFormat === "Single PCB" && (
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
                            )}

                            {formData.deliveryFormat === "Panel by Customer" && (
                                <ConfigRow label="Panel Format">
                                    <div className="w-full flex flex-col gap-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-700">
                                            <span className="font-semibold">Column:</span>
                                            <input
                                                type="number"
                                                value={panelColumns}
                                                onChange={(e) => setPanelColumns(parseInt(e.target.value) || 1)}
                                                className="w-16 h-8 px-2 border border-gray-200 rounded text-center outline-none focus:border-primary font-bold"
                                            />
                                            <span className="ml-4 font-semibold">Row:</span>
                                            <input
                                                type="number"
                                                value={panelRows}
                                                onChange={(e) => setPanelRows(parseInt(e.target.value) || 1)}
                                                className="w-16 h-8 px-2 border border-gray-200 rounded text-center outline-none focus:border-primary font-bold"
                                            />
                                        </div>
                                        <div className="text-xs text-red-500 font-bold mt-1.5">
                                            *You supply the panel data. If need us to panelize your board, pls select "Panel by Megabytes" option.
                                        </div>
                                    </div>
                                </ConfigRow>
                            )}

                            {formData.deliveryFormat === "Panel by Megabytes" && (
                                <ConfigRow label="Panel Configuration">
                                    <div className="flex flex-col gap-2 text-xs text-gray-600 font-semibold bg-blue-50/50 border border-blue-100 rounded-xl p-3">
                                        <div className="flex justify-between">
                                            <span>Panel Format:</span>
                                            <span className="text-gray-900 font-bold">{panelColumns} Columns × {panelRows} Rows</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Panel Spacing:</span>
                                            <span className="text-gray-900 font-bold">{panelColSpacing}mm × {panelRowSpacing}mm</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Edge Rails:</span>
                                            <span className="text-gray-900 font-bold">{panelEdgeRails} ({panelRailWidth}mm)</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setShowMegabytesModal(true)}
                                            className="text-primary hover:underline text-[10px] font-bold self-start mt-1 cursor-pointer"
                                        >
                                            Edit Panelization Setup &gt;
                                        </button>
                                    </div>
                                </ConfigRow>
                            )}

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

                            <ConfigRow label="Package Box">
                                {["With JLCPCB logo", "Blank box"].map(p => (
                                    <Pill
                                        key={p}
                                        active={formData.packageBox === p}
                                        onClick={() => updateField("packageBox", p)}
                                    >
                                        {p}
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

                {/* Panel by Megabytes Configuration Modal Popup */}
                {showMegabytesModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl w-full max-w-[1000px] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-gray-150 animate-in fade-in zoom-in duration-200">
                            {/* Left Controls Column */}
                            <div className="flex-1 p-6 overflow-y-auto max-h-[90vh] md:max-h-[600px] space-y-6">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                    <h3 className="text-base font-bold text-gray-900">Panel by Megabytes</h3>
                                    <button
                                        type="button"
                                        onClick={handleModalCancel}
                                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-slate-100 cursor-pointer"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="space-y-4 text-sm">
                                    {/* Single Piece Size */}
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="font-semibold text-gray-600 text-xs">Size(Single piece)</span>
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="number"
                                                disabled
                                                value={singleWidth}
                                                className="w-16 h-8 border border-gray-200 rounded text-center bg-slate-50 text-gray-500 font-semibold"
                                            />
                                            <span className="text-gray-400 text-xs">mm</span>
                                            <span className="text-gray-400 mx-1">*</span>
                                            <input
                                                type="number"
                                                disabled
                                                value={singleHeight}
                                                className="w-16 h-8 border border-gray-200 rounded text-center bg-slate-50 text-gray-500 font-semibold"
                                            />
                                            <span className="text-gray-400 text-xs">mm</span>
                                        </div>
                                    </div>

                                    {/* Panel Type */}
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="font-semibold text-gray-600 text-xs">Panel Type</span>
                                        <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-600 font-bold text-xs rounded uppercase">
                                            V-CUT
                                        </span>
                                    </div>

                                    {/* Panel Format (Col x Row) */}
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="font-semibold text-gray-600 text-xs">Panel Format</span>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-gray-500">Column</span>
                                                <input
                                                    type="number"
                                                    value={tempColumns}
                                                    onChange={(e) => setTempColumns(Math.max(1, parseInt(e.target.value) || 1))}
                                                    className="w-12 h-8 border border-gray-250 rounded text-center outline-none focus:border-primary font-bold"
                                                />
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs text-gray-500">Row</span>
                                                <input
                                                    type="number"
                                                    value={tempRows}
                                                    onChange={(e) => setTempRows(Math.max(1, parseInt(e.target.value) || 1))}
                                                    className="w-12 h-8 border border-gray-250 rounded text-center outline-none focus:border-primary font-bold"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Spacing (Col & Row spacing) */}
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="font-semibold text-gray-600 text-xs">Panel Spacing</span>
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-gray-500">Col Space</span>
                                                <input
                                                    type="number"
                                                    value={tempColSpacing}
                                                    onChange={(e) => setTempColSpacing(Math.max(0, parseFloat(e.target.value) || 0))}
                                                    className="w-12 h-8 border border-gray-250 rounded text-center outline-none focus:border-primary font-bold"
                                                />
                                                <span className="text-gray-400 text-[10px]">mm</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <span className="text-xs text-gray-500">Row Space</span>
                                                <input
                                                    type="number"
                                                    value={tempRowSpacing}
                                                    onChange={(e) => setTempRowSpacing(Math.max(0, parseFloat(e.target.value) || 0))}
                                                    className="w-12 h-8 border border-gray-250 rounded text-center outline-none focus:border-primary font-bold"
                                                />
                                                <span className="text-gray-400 text-[10px]">mm</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Edge Rails */}
                                    <div className="flex items-center justify-between gap-4">
                                        <span className="font-semibold text-gray-600 text-xs">Edge Rails</span>
                                        <select
                                            value={tempEdgeRails}
                                            onChange={(e) => setTempEdgeRails(e.target.value)}
                                            className="h-8 px-2 border border-gray-250 rounded text-xs outline-none bg-white font-semibold text-gray-700 w-44"
                                        >
                                            <option value="No rails">No rails</option>
                                            <option value="On top and bottom sides">On top and bottom sides</option>
                                            <option value="On left and right sides">On left and right sides</option>
                                            <option value="On four sides">On four sides</option>
                                        </select>
                                    </div>

                                    {/* Rail Width (displayed only when rails are active) */}
                                    {tempEdgeRails !== "No rails" && (
                                        <div className="flex items-center justify-between gap-4 animate-in slide-in-from-top-1 duration-150">
                                            <span className="font-semibold text-gray-600 text-xs">Rail Width</span>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="number"
                                                    value={tempRailWidth}
                                                    onChange={(e) => setTempRailWidth(Math.max(1, parseInt(e.target.value) || 1))}
                                                    className="w-16 h-8 border border-gray-250 rounded text-center outline-none focus:border-primary font-bold"
                                                />
                                                <span className="text-gray-400 text-xs">mm</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Calculated Panel size */}
                                    <div className="flex items-center justify-between gap-4 pt-2 border-t border-slate-100">
                                        <span className="font-semibold text-gray-600 text-xs">Panel size</span>
                                        <div className="text-sm font-bold text-gray-800">
                                            {calculatePanelWidth(tempColumns, tempColSpacing, tempEdgeRails, tempRailWidth)} mm × {calculatePanelHeight(tempRows, tempRowSpacing, tempEdgeRails, tempRailWidth)} mm
                                        </div>
                                    </div>

                                    <div className="text-[10px] text-red-500 font-bold leading-normal pt-1">
                                        The panel size should be at least 70x70mm and cannot exceed 475x475mm.
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleModalSubmit}
                                        className="flex-1 py-2 bg-primary hover:bg-secondary text-white font-bold rounded-lg text-xs shadow transition-all active:scale-[0.98] cursor-pointer"
                                    >
                                        Submit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleModalCancel}
                                        className="flex-1 py-2 bg-white hover:bg-slate-50 text-gray-600 border border-gray-250 font-bold rounded-lg text-xs transition-all active:scale-[0.98] cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>

                            {/* Right Visualization Diagram Column */}
                            <div className="w-full md:w-[480px] bg-[#1E293B] flex flex-col p-4 shrink-0 justify-between">
                                {/* Tab switch */}
                                <div className="flex justify-between items-center mb-3 w-full bg-slate-800 p-1 rounded-lg">
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setModalActiveTab("outline")}
                                            className={`px-3 py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                                                modalActiveTab === "outline" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-200"
                                            }`}
                                        >
                                            Board Outline
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setModalActiveTab("preview")}
                                            className={`px-3 py-1 text-[11px] font-bold rounded transition-all cursor-pointer ${
                                                modalActiveTab === "preview" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-200"
                                            }`}
                                        >
                                            2D Preview
                                        </button>
                                    </div>
                                    <div className="flex gap-1 border border-slate-700 bg-slate-900/60 p-0.5 rounded-md mr-1">
                                        <button
                                            type="button"
                                            onClick={() => setTempModalSide("top")}
                                            className={`px-2.5 py-0.5 text-[9px] font-bold rounded transition-all cursor-pointer ${
                                                tempModalSide === "top" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-200"
                                            }`}
                                        >
                                            Top
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTempModalSide("bottom")}
                                            className={`px-2.5 py-0.5 text-[9px] font-bold rounded transition-all cursor-pointer ${
                                                tempModalSide === "bottom" ? "bg-white text-gray-900 shadow-sm" : "text-gray-400 hover:text-gray-200"
                                            }`}
                                        >
                                            Bottom
                                        </button>
                                    </div>
                                </div>

                                {/* Vector Canvas */}
                                <div className="flex-1 flex items-center justify-center">
                                    <canvas
                                        ref={panelCanvasRef}
                                        width={400}
                                        height={320}
                                        className="max-w-full h-auto rounded-lg shadow-inner bg-slate-950 border border-slate-800"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </TooltipProvider>
    );
}
