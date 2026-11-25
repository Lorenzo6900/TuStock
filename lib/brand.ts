// Color de marca del menú. El dueño puede elegir cualquier color, así que de ese
// color base se derivan tonos que siempre se leen bien sobre blanco.

export type BrandColors = {
  text: string; // títulos, precios y botones (texto blanco encima): contraste ≥ 4.5
  soft: string; // fondos suaves (chips de precio)
  ring: string; // líneas y bordes
  grad: string; // brillos y degradés
};

export const BRAND_PRESETS = [
  { name: "Terracota", value: "#c2410c" },
  { name: "Rojo", value: "#be123c" },
  { name: "Rosa", value: "#db2777" },
  { name: "Violeta", value: "#7c3aed" },
  { name: "Azul", value: "#1d4ed8" },
  { name: "Celeste", value: "#0284c7" },
  { name: "Verde agua", value: "#0f766e" },
  { name: "Verde", value: "#15803d" },
  { name: "Mostaza", value: "#ca8a04" },
  { name: "Chocolate", value: "#78350f" },
  { name: "Negro", value: "#1c1a17" },
];

const HEX = /^#[0-9a-f]{6}$/;

export function normalizeHex(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let hex = value.trim().toLowerCase();
  if (!hex.startsWith("#")) hex = `#${hex}`;
  if (/^#[0-9a-f]{3}$/.test(hex)) hex = `#${[...hex.slice(1)].map((c) => c + c).join("")}`;
  return HEX.test(hex) ? hex : null;
}

type Rgb = [number, number, number];

function toRgb(hex: string): Rgb {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function toHex([r, g, b]: Rgb): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

function mix(a: Rgb, b: Rgb, amount: number): Rgb {
  return [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * amount) as Rgb;
}

function luminance([r, g, b]: Rgb): number {
  const ch = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b);
}

function contrastWithWhite(rgb: Rgb): number {
  return 1.05 / (luminance(rgb) + 0.05);
}

const WHITE: Rgb = [255, 255, 255];
const BLACK: Rgb = [0, 0, 0];

export function brandColors(hex: string): BrandColors {
  const base = toRgb(hex);

  // Si es muy claro (ej. amarillo pastel) se oscurece de a poco hasta que el texto
  // blanco encima y el texto de ese color sobre blanco se lean bien.
  let text = base;
  for (let i = 1; contrastWithWhite(text) < 4.5 && i <= 20; i++) {
    text = mix(base, BLACK, i * 0.05);
  }

  // Si es muy oscuro (ej. negro), el brillo se aclara para que se note.
  const grad = luminance(base) < 0.05 ? mix(base, WHITE, 0.45) : base;

  return {
    text: toHex(text),
    soft: toHex(mix(base, WHITE, 0.88)),
    ring: toHex(mix(base, WHITE, 0.6)),
    grad: toHex(grad),
  };
}

// Solo navegador: busca el color más representativo del logo, ignorando blancos,
// negros y grises (fondos y textos), para sugerirlo como color de marca.
export async function suggestColorFromImage(src: string): Promise<string | null> {
  // onload en vez de img.decode(): decode() puede quedar colgado si la pestaña no
  // está pintando (ej. en segundo plano).
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("No se pudo leer la imagen"));
    img.src = src;
  });

  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0, size, size);
  const { data } = ctx.getImageData(0, 0, size, size);

  // Se agrupan colores parecidos en "cajas" y gana la que más píxeles tiene,
  // pesando más los colores saturados.
  const buckets = new Map<string, { score: number; sum: Rgb; count: number }>();
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] < 128) continue;
    const rgb: Rgb = [data[i], data[i + 1], data[i + 2]];
    const max = Math.max(...rgb);
    const min = Math.min(...rgb);
    const saturation = max === 0 ? 0 : (max - min) / max;
    if (max < 40 || saturation < 0.25 || (max > 235 && saturation < 0.35)) continue;
    const key = rgb.map((v) => v >> 5).join(",");
    const bucket = buckets.get(key) ?? { score: 0, sum: [0, 0, 0] as Rgb, count: 0 };
    bucket.score += 0.5 + saturation;
    bucket.count += 1;
    bucket.sum = [bucket.sum[0] + rgb[0], bucket.sum[1] + rgb[1], bucket.sum[2] + rgb[2]];
    buckets.set(key, bucket);
  }

  let best: { score: number; sum: Rgb; count: number } | null = null;
  for (const bucket of buckets.values()) {
    if (!best || bucket.score > best.score) best = bucket;
  }
  // Muy pocos píxeles de color: el logo es blanco y negro, no hay nada que sugerir.
  if (!best || best.count < size * size * 0.02) return null;
  const { sum, count } = best;
  return toHex(sum.map((v) => v / count) as Rgb);
}
