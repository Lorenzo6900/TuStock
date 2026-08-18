export type BusinessType = {
  id: string;
  label: string;
  categories: string[];
};

export const BUSINESS_TYPES: BusinessType[] = [
  {
    id: "restaurante",
    label: "Restaurante",
    categories: ["Entradas", "Platos principales", "Bebidas", "Postres"],
  },
  {
    id: "cafeteria",
    label: "Cafetería / Bar",
    categories: ["Cafés", "Panificados", "Bebidas frías", "Tragos", "Snacks"],
  },
  {
    id: "ferreteria",
    label: "Ferretería",
    categories: ["Herramientas", "Electricidad", "Plomería", "Pinturas", "Tornillería"],
  },
  {
    id: "ropa",
    label: "Ropa / Indumentaria",
    categories: ["Remeras", "Pantalones", "Calzado", "Accesorios"],
  },
  {
    id: "kiosco",
    label: "Kiosco / Almacén",
    categories: ["Golosinas", "Bebidas", "Cigarrillos", "Almacén"],
  },
  {
    id: "otro",
    label: "Otro",
    categories: [],
  },
];

export function categoriesForBusinessType(businessType: string | null): string[] {
  return BUSINESS_TYPES.find((b) => b.id === businessType)?.categories ?? [];
}
