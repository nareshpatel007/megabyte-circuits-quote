import { NextRequest } from "next/server";
import { handleApiProxy } from "@/lib/apiProxy";

export async function GET(req: NextRequest) {
    return handleApiProxy(req, "/api/pcb-pricing", "GET");
}
