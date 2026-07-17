"use client";

import PCBSpecification from "@/components/PCBSpecification";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Home() {
    return (
        <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col">
            <Header />
            <main className="flex-1">
                <PCBSpecification />
            </main>
            <Footer />
        </div>
    );
}