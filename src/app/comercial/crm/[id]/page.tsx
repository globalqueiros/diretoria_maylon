"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";

type Deal = {
  id: string;
  title: string;
  contact_name: string;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  stage: string;
  value: number;
  probability?: number | null;
  owner?: string | null;
  source?: string | null;
  product?: string | null;
  produtoChave?: string | null;
  created_at?: string;
};

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function CrmDetalhePage() {
  const params = useParams<{ id: string }>();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch("/api/comercial/crm", { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Erro ao carregar.");
        const encontrado = (data.deals ?? []).find(
          (item: Deal) => String(item.id) === String(params.id)
        );
        if (!encontrado) throw new Error("Oportunidade não encontrada.");
        setDeal(encontrado);
      })
      .catch((error) => setErro(error.message));
  }, [params.id]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl space-y-5">
        <Link
          href="/comercial/crm"
          className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white"
        >
          <ArrowLeft size={16} /> Voltar para o CRM
        </Link>

        {erro && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {erro}
          </div>
        )}

        {deal && (
          <div className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                {deal.title}
              </p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">
                {deal.contact_name}
              </h1>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Info titulo="Etapa" valor={deal.stage} />
              <Info titulo="Valor" valor={moeda.format(Number(deal.value || 0))} />
              <Info titulo="Probabilidade" valor={`${deal.probability ?? 0}%`} />
              <Info titulo="Responsável" valor={deal.owner} />
              <Info titulo="E-mail" valor={deal.email} />
              <Info titulo="Telefone" valor={deal.phone} />
              <Info titulo="Cidade" valor={deal.city} />
              <Info titulo="Origem" valor={deal.source} />
              <Info titulo="Produto" valor={deal.product ?? deal.produtoChave} />
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
