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
            <div className="w-52 h-52 rounded-full bg-slate-200/80 mb-5 flex items-center justify-center relative shadow-inner">
                <div className="w-40 h-40 rounded-full border-4 border-dashed border-slate-300/80 animate-spin" style={{ animationDuration: '6s' }} />
                <div className="w-20 h-20 rounded-full bg-slate-300/60 flex items-center justify-center">
                    <span className="w-3 h-3 rounded-full bg-slate-400 animate-ping" />
                </div>
            </div>

            <div className="h-4 w-40 bg-slate-200 rounded-md mb-2" />
            <div className="h-3 w-52 bg-slate-100 rounded-md" />
            <span className="text-[11px] font-semibold text-slate-400 mt-3 tracking-wide">{label}</span>
        </div>
    );
}

function RenderPreviewContent({ content, alt }: { content?: string; alt: string }) {
    if (!content) {
        return <div className="text-slate-400 text-xs font-medium py-16">No {alt} Detected</div>;
    }

    // Check if SVG string
    if (content.includes("<svg") || content.trim().startsWith("<svg")) {
        return (
            <div
                dangerouslySetInnerHTML={{ __html: content }}
                className="w-full h-auto flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:mx-auto [&>svg]:object-contain"
            />
        );
    }

    // Otherwise treat as URL or base64 image
    return (
        <img
            src={content}
            alt={alt}
            className="w-full h-auto object-contain mx-auto transition-transform hover:scale-[1.005]"
        />
    );
}

export default function GerberStackupPreview({ topSvg, bottomSvg, loading }: GerberStackupPreviewProps) {
    if (loading) {
        return (
            <div className="w-full">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center">
                    <SkeletonCard label="Analyzing Gerber & Rendering Front View..." />
                    <SkeletonCard label="Analyzing Gerber & Rendering Back View..." />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center justify-center">
                {/* Front View */}
                <div className="flex flex-col items-center justify-center w-full relative">
                    <RenderPreviewContent content={topSvg} alt="PCB Front Preview" />
                </div>

                {/* Back View */}
                <div className="flex flex-col items-center justify-center w-full relative">
                    <RenderPreviewContent content={bottomSvg} alt="PCB Back Preview" />
                </div>
            </div>
        </div>
    );
}
