"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, RotateCw, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardSidebar from "@/components/DashboardSidebar";
import GerberBoardPreview from "@/components/GerberBoardPreview";
import { useCurrency } from "@/context/CurrencyContext";
import { calculateCurrentPcbPrice } from "@/lib/pcbPricing";

interface OrderItem {
    id: number;
    order_number: string;
    status_id: number;
    status?: string;
    status_name?: string;
    status_label?: string;
    gerber_file_id?: number;
    gerber_name?: string;
    gerber_url?: string;
    gerber_preview_data?: string;
    unit_price: number;
    order_value: number;
    delivery_date: string;
    created_at: string;
    transaction_number?: string;
    razorpay_payment_id?: string;
    shipping_first_name?: string;
    shipping_last_name?: string;
    shipping_street?: string;
    shipping_city?: string;
    shipping_state?: string;
    shipping_postal?: string;
    shipping_mobile?: string;
    billing_first_name?: string;
    billing_last_name?: string;
    billing_street?: string;
    billing_city?: string;
    billing_state?: string;
    meta?: Record<string, string>;
}

function OrdersListSkeleton() {
    return (
        <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-4 rounded-xl border border-gray-200/80 bg-white space-y-2 animate-pulse">
                    <div className="flex items-center justify-between">
                        <div className="h-4 bg-gray-200 rounded w-28"></div>
                        <div className="h-5 bg-gray-200 rounded-full w-20"></div>
                    </div>
                    <div className="h-3 bg-gray-200 rounded w-48"></div>
                    <div className="h-3 bg-gray-200 rounded w-36"></div>
                </div>
            ))}
        </div>
    );
}

