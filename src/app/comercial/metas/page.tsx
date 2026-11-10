"use client";

import { useEffect, useState } from "react";

type Meta = {
  id: number | string;
  titulo: string;
  tipo?: string;
  valorMeta?: number;
  valorAtual?: number;
  inicio?: string;
  fim?: string;
  status?: string;
};

type Cidade = { cidade: string; meta: number; realizado: number };

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export default function MetasComerciaisPage() {
  const [metas, setMetas] = useState<Meta[]>([]);
  const [cidades, setCidades] = useState<Cidade[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    Promise.all([
      fetch("/api/metas", { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/gerente/meta-mes", { cache: "no-store" }).then((r) => r.json()),
    ])
      .then(([metasJson, cidadesJson]) => {
        setMetas(Array.isArray(metasJson) ? metasJson : []);
        setCidades(Array.isArray(cidadesJson.cidades) ? cidadesJson.cidades : []);
      })
      .catch(() => setErro("Não foi possível carregar as metas."));
  }, []);

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Metas comerciais</h1>
          <p className="mt-1 text-sm text-slate-500">
            Acompanhe as metas gerais e o desempenho por cidade.
          </p>
        </div>

        {erro && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {erro}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Metas cadastradas</h2>
            {metas.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Nenhuma meta cadastrada.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {metas.map((meta) => (
                  <li key={meta.id} className="py-3">
                    <p className="font-semibold text-slate-800">{meta.titulo}</p>
                    <p className="text-xs text-slate-500">
                      {moeda.format(Number(meta.valorMeta ?? 0))} de{" "}
                      {moeda.format(Number(meta.valorAtual ?? 0))}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="font-bold text-slate-900">Desempenho por cidade</h2>
            {cidades.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">Nenhuma meta por cidade.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {cidades.map((cidade) => (
                  <li key={cidade.cidade} className="py-3">
                    <p className="font-semibold text-slate-800">{cidade.cidade}</p>
                    <p className="text-xs text-slate-500">
                      {cidade.realizado} de {cidade.meta}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
