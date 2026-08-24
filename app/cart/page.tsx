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
import { saveCartToBackend, loadCartFromBackend, removeCartItemFromBackend, setCartSessionId, getMinCartQuantity } from "@/lib/cartSession";

import { getAuthToken, getAuthUser } from "@/lib/auth";

interface CartItem {
    id: string;
    productType: "pcb" | "stencil" | "part";
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
    shippingOption?: string;
    shippingOptionKey?: string;
    shippingCharge?: number;
    width?: number | string;
    height?: number | string;
    date: string;
    customerNote?: string;
}

export default function CartPage() {
    const router = useRouter();
    const { symbol, formatPrice } = useCurrency();
    const [activeTab, setActiveTab] = useState<"all" | "pcb" | "part" | "stencil">("all");
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
                if (typeof window !== "undefined") {
                    const searchParams = new URLSearchParams(window.location.search);
                    const urlSessionId = searchParams.get("session_id");
                    if (urlSessionId) {
                        setCartSessionId(urlSessionId);
                    }
                }
                const savedCart = localStorage.getItem("megabyte_cart");
                let items: CartItem[] = savedCart ? JSON.parse(savedCart) : [];
                const backendItems = await loadCartFromBackend();
                if (Array.isArray(backendItems)) {
                    items = backendItems;
                }
                items = items.map((item) => {
                    const minCartQty = getMinCartQuantity();
                    if (item.productType === "part" && (!item.qty || item.qty < minCartQty)) {
                        const minQty = minCartQty;
                        let basePrice = (item as any).baseUnitPrice;
                        if (!basePrice) {
                            const currentUnit = item.unitPrice || (item.qty > 0 ? item.price / item.qty : item.price);
                            let oldMult = 1;
                            if (item.qty >= 500) oldMult = 0.62;
                            else if (item.qty >= 100) oldMult = 0.70;
                            else if (item.qty >= 50) oldMult = 0.78;
                            else if (item.qty >= 25) oldMult = 0.85;
                            else if (item.qty >= 10) oldMult = 0.92;
                            basePrice = currentUnit / oldMult;
                        }
                        const multiplier = 0.62;
                        const effectiveUnitPrice = Math.round(basePrice * multiplier * 100) / 100;
                        const newPrice = Math.round(effectiveUnitPrice * minQty * 100) / 100;
                        return {
                            ...item,
                            qty: minQty,
                            price: newPrice,
                            unitPrice: effectiveUnitPrice,
                            baseUnitPrice: basePrice,
                        };
                    }
                    return item;
                });
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

    const handleRemoveSelectedItems = async () => {
        if (selectedItemIds.length === 0) return;
        const remainingItems = cartItems.filter(
            (item) => !selectedItemIds.includes(String(item.id))
        );
        await saveCart(remainingItems);
        setSelectedItemIds([]);
    };

    const handleQuantityChange = async (id: any, newQty: number) => {
        const strId = String(id);
        const updated = cartItems.map((item) => {
            if (String(item.id) === strId) {
                const minQty = item.productType === "part" ? getMinCartQuantity() : 1;
                const validQty = Math.max(minQty, isNaN(newQty) ? minQty : newQty);
                if (item.productType === "part") {
                    // Determine base unit price (unit price at qty 1)
                    let basePrice = (item as any).baseUnitPrice;
                    if (!basePrice) {
                        const currentUnit = item.unitPrice || (item.qty > 0 ? item.price / item.qty : item.price);
                        let oldMult = 1;
                        if (item.qty >= 500) oldMult = 0.62;
                        else if (item.qty >= 100) oldMult = 0.70;
                        else if (item.qty >= 50) oldMult = 0.78;
                        else if (item.qty >= 25) oldMult = 0.85;
                        else if (item.qty >= 10) oldMult = 0.92;
                        basePrice = currentUnit / oldMult;
                    }

                    let multiplier = 1;
                    if (validQty >= 500) multiplier = 0.62;
                    else if (validQty >= 100) multiplier = 0.70;
                    else if (validQty >= 50) multiplier = 0.78;
                    else if (validQty >= 25) multiplier = 0.85;
                    else if (validQty >= 10) multiplier = 0.92;

                    const effectiveUnitPrice = Math.round(basePrice * multiplier * 100) / 100;
                    const newPrice = Math.round(effectiveUnitPrice * validQty * 100) / 100;
                    return {
                        ...item,
                        qty: validQty,
                        price: newPrice,
                        unitPrice: effectiveUnitPrice,
                        baseUnitPrice: basePrice,
                    };
                } else {
                    // Extract width & height (or parse from dimensions string '100x100mm')
                    let w = Number(item.width);
                    let h = Number(item.height);
                    if ((!w || !h) && item.dimensions) {
                        const match = item.dimensions.match(/(\d+(?:\.\d+)?)\s*x\s*(\d+(?:\.\d+)?)/i);
                        if (match) {
                            w = parseFloat(match[1]);
                            h = parseFloat(match[2]);
                        }
                    }
                    if (!w) w = 100;
                    if (!h) h = 100;

                    // Compute unit PCB manufacturing price (excluding previous shipping fee)
                    const prevShippingCharge = item.shippingCharge || 0;
                    const prevPcbPrice = Math.max(item.price - prevShippingCharge, 0);
                    const pcbUnitPrice = item.unitPrice || (item.qty > 0 ? prevPcbPrice / item.qty : prevPcbPrice);

                    const newPcbPrice = Math.max(Math.round(pcbUnitPrice * validQty), 10);

                    // Recalculate shipping fee based on updated weight
                    let newShippingCharge = prevShippingCharge;
                    if (item.shippingOption) {
                        const defaultShippingOptions = [
                            { key: "gujarat_road", location: "In Gujarat", method: "By Road", rate: 40 },
                            { key: "out_road", location: "Out of Gujarat", method: "By Road", rate: 80 },
                            { key: "out_air", location: "Out of Gujarat", method: "By Air", rate: 150 },
                            { key: "out_fastrack", location: "Out of Gujarat", method: "Fastrack", rate: 450 },
                        ];
                        const foundOpt = defaultShippingOptions.find(o => `${o.location} - ${o.method}` === item.shippingOption || o.key === item.shippingOptionKey) || defaultShippingOptions[0];
                        const totalAreaInSqM = (w / 1000) * (h / 1000) * validQty;
                        const weightPerSqM = item.material === "Flex" ? 0.3 : 3.8;
                        const estimatedWeightKg = Math.max(0.1, parseFloat((totalAreaInSqM * weightPerSqM).toFixed(2)));
                        newShippingCharge = Math.round(foundOpt.rate * estimatedWeightKg);
                    }

                    const totalPriceWithShipping = newPcbPrice + newShippingCharge;

                    return {
                        ...item,
                        qty: validQty,
                        price: totalPriceWithShipping,
                        unitPrice: pcbUnitPrice,
                        shippingCharge: newShippingCharge
                    };
                }
            }
            return item;
        });
        await saveCart(updated);
    };

    // Filter items
    const filteredItems = cartItems.filter((item) => {
        const matchesTab =
            activeTab === "all"
                ? true
                : activeTab === "pcb"
                    ? item.productType === "pcb"
                    : activeTab === "part"
                        ? item.productType === "part"
                        : item.productType === "stencil";
        const matchesSearch =
            (item.boardName && item.boardName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            ((item as any).partNumber && (item as any).partNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (item.gerberFileName && item.gerberFileName.toLowerCase().includes(searchQuery.toLowerCase())) ||
            ((item as any).description && (item as any).description.toLowerCase().includes(searchQuery.toLowerCase())) ||
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
    const partCount = cartItems.filter((i) => i.productType === "part").length;
    const stencilCount = cartItems.filter((i) => i.productType === "stencil").length;

    const selectedCartItemsList = cartItems.filter((item) => selectedItemIds.includes(String(item.id)));
    const selectedCount = selectedCartItemsList.length;

    const selectedShippingTotal = selectedCartItemsList.reduce(
        (acc, item) => acc + (item.shippingCharge || 0),
        0
    );

    const selectedSubtotal = selectedCartItemsList.reduce(
        (acc, item) => acc + (item.price - (item.shippingCharge || 0)),
        0
    );

    const selectedTotal = selectedCartItemsList.reduce((acc, item) => acc + item.price, 0);

    const selectedShippingOptionsList = selectedCartItemsList
        .filter((item) => item.shippingOption)
        .map((item) => ({
            name: item.boardName || item.gerberFileName || "PCB",
            option: item.shippingOption!,
            charge: item.shippingCharge || 0,
        }));

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
                                        <button type="button" onClick={() => setActiveTab("pcb")} className={`pb-1 transition-colors cursor-pointer whitespace-nowrap ${activeTab === "pcb" ? "text-primary border-b-2 border-primary font-bold" : "hover:text-gray-900"}`}>Megabyte PCB ({pcbCount})</button>
                                        <button type="button" onClick={() => setActiveTab("part")} className={`pb-1 transition-colors cursor-pointer whitespace-nowrap ${activeTab === "part" ? "text-primary border-b-2 border-primary font-bold" : "hover:text-gray-900"}`}>Parts ({partCount})</button>
                                        {stencilCount > 0 && (
                                            <button type="button" onClick={() => setActiveTab("stencil")} className={`pb-1 transition-colors cursor-pointer whitespace-nowrap ${activeTab === "stencil" ? "text-primary border-b-2 border-primary font-bold" : "hover:text-gray-900"}`}>SMT Stencil ({stencilCount})</button>
                                        )}
                                    </div>

                                    <div className="relative w-full sm:w-60">
                                        <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search" className="w-full h-8 pl-3 pr-8 text-xs border border-gray-200 rounded-lg focus:border-primary focus:outline-none transition-colors" />
                                        <Search className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                                    </div>
                                </div>

                                {filteredItems.length > 0 && (
                                    <div className="flex items-center justify-between py-3 px-3 border-b border-gray-100 text-xs font-bold text-gray-500 bg-gray-50/50 rounded-lg mt-3">
                                        <div className="flex items-center gap-3">
                                            <input type="checkbox" checked={isAllSelected} onChange={toggleSelectAll} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer" />
                                            <span className="uppercase text-[11px]">Item</span>
                                        </div>
                                        <div className="hidden sm:flex items-center gap-3 sm:gap-5 text-[11px] uppercase">
                                            <span className="w-24 text-center">Qty</span>
                                            <span className="w-20 text-center">Build Time</span>
                                            <span className="w-36 text-center">Delivery Option</span>
                                            <span className="w-24 text-right">Price</span>
                                            <div className="w-8 flex justify-center">
                                                <button type="button" onClick={handleRemoveSelectedItems} disabled={selectedItemIds.length === 0} className={`p-1 rounded transition-colors ${selectedItemIds.length > 0 ? "text-red-500 hover:bg-red-50 cursor-pointer" : "text-gray-300 cursor-not-allowed"}`} title="Delete Selected">
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!isLoaded ? (
                                    <div className="py-6 space-y-4 animate-pulse">
                                        {[1, 2, 3].map((i) => (
                                            <div key={i} className="py-4 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-100">
                                                <div className="flex items-start gap-3 min-w-0 flex-1">
                                                    <div className="w-4 h-4 rounded bg-gray-200 mt-1 shrink-0"></div>
                                                    <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gray-200 rounded-xl shrink-0"></div>
                                                    <div className="space-y-2 min-w-0 flex-1 py-1">
                                                        <div className="h-4 bg-gray-200 rounded w-48"></div>
                                                        <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                                                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 pt-2 sm:pt-0 shrink-0">
                                                    <div className="w-24 h-7 bg-gray-200 rounded-lg"></div>
                                                    <div className="w-20 h-4 bg-gray-200 rounded"></div>
                                                    <div className="w-36 h-8 bg-gray-200 rounded-lg"></div>
                                                    <div className="w-24 h-5 bg-gray-200 rounded"></div>
                                                    <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : cartItems.length === 0 ? (
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
                                                <div key={item.id} className={`py-4 px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${isSelected ? "bg-primary/5" : ""}`}>
                                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                                        <input type="checkbox" checked={isSelected} onChange={() => toggleSelectItem(item.id)} className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary mt-1 shrink-0 cursor-pointer" />
                                                        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white rounded-xl border border-gray-200/90 flex items-center justify-center p-1.5 overflow-hidden shrink-0 relative shadow-xs">
                                                            {item.productType === "part" ? (
                                                                <img
                                                                    src={(item as any).photoUrl || "https://mm.digikey.com/Volume0/opasdata/d220001/medias/images/7182/MFG_RMCF_series.jpg"}
                                                                    alt={item.boardName || (item as any).partNumber || "Part"}
                                                                    className="w-full h-full object-contain"
                                                                    onError={(e) => {
                                                                        (e.target as HTMLElement).setAttribute(
                                                                            "src",
                                                                            "https://mm.digikey.com/Volume0/opasdata/d220001/medias/images/7182/MFG_RMCF_series.jpg"
                                                                        );
                                                                    }}
                                                                />
                                                            ) : (
                                                                <GerberBoardPreview previewData={item.gerberPreview} boardName={item.boardName} pcbColor={item.pcbColor} layers={item.layers} dimensions={item.dimensions} />
                                                            )}
                                                        </div>
                                                        <div className="space-y-1 min-w-0 flex-1">
                                                            <div className="flex items-center gap-1.5">
                                                                <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 truncate max-w-[240px] sm:max-w-[320px]">{item.boardName || (item as any).partNumber}</h3>
                                                            </div>
                                                             {item.productType === "part" ? (
                                                                <p className="text-[11px] text-gray-500 font-medium leading-relaxed line-clamp-2">
                                                                    {(item as any).description || "Electronic Component"}
                                                                </p>
                                                            ) : (
                                                                <p className="text-[11px] text-gray-500 font-medium leading-relaxed">
                                                                    {item.layers} Layer, {item.dimensions}, {item.thickness} Thickness, {item.material || "FR-4"}
                                                                    {(item as any).materialType ? `, ${(item as any).materialType}` : ""}
                                                                    {(item as any).substrateType ? `, ${(item as any).substrateType}` : ""}
                                                                    {(item as any).copperType ? `, Copper: ${(item as any).copperType}` : ""}
                                                                    {(item as any).coverlayColor ? `, Coverlay: ${(item as any).coverlayColor}` : ""}
                                                                    {(item as any).stiffener && (item as any).stiffener !== "Without" ? `, Stiffener: ${(item as any).stiffener}` : ""}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-5 pt-2 sm:pt-0 border-t sm:border-0 border-gray-100 shrink-0">
                                                        <div className="w-24 flex justify-center">
                                                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-7 bg-gray-50/50">
                                                                 <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const min = item.productType === "part" ? getMinCartQuantity() : 1;
                                                                        const step = item.productType === "part" ? 10 : 1;
                                                                        handleQuantityChange(item.id, Math.max(min, (item.qty || min) - step));
                                                                    }}
                                                                    className="w-6 h-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors text-xs font-bold cursor-pointer"
                                                                >
                                                                    -
                                                                </button>
                                                                <input
                                                                    type="number"
                                                                    min={item.productType === "part" ? getMinCartQuantity() : 1}
                                                                    step={item.productType === "part" ? 10 : 1}
                                                                    value={item.qty ?? (item.productType === "part" ? getMinCartQuantity() : 1)}
                                                                    onChange={(e) => {
                                                                        const val = parseInt(e.target.value, 10);
                                                                        handleQuantityChange(item.id, val);
                                                                    }}
                                                                    className="w-11 text-center text-xs font-bold text-gray-800 bg-transparent focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                />
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const min = item.productType === "part" ? getMinCartQuantity() : 1;
                                                                        const step = item.productType === "part" ? 10 : 1;
                                                                        handleQuantityChange(item.id, (item.qty || min) + step);
                                                                    }}
                                                                    className="w-6 h-full flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors text-xs font-bold cursor-pointer"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs font-semibold text-gray-600 w-20 text-center flex justify-center items-center">
                                                            {item.productType === "part" ? "-" : (item.buildTime || "-")}
                                                        </div>
                                                        <div className="w-36 text-center flex flex-col justify-center items-center">
                                                            {item.shippingOption ? (
                                                                <div className="bg-blue-50/80 border border-blue-100 rounded-lg px-2 py-1 text-[11px] font-bold text-blue-900 leading-tight">
                                                                    <div>{item.shippingOption}</div>
                                                                    <div className="text-[10px] text-primary font-semibold mt-0.5">
                                                                        Fee: {formatPrice(item.shippingCharge || 0)}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span className="text-xs text-gray-400 font-medium">-</span>
                                                            )}
                                                        </div>
                                                        <div className="text-sm font-extrabold text-primary w-24 text-right flex justify-end items-center">{formatPrice(item.price)}</div>
                                                        <div className="w-8 flex justify-center items-center">
                                                            <button type="button" onClick={() => handleRemoveItem(item.id)} className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer" title="Remove item"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
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
                                
                                {selectedCartItemsList.length > 0 && (
                                    <div className="space-y-2 py-2 border-b border-gray-100 text-xs">
                                        <div className="flex items-center justify-between text-gray-600 font-medium">
                                            <span>Subtotal ({selectedCount} {selectedCount === 1 ? "item" : "items"})</span>
                                            <span className="font-semibold text-gray-800">{formatPrice(selectedSubtotal)}</span>
                                        </div>
                                        {selectedShippingTotal > 0 && (
                                            <div className="flex items-center justify-between text-gray-600 font-medium">
                                                <span>Estimated Shipping</span>
                                                <span className="font-semibold text-gray-800">{formatPrice(selectedShippingTotal)}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                <div className="flex items-center justify-between text-sm font-extrabold text-gray-900 pt-1">
                                    <span>Total Amount</span>
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
