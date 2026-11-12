"use client";

import Link from "next/link";
import { ArrowLeft, History, Percent, RefreshCw, Save, Wallet } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Regra = {
  id: number;
  chave: string;
  nome: string;
  percentual: number;
  ativo: boolean;
  vigenciaInicio: string | null;
  vigenciaFim: string | null;
  atualizadoPor: string | null;
  atualizadoEm: string | null;
};

type Historico = {
  id: number;
  regraNome: string;
  percentualAnterior: number;
  percentualNovo: number;
  alteradoPor: string | null;
  alteradoEm: string | null;
};

export default function RegrasComissoesPage() {
  const [regras, setRegras] = useState<Regra[]>([]);
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [editadas, setEditadas] = useState<Record<number, Partial<Regra>>>({});
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const [regrasRes, historicoRes] = await Promise.all([
        fetch("/api/comissoes/regras", { cache: "no-store" }),
        fetch("/api/comissoes/regras/historico", { cache: "no-store" }),
      ]);

      const regrasJson = await regrasRes.json().catch(() => ({}));
      const historicoJson = await historicoRes.json().catch(() => ({}));

      if (!regrasRes.ok) throw new Error(regrasJson?.error || "Erro ao carregar regras.");

      setRegras(Array.isArray(regrasJson.regras) ? regrasJson.regras : []);
      setHistorico(
        Array.isArray(historicoJson.historico) ? historicoJson.historico : []
      );
      setEditadas({});
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao carregar regras.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void carregar();
    }, 0);

    return () => clearTimeout(timer);
  }, [carregar]);

  function valor<K extends keyof Regra>(regra: Regra, campo: K): Regra[K] {
    const editada = editadas[regra.id];
    return (editada && campo in editada ? editada[campo] : regra[campo]) as Regra[K];
  }

  function alterar(regra: Regra, campo: keyof Regra, valorCampo: unknown) {
    setEditadas((atual) => ({
      ...atual,
      [regra.id]: { ...(atual[regra.id] ?? {}), [campo]: valorCampo },
    }));
  }

  async function salvar(regra: Regra) {
    setSalvando(regra.id);
    setErro("");
    setAviso("");

    try {
      const response = await fetch(`/api/comissoes/regras/${regra.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          percentual: Number(valor(regra, "percentual")),
          ativo: Boolean(valor(regra, "ativo")),
          vigenciaInicio: valor(regra, "vigenciaInicio"),
          vigenciaFim: valor(regra, "vigenciaFim"),
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Não foi possível salvar a regra.");
      }

      setAviso(`Regra "${regra.nome}" atualizada.`);
      await carregar();
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao salvar regra.");
    } finally {
      setSalvando(null);
    }
  }

  return (
    <main className="min-h-screen p-4 sm:p-6">
      <div className="mx-auto max-w-6xl space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Link
              href="/diretor/comercial"
              className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-white/90 hover:text-white"
            >
              <ArrowLeft size={16} /> Voltar para Comercial
            </Link>
            <h1 className="flex items-center gap-2 text-2xl font-extrabold text-white sm:text-3xl">
              <Wallet size={24} /> Regras de comissão
            </h1>
            <p className="mt-1 text-sm text-white/85">
              Defina os percentuais aplicados às comissões comerciais. Alterações valem apenas para novos lançamentos.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void carregar()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 shadow-sm hover:bg-teal-50"
          >
            <RefreshCw size={16} className={carregando ? "animate-spin" : ""} />
            Atualizar
          </button>
        </div>

        {erro && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {erro}
          </div>
        )}

        {aviso && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {aviso}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <Percent size={19} />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Percentuais por produto</h2>
              <p className="text-xs text-slate-500">Valor bruto da venda. Percentual entre 0 e 100.</p>
            </div>
          </div>

          {carregando ? (
            <div className="p-8 text-center text-sm text-slate-500">Carregando regras...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Produto</th>
                    <th className="px-4 py-3 font-semibold">Percentual</th>
                    <th className="px-4 py-3 font-semibold">Ativo</th>
                    <th className="px-4 py-3 font-semibold">Início</th>
                    <th className="px-4 py-3 font-semibold">Fim</th>
                    <th className="px-4 py-3 font-semibold">Atualizado</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {regras.map((regra) => (
                    <tr key={regra.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-900">{regra.nome}</p>
                        <p className="text-xs text-slate-400">{regra.chave}</p>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={Number(valor(regra, "percentual"))}
                            onChange={(e) => alterar(regra, "percentual", Number(e.target.value))}
                            className="w-24 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
                          />
                          <span className="font-semibold text-slate-500">%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={Boolean(valor(regra, "ativo"))}
                          onChange={(e) => alterar(regra, "ativo", e.target.checked)}
                          className="h-4 w-4 accent-teal-600"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="date"
                          value={valor(regra, "vigenciaInicio") ?? ""}
                          onChange={(e) => alterar(regra, "vigenciaInicio", e.target.value || null)}
                          className="rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-teal-500"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <input
                          type="date"
                          value={valor(regra, "vigenciaFim") ?? ""}
                          onChange={(e) => alterar(regra, "vigenciaFim", e.target.value || null)}
                          className="rounded-lg border border-slate-200 px-2 py-2 text-xs outline-none focus:border-teal-500"
                        />
                      </td>
                      <td className="px-4 py-4 text-xs text-slate-500">
                        {regra.atualizadoEm
                          ? `${new Date(regra.atualizadoEm).toLocaleDateString("pt-BR")}${
                              regra.atualizadoPor ? ` · ${regra.atualizadoPor}` : ""
                            }`
                          : "—"}
                      </td>
                      <td className="px-4 py-4">
                        <button
                          type="button"
                          disabled={salvando === regra.id}
                          onClick={() => void salvar(regra)}
                          className="inline-flex items-center gap-2 rounded-lg bg-teal-600 px-3 py-2 text-xs font-bold text-white hover:bg-teal-700 disabled:opacity-50"
                        >
                          <Save size={14} />
                          {salvando === regra.id ? "Salvando..." : "Salvar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2">
            <History size={18} className="text-slate-500" />
            <h2 className="font-bold text-slate-900">Histórico de alterações</h2>
          </div>

          {historico.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">Nenhuma alteração registrada.</p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {historico.map((item) => (
                <li key={item.id} className="flex flex-col gap-1 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span className="font-semibold text-slate-800">{item.regraNome}</span>
                  <span className="text-slate-600">
                    {item.percentualAnterior}% → {item.percentualNovo}%
                  </span>
                  <span className="text-xs text-slate-400">
                    {item.alteradoEm
                      ? new Date(item.alteradoEm).toLocaleString("pt-BR")
                      : "—"}
                    {item.alteradoPor ? ` · ${item.alteradoPor}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
