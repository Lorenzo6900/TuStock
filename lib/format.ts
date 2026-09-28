export function formatPrice(price: number | string): string {
  const value = typeof price === "string" ? Number(price) : price;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}

// Texto opcional de un formulario: vacío → null, y recortado a un largo máximo.
export function optionalText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim().slice(0, maxLength);
}

// Mismo cálculo que `bulkUpdatePrices` en la base, para mostrar la vista previa.
export function adjustPrice(price: number, percent: number, step: number): number {
  const next = Math.round((price * (1 + percent / 100)) / step) * step;
  return Math.round(next * 100) / 100;
}

export const PRICE_ROUNDING_STEPS = [
  { value: 0.01, label: "Exacto" },
  { value: 10, label: "$10" },
  { value: 50, label: "$50" },
  { value: 100, label: "$100" },
];
