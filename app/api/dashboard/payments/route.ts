import { NextRequest } from "next/server";
import { handleApiProxy } from "@/lib/apiProxy";

export async function GET(req: NextRequest) {
    const userId = req.nextUrl.searchParams.get("user_id") || "";
    return handleApiProxy(req, `/api/dashboard/payments?user_id=${userId}`, "GET");
}
