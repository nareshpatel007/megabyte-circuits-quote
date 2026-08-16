"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, FolderArchive, CreditCard, Plus, Clock, ChevronRight, RotateCw, Loader2 } from "lucide-react";
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

function MetricCardsSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs space-y-3 animate-pulse">
                    <div className="flex items-center justify-between">
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                        <div className="w-9 h-9 rounded-xl bg-gray-200"></div>
                    </div>
                    <div className="h-7 bg-gray-200 rounded w-16"></div>
                </div>
            ))}
        </div>
    );
}

function RecentOrdersSkeleton() {
    return (
        <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl w-full"></div>
            ))}
        </div>
    );
}

function DashboardContent() {
    const router = useRouter();
    const { symbol, formatPrice } = useCurrency();

    const [user, setUser] = useState<{ id?: string | number; name?: string; email?: string } | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);

    const [metrics, setMetrics] = useState<{ total_orders: number; pending_orders: number; gerber_files_count: number; total_spent: number }>(() => {
        if (typeof window !== "undefined") {
            try {
                const cached = localStorage.getItem("megabyte_dashboard_metrics");
                if (cached) return JSON.parse(cached);
            } catch (e) { }
        }
        return { total_orders: 0, pending_orders: 0, gerber_files_count: 0, total_spent: 0 };
    });
    const [recentOrders, setRecentOrders] = useState<OrderItem[]>([]);
    const [recentPayments, setRecentPayments] = useState<any[]>([]);
    const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

    const handleRepeatOrder = (ord: OrderItem) => {
        try {
            const boardName = ord.gerber_name || ord.meta?.board_name || "Standard PCB";
            const layers = parseInt(ord.meta?.layers || "2", 10);
            const qty = parseInt(ord.meta?.quantity || "1", 10);
            const dimensions = ord.meta?.dimensions || "100x100mm";
            const pcbColor = ord.meta?.pcb_color || "Green";
            const thickness = ord.meta?.thickness || "1.6mm";

            const currentPrice = calculateCurrentPcbPrice(layers, dimensions, qty, thickness, pcbColor, ord.order_value);

            const repeatItem = {
                id: Date.now(),
                productType: ord.meta?.product_type || "pcb",
                boardName: boardName,
                gerberFileName: ord.gerber_name || ord.meta?.gerber_file_name || boardName,
                gerber_file_id: ord.gerber_file_id || null,
                gerberPreview: ord.gerber_preview_data || null,
                layers: layers,
                dimensions: dimensions,
                pcbColor: pcbColor,
                thickness: thickness,
                surfaceFinish: ord.meta?.surface_finish || "HASL(Leaded)",
                qty: qty,
                buildTime: ord.meta?.build_time || "3-4 days",
                price: currentPrice,
                unitPrice: qty > 0 ? Math.round(currentPrice / qty) : currentPrice
            };

            // Add to main cart
            const savedCart = localStorage.getItem("megabyte_cart");
            let cartItems = savedCart ? JSON.parse(savedCart) : [];
            cartItems.push(repeatItem);
            localStorage.setItem("megabyte_cart", JSON.stringify(cartItems));

            // Select only this item
            localStorage.setItem("selectedCartItemIds", JSON.stringify([repeatItem.id]));
            window.dispatchEvent(new Event("megabyte_cart_updated"));

            // Redirect directly to Cart page
            router.push("/cart");
        } catch (e) {
            console.error("Repeat order error:", e);
        }
    };

    useEffect(() => {
        const fetchOverview = async () => {
            try {
                const savedUser = localStorage.getItem("megabyte_user");
                const token = localStorage.getItem("megabyte_user_token");

                if (!token || !savedUser) {
                    router.push("/login?redirect=/dashboard");
                    return;
                }

                const userObj = JSON.parse(savedUser);
                setUser(userObj);

                if (userObj.id) {
                    const res = await fetch(`/api/dashboard/overview?user_id=${userObj.id}`);
                    const data = await res.json();
                    if (data.status) {
                        setMetrics(data.metrics || {});
                        setRecentOrders(data.recent_orders || []);
                        setRecentPayments(data.recent_payments || []);
                        try {
                            localStorage.setItem("megabyte_dashboard_metrics", JSON.stringify(data.metrics || {}));
                        } catch (e) { }
                    }
                }
            } catch (e) {
                console.error("Dashboard fetch error:", e);
            } finally {
                setIsLoaded(true);
            }
        };

        fetchOverview();
    }, [router]);

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
                    {/* User Greeting Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0b0f19] p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-2xs">
                        {!isLoaded ? (
                            <div className="space-y-2 animate-pulse w-full max-w-sm">
                                <div className="h-6 bg-gray-200 dark:bg-zinc-800 rounded w-48"></div>
                                <div className="h-3 bg-gray-200 dark:bg-zinc-800 rounded w-64"></div>
                            </div>
                        ) : (
                            <div>
                                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                                    Welcome back, <span className="text-primary dark:text-emerald-400">{user?.name || "Customer"}</span>!
                                </h1>
                                <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mt-0.5">
                                    Overview of your PCB orders, Gerber files, and payment metrics.
                                </p>
                            </div>
                        )}

                        <Link
                            href="/quote"
                            className="px-5 py-2.5 rounded-full bg-primary hover:bg-secondary text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Place new order</span>
                        </Link>
                    </div>

                    {!isLoaded ? (
                        <MetricCardsSkeleton />
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white dark:bg-[#0b0f19] p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-2xs">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">Total Orders</span>
                                    <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                                        <Package className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{metrics.total_orders}</p>
                            </div>

                            <div className="bg-white dark:bg-[#0b0f19] p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-2xs">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">Pending Orders</span>
                                    <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                                        <Clock className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{metrics.pending_orders}</p>
                            </div>

                            <div className="bg-white dark:bg-[#0b0f19] p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-2xs">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">Gerber Files</span>
                                    <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                        <FolderArchive className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">{metrics.gerber_files_count}</p>
                            </div>

                            <div className="bg-white dark:bg-[#0b0f19] p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-2xs">
                                <div className="flex items-center justify-between mb-3">
                                    <span className="text-xs font-bold text-gray-500 dark:text-zinc-400">Total Spent</span>
                                    <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                                        <CreditCard className="w-5 h-5" />
                                    </div>
                                </div>
                                <p className="text-2xl font-black text-primary dark:text-emerald-400">{formatPrice(metrics.total_spent)}</p>
                            </div>
                        </div>
                    )}

                    {/* Recent Orders Preview */}
                    <div className="bg-white dark:bg-[#0b0f19] rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
                            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Recent Orders</h3>
                            <Link
                                href="/orders"
                                className="text-xs font-bold text-primary dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                <span>View All</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {!isLoaded ? (
                            <RecentOrdersSkeleton />
                        ) : recentOrders.length === 0 ? (
                            <div className="py-12 text-center text-xs text-gray-400 dark:text-zinc-500 font-medium">
                                No orders placed yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-zinc-800 text-gray-400 dark:text-zinc-500 font-extrabold uppercase">
                                            <th className="pb-3">Order #</th>
                                            <th className="pb-3">Gerber / Product</th>
                                            <th className="pb-3">Date</th>
                                            <th className="pb-3">Total</th>
                                            <th className="pb-3">Status</th>
                                            <th className="pb-3 text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                        {recentOrders.map((ord) => (
                                            <tr key={ord.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50">
                                                <td className="py-3 font-extrabold text-gray-900 dark:text-white">{ord.order_number}</td>
                                                <td className="py-3 font-semibold text-gray-700 dark:text-zinc-300 max-w-[200px] truncate">
                                                    {ord.gerber_name || "PCB Order"}
                                                </td>
                                                <td className="py-3 text-gray-500 dark:text-zinc-400">{new Date(ord.created_at).toLocaleDateString()}</td>
                                                <td className="py-3 font-extrabold text-gray-900 dark:text-white">{formatPrice(ord.order_value)}</td>
                                                <td className="py-3">{getStatusBadge(ord.status_name)}</td>
                                                <td className="py-3 text-right space-x-2">
                                                    {(ord.status_name?.toLowerCase() === "completed" || ord.status_name?.toLowerCase() === "ready to ship") && (
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRepeatOrder(ord)}
                                                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer shadow-xs"
                                                        >
                                                            <RotateCw className="w-3 h-3" />
                                                            <span>Repeat</span>
                                                        </button>
                                                    )}
                                                    <Link
                                                        href={`/orders/${ord.id}`}
                                                        className="px-3 py-1 rounded-lg bg-gray-100 hover:bg-primary hover:text-white font-bold text-[11px] transition-all cursor-pointer inline-block"
                                                    >
                                                        Details
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    {/* Recent Payments Section */}
                    <div className="bg-white dark:bg-[#0b0f19] rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 shadow-2xs space-y-4">
                        <div className="flex items-center justify-between border-b border-gray-100 dark:border-zinc-800 pb-3">
                            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Recent Payments</h3>
                            <Link
                                href="/payments"
                                className="text-xs font-bold text-primary dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                                <span>View All</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                        </div>

                        {!isLoaded ? (
                            <RecentOrdersSkeleton />
                        ) : recentPayments.length === 0 ? (
                            <div className="py-12 text-center text-xs text-gray-400 dark:text-zinc-500 font-medium">
                                No payment transactions recorded yet.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-100 dark:border-zinc-800 text-gray-400 dark:text-zinc-500 font-extrabold uppercase">
                                            <th className="pb-3">Transaction ID</th>
                                            <th className="pb-3">Order #</th>
                                            <th className="pb-3">Date</th>
                                            <th className="pb-3">Amount</th>
                                            <th className="pb-3">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                                        {recentPayments.map((p) => {
                                            const status = (p.status || "").toLowerCase();
                                            const isSuccess = status === "success" || status === "paid";
                                            return (
                                                <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/50">
                                                    <td className="py-3 font-extrabold text-gray-900 dark:text-white font-mono">
                                                        {p.transaction_number || p.razorpay_payment_id || `TXN-${p.id}`}
                                                    </td>
                                                    <td className="py-3 font-semibold text-gray-700 dark:text-zinc-300">
                                                        {p.order_number ? `#${p.order_number}` : "-"}
                                                    </td>
                                                    <td className="py-3 text-gray-500 dark:text-zinc-400">
                                                        {new Date(p.created_at).toLocaleDateString()}
                                                    </td>
                                                    <td className="py-3 font-extrabold text-gray-900 dark:text-white">
                                                        {formatPrice(p.amount)}
                                                    </td>
                                                    <td className="py-3">
                                                        {isSuccess ? (
                                                            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-extrabold border border-emerald-200">
                                                                SUCCESS
                                                            </span>
                                                        ) : (
                                                            <span className="px-2.5 py-1 rounded-full bg-red-50 text-red-700 text-[11px] font-extrabold border border-red-200">
                                                                {(p.status || "FAILED").toUpperCase()}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
