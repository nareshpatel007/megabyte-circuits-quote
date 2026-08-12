"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import PCBSpecification from "@/components/PCBSpecification";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardSidebar from "@/components/DashboardSidebar";
import { Plus } from "lucide-react";
import { getAuthToken, getAuthUser } from "@/lib/auth";

export default function QuotePage() {
    const router = useRouter();
    const [selectedProduct, setSelectedProduct] = useState<"pcb" | "stencil">("pcb");
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        try {
            const token = getAuthToken();
            const user = getAuthUser();
            if (token && user) {
                setIsLoggedIn(true);
            } else {
                setIsLoggedIn(false);
            }
        } catch (e) {
            console.error("Auth check error:", e);
        }
        setIsCheckingAuth(false);
    }, []);

    if (isCheckingAuth) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#030712] text-gray-900 dark:text-gray-100 flex flex-col lg:flex-row font-sans transition-colors">
            {isLoggedIn && <DashboardSidebar />}

            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                <Header />

                <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                    {/* Header Banner */}
                    {isLoggedIn && (
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0b0f19] p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-2xs">
                            <div>
                                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                                    Instant Quote
                                </h1>
                                <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mt-0.5">
                                    Calculate instant custom PCB specification pricing and place an order.
                                </p>
                            </div>
                        </div>
                    )}

                    <PCBSpecification selectedProduct={selectedProduct} isLoggedIn={isLoggedIn} />
                </main>

                <Footer />
            </div>
        </div>
    );
}
