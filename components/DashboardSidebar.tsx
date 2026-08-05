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
    Calculator
} from "lucide-react";

interface SidebarCounts {
    orders: number;
    gerber_files: number;
    addresses: number;
}

export default function DashboardSidebar() {
    const pathname = usePathname();
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
            const savedUser = localStorage.getItem("megabyte_user");
            if (savedUser) {
                const userObj = JSON.parse(savedUser);
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
            }
        } catch (e) {
            console.error("Sidebar user parse error:", e);
        }
    }, []);

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

    return (
        <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200/80 p-3 shadow-2xs sticky top-20">
                <nav className="space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                                    item.active
                                        ? "bg-primary text-white shadow-xs"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Icon className="w-4 h-4" />
                                    <span>{item.name}</span>
                                </div>
                                {item.count !== undefined && item.count >= 0 && (
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${item.active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-600"}`}>
                                        {item.count}
                                    </span>
                                )}
                            </Link>
                        );
                    })}

                    <button
                        type="button"
                        onClick={async () => {
                            try {
                                await fetch("/api/auth/logout", { method: "POST" });
                            } catch (e) {
                                console.error("Logout API call error:", e);
                            } finally {
                                localStorage.removeItem("megabyte_user_token");
                                localStorage.removeItem("megabyte_user");
                                localStorage.removeItem("megabyte_checkout_items");
                                localStorage.removeItem("selectedCartItemIds");
                                document.cookie = "megabyte_user_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                                window.dispatchEvent(new Event("megabyte_auth_updated"));
                                window.location.href = "/";
                            }
                        }}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all cursor-pointer mt-2 border-t border-gray-100"
                    >
                        <div className="flex items-center gap-3">
                            <LogOut className="w-4 h-4 text-red-500" />
                            <span>Sign Out</span>
                        </div>
                    </button>
                </nav>
            </div>
        </aside>
    );
}
