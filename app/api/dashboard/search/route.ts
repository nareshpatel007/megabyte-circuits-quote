import { NextRequest } from "next/server";
import { handleApiProxy } from "@/lib/apiProxy";

export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get("user_id") || "";
    const q = req.nextUrl.searchParams.get("q") || req.nextUrl.searchParams.get("search") || "";
    return handleApiProxy(req, `/api/dashboard/search?user_id=${encodeURIComponent(userId)}&q=${encodeURIComponent(q)}`, "GET");
}
