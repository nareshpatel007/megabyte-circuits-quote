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
    board_name?: string;
    user_email?: string;
    user_mobile?: string;
}

export default function ThankYouPage() {
    const [orderData, setOrderData] = useState<OrderData | null>(null);
    const [loading, setLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Get order data from localStorage
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

    if (!orderData) {
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
                            We couldn't find your order details. Please check your email for confirmation or contact our support team.
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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 font-sans flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="max-w-7xl w-full">
                    <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/20">
                        {/* Horizontal Layout */}
                        <div className="flex flex-col lg:flex-row">
                            {/* Left Side - Success Message */}
                            <div className="lg:w-1/2 bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 p-12 relative overflow-hidden">
                                <div className="absolute inset-0 opacity-10">
                                    <div className="absolute top-4 left-4 w-32 h-32 bg-emerald-400 rounded-full blur-3xl"></div>
                                    <div className="absolute bottom-4 right-4 w-40 h-40 bg-cyan-400 rounded-full blur-3xl"></div>
                                </div>
                                <div className="relative z-10 h-full flex flex-col justify-center">
                                    <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center mb-6 shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                                        <CheckCircle className="h-12 w-12 text-white" />
                                    </div>
                                    <h1 className="text-4xl font-black bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-3">
                                        Order Submitted Successfully!
                                    </h1>
                                    <p className="text-gray-600 text-lg mb-6">Thank you for choosing Megabyte Circuit</p>
                                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-sm rounded-full border border-emerald-200 w-fit">
                                        <Sparkles className="h-4 w-4 text-amber-500" />
                                        <span className="text-sm font-semibold text-emerald-700">Premium Quality Guaranteed</span>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side - Order Details */}
                            <div className="lg:w-1/2 p-10 space-y-6">
                                {/* Order Number */}
                                <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-6 border border-slate-200 shadow-sm">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                                                <Package className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Order Number</span>
                                                <p className="text-xl font-black text-gray-900">{orderData.order_number}</p>
                                            </div>
                                        </div>
                                        <div className="px-4 py-2 bg-gradient-to-r from-green-100 to-emerald-100 rounded-xl border border-green-200">
                                            <span className="text-sm font-bold text-green-700 capitalize">{orderData.status}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Horizontal Value Cards */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 border border-blue-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-shadow">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-blue-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <IndianRupee className="h-4 w-4 text-blue-600" />
                                                <span className="text-xs font-semibold text-blue-700">Total Value</span>
                                            </div>
                                            <p className="text-3xl font-black text-gray-900">₹{orderData.total_value}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-5 border border-purple-100 shadow-sm relative overflow-hidden group hover:shadow-lg transition-shadow">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-purple-200/30 rounded-full blur-2xl group-hover:scale-150 transition-transform"></div>
                                        <div className="relative z-10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Calendar className="h-4 w-4 text-purple-600" />
                                                <span className="text-xs font-semibold text-purple-700">Delivery</span>
                                            </div>
                                            <p className="text-3xl font-black text-gray-900">{orderData.delivery_date}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Horizontal Customer Info */}
                                <div className="bg-gradient-to-r from-slate-50 to-gray-50 rounded-2xl p-5 border border-slate-200">
                                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Shield className="h-4 w-4 text-primary" />
                                        Customer Information
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        {orderData.board_name && (
                                            <div className="flex items-center gap-2">
                                                <Package className="h-3 w-3 text-gray-500" />
                                                <span className="text-xs text-gray-600 truncate">{orderData.board_name}</span>
                                            </div>
                                        )}
                                        {orderData.user_email && (
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-3 w-3 text-gray-500" />
                                                <span className="text-xs text-gray-600 truncate">{orderData.user_email}</span>
                                            </div>
                                        )}
                                        {orderData.user_mobile && (
                                            <div className="flex items-center gap-2">
                                                <Phone className="h-3 w-3 text-gray-500" />
                                                <span className="text-xs text-gray-600">{orderData.user_mobile}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Horizontal Next Steps */}
                                <div className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-2xl p-5 border border-amber-200 shadow-sm">
                                    <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-amber-600" />
                                        What's Next?
                                    </h3>
                                    <div className="flex gap-4">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-[10px] font-bold text-amber-700">1</span>
                                            </div>
                                            <p className="text-xs text-gray-700">Email sent</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-[10px] font-bold text-amber-700">2</span>
                                            </div>
                                            <p className="text-xs text-gray-700">Review files</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 bg-amber-200 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-[10px] font-bold text-amber-700">3</span>
                                            </div>
                                            <p className="text-xs text-gray-700">Production</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Horizontal Action Buttons */}
                                <div className="flex gap-4 pt-2">
                                    <Link
                                        href="/"
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-secondary hover:from-secondary hover:to-primary text-white font-bold rounded-xl shadow-lg transition-all transform hover:scale-105 active:scale-95 text-sm"
                                    >
                                        <Home className="w-4 h-4" />
                                        Back to Home
                                    </Link>
                                    <button
                                        onClick={() => window.print()}
                                        className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-200 hover:border-primary text-gray-700 hover:text-primary font-bold rounded-xl shadow-sm transition-all transform hover:scale-105 active:scale-95 text-sm"
                                    >
                                        <Package className="w-4 h-4" />
                                        Print Order
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Premium Contact Support */}
                    <div className="mt-6 text-center">
                        <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/60 backdrop-blur-sm rounded-full border border-gray-200 shadow-sm">
                            <Truck className="h-4 w-4 text-primary" />
                            <p className="text-sm text-gray-600">
                                Need help? <Link href="/" className="text-primary font-bold hover:underline">Contact Support</Link>
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
