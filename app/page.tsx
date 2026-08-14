import Link from "next/link";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import Logo from "@/components/Logo";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <main className="min-h-screen bg-paper relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.4] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(var(--color-line) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative">
        <header className="px-6 py-6 sm:px-10">
          <Logo />
        </header>

        <div className="flex items-center justify-center px-6 py-16 sm:py-24">
          <div className="max-w-xl text-center">
            <span className="inline-block rounded-full bg-accent-soft text-accent text-xs font-medium px-3 py-1 mb-6 tracking-wide uppercase">
              Catálogo con IA
            </span>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-ink text-balance">
              Tu stock, en catálogo, en segundos
            </h1>
            <p className="mt-5 text-ink-soft text-lg leading-relaxed text-balance">
              Sacá una foto del producto, la IA le pone nombre, y compartí tu
              catálogo con un QR. Ideal para restaurantes, tiendas y negocios
              que venden lo que tienen a mano.
            </p>
            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/signup"
                className="rounded-full bg-ink text-paper px-7 py-3.5 text-sm font-medium hover:bg-accent transition-colors shadow-sm"
              >
                Crear mi catálogo
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-line px-7 py-3.5 text-sm font-medium text-ink hover:bg-paper-soft transition-colors"
              >
                Iniciar sesión
              </Link>
            </div>

            <div className="mt-16 grid grid-cols-3 gap-4 text-left">
              {[
                { icon: "📷", label: "Sacá la foto" },
                { icon: "✨", label: "La IA la nombra" },
                { icon: "🔗", label: "Compartís el QR" },
              ].map((step) => (
                <div
                  key={step.label}
                  className="rounded-2xl border border-line bg-white/60 p-4 text-center"
                >
                  <div className="text-2xl mb-1.5">{step.icon}</div>
                  <p className="text-xs font-medium text-ink-soft">
                    {step.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
