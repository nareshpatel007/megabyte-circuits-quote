"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, ShoppingBag, Trash2, ArrowRight, ShoppingCart } from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { saveCartToBackend, loadCartFromBackend, removeCartItemFromBackend } from "@/lib/cartSession";

interface CartItem {
    id: string;
    productType: "pcb" | "stencil";
    boardName: string;
    layers: string;
    dimensions: string;
    qty: number;
    buildTime: string;
    price: number;
    material: string;
    thickness: string;
    date: string;
}

interface CartModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CartModal({ isOpen, onClose }: CartModalProps) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const { symbol } = useCurrency();

    const loadCart = () => {
        try {
            const savedCart = localStorage.getItem("megabyte_cart");
            if (savedCart) {
                setCartItems(JSON.parse(savedCart));
            } else {
                setCartItems([]);
            }
        } catch (e) {
            console.error("Failed to load cart from localStorage", e);
        }
    };

    useEffect(() => {
        if (isOpen) {
            loadCart();
        }
    }, [isOpen]);

    useEffect(() => {
        const handleCartUpdate = () => loadCart();
        window.addEventListener("megabyte_cart_updated", handleCartUpdate);
        window.addEventListener("storage", handleCartUpdate);
        return () => {
            window.removeEventListener("megabyte_cart_updated", handleCartUpdate);
            window.removeEventListener("storage", handleCartUpdate);
        };
    }, []);

    const handleRemoveItem = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const updated = await removeCartItemFromBackend(id);
        setCartItems(updated);
    };

    if (!isOpen) return null;

    const merchandiseTotal = cartItems.reduce((acc, item) => acc + item.price, 0);

    return (
        <>
            {/* Invisible Backdrop to close dropdown on click outside */}
            <div className="fixed inset-0 z-40" onClick={onClose} />

            {/* Cart Dropdown Modal under Cart Icon */}
            <div className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200/90 overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Arrow Pointing Up */}
                <div className="absolute top-0 right-4 -mt-1.5 w-3 h-3 bg-white border-t border-l border-gray-200/90 rotate-45 z-10" />

                {/* Modal Header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/80 relative z-20">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                            <ShoppingCart className="w-3.5 h-3.5" />
                        </div>
                        <div>
                            <h2 className="text-xs font-extrabold text-gray-900 leading-tight">Shopping Cart</h2>
                            <p className="text-[10px] text-gray-500 font-medium">
                                {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 transition-colors cursor-pointer"
                        title="Close"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto p-3 divide-y divide-gray-100 relative z-20">
                    {cartItems.length === 0 ? (
                        <div className="py-8 flex flex-col items-center justify-center text-center">
                            <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center mb-2.5 border border-primary/15">
                                <ShoppingBag className="w-7 h-7 text-primary" />
                            </div>
                            <h3 className="text-xs font-bold text-gray-800 mb-0.5">
                                Your Cart is Empty
                            </h3>
                            <p className="text-[11px] text-gray-400 mb-4 max-w-[220px] leading-relaxed">
                                No PCB or stencil products added yet.
                            </p>
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 bg-primary hover:bg-secondary text-white text-[11px] font-bold rounded-lg transition-all shadow-xs cursor-pointer active:scale-95"
                            >
                                Start Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2.5">
                            {cartItems.map((item: any) => (
                                <div
                                    key={item.id}
                                    className="p-2.5 bg-gray-50/70 hover:bg-gray-50 rounded-xl border border-gray-200/60 transition-all flex items-start gap-2.5 relative group"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-[#f2f4f7] border border-gray-200/80 flex items-center justify-center shrink-0 p-1 overflow-hidden">
                                        {item.gerberPreview && item.gerberPreview.startsWith("<svg") ? (
                                            <div
                                                className="w-full h-full flex items-center justify-center [&_svg]:w-full [&_svg]:h-full [&_svg]:object-contain"
                                                dangerouslySetInnerHTML={{ __html: item.gerberPreview }}
                                            />
                                        ) : (
                                            <img
                                                src={item.productType === "stencil" ? "/images/stencil-logo.png" : "/images/pcb-logo.png"}
                                                alt={item.productType}
                                                className="w-full h-full object-contain p-1"
                                            />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0 pr-5">
                                        <div className="flex items-center justify-between gap-1 mb-0.5">
                                            <h4 className="text-xs font-bold text-gray-900 truncate">
                                                {item.gerberFileName || item.boardName || (item.productType === "stencil" ? "SMT Stencil" : "Standard PCB")}
                                            </h4>
                                            <span className="text-xs font-extrabold text-primary shrink-0">
                                                {symbol}{item.price}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-1 text-[10px] text-gray-500 font-medium mb-0.5">
                                            <span className="bg-white border border-gray-200 px-1.5 py-0.2 rounded text-[10px] text-gray-600 font-semibold">
                                                {item.layers}
                                            </span>
                                            <span className="bg-white border border-gray-200 px-1.5 py-0.2 rounded text-[10px] text-gray-600 font-semibold">
                                                {item.dimensions}
                                            </span>
                                            <span className="bg-white border border-gray-200 px-1.5 py-0.2 rounded text-[10px] text-gray-600 font-semibold">
                                                Qty: {item.qty}
                                            </span>
                                        </div>

                                        {item.pcbColor && (
                                            <p className="text-[10px] text-gray-400 font-medium">
                                                {item.pcbColor}, {item.thickness || '1.6mm'}
                                            </p>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={(e) => handleRemoveItem(item.id, e)}
                                        className="absolute top-2.5 right-2 text-gray-400 hover:text-red-500 transition-colors p-1 rounded-md hover:bg-red-50 cursor-pointer"
                                        title="Remove item"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Modal Footer */}
                {cartItems.length > 0 && (
                    <div className="p-3 bg-gray-50/90 border-t border-gray-100 space-y-2.5 relative z-20">
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-gray-600">Subtotal:</span>
                            <span className="text-sm font-extrabold text-gray-900">
                                {symbol}{merchandiseTotal}
                            </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={onClose}
                                className="py-2 px-2.5 border border-gray-300 text-gray-700 hover:bg-gray-100 text-[11px] font-bold rounded-lg transition-all cursor-pointer text-center active:scale-95"
                            >
                                Continue Shopping
                            </button>
                            <Link
                                href="/cart"
                                onClick={onClose}
                                className="py-2 px-2.5 bg-primary hover:bg-secondary text-white text-[11px] font-bold rounded-lg transition-all shadow-xs flex items-center justify-center gap-1 text-center cursor-pointer active:scale-95"
                            >
                                <span>View Cart</span>
                                <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
