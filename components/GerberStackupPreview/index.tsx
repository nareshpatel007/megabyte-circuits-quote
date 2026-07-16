"use client";

import React from "react";

interface GerberStackupPreviewProps {
    topSvg: string;
    bottomSvg: string;
    loading: boolean;
}

export default function GerberStackupPreview({ topSvg, bottomSvg, loading }: GerberStackupPreviewProps) {
    return (
        <div className="space-y-6">
            <div className="relative">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Front View */}
                    <div className="flex flex-col items-center gap-3">
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
                    <div className="flex flex-col items-center gap-3">
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
