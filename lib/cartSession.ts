"use client";

import { getAuthUser, getAuthToken, getCookie as getAuthCookie, setCookie as setAuthCookie, removeCookie as removeAuthCookie } from "./auth";

const COOKIE_NAME = "megabyte_cart_session_id";
const COOKIE_MAX_AGE_DAYS = 30;

function getCookieDomain(): string | undefined {
    if (typeof window === "undefined") return undefined;
    const hostname = window.location.hostname;
    if (hostname.includes("megabytecircuit.com")) {
        return ".megabytecircuit.com";
    }
    return undefined;
}

/**
 * Helper to get a cookie value by name
 */
export function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const item = parts.pop()?.split(";").shift();
        return item ? decodeURIComponent(item) : null;
    }
    return null;
}

/**
 * Helper to set a cookie valid for specified days
 */
export function setCookie(name: string, value: string, days: number = COOKIE_MAX_AGE_DAYS) {
    if (typeof document === "undefined") return;
    const maxAgeSeconds = days * 24 * 60 * 60;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    const domainPart = getCookieDomain() ? `; domain=${getCookieDomain()}` : "";
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; expires=${expires}; path=/; SameSite=Lax${domainPart}`;
}

/**
 * Canonical cart session ID format for an authenticated user across all devices
 */
export function getUserCartSessionId(userId: string | number): string {
    return `user_cart_${userId}`;
}

/**
 * Explicitly sets or updates the cart session ID in cookie
 */
export function setCartSessionId(sessionId: string) {
    if (!sessionId) return;
    setCookie(COOKIE_NAME, sessionId, COOKIE_MAX_AGE_DAYS);
}

/**
 * Gets existing cart session ID or generates/resolves a deterministic cart ID.
 * When a user is logged in, this ALWAYS resolves to the user's canonical cart ID (user_cart_{userId})
 * across all devices.
 */
export function getOrCreateCartSessionId(): string {
    const authUser = getAuthUser();
    if (authUser && authUser.id) {
        const canonicalId = getUserCartSessionId(authUser.id);
        const currentCookie = getCookie(COOKIE_NAME);
        if (currentCookie !== canonicalId) {
            setCookie(COOKIE_NAME, canonicalId, COOKIE_MAX_AGE_DAYS);
        }
        return canonicalId;
    }

    let sessionId = getCookie(COOKIE_NAME);
    // If guest has a stale user_cart_ cookie after logout, reset to fresh guest session
    if (sessionId && sessionId.startsWith("user_cart_")) {
        sessionId = null;
    }

    if (!sessionId) {
        sessionId = `cart_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        setCookie(COOKIE_NAME, sessionId, COOKIE_MAX_AGE_DAYS);
    } else {
        // Refresh expiration
        setCookie(COOKIE_NAME, sessionId, COOKIE_MAX_AGE_DAYS);
    }
    return sessionId;
}

/**
 * Sanitizes cart items for browser storage by stripping heavy inline SVG or data URL strings
 */
export function sanitizeCartItemsForStorage(items: any[]): any[] {
    if (!Array.isArray(items)) return [];
    return items.map((item) => {
        if (!item || typeof item !== "object") return item;
        const cleaned = { ...item };

        if (typeof cleaned.gerberPreview === "string" && (cleaned.gerberPreview.length > 2000 || cleaned.gerberPreview.includes("<svg"))) {
            delete cleaned.gerberPreview;
        }
        if (typeof cleaned.topSvg === "string" && (cleaned.topSvg.length > 2000 || cleaned.topSvg.includes("<svg"))) {
            delete cleaned.topSvg;
        }
        if (typeof cleaned.bottomSvg === "string" && (cleaned.bottomSvg.length > 2000 || cleaned.bottomSvg.includes("<svg"))) {
            delete cleaned.bottomSvg;
        }
        if (typeof cleaned.previewUrl === "string" && cleaned.previewUrl.startsWith("data:") && cleaned.previewUrl.length > 2000) {
            delete cleaned.previewUrl;
        }
        if (typeof cleaned.gerberDataUrl === "string" && cleaned.gerberDataUrl.startsWith("data:") && cleaned.gerberDataUrl.length > 2000) {
            delete cleaned.gerberDataUrl;
        }

        return cleaned;
    });
}

