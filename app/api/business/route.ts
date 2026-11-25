import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isSlugTaken, updateBusinessProfile } from "@/lib/db";
import { slugify } from "@/lib/slug";
import { revalidateMenu } from "@/lib/menuCache";
import { normalizeWhatsapp } from "@/lib/whatsapp";
import { normalizeHex } from "@/lib/brand";
import { DEFAULT_TIMEZONE, isValidTimezone, parseHours } from "@/lib/hours";
import { optionalText } from "@/lib/format";

function badRequest(error: string) {
  return NextResponse.json({ error }, { status: 400 });
}

// Acepta "@usuario", "usuario" o el link del perfil; guarda solo el usuario.
function normalizeInstagram(raw: string): string | null {
  const handle = raw
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/[/?#].*$/, "");
  return /^[a-zA-Z0-9._]{1,30}$/.test(handle) ? handle : null;
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const body = await req.json();
  const name = typeof body.businessName === "string" ? body.businessName.trim() : "";
  const slug = typeof body.slug === "string" ? slugify(body.slug) : "";

  if (!name) return badRequest("El nombre del negocio es obligatorio.");
  if (slug.length < 3 || slug.length > 50) {
    return badRequest("El link tiene que tener entre 3 y 50 caracteres (letras, números y guiones).");
  }

  // Los demás campos son opcionales: vacío los saca del menú, pero si se escribe
  // algo tiene que ser válido.
  const whatsappInput = typeof body.whatsapp === "string" ? body.whatsapp.trim() : "";
  const whatsapp = whatsappInput ? normalizeWhatsapp(whatsappInput) : null;
  if (whatsappInput && !whatsapp) {
    return badRequest(
      "El número de WhatsApp no parece válido. Probá con el código de área, ej: 11 2345 6789."
    );
  }

  const instagramInput = typeof body.instagram === "string" ? body.instagram.trim() : "";
  const instagram = instagramInput ? normalizeInstagram(instagramInput) : null;
  if (instagramInput && !instagram) {
    return badRequest("El usuario de Instagram no parece válido. Escribilo como @tunegocio.");
  }

  const brandColor = body.brandColor ? normalizeHex(body.brandColor) : null;
  if (body.brandColor && !brandColor) return badRequest("El color no es válido.");

  const parsedHours = parseHours(body.hours);
  if ("error" in parsedHours) return badRequest(parsedHours.error);
  const timezone = isValidTimezone(body.timezone) ? body.timezone : DEFAULT_TIMEZONE;

  if (await isSlugTaken(slug, session.user.id)) {
    return NextResponse.json({ error: "Ese link ya lo usa otro negocio." }, { status: 409 });
  }

  try {
    const { user, oldSlug } = await updateBusinessProfile(session.user.id, {
      businessName: name,
      slug,
      whatsapp,
      brandColor,
      address: optionalText(body.address, 200),
      instagram,
      hours: parsedHours.hours,
      timezone: parsedHours.hours ? timezone : null,
    });
    // El viejo pasa a ser redirección y el nuevo puede tener un 404 cacheado.
    revalidateMenu(oldSlug, user.slug);
    return NextResponse.json({
      businessName: user.business_name,
      slug: user.slug,
      whatsapp: user.whatsapp,
      brandColor: user.brand_color,
      address: user.address,
      instagram: user.instagram,
      hours: user.hours,
    });
  } catch (err) {
    // Otro negocio tomó el mismo slug justo entre el chequeo y el update.
    if ((err as { code?: string }).code === "23505") {
      return NextResponse.json({ error: "Ese link ya lo usa otro negocio." }, { status: 409 });
    }
    console.error(err);
    return NextResponse.json({ error: "Error guardando los cambios." }, { status: 500 });
  }
}
