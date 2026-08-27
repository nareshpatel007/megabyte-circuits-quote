"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";

interface GerberStackupPreviewProps {
    topSvg?: string;
    bottomSvg?: string;
    loading: boolean;
    file?: File | null;
    buffer?: ArrayBuffer | Uint8Array | null;
}

function SkeletonCard({ label }: { label: string }) {
    return (
        <div className="flex flex-col items-center justify-center p-6 relative min-h-[340px] w-full rounded-2xl bg-white/80 border border-slate-200/90 shadow-xs animate-pulse overflow-hidden">
            {/* Circular PCB Skeleton Placeholder */}
            <div className="w-52 h-52 rounded-full bg-slate-200/80 mb-5 flex items-center justify-center relative shadow-inner">
                <div className="w-40 h-40 rounded-full border-4 border-dashed border-slate-300/80 animate-spin" style={{ animationDuration: '6s' }} />
                <div className="w-20 h-20 rounded-full bg-slate-300/60 flex items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-slate-400 animate-ping" />
                </div>
            </div>

            {/* Skeleton Labels */}
            <div className="h-4 w-40 bg-slate-200 rounded-md mb-2" />
            <div className="h-3 w-52 bg-slate-100 rounded-md" />
            <span className="text-[11px] font-semibold text-slate-400 mt-3 tracking-wide">{label}</span>
        </div>
    );
}

export default function GerberStackupPreview({ topSvg, bottomSvg, loading }: GerberStackupPreviewProps) {
    if (loading) {
        return (
            <div className="w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 items-center justify-center">
                    <SkeletonCard label="Extracting ZIP & Rendering Front View..." />
                    <SkeletonCard label="Extracting ZIP & Rendering Back View..." />
                </div>
            </div>
        );
    }

    if (!topSvg && !bottomSvg) {
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
                <div className="flex flex-col items-center justify-center p-2 relative min-h-[320px]">
                    {topSvg ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: topSvg }}
                            className="w-full h-full min-h-[300px] max-h-[460px] flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[440px] [&>svg]:mx-auto [&>svg]:object-contain"
                        />
                    ) : (
                        <div className="text-slate-400 text-xs font-medium py-16">No Top Layer Detected</div>
                    )}
                </div>

                {/* Back View */}
                <div className="flex flex-col items-center justify-center p-2 relative min-h-[320px]">
                    {bottomSvg ? (
                        <div
                            dangerouslySetInnerHTML={{ __html: bottomSvg }}
                            className="w-full h-full min-h-[300px] max-h-[460px] flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[440px] [&>svg]:mx-auto [&>svg]:object-contain"
                        />
                    ) : (
                        <div className="text-slate-400 text-xs font-medium py-16">No Bottom Layer Detected</div>
                    )}
                </div>
            </div>
        </div>
    );
}
