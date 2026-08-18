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
                <div className="flex flex-col items-center justify-center p-2 relative group">
                    {loading ? (
                        <div className="text-slate-400 text-xs font-medium py-16 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                            Rendering Front View...
                        </div>
                    ) : topSvg ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: topSvg }}
                            className="w-full h-full min-h-[320px] max-h-[480px] flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[460px] [&>svg]:mx-auto transition-transform duration-300 group-hover:scale-[1.01]"
                        />
                    ) : (
                        <div className="text-slate-400 text-xs font-medium py-16">No Top Layer Detected</div>
                    )}
                </div>

                {/* Back View */}
                <div className="flex flex-col items-center justify-center p-2 relative group">
                    {loading ? (
                        <div className="text-slate-400 text-xs font-medium py-16 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary animate-ping" />
                            Rendering Back View...
                        </div>
                    ) : bottomSvg ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: bottomSvg }}
                            className="w-full h-full min-h-[320px] max-h-[480px] flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[460px] [&>svg]:mx-auto transition-transform duration-300 group-hover:scale-[1.01]"
                        />
                    ) : (
                        <div className="text-slate-400 text-xs font-medium py-16">No Bottom Layer Detected</div>
                    )}
                </div>
            </div>
        </div>
    );
}
