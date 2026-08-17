import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const NAME_MODEL = "gemini-2.5-flash";
const IMAGE_MODEL = "gemini-2.5-flash-image";
const NAME_URL = `https://generativelanguage.googleapis.com/v1beta/models/${NAME_MODEL}:generateContent`;
const IMAGE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent`;

const NAME_PROMPT = `Sos un asistente que arma el catálogo de una tienda a partir de fotos de productos.
Mirá la foto y respondé ÚNICAMENTE con un nombre corto y descriptivo en español para el producto principal de la imagen (ej: "Taza de café"). No agregues nada más, ni explicaciones, ni comillas.`;

const BACKGROUND_PROMPT = `Edit this photo of a product for an e-commerce catalog: remove everything in the background and replace it with a solid, plain, pure white background. Keep the main product exactly as it is — same shape, size, position, colors, lighting and details — with no other edits, no added shadows or reflections. Output only the edited image.`;

async function removeBackground(image: string, mimeType: string) {
  try {
    const res = await fetch(`${IMAGE_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: BACKGROUND_PROMPT },
              { inline_data: { mime_type: mimeType, data: image } },
            ],
          },
        ],
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      console.error("removeBackground:", json);
      return null;
    }

    const part = json.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { data?: string; mimeType?: string } }) => p.inlineData?.data
    );
    if (!part?.inlineData?.data) return null;

    return { image: part.inlineData.data as string, mimeType: part.inlineData.mimeType as string };
  } catch (err) {
    console.error("removeBackground:", err);
    return null;
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  try {
    const { image, mimeType } = await req.json();

    if (!image || !mimeType) {
      return NextResponse.json({ error: "Falta la imagen." }, { status: 400 });
    }

    const [nameRes, background] = await Promise.all([
      fetch(`${NAME_URL}?key=${process.env.GEMINI_API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: NAME_PROMPT },
                { inline_data: { mime_type: mimeType, data: image } },
              ],
            },
          ],
        }),
      }),
      removeBackground(image, mimeType),
    ]);

    const nameJson = await nameRes.json();

    if (!nameRes.ok) {
      console.error(nameJson);
      return NextResponse.json(
        { error: nameJson.error?.message ?? "Error llamando a Gemini." },
        { status: 502 }
      );
    }

    const name: string =
      nameJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      "Producto sin identificar";

    // Si falla quitar el fondo, se guarda la foto original tal cual para no bloquear el flujo.
    return NextResponse.json({
      name,
      image: background?.image ?? image,
      mimeType: background?.mimeType ?? mimeType,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error procesando la imagen." }, { status: 500 });
  }
}
