"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Modal from "@/components/Modal";
import { PRICE_ROUNDING_STEPS, adjustPrice, formatPrice } from "@/lib/format";
import type { Product } from "@/lib/db";

const QUICK_PERCENTS = [5, 10, 15, 20];
const ALL = "";

export default function BulkPriceButton({ products }: { products: Product[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [percent, setPercent] = useState("10");
  const [category, setCategory] = useState(ALL);
  const [step, setStep] = useState(PRICE_ROUNDING_STEPS[0].value);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const priced = products.filter((p) => p.price !== null);
  const categories = [...new Set(priced.map((p) => p.category).filter(Boolean))] as string[];

  if (priced.length === 0) return null;

  const value = Number(percent);
  const validPercent = percent.trim() !== "" && Number.isFinite(value) && value !== 0 && value >= -90 && value <= 500;
  const affected = priced.filter((p) => category === ALL || p.category === category);
  const preview = affected.slice(0, 3);

  function close() {
    if (saving) return;
    setOpen(false);
    setError(null);
  }

  async function handleApply() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/products/bulk-price", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ percent: value, step, category: category || null }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error actualizando los precios.");
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
    } finally {
      setSaving(false);
    }
  }

  const chipClass = (active: boolean) =>
    `min-h-10 rounded-full border px-2 text-sm font-medium tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
      active
        ? "border-ink bg-ink text-paper"
        : "border-line bg-white text-ink hover:bg-paper-soft"
    }`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Actualizar precios"
        className="inline-flex min-h-11 whitespace-nowrap items-center justify-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-medium text-ink hover:bg-paper-soft transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden>
          <path
            d="M4 14l4-4 3 3 5-6M12 7h4v4"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="sm:hidden">Precios</span>
        <span className="hidden sm:inline">Actualizar precios</span>
      </button>

      {open && (
        <Modal onClose={close}>
          <h2 className="font-serif text-lg font-semibold text-ink">Actualizar precios</h2>
          <p className="mt-1 text-sm text-ink-soft">
            Subí o bajá varios precios a la vez por un porcentaje.
          </p>

          <div className="mt-5 flex flex-col gap-5">
            <div>
              <label htmlFor="bulk-percent" className="text-sm font-medium text-ink">
                Porcentaje
              </label>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {QUICK_PERCENTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPercent(String(p))}
                    aria-pressed={value === p}
                    className={chipClass(value === p)}
                  >
                    +{p}%
                  </button>
                ))}
              </div>
              <div className="mt-2 flex items-center rounded-lg border border-line bg-white focus-within:ring-2 focus-within:ring-accent/30 focus-within:border-accent transition">
                <input
                  id="bulk-percent"
                  type="number"
                  inputMode="decimal"
                  step="0.5"
                  value={percent}
                  onChange={(e) => setPercent(e.target.value)}
                  className="w-full rounded-l-lg px-3 py-2 text-ink tabular-nums focus:outline-none"
                  disabled={saving}
                />
                <span className="pr-3 text-sm text-ink-soft">%</span>
              </div>
              <p className="mt-1.5 text-xs text-ink-soft">
                Usá un número negativo para bajar precios (ej: -10).
              </p>
            </div>

            {categories.length > 0 && (
              <div>
                <label htmlFor="bulk-category" className="text-sm font-medium text-ink">
                  Aplicar a
                </label>
                <select
                  id="bulk-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="select-field mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition cursor-pointer"
                  disabled={saving}
                >
                  <option value={ALL}>Todos los productos</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      Solo {c}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <p id="bulk-rounding" className="text-sm font-medium text-ink">
                Redondear a
              </p>
              <div role="group" aria-labelledby="bulk-rounding" className="mt-2 grid grid-cols-4 gap-2">
                {PRICE_ROUNDING_STEPS.map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setStep(s.value)}
                    aria-pressed={step === s.value}
                    className={chipClass(step === s.value)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {validPercent && (
              <div className="rounded-xl bg-paper-soft/70 p-3">
                <p className="text-xs font-medium text-ink-soft">
                  Se van a actualizar {affected.length}{" "}
                  {affected.length === 1 ? "producto" : "productos"}. Por ejemplo:
                </p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {preview.map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-ink">{p.name}</span>
                      <span className="shrink-0 tabular-nums text-ink-soft">
                        <span className="line-through">{formatPrice(p.price!)}</span>
                        {" → "}
                        <span className="font-semibold text-ink">
                          {formatPrice(adjustPrice(Number(p.price), value, step))}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 text-red-700 text-sm p-2.5">{error}</div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={close}
                disabled={saving}
                className="flex-1 min-h-11 rounded-full border border-line text-sm font-medium text-ink hover:bg-paper-soft transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleApply}
                disabled={saving || !validPercent || affected.length === 0}
                className="flex-1 min-h-11 rounded-full bg-ink text-paper text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
              >
                {saving ? "Actualizando..." : "Aplicar"}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
