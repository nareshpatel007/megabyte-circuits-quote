import { NextRequest } from "next/server";
import { handleApiProxy } from "@/lib/apiProxy";

export async function POST(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();
    const endpoint = query ? `/api/dashboard/profile-picture?${query}` : `/api/dashboard/profile-picture`;
    return handleApiProxy(req, endpoint, "POST");
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.toString();
    const endpoint = query ? `/api/dashboard/profile-picture?${query}` : `/api/dashboard/profile-picture`;
    return handleApiProxy(req, endpoint, "DELETE");
}
