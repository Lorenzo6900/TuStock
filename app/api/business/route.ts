import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserById } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autenticado." }, { status: 401 });
  }

  const user = await getUserById(session.user.id);
  if (!user) {
    return NextResponse.json({ error: "Usuario no encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    businessType: user.business_type,
    categories: user.categories ?? [],
  });
}
