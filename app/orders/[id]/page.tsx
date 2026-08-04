"use client";

import React, { useState, useEffect, use, Suspense } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    RotateCw,
    Package,
    MapPin,
    CreditCard,
    Download,
    Cpu,
    CheckCircle2,
    Clock,
    History,
    AlertCircle,
    Loader2
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardSidebar from "@/components/DashboardSidebar";
import GerberBoardPreview from "@/components/GerberBoardPreview";
import { useCurrency } from "@/context/CurrencyContext";
import { calculateCurrentPcbPrice } from "@/lib/pcbPricing";

interface OrderLog {
    id?: number;
    pcb_order_id?: number;
    order_number?: string;
    status?: string;
    action?: string;
    description?: string;
    created_at?: string;
}

interface OrderDetail {
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
    payment_status?: string;
    payment_amount?: number;
    shipping_first_name?: string;
    shipping_last_name?: string;
    shipping_company?: string;
    shipping_building_no?: string;
    shipping_street?: string;
    shipping_city?: string;
    shipping_state?: string;
    shipping_postal?: string;
    shipping_country?: string;
    shipping_mobile?: string;
    billing_first_name?: string;
    billing_last_name?: string;
    billing_company?: string;
    billing_building_no?: string;
    billing_street?: string;
    billing_city?: string;
    billing_state?: string;
    billing_postal?: string;
    billing_country?: string;
    billing_mobile?: string;
    meta?: Record<string, string>;
    logs?: OrderLog[];
}

function OrderDetailsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Top Status Banner Skeleton */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gray-200 shrink-0" />
                    <div className="space-y-2">
                        <div className="w-16 h-3 bg-gray-200 rounded" />
                        <div className="w-24 h-6 bg-gray-200 rounded-full" />
                    </div>
                </div>
                <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end pt-3 sm:pt-0 border-t sm:border-t-0 border-gray-100">
                    <div className="space-y-1.5">
                        <div className="w-24 h-3 bg-gray-200 rounded" />
                        <div className="w-20 h-4 bg-gray-200 rounded" />
                    </div>
                    <div className="space-y-1.5 text-right">
                        <div className="w-16 h-3 bg-gray-200 rounded ml-auto" />
                        <div className="w-24 h-6 bg-gray-200 rounded" />
                    </div>
                </div>
            </div>

            {/* PCB Manufacturing Specifications Skeleton */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                    <div className="w-48 h-5 bg-gray-200 rounded" />
                    <div className="w-36 h-4 bg-gray-200 rounded" />
                </div>
                <div className="flex flex-col md:flex-row gap-6 items-start">
                    <div className="w-32 h-32 bg-gray-200 rounded-2xl shrink-0 mx-auto md:mx-0" />
                    <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50 p-4 rounded-xl w-full">
                        {Array.from({ length: 9 }).map((_, i) => (
                            <div key={i} className="space-y-1.5">
                                <div className="w-16 h-2.5 bg-gray-200 rounded" />
                                <div className="w-24 h-4 bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Addresses Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-3">
                    <div className="w-36 h-4 bg-gray-200 rounded border-b border-gray-100 pb-3" />
                    <div className="space-y-2 pt-2">
                        <div className="w-40 h-4 bg-gray-200 rounded" />
                        <div className="w-full h-3.5 bg-gray-200 rounded" />
                        <div className="w-3/4 h-3.5 bg-gray-200 rounded" />
                        <div className="w-28 h-3.5 bg-gray-200 rounded" />
                    </div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-3">
                    <div className="w-36 h-4 bg-gray-200 rounded border-b border-gray-100 pb-3" />
                    <div className="space-y-2 pt-2">
                        <div className="w-40 h-4 bg-gray-200 rounded" />
                        <div className="w-full h-3.5 bg-gray-200 rounded" />
                        <div className="w-3/4 h-3.5 bg-gray-200 rounded" />
                        <div className="w-28 h-3.5 bg-gray-200 rounded" />
                    </div>
                </div>
            </div>

            {/* Payment Audit Details Skeleton */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
                <div className="w-56 h-5 bg-gray-200 rounded border-b border-gray-100 pb-3" />
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="p-3 bg-gray-50 rounded-xl space-y-2">
                            <div className="w-20 h-2.5 bg-gray-200 rounded" />
                            <div className="w-28 h-4 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Order Activity Log Skeleton */}
            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
                <div className="w-64 h-5 bg-gray-200 rounded border-b border-gray-100 pb-3" />
                <div className="space-y-3 pt-1">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="p-3.5 bg-gray-50 rounded-xl space-y-2">
                            <div className="flex justify-between">
                                <div className="w-32 h-4 bg-gray-200 rounded" />
                                <div className="w-24 h-3 bg-gray-200 rounded" />
                            </div>
                            <div className="w-full h-3 bg-gray-200 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function OrderDetailsContent({ orderId }: { orderId: string }) {
    const router = useRouter();
    const { formatPrice } = useCurrency();

    const [order, setOrder] = useState<OrderDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState("");

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const savedUser = localStorage.getItem("megabyte_user");
                const token = localStorage.getItem("megabyte_user_token");

                if (!token || !savedUser) {
                    router.push(`/login?redirect=/orders/${orderId}`);
                    return;
                }

                const userObj = JSON.parse(savedUser);
                const res = await fetch(`/api/dashboard/order-details?id=${orderId}&user_id=${userObj.id}`);
                const data = await res.json();

                if (data.status && data.order) {
                    setOrder(data.order);
                } else {
                    setErrorMsg(data.message || "Order details not found.");
                }
            } catch (e) {
                console.error("Order details fetch error:", e);
                setErrorMsg("Failed to load order details.");
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, router]);

    const handleRepeatOrder = (ord: OrderDetail) => {
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

            const savedCart = localStorage.getItem("megabyte_cart");
            let cartItems = savedCart ? JSON.parse(savedCart) : [];
            cartItems.push(repeatItem);
            localStorage.setItem("megabyte_cart", JSON.stringify(cartItems));

            localStorage.setItem("selectedCartItemIds", JSON.stringify([repeatItem.id]));
            window.dispatchEvent(new Event("megabyte_cart_updated"));

            router.push("/cart");
        } catch (e) {
            console.error("Repeat order error:", e);
        }
    };

    const isCompleted = (order?.status_name || "").toLowerCase() === "completed" || (order?.status_name || "").toLowerCase() === "ready to ship";

    return (
        <div className="min-h-screen bg-[#f4f6f9] flex flex-col font-sans">
            <Header />

            <main className="flex-1 max-w-[1550px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Header Navigation Banner */}
                <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/orders"
                            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition-all cursor-pointer"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
                                <span>Order</span>
                                <span className="text-primary">{order?.order_number || `#${orderId}`}</span>
                            </h1>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                Placed on {order ? new Date(order.created_at).toLocaleString() : "..."}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isCompleted && order && (
                            <button
                                type="button"
                                onClick={() => handleRepeatOrder(order)}
                                className="px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                            >
                                <RotateCw className="w-4 h-4" />
                                <span>Repeat Order</span>
                            </button>
                        )}

                        <Link
                            href="/orders"
                            className="px-4 py-2.5 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                        >
                            <span>Back to Orders</span>
                        </Link>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    <DashboardSidebar />

                    {/* Right Content Area */}
                    <div className="flex-1 space-y-6">
                        {loading ? (
                            <OrderDetailsSkeleton />
                        ) : errorMsg || !order ? (
                            <div className="bg-white p-12 rounded-2xl border border-gray-200/80 text-center space-y-3">
                                <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
                                <h3 className="text-base font-extrabold text-gray-900">{errorMsg || "Order Not Found"}</h3>
                                <Link href="/orders" className="text-xs font-bold text-primary hover:underline">
                                    Return to My Orders
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Order Summary Top Card */}
                                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                            <Package className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-400 font-bold uppercase block">Status</span>
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-extrabold border mt-0.5 ${
                                                isCompleted
                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                                    : "bg-amber-50 text-amber-700 border-amber-200"
                                            }`}>
                                                {order.status_name || "Pending"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-gray-100">
                                        <div>
                                            <span className="text-xs text-gray-400 font-bold uppercase block">Estimated Delivery</span>
                                            <span className="text-xs font-extrabold text-gray-800">{order.delivery_date || "3-5 Business Days"}</span>
                                        </div>

                                        <div className="text-right">
                                            <span className="text-xs text-gray-400 font-bold uppercase block">Total Price</span>
                                            <span className="text-xl font-black text-primary">{formatPrice(order.order_value)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* PCB Specifications Card */}
                                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
                                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                        <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                                            <Cpu className="w-4 h-4 text-primary" />
                                            <span>PCB Manufacturing Specifications</span>
                                        </h3>
                                        {order.gerber_url && (
                                            <a
                                                href={order.gerber_url}
                                                download={order.gerber_name || "gerber_archive.zip"}
                                                className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                                <span>Download Gerber Archive</span>
                                            </a>
                                        )}
                                    </div>

                                    <div className="flex flex-col md:flex-row gap-6 items-start">
                                        {/* Gerber Preview Box */}
                                        <div className="w-32 h-32 bg-[#0b3818] rounded-2xl border border-gray-200 p-1.5 overflow-hidden shrink-0 shadow-sm mx-auto md:mx-0">
                                            <GerberBoardPreview
                                                previewData={order.gerber_preview_data}
                                                boardName={order.meta?.board_name || order.gerber_name}
                                                originalName={order.gerber_name}
                                                pcbColor={order.meta?.pcb_color}
                                                layers={order.meta?.layers}
                                                dimensions={order.meta?.dimensions}
                                            />
                                        </div>

                                        {/* Spec Grid */}
                                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-gray-50/70 p-4 rounded-xl text-xs">
                                            <div>
                                                <span className="text-gray-400 font-bold block text-[10px] uppercase">Board Name</span>
                                                <strong className="text-gray-900">{order.meta?.board_name || order.gerber_name || "Standard PCB"}</strong>
                                            </div>

                                            <div>
                                                <span className="text-gray-400 font-bold block text-[10px] uppercase">Product Type</span>
                                                <strong className="text-gray-900 uppercase">{order.meta?.product_type || "PCB"}</strong>
                                            </div>

                                            <div>
                                                <span className="text-gray-400 font-bold block text-[10px] uppercase">Layers</span>
                                                <strong className="text-gray-900">{order.meta?.layers || "2"} Layer</strong>
                                            </div>

                                            <div>
                                                <span className="text-gray-400 font-bold block text-[10px] uppercase">PCB Color</span>
                                                <strong className="text-gray-900">{order.meta?.pcb_color || "Green"}</strong>
                                            </div>

                                            <div>
                                                <span className="text-gray-400 font-bold block text-[10px] uppercase">Thickness</span>
                                                <strong className="text-gray-900">{order.meta?.thickness || "1.6mm"}</strong>
                                            </div>

                                            <div>
                                                <span className="text-gray-400 font-bold block text-[10px] uppercase">Surface Finish</span>
                                                <strong className="text-gray-900">{order.meta?.surface_finish || "HASL"}</strong>
                                            </div>

                                            <div>
                                                <span className="text-gray-400 font-bold block text-[10px] uppercase">Quantity</span>
                                                <strong className="text-gray-900">{order.meta?.quantity || "1"} Pcs</strong>
                                            </div>

                                            <div>
                                                <span className="text-gray-400 font-bold block text-[10px] uppercase">Dimensions</span>
                                                <strong className="text-gray-900">{order.meta?.dimensions || "100x100mm"}</strong>
                                            </div>

                                            <div>
                                                <span className="text-gray-400 font-bold block text-[10px] uppercase">Lead Time</span>
                                                <strong className="text-gray-900">{order.meta?.build_time || "3-4 days"}</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Addresses Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Shipping Address */}
                                    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-3">
                                        <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                                            <MapPin className="w-4 h-4 text-primary" />
                                            <span>Shipping Address</span>
                                        </h3>

                                        <div className="space-y-1 text-xs text-gray-700 font-medium">
                                            <p className="font-extrabold text-sm text-gray-900">
                                                {order.shipping_first_name || ""} {order.shipping_last_name || ""}
                                                {order.shipping_company ? ` (${order.shipping_company})` : ""}
                                            </p>
                                            <p className="leading-relaxed">
                                                {order.shipping_building_no ? `${order.shipping_building_no}, ` : ""}
                                                {order.shipping_street || "Address details on file"}
                                            </p>
                                            <p>
                                                {order.shipping_city ? `${order.shipping_city}, ` : ""}
                                                {order.shipping_state ? `${order.shipping_state} ` : ""}
                                                {order.shipping_postal || ""}
                                            </p>
                                            {order.shipping_country && <p className="font-bold text-gray-800">{order.shipping_country}</p>}
                                            {order.shipping_mobile && <p className="font-extrabold text-primary pt-1">Mobile: {order.shipping_mobile}</p>}
                                        </div>
                                    </div>

                                    {/* Billing Address */}
                                    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-3">
                                        <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-3">
                                            <MapPin className="w-4 h-4 text-blue-600" />
                                            <span>Billing Address</span>
                                        </h3>

                                        <div className="space-y-1 text-xs text-gray-700 font-medium">
                                            <p className="font-extrabold text-sm text-gray-900">
                                                {order.billing_first_name || order.shipping_first_name || ""} {order.billing_last_name || order.shipping_last_name || ""}
                                                {order.billing_company ? ` (${order.billing_company})` : ""}
                                            </p>
                                            <p className="leading-relaxed">
                                                {order.billing_building_no ? `${order.billing_building_no}, ` : ""}
                                                {order.billing_street || order.shipping_street || "Address details on file"}
                                            </p>
                                            <p>
                                                {order.billing_city || order.shipping_city ? `${order.billing_city || order.shipping_city}, ` : ""}
                                                {order.billing_state || order.shipping_state ? `${order.billing_state || order.shipping_state} ` : ""}
                                                {order.billing_postal || order.shipping_postal || ""}
                                            </p>
                                            <p className="font-bold text-gray-800">{order.billing_country || order.shipping_country || "India"}</p>
                                            {(order.billing_mobile || order.shipping_mobile) && (
                                                <p className="font-extrabold text-blue-600 pt-1">Mobile: {order.billing_mobile || order.shipping_mobile}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Payment & Audit Details Card */}
                                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
                                    <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                                        <CreditCard className="w-4 h-4 text-primary" />
                                        <span>Payment Audit & Transaction Details</span>
                                    </h3>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-medium">
                                        <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                                            <span className="text-gray-400 font-bold block text-[10px] uppercase">Transaction Ref</span>
                                            <strong className="text-gray-900 font-mono">{order.transaction_number || "N/A"}</strong>
                                        </div>

                                        <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                                            <span className="text-gray-400 font-bold block text-[10px] uppercase">Razorpay Payment ID</span>
                                            <strong className="text-gray-900 font-mono">{order.razorpay_payment_id || "N/A"}</strong>
                                        </div>

                                        <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                                            <span className="text-gray-400 font-bold block text-[10px] uppercase">Payment Status</span>
                                            <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase">
                                                {order.payment_status || "SUCCESS"}
                                            </span>
                                        </div>

                                        <div className="p-3 bg-gray-50 rounded-xl space-y-1">
                                            <span className="text-gray-400 font-bold block text-[10px] uppercase">Amount Paid</span>
                                            <strong className="text-primary font-black">{formatPrice(order.payment_amount || order.order_value)}</strong>
                                        </div>
                                    </div>
                                </div>

                                {/* Order Activity Log & Tracking History */}
                                <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-4">
                                    <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                                        <History className="w-4 h-4 text-primary" />
                                        <span>Order Activity Log & Tracking History</span>
                                    </h3>

                                    {(!order.logs || order.logs.length === 0) ? (
                                        <div className="space-y-3 py-2 text-xs">
                                            <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-100">
                                                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xs">
                                                    <CheckCircle2 className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <strong className="text-gray-900 font-extrabold">Order Placed & Verified</strong>
                                                        <span className="text-[10px] text-gray-400 font-mono">{new Date(order.created_at).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-gray-600 mt-0.5">Order {order.order_number} successfully recorded and linked with payment reference {order.transaction_number || "TXN"}.</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="relative pl-4 border-l-2 border-primary/20 space-y-4 text-xs ml-2 py-1">
                                            {order.logs.map((log, idx) => (
                                                <div key={log.id || idx} className="relative group">
                                                    <div className="absolute -left-[23px] top-0.5 w-4 h-4 rounded-full bg-primary ring-4 ring-white flex items-center justify-center text-white">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-white block" />
                                                    </div>

                                                    <div className="bg-gray-50/80 p-3.5 rounded-xl border border-gray-100 space-y-1">
                                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-black text-gray-900 text-xs">{log.action || log.status}</span>
                                                                <span className="px-2 py-0.5 rounded bg-primary/10 text-primary font-bold text-[10px] uppercase">
                                                                    {log.status}
                                                                </span>
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 font-medium font-mono">
                                                                {new Date(log.created_at || Date.now()).toLocaleString()}
                                                            </span>
                                                        </div>
                                                        <p className="text-gray-600 text-xs font-medium leading-relaxed">
                                                            {log.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

export default function ViewOrderPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-[#f4f6f9] flex flex-col font-sans">
                <Header />
                <main className="flex-1 max-w-[1550px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    <div className="flex flex-col lg:flex-row gap-6">
                        <DashboardSidebar />
                        <div className="flex-1 space-y-6">
                            <OrderDetailsSkeleton />
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        }>
            <OrderDetailsContent orderId={resolvedParams.id} />
        </Suspense>
    );
}
