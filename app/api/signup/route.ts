import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { createUserWithPassword, getUserByEmail, isSlugTaken } from "@/lib/db";
import { slugify } from "@/lib/slug";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, businessName } = await req.json();

    if (!name || !email || !password || !businessName) {
      return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña tiene que tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "Ya existe una cuenta con ese email." },
        { status: 409 }
      );
    }

    const baseSlug = slugify(businessName) || "negocio";
    let slug = baseSlug;
    let suffix = 1;
    while (await isSlugTaken(slug)) {
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await createUserWithPassword(
      name,
      email,
      passwordHash,
      businessName,
      slug
    );

    return NextResponse.json({ user: { id: user.id, email: user.email, slug: user.slug } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error creando la cuenta." }, { status: 500 });
  }
}
