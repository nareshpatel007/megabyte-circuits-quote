"use client";

import React, { useState, useEffect, useRef } from "react";
import { ZoomIn, ZoomOut, RefreshCw, Grid, Layers, FileText, CheckCircle2 } from "lucide-react";
import { ParsedGerberFile, PCBInfo } from "../../lib/gerber/types";
import { renderPCBVectorToCanvas } from "../../lib/gerber/renderer";

interface GerberPreviewProps {
    parsedFiles: ParsedGerberFile[];
    info: PCBInfo;
    pcbColor: string;
}

export default function GerberPreview({ parsedFiles, info, pcbColor }: GerberPreviewProps) {
    const [previewActiveTab, setPreviewActiveTab] = useState<"layout" | "schematic">("layout");
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

    // Side view detection helper based on loaded files
    const [viewSide, setViewSide] = useState<"top" | "bottom">("top");

    // Render Canvas Loop
    useEffect(() => {
        if (previewActiveTab !== "layout") return;
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
    }, [parsedFiles, viewSide, pcbColor, activeLayers, scale, offset, showGrid, previewActiveTab]);

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
        <div className="mt-6 border border-gray-200 rounded-lg p-5 bg-slate-50/50 backdrop-blur-sm">
            {/* Header Title */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-gray-200 mb-5">
                <div>
                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" />
                        Gerber Verification Review
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">Live inspection & trace diagnostics from the uploaded archive</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 font-medium">Preview Theme:</span>
                    <span className="inline-block w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: pcbColor }} />
                    <span className="text-xs font-semibold text-gray-700 capitalize">
                        {pcbColor === "#52c41a" ? "Green" : 
                         pcbColor === "#722ed1" ? "Purple" : 
                         pcbColor === "#f5222d" ? "Red" : 
                         pcbColor === "#fadb14" ? "Yellow" : 
                         pcbColor === "#1677ff" ? "Blue" : 
                         pcbColor === "#ffffff" ? "White" : "Black"}
                    </span>
                </div>
            </div>

            {/* Split layout grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Side: Checklists & Controls */}
                <div className="lg:col-span-5 space-y-4">
                    {/* Checklist of detected archive files */}
                    <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Detected Archive Layers</h4>
                        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                            {info.detectedFiles.map((layer, index) => (
                                <div key={index} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-b-0">
                                    <div className="flex items-center gap-2 min-w-0">
                                        {layer.found ? (
                                            <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
                                        ) : (
                                            <span className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />
                                        )}
                                        <span className="text-sm font-medium text-gray-800 truncate">{layer.name}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-500 font-mono truncate max-w-[150px]">
                                        {layer.found ? "Detected" : "Not Found"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Rendering controls */}
                    <div className="bg-white rounded-lg p-4 border border-gray-100 shadow-sm">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Visualizer Controls</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {Object.entries({
                                outline: "Board Outline",
                                topCopper: "Top Copper",
                                bottomCopper: "Bottom Copper",
                                solderMask: "Solder Mask Grid",
                                silkscreen: "Silkscreen Layer",
                                drills: "Drill Holes"
                            }).map(([key, label]) => (
                                <label key={key} className="flex items-center gap-2 cursor-pointer py-1 px-2 rounded hover:bg-slate-50 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={(activeLayers as any)[key]}
                                        onChange={(e) => setActiveLayers(prev => ({ ...prev, [key]: e.target.checked }))}
                                        className="rounded border-gray-300 text-primary focus:ring-primary w-4 h-4 cursor-pointer"
                                    />
                                    <span className="text-xs text-gray-700 font-medium select-none">{label}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Visualizer and schematic viewer */}
                <div className="lg:col-span-7 flex flex-col">
                    {/* View switcher tabs */}
                    <div className="flex gap-2 mb-3 bg-slate-100 p-1 rounded-lg self-start">
                        <button
                            type="button"
                            onClick={() => setPreviewActiveTab("layout")}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                previewActiveTab === "layout"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            PCB 2D Layout Preview
                        </button>
                        <button
                            type="button"
                            onClick={() => setPreviewActiveTab("schematic")}
                            className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                                previewActiveTab === "schematic"
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-900"
                            }`}
                        >
                            Circuit Schematic Diagram
                        </button>
                    </div>

                    {/* Rendering viewport */}
                    {previewActiveTab === "layout" ? (
                        <div className="relative border border-slate-200/80 rounded-2xl overflow-hidden bg-slate-900 shadow-xl select-none">
                            {/* Visualizer header */}
                            <div className="flex items-center justify-between gap-4 p-3 border-b border-slate-800/80 bg-slate-950/80 text-white">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setViewSide("top")}
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
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
                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                            viewSide === "bottom"
                                                ? "bg-primary text-white shadow"
                                                : "bg-slate-800/60 text-slate-300 hover:bg-slate-800"
                                        }`}
                                    >
                                        Bottom View
                                    </button>
                                </div>

                                <div className="flex items-center gap-1.5">
                                    <button
                                        type="button"
                                        onClick={handleZoomIn}
                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer transition-colors"
                                    >
                                        <ZoomIn className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleZoomOut}
                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer transition-colors"
                                    >
                                        <ZoomOut className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer transition-colors"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setShowGrid(prev => !prev)}
                                        className={`p-1.5 rounded-lg cursor-pointer transition-colors ${
                                            showGrid ? "bg-primary/20 text-primary border border-primary/20" : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                                        }`}
                                    >
                                        <Grid className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* Main canvas area */}
                            <div className="relative flex items-center justify-center p-4 bg-slate-950 overflow-hidden min-h-[300px]">
                                <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur border border-slate-800 text-[10px] font-medium text-slate-300 py-1 px-2.5 rounded-full flex items-center gap-1 shadow-sm z-10">
                                    <span>Size: {info.width} mm × {info.height} mm</span>
                                </div>

                                <canvas
                                    ref={canvasRef}
                                    width={500}
                                    height={320}
                                    onMouseDown={handleMouseDown}
                                    onMouseMove={handleMouseMove}
                                    onMouseUp={handleMouseUp}
                                    onMouseLeave={handleMouseUp}
                                    className={`max-w-full h-auto rounded-xl shadow-2xl bg-slate-900 border border-slate-800 ${
                                        isDragging ? "cursor-grabbing" : "cursor-grab"
                                    }`}
                                />
                            </div>
                        </div>
                    ) : (
                        <div className="border border-gray-200 rounded-lg overflow-hidden bg-white p-4 flex items-center justify-center min-h-[352px]">
                            <div className="relative group overflow-hidden rounded border border-gray-100 shadow-sm max-w-full">
                                <img
                                    src="/images/circuit_schematic.png"
                                    alt="Circuit Diagram"
                                    className="max-h-[300px] w-auto object-contain cursor-zoom-in hover:scale-105 transition-transform duration-300"
                                />
                                <div className="absolute top-2 right-2 bg-gray-900/80 backdrop-blur text-[10px] text-gray-300 px-2 py-1 rounded select-none opacity-0 group-hover:opacity-100 transition-opacity">
                                    Original Schematic
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
