"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import GerberBoardPreview from "@/components/GerberBoardPreview";
import { Search, ShoppingBag, Trash2, ShieldCheck, ArrowRight, Plus } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { saveCartToBackend, loadCartFromBackend, removeCartItemFromBackend } from "@/lib/cartSession";

interface CartItem {
    id: string;
    productType: "pcb" | "stencil";
    boardName: string;
    gerberFileName?: string;
    gerberPreview?: string;
    boardId?: string;
    pcbColor?: string;
    layers: string;
    dimensions: string;
    qty: number;
    buildTime: string;
    price: number;
    unitPrice?: number;
    material: string;
    thickness: string;
    surfaceFinish?: string;
    copperWeight?: string;
    date: string;
    customerNote?: string;
}

export default function CartPage() {
    const router = useRouter();
    const { symbol, formatPrice } = useCurrency();
    const [activeTab, setActiveTab] = useState<"all" | "pcb" | "stencil">("all");
    const [searchQuery, setSearchQuery] = useState("");
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const initCart = async () => {
            try {
                const savedCart = localStorage.getItem("megabyte_cart");
                let items: CartItem[] = savedCart ? JSON.parse(savedCart) : [];
                const backendItems = await loadCartFromBackend();
                if (Array.isArray(backendItems)) {
                    items = backendItems;
                }
                setCartItems(items);
                const savedSelected = localStorage.getItem("selectedCartItemIds");
                if (savedSelected) {
                    try {
                        const parsed = JSON.parse(savedSelected);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setSelectedItemIds(parsed.map(String));
                            localStorage.removeItem("selectedCartItemIds");
                        } else {
                            setSelectedItemIds([]);
                        }
                    } catch {
                        setSelectedItemIds([]);
                    }
                } else {
                    setSelectedItemIds([]);
                }
            } catch (e) {
                console.error("Failed to load cart", e);
            }
            setIsLoaded(true);
        };
        initCart();
    }, []);

    const saveCart = async (items: CartItem[]) => {
        setCartItems(items);
        await saveCartToBackend(items);
    };

    const handleRemoveItem = async (id: any) => {
        const strId = String(id);
        const updated = await removeCartItemFromBackend(strId);
        setCartItems(updated);
        setSelectedItemIds((prev) => prev.filter((itemId) => String(itemId) !== strId));
    };

    const handleQuantityChange = async (id: any, newQty: number) => {
        const strId = String(id);
        const updated = cartItems.map((item) => {
            if (String(item.id) === strId) {
                const unitPrice = item.unitPrice || (item.qty > 0 ? item.price / item.qty : item.price);
                const newPrice = Math.max(Math.round(unitPrice * newQty), 10);
                return { ...item, qty: newQty, price: newPrice, unitPrice };
            }
            return item;
        });
        await saveCart(updated);
    };

    // Filter items
    const filteredItems = cartItems.filter((item) => {
        const matchesTab =
            activeTab === "all" ? true : activeTab === "pcb" ? item.productType === "pcb" : item.productType === "stencil";
        const matchesSearch =
            (item.boardName && item.boardName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.gerberFileName && item.gerberFileName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.layers && String(item.layers).includes(searchQuery)) ||
            (item.material && item.material.toLowerCase().includes(searchQuery.toLowerCase()));
        return matchesTab && matchesSearch;
    });

    const isAllSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedItemIds.includes(String(item.id)));

    const toggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedItemIds([]);
        } else {
            setSelectedItemIds(filteredItems.map((item) => String(item.id)));
        }
    };

    const toggleSelectItem = (id: any) => {
        const strId = String(id);
        if (selectedItemIds.includes(strId)) {
            setSelectedItemIds(selectedItemIds.filter((itemId) => itemId !== strId));
        } else {
            setSelectedItemIds([...selectedItemIds, strId]);
        }
    };

    const pcbCount = cartItems.filter((i) => i.productType === "pcb").length;
    const stencilCount = cartItems.filter((i) => i.productType === "stencil").length;

    const selectedTotal = cartItems
        .filter((item) => selectedItemIds.includes(String(item.id)))
        .reduce((acc, item) => acc + item.price, 0);

    const selectedCount = cartItems.filter((item) => selectedItemIds.includes(String(item.id))).length;

    const handleCheckoutClick = () => {
        if (selectedCount === 0) return;

        // Store ONLY checked items for checkout processing
        const selectedCartItems = cartItems.filter((item) => selectedItemIds.includes(item.id));
        localStorage.setItem("megabyte_checkout_items", JSON.stringify(selectedCartItems));

        const userToken = typeof window !== "undefined" ? (localStorage.getItem("megabyte_user_token") || localStorage.getItem("megabyte_user")) : null;
        if (!userToken) {
            router.push("/login?redirect=/checkout");
            return;
        }
        router.push("/checkout");
    };

    return (
        <div className="min-h-screen bg-[#f4f6f9] flex flex-col font-sans">
            <Header />

            <main className="flex-1 max-w-[1550px] w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Page Title & Continue Shopping */}
                <div className="mb-4 flex items-center justify-between gap-4">
                    <h1 className="text-sm sm:text-base font-bold text-gray-700 tracking-wider uppercase">
                        SHOPPING CART
                    </h1>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-primary text-primary hover:bg-primary hover:text-white font-bold text-xs sm:text-sm transition-all shadow-2xs active:scale-95 cursor-pointer"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Continue Shopping</span>
                    </Link>
                </div>

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column: Cart Items & Empty State */}
                    <div className="flex-1 space-y-4">
                        <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 p-4 sm:p-5">
                            {/* Category Filter Tabs & Search */}
                            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200/80">
                                <div className="flex items-center gap-6 overflow-x-auto text-xs sm:text-sm font-semibold text-gray-600 select-none">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("all")}
                                        className={`pb-1 transition-colors cursor-pointer whitespace-nowrap ${activeTab === "all"
                                            ? "text-primary border-b-2 border-primary font-bold"
                                            : "hover:text-gray-900"
                                            }`}
                                    >
                                        All ({cartItems.length})
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab("pcb")}
                                        className={`pb-1 transition-colors cursor-pointer whitespace-nowrap ${activeTab === "pcb"
                                            ? "text-primary border-b-2 border-primary font-bold"
                                            : "hover:text-gray-900"
                                            }`}
                                    >
                                        Megabyte PCB ({pcbCount})
                                    </button>
                                </div>

                                <div className="relative w-full sm:w-56">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search"
                                        className="w-full h-8 pl-3 pr-8 text-xs border border-gray-300 rounded-lg focus:border-primary outline-none transition-all bg-white"
                                    />
                                    <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5" />
                                </div>
                            </div>

                            {/* Table Header */}
                            <div className="hidden sm:grid grid-cols-12 gap-4 py-2.5 px-4 bg-gray-100/70 rounded-t-lg text-xs font-extrabold text-gray-700 uppercase tracking-wide mt-3 border-b border-gray-200">
                                <div className="col-span-5 flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={toggleSelectAll}
                                        className="rounded text-primary focus:ring-primary accent-primary w-4 h-4 cursor-pointer"
                                    />
                                    <span>Item</span>
                                </div>
                                <div className="col-span-2 text-center">Qty</div>
                                <div className="col-span-2 text-center">Build Time</div>
                                <div className="col-span-2 text-center">Price</div>
                                <div className="col-span-1 text-center">
                                    <Trash2 className="w-4 h-4 mx-auto text-gray-400" />
                                </div>
                            </div>

                            {/* Cart Contents */}
                            {filteredItems.length === 0 ? (
                                /* Empty Cart State */
                                <div className="py-16 sm:py-24 flex flex-col items-center justify-center text-center">
                                    <div className="relative w-36 h-36 mb-4 flex items-center justify-center">
                                        <div className="absolute inset-0 bg-primary/5 rounded-full animate-pulse opacity-60" />
                                        <div className="relative w-24 h-24 bg-gradient-to-tr from-primary/10 to-indigo-50 rounded-2xl flex items-center justify-center shadow-xs border border-primary/20">
                                            <ShoppingBag className="w-12 h-12 text-primary" />
                                        </div>
                                    </div>
                                    <p className="text-base font-bold text-gray-700 mb-1">
                                        Your Cart is Empty
                                    </p>
                                    <p className="text-xs text-gray-400 mb-5 max-w-sm">
                                        Looks like you haven&apos;t added any PCB fabrication or stencil orders to your cart yet.
                                    </p>
                                    <Link
                                        href="/"
                                        className="inline-flex items-center gap-1.5 text-primary hover:text-secondary font-bold text-sm transition-colors group cursor-pointer"
                                    >
                                        <span>Order Now</span>
                                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {/* Cart Product Rows */}
                                    {filteredItems.map((item) => {
                                        const isSelected = selectedItemIds.includes(item.id);
                                        return (
                                            <div
                                                key={item.id}
                                                className={`py-4 px-4 grid grid-cols-1 sm:grid-cols-12 gap-4 items-center transition-colors ${isSelected ? "bg-white" : "bg-gray-50/40 opacity-75"
                                                    }`}
                                            >
                                                {/* Item Info + Gerber Preview */}
                                                <div className="sm:col-span-5 flex items-start gap-3">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelectItem(item.id)}
                                                        className="mt-2 rounded text-primary focus:ring-primary accent-primary w-4 h-4 shrink-0 cursor-pointer"
                                                    />

                                                    {/* Gerber Preview Box */}
                                                    <div className="w-24 h-24 sm:w-28 sm:h-28 bg-[#0b3818] rounded-xl border border-gray-200/90 flex items-center justify-center p-1 overflow-hidden shrink-0 relative group shadow-sm">
                                                        <GerberBoardPreview
                                                            previewData={item.gerberPreview}
                                                            boardName={item.gerberFileName || item.boardName}
                                                            pcbColor={item.pcbColor}
                                                            layers={item.layers}
                                                            dimensions={item.dimensions}
                                                        />
                                                    </div>

                                                    {/* Product Info & Specifications */}
                                                    <div className="min-w-0 flex-1">
                                                        <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug break-all mb-0.5">
                                                            {item.gerberFileName || item.boardName || (item.productType === "stencil" ? "SMT Stencil" : "Standard PCB")}
                                                        </h4>
                                                        <p className="text-[11px] text-gray-500 font-medium mb-0.5">
                                                            PCB prototype:{item.boardId || "Y2-12954629A"}
                                                        </p>
                                                        <p className="text-[11px] text-gray-600 font-medium mb-1">
                                                            {item.pcbColor || 'Green'}, {item.thickness || '1.6mm'} Thickness, {item.surfaceFinish || 'HASL(Leaded)'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Quantity Selector with Plus, Minus, Red Error on Non-Multiples, and Auto-Snap */}
                                                <div className="sm:col-span-2 flex flex-col items-center justify-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const current = item.qty || 5;
                                                                const rounded = Math.max(5, Math.round(current / 5) * 5);
                                                                handleQuantityChange(item.id, Math.max(5, rounded - 5));
                                                            }}
                                                            className="w-7 h-7 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 font-extrabold text-xs flex items-center justify-center cursor-pointer active:scale-95 transition-all select-none"
                                                            title="Decrease quantity by 5"
                                                        >
                                                            -
                                                        </button>
                                                        <input
                                                            type="number"
                                                            step="5"
                                                            min="5"
                                                            value={item.qty || ""}
                                                            onChange={(e) => {
                                                                const rawVal = e.target.value === "" ? 0 : Number(e.target.value);
                                                                const updated = cartItems.map((cartItem) => {
                                                                    if (cartItem.id === item.id) {
                                                                        return { ...cartItem, qty: rawVal };
                                                                    }
                                                                    return cartItem;
                                                                });
                                                                setCartItems(updated);
                                                            }}
                                                            onBlur={() => {
                                                                const rawVal = item.qty || 5;
                                                                const nearestQty = Math.max(5, Math.round(rawVal / 5) * 5);
                                                                handleQuantityChange(item.id, nearestQty);
                                                            }}
                                                            className={`w-14 h-7 border rounded text-center text-xs font-bold transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${item.qty % 5 !== 0 || item.qty < 5
                                                                ? "border-red-500 text-red-600 bg-red-50/80 focus:border-red-600 ring-2 ring-red-500/20"
                                                                : "border-gray-300 text-gray-800 bg-white focus:border-primary"
                                                                }`}
                                                            title="Only multiples of 5 allowed (5, 10, 15, ...)"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const current = item.qty || 5;
                                                                const rounded = Math.max(5, Math.round(current / 5) * 5);
                                                                handleQuantityChange(item.id, rounded + 5);
                                                            }}
                                                            className="w-7 h-7 rounded border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 font-extrabold text-xs flex items-center justify-center cursor-pointer active:scale-95 transition-all select-none"
                                                            title="Increase quantity by 5"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    {(item.qty % 5 !== 0 || item.qty < 5) && (
                                                        <span className="text-[9px] text-red-500 font-semibold mt-0.5 animate-in fade-in">
                                                            Step of 5 only
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Build Time */}
                                                <div className="sm:col-span-2 text-center text-xs font-semibold text-gray-700">
                                                    {item.buildTime}
                                                </div>

                                                {/* Price */}
                                                <div className="sm:col-span-2 text-center text-sm sm:text-base font-extrabold text-primary">
                                                    {formatPrice(item.price)}
                                                </div>

                                                {/* Delete Action */}
                                                <div className="sm:col-span-1 text-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveItem(item.id)}
                                                        className="p-1.5 text-gray-400 hover:text-red-500 transition-colors cursor-pointer rounded-lg hover:bg-red-50"
                                                        title="Remove item"
                                                    >
                                                        <Trash2 className="w-4 h-4 mx-auto" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: SUMMARY Sidebar */}
                    <div className="w-full lg:w-80 shrink-0">
                        <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 p-5 space-y-4 sticky top-20">
                            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-3">
                                SUMMARY
                            </h2>

                            <div className="space-y-3 py-1">
                                <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                                    <span>Total ({selectedCount} items)</span>
                                    <span className="text-primary text-xl font-black">
                                        {formatPrice(selectedTotal)}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2">
                                <button
                                    type="button"
                                    disabled={selectedCount === 0}
                                    onClick={handleCheckoutClick}
                                    className={`w-full py-3 rounded-full font-bold text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer ${selectedCount > 0
                                        ? "bg-primary hover:bg-secondary text-white active:scale-98"
                                        : "bg-gray-300 text-gray-500 cursor-not-allowed shadow-none"
                                        }`}
                                >
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Secure Checkout</span>
                                </button>
                            </div>

                            {/* Razorpay Trust & Payment Badges */}
                            <div className="pt-3 border-t border-gray-100 space-y-2">
                                <div className="flex flex-wrap items-center justify-center gap-1.5 text-[10px] text-gray-600 font-bold">
                                    <span className="px-2 py-0.5 bg-blue-50/80 border border-blue-200/80 rounded text-blue-700">UPI</span>
                                    <span className="px-2 py-0.5 bg-blue-50/80 border border-blue-200/80 rounded text-blue-700">Cards</span>
                                    <span className="px-2 py-0.5 bg-blue-50/80 border border-blue-200/80 rounded text-blue-700">NetBanking</span>
                                    <span className="px-2 py-0.5 bg-blue-50/80 border border-blue-200/80 rounded text-blue-700">Wallets</span>
                                </div>
                                <div className="text-[10px] text-gray-500 text-center flex items-center justify-center gap-1.5 font-semibold pt-1">
                                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                    <span>Secured by <strong className="text-blue-700 font-extrabold">Razorpay</strong></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
