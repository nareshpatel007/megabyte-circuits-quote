import { NextRequest, NextResponse } from "next/server";
import { handleApiProxy } from "@/lib/apiProxy";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        if (!body.gerber_file_id || !body.preview_data) {
            return NextResponse.json(
                { success: false, error: "Missing gerber_file_id or preview_data" },
                { status: 400 }
            );
        }
        return handleApiProxy(req, "/api/upload/preview", "POST", JSON.stringify(body));
    } catch (err: any) {
        console.error("Upload Preview API Error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to update Gerber preview." },
            { status: 500 }
        );
    }
}
