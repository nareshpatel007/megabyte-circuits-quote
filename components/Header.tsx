"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ShoppingCart, User, ChevronDown, Loader2, ClipboardList, FolderArchive, Cpu, Mail, Ticket, LogOut, Bell, Sun, Moon } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import CartModal from "./CartModal";
import { loadCartFromBackend } from "@/lib/cartSession";
import { getAuthUser, clearAuthSession } from "@/lib/auth";

import GlobalSearch from "./GlobalSearch";

export default function Header() {
    const { currency, setCurrency, symbol, availableCurrencies, isLoading } = useCurrency();
    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [isBellOpen, setIsBellOpen] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem("megabyte_theme");
        if (savedTheme === "dark") {
            setIsDarkMode(true);
            document.documentElement.classList.add("dark");
        } else {
            setIsDarkMode(false);
            document.documentElement.classList.remove("dark");
        }
    }, []);

    const toggleThemeMode = () => {
        const nextMode = !isDarkMode;
        setIsDarkMode(nextMode);
        if (nextMode) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("megabyte_theme", "dark");
        } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("megabyte_theme", "light");
        }
    };
    const [cartCount, setCartCount] = useState(0);
    const [user, setUser] = useState<{ id?: string | number; name?: string; email?: string } | null>(null);

    const currencyRef = useRef<HTMLDivElement>(null);
    const accountRef = useRef<HTMLDivElement>(null);
    const bellRef = useRef<HTMLDivElement>(null);
    const cartRef = useRef<HTMLDivElement>(null);

    const sampleNotifications = [
        { id: 1, text: "Your PCB order #ORD-851528 build is in progress", time: "10m ago", unread: true },
        { id: 2, text: "Gerber file analysis completed successfully", time: "1h ago", unread: true },
        { id: 3, text: "Payment received for quote #Q-2026-004", time: "2h ago", unread: false }
    ];

    const updateCartCount = () => {
        try {
            const savedCart = localStorage.getItem("megabyte_cart");
            if (savedCart) {
                const items = JSON.parse(savedCart);
                setCartCount(Array.isArray(items) ? items.length : 0);
            } else {
                setCartCount(0);
            }
        } catch (e) {
            setCartCount(0);
        }
    };

    const updateUserData = () => {
        try {
            const currentUser = getAuthUser();
            setUser(currentUser);
        } catch (e) {
            setUser(null);
        }
    };

    const handleSignOut = async () => {
        try {
            await fetch("/api/auth/logout", { method: "POST" });
        } catch (e) {
            console.error("Logout API call error:", e);
        } finally {
            clearAuthSession();
            localStorage.removeItem("megabyte_checkout_items");
            localStorage.removeItem("selectedCartItemIds");
            setUser(null);
            setIsAccountOpen(false);
            window.dispatchEvent(new Event("megabyte_auth_updated"));
            window.location.href = "/";
        }
    };

    useEffect(() => {
        // Load cart from backend using session cookie on mount
        loadCartFromBackend().then(() => updateCartCount());
        updateUserData();

        const handleCartUpdate = () => updateCartCount();
        const handleAuthUpdate = () => updateUserData();

        const handleClickOutside = (event: MouseEvent) => {
            if (currencyRef.current && !currencyRef.current.contains(event.target as Node)) {
                setIsCurrencyOpen(false);
            }
            if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
                setIsAccountOpen(false);
            }
            if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
                setIsBellOpen(false);
            }
            if (cartRef.current && !cartRef.current.contains(event.target as Node)) {
                setIsCartOpen(false);
            }
        };

        window.addEventListener("megabyte_cart_updated", handleCartUpdate);
        window.addEventListener("megabyte_auth_updated", handleAuthUpdate);
        window.addEventListener("storage", handleCartUpdate);
        window.addEventListener("storage", handleAuthUpdate);
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            window.removeEventListener("megabyte_cart_updated", handleCartUpdate);
            window.removeEventListener("megabyte_auth_updated", handleAuthUpdate);
            window.removeEventListener("storage", handleCartUpdate);
            window.removeEventListener("storage", handleAuthUpdate);
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    const unreadCount = sampleNotifications.filter((n) => n.unread).length;

    return (
        <>
            <header className="bg-white dark:bg-zinc-900 border-b border-gray-200/90 dark:border-zinc-800 sticky top-0 z-50 shadow-xs h-14 transition-colors">
                <div className={`w-full h-full flex items-center justify-between gap-4 ${user ? "px-4 sm:px-6" : "max-w-[1550px] mx-auto px-4 sm:px-8 lg:px-12"}`}>
                    {/* Brand Logo (visible only when not logged in or in header layout) */}
                    {!user ? (
                        <div className="flex items-center gap-4 shrink-0">
                            <Link href="/" className="flex items-center gap-2 group">
                                <img
                                    src="/images/logo.png"
                                    alt="Megabyte Circuit Logo"
                                    className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-[1.02] dark:brightness-0 dark:invert"
                                />
                            </Link>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3">
                            <GlobalSearch />
                        </div>
                    )}

                    {/* Right Side Options (Pushed to Right End) */}
                    <div className="flex items-center gap-2 sm:gap-3 ml-auto">
                        {user && (
                            <>
                                {/* Theme toggle (Exact Admin Panel Icons & Animations) */}
                                <button
                                    type="button"
                                    onClick={toggleThemeMode}
                                    className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-600 dark:text-zinc-300 transition-all duration-200 cursor-pointer flex items-center justify-center"
                                    title={`Switch to ${isDarkMode ? "light" : "dark"} mode`}
                                >
                                    <Sun
                                        className={`w-4 h-4 absolute transition-all duration-300 ${
                                            isDarkMode ? "opacity-0 rotate-90 scale-0 text-amber-400" : "opacity-100 rotate-0 scale-100 text-gray-700"
                                        }`}
                                    />
                                    <Moon
                                        className={`w-4 h-4 transition-all duration-300 ${
                                            isDarkMode ? "opacity-100 rotate-0 scale-100 text-emerald-400" : "opacity-0 -rotate-90 scale-0 text-gray-700"
                                        }`}
                                    />
                                </button>

                                {/* Notifications Bell Option */}
                                <div ref={bellRef} className="relative">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsBellOpen(!isBellOpen);
                                            setIsAccountOpen(false);
                                        }}
                                        className="relative p-2 rounded-lg text-gray-600 dark:text-zinc-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all flex items-center justify-center cursor-pointer"
                                        title="Notifications"
                                    >
                                        <Bell className="w-4.5 h-4.5" />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900 animate-pulse" />
                                        )}
                                    </button>

                                    {isBellOpen && (
                                        <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xl z-50 text-xs text-gray-700 dark:text-zinc-300 animate-in fade-in zoom-in-95">
                                            <div className="px-4 py-3 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between bg-gray-50/60 dark:bg-zinc-800/50">
                                                <span className="font-extrabold text-gray-900 dark:text-white text-xs">Notifications</span>
                                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">{unreadCount} new</span>
                                            </div>
                                            <div className="divide-y divide-gray-100 dark:divide-zinc-800">
                                                {sampleNotifications.map((n) => (
                                                    <div
                                                        key={n.id}
                                                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer ${n.unread ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""}`}
                                                    >
                                                        <div className="flex items-start gap-2.5">
                                                            {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />}
                                                            <div className={!n.unread ? "ml-4" : ""}>
                                                                <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200 leading-relaxed">{n.text}</p>
                                                                <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium mt-0.5">{n.time}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="px-4 py-2.5 border-t border-gray-100 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-800/30 text-center">
                                                <button className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer">
                                                    View all notifications
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}

                        {/* Cart Option */}
                        <div ref={cartRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setIsCartOpen(!isCartOpen)}
                                className="relative p-2 rounded-lg text-gray-700 dark:text-zinc-300 hover:text-primary dark:hover:text-emerald-400 hover:bg-gray-100/70 dark:hover:bg-zinc-800 transition-all flex items-center justify-center cursor-pointer"
                                title="Shopping Cart"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900">
                                    {cartCount}
                                </span>
                            </button>

                            {/* Cart Dropdown Modal under Cart Icon */}
                            <CartModal isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
                        </div>

                        {/* Login / Account Option */}
                        {user ? (
                            <div ref={accountRef} className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsAccountOpen(!isAccountOpen)}
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-zinc-800 bg-gray-50/70 dark:bg-zinc-800/70 hover:bg-gray-100/90 dark:hover:bg-zinc-800 text-xs sm:text-sm font-bold text-gray-800 dark:text-zinc-200 transition-all cursor-pointer select-none"
                                >
                                    <User className="w-4 h-4 text-primary dark:text-emerald-400 shrink-0" />
                                    <span className="truncate max-w-[120px] sm:max-w-[160px]">{user.name || user.email}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-gray-500 dark:text-zinc-400 transition-transform ${isAccountOpen ? "rotate-180" : ""}`} />
                                </button>

                                {isAccountOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-zinc-900 border border-gray-200/90 dark:border-zinc-800 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 text-xs text-gray-700 dark:text-zinc-300">
                                        {/* Account Header */}
                                        <div className="px-4 py-2.5 border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-800/50">
                                            <p className="font-extrabold text-gray-900 dark:text-white text-xs truncate">
                                                {user.name || "Customer"}
                                            </p>
                                            <p className="text-[10px] text-gray-500 dark:text-zinc-400 truncate font-medium mt-0.5">
                                                {user.email || ""}
                                            </p>
                                        </div>

                                        <div className="py-1">
                                            <Link
                                                href="/dashboard"
                                                onClick={() => setIsAccountOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 font-medium transition-colors"
                                            >
                                                <Cpu className="w-4 h-4 text-gray-500 shrink-0" />
                                                <span>My Dashboard</span>
                                            </Link>

                                            <Link
                                                href="/quote"
                                                onClick={() => setIsAccountOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 font-medium transition-colors"
                                            >
                                                <Ticket className="w-4 h-4 text-gray-500 shrink-0" />
                                                <span>Instant Quote</span>
                                            </Link>

                                            <Link
                                                href="/orders"
                                                onClick={() => setIsAccountOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 font-medium transition-colors"
                                            >
                                                <ClipboardList className="w-4 h-4 text-gray-500 shrink-0" />
                                                <span>Order History</span>
                                            </Link>

                                            <Link
                                                href="/gerber-files"
                                                onClick={() => setIsAccountOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 font-medium transition-colors"
                                            >
                                                <FolderArchive className="w-4 h-4 text-gray-500 shrink-0" />
                                                <span>Gerber Files</span>
                                            </Link>

                                            <Link
                                                href="/addresses"
                                                onClick={() => setIsAccountOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 font-medium transition-colors"
                                            >
                                                <Ticket className="w-4 h-4 text-gray-500 shrink-0" />
                                                <span>My Addresses</span>
                                            </Link>

                                            <Link
                                                href="/account"
                                                onClick={() => setIsAccountOpen(false)}
                                                className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50 font-medium transition-colors"
                                            >
                                                <User className="w-4 h-4 text-gray-500 shrink-0" />
                                                <span>Account Profile</span>
                                            </Link>
                                        </div>

                                        {/* Sign Out Action */}
                                        <div className="border-t border-gray-100 pt-1 mt-1">
                                            <button
                                                type="button"
                                                onClick={handleSignOut}
                                                className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-red-50 text-red-600 font-semibold transition-colors cursor-pointer"
                                            >
                                                <LogOut className="w-4 h-4 text-red-500 shrink-0" />
                                                <span>Sign Out</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <Link
                                href="/login"
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary bg-primary hover:bg-secondary text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer active:scale-95"
                            >
                                <User className="w-4 h-4" />
                                <span>Login</span>
                            </Link>
                        )}
                    </div>
                </div>
            </header>
        </>
    );
}

