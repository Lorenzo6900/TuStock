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
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition bg-white"
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
        <div>
          <label className="text-sm font-medium text-ink">
            Categorías del catálogo
          </label>
          <p className="text-xs text-ink-soft/70 mt-0.5 mb-2">
            Elegí las que quieras usar para dividir tu catálogo. Podés agregar otras.
          </p>

          {suggested.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {suggested.map((category) => {
                const selected = categories.includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      selected
                        ? "bg-ink text-paper border-ink"
                        : "border-line text-ink hover:bg-paper-soft"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          )}

          {customCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {customCategories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => toggleCategory(category)}
                  className="rounded-full border border-ink bg-ink text-paper px-3 py-1.5 text-sm flex items-center gap-1.5"
                >
                  {category}
                  <span aria-hidden="true">×</span>
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
              placeholder="Otro (escribí y agregá)"
              className="flex-1 rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
            />
            <button
              type="button"
              onClick={addCustomCategory}
              className="rounded-lg border border-line px-3 py-2 text-sm font-medium text-ink hover:bg-paper-soft transition-colors"
            >
              Agregar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
