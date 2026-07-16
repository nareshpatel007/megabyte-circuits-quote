"use client";

import React, { useState, useEffect } from "react";
import { type InputLayer } from "pcb-stackup";
import { renderStack, type RenderOptions } from "../../lib/gerber/clientRenderer";

interface GerberStackupPreviewProps {
    layers: InputLayer[];
    renderOptions: RenderOptions;
}

export default function GerberStackupPreview({ layers, renderOptions }: GerberStackupPreviewProps) {
    const [topSvg, setTopSvg] = useState<string>("");
    const [bottomSvg, setBottomSvg] = useState<string>("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let active = true;
        async function runRender() {
            if (layers.length === 0) return;
            setLoading(true);
            try {
                const stack = await renderStack(layers, renderOptions);
                if (!active) return;
                setTopSvg(stack.top?.svg || "");
                setBottomSvg(stack.bottom?.svg || "");
            } catch (err) {
                console.error("Failed to render stackup:", err);
            } finally {
                setLoading(false);
            }
        }
        runRender();
        return () => {
            active = false;
        };
    }, [layers, renderOptions]);

    return (
        <div className="space-y-6">
            <div className="relative">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Front View */}
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-700 tracking-wider">Front Side (Top View)</span>
                        <div className="w-full overflow-hidden flex items-center justify-center">
                            {loading ? (
                                <div className="text-slate-400 text-xs font-semibold">Rendering Front View...</div>
                            ) : topSvg ? (
                                <div
                                    dangerouslySetInnerHTML={{ __html: topSvg }}
                                    className="w-full h-full max-h-[340px] flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-[340px] [&>svg]:mx-auto"
                                />
                            ) : (
                                <div className="text-slate-400 text-xs font-semibold">No Top Layer Detected</div>
                            )}
                        </div>
                    </div>

                    {/* Back View */}
                    <div className="flex flex-col items-center">
                        <span className="text-xs font-bold text-slate-700 tracking-wider">Back Side (Bottom View)</span>
                        <div className="w-full overflow-hidden flex items-center justify-center">
                            {loading ? (
                                <div className="text-slate-400 text-xs font-semibold">Rendering Back View...</div>
                            ) : bottomSvg ? (
                                <div
                                    dangerouslySetInnerHTML={{ __html: bottomSvg }}
                                    className="w-full h-full max-h-[340px] flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-[340px] [&>svg]:mx-auto"
                                />
                            ) : (
                                <div className="text-slate-400 text-xs font-semibold">No Bottom Layer Detected</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
