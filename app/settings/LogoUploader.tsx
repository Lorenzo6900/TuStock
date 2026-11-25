"use client";

import { useRef, useState } from "react";
import { compressLogo } from "@/lib/image";

// El logo se sube apenas se elige (no espera al "Guardar cambios" del formulario).
export default function LogoUploader({
  logoUrl,
  businessName,
  onChange,
}: {
  logoUrl: string | null;
  businessName: string;
  onChange: (logoUrl: string | null, previewDataUrl?: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setBusy(true);
    try {
      const logo = await compressLogo(file);
      const res = await fetch("/api/business/logo", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: logo.data, mimeType: logo.mimeType }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "No se pudo subir el logo.");
      onChange(json.logoUrl, logo.dataUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir el logo.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    setError(null);
    setBusy(true);
    const res = await fetch("/api/business/logo", { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      setError("No se pudo quitar el logo.");
      return;
    }
    onChange(null);
  }

  const initial = businessName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div>
      <label className="text-sm font-medium text-ink">Logo</label>
      <div className="mt-2 flex items-center gap-4">
        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full bg-paper-soft ring-1 ring-line flex items-center justify-center">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="Logo del negocio" className="h-full w-full object-cover" />
          ) : (
            <span className="font-serif text-3xl font-semibold text-ink-soft">{initial}</span>
          )}
        </div>
        <div className="flex flex-col items-start gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-full border border-line bg-white px-4 py-2 text-sm font-medium text-ink hover:border-ink/30 transition-colors disabled:opacity-50"
          >
            {busy ? "Subiendo..." : logoUrl ? "Cambiar logo" : "Subir logo"}
          </button>
          {logoUrl && !busy && (
            <button
              type="button"
              onClick={handleRemove}
              className="px-1 text-xs font-medium text-ink-soft underline underline-offset-2 hover:text-red-700"
            >
              Quitar
            </button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) handleFile(file);
          }}
        />
      </div>
      <p className="mt-2 text-xs text-ink-soft">
        Se ve en un círculo arriba del menú. Mejor si es cuadrado; un PNG con fondo
        transparente queda bárbaro.
      </p>
      {error && <p className="mt-2 text-xs text-red-700">{error}</p>}
    </div>
  );
}
