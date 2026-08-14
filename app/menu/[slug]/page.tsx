import { notFound } from "next/navigation";
import { getUserBySlug, listProducts } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Menu({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const user = await getUserBySlug(slug);

  if (!user) notFound();

  const products = await listProducts(user.id);

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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
            {products.map((product) => (
              <div key={product.id} className="flex flex-col items-center text-center">
                <div className="aspect-square w-full rounded-2xl bg-white shadow-sm shadow-black/[0.03] border border-line flex items-center justify-center overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/products/${product.id}/image`}
                    alt={product.name}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
                <p className="mt-2.5 text-sm font-medium text-ink">
                  {product.name}
                </p>
              </div>
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
