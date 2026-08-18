import { notFound } from "next/navigation";
import { getUserBySlug, listProducts, type Product } from "@/lib/db";
import { formatPrice } from "@/lib/format";
import ProductImage from "@/components/ProductImage";

export const dynamic = "force-dynamic";

const UNCATEGORIZED = "Otros";

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
    <main className="min-h-screen bg-paper">
      <div className="mx-auto max-w-2xl px-4 py-12 sm:py-16">
        <header className="text-center mb-12">
          <h1 className="font-serif italic text-4xl font-semibold text-ink tracking-tight">
            {user.business_name || "Nuestro menú"}
          </h1>
          <div className="mt-4 mx-auto h-px w-16 bg-accent/40" />
        </header>

        {products.length === 0 ? (
          <p className="text-center text-ink-soft">
            Todavía no hay productos cargados.
          </p>
        ) : (
          <div className="flex flex-col gap-10">
            {sections.map((section) => (
              <section key={section.category ?? "all"}>
                {section.category && (
                  <h2 className="font-serif text-xl font-semibold text-ink mb-4">
                    {section.category}
                  </h2>
                )}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                  {section.products.map((product) => (
                    <div key={product.id} className="flex flex-col items-center text-center">
                      <ProductImage productId={product.id} name={product.name} />
                      <p className="mt-2.5 text-sm font-medium text-ink">
                        {product.name}
                      </p>
                      {product.price !== null && (
                        <p className="text-sm text-accent font-medium">
                          {formatPrice(product.price)}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}

        <footer className="mt-16 text-center text-xs text-ink-soft/60">
          Creado con QR Stock
        </footer>
      </div>
    </main>
  );
}
