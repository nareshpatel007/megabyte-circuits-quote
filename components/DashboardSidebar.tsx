"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    Package,
    FolderArchive,
    CreditCard,
    MapPin,
    User,
    LogOut,
    Calculator,
    X
} from "lucide-react";
import { getAuthToken, getAuthUser, getImpersonationSession, clearAuthSession } from "@/lib/auth";
import { useMobileSidebar } from "@/context/MobileSidebarContext";

interface SidebarCounts {
    orders: number;
    gerber_files: number;
    addresses: number;
}

export default function DashboardSidebar() {
    const pathname = usePathname();
    const { isMobileSidebarOpen, closeMobileSidebar } = useMobileSidebar();

    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAuthLoaded, setIsAuthLoaded] = useState(false);
    const [counts, setCounts] = useState<SidebarCounts>(() => {
        if (typeof window !== "undefined") {
            try {
                const cached = localStorage.getItem("megabyte_sidebar_counts");
                if (cached) return JSON.parse(cached);
            } catch (e) {}
        }
        return { orders: 0, gerber_files: 0, addresses: 0 };
    });

    useEffect(() => {
        try {
            const token = getAuthToken() || localStorage.getItem("megabyte_user_token");
            const savedUser = getAuthUser() || localStorage.getItem("megabyte_user");
            if (token && savedUser) {
                setIsLoggedIn(true);
                const userObj = typeof savedUser === "string" ? JSON.parse(savedUser) : savedUser;
                if (userObj?.id) {
                    fetch(`/api/dashboard/sidebar-counts?user_id=${userObj.id}`)
                        .then((res) => res.json())
                        .then((data) => {
                            if (data.status && data.counts) {
                                setCounts(data.counts);
                                try {
                                    localStorage.setItem("megabyte_sidebar_counts", JSON.stringify(data.counts));
                                } catch (e) {}
                            }
                        })
                        .catch((err) => console.error("Sidebar counts fetch error:", err));
                }
            } else {
                setIsLoggedIn(false);
            }
        } catch (e) {
            console.error("Sidebar user parse error:", e);
            setIsLoggedIn(false);
        } finally {
            setIsAuthLoaded(true);
        }
    }, []);

    if (!isAuthLoaded || !isLoggedIn) {
        return null;
    }

    const navItems = [
        {
            name: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
            active: pathname === "/dashboard"
        },
        {
            name: "Instant Quote",
            href: "/quote",
            icon: Calculator,
            active: pathname === "/quote"
        },
        {
            name: "My Orders",
            href: "/orders",
            icon: Package,
            count: counts.orders,
            active: pathname === "/orders"
        },
        {
            name: "Gerber Files",
            href: "/gerber-files",
            icon: FolderArchive,
            count: counts.gerber_files,
            active: pathname === "/gerber-files"
        },
        {
            name: "Payment History",
            href: "/payments",
            icon: CreditCard,
            active: pathname === "/payments"
        },
        {
            name: "My Addresses",
            href: "/addresses",
            icon: MapPin,
            count: counts.addresses,
            active: pathname === "/addresses"
        },
        {
            name: "Account Profile",
            href: "/account",
            icon: User,
            active: pathname === "/account"
        }
    ];

    const handleSignOut = async () => {
        closeMobileSidebar();
        const impSession = getImpersonationSession();
        try {
            if (impSession && impSession.active) {
                const token = getAuthToken();
                const rawBackendUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost/megabyte-circuits/megabyte-circuits-api/public";
                const backendUrl = rawBackendUrl.replace(/\/+$/, "");
                await fetch(`${backendUrl}/api/auth/impersonation/stop`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: token ? `Bearer ${token}` : "" },
                    body: JSON.stringify({ session_id: impSession.session_id })
                });
            } else {
                await fetch("/api/auth/logout", { method: "POST" });
            }
        } catch (e) {
            console.error("Logout API call error:", e);
        } finally {
            const wasImpersonating = impSession && impSession.active;
            clearAuthSession();
            localStorage.removeItem("megabyte_checkout_items");
            localStorage.removeItem("selectedCartItemIds");
            window.dispatchEvent(new Event("megabyte_auth_updated"));

            if (wasImpersonating) {
                const adminUrl = process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3000/clients";
                window.location.href = adminUrl;
            } else {
                window.location.href = "/";
            }
        }
    };

    const renderNavContent = () => (
        <>
            {/* Top Left Logo Header */}
            <div className="h-[64px] px-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-emerald-950/40">
                <Link href="/" onClick={closeMobileSidebar} className="flex items-center gap-2">
                    <img
                        src="/images/logo.png"
                        alt="Megabyte Circuits"
                        className="h-9 sm:h-10 w-auto object-contain brightness-0 invert"
                    />
                </Link>
                {/* Close Button for Mobile Drawer */}
                <button
                    type="button"
                    onClick={closeMobileSidebar}
                    className="p-2 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors lg:hidden cursor-pointer"
                    title="Close navigation"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Nav Links */}
            <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto scrollbar-thin">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={closeMobileSidebar}
                            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                                item.active
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold"
                                    : "text-white/90 hover:bg-white/10 hover:text-white"
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <Icon className={`w-4.5 h-4.5 shrink-0 ${item.active ? "text-emerald-400" : "text-white/80"}`} />
                                <span>{item.name}</span>
                            </div>
                            {item.count !== undefined && item.count >= 0 && (
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${item.active ? "bg-emerald-500/30 text-emerald-300" : "bg-white/10 text-white/70"}`}>
                                    {item.count}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* Bottom Sign Out */}
            <div className="p-3 border-t border-white/10 shrink-0 bg-emerald-950/20">
                <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all cursor-pointer"
                >
                    <div className="flex items-center gap-3">
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span>Sign Out</span>
                    </div>
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Desktop Sidebar (lg screens and above) */}
            <aside className="hidden lg:flex w-[240px] h-screen sticky top-0 shrink-0 bg-[#063319] text-white flex-col border-r border-emerald-900/60 shadow-xl overflow-hidden">
                {renderNavContent()}
            </aside>

            {/* Mobile Drawer Sidebar (screens below lg) */}
            {isMobileSidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-[100] flex">
                    {/* Backdrop Overlay */}
                    <div
                        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
                        onClick={closeMobileSidebar}
                    />

                    {/* Drawer Content */}
                    <aside className="relative z-10 w-72 max-w-[85vw] h-[100dvh] bg-[#063319] text-white flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-left duration-250">
                        {renderNavContent()}
                    </aside>
                </div>
            )}
        </>
    );
}
