"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ShoppingCart, User, ChevronDown, Loader2, ClipboardList, FolderArchive, Cpu, Mail, Ticket, LogOut } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import CartModal from "./CartModal";
import { loadCartFromBackend } from "@/lib/cartSession";

export default function Header() {
    const { currency, setCurrency, symbol, availableCurrencies, isLoading } = useCurrency();
    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [isAccountOpen, setIsAccountOpen] = useState(false);
    const [cartCount, setCartCount] = useState(0);
    const [user, setUser] = useState<{ id?: string | number; name?: string; email?: string } | null>(null);

    const currencyRef = useRef<HTMLDivElement>(null);
    const accountRef = useRef<HTMLDivElement>(null);

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
            const savedUser = localStorage.getItem("megabyte_user");
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            } else {
                setUser(null);
            }
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
            localStorage.removeItem("megabyte_user_token");
            localStorage.removeItem("megabyte_user");
            localStorage.removeItem("megabyte_checkout_items");
            localStorage.removeItem("selectedCartItemIds");
            document.cookie = "megabyte_user_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
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

    return (
        <>
            <header className="bg-white border-b border-gray-200/90 sticky top-0 z-50 shadow-xs">
                <div className="max-w-[1550px] mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
                    {/* Brand Logo */}
                    <div className="flex items-center gap-4 shrink-0">
                        <Link href="/" className="flex items-center gap-2 group">
                            <img
                                src="/images/logo.png"
                                alt="Megabyte Circuit Logo"
                                className="h-9 sm:h-10 w-auto object-contain transition-transform group-hover:scale-[1.02]"
                            />
                        </Link>
                    </div>

                    {/* Right Side Options */}
                    <div className="flex items-center gap-2.5 sm:gap-4">
                        {/* Currency Dropdown Selector */}
                        <div ref={currencyRef} className="relative">
                            <button
                                type="button"
                                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50/60 hover:bg-gray-100/80 text-xs sm:text-sm font-semibold text-gray-700 transition-colors cursor-pointer"
                            >
                                <span>{symbol.trim()} {currency}</span>
                                {isLoading ? (
                                    <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                                ) : (
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                                )}
                            </button>

                            {isCurrencyOpen && (
                                <div className="absolute right-0 mt-1.5 w-36 max-h-60 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 scrollbar-thin">
                                    {availableCurrencies.map((curr) => {
                                        const currSymbol = curr === "INR" ? "₹" : curr === "USD" ? "$" : curr === "EUR" ? "€" : curr === "GBP" ? "£" : curr === "AED" ? "AED" : curr;
                                        return (
                                            <button
                                                key={curr}
                                                type="button"
                                                onClick={() => {
                                                    setCurrency(curr);
                                                    setIsCurrencyOpen(false);
                                                }}
                                                className={`w-full text-left px-3 py-1.5 text-xs sm:text-sm font-medium transition-colors hover:bg-gray-50 flex items-center justify-between ${currency === curr ? "text-primary font-bold bg-primary/5" : "text-gray-700"
                                                    }`}
                                            >
                                                <span>{curr}</span>
                                                <span className="text-gray-400 font-normal text-xs">{currSymbol}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Cart Option */}
                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setIsCartOpen(!isCartOpen)}
                                className="relative p-2 rounded-lg text-gray-700 hover:text-primary hover:bg-gray-100/70 transition-all flex items-center justify-center cursor-pointer"
                                title="Shopping Cart"
                            >
                                <ShoppingCart className="w-5 h-5" />
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
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
                                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50/70 hover:bg-gray-100/90 text-xs sm:text-sm font-bold text-gray-800 transition-all cursor-pointer select-none"
                                >
                                    <User className="w-4 h-4 text-primary shrink-0" />
                                    <span className="truncate max-w-[120px] sm:max-w-[160px]">{user.name || user.email}</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isAccountOpen ? "rotate-180" : ""}`} />
                                </button>

                                {isAccountOpen && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200/90 rounded-xl shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 text-xs text-gray-700">
                                        {/* Account Header */}
                                        <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50/50">
                                            <p className="font-extrabold text-gray-900 text-xs truncate">
                                                {user.name || "Customer"}
                                            </p>
                                            <p className="text-[10px] text-gray-500 truncate font-medium mt-0.5">
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

