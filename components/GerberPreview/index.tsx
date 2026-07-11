"use client";

import React, { useState, useRef, MouseEvent, WheelEvent } from "react";
import { ZoomIn, ZoomOut, RotateCcw, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { ParsedGerberFile, PCBInfo } from "../../src/lib/gerber/types";
import { renderPCBToSVG } from "../../lib/gerber/svgRenderer";
import { calculateBoardDimensions } from "../../lib/gerber/dimensionCalculator";

interface GerberPreviewProps {
    parsedFiles: ParsedGerberFile[];
    info: PCBInfo;
    pcbColor: string;
}

export default function GerberPreview({ parsedFiles, info, pcbColor }: GerberPreviewProps) {
    const inchesWidth = (info.width / 25.4).toFixed(2);
    const inchesHeight = (info.height / 25.4).toFixed(2);

    // Compute dimensions dynamically based on parsed files (normalized)
    const outlineFile = parsedFiles.find(f => f.type === "outline");
    const dimensions = calculateBoardDimensions(outlineFile || null, parsedFiles);

    return (
        <div className="space-y-6">
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Front side */}
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-wider">Front Side (Top View)</span>
                        <div className="w-full h-[400px] border border-slate-150 rounded-2xl overflow-hidden bg-[#F3F4F6] relative">
                            <InteractiveSVGViewer
                                parsedFiles={parsedFiles}
                                side="top"
                                pcbColor={pcbColor}
                                dimensions={dimensions}
                            />
                        </div>
                    </div>

                    {/* Back side */}
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-[11px] font-black text-slate-500 tracking-wider uppercase">Back Side (Bottom View)</span>
                        <div className="w-full h-[400px] border border-slate-150 rounded-2xl overflow-hidden bg-[#F3F4F6] relative">
                            <InteractiveSVGViewer
                                parsedFiles={parsedFiles}
                                side="bottom"
                                pcbColor={pcbColor}
                                dimensions={dimensions}
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
    parsedFiles: ParsedGerberFile[];
    side: "top" | "bottom";
    pcbColor: string;
    dimensions: { width: number; height: number; minX: number; maxX: number; minY: number; maxY: number };
}

function InteractiveSVGViewer({ parsedFiles, side, pcbColor, dimensions }: InteractiveViewerProps) {
    const [zoom, setZoom] = useState(1.2);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const viewerRef = useRef<HTMLDivElement>(null);

    // Generate SVG string content
    const svgString = renderPCBToSVG(parsedFiles, side, pcbColor, dimensions);
    const encodedSvg = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

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
        setZoom(1.2);
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
                {/* Render the pure SVG vector natively inside the browser */}
                <img
                    src={encodedSvg}
                    alt={`${side} PCB preview`}
                    className="max-w-[85%] max-h-[85%] object-contain pointer-events-none"
                    draggable={false}
                />
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
