"use client";

import React, { useEffect, useRef } from "react";
import { ParsedGerberFile, PCBInfo } from "../../lib/gerber/types";
import { renderPCBVectorToCanvas } from "../../lib/gerber/renderer";

interface GerberPreviewProps {
    parsedFiles: ParsedGerberFile[];
    info: PCBInfo;
    pcbColor: string;
}

export default function GerberPreview({ parsedFiles, info, pcbColor }: GerberPreviewProps) {
    const frontCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const backCanvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        const layers = {
            outline: true,
            topCopper: true,
            bottomCopper: true,
            solderMask: true,
            silkscreen: true,
            drills: true
        };

        const frontCanvas = frontCanvasRef.current;
        if (frontCanvas) {
            renderPCBVectorToCanvas(frontCanvas, parsedFiles, "top", pcbColor, layers);
        }

        const backCanvas = backCanvasRef.current;
        if (backCanvas) {
            renderPCBVectorToCanvas(backCanvas, parsedFiles, "bottom", pcbColor, layers);
        }
    }, [parsedFiles, pcbColor]);

    const inchesWidth = (info.width / 25.4).toFixed(2);
    const inchesHeight = (info.height / 25.4).toFixed(2);

    return (
        <div className="space-y-4">
            <div className="bg-[#f8fafc] border border-slate-100 rounded-3xl p-6 shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Front side */}
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Front Side (Top View)</span>
                        <div className="border border-slate-150 rounded-2xl overflow-hidden bg-slate-950 p-4 shadow-sm flex items-center justify-center w-full">
                            <canvas
                                ref={frontCanvasRef}
                                width={400}
                                height={280}
                                className="max-w-full h-auto bg-slate-900 border border-slate-800 rounded-xl"
                            />
                        </div>
                    </div>

                    {/* Back side */}
                    <div className="flex flex-col items-center gap-2">
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Back Side (Bottom View)</span>
                        <div className="border border-slate-150 rounded-2xl overflow-hidden bg-slate-950 p-4 shadow-sm flex items-center justify-center w-full">
                            <canvas
                                ref={backCanvasRef}
                                width={400}
                                height={280}
                                className="max-w-full h-auto bg-slate-900 border border-slate-800 rounded-xl"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Muted detected summary label */}
            <div className="space-y-1 pl-1">
                <p className="text-xs font-bold text-slate-500">
                    Detected {info.layers} layer board of {info.width}×{info.height}mm ({inchesWidth}×{inchesHeight} inches).
                </p>
                {info.debugInfo && (
                    <p className="text-[9px] text-slate-400 break-all leading-tight">
                        Debug: {info.debugInfo}
                    </p>
                )}
            </div>
        </div>
    );
}
