"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardSidebar from "@/components/DashboardSidebar";

interface UserProfile {
    id?: number | string;
    name?: string;
    email?: string;
    created_at?: string;
}

function AccountSkeleton() {
    return (
        <div className="space-y-4 animate-pulse max-w-md">
            <div className="h-16 bg-gray-100 rounded-xl w-full"></div>
            <div className="h-16 bg-gray-100 rounded-xl w-full"></div>
        </div>
    );
}

function AccountContent() {
    const router = useRouter();

    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAccount = async () => {
            try {
                const savedUser = localStorage.getItem("megabyte_user");
                const token = localStorage.getItem("megabyte_user_token");

                if (!token || !savedUser) {
                    router.push("/login?redirect=/account");
                    return;
                }

                const userObj = JSON.parse(savedUser);
                if (userObj?.id) {
                    const res = await fetch(`/api/dashboard/account?user_id=${userObj.id}`);
                    const data = await res.json();
                    if (data.status && data.user) {
                        setUser(data.user);
                    } else {
                        setUser(userObj);
                    }
                }
            } catch (e) {
                console.error("Account page fetch error:", e);
            } finally {
                setLoading(false);
            }
        };

        fetchAccount();
    }, [router]);

    return (
        <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#030712] text-gray-900 dark:text-gray-100 flex flex-col lg:flex-row font-sans transition-colors">
            <DashboardSidebar />

            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                <Header />

                <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                    {/* Header Banner */}
                    <div className="bg-white dark:bg-[#0b0f19] p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-2xs">
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                            Account Profile
                        </h1>
                        <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mt-0.5">
                            Inspect and manage your profile credentials.
                        </p>
                    </div>

                    <div className="bg-white dark:bg-[#0b0f19] rounded-2xl border border-gray-200/80 dark:border-white/10 p-6 shadow-2xs space-y-5">
                        <div className="border-b border-gray-100 dark:border-zinc-800 pb-4">
                            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">Account Details</h2>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">Your account personal information.</p>
                        </div>

                        {loading ? (
                            <AccountSkeleton />
                        ) : (
                            <div className="max-w-md space-y-4 text-xs font-semibold">
                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 space-y-1 border border-gray-200/80 dark:border-zinc-800">
                                    <span className="text-gray-400 dark:text-zinc-500 font-bold block text-[10px] uppercase">Full Name</span>
                                    <p className="text-sm font-extrabold text-gray-900 dark:text-white">{user?.name || "Customer"}</p>
                                </div>

                                <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 space-y-1 border border-gray-200/80 dark:border-zinc-800">
                                    <span className="text-gray-400 dark:text-zinc-500 font-bold block text-[10px] uppercase">Email Address</span>
                                    <p className="text-sm font-extrabold text-gray-900 dark:text-white">{user?.email || "N/A"}</p>
                                </div>

                                {user?.created_at && (
                                    <div className="p-4 rounded-xl bg-gray-50 dark:bg-zinc-800/40 space-y-1 border border-gray-200/80 dark:border-zinc-800">
                                        <span className="text-gray-400 dark:text-zinc-500 font-bold block text-[10px] uppercase">Member Since</span>
                                        <p className="text-sm font-extrabold text-gray-900 dark:text-white">{new Date(user.created_at).toLocaleDateString()}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    );
}

export default function AccountPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
        }>
            <AccountContent />
        </Suspense>
    );
}
