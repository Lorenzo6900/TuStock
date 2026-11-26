import { cache } from "react";
import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import {
  businessLogoUrl,
  getSlugRedirect,
  getUserBySlug,
  listProducts,
  type Product,
} from "@/lib/db";
import { brandColors, type BrandColors } from "@/lib/brand";
import BusinessInfo from "@/components/menu/BusinessInfo";
import { formatPrice } from "@/lib/format";
import ProductImage from "@/components/ProductImage";
import { AddToCartButton, CartBar, CartProvider } from "@/components/menu/Cart";

// Cada menú se renderiza la primera vez que alguien lo abre y queda en caché.
// Se invalida al instante cuando el dueño cambia algo (ver lib/menuCache.ts);
// el revalidate es solo una red de seguridad.
export const revalidate = 3600;

export function generateStaticParams() {
  return [];
}

const UNCATEGORIZED = "Otros";

// La página y generateMetadata buscan el mismo negocio: una sola consulta.
const getBusiness = cache(getUserBySlug);

const PALETTE = [
  { text: "#b91c5c", soft: "#fde4ef", ring: "#f8b4d9", grad: "#fb7185" },
  { text: "#0f766e", soft: "#dcfaf4", ring: "#99f0e2", grad: "#2dd4bf" },
  { text: "#7c3aed", soft: "#f1e8fe", ring: "#d8bbfb", grad: "#a78bfa" },
  { text: "#c2410c", soft: "#ffead2", ring: "#fdc98a", grad: "#fb923c" },
  { text: "#1d4ed8", soft: "#e2ecff", ring: "#aec6ff", grad: "#60a5fa" },
  { text: "#a16207", soft: "#fdf3d0", ring: "#fbdf7e", grad: "#facc15" },
  { text: "#be123c", soft: "#ffe2e6", ring: "#fca5b7", grad: "#f43f5e" },
  { text: "#0369a1", soft: "#dff3ff", ring: "#a8dcff", grad: "#38bdf8" },
];

