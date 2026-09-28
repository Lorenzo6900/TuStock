"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Logo from "@/components/Logo";

export default function ResetPasswordForm() {
  const token = useSearchParams().get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña tiene que tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/password-reset/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);

    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? "Algo salió mal.");
      setExpired(res.status === 400 && Boolean(json.expired));
      return;
    }
    setDone(true);
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-line px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition";

  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center p-4">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <h1 className="font-serif text-2xl font-semibold text-ink">Contraseña nueva</h1>
        </div>

        <div className="bg-white border border-line rounded-2xl p-6 shadow-sm shadow-black/[0.02]">
          {!token ? (
            <p className="text-sm text-ink text-center">
              Este link no es válido.{" "}
              <Link href="/forgot-password" className="font-medium text-accent">
                Pedí uno nuevo
              </Link>
              .
            </p>
          ) : done ? (
            <div className="text-center flex flex-col gap-4">
              <p className="text-sm text-ink">¡Listo! Ya podés entrar con tu contraseña nueva.</p>
              <Link
                href="/login"
                className="w-full rounded-full bg-ink text-paper py-2.5 text-sm font-medium hover:bg-accent transition-colors"
              >
                Iniciar sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {error && (
                <div className="rounded-lg bg-red-50 text-red-700 text-sm p-3">
                  {error}{" "}
                  {expired && (
                    <Link href="/forgot-password" className="font-medium underline">
                      Pedir otro link
                    </Link>
                  )}
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-ink">Contraseña nueva</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-ink">Repetila</label>
                <input
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className={inputClass}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-1 w-full rounded-full bg-ink text-paper py-2.5 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
              >
                {loading ? "Guardando..." : "Guardar contraseña"}
              </button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}
