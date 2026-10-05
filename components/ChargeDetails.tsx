"use client";

import React, { useState } from "react";
import { ChevronDown, ChevronUp, Package, ShieldCheck, Truck } from "lucide-react";
import { NormalizedJlcpcbQuote, PcbChargeItem } from "@/lib/jlcpcbQuoteNormalizer";

interface ChargeDetailsProps {
    normalizedQuote?: NormalizedJlcpcbQuote | null;
    selectedShippingCode?: string;
    onSelectShipping?: (code: string) => void;
    currencySymbol?: string;
    className?: string;
}

export default function ChargeDetails({
    normalizedQuote,
    selectedShippingCode,
    onSelectShipping,
    currencySymbol = "$",
    className = ""
}: ChargeDetailsProps) {
    const [isOpen, setIsOpen] = useState(true);

    if (!normalizedQuote) {
        return null;
    }

    const {
        pcbCharges = [],
        basePcbPrice = 0,
        shippingOptions = [],
        providerTotalFee = 0,
        weight,
        chargeWeight
    } = normalizedQuote;

    const activeShipping = shippingOptions.find(s => s.code === selectedShippingCode) || shippingOptions[0];

    const formatCurrency = (amount: number) => {
        return `${currencySymbol}${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all ${className}`}>
            {/* Header */}
            <div
                onClick={() => setIsOpen(prev => !prev)}
                className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40 cursor-pointer select-none hover:bg-slate-100/60 dark:hover:bg-slate-800/70 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <h3 className="text-[15px] sm:text-[16px] font-bold text-slate-900 dark:text-slate-100">
                        Charge Details
                    </h3>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                        {formatCurrency(basePcbPrice)}
                    </span>
                    {isOpen ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
                    ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
                    )}
                </div>
            </div>

            {/* Collapsible Content */}
            {isOpen && (
                <div className="p-4 sm:p-5 space-y-4">
                    {/* Itemized Charges */}
                    <div className="space-y-2.5">
                        {pcbCharges.map((item: PcbChargeItem) => (
                            <div
                                key={item.code}
                                className="flex justify-between items-center text-xs sm:text-sm text-slate-600 dark:text-slate-300"
                            >
                                <span className="font-medium text-slate-700 dark:text-slate-200">{item.label}</span>
                                <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                                    {formatCurrency(item.amount)}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Calculated Price */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-baseline">
                        <div>
                            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 block">
                                Calculated Price
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                                Base PCB manufacturing charge
                            </span>
                        </div>
                        <span className="text-lg sm:text-xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
                            {formatCurrency(basePcbPrice)}
                        </span>
                    </div>

                    {/* Shipping Estimate (Kept Independent) */}
                    {shippingOptions.length > 0 && (
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1.5 mb-2.5">
                                <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                                    Shipping Estimate
                                </span>
                                {weight && (
                                    <span className="text-[10px] text-slate-400 ml-auto">
                                        Weight: {weight} kg
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2">
                                {shippingOptions.map((opt) => {
                                    const isSelected = activeShipping?.code === opt.code;
                                    return (
                                        <div
                                            key={opt.code}
                                            onClick={() => onSelectShipping && onSelectShipping(opt.code)}
                                            className={`p-2.5 rounded-xl border text-xs flex justify-between items-center cursor-pointer transition-all ${isSelected
                                                ? "border-blue-500 bg-blue-50/60 dark:bg-blue-950/30 text-blue-900 dark:text-blue-200 shadow-2xs"
                                                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/40 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300"
                                                }`}
                                        >
                                            <div className="min-w-0 pr-2">
                                                <div className="font-semibold truncate">{opt.name}</div>
                                                {opt.deliveryDays && (
                                                    <div className="text-[10px] text-slate-400 mt-0.5">{opt.deliveryDays}</div>
                                                )}
                                            </div>
                                            <div className="font-bold tabular-nums whitespace-nowrap text-right">
                                                {formatCurrency(opt.price)}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