/**
 * Safely sets items into localStorage / sessionStorage without exceeding storage quota
 */
export function safeSetStorage(key: string, value: any, primaryStorage: "local" | "session" = "local"): boolean {
    if (typeof window === "undefined") return false;
    const sanitized = Array.isArray(value) ? sanitizeCartItemsForStorage(value) : value;
    const serialized = JSON.stringify(sanitized);

    try {
        if (primaryStorage === "local") {
            localStorage.setItem(key, serialized);
            sessionStorage.setItem(key, serialized);
        } else {
            sessionStorage.setItem(key, serialized);
            localStorage.setItem(key, serialized);
        }
        return true;
    } catch (err) {
        console.warn(`Primary storage failed for key ${key}, attempting ultra-stripped fallback:`, err);
        try {
            const ultraStripped = Array.isArray(value)
                ? value.map((item: any) => {
                      if (!item || typeof item !== "object") return item;
                      const { gerberPreview, topSvg, bottomSvg, previewUrl, gerberDataUrl, ...rest } = item;
                      return rest;
                  })
                : value;
            const strippedSerialized = JSON.stringify(ultraStripped);
            sessionStorage.setItem(key, strippedSerialized);
            try {
                localStorage.setItem(key, strippedSerialized);
            } catch (e) {
                // Ignore if localStorage quota is exhausted
            }
            return true;
        } catch (e) {
            console.error(`Storage quota error for key ${key}:`, e);
            return false;
        }
    }
}

/**
 * Attaches the current guest cart to the logged-in user and synchronizes across all devices.
 * Called immediately after successful user authentication.
 */
export async function attachCartOnLogin(
    userId: string | number,
    token?: string,
    guestSessionId?: string | null,
    fallbackItems?: any[]
): Promise<any[]> {
    if (!userId) return [];
    const canonicalSessionId = getUserCartSessionId(userId);
    const currentSessionId = guestSessionId || getCookie(COOKIE_NAME);

    // Read local items if not passed
    let itemsToAttach = fallbackItems;
    if (!itemsToAttach && typeof window !== "undefined") {
        try {
            const raw = localStorage.getItem("megabyte_cart");
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    itemsToAttach = parsed;
                }
            }
        } catch (e) {}
    }

    try {
        const authToken = token || getAuthToken();
        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };
        if (authToken) {
            headers["Authorization"] = `Bearer ${authToken}`;
        }

        const res = await fetch("/api/cart/attach", {
            method: "POST",
            headers,
            body: JSON.stringify({
                guest_session_id: currentSessionId && currentSessionId !== canonicalSessionId ? currentSessionId : undefined,
                user_id: userId,
                items: itemsToAttach || [],
            }),
        });

        const data = await res.json();

        if (data.success && Array.isArray(data.items)) {
            setCartSessionId(data.session_id || canonicalSessionId);
            const finalItems = data.items.length > 0 ? data.items : (itemsToAttach && itemsToAttach.length > 0 ? itemsToAttach : []);
            safeSetStorage("megabyte_cart", finalItems);
            window.dispatchEvent(new Event("megabyte_cart_updated"));
            if (data.items.length === 0 && itemsToAttach && itemsToAttach.length > 0) {
                saveCartToBackend(itemsToAttach).catch(() => {});
            }
            return finalItems;
        }
    } catch (err) {
        console.error("Failed to attach cart on login:", err);
    }

    // Fallback: set the canonical session ID and preserve local items if available
    setCartSessionId(canonicalSessionId);
    if (itemsToAttach && itemsToAttach.length > 0) {
        safeSetStorage("megabyte_cart", itemsToAttach);
        saveCartToBackend(itemsToAttach).catch(() => {});
        return itemsToAttach;
    }
    return await loadCartFromBackend();
}

