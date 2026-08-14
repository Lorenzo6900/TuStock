import Link from "next/link";

export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 group">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-paper">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
          <path d="M3 3h7v7H3V3zm2 2v3h3V5H5zM14 3h7v7h-7V3zm2 2v3h3V5h-3zM3 14h7v7H3v-7zm2 2v3h3v-3H5zM14 14h2v2h-2v-2zm3 0h2v2h-2v-2zm-3 3h2v2h-2v-2zm3 0h2v2h-2v-2zm3-3h1v5h-3v-2h2v-3z" />
        </svg>
      </span>
      <span className="font-serif text-lg font-semibold tracking-tight text-ink group-hover:text-accent transition-colors">
        QR Stock
      </span>
    </Link>
  );
}
