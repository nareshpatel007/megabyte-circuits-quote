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
                {/* Header Banner */}
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                            My Orders
                        </h1>
                        <p className="text-xs text-gray-500 font-medium mt-0.5">
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

                <div className="flex flex-col lg:flex-row gap-6">
                    <DashboardSidebar />

                    {/* Right Main Content Area */}
                    <div className="flex-1 space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                                <div>
                                    <h2 className="text-lg font-extrabold text-gray-900">My Orders</h2>
                                    <p className="text-xs text-gray-500 font-medium">Detailed log of your manufacturing items.</p>
                                </div>
                                <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                                    {orders.length} Orders Total
                                </span>
                            </div>

                            {loading ? (
                                <OrdersListSkeleton />
                            ) : orders.length === 0 ? (
                                <div className="py-16 text-center text-xs text-gray-400 font-medium">
                                    You have no order history yet.
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {orders.map((ord) => (
                                        <div key={ord.id} className="p-4 rounded-xl border border-gray-200/80 hover:border-primary/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm font-black text-gray-900">{ord.order_number}</span>
                                                    {getStatusBadge(ord.status_name)}
                                                </div>
                                                <p className="text-xs font-bold text-gray-700">
                                                    {ord.gerber_name || ord.meta?.board_name || "Standard PCB Order"}
                                                </p>
                                                <p className="text-[11px] text-gray-400 font-medium">
                                                    Ordered on: {new Date(ord.created_at).toLocaleString()} | Delivery target: {ord.delivery_date}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                                                <div className="text-right">
                                                    <span className="text-xs text-gray-400 font-medium block">Total Value</span>
                                                    <span className="text-base font-extrabold text-primary">{formatPrice(ord.order_value)}</span>
                                                </div>

                                                {(ord.status_name?.toLowerCase() === "completed" || ord.status_name?.toLowerCase() === "ready to ship") && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRepeatOrder(ord)}
                                                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                                                    >
                                                        <RotateCw className="w-3.5 h-3.5" />
                                                        <span>Repeat Order</span>
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
                    </div>
                </div>
            </main>

            <Footer />
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