/**
 * Saves cart items to backend API and updates local storage safely
 */
export async function saveCartToBackend(items: any[]): Promise<boolean> {
    try {
        const sessionId = getOrCreateCartSessionId();
        const token = getAuthToken();
        const authUser = getAuthUser();

        // Save to localStorage safely without raw heavy SVGs
        safeSetStorage("megabyte_cart", items);
        window.dispatchEvent(new Event("megabyte_cart_updated"));

        const headers: HeadersInit = {
            "Content-Type": "application/json",
        };
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        // Save to backend database
        const res = await fetch("/api/cart/save", {
            method: "POST",
            headers,
            body: JSON.stringify({
                session_id: sessionId,
                user_id: authUser?.id || undefined,
                items: items,
            }),
        });

        const data = await res.json();
        return Boolean(data.success);
    } catch (err) {
        console.error("Failed to save cart to backend:", err);
        return false;
    }
}

/**
 * Removes a specific item from cart by ID and updates both localStorage & backend DB
 */
export async function removeCartItemFromBackend(id: string): Promise<any[]> {
    try {
        const savedCart = localStorage.getItem("megabyte_cart");
        const items = savedCart ? JSON.parse(savedCart) : [];
        const updatedItems = items.filter((item: any) => String(item.id) !== String(id));

        await saveCartToBackend(updatedItems);
        return updatedItems;
    } catch (err) {
        console.error("Failed to remove cart item:", err);
        return [];
    }
}

let pendingLoadCartPromise: Promise<any[]> | null = null;

/**
 * Fetches cart items from backend API using cookie session ID (or logged-in user)
 */
export async function loadCartFromBackend(): Promise<any[]> {
    if (pendingLoadCartPromise) {
        return pendingLoadCartPromise;
    }

    pendingLoadCartPromise = (async () => {
        try {
            const sessionId = getOrCreateCartSessionId();
            if (!sessionId) {
                const savedCart = localStorage.getItem("megabyte_cart");
                return savedCart ? JSON.parse(savedCart) : [];
            }

            const token = getAuthToken();
            const headers: HeadersInit = {};
            if (token) {
                headers["Authorization"] = `Bearer ${token}`;
            }

            const res = await fetch(`/api/cart/get?session_id=${encodeURIComponent(sessionId)}`, {
                headers,
            });
            const data = await res.json();

            if (data.success && Array.isArray(data.items)) {
                // If backend confirmed canonical session_id, ensure cookie matches
                if (data.session_id && data.session_id !== sessionId) {
                    setCartSessionId(data.session_id);
                }

                // If backend returned empty items array, check if we had existing items in localStorage
                // that were not yet saved to this session
                const savedCart = localStorage.getItem("megabyte_cart");
                let localItems: any[] = [];
                try {
                    if (savedCart) localItems = JSON.parse(savedCart);
                } catch (e) {}

                if (data.items.length === 0 && Array.isArray(localItems) && localItems.length > 0) {
                    // Sync local items to backend rather than erasing them
                    saveCartToBackend(localItems).catch(() => {});
                    return localItems;
                }

                // Sync backend items to localStorage
                safeSetStorage("megabyte_cart", data.items);
                window.dispatchEvent(new Event("megabyte_cart_updated"));
                return data.items;
            }

            const savedCart = localStorage.getItem("megabyte_cart");
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (err) {
            console.error("Failed to load cart from backend:", err);
            const savedCart = localStorage.getItem("megabyte_cart");
            return savedCart ? JSON.parse(savedCart) : [];
        } finally {
            pendingLoadCartPromise = null;
        }
    })();

    return pendingLoadCartPromise;
}

/**
 * Gets the minimum product quantity configured in .env (default 1)
 */
export function getMinCartQuantity(): number {
    const envVal = process.env.NEXT_PUBLIC_MIN_CART_QUANTITY;
    if (envVal && !isNaN(Number(envVal))) {
        const parsed = Number(envVal);
        if (parsed > 0) return parsed;
    }
    return 1;
}
