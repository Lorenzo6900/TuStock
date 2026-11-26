import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { setProductAvailable } from "@/lib/db";
import { revalidateMenuForUser } from "@/lib/menuCache";

// Interruptor Disponible / Agotado del dashboard.
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const { available } = await req.json();
  if (typeof available !== "boolean") {
    return NextResponse.json({ error: "Dato inválido." }, { status: 400 });
  }

  const updated = await setProductAvailable(id, session.user.id, available);
  if (!updated) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  await revalidateMenuForUser(session.user.id);
  return NextResponse.json({ available });
}
