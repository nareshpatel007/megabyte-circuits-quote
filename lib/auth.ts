"use client";

const TOKEN_COOKIE_NAME = "megabyte_user_token";
const USER_COOKIE_NAME = "megabyte_user";
const COOKIE_MAX_AGE_DAYS = 30;

export function getCookie(name: string): string | null {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) {
        const item = parts.pop()?.split(';').shift();
        return item ? decodeURIComponent(item) : null;
    }
    return null;
}

export function setCookie(name: string, value: string, days: number = COOKIE_MAX_AGE_DAYS) {
    if (typeof document === "undefined") return;
    const maxAgeSeconds = days * 24 * 60 * 60;
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSeconds}; expires=${expires}; path=/; SameSite=Lax`;
}

export function removeCookie(name: string) {
    if (typeof document === "undefined") return;
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

export function getAuthToken(): string | null {
    return getCookie(TOKEN_COOKIE_NAME) || (typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_COOKIE_NAME) : null);
}

export function getAuthUser(): any | null {
    const userCookie = getCookie(USER_COOKIE_NAME);
    if (userCookie) {
        try {
            return JSON.parse(userCookie);
        } catch (e) {
            // ignore
        }
    }
    if (typeof localStorage !== "undefined") {
        const savedUser = localStorage.getItem(USER_COOKIE_NAME);
        if (savedUser) {
            try {
                return JSON.parse(savedUser);
            } catch (e) {
                // ignore
            }
        }
    }
    return null;
}

export function setAuthSession(token: string, user: any) {
    setCookie(TOKEN_COOKIE_NAME, token);
    setCookie(USER_COOKIE_NAME, JSON.stringify(user));
    if (typeof localStorage !== "undefined") {
        localStorage.setItem(TOKEN_COOKIE_NAME, token);
        localStorage.setItem(USER_COOKIE_NAME, JSON.stringify(user));
    }
}

export function clearAuthSession() {
    removeCookie(TOKEN_COOKIE_NAME);
    removeCookie(USER_COOKIE_NAME);
    if (typeof localStorage !== "undefined") {
        localStorage.removeItem(TOKEN_COOKIE_NAME);
        localStorage.removeItem(USER_COOKIE_NAME);
    }
}
