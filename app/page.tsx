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
                <PCBSpecification selectedProduct={selectedProduct} />
            </main>
            <Footer />
        </div>
    );
}