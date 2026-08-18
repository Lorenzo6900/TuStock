export function formatPrice(price: number | string): string {
  const value = typeof price === "string" ? Number(price) : price;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);
}
