"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CurrencyContextType {
    currency: string;
    rates: Record<string, number>;
    currentRate: number;
    symbol: string;
    setCurrency: (code: string) => void;
    formatPrice: (amountInINR: number | string) => string;
    isLoading: boolean;
    availableCurrencies: string[];
}

const SYMBOLS: Record<string, string> = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
    AED: "AED ",
    CAD: "CA$",
    AUD: "A$",
    JPY: "¥",
    CNY: "¥",
};

const DEFAULT_RATES: Record<string, number> = {
    INR: 1,
    USD: 0.012,
    EUR: 0.011,
    GBP: 0.0094,
    AED: 0.044,
    CAD: 0.016,
    AUD: 0.018,
};

const CurrencyContext = createContext<CurrencyContextType>({
    currency: "INR",
    rates: DEFAULT_RATES,
    currentRate: 1,
    symbol: "₹",
    setCurrency: () => {},
    formatPrice: (amt) => `₹${parseFloat(amt.toString() || "0").toFixed(2)}`,
    isLoading: false,
    availableCurrencies: ["INR", "USD", "EUR", "AED", "GBP", "CAD", "AUD"],
});

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currency, setCurrencyState] = useState<string>("INR");
    const [rates, setRates] = useState<Record<string, number>>(DEFAULT_RATES);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    useEffect(() => {
        const savedCurrency = localStorage.getItem("megabyte_currency");
        if (savedCurrency && (DEFAULT_RATES[savedCurrency] !== undefined || SYMBOLS[savedCurrency] !== undefined)) {
            setCurrencyState(savedCurrency);
        }
    }, []);

    const fetchRates = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("https://open.er-api.com/v6/latest/INR");
            if (res.ok) {
                const data = await res.json();
                if (data && data.rates) {
                    setRates({ INR: 1, ...data.rates });
                }
            }
        } catch (err) {
            console.error("Failed to fetch exchange rates:", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRates();
    }, []);

    const setCurrency = (code: string) => {
        setCurrencyState(code);
        try {
            localStorage.setItem("megabyte_currency", code);
        } catch (e) {
            console.error("Failed to save currency to localStorage", e);
        }
        if (Object.keys(rates).length <= Object.keys(DEFAULT_RATES).length) {
            fetchRates();
        }
    };

    const currentRate = rates[currency] ?? DEFAULT_RATES[currency] ?? 1;
    const symbol = SYMBOLS[currency] ?? `${currency} `;

    const formatPrice = (amountInINR: number | string): string => {
        const rawStr = String(amountInINR ?? "0").replace(/^0+(?=\d)/, "");
        const val = typeof amountInINR === "number" ? amountInINR : parseFloat(rawStr) || 0;
        const converted = val * currentRate;
        return `${symbol}${converted.toFixed(2)}`;
    };

    const availableCurrencies = Array.from(
        new Set(["INR", "USD", "EUR", "AED", "GBP", "CAD", "AUD", ...Object.keys(rates).slice(0, 15)])
    );

    return (
        <CurrencyContext.Provider
            value={{
                currency,
                rates,
                currentRate,
                symbol,
                setCurrency,
                formatPrice,
                isLoading,
                availableCurrencies,
            }}
        >
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);
