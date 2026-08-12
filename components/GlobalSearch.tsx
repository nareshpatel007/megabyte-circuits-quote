"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, ShoppingBag, CreditCard, FileArchive, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAuthUser } from "@/lib/auth";

interface SearchItem {
    id: string;
    title: string;
    subtitle: string;
    category: "Orders" | "Payments" | "Gerber Files";
    url: string;
    icon: any;
}

export default function GlobalSearch() {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [filteredResults, setFilteredResults] = useState<SearchItem[]>([]);

    const containerRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    useEffect(() => {
        const trimmed = query.trim();

        if (!trimmed) {
            setIsOpen(false);
            setFilteredResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);

        const timer = setTimeout(async () => {
            try {
                const user = getAuthUser();
                if (!user || !user.id) {
                    setIsSearching(false);
                    return;
                }

                const q = encodeURIComponent(trimmed);
                const res = await fetch(`/api/dashboard/search?user_id=${user.id}&q=${q}`);
                const data = await res.json();

                const results: SearchItem[] = [];

                if (data.status) {
                    // 1. Process Orders
                    (data.orders || []).forEach((o: any) => {
                        const orderNum = o.order_number || `ORD-${o.id}`;
                        const boardName = o.gerber_name || "PCB Order";
                        const status = o.status_name || "Pending";
                        const amount = o.order_value ? `₹${parseFloat(o.order_value).toLocaleString("en-IN")}` : "";

                        results.push({
                            id: `order-${o.id}`,
                            title: `#${orderNum} · ${boardName}`,
                            subtitle: `Status: ${status}${amount ? ` • ${amount}` : ""}`,
                            category: "Orders",
                            url: `/orders/${o.id}`,
                            icon: ShoppingBag,
                        });
                    });

                    // 2. Process Gerber Files
                    (data.gerber_files || []).forEach((g: any) => {
                        const originalName = g.original_name || g.board_name || "Gerber Archive";
                        const size = g.file_size || "";

                        results.push({
                            id: `gerber-${g.id}`,
                            title: originalName,
                            subtitle: `Uploaded Archive${size ? ` • ${size}` : ""}`,
                            category: "Gerber Files",
                            url: `/gerber-files`,
                            icon: FileArchive,
                        });
                    });

                    // 3. Process Payments
                    (data.payments || []).forEach((p: any) => {
                        const txnNum = p.transaction_number || p.razorpay_payment_id || `TXN-${p.id}`;
                        const amount = p.amount ? `₹${parseFloat(p.amount).toLocaleString("en-IN")}` : "";
                        const status = (p.status || "").toUpperCase();

                        results.push({
                            id: `payment-${p.id}`,
                            title: txnNum,
                            subtitle: `Payment ${status}${amount ? ` • ${amount}` : ""}${p.order_number ? ` • Order #${p.order_number}` : ""}`,
                            category: "Payments",
                            url: `/payments`,
                            icon: CreditCard,
                        });
                    });
                }

                setFilteredResults(results);
                setIsOpen(true);
            } catch (err) {
                console.error("Global search error:", err);
            } finally {
                setIsSearching(false);
            }
        }, 250);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        }
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === "Escape") {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    const handleSelect = (url: string) => {
        setIsOpen(false);
        setQuery("");
        router.push(url);
    };

    return (
        <div ref={containerRef} className="relative w-64 sm:w-80 md:w-96 lg:w-[420px]">
            {/* Search Input Box matched to Admin Panel */}
            <div className="relative flex items-center w-full rounded-xl transition-all duration-200 bg-gray-100/80 dark:bg-zinc-800/70 border border-gray-200/80 dark:border-zinc-700/60 focus-within:border-emerald-500/60 focus-within:ring-1 focus-within:ring-emerald-500/60">
                <Search className="w-4 h-4 absolute left-3.5 text-gray-400 dark:text-zinc-400 pointer-events-none" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => {
                        if (query.trim() && filteredResults.length > 0) setIsOpen(true);
                    }}
                    placeholder="Search order #, file name, transaction id..."
                    className="w-full pl-10 pr-9 py-2 text-xs sm:text-sm bg-transparent text-gray-900 dark:text-zinc-100 placeholder-gray-400 dark:placeholder-zinc-400 focus:outline-none font-medium"
                />
                {isSearching ? (
                    <Loader2 className="absolute right-3 w-4 h-4 text-emerald-600 dark:text-emerald-400 animate-spin" />
                ) : query ? (
                    <button
                        onClick={() => {
                            setQuery("");
                            setIsOpen(false);
                        }}
                        className="absolute right-3 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-200 transition-colors p-0.5 cursor-pointer"
                        title="Clear search"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                ) : (
                    <div className="absolute right-3 flex items-center gap-1 pointer-events-none">
                        <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-extrabold text-gray-400 dark:text-zinc-500 bg-white dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-md shadow-2xs">
                            /
                        </kbd>
                    </div>
                )}
            </div>

            {/* Admin-Matching Results Dropdown */}
            {isOpen && (
                <div className="absolute left-0 top-full mt-2 z-50 w-full rounded-2xl border border-gray-200/90 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="max-h-[380px] overflow-y-auto p-1.5 space-y-1">
                        {filteredResults.length === 0 ? (
                            <div className="py-8 text-center text-gray-400 dark:text-zinc-500 text-xs">
                                No matching results found for &quot;<span className="text-gray-700 dark:text-zinc-300">{query}</span>&quot;
                            </div>
                        ) : (
                            filteredResults.map((item) => {
                                const Icon = item.icon;
                                return (
                                    <div
                                        key={item.id}
                                        onClick={() => handleSelect(item.url)}
                                        className="group flex items-center justify-between px-3 py-2 rounded-xl hover:bg-emerald-500/10 hover:border-emerald-500/20 border border-transparent transition-all cursor-pointer"
                                    >
                                        <div className="flex items-center gap-2.5 min-w-0">
                                            <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-zinc-800/80 group-hover:bg-emerald-500/20 text-gray-500 dark:text-zinc-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors shrink-0">
                                                <Icon className="w-3.5 h-3.5" />
                                            </div>
                                            <div className="truncate">
                                                <p className="text-xs font-semibold text-gray-800 dark:text-zinc-200 group-hover:text-gray-900 dark:group-hover:text-white truncate">
                                                    {item.title}
                                                </p>
                                                <p className="text-[11px] text-gray-500 dark:text-zinc-400 group-hover:text-gray-700 dark:group-hover:text-zinc-300 truncate">
                                                    {item.subtitle}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                            <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-zinc-800/80 text-gray-600 dark:text-zinc-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                {item.category}
                                            </span>
                                            <ArrowRight className="w-3.5 h-3.5 text-gray-400 dark:text-zinc-600 opacity-0 group-hover:opacity-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-all -translate-x-1 group-hover:translate-x-0" />
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Exact Admin Bottom Section */}
                    <div className="px-3.5 py-2 border-t border-gray-100 dark:border-zinc-800/80 bg-gray-50/70 dark:bg-zinc-950/40 flex items-center justify-between text-[10px] text-gray-500 dark:text-zinc-500 font-medium">
                        <span>Showing {filteredResults.length} matches</span>
                        <span>Click item to navigate</span>
                    </div>
                </div>
            )}
        </div>
    );
}
