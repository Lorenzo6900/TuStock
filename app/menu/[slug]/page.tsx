import { notFound } from "next/navigation";
import { getUserBySlug, listProducts, type Product } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import ProductImage from "@/components/ProductImage";

export const dynamic = "force-dynamic";

const UNCATEGORIZED = "Otros";

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

function colorFor(key: string) {
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

export default async function Menu({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getUserBySlug(slug);

  if (!user) notFound();

  const products = await listProducts(user.id);
  const hasCategories = products.some((p) => p.category?.trim());
  const sections = hasCategories
    ? groupByCategory(products, user.categories ?? [])
    : [{ category: null, products }];

  return (
    <main className="min-h-screen bg-[#fff8f0] relative overflow-x-hidden">
      {/* Blobs de fondo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-0 h-[420px] overflow-hidden">
        <div className="absolute -top-24 -left-20 h-72 w-72 rounded-full bg-fuchsia-300/40 blur-3xl" />
        <div className="absolute -top-10 right-0 h-80 w-80 rounded-full bg-amber-300/40 blur-3xl" />
        <div className="absolute top-32 left-1/3 h-64 w-64 rounded-full bg-sky-300/40 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header className="text-center mb-10">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 backdrop-blur px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-fuchsia-600 shadow-sm ring-1 ring-black/5">
            ✨ Catálogo
          </span>
          <h1 className="mt-5 font-serif text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-fuchsia-600 via-orange-500 to-sky-600 bg-clip-text text-transparent drop-shadow-sm">
            {user.business_name || "Nuestro menú"}
          </h1>
          <p className="mt-3 text-sm text-ink-soft">
            Descubrí todo lo que tenemos para vos
          </p>
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
                  const c = colorFor(key);
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
                const c = colorFor(key);
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
                        const pc = colorFor(section.category ?? product.name);
                        return (
                          <div
                            key={product.id}
                            className="group flex flex-col items-center text-center rounded-3xl bg-white p-3 shadow-md shadow-black/[0.04] ring-1 ring-black/5 transition-all hover:-translate-y-1 hover:shadow-xl"
                          >
                            <div
                              className="w-full rounded-2xl p-0.5"
                              style={{ background: `linear-gradient(135deg, ${pc.grad}55, transparent 60%)` }}
                            >
                              <ProductImage productId={product.id} name={product.name} />
                            </div>
                            <p className="mt-3 text-sm font-semibold text-ink leading-snug">
                              {product.name}
                            </p>
                            {product.price !== null && (
                              <span
                                className="mt-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold"
                                style={{ backgroundColor: pc.soft, color: pc.text }}
                              >
                                {formatPrice(product.price)}
                              </span>
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
    </main>
  );
}
