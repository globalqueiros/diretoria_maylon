"use client";

import { useEffect, useState } from "react";

type Dashboard = {
  leads?: { valor: number };
  clientes?: { valor: number };
  propostas?: { valor: number };
  vendas?: { valor: number };
  faturamento?: { valor: number };
  conversao?: { valor: number };
};

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function RelatoriosComerciaisPage() {
  const [dados, setDados] = useState<Dashboard | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/comercial/dashboard?periodo=mes", { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Erro ao carregar.");
        setDados(json);
      })
      .catch((error) => setErro(error.message));
  }, []);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Relatórios comerciais</h1>
          <p className="mt-1 text-sm text-slate-500">
            Resumo do mês atual.
          </p>
        </div>

        {erro && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {erro}
          </div>
        )}

        {dados && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Card titulo="Leads" valor={String(dados.leads?.valor ?? 0)} />
            <Card titulo="Clientes" valor={String(dados.clientes?.valor ?? 0)} />
            <Card titulo="Propostas" valor={String(dados.propostas?.valor ?? 0)} />
            <Card titulo="Vendas" valor={String(dados.vendas?.valor ?? 0)} />
            <Card titulo="Faturamento" valor={moeda.format(Number(dados.faturamento?.valor ?? 0))} />
            <Card titulo="Conversão" valor={`${dados.conversao?.valor ?? 0}%`} />
          </div>
        )}
      </div>
    </main>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-slate-500">{titulo}</p>
      <p className="mt-2 text-2xl font-extrabold text-slate-900">{valor}</p>
    </div>
  );
}
