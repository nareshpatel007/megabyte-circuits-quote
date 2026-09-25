import { getAuthToken } from "./auth";

type AuthErrorListener = (errorInfo: { code: string; message: string; status: number }) => void;

const listeners: Set<AuthErrorListener> = new Set();

export function onAuthError(listener: AuthErrorListener) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function notifyAuthError(code: string, message: string, status: number = 403) {
    listeners.forEach((listener) => listener({ code, message, status }));
}

/**
 * Centralized fetch client for authenticated & public API calls.
 * Automatically attaches client Bearer token and checks for account status / auth failures.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const token = getAuthToken();
    const headers = new Headers(init?.headers || {});

    if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    if (!headers.has("Accept")) {
        headers.set("Accept", "application/json");
    }

    const modifiedInit: RequestInit = {
        ...init,
        headers,
    };

    const res = await fetch(input, modifiedInit);

    // Check for HTTP 401 or 403 authorization/account status errors
    if (res.status === 401 || res.status === 403) {
        try {
            const clone = res.clone();
            const data = await clone.json();

            const code = data.code || (res.status === 401 ? "TOKEN_EXPIRED" : "ACCOUNT_SUSPENDED");
            const message = data.message || (res.status === 401 ? "Session expired." : "Access restricted.");

            if (
                code.startsWith("ACCOUNT_") ||
                code.startsWith("TOKEN_") ||
                code === "AUTH_REQUIRED"
            ) {
                notifyAuthError(code, message, res.status);
            }
        } catch (e) {
            // Non-JSON 401/403 response
            notifyAuthError("AUTH_REQUIRED", "Authentication failed", res.status);
        }
    }

    return res;
}
