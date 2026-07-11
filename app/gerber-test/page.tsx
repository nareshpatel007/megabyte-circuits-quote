"use client";

import React, { useState, ChangeEvent } from "react";
import { Upload, AlertCircle, CheckCircle, RefreshCw, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { UploadResponse } from "@/src/lib/gerber/types";

export default function GerberTestPage() {
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<UploadResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [color, setColor] = useState<string>("#52c41a");

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selected = e.target.files[0];
            setFile(selected);
            setError(null);
            setResponse(null);
        }
    };

    const handleUpload = async () => {
        if (!file) return;
        setLoading(true);
        setError(null);

        const formData = new FormData();
        formData.append("file", file);

        try {
            const res = await fetch("/api/gerber/upload", {
                method: "POST",
                body: formData,
            });
            const data = await res.json();
            if (data.success) {
                setResponse(data);
            } else {
                setError(data.error || "Failed to parse Gerber files.");
            }
        } catch (err: any) {
            setError("Server connection failed.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="border-b border-slate-800 pb-6 flex flex-col gap-2">
                    <h1 className="text-3xl font-extrabold tracking-tight text-white bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                        Production Gerber Parser & Vector Previewer
                    </h1>
                    <p className="text-slate-400 text-sm">
                        Powered by `@tracespace/parser` and `@tracespace/plotter`. Upload your ZIP archive to view diagnostics and composite vector previews.
                    </p>
                </div>

                {/* Main Body Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Controls Panel */}
                    <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-6 shadow-xl h-fit">
                        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3">
                            Upload Archive
                        </h2>

                        <div className="space-y-4">
                            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-emerald-500/50 bg-slate-950 hover:bg-slate-900/50 p-6 rounded-2xl cursor-pointer transition-all">
                                <Upload className="w-8 h-8 text-slate-500 mb-2" />
                                <span className="text-xs font-semibold text-slate-300">
                                    {file ? file.name : "Select Gerber ZIP"}
                                </span>
                                <span className="text-[10px] text-slate-500 mt-1">
                                    Max 100 MB (.zip)
                                </span>
                                <input
                                    type="file"
                                    accept=".zip"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </label>

                            <button
                                type="button"
                                onClick={handleUpload}
                                disabled={!file || loading}
                                className={`w-full py-3.5 px-4 rounded-xl text-xs font-bold shadow-md tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                                    !file || loading
                                        ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                                        : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black"
                                }`}
                            >
                                {loading ? (
                                    <>
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                        Processing...
                                    </>
                                ) : (
                                    "Analyze Gerber"
                                )}
                            </button>
                        </div>

                        {/* Theme Select */}
                        {response && (
                            <div className="space-y-3 pt-4 border-t border-slate-800">
                                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Solder Mask Color
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { hex: "#52c41a", label: "Green" },
                                        { hex: "#722ed1", label: "Purple" },
                                        { hex: "#f5222d", label: "Red" },
                                        { hex: "#fadb14", label: "Yellow" },
                                        { hex: "#1677ff", label: "Blue" },
                                        { hex: "#000000", label: "Black" },
                                        { hex: "#ffffff", label: "White" }
                                    ].map(c => (
                                        <button
                                            key={c.hex}
                                            type="button"
                                            onClick={() => setColor(c.hex)}
                                            style={{ backgroundColor: c.hex }}
                                            title={c.label}
                                            className={`w-6 h-6 rounded-full border cursor-pointer transition-transform ${
                                                color === c.hex ? "scale-125 border-white ring-2 ring-emerald-500/45" : "border-slate-800 hover:scale-110"
                                            }`}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {error && (
                            <div className="bg-rose-950/30 border border-rose-900/50 p-4 rounded-2xl flex gap-3 text-rose-300">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <div className="text-xs">
                                    <p className="font-bold">Error Occurred</p>
                                    <p className="mt-1 leading-relaxed">{error}</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Previews and Diagnostics Panel */}
                    <div className="md:col-span-2 space-y-8">
                        {response ? (
                            <>
                                {/* Previews Grid */}
                                <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-6 shadow-xl">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Top View (Front)
                                            </span>
                                            <div className="w-full h-80 bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden relative flex items-center justify-center p-4">
                                                <img
                                                    src={response.previewFront}
                                                    alt="Front preview"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                                Bottom View (Back)
                                            </span>
                                            <div className="w-full h-80 bg-slate-950 border border-slate-850 rounded-2xl overflow-hidden relative flex items-center justify-center p-4">
                                                <img
                                                    src={response.previewBack}
                                                    alt="Back preview"
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Diagnostics */}
                                <div className="bg-slate-900 border border-slate-850 p-6 rounded-3xl space-y-6 shadow-xl">
                                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300 border-b border-slate-800 pb-3">
                                        Gerber Diagnostics Report
                                    </h3>
                                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Dimensions</span>
                                            <p className="text-base font-bold text-slate-200">
                                                {response.width_mm} × {response.height_mm} mm
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Board Shape</span>
                                            <p className="text-base font-bold text-slate-200">
                                                {response.boardShape}
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Layer Count</span>
                                            <p className="text-base font-bold text-slate-200">
                                                {response.layerCount} Layers
                                            </p>
                                        </div>
                                        <div className="space-y-1">
                                            <span className="text-[10px] text-slate-500 uppercase font-semibold">Drills Hits</span>
                                            <p className="text-base font-bold text-slate-200">
                                                {response.drillCount} Holes
                                            </p>
                                        </div>
                                    </div>

                                    {/* Warnings list */}
                                    {response.warnings && response.warnings.length > 0 && (
                                        <div className="bg-amber-950/20 border border-amber-900/40 p-4 rounded-xl space-y-1.5">
                                            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
                                                <AlertCircle className="w-4 h-4" />
                                                <span>Warnings</span>
                                            </div>
                                            <ul className="list-disc list-inside text-xs text-amber-300 space-y-1">
                                                {response.warnings.map((w, idx) => (
                                                    <li key={idx}>{w}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {/* File details list */}
                                    {response.files && (
                                        <div className="space-y-3">
                                            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                                Parsed Files
                                            </span>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                {response.files.map((file, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="flex items-center justify-between px-3 py-2 bg-slate-950 border border-slate-850 rounded-xl text-xs"
                                                    >
                                                        <span className="font-semibold text-slate-300 truncate max-w-[70%]">
                                                            {file.name}
                                                        </span>
                                                        <span className="text-[9px] bg-slate-800 text-emerald-400 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                                                            {file.type}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="h-96 border border-slate-850 rounded-3xl flex flex-col items-center justify-center text-slate-600 bg-slate-900/30">
                                <Upload className="w-12 h-12 mb-3 text-slate-700 animate-bounce" />
                                <p className="text-sm font-semibold">Upload Gerber files archive to run analysis.</p>
                                <p className="text-xs text-slate-700 mt-1">Supports standard KiCad, Altium, Eagle, EasyEDA ZIP exports.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
