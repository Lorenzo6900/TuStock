import { NextRequest, NextResponse } from "next/server";
import { getProductImage } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const result = await getProductImage(id);

  if (!result) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(result.image), {
    headers: {
      "Content-Type": result.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
