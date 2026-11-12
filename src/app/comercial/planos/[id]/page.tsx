"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

type Usuario = {
  id: number;
  full_name: string;
  email: string;
  phone?: string | null;
  plano: string;
  valor: number;
  status: string;
  created_at?: string | null;
};

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function PlanoDetalhePage() {
  const params = useParams<{ id: string }>();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/maylon-pass", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Erro ao carregar assinante.");
        const encontrado = (data.usuarios ?? []).find(
          (item: Usuario) => String(item.id) === String(params.id)
        );
        if (!encontrado) throw new Error("Assinante não encontrado.");
        setUsuario(encontrado);
      })
      .catch((error) => setErro(error.message));
  }, [params.id]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl space-y-5">
        <Link
          href="/comercial/planos"
          className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white"
        >
          <ArrowLeft size={16} /> Voltar para planos
        </Link>

        {erro && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {erro}
          </div>
        )}

        {usuario && (
          <div className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                Assinante Maylon Pass
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                {usuario.full_name}
              </h1>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Info titulo="E-mail" valor={usuario.email} />
              <Info titulo="Telefone" valor={usuario.phone} />
              <Info titulo="Plano" valor={usuario.plano} />
              <Info titulo="Valor" valor={moeda.format(Number(usuario.valor || 0))} />
              <Info titulo="Status" valor={usuario.status} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function Info({ titulo, valor }: { titulo: string; valor?: string | null }) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="text-xs font-semibold text-slate-500">{titulo}</p>
      <p className="mt-1 font-semibold text-slate-800">{valor || "—"}</p>
    </div>
  );
}
