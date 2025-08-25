import { NextRequest, NextResponse } from "next/server";
import { getUserId } from "../../_utils/authUtils";

export async function GET(request: NextRequest) {
  try {
    // Säkerhetskontroll - endast inloggade användare
    const userId = await getUserId();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Hämta blob URL från query parameter
    const { searchParams } = new URL(request.url);
    const blobUrl = searchParams.get("url");

    if (!blobUrl) {
      return new NextResponse("Missing blob URL", { status: 400 });
    }

    // Validera att URL:en är från Vercel Blob Storage
    if (!blobUrl.includes("public.blob.vercel-storage.com")) {
      return new NextResponse("Invalid blob URL", { status: 400 });
    }

    // Hämta PDF:en från Vercel Blob Storage
    const response = await fetch(blobUrl);

    if (!response.ok) {
      console.error("Failed to fetch blob:", response.status, response.statusText);
      return new NextResponse("Failed to fetch PDF", { status: response.status });
    }

    // Få PDF-datan
    const pdfBuffer = await response.arrayBuffer();

    // Returnera PDF:en med rätt headers
    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline",
        "Cache-Control": "public, max-age=3600", // Cache i 1 timme
      },
    });
  } catch (error) {
    console.error("PDF proxy error:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
