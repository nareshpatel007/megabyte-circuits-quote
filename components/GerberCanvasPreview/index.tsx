"use client";

import React, { useRef, useEffect, useState, MouseEvent, WheelEvent } from "react";
import { ZoomIn, ZoomOut, RotateCcw, Download, Maximize2 } from "lucide-react";
import { ParsedGerberFile, PCBInfo } from "../../src/lib/gerber/types";
import { calculateDimensions } from "../../src/lib/gerber/dimension";
import { renderPCBToCanvas } from "../../src/lib/gerber/canvasRenderer";

interface GerberCanvasPreviewProps {
    parsedFiles: ParsedGerberFile[];
    info: PCBInfo;
    pcbColor: string;
}

export default function GerberCanvasPreview({ parsedFiles, info, pcbColor }: GerberCanvasPreviewProps) {
    const frontCanvasRef = useRef<HTMLCanvasElement>(null);
    const backCanvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Zoom and pan states (synchronized across both canvases)
    const [zoom, setZoom] = useState<number>(1);
    const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

    const inchesWidth = (info.width / 25.4).toFixed(2);
    const inchesHeight = (info.height / 25.4).toFixed(2);

    const outlineFile = parsedFiles.find(f => f.type === "outline");
    const dimensions = calculateDimensions(outlineFile || null, parsedFiles);

    // Dynamic Fit to View centering and scaling (92% target size)
    const fitToView = () => {
        const frontCanvas = frontCanvasRef.current;
        if (!frontCanvas || !containerRef.current) return;

        // Use the display container width and height
        const viewerWidth = frontCanvas.parentElement?.clientWidth || 550;
        const viewerHeight = frontCanvas.parentElement?.clientHeight || 380;

        const boardWidth = dimensions.width || 100;
        const boardHeight = dimensions.height || 100;

        // Auto zoom: 92% of preview area, avoiding clipping
        const scaleX = viewerWidth / boardWidth;
        const scaleY = viewerHeight / boardHeight;
        const newZoom = Math.min(scaleX, scaleY) * 0.92;

        // Centering offsets
        const offsetX = (viewerWidth - boardWidth * newZoom) / 2;
        const offsetY = (viewerHeight - boardHeight * newZoom) / 2;

        setZoom(newZoom);
        setPan({ x: offsetX, y: offsetY });
    };

    // Auto resize canvases to parent containers to maintain crisp look on mount & window resize
    useEffect(() => {
        const handleResize = () => {
            const frontCanvas = frontCanvasRef.current;
            const backCanvas = backCanvasRef.current;
            if (!frontCanvas || !backCanvas) return;

            const parentFront = frontCanvas.parentElement;
            const parentBack = backCanvas.parentElement;
            if (!parentFront || !parentBack) return;

            const dpr = window.devicePixelRatio || 1;
            
            // Adjust canvas resolution attribute
            frontCanvas.width = parentFront.clientWidth * dpr;
            frontCanvas.height = parentFront.clientHeight * dpr;

            backCanvas.width = parentBack.clientWidth * dpr;
            backCanvas.height = parentBack.clientHeight * dpr;

            fitToView();
        };

        // Run once on mount
        handleResize();

        // Listen for resizing
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [parsedFiles, pcbColor]);

    // Redraw canvases on updates
    useEffect(() => {
        const frontCanvas = frontCanvasRef.current;
        const backCanvas = backCanvasRef.current;

        if (frontCanvas) {
            renderPCBToCanvas(frontCanvas, parsedFiles, "top", pcbColor, dimensions, zoom, pan);
        }
        if (backCanvas) {
            renderPCBToCanvas(backCanvas, parsedFiles, "bottom", pcbColor, dimensions, zoom, pan);
        }
    }, [parsedFiles, pcbColor, zoom, pan, dimensions]);

    // Mouse drag-to-pan event handlers
    const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    };

    const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
        if (!isDragging) return;
        setPan({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Scroll-to-zoom centered on canvas coordinate space
    const handleWheel = (e: WheelEvent<HTMLDivElement>) => {
        e.preventDefault();
        const zoomFactor = 1.15;
        const newZoom = e.deltaY < 0 ? Math.min(zoom * zoomFactor, 100) : Math.max(zoom / zoomFactor, 0.15);
        setZoom(newZoom);
    };

    const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 100));
    const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.15));

    // Export Canvas to high-res PNG (No extra padding, transparent outside, transparent drills)
    const downloadPNG = (side: "top" | "bottom") => {
        const exportCanvas = document.createElement("canvas");
        const boardWidth = dimensions.width || 100;
        const boardHeight = dimensions.height || 100;

        // 10x high resolution scale
        const scaleMultiplier = 10;
        exportCanvas.width = boardWidth * scaleMultiplier;
        exportCanvas.height = boardHeight * scaleMultiplier;

        // Render perfectly bounding the PCB shape with 1.0 device ratio for exact export sizing
        renderPCBToCanvas(exportCanvas, parsedFiles, side, pcbColor, dimensions, scaleMultiplier, { x: 0, y: 0 }, 1);

        const link = document.createElement("a");
        link.download = `${side === "top" ? "Front" : "Back"}_Gerber_Preview.png`;
        link.href = exportCanvas.toDataURL("image/png");
        link.click();
    };

    return (
        <div className="space-y-6">
            <div 
                ref={containerRef}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm relative select-none"
            >
                {/* Interactive previews displayed side-by-side */}
                <div 
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8 cursor-grab active:cursor-grabbing"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                >
                    {/* Front side view */}
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-xs font-bold text-slate-700 tracking-wider">Front Side (Top View)</span>
                        <div className="w-full h-[380px] border border-slate-150 rounded-2xl overflow-hidden bg-[#1e293b] relative shadow-inner">
                            <canvas 
                                ref={frontCanvasRef}
                                className="w-full h-full block"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => downloadPNG("top")}
                            className="text-xs font-bold text-cyan-600 hover:text-cyan-800 flex items-center gap-1.5 transition-colors cursor-pointer mt-1"
                        >
                            <Download className="w-3.5 h-3.5" /> Download Front PNG
                        </button>
                    </div>

                    {/* Back side view */}
                    <div className="flex flex-col items-center gap-3">
                        <span className="text-xs font-bold text-slate-700 tracking-wider">Back Side (Bottom View)</span>
                        <div className="w-full h-[380px] border border-slate-150 rounded-2xl overflow-hidden bg-[#1e293b] relative shadow-inner">
                            <canvas 
                                ref={backCanvasRef}
                                className="w-full h-full block"
                            />
                        </div>
                        <button
                            type="button"
                            onClick={() => downloadPNG("bottom")}
                            className="text-xs font-bold text-cyan-600 hover:text-cyan-800 flex items-center gap-1.5 transition-colors cursor-pointer mt-1"
                        >
                            <Download className="w-3.5 h-3.5" /> Download Back PNG
                        </button>
                    </div>
                </div>

                {/* especular Floating controls */}
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-900/90 backdrop-blur border border-slate-700/50 p-2 rounded-2xl shadow-xl z-20">
                    <button
                        type="button"
                        onClick={handleZoomIn}
                        title="Zoom In"
                        className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={handleZoomOut}
                        title="Zoom Out"
                        className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={fitToView}
                        title="Fit to View"
                        className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                    <button
                        type="button"
                        onClick={fitToView}
                        title="Reset View"
                        className="p-2 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Diagnostic Report Panel */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="border-b border-slate-100 pb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-500" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Gerber Specification Report</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PCB size</span>
                        <p className="text-lg font-bold text-slate-800">{info.width} × {info.height} mm</p>
                        <p className="text-xs text-slate-500">({inchesWidth} × {inchesHeight} inches)</p>
                    </div>

                    <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Layer count</span>
                        <p className="text-lg font-bold text-slate-800">{info.layers} Layers</p>
                        <p className="text-xs text-slate-500">{info.layers > 1 ? "Multilayer board" : "Single layer board"}</p>
                    </div>

                    <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Shape / Contour</span>
                        <p className="text-lg font-bold text-slate-800">{info.boardShape}</p>
                        <p className="text-xs text-slate-500">{info.outlineType}</p>
                    </div>

                    <div className="space-y-1">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Drills / Holes</span>
                        <p className="text-lg font-bold text-slate-800">{info.drillCount} Hits</p>
                        <p className="text-xs text-slate-500">{info.drillFileDetected ? "Drill layer parsed" : "No drill file"}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FileText(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
            <path d="M14 2v4a2 2 0 0 0 2 2h4" />
            <path d="M10 9H8" />
            <path d="M16 13H8" />
            <path d="M16 17H8" />
        </svg>
    );
}
