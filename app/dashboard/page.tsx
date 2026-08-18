import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { getUserById, listProducts } from "@/lib/db";
import QrButton from "@/components/QrButton";
import Logo from "@/components/Logo";
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
      <header className="border-b border-line bg-white/60">
        <div className="mx-auto max-w-4xl px-4 sm:px-8 py-4 flex items-center justify-between">
          <Logo href="/dashboard" />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button className="text-sm text-ink-soft hover:text-ink transition-colors">
              Cerrar sesión
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-4xl p-4 sm:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-medium text-accent uppercase tracking-wide mb-1">
              Tu catálogo
            </p>
            <h1 className="font-serif text-3xl font-semibold text-ink tracking-tight">
              {user.business_name}
            </h1>
          </div>
          <div className="flex gap-3">
            <QrButton slug={user.slug} />
            <Link
              href="/add"
              className="rounded-full bg-ink text-paper px-5 py-2.5 text-sm font-medium hover:bg-accent transition-colors shadow-sm"
            >
              + Agregar producto
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
