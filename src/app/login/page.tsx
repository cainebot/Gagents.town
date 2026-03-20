"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Terminal, Lock, AlertCircle } from "lucide-react";

function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        const from = searchParams.get("from") || "/";
        router.push(from);
        router.refresh();
      } else {
        setError("Contraseña incorrecta");
      }
    } catch {
      setError("Error de conexión");
    }

    setLoading(false);
  };

  return (
    <div className="rounded-xl p-10 bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
      {/* Header */}
      <div className="text-center mb-6 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2.5">
          <Terminal
            className="w-7 h-7 text-[var(--brand-600)]"
          />
          <span className="text-2xl">🦞</span>
          <h1
            className="text-xl font-bold font-display text-[var(--text-primary-900)] tracking-tight"
          >
            Mission Control
          </h1>
        </div>
        <p className="text-sm text-[var(--text-secondary-700)]">
          Introduce la contraseña para acceder
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="relative">
          <Lock
            className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--text-quaternary-500)]"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-lg text-sm bg-[var(--bg-tertiary)] border border-[var(--border-primary)] text-[var(--text-primary-900)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-600)]"
            placeholder="Contraseña"
            required
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg bg-[var(--error-600)]/10 text-[var(--error-600)]">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 bg-[var(--brand-600)] text-white hover:bg-[var(--brand-700)]"
        >
          {loading ? "Verificando..." : "Entrar"}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-xs mt-6 text-[var(--text-quaternary-500)]">
        Tenacitas Agent Dashboard
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-primary)]">
      <div className="w-full max-w-md">
        <Suspense fallback={
          <div className="rounded-xl p-10 animate-pulse bg-[var(--bg-secondary)] border border-[var(--border-primary)]">
            <div className="h-8 bg-gray-700 rounded mb-4" />
            <div className="h-12 bg-gray-700 rounded mb-4" />
            <div className="h-10 bg-gray-700 rounded" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
