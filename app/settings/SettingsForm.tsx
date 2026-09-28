"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slug";

export default function SettingsForm({
  businessName: initialName,
  slug: initialSlug,
  origin,
}: {
  businessName: string;
  slug: string;
  origin: string;
}) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(initialName);
  const [slug, setSlug] = useState(initialSlug);
  const [savedSlug, setSavedSlug] = useState(initialSlug);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const normalizedSlug = slugify(slug);
  const slugChanged = normalizedSlug !== savedSlug;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const res = await fetch("/api/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName, slug: normalizedSlug }),
    });
    const json = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(json.error ?? "Algo salió mal.");
      return;
    }
    setBusinessName(json.businessName);
    setSlug(json.slug);
    setSavedSlug(json.slug);
    setSuccess(true);
    router.refresh();
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-line px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition";

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-line rounded-2xl p-6 shadow-sm shadow-black/[0.02] flex flex-col gap-4"
    >
      {error && <div className="rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</div>}
      {success && (
        <div className="rounded-lg bg-green-50 text-green-700 text-sm p-3">Cambios guardados.</div>
      )}

      <div>
        <label className="text-sm font-medium text-ink">Nombre del negocio</label>
        <input
          type="text"
          required
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-ink">Link del catálogo</label>
        <div className="mt-1 flex items-center rounded-lg border border-line focus-within:ring-2 focus-within:ring-accent/30 focus-within:border-accent transition">
          <span className="pl-3 text-sm text-ink-soft whitespace-nowrap">/menu/</span>
          <input
            type="text"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            onBlur={() => setSlug(normalizedSlug)}
            className="w-full min-w-0 rounded-r-lg px-1 py-2 text-ink focus:outline-none"
          />
        </div>
        <p className="mt-1.5 text-xs text-ink-soft break-all">
          {origin}/menu/{normalizedSlug || "…"}
        </p>
        {slugChanged && (
          <p className="mt-2 rounded-lg bg-accent-soft/50 text-xs text-ink p-2.5">
            Los QR que ya imprimiste siguen funcionando: el link viejo redirige al nuevo.
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading || !businessName.trim() || !normalizedSlug}
        className="mt-1 w-full rounded-full bg-ink text-paper py-2.5 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
