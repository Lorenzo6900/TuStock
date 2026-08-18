import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSlugTaken, setUserBusinessInfo } from "@/lib/db";
import { slugify } from "@/lib/slug";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { businessName, businessType, categories } = await req.json();
  if (!businessName || !businessType) {
    return NextResponse.json(
      { error: "Falta el nombre o el tipo de negocio." },
      { status: 400 }
    );
  }

  const baseSlug = slugify(businessName) || "negocio";
  let slug = baseSlug;
  let suffix = 1;
  while (await isSlugTaken(slug)) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  const user = await setUserBusinessInfo(
    session.user.id,
    businessName,
    slug,
    businessType,
    Array.isArray(categories) ? categories : []
  );
  return NextResponse.json({ slug: user.slug });
}
