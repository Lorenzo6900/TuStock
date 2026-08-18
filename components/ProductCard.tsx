"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Modal from "@/components/Modal";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/db";

export default function ProductCard({
  product,
  categories,
}: {
  product: Product;
  categories: string[];
}) {
  const router = useRouter();
  const [modal, setModal] = useState<"edit" | "delete" | null>(null);
  const [name, setName] = useState(product.name);
  const [price, setPrice] = useState(product.price !== null ? String(product.price) : "");
  const [category, setCategory] = useState(product.category ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function closeModal() {
    if (saving) return;
    setModal(null);
    setError(null);
  }

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          price: price.trim() === "" ? null : price,
          category: category.trim() === "" ? null : category,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error guardando los cambios.");

      setModal(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/products/${product.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Error eliminando el producto.");

      setModal(null);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
      setSaving(false);
    }
  }

  return (
    <>
      <div className="group bg-white rounded-2xl border border-line overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all">
        <div className="aspect-square bg-white flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/api/products/${product.id}/image`}
            alt={product.name}
            className="w-full h-full object-contain"
          />
        </div>
        <div className="p-3 border-t border-line">
          <p className="text-sm font-medium text-ink truncate">{product.name}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            {product.category && (
              <span className="text-xs text-ink-soft truncate">{product.category}</span>
            )}
            {product.price !== null && (
              <span className="text-xs font-medium text-accent ml-auto">
                {formatPrice(product.price)}
              </span>
            )}
          </div>
          <div className="mt-2.5 flex gap-1.5">
            <button
              type="button"
              onClick={() => setModal("edit")}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-line py-1.5 text-xs font-medium text-ink-soft hover:text-ink hover:border-ink/20 hover:bg-paper-soft transition-colors"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                <path
                  d="M11.3 2.3a1.5 1.5 0 0 1 2.1 2.1L5 12.8l-2.9.6.6-2.9 8.6-8.2Z"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Editar
            </button>
            <button
              type="button"
              onClick={() => setModal("delete")}
              className="inline-flex items-center justify-center rounded-lg border border-line px-2.5 py-1.5 text-red-600/80 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
              aria-label="Eliminar producto"
            >
              <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none">
                <path
                  d="M3 4.5h10M6.5 4.5V3a1 1 0 0 1 1-1h1a1 1 0 0 1 1 1v1.5M4.5 4.5l.5 8a1 1 0 0 0 1 1h4a1 1 0 0 0 1-1l.5-8"
                  stroke="currentColor"
                  strokeWidth="1.3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {modal === "edit" && (
        <Modal onClose={closeModal}>
          <h2 className="font-serif text-lg font-semibold text-ink mb-4">
            Editar producto
          </h2>
          <form onSubmit={handleSaveEdit} className="flex flex-col gap-3">
            {error && (
              <div className="rounded-lg bg-red-50 text-red-700 text-sm p-2.5">{error}</div>
            )}
            <div>
              <label className="text-sm font-medium text-ink">Nombre</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
                disabled={saving}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Precio</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Sin precio"
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
                disabled={saving}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select-field mt-1 w-full rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition cursor-pointer"
                disabled={saving}
              >
                <option value="">Sin categoría</option>
                {[category, ...categories]
                  .filter((c, i, arr) => c && arr.indexOf(c) === i)
                  .map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex gap-2 mt-1">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex-1 rounded-full border border-line py-2 text-sm font-medium text-ink hover:bg-paper-soft transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-full bg-ink text-paper py-2 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
              >
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modal === "delete" && (
        <Modal onClose={closeModal}>
          <h2 className="font-serif text-lg font-semibold text-ink mb-2">
            ¿Eliminar producto?
          </h2>
          <p className="text-sm text-ink-soft mb-4">
            Vas a borrar <span className="font-medium text-ink">{product.name}</span> del
            catálogo. Esta acción no se puede deshacer.
          </p>
          {error && (
            <div className="rounded-lg bg-red-50 text-red-700 text-sm p-2.5 mb-3">{error}</div>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={closeModal}
              disabled={saving}
              className="flex-1 rounded-full border border-line py-2 text-sm font-medium text-ink hover:bg-paper-soft transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="flex-1 rounded-full bg-red-600 text-white py-2 text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {saving ? "Eliminando..." : "Eliminar"}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