function colorFor(key: string): BrandColors {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

function slugify(key: string) {
  return key
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function groupByCategory(products: Product[], preferredOrder: string[]) {
  const grouped = new Map<string, Product[]>();
  for (const product of products) {
    const key = product.category?.trim() || UNCATEGORIZED;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(product);
  }

  const orderedKeys = [
    ...preferredOrder.filter((c) => grouped.has(c)),
    ...[...grouped.keys()].filter(
      (k) => !preferredOrder.includes(k) && k !== UNCATEGORIZED
    ),
    ...(grouped.has(UNCATEGORIZED) ? [UNCATEGORIZED] : []),
  ];

  return orderedKeys.map((key) => ({ category: key, products: grouped.get(key)! }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const user = await getBusiness(slug);
  if (!user) return {};
  const title = user.business_name || "Menú";
  const logo = businessLogoUrl(user);
  return {
    title: `${title} · Menú`,
    description: `Mirá el menú de ${title}.`,
    icons: logo ? { icon: logo, apple: logo } : undefined,
    openGraph: { title, description: `Mirá el menú de ${title}.`, images: logo ? [logo] : undefined },
  };
}

export default async function Menu({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getBusiness(slug);

  if (!user) {
    // Slug viejo de un negocio que se renombró: los QR impresos siguen andando.
    const newSlug = await getSlugRedirect(slug);
    if (newSlug) permanentRedirect(`/menu/${newSlug}`);
    notFound();
  }

  // Los agotados van al final (y como el agrupado mantiene el orden, quedan al
  // final de su categoría).
  const allProducts = await listProducts(user.id);
  const products = [
    ...allProducts.filter((p) => p.available),
    ...allProducts.filter((p) => !p.available),
  ];
  const hasCategories = products.some((p) => p.category?.trim());
  const sections = hasCategories
    ? groupByCategory(products, user.categories ?? [])
    : [{ category: null, products }];
  // Con color de marca, todo el menú va en ese color; sin él, uno por categoría.
  const brand = user.brand_color ? brandColors(user.brand_color) : null;
  const colorOf = (key: string) => brand ?? colorFor(key);
  const heroColor = colorOf(user.business_name || slug);
  const logoUrl = businessLogoUrl(user);
  const orderableIds = products.filter((p) => p.available).map((p) => p.id);
  const ordersEnabled = Boolean(user.whatsapp) && orderableIds.length > 0;

  const menu = (
    <main className="min-h-screen bg-[#fff8f0] relative overflow-x-hidden">
      <div
        className={`relative mx-auto max-w-3xl px-4 py-12 sm:py-16 ${ordersEnabled ? "pb-32 sm:pb-32" : ""}`}
      >
        <header className="relative text-center mb-10">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-0 -z-10 h-56 w-56 sm:h-72 sm:w-72 -translate-x-1/2 -translate-y-1/4 rounded-full blur-3xl opacity-25"
            style={{ backgroundColor: heroColor.grad }}
          />
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`Logo de ${user.business_name ?? "el negocio"}`}
              className="mx-auto h-24 w-24 sm:h-28 sm:w-28 rounded-full bg-white object-cover shadow-lg shadow-black/10 ring-4 ring-white"
            />
          ) : (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur px-4 py-1.5 text-xs font-semibold uppercase tracking-wider shadow-sm ring-1 ring-black/5"
              style={{ color: heroColor.text }}
            >
              ✨ Catálogo
            </span>
          )}
          <h1
            className="mt-5 pb-1 font-serif text-4xl sm:text-5xl font-bold tracking-tight leading-[1.25] bg-clip-text text-transparent"
            style={{ backgroundImage: `linear-gradient(90deg, ${heroColor.text}, ${heroColor.grad})` }}
          >
            {user.business_name || "Nuestro menú"}
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            {ordersEnabled
              ? "Elegí lo que quieras y mandanos el pedido por WhatsApp"
              : "Descubrí todo lo que tenemos para vos"}
          </p>
          <BusinessInfo
            address={user.address}
            instagram={user.instagram}
            whatsapp={user.whatsapp}
            hours={user.hours}
            timezone={user.timezone}
            accent={heroColor.text}
          />
        </header>

        {products.length === 0 ? (
          <p className="text-center text-ink-soft">
            Todavía no hay productos cargados.
          </p>
        ) : (
          <>
            {sections.length > 1 && (
              <nav className="mb-10 flex flex-wrap justify-center gap-2">
                {sections.map(({ category }) => {
                  const key = category ?? "all";
                  const c = colorOf(key);
                  return (
                    <a
                      key={key}
                      href={`#${slugify(key)}`}
                      className="rounded-full px-3.5 py-1.5 text-xs font-semibold shadow-sm ring-1 ring-black/5 transition-transform hover:-translate-y-0.5"
                      style={{ backgroundColor: c.soft, color: c.text }}
                    >
                      {category ?? "Todo"}
                    </a>
                  );
                })}
              </nav>
            )}

            <div className="flex flex-col gap-14">
              {sections.map((section) => {
                const key = section.category ?? "all";
                const c = colorOf(key);
                return (
                  <section key={key} id={slugify(key)} className="scroll-mt-6">
                    {section.category && (
                      <div className="mb-5 flex items-center gap-3">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: c.grad }}
                        />
                        <h2 className="font-serif text-2xl font-bold text-ink">
                          {section.category}
                        </h2>
                        <span
                          className="h-px flex-1 rounded-full opacity-60"
                          style={{ backgroundColor: c.ring }}
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                      {section.products.map((product) => {
                        const pc = colorOf(section.category ?? product.name);
                        const soldOut = !product.available;
                        return (
                          <div
                            key={product.id}
                            className={`group flex flex-col items-center text-center rounded-3xl p-3 ring-1 ring-black/5 transition-all ${
                              soldOut
                                ? "bg-white/60"
                                : "bg-white shadow-md shadow-black/[0.04] hover:-translate-y-1 hover:shadow-xl"
                            }`}
                          >
                            <div
                              className={`relative w-full rounded-2xl p-0.5 ${soldOut ? "grayscale opacity-50" : ""}`}
                              style={
                                soldOut
                                  ? undefined
                                  : { background: `linear-gradient(135deg, ${pc.grad}55, transparent 60%)` }
                              }
                            >
                              <ProductImage productId={product.id} name={product.name} />
                            </div>
                            <p
                              className={`mt-3 text-sm font-semibold leading-snug ${soldOut ? "text-ink-soft" : "text-ink"}`}
                            >
                              {product.name}
                            </p>
                            {product.description && (
                              <p
                                className={`mt-1 text-xs text-ink-soft leading-relaxed line-clamp-3 ${soldOut ? "opacity-60" : ""}`}
                              >
                                {product.description}
                              </p>
                            )}
                            {soldOut ? (
                              <div className="mt-auto pt-2">
                                <span className="inline-block rounded-full bg-ink/80 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                                  Agotado
                                </span>
                              </div>
                            ) : (product.price !== null || ordersEnabled) && (
                              <div className="mt-auto w-full pt-2">
                                {product.price !== null && (
                                  <span
                                    className="inline-block rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums"
                                    style={{ backgroundColor: pc.soft, color: pc.text }}
                                  >
                                    {formatPrice(product.price)}
                                  </span>
                                )}
                                {ordersEnabled && (
                                  <AddToCartButton
                                    product={{
                                      id: product.id,
                                      name: product.name,
                                      price: product.price === null ? null : Number(product.price),
                                    }}
                                    color={pc.text}
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}

        <footer className="mt-20 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 backdrop-blur px-3.5 py-1 text-[11px] font-medium text-ink-soft shadow-sm ring-1 ring-black/5">
            🩷 Creado con QR Stock
          </span>
        </footer>
      </div>
      {ordersEnabled && (
        <CartBar
          whatsapp={user.whatsapp!}
          businessName={user.business_name || "el negocio"}
          color={brand?.text}
        />
      )}
    </main>
  );

  return ordersEnabled ? (
    <CartProvider slug={slug} orderableIds={orderableIds}>
      {menu}
    </CartProvider>
  ) : (
    menu
  );
}
