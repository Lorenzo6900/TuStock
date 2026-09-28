import { NextRequest, NextResponse } from "next/server";
import {
  createPasswordResetToken,
  getLastPasswordResetRequest,
  getUserByEmail,
} from "@/lib/db";
import { appUrl } from "@/lib/appUrl";
import { sendMail } from "@/lib/mail";
import { RESET_TOKEN_TTL_MS, generateResetToken, hashResetToken } from "@/lib/resetToken";

const MIN_INTERVAL_MS = 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Falta el email." }, { status: 400 });
    }

    // Siempre se responde lo mismo, exista o no la cuenta, para no revelar qué emails
    // están registrados.
    const user = await getUserByEmail(email.trim());
    if (user) {
      const last = await getLastPasswordResetRequest(user.id);
      if (!last || Date.now() - new Date(last).getTime() > MIN_INTERVAL_MS) {
        const token = generateResetToken();
        await createPasswordResetToken(
          user.id,
          hashResetToken(token),
          new Date(Date.now() + RESET_TOKEN_TTL_MS)
        );

        const link = `${appUrl()}/reset-password?token=${token}`;
        await sendMail(
          user.email,
          "Restablecer tu contraseña de QR Stock",
          `<p>Hola${user.name ? ` ${escapeHtml(user.name)}` : ""},</p>
           <p>Pediste restablecer la contraseña de tu cuenta de QR Stock.</p>
           <p><a href="${link}">Tocá acá para elegir una contraseña nueva</a></p>
           <p>El link vence en 1 hora. Si no fuiste vos, ignorá este mail: tu contraseña no cambia.</p>`,
          `Pediste restablecer la contraseña de tu cuenta de QR Stock.\n\nAbrí este link para elegir una nueva (vence en 1 hora):\n${link}\n\nSi no fuiste vos, ignorá este mail.`
        );
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "No pudimos mandar el mail. Probá de nuevo." }, { status: 500 });
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}
