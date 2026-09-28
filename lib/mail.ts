import nodemailer from "nodemailer";

// Gmail SMTP con una "contraseña de aplicación" (no la contraseña normal de la cuenta).
// Sin configurar (ej. en local), el mail se imprime en la consola del servidor.
const transporter =
  process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD
    ? nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
      })
    : null;

export async function sendMail(to: string, subject: string, html: string, text: string) {
  if (!transporter) {
    console.log(`[mail sin configurar] Para: ${to}\nAsunto: ${subject}\n${text}`);
    return;
  }
  await transporter.sendMail({
    from: `"QR Stock" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  });
}
