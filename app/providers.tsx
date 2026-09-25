"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CurrencyProvider } from "../context/CurrencyContext";
import { AuthProvider } from "../context/AuthContext";
import AccountStatusModal from "../components/AccountStatusModal";

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = React.useState(() => new QueryClient());
    return (
        <QueryClientProvider client={queryClient}>
            <CurrencyProvider>
                <AuthProvider>
                    {children}
                    <AccountStatusModal />
                </AuthProvider>
            </CurrencyProvider>
        </QueryClientProvider>
    );
}