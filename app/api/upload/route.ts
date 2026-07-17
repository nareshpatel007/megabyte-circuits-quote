import { NextRequest, NextResponse } from "next/server";

const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_SITE_URL || "";
const API_TOKEN = process.env.NEXT_PUBLIC_API_TOKEN || "";

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
            return NextResponse.json(
                { success: false, error: "No file provided." },
                { status: 400 }
            );
        }

        // Validate File Size (100 MB max)
        const maxSize = 100 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { success: false, error: "File size exceeds 100 MB limit." },
                { status: 400 }
            );
        }

        // Validate Extension
        const extension = file.name.split(".").pop()?.toLowerCase();
        if (extension !== "zip") {
            return NextResponse.json(
                { success: false, error: "Only ZIP archives are supported." },
                { status: 400 }
            );
        }

        // Prepare headers with authentication
        const headers: HeadersInit = {
            "Requested-Domain": ALLOWED_ORIGIN,
            "X-Api-Token": API_TOKEN,
            "Authorization": `Bearer ${API_TOKEN}`
        };

        // Upload to Laravel storage
        const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";
        const response = await fetch(`${apiUrl}/api/upload`, {
            method: 'POST',
            headers,
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || data.message || "Upload failed");
        }

        return NextResponse.json({
            success: true,
            folder: data.folder || "gerber-files",
            imageUrl: data.url,
            fileName: data.fileName,
            originalName: data.originalName
        });

    } catch (err: any) {
        console.error("Upload API Error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to process Gerber upload." },
            { status: 500 }
        );
    }
}
