"use client";

import { useState, useEffect } from "react";
import { getAuthToken, getAuthUser } from "@/lib/auth";

export default function Footer() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            try {
                const token = getAuthToken() || localStorage.getItem("megabyte_user_token");
                const user = getAuthUser() || localStorage.getItem("megabyte_user");
                setIsLoggedIn(Boolean(token && user));
            } catch (e) {
                setIsLoggedIn(false);
            } finally {
                setIsLoaded(true);
            }
        };

        checkAuth();
        window.addEventListener("megabyte_auth_updated", checkAuth);
        window.addEventListener("storage", checkAuth);
        return () => {
            window.removeEventListener("megabyte_auth_updated", checkAuth);
            window.removeEventListener("storage", checkAuth);
        };
    }, []);

    if (!isLoaded || isLoggedIn) {
        return null;
    }

    return (
        <footer className="bg-[#0f1729] text-gray-300 pb-4 border-t-4 border-primary">
            <div className="max-w-[1550px] mx-auto px-4">
                <div className="border-t border-gray-800 pt-4 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
                    <div>© {new Date().getFullYear()} Megabyte Circuit. All Rights Reserved.</div>
                    <div className="flex gap-6">
                        <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms & Conditions</a>
                        <a href="#" className="hover:text-white transition-colors">Cookies Policy</a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
