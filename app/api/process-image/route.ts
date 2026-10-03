import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserById } from "@/lib/db";

const NAME_MODEL = "gemini-3.6-flash";
const IMAGE_MODEL = "gemini-2.5-flash-image";
const NAME_URL = `https://generativelanguage.googleapis.com/v1beta/models/${NAME_MODEL}:generateContent`;
const IMAGE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGE_MODEL}:generateContent`;
// La key va por header (no en la URL) así no queda en logs, y funciona con los dos
// formatos de key de Google AI Studio (los viejos "AIza…" y los nuevos "AQ.…").
const GEMINI_HEADERS = {
  "Content-Type": "application/json",
  "x-goog-api-key": process.env.GEMINI_API_KEY ?? "",
};

// Gemini no acepta strings vacíos en un `enum`, así que "ninguna categoría" se
// pide con este valor y después se convierte en "".
const NO_CATEGORY = "__ninguna__";

function describePrompt(categories: string[]) {
  const categoryRule = categories.length
    ? `- "category": la categoría del catálogo que mejor le corresponde, elegida EXACTAMENTE de esta lista: ${categories
        .map((c) => `"${c}"`)
        .join(", ")}. Si ninguna encaja, usá "${NO_CATEGORY}".`
    : `- "category": dejala vacía ("").`;

  return `Sos un asistente que arma el catálogo de una tienda a partir de fotos de productos.
Mirá la foto y describí el producto principal, en español rioplatense neutro:
- "name": nombre corto y descriptivo (ej: "Taza de café"), sin comillas ni marcas inventadas.
- "description": una frase corta y atractiva para el cliente, de hasta 90 caracteres, sin precio ni emojis. Mencioná solo lo que se ve en la foto (material, color, tamaño aparente, sabor si está en el envase).
${categoryRule}`;
}

// Garantiza que Gemini devuelva JSON con esta forma; con `enum`, la categoría
// solo puede ser una de las del negocio.
function describeSchema(categories: string[]) {
  return {
    type: "OBJECT",
    properties: {
      name: { type: "STRING" },
      description: { type: "STRING" },
      category: categories.length
        ? { type: "STRING", enum: [...categories, NO_CATEGORY] }
        : { type: "STRING" },
    },
    required: ["name", "description", "category"],
  };
}

type Suggestion = { name: string; description: string; category: string };

function parseSuggestion(text: string | undefined, categories: string[]): Suggestion {
  let raw: Partial<Suggestion> = {};
  try {
    raw = JSON.parse(text ?? "{}");
  } catch {
    // Si no vino JSON válido, se usa el texto crudo como nombre.
    raw = { name: text };
  }
  const name = raw.name?.trim() || "Producto sin identificar";
  const description = raw.description?.trim().slice(0, 200) ?? "";
  const category = categories.includes(raw.category ?? "") ? raw.category! : "";
  return { name, description, category };
}

const BACKGROUND_PROMPT = `Edit this photo of a product for an e-commerce catalog: remove everything in the background and replace it with a solid, plain, pure white background. Keep the main product exactly as it is — same shape, size, position, colors, lighting and details — with no other edits, no added shadows or reflections. Output only the edited image.`;

async function removeBackground(image: string, mimeType: string) {
  try {
    const res = await fetch(IMAGE_URL, {
      method: "POST",
      headers: GEMINI_HEADERS,
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

    const user = await getUserById(session.user.id);
    // Sin vacías ni repetidas: Gemini rechaza el schema si el `enum` las tiene.
    const categories = [
      ...new Set((user?.categories ?? []).map((c) => c.trim()).filter(Boolean)),
    ];

    const [nameRes, background] = await Promise.all([
      fetch(NAME_URL, {
        method: "POST",
        headers: GEMINI_HEADERS,
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: describePrompt(categories) },
                { inline_data: { mime_type: mimeType, data: image } },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: describeSchema(categories),
          },
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

    const suggestion = parseSuggestion(
      nameJson.candidates?.[0]?.content?.parts?.[0]?.text,
      categories
    );

    // Si falla quitar el fondo, se guarda la foto original tal cual para no bloquear el flujo.
    return NextResponse.json({
      ...suggestion,
      image: background?.image ?? image,
      mimeType: background?.mimeType ?? mimeType,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error procesando la imagen." }, { status: 500 });
  }
}
