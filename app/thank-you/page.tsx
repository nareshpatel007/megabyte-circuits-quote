"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Package, Calendar, IndianRupee, ArrowLeft, Home, Sparkles, Clock, Mail, Phone, Shield, Truck } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface OrderData {
    order_id: number;
    order_number: string;
    status: string;
    total_value: string;
    delivery_date: string;
    lead_time_days?: number;
    board_name?: string;
    user_email?: string;
    user_mobile?: string;
}

export default function ThankYouPage() {
    const [orderData, setOrderData] = useState<OrderData | null>(null);
    const [ordersList, setOrdersList] = useState<any[]>([]);
    const [txnNumber, setTxnNumber] = useState<string>("");
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);

        const latestOrders = sessionStorage.getItem('latest_orders');
        const latestTxn = sessionStorage.getItem('latest_txn');

        if (latestOrders) {
            try {
                const parsed = JSON.parse(latestOrders);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setOrdersList(parsed);
                }
            } catch (e) {}
        }

        if (latestTxn) {
            setTxnNumber(latestTxn);
        }

        // Fallback or single order
        const savedOrder = localStorage.getItem('lastOrder');
        if (savedOrder) {
            try {
                setOrderData(JSON.parse(savedOrder));
            } catch (error) {
                console.error('Failed to parse order data:', error);
            }
        }
        setLoading(false);
    }, []);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="relative">
                            <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                            </div>
                        </div>
                        <p className="mt-6 text-gray-600 font-medium">Loading your order details...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!orderData && ordersList.length === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl p-12 text-center max-w-md border border-white/20">
                        <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                            <Package className="h-10 w-10 text-red-500" />
                        </div>
                        <h1 className="text-3xl font-black text-gray-900 mb-4">Order Not Found</h1>
                        <p className="text-gray-600 mb-8 leading-relaxed">
                            We couldn&apos;t find your order details. Please check your email for confirmation or contact our support team.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white font-bold rounded-2xl shadow-xl transition-all transform hover:scale-105 active:scale-95"
                            >
                                <Home className="w-5 h-5" />
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50/20 to-emerald-50/30 text-slate-800 font-sans flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="max-w-4xl w-full">
                    {/* Modern Light Card */}
                    <div className="bg-white/90 backdrop-blur-xl rounded-3xl shadow-xl overflow-hidden border border-slate-200/80 relative">
                        {/* Background Glow Accents */}
                        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
                        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-400/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20"></div>

                        {/* Top Hero Section */}
                        <div className="p-8 md:p-12 text-center border-b border-slate-100 relative z-10 bg-gradient-to-b from-slate-50/80 to-transparent">
                            <div className="w-20 h-20 bg-gradient-to-tr from-emerald-500 to-teal-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20 transform hover:scale-105 transition-transform duration-300">
                                <CheckCircle className="h-10 w-10 text-white" />
                            </div>
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-100 border border-emerald-200 rounded-full text-xs font-extrabold text-emerald-800 mb-4 tracking-wide uppercase">
                                <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Order Confirmed
                            </span>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 mb-3">
                                Thank You For Your Order!
                            </h1>
                            <p className="text-slate-600 text-sm md:text-base max-w-lg mx-auto font-medium">
                                We&apos;ve received your PCB manufacturing request and payment. Our engineering team is preparing your design files for CAM review.
                            </p>
                        </div>

                        {/* Main Grid Details */}
                        <div className="p-6 md:p-10 space-y-6 relative z-10">
                            {/* Primary Order Bar / Multi-order List */}
                            {ordersList.length > 0 ? (
                                <div className="space-y-3">
                                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                                        Generated Orders ({ordersList.length} Items Split)
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {ordersList.map((ord: any, idx: number) => (
                                            <div key={idx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                                                <div>
                                                    <span className="text-[10px] text-gray-500 font-bold uppercase block">Order #{ord.order_number}</span>
                                                    <span className="text-sm font-extrabold text-slate-900">{ord.board_name}</span>
                                                </div>
                                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg">
                                                    ₹{ord.price}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                    {txnNumber && (
                                        <p className="text-xs text-gray-500 font-mono mt-2">
                                            Transaction Ref: <strong className="text-slate-800">{txnNumber}</strong>
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                                    <div className="flex items-center gap-3.5">
                                        <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-emerald-600">
                                            <Package className="h-6 w-6" />
                                        </div>
                                        <div>
                                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Order Reference Number</span>
                                            <span className="text-xl font-black text-slate-900 font-mono tracking-wide">{orderData?.order_number}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100/80 border border-emerald-200 rounded-xl">
                                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping"></span>
                                        <span className="text-xs font-extrabold text-emerald-800 capitalize">{orderData?.status || "Submitted"}</span>
                                    </div>
                                </div>
                            )}

                            {/* 3 Metric Cards Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Total Value */}
                                <div className="bg-gradient-to-br from-blue-50/60 to-indigo-50/40 border border-blue-100 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">Total Amount</span>
                                        <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                                            <IndianRupee className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-slate-900">₹{orderData?.total_value || "0"}</p>
                                </div>

                                {/* Delivery Date */}
                                <div className="bg-gradient-to-br from-purple-50/60 to-pink-50/40 border border-purple-100 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-purple-700 uppercase tracking-wider">Estimated Delivery</span>
                                        <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                                            <Calendar className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <p className="text-xl font-black text-slate-900 font-mono">
                                        {orderData?.delivery_date || "3-5 Business Days"}
                                    </p>
                                </div>

                                {/* Board Name */}
                                <div className="bg-gradient-to-br from-teal-50/60 to-emerald-50/40 border border-teal-100 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-teal-700 uppercase tracking-wider">Project Name</span>
                                        <div className="p-2 bg-teal-100 text-teal-600 rounded-xl">
                                            <Shield className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <p className="text-base font-bold text-slate-900 truncate">
                                        {orderData?.board_name || "PCB Manufacturing"}
                                    </p>
                                </div>
                            </div>

                            {/* Contact Details & Pipeline Steps */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Customer Contact Card */}
                                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-emerald-600" /> Contact Details
                                    </h3>
                                    <div className="space-y-2 text-xs font-medium">
                                        {orderData?.user_email && (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <span className="text-slate-400">Email:</span>
                                                <span className="font-bold text-slate-900 truncate">{orderData.user_email}</span>
                                            </div>
                                        )}
                                        {orderData?.user_mobile && (
                                            <div className="flex items-center gap-2 text-slate-600">
                                                <span className="text-slate-400">Phone:</span>
                                                <span className="font-bold text-slate-900">{orderData.user_mobile}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Next Steps Timeline */}
                                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-3">
                                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-amber-600" /> Manufacturing Steps
                                    </h3>
                                    <div className="flex items-center justify-between text-xs gap-2">
                                        <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                                            <span className="w-5 h-5 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-[10px]">1</span>
                                            <span>CAM Review</span>
                                        </div>
                                        <span className="text-slate-300">→</span>
                                        <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                                            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">2</span>
                                            <span>Drilling</span>
                                        </div>
                                        <span className="text-slate-300">→</span>
                                        <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
                                            <span className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center text-[10px]">3</span>
                                            <span>Dispatch</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-3 pt-4">
                                <Link
                                    href="/"
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold rounded-2xl shadow-lg shadow-emerald-600/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] text-sm"
                                >
                                    <Home className="w-4 h-4" />
                                    Back to Home
                                </Link>
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-900 font-bold rounded-2xl shadow-sm transition-all transform hover:scale-[1.02] active:scale-[0.98] text-sm cursor-pointer"
                                >
                                    <Package className="w-4 h-4" />
                                    Print Receipt
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
