import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { insertProduct, listProducts } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  try {
    const products = await listProducts(session.user.id);
    return NextResponse.json({ products });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error leyendo el catálogo." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  try {
    const { name, image, mimeType, price, category } = await req.json();

    if (!name || !image || !mimeType) {
      return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
    }

    let parsedPrice: number | null = null;
    if (price !== undefined && price !== null && price !== "") {
      parsedPrice = Number(price);
      if (!Number.isFinite(parsedPrice) || parsedPrice < 0) {
        return NextResponse.json({ error: "Precio inválido." }, { status: 400 });
      }
    }

    const product = await insertProduct(
      session.user.id,
      name,
      Buffer.from(image, "base64"),
      mimeType,
      parsedPrice,
      category && typeof category === "string" && category.trim() ? category.trim() : null
    );
    return NextResponse.json({ product });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error guardando el producto." }, { status: 500 });
  }
}
