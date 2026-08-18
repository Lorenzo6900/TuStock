"use client";

import { useState } from "react";

export default function ProductImage({
  productId,
  name,
}: {
  productId: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  const src = `/api/products/${productId}/image`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={`Ampliar ${name}`}
        className="aspect-square w-full rounded-2xl bg-white shadow-sm shadow-black/[0.03] border border-line flex items-center justify-center overflow-hidden cursor-zoom-in transition-all hover:shadow-md hover:border-ink/15 active:scale-95"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={name}
          className="w-full h-full object-contain p-2 pointer-events-none"
        />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar"
            className="absolute top-5 right-5 text-white/90 text-3xl leading-none hover:text-white transition-colors"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={name}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] max-w-full object-contain rounded-2xl bg-white p-3 shadow-2xl"
          />
        </div>
      )}
    </>
  );
}
