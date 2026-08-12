"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Download, Trash2, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardSidebar from "@/components/DashboardSidebar";
import GerberBoardPreview from "@/components/GerberBoardPreview";

interface GerberFileItem {
    id: number;
    original_name: string;
    file_name: string;
    file_path?: string;
    file_url?: string;
    file_size?: string;
    board_name?: string;
    preview_data?: string;
    created_at: string;
}

function GerberFilesSkeleton() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-gray-200/80 bg-white flex items-start gap-3 animate-pulse">
                    <div className="w-20 h-20 rounded-xl bg-gray-200 shrink-0"></div>
                    <div className="flex-1 space-y-2">
                        <div className="h-3 bg-gray-200 rounded w-40"></div>
                        <div className="h-2.5 bg-gray-200 rounded w-24"></div>
                    </div>
                </div>
            ))}
        </div>
    );
}

function GerberFilesContent() {
    const router = useRouter();
    const [gerberFiles, setGerberFiles] = useState<GerberFileItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState<{ id?: string | number } | null>(null);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const savedUser = localStorage.getItem("megabyte_user");
                const token = localStorage.getItem("megabyte_user_token");

                if (!token || !savedUser) {
                    router.push("/login?redirect=/gerber-files");
                    return;
                }

                const userObj = JSON.parse(savedUser);
                setUser(userObj);

                if (userObj?.id) {
                    const res = await fetch(`/api/dashboard/gerber-files?user_id=${userObj.id}`);
                    const data = await res.json();
                    if (data.status) {
                        setGerberFiles(data.gerber_files || []);
                    }
                }
            } catch (e) {
                console.error("Gerber files fetch error:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchFiles();
    }, [router]);

    const handleDeleteGerberFile = async (fileId: number) => {
        if (!user?.id) return;
        if (!window.confirm("Are you sure you want to delete this Gerber file?")) return;

        try {
            const res = await fetch("/api/dashboard/delete-gerber", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: fileId, user_id: user.id })
            });

            const data = await res.json();
            if (data.status) {
                setGerberFiles((prev) => prev.filter((f) => f.id !== fileId));
            } else {
                alert(data.message || "Failed to delete Gerber file.");
            }
        } catch (e) {
            console.error("Delete gerber error:", e);
        }
    };

    return (
        <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#0f172a] text-gray-900 dark:text-gray-100 flex flex-col lg:flex-row font-sans transition-colors">
            <DashboardSidebar />

            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                <Header />

                <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                    {/* Header Banner */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-gray-200/80 dark:border-zinc-800 shadow-2xs">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                                Gerber Files Library
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mt-0.5">
                                Manage and download your PCB Gerber archives.
                            </p>
                        </div>

                        <Link
                            href="/"
                            className="px-5 py-2.5 rounded-full bg-primary hover:bg-secondary text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Upload New Gerber</span>
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-gray-200/80 dark:border-zinc-800 p-6 shadow-2xs space-y-5">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4">
                            <div>
                                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Gerber Files Library</h2>
                                <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">Access your uploaded PCB Gerber archives.</p>
                            </div>
                            <span className="text-xs font-bold text-primary dark:text-emerald-400 bg-primary/10 dark:bg-emerald-950/60 px-3 py-1 rounded-full">
                                {gerberFiles.length} Files
                            </span>
                        </div>

                        {loading ? (
                            <GerberFilesSkeleton />
                        ) : gerberFiles.length === 0 ? (
                            <div className="py-16 text-center text-xs text-gray-400 dark:text-zinc-500 font-medium">
                                No Gerber files uploaded yet.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {gerberFiles.map((file) => (
                                    <div key={file.id} className="p-4 rounded-xl border border-gray-200/80 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/40 flex items-start justify-between gap-3 group hover:border-gray-300 dark:hover:border-zinc-700 transition-all">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#0b3818] rounded-xl border border-gray-200/90 dark:border-zinc-700 flex items-center justify-center p-1 overflow-hidden shrink-0 relative shadow-sm">
                                                <GerberBoardPreview previewData={file.preview_data} originalName={file.original_name} boardName={file.board_name} />
                                            </div>

                                            <div className="min-w-0 space-y-1">
                                                <h4 className="text-xs font-extrabold text-gray-900 dark:text-white truncate max-w-[180px]" title={file.original_name}>
                                                    {file.original_name}
                                                </h4>
                                                <p className="text-[11px] text-gray-500 dark:text-zinc-400 font-medium">
                                                    Uploaded: {new Date(file.created_at).toLocaleDateString()} {file.file_size ? `| ${file.file_size}` : ""}
                                                </p>
                                                {file.file_url && (
                                                    <a
                                                        href={file.file_url}
                                                        download={file.original_name || "gerber_archive.zip"}
                                                        className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-0.5 cursor-pointer"
                                                    >
                                                        <Download className="w-3 h-3" />
                                                        <span>Download Archive</span>
                                                    </a>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleDeleteGerberFile(file.id)}
                                            title="Delete Gerber File"
                                            className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    );
}

export default function GerberFilesPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <GerberFilesContent />
        </Suspense>
    );
}
