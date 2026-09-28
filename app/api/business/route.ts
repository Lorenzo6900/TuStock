import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSlugTaken, updateBusinessProfile } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { revalidateMenu } from "@/lib/menuCache";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { businessName, slug: rawSlug } = await req.json();
  const name = typeof businessName === "string" ? businessName.trim() : "";
  const slug = typeof rawSlug === "string" ? slugify(rawSlug) : "";

  if (!name) {
    return NextResponse.json({ error: "El nombre del negocio es obligatorio." }, { status: 400 });
  }
  if (slug.length < 3 || slug.length > 50) {
    return NextResponse.json(
      { error: "El link tiene que tener entre 3 y 50 caracteres (letras, números y guiones)." },
      { status: 400 }
    );
  }
  if (await isSlugTaken(slug, session.user.id)) {
    return NextResponse.json({ error: "Ese link ya lo usa otro negocio." }, { status: 409 });
  }

  try {
    const { user, oldSlug } = await updateBusinessProfile(session.user.id, name, slug);
    // El viejo pasa a ser redirección y el nuevo puede tener un 404 cacheado.
    revalidateMenu(oldSlug, user.slug);
    return NextResponse.json({ businessName: user.business_name, slug: user.slug });
  } catch (err) {
    // Otro negocio tomó el mismo slug justo entre el chequeo y el update.
    if ((err as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Ese link ya lo usa otro negocio." }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Error guardando los cambios." }, { status: 500 });
  }
}
