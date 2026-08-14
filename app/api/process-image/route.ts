import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

const MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const PROMPT = `Sos un asistente que arma el catálogo de una tienda a partir de fotos de productos.
Mirá la foto y respondé ÚNICAMENTE con un nombre corto y descriptivo en español para el producto principal de la imagen (ej: "Taza de café"). No agregues nada más, ni explicaciones, ni comillas.`;

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

    const res = await fetch(`${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: PROMPT },
              { inline_data: { mime_type: mimeType, data: image } },
            ],
          },
        ],
      }),
    });

    const json = await res.json();

    if (!res.ok) {
      console.error(json);
      return NextResponse.json(
        { error: json.error?.message ?? "Error llamando a Gemini." },
        { status: 502 }
      );
    }

    const name: string =
      json.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ??
      "Producto sin identificar";

    // Por ahora no se procesa el fondo: se guarda la misma imagen que se subió.
    return NextResponse.json({ name, image, mimeType });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error procesando la imagen." }, { status: 500 });
  }
}
