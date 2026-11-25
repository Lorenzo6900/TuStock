import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { businessLogoUrl, deleteBusinessLogo, setBusinessLogo } from "@/lib/db";
import { revalidateMenuForUser } from "@/lib/menuCache";

// El navegador lo achica a 400px antes de subirlo; esto es solo un tope de seguridad.
const MAX_BYTES = 500 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { image, mimeType } = await req.json();
  if (typeof image !== "string" || !ALLOWED_TYPES.includes(mimeType)) {
    return NextResponse.json({ error: "Formato de imagen no soportado." }, { status: 400 });
  }
  const bytes = Buffer.from(image, "base64");
  if (bytes.length === 0 || bytes.length > MAX_BYTES) {
    return NextResponse.json({ error: "La imagen es demasiado grande." }, { status: 400 });
  }

  try {
    const updatedAt = await setBusinessLogo(session.user.id, bytes, mimeType);
    await revalidateMenuForUser(session.user.id);
    return NextResponse.json({
      logoUrl: businessLogoUrl({ id: session.user.id, logo_updated_at: updatedAt }),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error guardando el logo." }, { status: 500 });
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }
  try {
    await deleteBusinessLogo(session.user.id);
    await revalidateMenuForUser(session.user.id);
    return NextResponse.json({ logoUrl: null });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error borrando el logo." }, { status: 500 });
  }
}
