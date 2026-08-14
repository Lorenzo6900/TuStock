"use client";

import { useState } from "react";

export default function OnboardingForm() {
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ businessName }),
    });

    if (!res.ok) {
      const json = await res.json();
      setError(json.error ?? "Algo salió mal.");
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      {error && (
        <div className="rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</div>
      )}
      <div>
        <label className="text-sm font-medium text-ink">
          Nombre del negocio
        </label>
        <input
          type="text"
          required
          autoFocus
          value={businessName}
          onChange={(e) => setBusinessName(e.target.value)}
          placeholder="Ej: Bar de Lolo"
          className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
        />
        <p className="text-xs text-ink-soft/70 mt-1">
          Va a definir la URL de tu catálogo público.
        </p>
      </div>
      <button
        type="submit"
        disabled={loading}
        className="mt-1 w-full rounded-full bg-ink text-paper py-2.5 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
      >
        {loading ? "Guardando..." : "Continuar"}
      </button>
    </form>
  );
}
