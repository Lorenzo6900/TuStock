import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { bulkUpdatePrices } from "@/lib/db";
import { PRICE_ROUNDING_STEPS, optionalText } from "@/lib/format";
import { revalidateMenuForUser } from "@/lib/menuCache";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const { percent, step, category } = await req.json();
  const parsedPercent = Number(percent);
  const parsedStep = Number(step);

  if (!Number.isFinite(parsedPercent) || parsedPercent === 0 || parsedPercent < -90 || parsedPercent > 500) {
    return NextResponse.json(
      { error: "El porcentaje tiene que estar entre -90% y 500%, y no puede ser 0." },
      { status: 400 }
    );
  }
  if (!PRICE_ROUNDING_STEPS.some((s) => s.value === parsedStep)) {
    return NextResponse.json({ error: "Redondeo inválido." }, { status: 400 });
  }

  try {
    const updated = await bulkUpdatePrices(
      session.user.id,
      parsedPercent,
      parsedStep,
      optionalText(category, 100)
    );
    await revalidateMenuForUser(session.user.id);
    return NextResponse.json({ updated });
  } catch (err) {
    // numeric(10, 2): un aumento enorme puede pasarse del máximo que entra en la columna.
    if ((err as { code?: string }).code === "22003") {
      return NextResponse.json(
        { error: "Algún precio quedaría demasiado alto. Probá con un porcentaje menor." },
        { status: 400 }
      );
    }
    console.error(err);
    return NextResponse.json({ error: "Error actualizando los precios." }, { status: 500 });
  }
}
