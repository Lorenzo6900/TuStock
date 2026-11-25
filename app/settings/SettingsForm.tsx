"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { slugify } from "@/lib/slug";
import { suggestColorFromImage } from "@/lib/brand";
import type { WeeklyHours } from "@/lib/hours";
import LogoUploader from "./LogoUploader";
import BrandColorPicker from "./BrandColorPicker";
import HoursEditor, { DEFAULT_HOURS } from "./HoursEditor";

export type SettingsInitial = {
  businessName: string;
  slug: string;
  whatsapp: string | null;
  brandColor: string | null;
  address: string | null;
  instagram: string | null;
  hours: WeeklyHours | null;
  logoUrl: string | null;
};

const inputClass =
  "mt-1 w-full rounded-lg border border-line px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white border border-line rounded-2xl p-5 sm:p-6 shadow-sm shadow-black/[0.02]">
      <h2 className="font-serif text-xl font-semibold text-ink">{title}</h2>
      {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
      <div className="mt-4 flex flex-col gap-5">{children}</div>
    </section>
  );
}

function Optional() {
  return <span className="font-normal text-ink-soft">(opcional)</span>;
}

export default function SettingsForm({
  initial,
  origin,
}: {
  initial: SettingsInitial;
  origin: string;
}) {
  const router = useRouter();
  const [businessName, setBusinessName] = useState(initial.businessName);
  const [slug, setSlug] = useState(initial.slug);
  const [savedSlug, setSavedSlug] = useState(initial.slug);
  const [whatsapp, setWhatsapp] = useState(initial.whatsapp ? `+${initial.whatsapp}` : "");
  const [instagram, setInstagram] = useState(initial.instagram ? `@${initial.instagram}` : "");
  const [address, setAddress] = useState(initial.address ?? "");
  const [brandColor, setBrandColor] = useState<string | null>(initial.brandColor);
  const [logoUrl, setLogoUrl] = useState<string | null>(initial.logoUrl);
  const [suggestedColor, setSuggestedColor] = useState<string | null>(null);
  const [showHours, setShowHours] = useState(initial.hours !== null);
  const [hours, setHours] = useState<WeeklyHours>(initial.hours ?? DEFAULT_HOURS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const normalizedSlug = slugify(slug);
  const slugChanged = normalizedSlug !== savedSlug;

  // Si ya tenía logo, se calcula el color sugerido al abrir la página.
  useEffect(() => {
    if (!initial.logoUrl) return;
    suggestColorFromImage(initial.logoUrl)
      .then(setSuggestedColor)
      .catch(() => {});
  }, [initial.logoUrl]);

  function handleLogoChange(url: string | null, previewDataUrl?: string) {
    setLogoUrl(url);
    setSuggestedColor(null);
    router.refresh();
    if (previewDataUrl) {
      suggestColorFromImage(previewDataUrl)
        .then((color) => {
          setSuggestedColor(color);
          // Primer logo y sin color elegido: se usa el sugerido de una.
          if (color) setBrandColor((current) => current ?? color);
        })
        .catch(() => {});
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    const res = await fetch("/api/business", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        businessName,
        slug: normalizedSlug,
        whatsapp,
        instagram,
        address,
        brandColor,
        hours: showHours ? hours : null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      }),
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
    setWhatsapp(json.whatsapp ? `+${json.whatsapp}` : "");
    setInstagram(json.instagram ? `@${json.instagram}` : "");
    setAddress(json.address ?? "");
    setBrandColor(json.brandColor);
    setShowHours(json.hours !== null);
    if (json.hours) setHours(json.hours);
    setSuccess(true);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <Section title="Tu negocio">
        <LogoUploader
          logoUrl={logoUrl}
          businessName={businessName}
          onChange={handleLogoChange}
        />

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

        <BrandColorPicker
          value={brandColor}
          suggested={suggestedColor}
          businessName={businessName}
          onChange={setBrandColor}
        />
      </Section>

      <Section title="Contacto" description="Aparece arriba del menú para que te encuentren.">
        <div>
          <label className="text-sm font-medium text-ink">
            WhatsApp para pedidos <Optional />
          </label>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="11 2345 6789"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-ink-soft">
            Si lo completás, tus clientes pueden armar un pedido en el menú y mandártelo por
            WhatsApp. Si no sos de Argentina, escribilo con el código de país (ej: +598 …).
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-ink">
            Instagram <Optional />
          </label>
          <input
            type="text"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            placeholder="@tunegocio"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="text-sm font-medium text-ink">
            Dirección <Optional />
          </label>
          <input
            type="text"
            autoComplete="street-address"
            maxLength={200}
            placeholder="Av. Corrientes 1234, CABA"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
          />
          <p className="mt-1.5 text-xs text-ink-soft">
            Al tocarla, se abre en Google Maps. Sumá la ciudad para que la encuentre bien.
          </p>
        </div>
      </Section>

      <Section title="Horarios">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={showHours}
            onChange={(e) => setShowHours(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-[var(--color-ink)]"
          />
          <span className="text-sm text-ink">
            <span className="font-medium">Mostrar horarios en el menú</span>
            <span className="block text-xs text-ink-soft">
              Tus clientes ven si estás abierto ahora y a qué hora abrís.
            </span>
          </span>
        </label>
        {showHours && <HoursEditor hours={hours} onChange={setHours} />}
      </Section>

      <div className="sticky bottom-0 -mx-4 bg-paper/90 backdrop-blur px-4 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] border-t border-line sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none">
        {error && (
          <div role="alert" className="mb-3 rounded-lg bg-red-50 text-red-700 text-sm p-3">
            {error}
          </div>
        )}
        {success && (
          <div role="status" className="mb-3 rounded-lg bg-green-50 text-green-700 text-sm p-3">
            Cambios guardados.
          </div>
        )}
        <button
          type="submit"
          disabled={loading || !businessName.trim() || !normalizedSlug}
          className="w-full rounded-full bg-ink text-paper py-2.5 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
        >
          {loading ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>
    </form>
  );
}
