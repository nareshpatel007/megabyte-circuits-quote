import { NextRequest } from "next/server";
import { handleApiProxy } from "@/lib/apiProxy";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    return handleApiProxy(req, "/api/auth/me", "GET");
}
