"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { compressBase64Image, compressImage } from "@/lib/image";

type Step = "idle" | "processing" | "review" | "saving";

export default function AddProductForm({ categories }: { categories: string[] }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultMimeType, setResultMimeType] = useState("image/png");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setStep("processing");

    try {
      const { data, mimeType } = await compressImage(file);
      const res = await fetch("/api/process-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: data, mimeType }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Error procesando la imagen.");
      }

      setName(json.name);
      setDescription(json.description ?? "");
      setCategory(json.category ?? "");
      setResultImage(json.image);
      setResultMimeType(json.mimeType);
      setStep("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
      setStep("idle");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleSave() {
    if (!resultImage) return;
    setStep("saving");
    setError(null);

    try {
      // La imagen sin fondo vuelve de Gemini como PNG pesado; en JPEG ocupa mucho menos.
      const { data, mimeType } = await compressBase64Image(resultImage, resultMimeType);
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          image: data,
          mimeType,
          price: price.trim() === "" ? null : price,
          category: category.trim() === "" ? null : category,
          description: description.trim() === "" ? null : description,
        }),
      });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error ?? "Error guardando el producto.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
      setStep("review");
    }
  }

  function handleRetake() {
    setResultImage(null);
    setName("");
    setPrice("");
    setCategory("");
    setDescription("");
    setStep("idle");
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 text-red-700 text-sm p-3">
          {error}
        </div>
      )}

      {(step === "idle" || step === "processing") && (
        <div className="flex flex-col items-center gap-4">
          <label className="w-full aspect-square rounded-2xl border-2 border-dashed border-line flex flex-col items-center justify-center gap-3 cursor-pointer bg-white hover:border-accent/50 hover:bg-accent-soft/30 transition-colors">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
              disabled={step === "processing"}
            />
            {step === "processing" ? (
              <>
                <div className="h-9 w-9 border-2 border-line border-t-accent rounded-full animate-spin" />
                <p className="text-sm text-ink-soft">
                  Identificando el producto y preparando la foto...
                </p>
              </>
            ) : (
              <>
                <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
                    <path
                      d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5v-9Z"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinejoin="round"
                    />
                    <circle cx="12" cy="13" r="3.25" stroke="currentColor" strokeWidth="1.6" />
                  </svg>
                </span>
                <p className="text-sm text-ink-soft">
                  Tocá para sacar o elegir una foto
                </p>
              </>
            )}
          </label>
        </div>
      )}

      {(step === "review" || step === "saving") && resultImage && (
        <div className="flex flex-col gap-4">
          <div className="w-full aspect-square rounded-2xl border border-line bg-white flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:${resultMimeType};base64,${resultImage}`}
              alt={name}
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-ink">
              Nombre del producto
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
              disabled={step === "saving"}
            />
          </div>

          <div>
            <label htmlFor="product-description" className="text-sm font-medium text-ink">
              Descripción (opcional)
            </label>
            <textarea
              id="product-description"
              rows={2}
              maxLength={200}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Una frase corta para tus clientes"
              className="mt-1 w-full resize-none rounded-lg border border-line px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
              disabled={step === "saving"}
            />
          </div>

          <div>
            <label className="text-sm font-medium text-ink">
              Precio (opcional)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Ej: 2500"
              className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
              disabled={step === "saving"}
            />
          </div>

          {categories.length > 0 && (
            <div>
              <label className="text-sm font-medium text-ink">
                Categoría (opcional)
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="select-field mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition cursor-pointer"
                disabled={step === "saving"}
              >
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleRetake}
              disabled={step === "saving"}
              className="flex-1 rounded-full border border-line py-2.5 text-sm font-medium text-ink hover:bg-paper-soft transition-colors disabled:opacity-50"
            >
              Sacar otra foto
            </button>
            <button
              onClick={handleSave}
              disabled={step === "saving" || !name.trim()}
              className="flex-1 rounded-full bg-ink text-paper py-2.5 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
            >
              {step === "saving" ? "Guardando..." : "Guardar en catálogo"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
