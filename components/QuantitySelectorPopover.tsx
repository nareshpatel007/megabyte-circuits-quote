"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Check } from "lucide-react";

interface QuantitySelectorPopoverProps {
    value: string | number;
    onChange: (val: string) => void;
    minQty?: number;
}

const PRESET_QUANTITIES = [
    5, 10, 15, 20, 25, 30, 50,
    75, 100, 125, 150, 200, 250, 300,
    350, 400, 450, 500, 600, 700, 750,
    800, 900, 1000, 1200, 1250, 1400, 1500,
    1600, 1750, 1800, 2000, 2400, 2500, 2800,
    3000, 3500, 4000, 4500, 5000, 5500, 6000,
    6500, 7000, 7500, 8000, 8500, 9000, 9500,
    10000, 11000, 12000, 13000, 14000, 15000, 16000,
    17000, 18000, 19000, 25000, 30000, 40000, 50000,
    60000, 70000
];

export default function QuantitySelectorPopover({
    value,
    onChange,
    minQty = 5
}: QuantitySelectorPopoverProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [tempQty, setTempQty] = useState<string>(String(value || minQty));
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const num = parseInt(String(value), 10);
        if (isNaN(num) || num < minQty) {
            setTempQty(String(minQty));
        } else {
            setTempQty(String(value));
        }
    }, [value, minQty]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen]);

    const handleSelectPreset = (q: number) => {
        const strVal = String(q);
        setTempQty(strVal);
        onChange(strVal);
        setIsOpen(false);
    };

    const handleConfirm = () => {
        let parsed = parseInt(tempQty, 10);
        if (isNaN(parsed) || parsed < minQty) {
            parsed = minQty;
        }
        const finalVal = String(parsed);
        setTempQty(finalVal);
        onChange(finalVal);
        setIsOpen(false);
    };

    const currentQtyNum = parseInt(String(value), 10);
    const displayQty = isNaN(currentQtyNum) || currentQtyNum < minQty ? minQty : currentQtyNum;

    return (
        <div className="relative inline-block" ref={containerRef}>
            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="h-9 px-4 border border-gray-300 hover:border-primary focus:border-primary rounded-md bg-white text-sm font-medium text-gray-800 flex items-center justify-between min-w-[90px] sm:min-w-[120px] gap-3 shadow-xs focus:outline-none transition-colors cursor-pointer select-none"
            >
                <span>{displayQty}</span>
                <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
            </button>

            {/* Popover Dropdown using theme primary color */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 rounded-lg shadow-2xl p-4 w-[340px] sm:w-[500px] md:w-[560px] max-w-[92vw]">
                    {/* Grid of preset quantities (7 columns) */}
                    <div className="grid grid-cols-5 sm:grid-cols-7 gap-1.5 sm:gap-2 mb-4 max-h-[320px] overflow-y-auto pr-1">
                        {PRESET_QUANTITIES.map((q) => {
                            const isSelected = displayQty === q;
                            return (
                                <button
                                    key={q}
                                    type="button"
                                    onClick={() => handleSelectPreset(q)}
                                    className={`h-9 border rounded text-xs sm:text-sm font-medium flex items-center justify-center relative overflow-hidden transition-all cursor-pointer select-none ${
                                        isSelected
                                            ? "border-2 border-primary text-primary font-bold bg-primary/5"
                                            : "border-gray-200 hover:border-primary/60 hover:text-primary text-gray-700 bg-white"
                                    }`}
                                >
                                    <span>{q}</span>
                                    {isSelected && (
                                        <div className="absolute top-0 right-0 w-0 h-0 border-t-[14px] border-l-[14px] border-t-primary border-l-transparent">
                                            <Check className="w-2.5 h-2.5 text-white absolute -top-[14px] -right-[1px] stroke-[3]" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>

                    {/* Bottom Bar: Custom Qty input & Confirm button using theme primary color */}
                    <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
                        <span className="text-xs sm:text-sm font-medium text-gray-700 shrink-0">Custom Qty</span>
                        <input
                            type="number"
                            min={minQty}
                            value={tempQty}
                            onKeyDown={(e) => {
                                if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === ".") {
                                    e.preventDefault();
                                }
                            }}
                            onChange={(e) => {
                                setTempQty(e.target.value);
                            }}
                            onBlur={() => {
                                let parsed = parseInt(tempQty, 10);
                                if (isNaN(parsed) || parsed < minQty) {
                                    setTempQty(String(minQty));
                                }
                            }}
                            className="w-24 sm:w-36 h-9 px-3 border border-gray-300 rounded text-xs sm:text-sm font-medium text-gray-800 outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                        />
                        <button
                            type="button"
                            onClick={handleConfirm}
                            className="ml-auto bg-primary hover:bg-primary/90 text-white font-semibold text-xs sm:text-sm px-6 py-2 rounded-full transition-colors shadow-xs cursor-pointer"
                        >
                            Confirm
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
