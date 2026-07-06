import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { extractAndAnalyzeGerber } from "../../../lib/gerber/extract";

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

        // Read ArrayBuffer
        const buffer = await file.arrayBuffer();

        // Extract and Analyze Gerber
        const { files, parsedGerberFiles, info } = await extractAndAnalyzeGerber(buffer);

        // Generate a random temporary folder name to satisfy the spec
        const randomHash = Math.random().toString(36).substring(2, 10);
        const folderPath = `uploads/${randomHash}`;

        return NextResponse.json({
            success: true,
            folder: folderPath,
            files: files.map(f => ({ name: f.name, type: f.type })),
            parsedGerberFiles,
            info
        });

    } catch (err: any) {
        console.error("Upload API Error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to process Gerber upload." },
            { status: 500 }
        );
    }
}
