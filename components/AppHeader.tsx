import Link from "next/link";
import { signOut } from "@/auth";
import Logo from "@/components/Logo";

// Header de las pantallas del dueño (dashboard, agregar, ajustes). En el celular los
// botones quedan solo con ícono, pero con área táctil de 44px y nombre accesible.
const itemClass =
  "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40";
const idleClass = "text-ink-soft hover:text-ink hover:bg-paper-soft";
const activeClass = "text-ink bg-paper-soft";

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 20 20" className="h-[18px] w-[18px] shrink-0" fill="none" aria-hidden>
      <path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const ICONS = {
  menu: "M11 4h5v5M16 4l-7 7M14 11.5V15a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3.5",
  settings: "M4 6h7M15 6h1M4 14h1M9 14h7M13 4v4M7 12v4",
  logout: "M8 16H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h3M13 13.5 16.5 10 13 6.5M16.5 10H8",
};

export default function AppHeader({
  slug,
  current,
}: {
  slug: string | null;
  current?: "settings";
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur supports-[backdrop-filter]:bg-paper/70">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between gap-3 px-4 sm:px-8">
        <Logo href="/dashboard" />
        <nav aria-label="Cuenta" className="flex items-center gap-1">
          {slug && (
            <Link
              href={`/menu/${slug}`}
              target="_blank"
              rel="noopener"
              aria-label="Ver mi menú público"
              className={`${itemClass} ${idleClass}`}
            >
              <Icon d={ICONS.menu} />
              <span className="hidden sm:inline">Ver menú</span>
            </Link>
          )}
          <Link
            href="/settings"
            aria-label="Ajustes"
            aria-current={current === "settings" ? "page" : undefined}
            className={`${itemClass} ${current === "settings" ? activeClass : idleClass}`}
          >
            <Icon d={ICONS.settings} />
            <span className="hidden sm:inline">Ajustes</span>
          </Link>
          <span aria-hidden className="mx-1 h-5 w-px bg-line" />
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          >
            <button type="submit" aria-label="Cerrar sesión" className={`${itemClass} ${idleClass}`}>
              <Icon d={ICONS.logout} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
