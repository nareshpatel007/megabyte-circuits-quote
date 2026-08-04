import { NextRequest } from "next/server";
import { handleApiProxy } from "@/lib/apiProxy";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id") || "";
    return handleApiProxy(req, `/api/cart/get?session_id=${encodeURIComponent(sessionId)}`, "GET");
}
