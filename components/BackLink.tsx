import Link from "next/link";

// "Volver" con área táctil de 44px. El -ml compensa el padding para que el ícono
// quede alineado con el borde del contenido de abajo.
export default function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="group -ml-3 inline-flex min-h-11 items-center gap-1.5 rounded-full pl-2 pr-4 text-sm font-medium text-ink-soft transition-colors hover:bg-paper-soft hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
    >
      <svg
        viewBox="0 0 20 20"
        className="h-[18px] w-[18px] transition-transform group-hover:-translate-x-0.5"
        fill="none"
        aria-hidden
      >
        <path
          d="M12.5 15 7.5 10l5-5"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {children}
    </Link>
  );
}
