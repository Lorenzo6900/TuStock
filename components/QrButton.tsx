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
        className="rounded-full border border-line px-5 py-2.5 text-sm font-medium text-ink hover:bg-paper-soft transition-colors"
      >
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
