"use client";

import { BRAND_PRESETS, brandColors } from "@/lib/brand";

function Swatch({
  color,
  label,
  selected,
  onClick,
}: {
  color: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={selected}
      title={label}
      className={`flex h-10 w-10 items-center justify-center rounded-full transition-transform active:scale-90 ${
        selected ? "ring-2 ring-offset-2 ring-ink" : "ring-1 ring-black/10 hover:scale-110"
      }`}
      style={{ backgroundColor: color }}
    >
      {selected && <span className="text-white text-sm font-bold drop-shadow">✓</span>}
    </button>
  );
}

export default function BrandColorPicker({
  value,
  suggested,
  businessName,
  onChange,
}: {
  value: string | null;
  suggested: string | null;
  businessName: string;
  onChange: (color: string | null) => void;
}) {
  const isPreset = BRAND_PRESETS.some((p) => p.value === value);
  const isCustom = value !== null && !isPreset && value !== suggested;
  const preview = value ? brandColors(value) : null;

  return (
    <div>
      <label className="text-sm font-medium text-ink">Color del menú</label>

      {suggested && (
        <div className="mt-2 flex items-center gap-3 rounded-xl bg-paper-soft/70 p-2.5">
          <Swatch
            color={suggested}
            label="Color sugerido de tu logo"
            selected={value === suggested}
            onClick={() => onChange(suggested)}
          />
          <p className="text-xs text-ink">
            <span className="font-semibold">Sugerido de tu logo.</span>{" "}
            <span className="text-ink-soft">Tocalo para usarlo.</span>
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2.5">
        {BRAND_PRESETS.map((preset) => (
          <Swatch
            key={preset.value}
            color={preset.value}
            label={preset.name}
            selected={value === preset.value}
            onClick={() => onChange(preset.value)}
          />
        ))}
        {/* Selector libre: un input color nativo escondido detrás de un círculo arcoíris. */}
        <label
          title="Otro color"
          className={`relative h-10 w-10 cursor-pointer rounded-full transition-transform active:scale-90 ${
            isCustom ? "ring-2 ring-offset-2 ring-ink" : "ring-1 ring-black/10 hover:scale-110"
          }`}
          style={{
            background: isCustom
              ? value!
              : "conic-gradient(#ef4444, #f59e0b, #84cc16, #10b981, #06b6d4, #6366f1, #d946ef, #ef4444)",
          }}
        >
          <span className="sr-only">Otro color</span>
          <span className="absolute inset-0 flex items-center justify-center text-white text-lg font-bold drop-shadow">
            {isCustom ? "✓" : "+"}
          </span>
          <input
            type="color"
            value={value ?? "#b45309"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        {preview ? (
          <div
            className="flex flex-1 min-w-0 items-center gap-3 rounded-xl border p-3"
            style={{ backgroundColor: preview.soft, borderColor: preview.ring }}
            aria-hidden
          >
            <span className="flex-1 truncate font-serif text-lg font-bold" style={{ color: preview.text }}>
              {businessName || "Tu negocio"}
            </span>
            <span
              className="rounded-full px-3 py-1 text-xs font-semibold text-white"
              style={{ backgroundColor: preview.text }}
            >
              + Agregar
            </span>
          </div>
        ) : (
          <p className="flex-1 text-xs text-ink-soft">
            Sin color elegido: el menú usa un color distinto para cada categoría.
          </p>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 text-xs font-medium text-ink-soft underline underline-offset-2 hover:text-ink"
          >
            Sacar color
          </button>
        )}
      </div>
    </div>
  );
}
