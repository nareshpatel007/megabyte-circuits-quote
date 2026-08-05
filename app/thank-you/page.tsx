"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Package, ArrowRight, Eye, Sparkles } from "lucide-react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardSidebar from "@/components/DashboardSidebar";
import { getAuthToken, getAuthUser } from "@/lib/auth";
import { useCurrency } from "@/context/CurrencyContext";

interface OrderData {
    order_id: number;
    order_number: string;
    status?: string;
    total_value?: string | number;
    delivery_date?: string;
    board_name?: string;
}

export default function ThankYouPage() {
    const { formatPrice } = useCurrency();
    const [orderData, setOrderData] = useState<OrderData | null>(null);
    const [ordersList, setOrdersList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        try {
            const token = getAuthToken();
            const user = getAuthUser();
            setIsLoggedIn(Boolean(token && user));
        } catch (e) {
            setIsLoggedIn(false);
        }

        const latestOrders = sessionStorage.getItem("latest_orders");
        if (latestOrders) {
            try {
                const parsed = JSON.parse(latestOrders);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    setOrdersList(parsed);
                }
            } catch (e) {}
        }

        const savedOrder = localStorage.getItem("lastOrder");
        if (savedOrder) {
            try {
                setOrderData(JSON.parse(savedOrder));
            } catch (error) {
                console.error("Failed to parse order data:", error);
            }
        }
        setLoading(false);
    }, []);

    const primaryOrderId = orderData?.order_id || (ordersList.length > 0 ? ordersList[0].id || ordersList[0].order_id : null);
    const primaryOrderNum = orderData?.order_number || (ordersList.length > 0 ? ordersList[0].order_number : null);

    const mainContent = (
        <div className="space-y-6 flex-1 min-w-0">
            {/* Success Card Header */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-2xs text-center relative overflow-hidden">
                <div className="w-16 h-16 bg-emerald-100/80 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>

                <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-700 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Order Placed Successfully
                </span>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
                    Thank You For Your Order!
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 max-w-lg mx-auto font-medium leading-relaxed">
                    Thank you for your business! We will keep you updated on your order&apos;s progress and notify you as soon as manufacturing is complete.
                </p>

                {primaryOrderNum && (
                    <div className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700">
                        <span>Order Number:</span>
                        <span className="font-mono text-primary font-extrabold text-sm">{primaryOrderNum}</span>
                    </div>
                )}

                {/* Navigation Action Buttons Inside Thank You Card */}
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3 pt-4 border-t border-gray-100">
                    <Link
                        href="/orders"
                        className="px-6 py-2.5 rounded-full bg-primary hover:bg-secondary text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <Package className="w-4 h-4" />
                        <span>Go to My Orders</span>
                    </Link>

                    {primaryOrderId && (
                        <Link
                            href={`/orders/${primaryOrderId}`}
                            className="px-6 py-2.5 rounded-full border border-gray-300 hover:border-gray-400 bg-white text-gray-800 font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            <Eye className="w-4 h-4 text-primary" />
                            <span>View Order Details</span>
                        </Link>
                    )}
                </div>
            </div>

            {/* List of Orders if split or single detail */}
            {ordersList.length > 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
                    <h2 className="text-sm font-extrabold text-gray-900 border-b border-gray-100 pb-3">
                        Order Details ({ordersList.length} Item{ordersList.length > 1 ? "s" : ""})
                    </h2>
                    <div className="space-y-3">
                        {ordersList.map((ord: any, idx: number) => {
                            const ordId = ord.id || ord.order_id;
                            return (
                                <div key={idx} className="p-4 rounded-xl border border-gray-200/70 bg-gray-50/60 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-bold text-gray-400 block uppercase">Order #{ord.order_number}</span>
                                        <p className="text-xs font-extrabold text-gray-900 truncate">{ord.board_name || "Standard PCB"}</p>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <span className="text-xs font-extrabold text-primary">
                                            {formatPrice(ord.price || ord.order_value || 0)}
                                        </span>
                                        {ordId && (
                                            <Link
                                                href={`/orders/${ordId}`}
                                                className="px-3 py-1.5 rounded-lg bg-primary hover:bg-secondary text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                                            >
                                                <Eye className="w-3.5 h-3.5" />
                                                <span>View</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : orderData ? (
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
                    <h2 className="text-sm font-extrabold text-gray-900 border-b border-gray-100 pb-3">
                        Order Information
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70">
                            <span className="text-[10px] text-gray-400 font-bold uppercase block">Project Name</span>
                            <span className="text-xs font-extrabold text-gray-900">{orderData.board_name || "PCB Manufacturing"}</span>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70">
                            <span className="text-[10px] text-gray-400 font-bold uppercase block">Total Value</span>
                            <span className="text-xs font-extrabold text-primary">{formatPrice(orderData.total_value || 0)}</span>
                        </div>
                        <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70">
                            <span className="text-[10px] text-gray-400 font-bold uppercase block">Estimated Delivery</span>
                            <span className="text-xs font-extrabold text-gray-900">{orderData.delivery_date || "3-5 Business Days"}</span>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );

    return (
        <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col">
            <Header />

            <main className="flex-1 max-w-[1550px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Header Banner */}
                {isLoggedIn && (
                    <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                                Order Confirmation
                            </h1>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                Thank you for choosing Megabyte Circuits for your PCB fabrication.
                            </p>
                        </div>
                    </div>
                )}

                {isLoggedIn ? (
                    <div className="flex flex-col lg:flex-row gap-6">
                        <DashboardSidebar />
                        {mainContent}
                    </div>
                ) : (
                    <div className="max-w-3xl mx-auto">
                        {mainContent}
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
