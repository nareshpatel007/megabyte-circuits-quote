"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface MobileSidebarContextType {
    isMobileSidebarOpen: boolean;
    openMobileSidebar: () => void;
    closeMobileSidebar: () => void;
    toggleMobileSidebar: () => void;
}

const MobileSidebarContext = createContext<MobileSidebarContextType>({
    isMobileSidebarOpen: false,
    openMobileSidebar: () => {},
    closeMobileSidebar: () => {},
    toggleMobileSidebar: () => {},
});

export function MobileSidebarProvider({ children }: { children: React.ReactNode }) {
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
    const pathname = usePathname();

    const openMobileSidebar = () => setIsMobileSidebarOpen(true);
    const closeMobileSidebar = () => setIsMobileSidebarOpen(false);
    const toggleMobileSidebar = () => setIsMobileSidebarOpen((prev) => !prev);

    // Auto-close mobile sidebar on route change
    useEffect(() => {
        setIsMobileSidebarOpen(false);
    }, [pathname]);

    // Handle ESC key to close sidebar
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                setIsMobileSidebarOpen(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Prevent body scroll when mobile sidebar is open
    useEffect(() => {
        if (isMobileSidebarOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => {
            document.body.style.overflow = "";
        };
    }, [isMobileSidebarOpen]);

    return (
        <MobileSidebarContext.Provider
            value={{
                isMobileSidebarOpen,
                openMobileSidebar,
                closeMobileSidebar,
                toggleMobileSidebar,
            }}
        >
            {children}
        </MobileSidebarContext.Provider>
    );
}

export function useMobileSidebar() {
    return useContext(MobileSidebarContext);
}
