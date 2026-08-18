import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { deleteProduct, updateProduct } from "@/lib/db";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const { name, price, category } = await req.json();

  if (!name || !String(name).trim()) {
    return NextResponse.json({ error: "El nombre es obligatorio." }, { status: 400 });
  }

  let parsedPrice: number | null = null;
  if (price !== undefined && price !== null && price !== "") {
    parsedPrice = Number(price);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
      return NextResponse.json({ error: "Precio inválido." }, { status: 400 });
    }
  }

  const product = await updateProduct(
    id,
    session.user.id,
    String(name).trim(),
    parsedPrice,
    category && typeof category === "string" && category.trim() ? category.trim() : null
  );

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ product });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { id } = await params;
  const deleted = await deleteProduct(id, session.user.id);

  if (!deleted) {
    return NextResponse.json({ error: "Producto no encontrado." }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
