"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Bell,
    CheckCircle2,
    Clock,
    AlertCircle,
    Package,
    CreditCard,
    Cpu,
    Search,
    RefreshCw,
    Check,
    ChevronLeft,
    ChevronRight,
    ArrowRight
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardSidebar from "@/components/DashboardSidebar";
import { getAuthUser } from "@/lib/auth";
import { showBrowserNotification } from "@/lib/browser-notifications";
import { toast } from "@/hooks/use-toast";

interface NotificationItem {
    id: number;
    title: string;
    message: string;
    category: string;
    theme: string;
    action_url: string | null;
    is_read: boolean;
    created_at: string;
}

export default function NotificationsPage() {
    const router = useRouter();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [unreadOnly, setUnreadOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [unreadCount, setUnreadCount] = useState(0);

    const fetchNotifications = useCallback(async () => {
        setLoading(true);
        try {
            const user = getAuthUser();
            if (!user?.id) {
                router.push("/login?redirect=/notifications");
                return;
            }

            const params = new URLSearchParams();
            params.append("user_id", String(user.id));
            params.append("page", String(page));
            params.append("per_page", "15");

            if (categoryFilter !== "all") params.append("category", categoryFilter);
            if (unreadOnly) params.append("unread_only", "true");
            if (search.trim()) params.append("search", search.trim());

            const res = await fetch(`/api/notifications?${params.toString()}`);
            const data = await res.json();

            if (data.status && Array.isArray(data.data)) {
                setNotifications(data.data);
                setUnreadCount(data.unread_count || 0);
                if (data.meta) {
                    setTotalPages(data.meta.last_page || 1);
                    setTotalCount(data.meta.total || 0);
                }
            }
        } catch (e) {
            console.error("Fetch notifications error:", e);
        } finally {
            setLoading(false);
        }
    }, [page, categoryFilter, unreadOnly, search, router]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const handleMarkAsRead = async (id: number, actionUrl?: string | null) => {
        try {
            const user = getAuthUser();
            await fetch(`/api/notifications/${id}/read`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user?.id })
            });
            fetchNotifications();
            if (actionUrl) {
                router.push(actionUrl);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            const user = getAuthUser();
            await fetch("/api/notifications/read-all", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user?.id })
            });
            fetchNotifications();
        } catch (e) {
            console.error(e);
        }
    };

    const renderCategoryIcon = (category: string, theme: string) => {
        if (theme === "error") return <AlertCircle className="w-5 h-5 text-rose-500" />;
        if (theme === "success") return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;

        switch (category) {
            case "order":
                return <Package className="w-5 h-5 text-primary dark:text-emerald-400" />;
            case "payment":
                return <CreditCard className="w-5 h-5 text-blue-500" />;
            case "gerber":
                return <Cpu className="w-5 h-5 text-purple-500" />;
            default:
                return <Bell className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div className="min-h-screen bg-[#f4f6f9] dark:bg-[#030712] text-gray-900 dark:text-gray-100 flex flex-col lg:flex-row font-sans transition-colors">
            <DashboardSidebar />

            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                <Header />

                <main className="flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
                    {/* Top Header Banner */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white dark:bg-[#0b0f19] p-5 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-2xs">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2.5">
                                <Bell className="w-6 h-6 text-primary dark:text-emerald-400" />
                                <span>Notification Center</span>
                            </h1>
                            <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium mt-1">
                                Stay updated with your PCB order progress, payment status, and system alerts in real time.
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                onClick={async () => {
                                    const success = await showBrowserNotification({
                                        title: "Test User Notification",
                                        message: "This is a test notification from Megabyte Circuits Notification Center.",
                                        action_url: "/notifications"
                                    });
                                    if (success) {
                                        toast({
                                            title: "Browser Notification Sent",
                                            description: "Native browser notification popped up successfully."
                                        });
                                    } else {
                                        toast({
                                            title: "Browser Notification Requested",
                                            description: "Permission was requested or is currently blocked by your browser settings."
                                        });
                                    }
                                }}
                                className="px-3.5 py-2 rounded-full bg-gray-100 dark:bg-zinc-800 hover:bg-gray-200 dark:hover:bg-zinc-700 text-gray-800 dark:text-zinc-200 font-extrabold text-xs transition-all flex items-center gap-1.5 cursor-pointer border border-gray-200 dark:border-zinc-700"
                            >
                                <Bell className="w-3.5 h-3.5 text-emerald-500" />
                                <span>Enable / Test Desktop Alerts</span>
                            </button>

                            {unreadCount > 0 && (
                                <button
                                    onClick={handleMarkAllAsRead}
                                    className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <Check className="w-4 h-4" />
                                    <span>Mark All as Read ({unreadCount})</span>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter & Search Bar */}
                    <div className="p-4 bg-white dark:bg-[#0b0f19] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-4">
                        {/* Search Input */}
                        <div className="relative w-full md:w-80">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                placeholder="Search notifications..."
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value);
                                    setPage(1);
                                }}
                                className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs text-gray-800 dark:text-zinc-200 placeholder-gray-400 focus:outline-none focus:border-primary transition-colors"
                            />
                        </div>

                        {/* Filters */}
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                            <select
                                value={categoryFilter}
                                onChange={(e) => {
                                    setCategoryFilter(e.target.value);
                                    setPage(1);
                                }}
                                className="px-3 py-2 rounded-xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 text-xs font-bold text-gray-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
                            >
                                <option value="all">All Categories</option>
                                <option value="order">Orders</option>
                                <option value="payment">Payments</option>
                                <option value="gerber">Gerber Files</option>
                                <option value="system">System Alerts</option>
                            </select>

                            <button
                                type="button"
                                onClick={() => {
                                    setUnreadOnly(!unreadOnly);
                                    setPage(1);
                                }}
                                className={`px-3 py-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer ${
                                    unreadOnly
                                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800"
                                        : "bg-gray-50 dark:bg-zinc-900 text-gray-700 dark:text-zinc-300 border-gray-200 dark:border-zinc-800"
                                }`}
                            >
                                {unreadOnly ? "Showing Unread" : "Filter Unread Only"}
                            </button>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="bg-white dark:bg-[#0b0f19] rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-2xs overflow-hidden">
                        {loading ? (
                            <div className="p-12 text-center text-gray-400 dark:text-zinc-500">
                                <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-primary" />
                                <p className="text-xs font-bold">Loading notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-12 text-center text-gray-400 dark:text-zinc-500 space-y-2">
                                <Bell className="w-10 h-10 mx-auto text-gray-300 dark:text-zinc-700" />
                                <h3 className="text-sm font-extrabold text-gray-800 dark:text-zinc-200">No Notifications</h3>
                                <p className="text-xs">You have no notification alerts matching your search criteria.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-white/5">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        onClick={() => handleMarkAsRead(n.id, n.action_url)}
                                        className={`p-5 transition-colors flex items-start gap-4 cursor-pointer hover:bg-gray-50/80 dark:hover:bg-zinc-900/60 ${
                                            !n.is_read ? "bg-emerald-50/30 dark:bg-emerald-950/10" : ""
                                        }`}
                                    >
                                        <div className="p-2.5 rounded-2xl bg-gray-100 dark:bg-zinc-800 shrink-0 mt-0.5">
                                            {renderCategoryIcon(n.category, n.theme)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2">
                                                <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                                                    <span>{n.title}</span>
                                                    {!n.is_read && (
                                                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] uppercase">New</span>
                                                    )}
                                                </h3>
                                                <div className="flex items-center gap-3 shrink-0">
                                                    <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono">
                                                        {new Date(n.created_at).toLocaleString()}
                                                    </span>
                                                    {!n.is_read && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleMarkAsRead(n.id, null);
                                                            }}
                                                            className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                                                        >
                                                            <Check className="w-3 h-3" />
                                                            <span>Mark as read</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <p className="text-xs text-gray-600 dark:text-zinc-400 font-medium leading-relaxed mt-1">
                                                {n.message}
                                            </p>

                                            {n.action_url && (
                                                <div className="mt-2.5">
                                                    <span className="inline-flex items-center gap-1 text-xs font-bold text-primary dark:text-emerald-400 hover:underline">
                                                        <span>View Details</span>
                                                        <ArrowRight className="w-3.5 h-3.5" />
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Pagination Footer */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs text-gray-500">
                                <span>Total {totalCount} notifications</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 disabled:opacity-40 text-gray-700 dark:text-zinc-300"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="font-bold">
                                        Page {page} of {totalPages}
                                    </span>
                                    <button
                                        disabled={page >= totalPages}
                                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                        className="p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800 disabled:opacity-40 text-gray-700 dark:text-zinc-300"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                <Footer />
            </div>
        </div>
    );
}
