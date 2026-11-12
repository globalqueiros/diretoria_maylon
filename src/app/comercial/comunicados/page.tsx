"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Inbox,
  LoaderCircle,
  Megaphone,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";

type ComunicadoStatus = "Rascunho" | "Publicado" | "Agendado";
type Comunicado = {
  id: string;
  titulo: string;
  categoria: string;
  publico: string;
  mensagem: string;
  status: ComunicadoStatus;
  data: string;
};
type Aba = "Todos" | ComunicadoStatus;

const ABAS: { id: Aba; label: string }[] = [
  { id: "Todos", label: "Todos" },
  { id: "Publicado", label: "Publicados" },
  { id: "Agendado", label: "Agendados" },
  { id: "Rascunho", label: "Rascunhos" },
];

const ESTILO_STATUS: Record<ComunicadoStatus, { texto: string; ponto: string; barra: string }> = {
  Publicado: { texto: "text-emerald-700", ponto: "bg-emerald-500", barra: "bg-emerald-500" },
  Agendado: { texto: "text-sky-700", ponto: "bg-sky-500", barra: "bg-sky-500" },
  Rascunho: { texto: "text-amber-700", ponto: "bg-amber-500", barra: "bg-amber-500" },
};

function formatarData(valor: string, completo = false) {
  const data = new Date(valor);
  if (!valor || Number.isNaN(data.getTime())) return "Data não informada";
  return data.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    ...(completo ? { dateStyle: "long", timeStyle: "short" } : { day: "2-digit", month: "short" }),
  });
}

async function lerResposta(response: Response) {
  const dados = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(dados.erro || dados.mensagem || "Não foi possível concluir a operação.");
  return dados;
}

