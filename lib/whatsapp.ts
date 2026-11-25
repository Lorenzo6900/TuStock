// Normaliza un número de WhatsApp al formato que pide wa.me: solo dígitos, con
// código de país y sin "+". Pensado para Argentina: si el dueño escribe el número
// local (con o sin 0 y 15), le agrega el 549 que va adelante de los celulares.
// Devuelve null si no parece un número válido.
export function normalizeWhatsapp(raw: string): string | null {
  let digits = raw.replace(/\D/g, "");
  if (!digits) return null;

  const hadPlus = raw.trim().startsWith("+");
  if (!hadPlus && !digits.startsWith("54")) {
    digits = digits.replace(/^0/, "");
    // "11 15 2345 6789" → el 15 sobra cuando se usa el formato internacional.
    const withoutFifteen = digits.replace(/^(\d{2,4})15(\d{6,8})$/, "$1$2");
    if (withoutFifteen.length === 10) digits = withoutFifteen;
    if (digits.length === 10) digits = `549${digits}`;
  }

  return digits.length >= 8 && digits.length <= 15 ? digits : null;
}

export type OrderItem = { name: string; price: number | null; quantity: number };

export function buildOrderMessage(
  items: OrderItem[],
  formatPrice: (n: number) => string,
  customerName: string,
  note: string
): string {
  const lines = ["¡Hola! Quiero hacer este pedido:", ""];
  let total = 0;
  let allPriced = true;
  for (const item of items) {
    if (item.price === null) {
      allPriced = false;
      lines.push(`• ${item.quantity} x ${item.name}`);
    } else {
      const subtotal = item.price * item.quantity;
      total += subtotal;
      lines.push(`• ${item.quantity} x ${item.name} — ${formatPrice(subtotal)}`);
    }
  }
  lines.push("");
  lines.push(allPriced ? `Total: ${formatPrice(total)}` : `Total (sin los que no tienen precio): ${formatPrice(total)}`);
  if (customerName.trim()) lines.push(`Nombre: ${customerName.trim()}`);
  if (note.trim()) lines.push(`Nota: ${note.trim()}`);
  return lines.join("\n");
}

export function whatsappLink(number: string, message: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}
