import { NextRequest, NextResponse } from "next/server";
import { handleApiProxy } from "@/lib/apiProxy";

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        if (!body.gerber_file_id && !body.id) {
            return NextResponse.json(
                { success: false, error: "Missing gerber_file_id" },
                { status: 400 }
            );
        }
        return handleApiProxy(req, "/api/upload/delete", "POST", body);
    } catch (err: any) {
        console.error("Upload Delete API Error:", err);
        return NextResponse.json(
            { success: false, error: err.message || "Failed to delete Gerber file." },
            { status: 500 }
        );
    }
}
