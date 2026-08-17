"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useRef, useState } from "react";

type Step = "idle" | "processing" | "review" | "saving";

function fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [, data] = result.split(",");
      resolve({ data, mimeType: file.type });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function AddProduct() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [resultMimeType, setResultMimeType] = useState("image/png");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setStep("processing");

    try {
      const { data, mimeType } = await fileToBase64(file);
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
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, image: resultImage, mimeType: resultMimeType }),
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
    setStep("idle");
  }

  return (
    <main className="min-h-screen bg-paper p-4 sm:p-8">
      <div className="mx-auto max-w-md">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink mb-5 transition-colors"
        >
          ← Volver al catálogo
        </Link>
        <h1 className="font-serif text-2xl font-semibold text-ink mb-6">
          Agregar producto
        </h1>

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
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-2xl">
                    📷
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
      </div>
    </main>
  );
}