function OrdersContent() {
    const router = useRouter();
    const { symbol, formatPrice } = useCurrency();

    const [orders, setOrders] = useState<OrderItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
    const [reorderConfirmOrder, setReorderConfirmOrder] = useState<OrderItem | null>(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const savedUser = localStorage.getItem("megabyte_user");
                const token = localStorage.getItem("megabyte_user_token");

                if (!token || !savedUser) {
                    router.push("/login?redirect=/orders");
                    return;
                }

                const userObj = JSON.parse(savedUser);
                if (userObj?.id) {
                    const res = await fetch(`/api/dashboard/orders?user_id=${userObj.id}`);
                    const data = await res.json();
                    if (data.status) {
                        setOrders(data.orders || []);
                    }
                }
            } catch (e) {
                console.error("Orders page fetch error:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [router]);

    const handleReorderClick = (ord: OrderItem) => {
        setReorderConfirmOrder(ord);
    };

    const executeReorder = (ord: OrderItem) => {
        try {
            const boardName = ord.gerber_name || ord.meta?.board_name || "Standard PCB Order";
            const layers = ord.meta?.layers || "2";
            const dimensions = ord.meta?.dimensions || "100x100mm";

            let width = ord.meta?.width || "100";
            let height = ord.meta?.height || "100";
            if (dimensions && (!ord.meta?.width || !ord.meta?.height)) {
                const clean = dimensions.replace(/mm|inch|in/gi, "").trim();
                const parts = clean.split(/x|\*/i);
                if (parts.length >= 2) {
                    width = parts[0].trim();
                    height = parts[1].trim();
                }
            }

            const qty = ord.meta?.quantity || ord.meta?.qty || "5";
            const thickness = ord.meta?.thickness || "1.6mm";
            const pcbColor = ord.meta?.pcb_color || "Green";
            const surfaceFinish = ord.meta?.surface_finish || "HASL(Leaded)";
            const copperWeight = ord.meta?.copper_weight || "1 oz";
            const baseMaterial = ord.meta?.base_material || "FR-4";
            const gerberFileName = ord.gerber_name || ord.meta?.gerber_file_name || boardName;
            const gerberFileId = ord.gerber_file_id || null;
            const gerberUrl = ord.gerber_url || ord.meta?.gerber_file_url || null;
            const previewData = ord.gerber_preview_data || ord.meta?.preview_data || null;

            const reorderSpec = {
                layers,
                width,
                height,
                qty,
                thickness,
                pcbColor,
                surfaceFinish,
                copperWeight,
                baseMaterial,
                boardName,
                gerber_file_id: gerberFileId,
                gerber_name: gerberFileName,
                gerber_url: gerberUrl,
                gerber_preview_data: previewData,
                parent_order_number: ord.order_number
            };

            // Store specification for Instant Quote page loading
            sessionStorage.setItem("megabyte_reorder_spec", JSON.stringify(reorderSpec));
            localStorage.setItem("megabyte_reorder_spec", JSON.stringify(reorderSpec));

            setReorderConfirmOrder(null);

            const queryParams = new URLSearchParams({
                reorder: ord.order_number,
                layers,
                width,
                height,
                qty,
                thickness,
                pcbColor: encodeURIComponent(pcbColor),
                surfaceFinish: encodeURIComponent(surfaceFinish),
                copperWeight: encodeURIComponent(copperWeight),
                baseMaterial: encodeURIComponent(baseMaterial)
            });

            router.push(`/quote?${queryParams.toString()}`);
        } catch (e) {
            console.error("Reorder error:", e);
        }
    };

    const getStatusBadge = (statusName?: string) => {
        const name = statusName || "Pending";
        switch (name.toLowerCase()) {
            case "completed":
            case "ready to ship":
                return <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold border border-emerald-200">Completed</span>;
            case "pending":
                return <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[11px] font-extrabold border border-amber-200">Pending</span>;
            case "cancelled":
                return <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-[11px] font-extrabold border border-red-200">Cancelled</span>;
            default:
                return <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-extrabold border border-blue-200">{name}</span>;
        }
    };

    return (
        <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#030712] text-gray-900 dark:text-gray-100 flex flex-col lg:flex-row font-sans transition-colors">
            <DashboardSidebar />

            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                <Header />

                <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                    {/* Header Banner */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0b0f19] p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-2xs">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                                My Orders
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mt-0.5">
                                Track and inspect all your PCB manufacturing orders.
                            </p>
                        </div>

                        <Link
                            href="/quote"
                            className="px-5 py-2.5 rounded-full bg-primary hover:bg-secondary text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Place new order</span>
                        </Link>
                    </div>

                    <div className="bg-white dark:bg-[#0b0f19] rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 shadow-2xs space-y-5">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-4">
                            <div>
                                <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">My Orders</h2>
                                <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">Detailed log of your manufacturing items.</p>
                            </div>
                            <span className="text-xs font-bold text-primary dark:text-emerald-400 bg-primary/10 dark:bg-emerald-950/60 px-3 py-1 rounded-full">
                                {orders.length} Orders Total
                            </span>
                        </div>

                        {loading ? (
                            <OrdersListSkeleton />
                        ) : orders.length === 0 ? (
                            <div className="py-16 text-center text-xs text-gray-400 dark:text-zinc-500 font-medium">
                                You have no order history yet.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {orders.map((ord) => (
                                    <div key={ord.id} className="p-4 rounded-xl border border-gray-200/80 dark:border-white/10 hover:border-primary/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0b0f19]">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-black text-gray-900 dark:text-white">{ord.order_number}</span>
                                                {getStatusBadge(ord.status || ord.status_name)}
                                            </div>
                                            <p className="text-xs font-bold text-gray-700 dark:text-zinc-300">
                                                {ord.gerber_name || ord.meta?.board_name || "Standard PCB Order"}
                                            </p>
                                            <p className="text-[11px] text-gray-400 dark:text-zinc-500 font-medium">
                                                Ordered on: {new Date(ord.created_at).toLocaleString()}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                            {(((ord.status || ord.status_name)?.toLowerCase() === "completed") || ((ord.status || ord.status_name)?.toLowerCase() === "ready to ship")) && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleReorderClick(ord)}
                                                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                                >
                                                    <RotateCw className="w-3.5 h-3.5" />
                                                    <span>Reorder</span>
                                                </button>
                                            )}

                                            <Link
                                                href={`/orders/${ord.id}`}
                                                className="px-4 py-2 rounded-xl bg-primary text-white font-bold text-xs hover:bg-secondary transition-all cursor-pointer"
                                            >
                                                View Details
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </main>

                {/* Reorder Confirmation Modal */}
                {reorderConfirmOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
                        <div className="bg-white dark:bg-[#0b0f19] border border-gray-200 dark:border-white/10 rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200">
                            <div className="flex items-center gap-3 border-b border-gray-100 dark:border-zinc-800 pb-3">
                                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                    <RotateCw className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Confirm Reorder</h3>
                                    <p className="text-xs text-gray-500 dark:text-zinc-400 font-semibold">
                                        Order #{reorderConfirmOrder.order_number}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-gray-50 dark:bg-zinc-900/60 rounded-xl p-3.5 space-y-2 text-xs">
                                <div className="flex justify-between">
                                    <span className="text-gray-500 font-medium">Board Name:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {reorderConfirmOrder.gerber_name || reorderConfirmOrder.meta?.board_name || "PCB Order"}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 font-medium">Specifications:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {reorderConfirmOrder.meta?.layers || "2"} Layers | {reorderConfirmOrder.meta?.dimensions || "100x100mm"} | {reorderConfirmOrder.meta?.quantity || "5"} Pcs
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500 font-medium">Color & Finish:</span>
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {reorderConfirmOrder.meta?.pcb_color || "Green"} / {reorderConfirmOrder.meta?.surface_finish || "HASL"}
                                    </span>
                                </div>
                            </div>

                            <p className="text-xs text-gray-600 dark:text-zinc-400 leading-relaxed font-medium">
                                Reordering will load these exact specifications and Gerber file into the Instant Quote calculator with current pricing.
                            </p>

                            <div className="flex items-center justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setReorderConfirmOrder(null)}
                                    className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-gray-700 dark:text-zinc-300 font-bold text-xs transition-all cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={() => executeReorder(reorderConfirmOrder)}
                                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                                >
                                    <RotateCw className="w-3.5 h-3.5" />
                                    <span>Confirm & Open Quote</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <Footer />
            </div>
        </div>
    );
}

export default function OrdersPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <OrdersContent />
        </Suspense>
    );
}
