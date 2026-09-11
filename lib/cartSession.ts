"use client";

const COOKIE_NAME = "megabyte_cart_session_id";
const COOKIE_MAX_AGE_DAYS = 30;

/**
 * Helper to get a cookie value by name
 */
export function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
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
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; expires=${expires}; path=/; SameSite=Lax`;
}

/**
 * Explicitly sets or updates the cart session ID in cookie
 */
export function setCartSessionId(sessionId: string) {
    if (!sessionId) return;
    setCookie(COOKIE_NAME, sessionId, COOKIE_MAX_AGE_DAYS);
}

/**
 * Gets existing cart session ID or generates a new unique 30-day session ID
 */
export function getOrCreateCartSessionId(): string {
    let sessionId = getCookie(COOKIE_NAME);
    if (!sessionId) {
        sessionId = `cart_sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        setCookie(COOKIE_NAME, sessionId, COOKIE_MAX_AGE_DAYS);
    } else {
        // Refresh expiration to 30 days
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
 * Saves cart items to backend API and updates local storage safely
 */
export async function saveCartToBackend(items: any[]): Promise<boolean> {
    try {
        const sessionId = getOrCreateCartSessionId();
        
        // Save to localStorage safely without raw heavy SVGs
        safeSetStorage("megabyte_cart", items);
        window.dispatchEvent(new Event("megabyte_cart_updated"));

        // Save to backend database
        const res = await fetch("/api/cart/save", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                session_id: sessionId,
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
 * Fetches cart items from backend API using cookie session ID
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

            const res = await fetch(`/api/cart/get?session_id=${encodeURIComponent(sessionId)}`);
            const data = await res.json();

            if (data.success && Array.isArray(data.items)) {
                // Always sync backend items to localStorage (even if empty array)
                localStorage.setItem("megabyte_cart", JSON.stringify(data.items));
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

