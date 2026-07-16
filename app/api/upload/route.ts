import { NextRequest, NextResponse } from "next/server";

const IMAGEKIT_PRIVATE_KEY = "private_QfLkdkXBHX5OPw3VBNH8Zg64Mek=";

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

        // 1. Upload Gerber ZIP to ImageKit
        const imageKitForm = new FormData();
        imageKitForm.append("file", file);
        imageKitForm.append("fileName", file.name);
        imageKitForm.append("folder", "megabytes");

        const authHeader = "Basic " + Buffer.from(IMAGEKIT_PRIVATE_KEY + ":").toString("base64");
        const uploadRes = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
            method: "POST",
            headers: {
                "Authorization": authHeader
            },
            body: imageKitForm
        });

        if (!uploadRes.ok) {
            const errBody = await uploadRes.text();
            throw new Error(`ImageKit upload failed: ${errBody}`);
        }

        const uploadData = await uploadRes.json();
        const zipUrl = uploadData.url;

        return NextResponse.json({
            success: true,
            folder: uploadData.filePath || `uploads/${uploadData.fileId}`,
            imageUrl: zipUrl
        });

    } catch (err: any) {
        console.error("Upload API Error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to process Gerber upload." },
            { status: 500 }
        );
    }
}
