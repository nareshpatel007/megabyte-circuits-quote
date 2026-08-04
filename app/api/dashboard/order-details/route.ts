import { NextRequest } from "next/server";
import { handleApiProxy } from "@/lib/apiProxy";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    return handleApiProxy(req, `/api/dashboard/order-details?${searchParams.toString()}`, "GET");
}
