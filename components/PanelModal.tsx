"use me-strict";
import React, { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";

interface PanelModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: {
        panelType: string;
        panelColumn: string;
        panelRow: string;
        columnSpacing: string;
        rowSpacing: string;
        edgeRails: string;
    }) => void;
    singleWidth: string;
    singleHeight: string;
    initialColumn?: string;
    initialRow?: string;
}

export const PanelModal: React.FC<PanelModalProps> = ({
    isOpen,
    onClose,
    onSubmit,
    singleWidth,
    singleHeight,
    initialColumn = "1",
    initialRow = "1",
}) => {
    const [panelType, setPanelType] = useState("V-CUT");
    const [panelColumn, setPanelColumn] = useState(initialColumn || "1");
    const [panelRow, setPanelRow] = useState(initialRow || "1");
    const [columnSpacing, setColumnSpacing] = useState("0");
    const [rowSpacing, setRowSpacing] = useState("0");
    const [edgeRails, setEdgeRails] = useState("No rails");
    const [activeTab, setActiveTab] = useState<"outline" | "preview">("outline");
    const [isRendering, setIsRendering] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setIsRendering(true);
            const timer = setTimeout(() => setIsRendering(false), 600);
            return () => clearTimeout(timer);
        }
    }, [isOpen, panelColumn, panelRow, edgeRails, columnSpacing, rowSpacing]);

    if (!isOpen) return null;

    const sWidth = parseFloat(singleWidth) || 91.62;
    const sHeight = parseFloat(singleHeight) || 54.35;
    const colCount = Math.max(1, parseInt(panelColumn) || 1);
    const rowCount = Math.max(1, parseInt(panelRow) || 1);
    const colSpace = parseFloat(columnSpacing) || 0;
    const rSpace = parseFloat(rowSpacing) || 0;

    let railW = 0;
    let railH = 0;
    if (edgeRails === "On top and bottom sides") railH = 5;
    else if (edgeRails === "On left and right sides") railW = 5;
    else if (edgeRails === "On four sides") { railW = 5; railH = 5; }

    const calcPanelWidth = (sWidth * colCount + colSpace * (colCount - 1) + railW * 2).toFixed(2);
    const calcPanelHeight = (sHeight * rowCount + rSpace * (rowCount - 1) + railH * 2).toFixed(2);

    const isSizeWarning =
        parseFloat(calcPanelWidth) < 70 ||
        parseFloat(calcPanelHeight) < 70 ||
        parseFloat(calcPanelWidth) > 475 ||
        parseFloat(calcPanelHeight) > 475;

    const handleFormSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({
            panelType,
            panelColumn,
            panelRow,
            columnSpacing,
            rowSpacing,
            edgeRails,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row border border-slate-200 max-h-[90vh]">
                
                {/* Left Side: Form Controls */}
                <div className="w-full md:w-1/2 p-6 overflow-y-auto space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <h3 className="text-lg font-bold text-slate-800">Panel by Megabyte Circuit</h3>
                    </div>

                    <form onSubmit={handleFormSubmit} className="space-y-4 text-xs font-semibold text-slate-700">
                        
                        {/* Size (Single piece) */}
                        <div className="flex items-center gap-2">
                            <span className="w-32 shrink-0 text-slate-600">Size(Single piece)</span>
                            <div className="flex items-center gap-1.5 flex-1">
                                <div className="flex items-center bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5 text-slate-500 font-mono w-24">
                                    <span>{singleWidth || "91.62"}</span>
                                    <span className="ml-auto text-[10px] text-slate-400">mm</span>
                                </div>
                                <span className="text-slate-400 font-bold">*</span>
                                <div className="flex items-center bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5 text-slate-500 font-mono w-24">
                                    <span>{singleHeight || "54.35"}</span>
                                    <span className="ml-auto text-[10px] text-slate-400">mm</span>
                                </div>
                            </div>
                        </div>

                        {/* Panel Type */}
                        <div className="flex items-center gap-2">
                            <span className="w-32 shrink-0 text-slate-600">Panel Type</span>
                            <button
                                type="button"
                                className="px-3 py-1 rounded bg-primary/10 border border-primary text-primary font-bold text-xs"
                            >
                                {panelType}
                            </button>
                        </div>

                        {/* Panel Format (Column & Row) */}
                        <div className="flex items-start gap-2">
                            <span className="w-32 shrink-0 text-slate-600 pt-1.5">Panel Format</span>
                            <div className="flex-1 space-y-2">
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[11px] text-slate-500 font-normal mb-1">Column</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="30"
                                            value={panelColumn}
                                            onChange={(e) => setPanelColumn(e.target.value)}
                                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-slate-800 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-slate-500 font-normal mb-1">Row</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="30"
                                            value={panelRow}
                                            onChange={(e) => setPanelRow(e.target.value)}
                                            className="w-full px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-slate-800 font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div>
                                        <label className="block text-[11px] text-slate-500 font-normal mb-1">Column Spacing</label>
                                        <div className="flex items-center border border-slate-300 rounded overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                value={columnSpacing}
                                                onChange={(e) => setColumnSpacing(e.target.value)}
                                                className="w-full px-2 py-1 focus:outline-none text-slate-800 font-mono"
                                            />
                                            <span className="bg-slate-50 text-slate-400 px-2 py-1 text-[10px]">mm</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] text-slate-500 font-normal mb-1">Row Spacing</label>
                                        <div className="flex items-center border border-slate-300 rounded overflow-hidden focus-within:ring-1 focus-within:ring-primary focus-within:border-primary">
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.1"
                                                value={rowSpacing}
                                                onChange={(e) => setRowSpacing(e.target.value)}
                                                className="w-full px-2 py-1 focus:outline-none text-slate-800 font-mono"
                                            />
                                            <span className="bg-slate-50 text-slate-400 px-2 py-1 text-[10px]">mm</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Edge Rails */}
                        <div className="flex items-center gap-2">
                            <span className="w-32 shrink-0 text-slate-600">Edge Rails</span>
                            <select
                                value={edgeRails}
                                onChange={(e) => setEdgeRails(e.target.value)}
                                className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-slate-800 bg-white"
                            >
                                <option value="No rails">No rails</option>
                                <option value="On top and bottom sides">On top and bottom sides</option>
                                <option value="On left and right sides">On left and right sides</option>
                                <option value="On four sides">On four sides</option>
                            </select>
                        </div>

                        {/* Panel Size (Calculated) */}
                        <div className="flex items-start gap-2">
                            <span className="w-32 shrink-0 text-slate-600 pt-1.5">Panel size</span>
                            <div className="flex-1 space-y-1">
                                <div className="flex items-center gap-1.5">
                                    <div className="flex items-center bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 font-mono font-bold w-24">
                                        <span>{calcPanelWidth}</span>
                                        <span className="ml-auto text-[10px] text-slate-400 font-normal">mm</span>
                                    </div>
                                    <span className="text-slate-400 font-bold">*</span>
                                    <div className="flex items-center bg-slate-100 border border-slate-200 rounded px-2.5 py-1.5 text-slate-700 font-mono font-bold w-24">
                                        <span>{calcPanelHeight}</span>
                                        <span className="ml-auto text-[10px] text-slate-400 font-normal">mm</span>
                                    </div>
                                </div>
                                <p className={`text-[10px] leading-tight font-medium ${isSizeWarning ? "text-red-500" : "text-slate-400"}`}>
                                    *The panel size should be at least 70x70mm and cannot exceed 475x475mm.
                                </p>
                            </div>
                        </div>

                        {/* Modal Action Buttons */}
                        <div className="flex items-center gap-3 pt-4">
                            <button
                                type="submit"
                                className="px-6 py-2 rounded-full bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
                            >
                                Submit
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-6 py-2 rounded-full border border-primary text-primary hover:bg-primary/5 font-bold text-xs transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>

                    </form>
                </div>

                {/* Right Side: Interactive Panel Outline & 2D Preview */}
                <div className="w-full md:w-1/2 bg-black p-4 flex flex-col relative border-t md:border-t-0 md:border-l border-slate-800">
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute top-3 right-3 text-slate-400 hover:text-white z-10 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    {/* View Switcher Tabs */}
                    <div className="flex gap-1 mb-4 z-10">
                        <button
                            type="button"
                            onClick={() => setActiveTab("outline")}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${activeTab === "outline" ? "bg-primary text-white" : "text-slate-300 hover:text-white"
                                }`}
                        >
                            Board Outline
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("preview")}
                            className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${activeTab === "preview" ? "bg-primary text-white" : "text-slate-300 hover:text-white"
                                }`}
                        >
                            2D Preview
                        </button>
                    </div>

                    {/* Preview Canvas Container */}
                    <div className="flex-1 min-h-[280px] flex items-center justify-center relative rounded border border-emerald-900/40 bg-black overflow-hidden">
                        {isRendering ? (
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                                <span className="text-[11px]">Generating panel geometry...</span>
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center p-6">
                                <div
                                    className="border-2 border-purple-600/80 bg-purple-950/20 relative flex items-center justify-center transition-all duration-300"
                                    style={{
                                        width: "80%",
                                        height: "80%",
                                        maxHeight: "220px",
                                    }}
                                >
                                    {/* Grid of Single PCBs inside panel */}
                                    <div
                                        className="grid gap-1 w-full h-full p-2"
                                        style={{
                                            gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
                                            gridTemplateRows: `repeat(${rowCount}, minmax(0, 1fr))`,
                                        }}
                                    >
                                        {Array.from({ length: Math.min(colCount * rowCount, 64) }).map((_, idx) => (
                                            <div
                                                key={idx}
                                                className="border border-purple-400/60 bg-emerald-950/30 rounded-xs flex items-center justify-center text-[9px] font-mono text-emerald-400"
                                            >
                                                {activeTab === "preview" ? "PCB" : ""}
                                            </div>
                                        ))}
                                    </div>
                                    <span className="absolute -bottom-5 right-1 text-[10px] font-mono text-purple-400">
                                        {calcPanelWidth} x {calcPanelHeight} mm
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
