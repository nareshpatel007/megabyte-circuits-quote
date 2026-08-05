"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PCBSpecification from "@/components/PCBSpecification";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Check, Cpu, Grid, Layers, Sparkles } from "lucide-react";
import { getAuthToken, getAuthUser } from "@/lib/auth";

export default function Home() {
    const router = useRouter();
    const [selectedProduct, setSelectedProduct] = useState<"pcb" | "stencil">("pcb");
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    useEffect(() => {
        try {
            const token = getAuthToken();
            const user = getAuthUser();
            if (token && user) {
                router.replace("/dashboard");
                return;
            }
        } catch (e) {
            console.error("Auth check error:", e);
        }
        setIsCheckingAuth(false);
    }, [router]);

    if (isCheckingAuth) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col">
            <Header />
            <main className="flex-1">
                {/* <div className="max-w-[1550px] mx-auto px-4 pt-6">
                    <div className="bg-[#059669]/10 dark:bg-[#064e3b]/30 backdrop-blur-md rounded-2xl shadow-inner border border-[#10b981]/20 p-5 sm:p-6 mb-4 relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                                <h2 className="text-sm font-bold text-emerald-950 dark:text-emerald-100 uppercase tracking-wider">
                                    Select Product Category
                                </h2>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                            <div
                                onClick={() => setSelectedProduct("pcb")}
                                className={`relative p-5 sm:p-6 rounded-sm transition-all duration-300 cursor-pointer select-none group transform hover:-translate-y-1.5 hover:rotate-0 shadow-md hover:shadow-xl ${
                                    selectedProduct === "pcb"
                                        ? "bg-[#ecfdf5] border-t-4 border-t-emerald-600 text-emerald-950 rotate-[-1deg] ring-2 ring-emerald-500/40 scale-[1.01]"
                                        : "bg-[#f0fdf4] text-emerald-900/90 rotate-[-1.5deg] hover:bg-[#ecfdf5] opacity-90 hover:opacity-100 border border-emerald-200/60"
                                }`}
                                style={{
                                    boxShadow: selectedProduct === "pcb"
                                        ? "0 10px 25px -5px rgba(16, 185, 129, 0.25), 0 8px 10px -6px rgba(16, 185, 129, 0.15)"
                                        : "3px 4px 12px rgba(0,0,0,0.06)"
                                }}
                            >
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 transition-transform group-hover:scale-110">
                                    <div className="w-5 h-5 rounded-full bg-emerald-600 border-2 border-emerald-700 shadow-md flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-200" />
                                    </div>
                                    <div className="w-0.5 h-1.5 bg-emerald-800/40 mx-auto -mt-0.5" />
                                </div>

                                {selectedProduct === "pcb" && (
                                    <div className="absolute top-3 right-3 bg-emerald-600 text-white rounded-full p-1 shadow-sm">
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                )}

                                <div className="flex items-center gap-4 pt-1">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 bg-emerald-100/80 border border-emerald-200 p-2 overflow-hidden shadow-inner">
                                        <img src="/images/pcb-logo.png" alt="Standard PCB/PCBA" className="w-full h-full object-contain transform scale-125 drop-shadow-sm" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-emerald-950 mb-1">
                                            Standard PCB / PCBA
                                        </h3>
                                        <p className="text-xs text-emerald-800/90 font-medium line-clamp-2 mb-2.5">
                                            Custom printed circuit board fabrication & SMT/DIP assembly
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="text-[10px] font-semibold bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300/80">Multi Layers</span>
                                            <span className="text-[10px] font-semibold bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300/80">FR-4 / Aluminum</span>
                                            <span className="text-[10px] font-semibold bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded border border-emerald-300/80">Fast Turnaround</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div
                                onClick={() => setSelectedProduct("stencil")}
                                className={`relative p-5 sm:p-6 rounded-sm transition-all duration-300 cursor-pointer select-none group transform hover:-translate-y-1.5 hover:rotate-0 shadow-md hover:shadow-xl ${
                                    selectedProduct === "stencil"
                                        ? "bg-[#e6f4ea] border-t-4 border-t-teal-600 text-teal-950 rotate-[1deg] ring-2 ring-teal-500/40 scale-[1.01]"
                                        : "bg-[#edf7f0] text-teal-900/90 rotate-[1.5deg] hover:bg-[#e6f4ea] opacity-90 hover:opacity-100 border border-teal-200/60"
                                }`}
                                style={{
                                    boxShadow: selectedProduct === "stencil"
                                        ? "0 10px 25px -5px rgba(13, 148, 136, 0.25), 0 8px 10px -6px rgba(13, 148, 136, 0.15)"
                                        : "3px 4px 12px rgba(0,0,0,0.06)"
                                }}
                            >
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 transition-transform group-hover:scale-110">
                                    <div className="w-5 h-5 rounded-full bg-teal-600 border-2 border-teal-700 shadow-md flex items-center justify-center">
                                        <div className="w-1.5 h-1.5 rounded-full bg-teal-100" />
                                    </div>
                                    <div className="w-0.5 h-1.5 bg-teal-800/40 mx-auto -mt-0.5" />
                                </div>


                                {selectedProduct === "stencil" && (
                                    <div className="absolute top-3 right-3 bg-teal-600 text-white rounded-full p-1 shadow-sm">
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                    </div>
                                )}

                                <div className="flex items-center gap-4 pt-1">
                                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 bg-teal-100/80 border border-teal-200 p-2 overflow-hidden shadow-inner">
                                        <img src="/images/stencil-logo.png" alt="SMT Stencil" className="w-full h-full object-contain transform scale-125 drop-shadow-sm" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-teal-950 mb-1">
                                            SMT Stencil
                                        </h3>
                                        <p className="text-xs text-teal-800/90 font-medium line-clamp-2 mb-2.5">
                                            High precision laser-cut stainless steel stencils for SMT paste
                                        </p>
                                        <div className="flex flex-wrap gap-1.5">
                                            <span className="text-[10px] font-semibold bg-teal-200/70 text-teal-900 px-2 py-0.5 rounded border border-teal-300/80">Framework / Frameless</span>
                                            <span className="text-[10px] font-semibold bg-teal-200/70 text-teal-900 px-2 py-0.5 rounded border border-teal-300/80">High Precision</span>
                                            <span className="text-[10px] font-semibold bg-teal-200/70 text-teal-900 px-2 py-0.5 rounded border border-teal-300/80">Lead-Free</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div> */}
                <PCBSpecification selectedProduct={selectedProduct} />
            </main>
            <Footer />
        </div>
    );
}