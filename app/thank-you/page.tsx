"use client";

import { useEffect, useState } from "react";
import { CheckCircle, Package, Calendar, IndianRupee, ArrowLeft, Home } from "lucide-react";
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

    useEffect(() => {
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
            <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading order details...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    if (!orderData) {
        return (
            <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col">
                <Header />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="bg-white rounded-2xl shadow-lg p-12 text-center max-w-md">
                        <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Package className="h-8 w-8 text-red-500" />
                        </div>
                        <h1 className="text-2xl font-bold text-gray-900 mb-4">Order Not Found</h1>
                        <p className="text-gray-600 mb-8">
                            We couldn't find your order details. Please check your email for confirmation or contact support.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <Link
                                href="/"
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-xl shadow-md transition-all"
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
        <div className="min-h-screen bg-[#f0f2f5] font-sans flex flex-col">
            <Header />

            <main className="flex-1 flex items-center justify-center px-4 py-12">
                <div className="max-w-2xl w-full">
                    <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                        {/* Success Header */}
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 text-center border-b border-green-100">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-10 w-10 text-green-600" />
                            </div>
                            <h1 className="text-3xl font-black text-gray-900 mb-2">Order Submitted Successfully!</h1>
                            <p className="text-gray-600">Thank you for choosing Megabyte Circuit</p>
                        </div>

                        {/* Order Details */}
                        <div className="p-8 space-y-6">
                            {/* Order Number */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm text-gray-600 font-medium">Order Number</span>
                                    <span className="text-lg font-bold text-gray-900">{orderData.order_number}</span>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-gray-900">Order Summary</h2>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <IndianRupee className="h-4 w-4 text-blue-600" />
                                            <span className="text-sm text-gray-600">Total Value</span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">₹{orderData.total_value}</p>
                                    </div>

                                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Calendar className="h-4 w-4 text-purple-600" />
                                            <span className="text-sm text-gray-600">Delivery Date</span>
                                        </div>
                                        <p className="text-2xl font-bold text-gray-900">{orderData.delivery_date}</p>
                                    </div>
                                </div>

                                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-600">Order Status</span>
                                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-bold rounded-full capitalize">
                                            {orderData.status}
                                        </span>
                                    </div>
                                </div>

                                {orderData.board_name && (
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Board Name</span>
                                            <span className="text-sm font-bold text-gray-900">{orderData.board_name}</span>
                                        </div>
                                    </div>
                                )}

                                {orderData.user_email && (
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Email</span>
                                            <span className="text-sm font-bold text-gray-900">{orderData.user_email}</span>
                                        </div>
                                    </div>
                                )}

                                {orderData.user_mobile && (
                                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Mobile</span>
                                            <span className="text-sm font-bold text-gray-900">{orderData.user_mobile}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Next Steps */}
                            <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                                <h3 className="font-bold text-gray-900 mb-2">What's Next?</h3>
                                <ul className="text-sm text-gray-700 space-y-1">
                                    <li>• You will receive an email confirmation shortly</li>
                                    <li>• Our team will review your order and Gerber files</li>
                                    <li>• You'll be contacted if any clarification is needed</li>
                                    <li>• Production will begin after confirmation</li>
                                </ul>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-4">
                                <Link
                                    href="/"
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-xl shadow-md transition-all active:scale-[0.98]"
                                >
                                    <Home className="w-5 h-5" />
                                    Back to Home
                                </Link>
                                <button
                                    onClick={() => window.print()}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-300 hover:border-gray-400 text-gray-700 font-bold rounded-xl transition-all"
                                >
                                    <Package className="w-5 h-5" />
                                    Print Order
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Contact Support */}
                    <div className="mt-8 text-center">
                        <p className="text-sm text-gray-600">
                            Need help? <Link href="/" className="text-primary font-bold hover:underline">Contact Support</Link>
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
