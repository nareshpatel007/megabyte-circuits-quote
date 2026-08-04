"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface GerberStackupPreviewProps {
    topSvg: string;
    bottomSvg: string;
    loading: boolean;
}

export default function GerberStackupPreview({ topSvg, bottomSvg, loading }: GerberStackupPreviewProps) {
    if (!loading && !topSvg && !bottomSvg) {
        return (
            <div className="w-full py-8 flex flex-col items-center justify-center text-center space-y-2.5">
                <div className="w-12 h-12 rounded-full bg-amber-100/90 border border-amber-200 flex items-center justify-center text-amber-600 shadow-2xs">
                    <AlertTriangle className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                    <p className="text-sm font-extrabold text-amber-900">No preview detected</p>
                    <p className="text-xs font-semibold text-amber-700">Please reupload Gerber file</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 items-center justify-center">
                {/* Front View */}
                <div className="flex items-center justify-center p-2">
                    {loading ? (
                        <div className="text-slate-400 text-xs font-medium py-12">Rendering Front View...</div>
                    ) : topSvg ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: topSvg }}
                            className="w-full h-full max-h-[320px] flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-[320px] [&>svg]:mx-auto filter drop-shadow-sm"
                        />
                    ) : (
                        <div className="text-slate-400 text-xs font-medium py-12">No Top Layer Detected</div>
                    )}
                </div>

                {/* Back View */}
                <div className="flex items-center justify-center p-2">
                    {loading ? (
                        <div className="text-slate-400 text-xs font-medium py-12">Rendering Back View...</div>
                    ) : bottomSvg ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: bottomSvg }}
                            className="w-full h-full max-h-[320px] flex items-center justify-center [&>svg]:max-w-full [&>svg]:max-h-[320px] [&>svg]:mx-auto filter drop-shadow-sm"
                        />
                    ) : (
                        <div className="text-slate-400 text-xs font-medium py-12">No Bottom Layer Detected</div>
                    )}
                </div>
            </div>
        </div>
    );
}
