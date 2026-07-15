"use client";

import React, { useState, useRef, useEffect, MouseEvent, WheelEvent } from "react";
import {
    ZoomIn,
    ZoomOut,
    RotateCcw,
    AlertTriangle,
    FileText,
    Sliders,
    Check,
    X,
    ChevronDown,
    RefreshCw
} from "lucide-react";
import { ParsedGerberFile, PCBInfo } from "../../src/lib/gerber/types";
import { ConvertResult } from "../../lib/gerber-renderer/convertToSvg";
import setUpConfig from "../../lib/gerber-renderer/quickSetup";
import handleColorChange from "../../lib/gerber-renderer/svgColorChange";
import { updateSvg, updateToolWidth } from "../../lib/gerber-renderer/svgUtils";

interface GerberPreviewProps {
    parsedFiles: ParsedGerberFile[];
    info: PCBInfo;
    pcbColor: string;
    svgResult: ConvertResult | null;
}

export default function GerberPreview({ parsedFiles, info, pcbColor, svgResult }: GerberPreviewProps) {
    const inchesWidth = (info.width / 25.4).toFixed(2);
    const inchesHeight = (info.height / 25.4).toFixed(2);

    // Option states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedQuickSetup, setSelectedQuickSetup] = useState<string>("generate-all");
    const [selectedColor, setSelectedColor] = useState<string>("original");
    const [outlineToolWidth, setOutlineToolWidth] = useState<string>("0.0");
    const [layerToggles, setLayerToggles] = useState({
        trace: true,
        pads: true,
        silkscreen: true,
        soldermask: true,
        outline: true,
        drill: true
    });

    // Custom processed SVGs
    const [renderedTopSvg, setRenderedTopSvg] = useState<SVGElement | null>(null);
    const [renderedBottomSvg, setRenderedBottomSvg] = useState<SVGElement | null>(null);

    // Sync external pcbColor form field selection to selectedColor state
    useEffect(() => {
        const colorMap: Record<string, string> = {
            "#52c41a": "green",
            "#722ed1": "original",
            "#f5222d": "red",
            "#fadb14": "yellow",
            "#1677ff": "blue",
            "#ffffff": "white",
            "#000000": "black"
        };
        const mapped = colorMap[pcbColor.toLowerCase()];
        if (mapped) {
            setSelectedColor(mapped);
        }
    }, [pcbColor]);

    // Apply configuration changes to SVGs reactively
    useEffect(() => {
        if (!svgResult) {
            setRenderedTopSvg(null);
            setRenderedBottomSvg(null);
            return;
        }

        // Clone SVGs
        const topClone = svgResult.topSvg.cloneNode(true) as SVGElement;
        const bottomClone = svgResult.bottomSvg.cloneNode(true) as SVGElement;
        const fullClone = svgResult.fullStackSvg.cloneNode(true) as SVGElement;

        // Apply setup configuration (layer visibility)
        const configCreator = setUpConfig(
            { id: svgResult.id, svg: topClone },
            { id: svgResult.id, svg: bottomClone }
        );
        const setup = configCreator[selectedQuickSetup];

        // Apply colors
        handleColorChange({
            color: selectedColor,
            id: svgResult.id || "board",
            soldermask: layerToggles.soldermask,
            svgs: [topClone, bottomClone, fullClone]
        });

        // Apply tool outline width
        const svgsToUpdate = [
            { stack: { id: svgResult.id, svg: topClone }, name: 'toplayer' },
            { stack: { id: svgResult.id, svg: bottomClone }, name: 'bottomlayer' },
            { stack: { id: 'fullstack', svg: fullClone }, name: 'fullstack' }
        ];

        let correction = 0;
        if (outlineToolWidth === "0.8") correction = 3;
        else if (outlineToolWidth === "1") correction = 3.9;
        else if (outlineToolWidth === "2") correction = 7.6;

        updateToolWidth(svgsToUpdate, outlineToolWidth, svgResult.stackConfig, correction);

        // Apply setup configuration or custom toggles
        const topStackObj = { id: svgResult.id, svg: topClone };
        const bottomStackObj = { id: svgResult.id, svg: bottomClone };
        const isDoubleSide = true;

        if (selectedQuickSetup === "custom") {
            applyCustomToggles(topClone, layerToggles);
            applyCustomToggles(bottomClone, layerToggles);
            applyCustomToggles(fullClone, layerToggles);
        } else if (setup) {
            updateSvg(topClone, selectedQuickSetup, setup, "general", topStackObj, isDoubleSide);
            updateSvg(bottomClone, selectedQuickSetup, setup, "general", topStackObj, isDoubleSide);
            updateSvg(fullClone, selectedQuickSetup, setup, "general", topStackObj, isDoubleSide);
        }

        setRenderedTopSvg(topClone);
        setRenderedBottomSvg(bottomClone);
    }, [svgResult, selectedQuickSetup, selectedColor, outlineToolWidth, layerToggles]);

    if (!svgResult) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border border-slate-200/85 rounded-3xl bg-slate-50/50 space-y-3">
                <RefreshCw className="w-8 h-8 text-cyan-600 animate-spin" />
                <p className="text-sm font-semibold text-slate-650">Generating high-fidelity 2D Previews...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Front side */}
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-xs font-bold text-slate-700 tracking-wider">Front Side (Top View)</span>
                        <div className="w-full h-[400px] border border-slate-150 rounded-2xl overflow-hidden bg-[#F3F4F6] relative">
                            <InteractiveSVGViewer
                                svg={renderedTopSvg}
                                side="top"
                            />
                        </div>
                    </div>

                    {/* Back side */}
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-xs font-bold text-slate-700 tracking-wider">Back Side (Bottom View)</span>
                        <div className="w-full h-[400px] border border-slate-150 rounded-2xl overflow-hidden bg-[#F3F4F6] relative">
                            <InteractiveSVGViewer
                                svg={renderedBottomSvg}
                                side="bottom"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Diagnostics Report */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-500" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Gerber Diagnostics Report</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Size */}
                    <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PCB Size</span>
                        <p className="text-lg font-bold text-slate-800">
                            {info.width} × {info.height} mm
                        </p>
                        <p className="text-xs text-slate-500">
                            ({inchesWidth} × {inchesHeight} inches)
                        </p>
                    </div>

                    {/* Layers */}
                    <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Layers</span>
                        <p className="text-lg font-bold text-slate-800">{info.layers} Layers</p>
                        <p className="text-xs text-slate-500">
                            {info.layers > 1 ? "Multilayer PCB" : "Single-sided PCB"}
                        </p>
                    </div>

                    {/* Board Shape */}
                    <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Board Shape</span>
                        <p className="text-lg font-bold text-slate-800">{info.boardShape}</p>
                        <p className="text-xs text-slate-500">{info.outlineType}</p>
                    </div>

                    {/* Drills */}
                    <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Drills</span>
                        <p className="text-lg font-bold text-slate-800">{info.drillCount} Hits</p>
                        <p className="text-xs text-slate-500">
                            {info.drillFileDetected ? "Drill layer parsed" : "No drill file"}
                        </p>
                    </div>
                </div>

                {/* Detected Files Grid */}
                <div className="space-y-3">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Detected Files</span>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {info.detectedFiles.map((file, idx) => (
                            <div
                                key={idx}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${file.found
                                    ? "bg-emerald-50/50 border-emerald-100 text-emerald-800"
                                    : "bg-rose-50/50 border-rose-100 text-rose-800"
                                    }`}
                            >
                                <span>{file.found ? "✓" : "✗"}</span>
                                <span className="truncate">{file.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Warnings Section */}
                {info.warnings && info.warnings.length > 0 && (
                    <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Layer Warnings</span>
                        </div>
                        <ul className="list-disc list-inside text-xs text-amber-700 space-y-1">
                            {info.warnings.map((warn, index) => (
                                <li key={index}>{warn}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>

            {/* Customization Options Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white border border-slate-200/80 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
                        {/* Header */}
                        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2">
                                <Sliders className="w-5 h-5 text-cyan-650" />
                                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">PCB Render Settings</h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="p-1.5 hover:bg-slate-200/60 rounded-full transition-colors text-slate-400 hover:text-slate-655 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Body / Options Form */}
                        <div className="p-6 space-y-5 overflow-y-auto">

                            {/* Preset Quick Setup */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Quick Setup Preset</label>
                                <div className="relative">
                                    <select
                                        value={selectedQuickSetup}
                                        onChange={(e) => setSelectedQuickSetup(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 text-xs font-semibold p-2.5 rounded-xl outline-none focus:border-cyan-500/50 appearance-none text-slate-800 cursor-pointer"
                                    >
                                        <option value="generate-all">Generate All Layers</option>
                                        <option value="top-trace">Top Side Trace Only</option>
                                        <option value="top-drill">Top Side Drill Hits</option>
                                        <option value="top-outline">Top Cut Out</option>
                                        <option value="bottom-trace">Bottom Side Trace Only</option>
                                        <option value="bottom-drill">Bottom Side Drill Hits</option>
                                        <option value="bottom-outline">Bottom Cut Out</option>
                                        <option value="custom">Custom Layer Toggle</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                                </div>
                            </div>

                            {/* Color Selection */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Board Mask Color</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['original', 'green', 'blue', 'red', 'black', 'white', 'yellow', 'bw', 'bwInvert'].map((c) => (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => setSelectedColor(c)}
                                            className={`p-2.5 rounded-xl text-[10px] font-bold border transition-all text-center capitalize cursor-pointer ${selectedColor === c
                                                ? 'border-cyan-550 bg-cyan-50 text-cyan-700 shadow-sm'
                                                : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-500'
                                                }`}
                                        >
                                            {c === 'bw' ? 'B&W' : c === 'bwInvert' ? 'B&W Inv' : c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Outline Tool Width */}
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Outline Cut Tool Width (mm)</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['0.0', '0.8', '1', '2'].map((widthVal) => (
                                        <button
                                            key={widthVal}
                                            type="button"
                                            onClick={() => setOutlineToolWidth(widthVal)}
                                            className={`p-2.5 rounded-xl text-[10px] font-bold border transition-all text-center cursor-pointer ${outlineToolWidth === widthVal
                                                ? 'border-cyan-550 bg-cyan-50 text-cyan-700 shadow-sm'
                                                : 'border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-500'
                                                }`}
                                        >
                                            {widthVal === '0.0' ? 'None' : `${widthVal} mm`}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Layer Toggles */}
                            {selectedQuickSetup === "custom" && (
                                <div className="border-t border-slate-100 pt-4 mt-2 space-y-3">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Toggle Individual Layers</span>
                                    <div className="grid grid-cols-2 gap-3">
                                        {Object.keys(layerToggles).map((layer) => {
                                            const val = layerToggles[layer as keyof typeof layerToggles];
                                            return (
                                                <button
                                                    key={layer}
                                                    type="button"
                                                    onClick={() => setLayerToggles(prev => ({ ...prev, [layer]: !val }))}
                                                    className={`px-3 py-2.5 rounded-xl border flex items-center justify-between text-[10px] font-bold transition-all cursor-pointer capitalize ${val
                                                        ? 'border-cyan-550 bg-cyan-50 text-cyan-700'
                                                        : 'border-slate-200 bg-slate-50 text-slate-400'
                                                        }`}
                                                >
                                                    <span>{layer}</span>
                                                    {val ? <Check className="w-3.5 h-3.5 text-cyan-600" /> : <X className="w-3.5 h-3.5 text-slate-400" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsModalOpen(false)}
                                className="flex-1 py-3 bg-cyan-650 hover:bg-cyan-600 active:scale-98 text-xs font-bold text-white rounded-xl shadow-lg shadow-cyan-600/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            >
                                <Check className="w-4 h-4" />
                                <span>Apply changes</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface InteractiveViewerProps {
    svg: SVGElement | null;
    side: "top" | "bottom";
}

function InteractiveSVGViewer({ svg, side }: InteractiveViewerProps) {
    const [zoom, setZoom] = useState(1.0);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [encodedSvg, setEncodedSvg] = useState<string>("");
    const viewerRef = useRef<HTMLDivElement>(null);

    // Convert SVG Element to base64/raw URL reactively so the browser can treat it as a scale-to-fit image
    useEffect(() => {
        if (svg) {
            const svgString = new XMLSerializer().serializeToString(svg);
            const encoded = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;
            setEncodedSvg(encoded);
        } else {
            setEncodedSvg("");
        }
    }, [svg]);

    // Pan Event Handlers
    const handleMouseDown = (e: MouseEvent) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Zoom on Wheel Event
    const handleWheel = (e: WheelEvent) => {
        e.preventDefault();
        const zoomFactor = 1.1;
        if (e.deltaY < 0) {
            setZoom(prev => Math.min(prev * zoomFactor, 25)); // Max 25x zoom
        } else {
            setZoom(prev => Math.max(prev / zoomFactor, 0.5)); // Min 0.5x zoom
        }
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 25));
    const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));
    const handleReset = () => {
        setZoom(1.0);
        setPan({ x: 0, y: 0 });
    };

    return (
        <div
            ref={viewerRef}
            className="w-full h-full cursor-grab active:cursor-grabbing relative select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
        >
            {/* Vector Rendered Image Wrapper */}
            <div
                className="w-full h-full flex items-center justify-center transition-transform duration-75 ease-out"
                style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: "center center"
                }}
            >
                {encodedSvg && (
                    <img
                        src={encodedSvg}
                        alt={`${side} PCB preview`}
                        className="max-w-[94%] max-h-[94%] object-contain pointer-events-none"
                        draggable={false}
                    />
                )}
            </div>

            {/* Float Overlay Controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-1.5 bg-slate-900/90 backdrop-blur border border-slate-700/50 p-1.5 rounded-xl shadow-lg z-10">
                <button
                    type="button"
                    onClick={handleZoomIn}
                    title="Zoom In"
                    className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                    <ZoomIn className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={handleZoomOut}
                    title="Zoom Out"
                    className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                    <ZoomOut className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={handleReset}
                    title="Reset View"
                    className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                    <RotateCcw className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function applyCustomToggles(
    svg: SVGElement,
    toggles: {
        trace: boolean;
        pads: boolean;
        silkscreen: boolean;
        soldermask: boolean;
        outline: boolean;
        drill: boolean;
    }
) {
    const gerberSvgs = svg.querySelectorAll('svg');
    if (gerberSvgs.length < 2) return;
    const gerberSvg = gerberSvgs[1];

    gerberSvg.querySelectorAll('g').forEach((g) => {
        if (g.hasAttribute('id')) {
            const id = g.getAttribute('id') || '';
            let show = true;
            if (id.includes('_cu') || id.includes('copper')) {
                show = toggles.trace;
            } else if (id.includes('_cf') || id.includes('finish')) {
                show = toggles.pads;
            } else if (id.includes('_ss') || id.includes('silkscreen')) {
                show = toggles.silkscreen;
            } else if (id.includes('_sm') || id.includes('soldermask')) {
                show = toggles.soldermask;
            } else if (id.includes('_out') || id.includes('outline')) {
                show = toggles.outline;
            } else if (id.includes('_dr') || id.includes('drill')) {
                show = toggles.drill;
            }
            g.style.display = show ? 'block' : 'none';
        }
    });
}

