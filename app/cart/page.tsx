"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardSidebar from "@/components/DashboardSidebar";
import GerberBoardPreview from "@/components/GerberBoardPreview";
import { Search, ShoppingBag, Trash2, ShieldCheck, ArrowRight, Plus } from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { saveCartToBackend, loadCartFromBackend, removeCartItemFromBackend } from "@/lib/cartSession";
import { getAuthToken, getAuthUser } from "@/lib/auth";

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
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        try {
            const token = getAuthToken();
            const user = getAuthUser();
            setIsLoggedIn(Boolean(token && user));
        } catch (e) {
            setIsLoggedIn(false);
        }
    }, []);

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
                const allIds = items.map((item) => String(item.id));
                const savedSelected = localStorage.getItem("selectedCartItemIds");
                if (savedSelected) {
                    try {
                        const parsed = JSON.parse(savedSelected);
                        if (Array.isArray(parsed) && parsed.length > 0) {
                            setSelectedItemIds(parsed.map(String));
                            localStorage.removeItem("selectedCartItemIds");
                        } else {
                            setSelectedItemIds(allIds);
                        }
                    } catch {
                        setSelectedItemIds(allIds);
                    }
                } else {
                    setSelectedItemIds(allIds);
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
        const validQty = Math.max(1, isNaN(newQty) ? 1 : newQty);
        const updated = cartItems.map((item) => {
            if (String(item.id) === strId) {
                const unitPrice = item.unitPrice || (item.qty > 0 ? item.price / item.qty : item.price);
                const newPrice = Math.max(Math.round(unitPrice * validQty), 10);
                return { ...item, qty: validQty, price: newPrice, unitPrice };
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
        const selectedCartItems = cartItems.filter((item) => selectedItemIds.includes(String(item.id)));
        localStorage.setItem("megabyte_checkout_items", JSON.stringify(selectedCartItems));

        const userToken = typeof window !== "undefined" ? (localStorage.getItem("megabyte_user_token") || localStorage.getItem("megabyte_user")) : null;
        if (!userToken) {
            router.push("/login?redirect=/checkout");
            return;
        }
        router.push("/checkout");
    };


    return (
        <div className="min-h-screen bg-[#f4f6f9] flex flex-col lg:flex-row font-sans">
            {isLoggedIn && <DashboardSidebar />}

            <div className="flex-1 flex flex-col min-w-0 min-h-screen">
                <Header />

                <main className={`flex-1 w-full py-6 sm:py-8 space-y-6 ${isLoggedIn ? "px-4 sm:px-6 lg:px-8" : "max-w-[1550px] mx-auto px-4"}`}>
                    {/* Header Banner (Matching Dashboard/Orders/Quote Page Header Style) */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-gray-200/80 shadow-2xs">
                        <div>
                            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                                Shopping Cart
                            </h1>
                            <p className="text-xs text-gray-500 font-medium mt-0.5">
                                Review your selected PCB items and proceed to secure checkout.
                            </p>
                        </div>

                        <Link
                            href="/"
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-primary hover:bg-secondary text-white font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Continue Shopping</span>
                        </Link>
                    </div>

                    <div className="flex flex-col lg:flex-row gap-6">
                        <div className="flex-1 space-y-4">
                            <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 p-4 sm:p-5">
                                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-gray-200/80">
                                    <div className="flex items-center gap-6 overflow-x-auto text-xs sm:text-sm font-semibold text-gray-600 select-none">
                                        <button type="button" onClick={() => setActiveTab("all")} className={`pb-1 transition-colors cursor-pointer whitespace-nowrap ${activeTab === "all" ? "text-primary border-b-2 border-primary font-bold" : "hover:text-gray-900"}`}>All ({cartItems.length})</button>
                                        <button type="button" onClick={() => setActiveTab("pcb")} className={`pb-1 transition-colors cursor-pointer whitespace-nowrap ${activeTab === "pcb" ? "text-primary border-b-2 border-primary font-bold" : "hover:text-gray-900"}`}>Megabyte PCB ({cartItems.filter(i => i.productType === 'pcb').length})</button>
                                    </div>

                                    <div className="relative w-full sm:w-60">
                                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search" className="w-full h-8 pl-3 pr-8 text-xs border border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors" />
                                        <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                                    </div>
                                </div>

                                {filteredItems.length > 0 && (
                                    <div className="flex items-center justify-between py-3 px-2 border-b border-gray-100 text-xs font-bold text-gray-500 bg-gray-50/50 rounded-lg mt-3">
                                        <div className="flex items-center gap-3">
                                            <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" />
                                            <span className="uppercase text-[11px]">Item</span>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-12 mr-6 text-[11px] uppercase">
                                            <span className="w-20 text-center">Qty</span>
                                            <span className="w-24 text-center">Build Time</span>
                                            <span className="w-20 text-right">Price</span>
                                            <button type="button" onClick={() => setSelectedItemIds([])} disabled={selectedItemIds.length === 0} className={`p-1 rounded transition-colors ${selectedItemIds.length > 0 ? "text-red-500 hover:bg-red-50 cursor-pointer" : "text-gray-300 cursor-not-allowed"}`} title="Delete Selected">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {cartItems.length === 0 ? (
                                    <div className="py-16 text-center space-y-3">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-400"><ShoppingBag className="w-8 h-8" /></div>
                                        <p className="text-sm font-bold text-gray-700">Your shopping cart is empty.</p>
                                    </div>
                                ) : filteredItems.length === 0 ? (
                                    <div className="py-12 text-center text-xs text-gray-400 font-medium">No items matching your search.</div>
                                ) : (
                                    <div className="divide-y divide-gray-100">
                                        {filteredItems.map((item) => {
                                            const isSelected = selectedItemIds.includes(String(item.id));
                                            return (
                                                <div key={item.id} className={`py-4 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelectItem(item.id)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary mt-1 shrink-0 cursor-pointer" />
                                                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-[#0b3818] rounded-xl border border-gray-200/90 flex items-center justify-center p-1 overflow-hidden shrink-0 relative shadow-xs">
                                                            <GerberBoardPreview previewData={item.gerberPreview} boardName={item.boardName} pcbColor={item.pcbColor} layers={item.layers} dimensions={item.dimensions} />
                                                        </div>
                                                        <div className="space-y-1 min-w-0">
                                                            <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 truncate max-w-[240px] sm:max-w-[320px]">{item.boardName}</h3>
                                                            <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                                                                {item.layers} Layer, {item.dimensions}, {item.thickness} Thickness, {item.material || "FR-4"}
                                                                {(item as any).materialType ? `, ${(item as any).materialType}` : ""}
                                                                {(item as any).substrateType ? `, ${(item as any).substrateType}` : ""}
                                                                {(item as any).copperType ? `, Copper: ${(item as any).copperType}` : ""}
                                                                {(item as any).coverlayColor ? `, Coverlay: ${(item as any).coverlayColor}` : ""}
                                                                {(item as any).stiffener && (item as any).stiffener !== "Without" ? `, Stiffener: ${(item as any).stiffener}` : ""}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100">
                                                         <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-7 bg-gray-50/50">
                                                             <button type="button" onClick={() => handleQuantityChange(item.id, (item.qty || 1) - 1)} className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors text-xs font-bold cursor-pointer">-</button>
                                                             <input
                                                                 type="number"
                                                                 min="1"
                                                                 value={item.qty ?? 1}
                                                                 onChange={(e) => {
                                                                     const val = parseInt(e.target.value, 10);
                                                                     handleQuantityChange(item.id, val);
                                                                 }}
                                                                 className="w-12 text-center text-xs font-bold text-gray-800 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                             />
                                                             <button type="button" onClick={() => handleQuantityChange(item.id, (item.qty || 1) + 1)} className="w-7 h-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors text-xs font-bold cursor-pointer">+</button>
                                                         </div>
                                                        <div className="text-xs font-semibold text-gray-600 w-20 text-center">{item.buildTime}</div>
                                                        <div className="text-sm font-extrabold text-primary w-24 text-right">{formatPrice(item.price)}</div>
                                                        <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="w-full lg:w-80 shrink-0">
                            <div className="bg-white rounded-xl shadow-xs border border-gray-200/80 p-5 space-y-4 sticky top-20">
                                <h2 className="text-xs font-bold text-gray-700 tracking-wider uppercase border-b border-gray-100 pb-3">SUMMARY</h2>
                                <div className="flex items-center justify-between text-sm font-extrabold text-gray-900 pt-1">
                                    <span>Total ({selectedItemIds.length} items)</span>
                                    <span className="text-lg text-primary">{formatPrice(selectedTotal)}</span>
                                </div>
                                <button type="button" onClick={handleCheckoutClick} disabled={selectedItemIds.length === 0} className={`w-full py-3 rounded-full text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${selectedItemIds.length > 0 ? "bg-primary hover:bg-secondary cursor-pointer active:scale-95" : "bg-gray-300 cursor-not-allowed"}`}>
                                    <ShieldCheck className="w-4 h-4" />
                                    <span>Secure Checkout</span>
                                </button>
                                <div className="pt-3 border-t border-gray-100 space-y-2">
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
        </div>
    );
}
