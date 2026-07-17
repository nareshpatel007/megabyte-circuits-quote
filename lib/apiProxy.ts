import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "";
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || "";

export async function handleApiProxy(
    req: NextRequest,
    endpoint: string,
    method: string = "POST"
) {
    try {
        // Validate origin
        const origin = req.headers.get("origin");
        const referer = req.headers.get("referer");

        // Remove this when we have a proper authentication system
        const isValidOrigin = origin === ALLOWED_ORIGIN || (referer && referer.startsWith(ALLOWED_ORIGIN));

        if (!isValidOrigin) {
            return NextResponse.json(
                { success: false, message: "Unauthorized token" },
                { status: 403 }
            );
        }

        const clientAuth = req.headers.get("Authorization");
        const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";

        const headers: HeadersInit = {
            "Requested-Domain": ALLOWED_ORIGIN,
            "X-Api-Token": API_TOKEN,
            "Authorization": clientAuth || `Bearer ${API_TOKEN}`
        };

        if (clientIp) {
            (headers as Record<string, string>)["X-Forwarded-For"] = clientIp;
        }

        const fetchOptions: RequestInit = {
            method,
            headers,
        };

        // Don't pass a body for GET or HEAD requests
        if (method !== "GET" && method !== "HEAD") {
            const contentType = req.headers.get("content-type");
            
            if (contentType && contentType.includes("multipart/form-data")) {
                // Handle FormData (file uploads)
                const formData = await req.formData();
                fetchOptions.body = formData;
                // Remove Content-Type to let browser set it with boundary
                const headersObj = headers as Record<string, string>;
                delete headersObj["Content-Type"];
                fetchOptions.headers = headersObj;
            } else {
                // Handle JSON
                const body = await req.json().catch(() => null);
                if (body) {
                    fetchOptions.body = JSON.stringify(body);
                    const headersObj = headers as Record<string, string>;
                    headersObj["Content-Type"] = "application/json";
                    fetchOptions.headers = headersObj;
                }
            }
        }

        // Call backend API
        const apiRes = await fetch(`${process.env.API_URL}${endpoint}`, fetchOptions);

        const text = await apiRes.text();

        return new NextResponse(text, {
            status: apiRes.status,
            headers: {
                "Content-Type":
                    apiRes.headers.get("content-type") || "application/json",
            },
        });
    } catch (error) {
        return NextResponse.json(
            { success: false, message: "Internal Server Error" },
            { status: 500 }
        );
    }
}