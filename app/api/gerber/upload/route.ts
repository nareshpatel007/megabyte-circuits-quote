import { NextRequest, NextResponse } from "next/server";
import { extractAndAnalyzeGerber } from "../../../../src/lib/gerber";

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

        const buffer = await file.arrayBuffer();

        // Call our tracespace parser orchestration wrapper
        const { files, parsedGerberFiles, info, previewFront, previewBack } = await extractAndAnalyzeGerber(buffer);

        const randomHash = Math.random().toString(36).substring(2, 10);
        const folderPath = `uploads/${randomHash}`;

        // Return exact requested schema keys at the root
        return NextResponse.json({
            success: true,
            folder: folderPath,
            files: files.map(f => ({ name: f.name, type: f.type })),
            parsedGerberFiles,
            info,
            
            // Step 8 & 12: Gerber output values at root
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
        console.error("Gerber Upload API Error:", err);
        return NextResponse.json(
            { 
                success: false, 
                error: err.message || "Failed to process Gerber upload.",
                details: err.stack || ""
            },
            { status: 500 }
        );
    }
}
