import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { extractAndAnalyzeGerber } from "../../../lib/gerber/extract";

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

        // 2. Fetch the uploaded Gerber ZIP from ImageKit to extract
        const zipRes = await fetch(zipUrl);
        if (!zipRes.ok) {
            throw new Error("Failed to download ZIP file back from ImageKit.");
        }
        const buffer = await zipRes.arrayBuffer();

        // Extract and Analyze Gerber
        const { files, parsedGerberFiles, tracespaceFiles, info, previewFront, previewBack } = await extractAndAnalyzeGerber(buffer);

        return NextResponse.json({
            success: true,
            folder: uploadData.filePath || `uploads/${uploadData.fileId}`,
            imageUrl: zipUrl, // Return the ImageKit URL to the client
            files: files.map(f => ({ name: f.name, type: f.type })),
            parsedGerberFiles,
            tracespaceFiles,
            info,
            width_mm: info.width,
            height_mm: info.height,
            boardShape: info.boardShape,
            layerCount: info.layers,
            drillCount: info.drillCount,
            topCopper: !!files.find(f => f.type === "copper_top"),
            bottomCopper: !!files.find(f => f.type === "copper_bottom"),
            topMask: !!files.find(f => f.type === "solder_mask_top"),
            bottomMask: !!files.find(f => f.type === "solder_mask_bottom"),
            topSilk: !!files.find(f => f.type === "silkscreen_top"),
            bottomSilk: !!files.find(f => f.type === "silkscreen_bottom"),
            outline: info.outlineFileDetected,
            warnings: info.warnings,
            previewFront,
            previewBack
        });

    } catch (err: any) {
        console.error("Upload API Error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to process Gerber upload." },
            { status: 500 }
        );
    }
}
