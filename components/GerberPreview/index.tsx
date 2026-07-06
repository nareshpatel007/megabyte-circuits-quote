"use client";

import React, { useState, useEffect, useRef } from "react";
import { ZoomIn, ZoomOut, Maximize, RefreshCw, Grid, Layers } from "lucide-react";
import { ParsedGerberFile, PCBInfo } from "../../lib/gerber/types";
import { renderPCBVectorToCanvas } from "../../lib/gerber/renderer";

interface GerberPreviewProps {
    parsedFiles: ParsedGerberFile[];
    info: PCBInfo;
    pcbColor: string;
}

export default function GerberPreview({ parsedFiles, info, pcbColor }: GerberPreviewProps) {
    const [viewSide, setViewSide] = useState<"top" | "bottom">("top");
    const [activeLayers, setActiveLayers] = useState({
        outline: true,
        topCopper: true,
        bottomCopper: true,
        solderMask: true,
        silkscreen: true,
        drills: true
    });

    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [showGrid, setShowGrid] = useState(true);

    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    // Render Canvas Loop
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Save context state
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Apply transformations (Scale & Offset)
        ctx.translate(canvas.width / 2 + offset.x, canvas.height / 2 + offset.y);
        ctx.scale(scale, scale);
        ctx.translate(-canvas.width / 2, -canvas.height / 2);

        // Render board vector details
        renderPCBVectorToCanvas(canvas, parsedFiles, viewSide, pcbColor, activeLayers);

        // Draw grid if enabled
        if (showGrid) {
            ctx.strokeStyle = "rgba(148, 163, 184, 0.08)";
            ctx.lineWidth = 0.5;
            for (let i = -100; i < canvas.width + 100; i += 20) {
                ctx.beginPath();
                ctx.moveTo(i, -100);
                ctx.lineTo(i, canvas.height + 100);
                ctx.stroke();

                ctx.beginPath();
                ctx.moveTo(-100, i);
                ctx.lineTo(canvas.width + 100, i);
                ctx.stroke();
            }
        }

        // Restore context state
        ctx.restore();
    }, [parsedFiles, viewSide, pcbColor, activeLayers, scale, offset, showGrid]);

    // Zoom Functions
    const handleZoomIn = () => setScale(prev => Math.min(prev + 0.15, 3));
    const handleZoomOut = () => setScale(prev => Math.max(prev - 0.15, 0.5));
    const handleReset = () => {
        setScale(1);
        setOffset({ x: 0, y: 0 });
    };

    // Pan Event Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setOffset({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => setIsDragging(false);

    return (
        <div className="w-full border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-900 shadow-xl select-none">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 border-b border-slate-800/80 bg-slate-950/80 text-white">
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => setViewSide("top")}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            viewSide === "top"
                                ? "bg-primary text-white shadow"
                                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
                        }`}
                    >
                        Top View
                    </button>
                    <button
                        type="button"
                        onClick={() => setViewSide("bottom")}
                        className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                            viewSide === "bottom"
                                ? "bg-primary text-white shadow"
                                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
                        }`}
                    >
                        Bottom View
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={handleZoomIn}
                        title="Zoom In"
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer transition-colors"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={handleZoomOut}
                        title="Zoom Out"
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer transition-colors"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={handleReset}
                        title="Reset View"
                        className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer transition-colors"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowGrid(prev => !prev)}
                        title="Toggle Grid"
                        className={`p-2 rounded-lg cursor-pointer transition-colors ${
                            showGrid ? "bg-primary/20 text-primary border border-primary/20" : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                        }`}
                    >
                        <Grid className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                {/* Visualizer canvas */}
                <div className="lg:col-span-8 relative flex items-center justify-center p-6 bg-slate-950 overflow-hidden min-h-[350px]">
                    {/* Dimension Display */}
                    <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur border border-slate-800 text-[11px] font-medium text-slate-300 py-1.5 px-3 rounded-full flex items-center gap-1.5 shadow-sm">
                        <Maximize className="w-3.5 h-3.5 text-primary" />
                        <span>Size: {info.width} mm × {info.height} mm</span>
                    </div>

                    <canvas
                        ref={canvasRef}
                        width={600}
                        height={400}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        className={`max-w-full h-auto rounded-xl shadow-2xl bg-slate-900 border border-slate-800 ${
                            isDragging ? "cursor-grabbing" : "cursor-grab"
                        }`}
                    />
                </div>

                {/* Sidebar Layer Controls */}
                <div className="lg:col-span-4 p-5 bg-slate-900 border-t lg:border-t-0 lg:border-l border-slate-800/80 text-white flex flex-col justify-between">
                    <div>
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-primary" />
                            Gerber Layer Toggles
                        </h4>
                        
                        <div className="space-y-3">
                            {Object.entries({
                                outline: "Board Outline",
                                topCopper: "Top Copper Layer",
                                bottomCopper: "Bottom Copper Layer",
                                solderMask: "Solder Mask overlay",
                                silkscreen: "Silkscreen Layer",
                                drills: "Drill Holes"
                            }).map(([key, label]) => (
                                <label
                                    key={key}
                                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 hover:bg-slate-950/80 transition-colors cursor-pointer"
                                >
                                    <span className="text-xs text-slate-300 font-medium">{label}</span>
                                    <input
                                        type="checkbox"
                                        checked={(activeLayers as any)[key]}
                                        onChange={(e) => setActiveLayers(prev => ({ ...prev, [key]: e.target.checked }))}
                                        className="rounded border-slate-700 text-primary focus:ring-primary bg-slate-800 w-4 h-4 cursor-pointer"
                                    />
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-800/60 text-[10px] text-slate-400 leading-relaxed">
                        Drag the PCB view above to pan. Scroll or use toolbar controls to zoom. Changes are rendered locally.
                    </div>
                </div>
            </div>
        </div>
    );
}
