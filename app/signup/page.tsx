"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useState } from "react";
import GoogleIcon from "@/components/GoogleIcon";
import Logo from "@/components/Logo";

export default function Signup() {
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, businessName, email, password }),
    });
    const json = await res.json();

    if (!res.ok) {
      setError(json.error ?? "Algo salió mal.");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", { email, password, redirect: false });
    if (signInRes?.error) {
      setError("Cuenta creada, pero no se pudo iniciar sesión. Probá desde el login.");
      setLoading(false);
      return;
    }

    window.location.href = "/dashboard";
  }

  return (
    <main className="min-h-screen bg-paper flex flex-col items-center justify-center p-4 py-10">
      <div className="mb-8">
        <Logo />
      </div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-7">
          <h1 className="font-serif text-2xl font-semibold text-ink">
            Creá tu cuenta
          </h1>
          <p className="text-sm text-ink-soft mt-1">
            Armá el catálogo de tu negocio
          </p>
        </div>

        <div className="bg-white border border-line rounded-2xl p-6 shadow-sm shadow-black/[0.02] flex flex-col gap-5">
          <button
            onClick={() => signIn("google", { callbackUrl: "/onboarding" })}
            className="w-full flex items-center justify-center gap-3 rounded-full border border-line py-2.5 text-sm font-medium text-ink hover:bg-paper-soft transition-colors"
          >
            <GoogleIcon className="h-5 w-5" />
            Continuar con Google
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs text-ink-soft/70">o con email</span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            {error && (
              <div className="rounded-lg bg-red-50 text-red-700 text-sm p-3">
                {error}
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-ink">Tu nombre</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-ink">
                Nombre del negocio
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Ej: Bar de Lolo"
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
              />
            </div>
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
            <div>
              <label className="text-sm font-medium text-ink">
                Contraseña
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-line px-3 py-2 text-ink focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition"
              />
              <p className="text-xs text-ink-soft/70 mt-1">Mínimo 8 caracteres.</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-1 w-full rounded-full bg-ink text-paper py-2.5 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-ink-soft mt-6">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-medium text-ink hover:text-accent transition-colors">
            Iniciá sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
