import { NextRequest } from "next/server";
import { handleApiProxy } from "@/lib/apiProxy";

export async function GET(
    req: NextRequest,
    context: { params: Promise<{ partNumber: string }> }
) {
    const { partNumber } = await context.params;
    return handleApiProxy(req, `/api/digikey/products/${encodeURIComponent(partNumber)}`, "GET");
}
