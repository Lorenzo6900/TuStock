import { NextRequest, NextResponse } from "next/server";
import { getBusinessLogo } from "@/lib/db";

const UUID = /^[0-9a-f-]{36}$/i;

// Logo público del negocio. La URL lleva ?v=<versión> (ver businessLogoUrl), así
// que se puede cachear para siempre: un logo nuevo es una URL nueva.
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;
  const logo = UUID.test(userId) ? await getBusinessLogo(userId) : null;

  if (!logo) {
    return NextResponse.json({ error: "No encontrado." }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(logo.image), {
    headers: {
      "Content-Type": logo.mimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
