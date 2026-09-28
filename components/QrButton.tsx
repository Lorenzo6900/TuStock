"use client";

import { useState } from "react";

export default function QrButton({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [menuUrl, setMenuUrl] = useState("");

  function handleOpen() {
    setMenuUrl(`${window.location.origin}/menu/${slug}`);
    setOpen(true);
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-paper-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
          <path
            d="M4 4h4v4H4zM12 4h4v4h-4zM4 12h4v4H4zM12 12h1.5M16 12v1.5M12 16h4M14.5 14.5v0"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Generar QR
      </button>

      {open && (
        <div
          className="fixed inset-0 bg-ink/50 flex items-center justify-center p-4 z-50"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-2xl p-7 max-w-xs w-full flex flex-col items-center gap-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-serif text-lg font-semibold text-ink text-center">
              Tu catálogo, listo para compartir
            </p>
            <div className="rounded-xl border border-line p-3 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/qr?url=${encodeURIComponent(menuUrl)}`}
                alt="QR del catálogo"
                className="w-full aspect-square"
              />
            </div>
            <p className="text-xs text-ink-soft break-all text-center">{menuUrl}</p>
            <button
              onClick={() => setOpen(false)}
              className="text-sm font-medium text-ink-soft hover:text-ink transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