export default function ComunicadosPage() {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [busca, setBusca] = useState("");
  const [aba, setAba] = useState<Aba>("Todos");
  const [selecionadoId, setSelecionadoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async (manual = false) => {
    if (manual) setAtualizando(true);
    else setCarregando(true);
    setErro("");
    try {
      const response = await fetch("/api/comunicados", { method: "GET", cache: "no-store" });
      const dados = await lerResposta(response);
      setComunicados(Array.isArray(dados.comunicados) ? dados.comunicados : []);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao carregar comunicados.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const contagem = useMemo(() => ({
    Todos: comunicados.length,
    Publicado: comunicados.filter((c) => c.status === "Publicado").length,
    Agendado: comunicados.filter((c) => c.status === "Agendado").length,
    Rascunho: comunicados.filter((c) => c.status === "Rascunho").length,
  }), [comunicados]);

  const lista = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return comunicados.filter((c) => {
      if (aba !== "Todos" && c.status !== aba) return false;
      if (!termo) return true;
      return [c.titulo, c.mensagem, c.categoria, c.publico].some((campo) =>
        campo.toLocaleLowerCase("pt-BR").includes(termo)
      );
    });
  }, [busca, comunicados, aba]);

  const escolhido = comunicados.find((c) => c.id === selecionadoId) ?? null;
  const detalheDesktop = lista.find((c) => c.id === selecionadoId) ?? lista[0] ?? null;

  return (
    <main className="min-h-screen space-y-5 p-4 sm:p-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Comunicados</h1>
          <p className="mt-1 text-sm text-white/90">Avisos internos da plataforma Maylon, em um só lugar.</p>
        </div>
        <button type="button" onClick={() => carregar(true)} disabled={atualizando} className="inline-flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-70">
          <RefreshCw className={`h-4 w-4 ${atualizando ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </header>

      {erro && (
        <div role="alert" className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-800">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
          <span>{erro}</span>
        </div>
      )}

      <section className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-lg shadow-teal-950/10 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full lg:max-w-sm">
          <span className="sr-only">Buscar comunicado</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar por título, categoria ou público" className="w-full rounded-xl bg-slate-100 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-teal-500" />
        </label>
        <div role="tablist" aria-label="Filtrar por status" className="flex gap-1 overflow-x-auto rounded-xl bg-slate-100 p-1">
          {ABAS.map((a) => (
            <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} onClick={() => setAba(a.id)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 ${aba === a.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-800"}`}>
              {a.label}
              <span className={`rounded-full px-1.5 text-xs font-semibold ${aba === a.id ? "bg-teal-600 text-white" : "bg-slate-200 text-slate-600"}`}>{contagem[a.id]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl shadow-teal-950/10">
          <ul className="max-h-[70vh] divide-y divide-slate-100 overflow-y-auto">
            {carregando && (
              <li className="flex flex-col items-center gap-3 px-5 py-14 text-sm text-slate-500">
                <LoaderCircle className="animate-spin text-teal-600" size={26} />
                Carregando comunicados...
              </li>
            )}
            {!carregando && lista.length === 0 && (
              <li className="flex flex-col items-center gap-2 px-5 py-14 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Inbox className="h-6 w-6" />
                </div>
                <p className="font-medium text-slate-900">Nenhum comunicado encontrado</p>
                <p className="text-sm text-slate-500">Tente outra busca ou mude o filtro.</p>
              </li>
            )}
            {!carregando && lista.map((c) => {
              const ativo = detalheDesktop?.id === c.id;
              const estilo = ESTILO_STATUS[c.status];
              return (
                <li key={c.id}>
                  <button type="button" onClick={() => setSelecionadoId(c.id)} aria-current={ativo ? "true" : undefined} className={`relative block w-full px-5 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-500 ${ativo ? "lg:bg-teal-50/60" : "hover:bg-slate-50"}`}>
                    {ativo && <span className={`absolute inset-y-0 left-0 hidden w-1 lg:block ${estilo.barra}`} />}
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-medium text-slate-500">{c.categoria}</span>
                      <span className="text-slate-400">{formatarData(c.data)}</span>
                    </div>
                    <p className="mt-1 font-semibold text-slate-900">{c.titulo}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-slate-500">{c.mensagem}</p>
                    <div className="mt-3 flex items-center gap-3 text-xs">
                      <span className={`inline-flex items-center gap-1.5 font-semibold ${estilo.texto}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${estilo.ponto}`} />
                        {c.status}
                      </span>
                      <span className="inline-flex items-center gap-1 text-slate-500">
                        <Users className="h-3.5 w-3.5" />
                        {c.publico}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <aside className="hidden lg:block">
          <div className="sticky top-6 overflow-hidden rounded-3xl bg-white shadow-xl shadow-teal-950/10">
            {detalheDesktop ? <Detalhe c={detalheDesktop} /> : (
              <div className="flex flex-col items-center gap-2 px-6 py-20 text-center text-slate-500">
                <Megaphone className="h-8 w-8 text-slate-300" />
                <p className="text-sm">Selecione um comunicado para ler.</p>
              </div>
            )}
          </div>
        </aside>
      </section>

      {escolhido && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white lg:hidden">
          <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-slate-100 bg-white/95 px-3 py-3 backdrop-blur">
            <button type="button" onClick={() => setSelecionadoId(null)} className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          </div>
          <Detalhe c={escolhido} />
        </div>
      )}
    </main>
  );
}

function Detalhe({ c }: { c: Comunicado }) {
  const estilo = ESTILO_STATUS[c.status];
  return (
    <article>
      <div className="border-b border-slate-100 px-6 pb-5 pt-6">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">{c.categoria}</span>
          <span className={`inline-flex items-center gap-1.5 font-semibold ${estilo.texto}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${estilo.ponto}`} />
            {c.status}
          </span>
        </div>
        <h2 className="mt-3 break-words text-2xl font-extrabold tracking-tight text-slate-900">{c.titulo}</h2>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-500">
          <div className="flex gap-1.5">
            <dt>Para:</dt>
            <dd className="font-medium text-slate-700">{c.publico}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt>Em:</dt>
            <dd className="font-medium text-slate-700">{formatarData(c.data, true)}</dd>
          </div>
        </dl>
      </div>
      <div className="max-h-[55vh] overflow-y-auto whitespace-pre-wrap break-words px-6 py-6 text-[15px] leading-7 text-slate-700 lg:max-h-[60vh]">{c.mensagem}</div>
    </article>
  );
}