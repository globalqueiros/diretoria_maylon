"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Status = "pendente" | "aprovada" | "recusada";

type Cotacao = {
  id: number;
  protocolo: string;
  nome: string;
  empresa: string;
  email: string;
  whatsapp: string;
  mensagem: string | null;
  publicos: string[];
  espacos: string[];
  semanas: number;
  segmentado: boolean;
  criacao: boolean;
  total: number;
  status: Status;
  observacao_gerente: string | null;
  criado_por: string | null;
  decidido_por: string | null;
  decidido_em: string | null;
  criado_em: string;
};

const STATUS_INFO: Record<Status, { rotulo: string; classe: string }> = {
  pendente: { rotulo: "Aguardando aprovação", classe: "bg-amber-100 text-amber-800 ring-amber-200" },
  aprovada: { rotulo: "Aprovada", classe: "bg-emerald-100 text-emerald-800 ring-emerald-200" },
  recusada: { rotulo: "Recusada", classe: "bg-red-100 text-red-800 ring-red-200" },
};

const ESPACO_NOME: Record<string, string> = {
  banner_home: "Banner na tela inicial",
  popup: "Pop-up ao abrir o app",
  viagem: "Banner durante a corrida",
  pass: "Destaque no Maylon Pass",
  push: "Notificação push",
};

const PUBLICO_NOME: Record<string, string> = {
  passageiros: "Passageiros",
  motoristas: "Motoristas",
};

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const data = (s: string | null) =>
  s ? new Date(s).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "–";

