import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserById, listProducts } from "@/lib/db";
import QrButton from "@/components/QrButton";
import AppHeader from "@/components/AppHeader";
import BulkPriceButton from "@/components/BulkPriceButton";
import ProductCard from "@/components/ProductCard";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await getUserById(session.user.id);
  if (!user?.slug) redirect("/onboarding");

  const products = await listProducts(user.id);
  const categories = user.categories ?? [];

  return (
    <main className="min-h-screen bg-paper">
      <AppHeader slug={user.slug} />

      <div className="mx-auto max-w-4xl p-4 sm:p-8">
        <div className="flex flex-col gap-5 mb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-accent uppercase tracking-[0.12em] mb-1.5">
              Tu catálogo
            </p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-ink tracking-tight leading-tight">
              {user.business_name}
            </h1>
            <p className="mt-1 text-sm text-ink-soft tabular-nums">
              {products.length} {products.length === 1 ? "producto" : "productos"}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:shrink-0 lg:justify-end">
            <BulkPriceButton products={products} />
            <QrButton slug={user.slug} />
            <Link
              href="/add"
              className="col-span-2 order-first sm:order-none inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-ink px-5 text-sm font-medium text-paper shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
                <path d="M10 4.5v11M4.5 10h11" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Agregar producto
            </Link>
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 px-6 rounded-2xl border border-dashed border-line bg-white/50">
            <div className="text-4xl mb-3">🗂️</div>
            <p className="text-ink font-medium">Todavía no hay productos</p>
            <p className="text-sm text-ink-soft mt-1">
              Tocá &ldquo;Agregar producto&rdquo; para sacar la primera foto.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} categories={categories} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
