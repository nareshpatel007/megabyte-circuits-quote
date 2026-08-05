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
                unitPrice: qty > 0 ? Math.round(currentPrice / qty) : currentPrice,
                parent_order_number: ord.order_number
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
        <div className="min-h-screen bg-[#f4f6f9] flex flex-col font-sans">
            <Header />

            <main className="flex-1 max-w-[1550px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* User Greeting Header */}
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                    {!isLoaded ? (
                        <div className="space-y-2 animate-pulse w-full max-w-sm">
                            <div className="h-6 bg-gray-200 rounded w-48"></div>
                            <div className="h-3 bg-gray-200 rounded w-64"></div>
                        </div>
                    ) : (
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                                Welcome back, <span className="text-primary">{user?.name || "Customer"}</span>!
                            </h1>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
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

                <div className="flex flex-col lg:flex-row gap-6">
                    <DashboardSidebar />

                    {/* Right Main Content Area */}
                    <div className="flex-1 space-y-6">
                        {!isLoaded ? (
                            <MetricCardsSkeleton />
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-gray-500">Total Orders</span>
                                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <Package className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">{metrics.total_orders}</p>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-gray-500">Pending Orders</span>
                                        <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                            <Clock className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">{metrics.pending_orders}</p>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-gray-500">Gerber Files</span>
                                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                            <FolderArchive className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-gray-900">{metrics.gerber_files_count}</p>
                                </div>

                                <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-xs font-bold text-gray-500">Total Spent</span>
                                        <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                                            <CreditCard className="w-5 h-5" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-black text-primary">{formatPrice(metrics.total_spent)}</p>
                                </div>
                            </div>
                        )}

                        {/* Recent Orders Preview */}
                        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <h3 className="text-base font-extrabold text-gray-900">Recent Orders</h3>
                                <Link
                                    href="/orders"
                                    className="text-xs font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer"
                                >
                                    <span>View All</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            </div>

                            {!isLoaded ? (
                                <RecentOrdersSkeleton />
                            ) : recentOrders.length === 0 ? (
                                <div className="py-12 text-center text-xs text-gray-400 font-medium">
                                    No orders placed yet.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-gray-400 font-extrabold uppercase">
                                                <th className="pb-3">Order #</th>
                                                <th className="pb-3">Gerber / Product</th>
                                                <th className="pb-3">Date</th>
                                                <th className="pb-3">Total</th>
                                                <th className="pb-3">Status</th>
                                                <th className="pb-3 text-right">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {recentOrders.map((ord) => (
                                                <tr key={ord.id} className="hover:bg-gray-50/50">
                                                    <td className="py-3 font-extrabold text-gray-900">{ord.order_number}</td>
                                                    <td className="py-3 font-semibold text-gray-700 max-w-[200px] truncate">
                                                        {ord.gerber_name || "PCB Order"}
                                                    </td>
                                                    <td className="py-3 text-gray-500">{new Date(ord.created_at).toLocaleDateString()}</td>
                                                    <td className="py-3 font-extrabold text-gray-900">{formatPrice(ord.order_value)}</td>
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
                    </div>
                </div>
            </main>

            <Footer />
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
