"use client";

import React, { useState, useRef, useEffect, MouseEvent, WheelEvent } from "react";
import {
    ZoomIn,
    ZoomOut,
    RotateCcw,
    AlertTriangle,
    FileText,
    RefreshCw
} from "lucide-react";
import { ParsedGerberFile, PCBInfo } from "../../src/lib/gerber/types";
import { ConvertResult } from "../../lib/gerber-renderer/convertToSvg";
import handleColorChange from "../../lib/gerber-renderer/svgColorChange";

interface GerberPreviewProps {
    parsedFiles: ParsedGerberFile[];
    info: PCBInfo;
    pcbColor: string;
    svgResult: ConvertResult | null;
}

export default function GerberPreview({ parsedFiles, info, pcbColor, svgResult }: GerberPreviewProps) {
    const inchesWidth = (info.width / 25.4).toFixed(2);
    const inchesHeight = (info.height / 25.4).toFixed(2);

    // Option state
    const [selectedColor, setSelectedColor] = useState<string>("original");

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

        // Apply colors
        handleColorChange({
            color: selectedColor,
            id: svgResult.id || "board",
            soldermask: true,
            svgs: [topClone, bottomClone, fullClone]
        });

        // Ensure all layers are visible by default
        const allLayers = {
            trace: true,
            pads: true,
            silkscreen: true,
            soldermask: true,
            outline: true,
            drill: true
        };
        applyCustomToggles(topClone, allLayers);
        applyCustomToggles(bottomClone, allLayers);
        applyCustomToggles(fullClone, allLayers);

        setRenderedTopSvg(topClone);
        setRenderedBottomSvg(bottomClone);
    }, [svgResult, selectedColor]);

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
                        className="max-w-[96%] max-h-[96%] object-contain pointer-events-none"
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
    svg.querySelectorAll('g').forEach((g) => {
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

