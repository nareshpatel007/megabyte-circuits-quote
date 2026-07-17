"use client";

import Link from "next/link";
import { AlertCircle, Home, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col">
            <Header />

            {/* Main Content */}
            <main className="flex-1 flex items-center justify-center px-4 pt-14">
                <div className="max-w-2xl w-full">
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center">
                                <AlertCircle className="h-12 w-12 text-red-500" />
                            </div>
                        </div>

                        <h1 className="text-4xl font-black text-gray-900 mb-4">404</h1>
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Page Not Found</h2>
                        
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            The page you are looking for doesn't exist or has been moved. Please check the URL or navigate back to the homepage.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
                            >
                                <Home className="w-5 h-5" />
                                Back to Home
                            </Link>
                            <button
                                onClick={() => window.history.back()}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 font-bold rounded-xl transition-all"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Go Back
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
