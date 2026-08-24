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
 * Saves cart items to backend API and updates local storage
 */
export async function saveCartToBackend(items: any[]): Promise<boolean> {
    try {
        const sessionId = getOrCreateCartSessionId();
        
        // Save to localStorage immediately
        localStorage.setItem("megabyte_cart", JSON.stringify(items));
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

/**
 * Fetches cart items from backend API using cookie session ID
 */
export async function loadCartFromBackend(): Promise<any[]> {
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
    }
}


/**
 * Gets the minimum product quantity configured in .env (default 5000)
 */
export function getMinCartQuantity(): number {
    const envVal = process.env.NEXT_PUBLIC_MIN_CART_QUANTITY;
    if (envVal && !isNaN(Number(envVal))) {
        const parsed = Number(envVal);
        if (parsed > 0) return parsed;
    }
    return 5000;
}

