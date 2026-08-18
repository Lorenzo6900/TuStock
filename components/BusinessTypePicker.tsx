"use client";

import { useState } from "react";
import { BUSINESS_TYPES, categoriesForBusinessType } from "@/lib/businessTypes";

type Props = {
  businessType: string;
  categories: string[];
  onBusinessTypeChange: (businessType: string) => void;
  onCategoriesChange: (categories: string[]) => void;
};

export default function BusinessTypePicker({
  businessType,
  categories,
  onBusinessTypeChange,
  onCategoriesChange,
}: Props) {
  const [customCategory, setCustomCategory] = useState("");
  const suggested = categoriesForBusinessType(businessType);

  function handleTypeChange(newType: string) {
    onBusinessTypeChange(newType);
    onCategoriesChange([]);
  }

  function toggleCategory(category: string) {
    if (categories.includes(category)) {
      onCategoriesChange(categories.filter((c) => c !== category));
    } else {
      onCategoriesChange([...categories, category]);
    }
  }

  function addCustomCategory() {
    const trimmed = customCategory.trim();
    if (!trimmed || categories.includes(trimmed)) {
      setCustomCategory("");
      return;
    }
    onCategoriesChange([...categories, trimmed]);
    setCustomCategory("");
  }

  const customCategories = categories.filter((c) => !suggested.includes(c));

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label className="text-sm font-medium text-ink">Tipo de negocio</label>
        <select
          required
          value={businessType}
          onChange={(e) => handleTypeChange(e.target.value)}
          className="select-field mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition cursor-pointer"
        >
          <option value="" disabled>
            Elegí una opción
          </option>
          {BUSINESS_TYPES.map((type) => (
            <option key={type.id} value={type.id}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {businessType && (
        <div className="rounded-xl bg-paper-soft/60 border border-line p-3.5">
          <label className="text-sm font-medium text-ink">
            Categorías del catálogo
          </label>
          <p className="text-xs text-ink-soft/80 mt-0.5 mb-3 leading-relaxed">
            Elegí las que quieras usar para dividir tu catálogo. Podés agregar otras.
          </p>

          {(suggested.length > 0 || customCategories.length > 0) && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {suggested.map((category) => {
                const selected = categories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    aria-pressed={selected}
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                      selected
                        ? "bg-accent-soft border-accent/40 text-accent"
                        : "bg-white border-line text-ink-soft hover:border-ink/20 hover:text-ink"
                    }`}
                  >
                    {selected && (
                      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                        <path
                          d="M3.5 8.5l2.7 2.7 6.3-6.4"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                    {category}
                  </button>
                );
              })}
              {customCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent-soft px-3 py-1.5 text-sm font-medium text-accent"
                >
                  {category}
                  <span aria-hidden="true" className="text-accent/70">
                    ×
                  </span>
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addCustomCategory();
                }
              }}
              placeholder="Otra categoría..."
              className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-soft/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
            />
            <button
              type="button"
              onClick={addCustomCategory}
              className="shrink-0 rounded-lg border border-line bg-white px-3 py-2 text-sm font-medium text-ink hover:bg-paper-soft transition-colors"
            >
              + Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
