"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "@/components/Logo";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/password-reset/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Algo salió mal.");
      return;
    }
    setSent(true);
  }

  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <h1 className="font-serif text-2xl font-semibold text-ink">
            Recuperar contraseña
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            Te mandamos un link para elegir una nueva
          </p>
        </div>

        <div className="bg-white border border-line rounded-2xl p-6 shadow-sm shadow-black/[0.02]">
          {sent ? (
            <div className="text-center flex flex-col gap-2">
              <div className="text-3xl">📬</div>
              <p className="text-sm text-ink">
                Si <span className="font-medium">{email}</span> tiene una cuenta, te
                llega un mail con el link en unos minutos.
              </p>
              <p className="text-xs text-ink-soft">
                Revisá también la carpeta de spam. El link vence en 1 hora.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {error && (
                <div className="rounded-lg bg-red-50 text-red-700 text-sm p-3">{error}</div>
              )}
              <div>
                <label className="text-sm font-medium text-ink">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-full bg-ink text-paper py-2.5 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
              >
                {loading ? "Enviando..." : "Mandarme el link"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-sm text-ink-soft mt-6">
          <Link href="/login" className="font-medium text-ink hover:text-accent transition-colors">
            ← Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
