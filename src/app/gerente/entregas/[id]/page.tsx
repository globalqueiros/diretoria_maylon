"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, MapPin, PackageOpen, Phone, User } from "lucide-react";
import { useEffect, useState } from "react";

type Entrega = {
  id: number;
  codigo: string;
  remetente: string;
  remetente_telefone: string;
  motorista: string;
  motorista_telefone: string;
  origem: string;
  destino: string;
  valor: number;
  status: string;
  payment_method: string;
  payment_status: string;
  note: string;
  criado_em: string;
  atualizado_em: string | null;
};

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function EntregaDetalhePage() {
  const params = useParams<{ id: string }>();
  const [entrega, setEntrega] = useState<Entrega | null>(null);
  const [erro, setErro] = useState("");

  useEffect(() => {
    fetch(`/api/entregas/${params.id}`, { cache: "no-store" })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Entrega não encontrada.");
        setEntrega(data.entrega);
      })
      .catch((error) => setErro(error.message));
  }, [params.id]);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-4xl space-y-5">
        <Link
          href="/gerente/entregas"
          className="inline-flex items-center gap-2 rounded-xl bg-white/90 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-white"
        >
          <ArrowLeft size={16} /> Voltar para entregas
        </Link>

        {erro && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {erro}
          </div>
        )}

        {entrega && (
          <div className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Entrega {entrega.codigo}
                </p>
                <h1 className="mt-1 text-2xl font-bold text-slate-900">
                  {entrega.status}
                </h1>
              </div>
              <div className="rounded-xl bg-teal-50 px-4 py-2 text-right">
                <p className="text-xs text-teal-700">Valor</p>
                <p className="text-lg font-bold text-teal-800">
                  {moeda.format(Number(entrega.valor || 0))}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Info icon={<User size={16} />} titulo="Remetente" valor={entrega.remetente} />
              <Info icon={<Phone size={16} />} titulo="Telefone" valor={entrega.remetente_telefone} />
              <Info icon={<User size={16} />} titulo="Motorista" valor={entrega.motorista} />
              <Info icon={<Phone size={16} />} titulo="Telefone do motorista" valor={entrega.motorista_telefone} />
              <Info icon={<MapPin size={16} />} titulo="Origem" valor={entrega.origem} />
              <Info icon={<MapPin size={16} />} titulo="Destino" valor={entrega.destino} />
              <Info icon={<PackageOpen size={16} />} titulo="Pagamento" valor={`${entrega.payment_method || "—"} / ${entrega.payment_status || "—"}`} />
            </div>

            {entrega.note && (
              <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="mb-1 font-semibold">Observação</p>
                {entrega.note}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function Info({
  icon,
  titulo,
  valor,
}: {
  icon: React.ReactNode;
  titulo: string;
  valor?: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        {icon} {titulo}
      </p>
      <p className="mt-1 font-semibold text-slate-800">{valor || "—"}</p>
    </div>
  );
}
