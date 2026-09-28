import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { consumePasswordResetToken, setUserPassword } from "@/lib/db";
import { hashResetToken } from "@/lib/resetToken";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    if (!token || typeof token !== "string" || !password || typeof password !== "string") {
      return NextResponse.json({ error: "Faltan datos." }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json(
        { error: "La contraseña tiene que tener al menos 8 caracteres." },
        { status: 400 }
      );
    }

    const userId = await consumePasswordResetToken(hashResetToken(token));
    if (!userId) {
      return NextResponse.json(
        { error: "El link venció o ya se usó.", expired: true },
        { status: 400 }
      );
    }

    await setUserPassword(userId, await bcrypt.hash(password, 10));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error cambiando la contraseña." }, { status: 500 });
  }
}
