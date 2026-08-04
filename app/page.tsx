"use client";

import { useState } from "react";
import PCBSpecification from "@/components/PCBSpecification";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Check, Cpu, Grid, Layers, Sparkles } from "lucide-react";

export default function Home() {
    const [selectedProduct, setSelectedProduct] = useState<"pcb" | "stencil">("pcb");

    return (
        <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col">
            <Header />
            <main className="flex-1">
                {/* <div className="max-w-[1550px] mx-auto px-4 pt-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-5 sm:p-6 mb-2">
                        <div className="flex items-center gap-2 mb-4">
                            <h2 className="text-base font-bold text-gray-900 tracking-tight">Select Product</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">                            <div
                                onClick={() => setSelectedProduct("pcb")}
                                className={`relative flex items-center gap-4.5 p-4.5 sm:p-5 rounded-xl border-2 transition-all cursor-pointer select-none group ${selectedProduct === "pcb"
                                    ? "border-blue-600 bg-gradient-to-r from-blue-50/70 via-blue-50/30 to-white shadow-md shadow-blue-500/5 ring-1 ring-blue-500/20"
                                    : "border-gray-200/90 bg-white hover:border-gray-300 hover:bg-gray-50/50 shadow-sm"
                                    }`}
                            >
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 bg-gray-50/80 border border-gray-100 p-1.5 overflow-hidden">
                                    <img src="/images/pcb-logo.png" alt="Standard PCB/PCBA" className="w-full h-full object-contain transform scale-125" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="mb-1">
                                        <h3 className={`text-base font-bold tracking-tight ${selectedProduct === "pcb" ? "text-blue-900" : "text-gray-900"}`}>
                                            Standard PCB / PCBA
                                        </h3>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium line-clamp-1 mb-2">
                                        Custom printed circuit board fabrication & SMT/DIP assembly
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200/60">Multi Layers</span>
                                        <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200/60">FR-4 / Aluminum</span>
                                        <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200/60">Fast Turnaround</span>
                                    </div>
                                </div>
                            </div>

                            <div
                                onClick={() => setSelectedProduct("stencil")}
                                className={`relative flex items-center gap-4.5 p-4.5 sm:p-5 rounded-xl border-2 transition-all cursor-pointer select-none group ${selectedProduct === "stencil"
                                    ? "border-blue-600 bg-gradient-to-r from-blue-50/70 via-blue-50/30 to-white shadow-md shadow-blue-500/5 ring-1 ring-blue-500/20"
                                    : "border-gray-200/90 bg-white hover:border-gray-300 hover:bg-gray-50/50 shadow-sm"
                                    }`}
                            >
                                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 bg-gray-50/80 border border-gray-100 p-1.5 overflow-hidden">
                                    <img src="/images/stencil-logo.png" alt="SMT Stencil" className="w-full h-full object-contain transform scale-125" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="mb-1">
                                        <h3 className={`text-base font-bold tracking-tight ${selectedProduct === "stencil" ? "text-blue-900" : "text-gray-900"}`}>
                                            SMT Stencil
                                        </h3>
                                    </div>
                                    <p className="text-xs text-gray-500 font-medium line-clamp-1 mb-2">
                                        High precision laser-cut stainless steel stencils for SMT paste
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200/60">Framework / Frameless</span>
                                        <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200/60">High Precision</span>
                                        <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200/60">Lead-Free</span>
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