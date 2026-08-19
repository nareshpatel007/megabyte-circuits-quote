import { NextRequest, NextResponse } from "next/server";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path } = await params;
        const filePath = path.join("/");

        let backendUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost/megabyte-circuits-api/public";
        if (backendUrl.endsWith("/")) {
            backendUrl = backendUrl.slice(0, -1);
        }

        const targetUrl = `${backendUrl}/storage/${filePath}`;
        const res = await fetch(targetUrl);

        if (!res.ok) {
            console.error(`Storage proxy fetch failed for ${targetUrl} with status: ${res.status}`);
            return new NextResponse(`File Not Found (${res.status})`, { status: res.status });
        }

        const arrayBuffer = await res.arrayBuffer();
        const headers = new Headers();
        
        const contentType = res.headers.get("content-type") || "application/octet-stream";
        headers.set("Content-Type", contentType);

        const fileName = path[path.length - 1] || "gerber_archive.zip";
        headers.set("Content-Disposition", `attachment; filename="${fileName}"`);

        return new NextResponse(arrayBuffer, {
            status: 200,
            headers
        });
    } catch (error) {
        console.error("Storage file proxy error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
