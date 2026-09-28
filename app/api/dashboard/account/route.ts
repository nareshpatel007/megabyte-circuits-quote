import { NextRequest } from "next/server";
import { handleApiProxy } from "@/lib/apiProxy";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    return handleApiProxy(req, `/api/dashboard/account?${searchParams.toString()}`, "GET");
}

export async function POST(req: NextRequest) {
    return handleApiProxy(req, "/api/dashboard/account", "POST");
}

export async function PUT(req: NextRequest) {
    return handleApiProxy(req, "/api/dashboard/account", "PUT");
}
