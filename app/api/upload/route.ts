import { NextRequest, NextResponse } from "next/server";
import { handleApiProxy } from "@/lib/apiProxy";

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

        // Upload to Laravel storage via API proxy
        const uploadFormData = new FormData();
        uploadFormData.append("file", file);
        uploadFormData.append("fileName", file.name);
        uploadFormData.append("folder", "gerber-files");

        const response = await fetch(`${process.env.API_URL || process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
            method: "POST",
            body: uploadFormData,
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Upload failed");
        }

        return NextResponse.json({
            success: true,
            folder: data.folder || "gerber-files",
            imageUrl: data.url
        });

    } catch (err: any) {
        console.error("Upload API Error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to process Gerber upload." },
            { status: 500 }
        );
    }
}
