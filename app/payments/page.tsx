"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardSidebar from "@/components/DashboardSidebar";
import { useCurrency } from "@/context/CurrencyContext";

interface PaymentItem {
    id: number;
    transaction_number: string;
    razorpay_payment_id?: string;
    amount: number;
    currency: string;
    status: string;
    payment_method?: string;
    created_at: string;
}

function PaymentsTableSkeleton() {
    return (
        <div className="space-y-3 animate-pulse">
            {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-xl w-full"></div>
            ))}
        </div>
    );
}

function PaymentsContent() {
    const router = useRouter();
    const { symbol, formatPrice } = useCurrency();

    const [payments, setPayments] = useState<PaymentItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPayments = async () => {
            try {
                const savedUser = localStorage.getItem("megabyte_user");
                const token = localStorage.getItem("megabyte_user_token");

                if (!token || !savedUser) {
                    router.push("/login?redirect=/payments");
                    return;
                }

                const userObj = JSON.parse(savedUser);
                if (userObj?.id) {
                    const res = await fetch(`/api/dashboard/payments?user_id=${userObj.id}`);
                    const data = await res.json();
                    if (data.status) {
                        setPayments(data.payments || []);
                    }
                }
            } catch (e) {
                console.error("Payments page fetch error:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchPayments();
    }, [router]);

    const filteredPayments = payments.filter((p) => ["success", "failed", "failure"].includes(p.status?.toLowerCase()));

    return (
        <div className="min-h-screen bg-[#f4f6f9] flex flex-col font-sans">
            <Header />

            <main className="flex-1 max-w-[1550px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Header Banner */}
                <div className="mb-6 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                    <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                        Payment History
                    </h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                        Audit log of your payment transactions and receipts.
                    </p>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    <DashboardSidebar />

                    {/* Right Main Content Area */}
                    <div className="flex-1 space-y-6">
                        <div className="bg-white rounded-2xl border border-gray-200/80 p-6 shadow-2xs space-y-5">
                            <div className="border-b border-gray-100 pb-4">
                                <h2 className="text-lg font-extrabold text-gray-900">Payment Audit History</h2>
                                <p className="text-xs text-gray-500 font-medium">Verify your payment transactions and receipts.</p>
                            </div>

                            {loading ? (
                                <PaymentsTableSkeleton />
                            ) : filteredPayments.length === 0 ? (
                                <div className="py-16 text-center text-xs text-gray-400 font-medium">
                                    No successful or failed payment transactions recorded yet.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-gray-400 font-extrabold uppercase">
                                                <th className="pb-3">Transaction #</th>
                                                <th className="pb-3">Razorpay Ref</th>
                                                <th className="pb-3">Date</th>
                                                <th className="pb-3">Amount</th>
                                                <th className="pb-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {filteredPayments.map((pmt) => (
                                                <tr key={pmt.id} className="hover:bg-gray-50/50">
                                                    <td className="py-3 font-extrabold text-gray-900">{pmt.transaction_number}</td>
                                                    <td className="py-3 text-gray-600 font-mono text-[11px]">{pmt.razorpay_payment_id || "N/A"}</td>
                                                    <td className="py-3 text-gray-500">{new Date(pmt.created_at).toLocaleString()}</td>
                                                    <td className="py-3 font-extrabold text-primary">{formatPrice(pmt.amount)}</td>
                                                    <td className="py-3">
                                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${pmt.status?.toLowerCase() === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
                                                            {pmt.status?.toLowerCase() === "success" ? "SUCCESS" : "FAILED"}
                                                        </span>
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

export default function PaymentsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <PaymentsContent />
        </Suspense>
    );
}
