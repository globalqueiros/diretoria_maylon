"use client";

import Link from "next/link";
import { Settings, User } from "lucide-react";

export default function ConfiguracoesComercialPage() {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl space-y-5">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
            <Settings size={22} /> Configurações
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Preferências gerais da conta comercial.
          </p>

          <Link
            href="/comercial/perfil"
            className="mt-5 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <User size={16} /> Editar perfil
          </Link>
        </div>
      </div>
    </main>
  );
}