function Selo({ status }: { status: Status }) {
  const i = STATUS_INFO[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${i.classe}`}>
      {i.rotulo}
    </span>
  );
}

export default function GerenteCotacoesPage() {
  const [lista, setLista] = useState<Cotacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [filtro, setFiltro] = useState<"todas" | Status>("todas");
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [aberta, setAberta] = useState<Cotacao | null>(null);
  const [obs, setObs] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState("");

  const POR_PAGINA = 10;

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const res = await fetch("/api/comercial/cotacoes", { cache: "no-store" });
      if (!res.ok) throw new Error();
      const json = await res.json();
      setLista(Array.isArray(json) ? json : []);
    } catch {
      setErro("Não foi possível carregar as cotações. Tente de novo.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void carregar(), 0);
    return () => clearTimeout(timer);
  }, [carregar]);

  const contagem = useMemo(
    () => ({
      pendente: lista.filter((c) => c.status === "pendente").length,
      aprovada: lista.filter((c) => c.status === "aprovada").length,
      recusada: lista.filter((c) => c.status === "recusada").length,
    }),
    [lista]
  );

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return lista.filter(
      (c) =>
        (filtro === "todas" || c.status === filtro) &&
        (!q ||
          c.empresa.toLowerCase().includes(q) ||
          c.nome.toLowerCase().includes(q) ||
          c.protocolo.toLowerCase().includes(q))
    );
  }, [lista, filtro, busca]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtradas.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);

  function abrir(c: Cotacao) {
    setAberta(c);
    setObs("");
    setErroModal("");
  }

  async function decidir(status: "aprovada" | "recusada") {
    if (!aberta) return;
    if (status === "recusada" && !obs.trim()) {
      setErroModal("Informe o motivo da recusa.");
      return;
    }
    setSalvando(true);
    setErroModal("");
    try {
      const res = await fetch(`/api/comercial/cotacoes/${aberta.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, observacao: obs }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Falha ao salvar.");
      setAberta(null);
      await carregar();
    } catch (e) {
      setErroModal(e instanceof Error ? e.message : "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  const abas: { id: "todas" | Status; rotulo: string; n: number }[] = [
    { id: "todas", rotulo: "Todas", n: lista.length },
    { id: "pendente", rotulo: "Aguardando", n: contagem.pendente },
    { id: "aprovada", rotulo: "Aprovadas", n: contagem.aprovada },
    { id: "recusada", rotulo: "Recusadas", n: contagem.recusada },
  ];

  return (
    <div className="mx-auto max-w-8xl space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-xl font-semibold text-white sm:text-2xl">Cotações de publicidade</h1>
        <p className="mt-0 text-sm text-white">
          Aprove ou recuse as propostas de anúncio enviadas pelo comercial.
        </p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {(["pendente", "aprovada", "recusada"] as Status[]).map((s) => (
          <div key={s} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <Selo status={s} />
            <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-900">{contagem[s]}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filtrar por status">
          {abas.map((a) => (
            <button
              key={a.id}
              role="tab"
              aria-selected={filtro === a.id}
              onClick={() => {
                setFiltro(a.id);
                setPagina(1);
              }}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35aa8a] ${
                filtro === a.id
                  ? "bg-[#35aa8a] text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
              }`}
            >
              {a.rotulo} <span className="opacity-80">({a.n})</span>
            </button>
          ))}
        </div>
        <input
          aria-label="Buscar cotação"
          placeholder="Buscar por empresa, nome ou protocolo"
          value={busca}
          onChange={(e) => {
            setBusca(e.target.value);
            setPagina(1);
          }}
          className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm focus:border-[#35aa8a] focus:outline-none focus:ring-2 focus:ring-[#35aa8a]/30 lg:w-80"
        />
      </div>

      {erro && (
        <div role="alert" className="flex items-center justify-between rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {erro}
          <button onClick={carregar} className="font-semibold underline">
            Tentar de novo
          </button>
        </div>
      )}

      {/* Tabela (md+) */}
      <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Protocolo</th>
              <th className="px-4 py-3 font-medium">Anunciante</th>
              <th className="px-4 py-3 text-right font-medium">Valor</th>
              <th className="px-4 py-3 font-medium">Recebida em</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Decisão</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {carregando && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  Carregando cotações...
                </td>
              </tr>
            )}
            {!carregando && visiveis.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-slate-500">
                  Nenhuma cotação encontrada.
                </td>
              </tr>
            )}
            {visiveis.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50">
                <td className="px-4 py-3 font-medium tabular-nums">{c.protocolo}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900">{c.empresa}</p>
                  <p className="text-xs text-slate-500">{c.nome}</p>
                </td>
                <td className="px-4 py-3 text-right tabular-nums">{brl(c.total)}</td>
                <td className="px-4 py-3 text-slate-600">{data(c.criado_em)}</td>
                <td className="px-4 py-3">
                  <Selo status={c.status} />
                </td>
                <td className="px-4 py-3 text-xs text-slate-600">
                  {c.status === "pendente" ? (
                    "–"
                  ) : (
                    <>
                      {c.decidido_por && <span className="block">{c.decidido_por}</span>}
                      <span className="block">{data(c.decidido_em)}</span>
                    </>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => abrir(c)}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-[#1f8a6c] ring-1 ring-[#35aa8a]/40 hover:bg-[#35aa8a]/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35aa8a]"
                  >
                    {c.status === "pendente" ? "Analisar" : "Ver"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cards (mobile) */}
      <div className="space-y-3 md:hidden">
        {carregando && <p className="py-8 text-center text-sm text-slate-500">Carregando cotações...</p>}
        {!carregando && visiveis.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">Nenhuma cotação encontrada.</p>
        )}
        {visiveis.map((c) => (
          <button
            key={c.id}
            onClick={() => abrir(c)}
            className="w-full rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35aa8a]"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-medium text-slate-900">{c.empresa}</p>
                <p className="text-xs text-slate-500">
                  {c.protocolo} · {data(c.criado_em)}
                </p>
              </div>
              <Selo status={c.status} />
            </div>
            <p className="mt-3 text-lg font-semibold tabular-nums">{brl(c.total)}</p>
          </button>
        ))}
      </div>

      {/* Paginação */}
      {filtradas.length > POR_PAGINA && (
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Página {paginaAtual} de {totalPaginas}
          </span>
          <div className="flex gap-2">
            <button
              disabled={paginaAtual === 1}
              onClick={() => setPagina(paginaAtual - 1)}
              className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              disabled={paginaAtual === totalPaginas}
              onClick={() => setPagina(paginaAtual + 1)}
              className="rounded-lg bg-white px-3 py-1.5 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      )}

      {/* Modal de análise */}
      {aberta && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Cotação ${aberta.protocolo}`}
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-0 sm:items-center sm:p-4"
          onClick={() => setAberta(null)}
        >
          <div
            className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{aberta.empresa}</h2>
                <p className="text-sm text-slate-500">{aberta.protocolo}</p>
              </div>
              <Selo status={aberta.status} />
            </div>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Contato</dt>
                <dd className="text-right">
                  {aberta.nome}
                  <span className="block text-xs text-slate-500">{aberta.email}</span>
                  <span className="block text-xs text-slate-500">{aberta.whatsapp}</span>
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Público</dt>
                <dd className="text-right">
                  {aberta.publicos.map((p) => PUBLICO_NOME[p] ?? p).join(" e ")}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Espaços</dt>
                <dd className="text-right">{aberta.espacos.map((e) => ESPACO_NOME[e] ?? e).join(", ")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Duração</dt>
                <dd>
                  {aberta.semanas} {aberta.semanas === 1 ? "semana" : "semanas"}
                </dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Extras</dt>
                <dd className="text-right">
                  {[aberta.segmentado && "Segmentado por região", aberta.criacao && "Criação do material"]
                    .filter(Boolean)
                    .join(", ") || "Nenhum"}
                </dd>
              </div>
              {aberta.criado_por && (
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Criada por</dt>
                  <dd className="text-right">{aberta.criado_por}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4 border-t border-slate-100 pt-3">
                <dt className="font-medium">Valor total</dt>
                <dd className="font-semibold tabular-nums">{brl(aberta.total)}</dd>
              </div>
              {aberta.mensagem && (
                <div>
                  <dt className="text-slate-500">O que quer divulgar</dt>
                  <dd className="mt-1 rounded-lg bg-slate-50 p-3">{aberta.mensagem}</dd>
                </div>
              )}
            </dl>

            {aberta.status === "pendente" ? (
              <div className="mt-6">
                <label htmlFor="obs" className="mb-1.5 block text-sm font-medium">
                  Observação (obrigatória para recusar)
                </label>
                <textarea
                  id="obs"
                  rows={3}
                  value={obs}
                  onChange={(e) => setObs(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-[#35aa8a] focus:outline-none focus:ring-2 focus:ring-[#35aa8a]/30"
                />
                {erroModal && (
                  <p role="alert" className="mt-2 text-sm text-red-600">
                    {erroModal}
                  </p>
                )}
                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => setAberta(null)}
                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100"
                  >
                    Fechar
                  </button>
                  <button
                    disabled={salvando}
                    onClick={() => decidir("recusada")}
                    className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                  >
                    Recusar
                  </button>
                  <button
                    disabled={salvando}
                    onClick={() => decidir("aprovada")}
                    className="rounded-lg bg-[#35aa8a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#2c937a] disabled:opacity-60"
                  >
                    {salvando ? "Salvando..." : "Aprovar"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-lg bg-slate-50 p-4 text-sm">
                <p className="font-medium">
                  {aberta.status === "aprovada" ? "Aprovada" : "Recusada"}
                  {aberta.decidido_por ? ` por ${aberta.decidido_por}` : ""} em {data(aberta.decidido_em)}
                </p>
                {aberta.observacao_gerente && (
                  <p className="mt-1 text-slate-600">{aberta.observacao_gerente}</p>
                )}
                <button
                  onClick={() => setAberta(null)}
                  className="mt-4 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-white"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
