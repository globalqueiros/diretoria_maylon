"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  BadgeDollarSign,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  RefreshCw,
  Search,
  Trophy,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { MetaCelebracao } from "./MetaCelebracao";

/* ───────────── tipos e constantes ───────────── */

type Status = "pago" | "pendente" | "programado" | "cancelado";

type Comissao = {
  id: number | string;
  beneficiario: string;
  perfil: string;
  referencia: string;
  meta: number;
  atingido: number;
  valor: number;
  status: Status;
  progresso: number;
};

type RespostaAPI = {
  comissoes?: Record<string, unknown>[];
  error?: string;
  mensagem?: string;
};

const API = "/api/financeiro/comissoes";
const ROTA_FINANCEIRO = "/financeiro";
const POR_PAGINA = 10;
const CHAVE_DIA = "financeiro:meta-celebrada-dia";

const FOCO =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30";

const CAMPO =
  "rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10";

const STATUS: Record<Status, { rotulo: string; classe: string }> = {
  pago: { rotulo: "Pago", classe: "bg-emerald-50 text-emerald-700" },
  pendente: { rotulo: "Pendente", classe: "bg-amber-50 text-amber-700" },
  programado: { rotulo: "Programado", classe: "bg-sky-50 text-sky-700" },
  cancelado: { rotulo: "Cancelado", classe: "bg-slate-100 text-slate-600" },
};

/* ───────────── utilitários ───────────── */

function semAcento(valor: unknown): string {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function paraNumero(valor: unknown): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  let texto = String(valor ?? "").trim();
  if (!texto) return 0;
  if (texto.includes(",")) texto = texto.replace(/\./g, "").replace(",", ".");
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
}

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function rotuloReferencia(ref: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(ref);
  return m ? `${m[2]}/${m[1]}` : ref;
}

function normalizarStatus(valor: unknown): Status {
  const s = semAcento(valor);
  if (["pago", "paid", "liquidado"].includes(s)) return "pago";
  if (["programado", "agendado"].includes(s)) return "programado";
  if (["cancelado", "canceled", "cancelled"].includes(s)) return "cancelado";
  return "pendente";
}

function normalizarComissao(r: Record<string, unknown>): Comissao {
  const meta = paraNumero(r.meta);
  const atingido = paraNumero(r.atingido);
  return {
    id: (r.id ?? "") as number | string,
    beneficiario: String(r.beneficiario ?? "").trim() || "Sem nome",
    perfil: String(r.perfil ?? "").trim() || "—",
    referencia: String(r.referencia ?? "").trim() || "—",
    meta,
    atingido,
    valor: paraNumero(r.valor),
    status: normalizarStatus(r.status),
    progresso: meta > 0 ? (atingido / meta) * 100 : 0,
  };
}

// Comissões de motoristas que bateram a meta (100% ou mais), da maior para a menor.
// É a mesma conta do card "Metas batidas", então os números sempre combinam.
function batidasDe(lista: Comissao[]): Comissao[] {
  return lista
    .filter(
      (c) =>
        c.status !== "cancelado" &&
        c.progresso >= 100 &&
        semAcento(c.perfil).includes("motorista")
    )
    .sort((x, y) => y.progresso - x.progresso);
}

function hoje(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
}

/* ───────────── página ───────────── */

export default function ComissoesPage() {
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("todos");
  const [referencia, setReferencia] = useState("todas");
  const [pagina, setPagina] = useState(1);
  const [celebrar, setCelebrar] = useState<Comissao[]>([]);

  // Indica se a página ainda está montada, para ignorar respostas que chegam tarde.
  const ativoRef = useRef(true);

  // Uma vez por dia, mostra ao gerente todas as metas batidas (100% ou mais).
  // Aqui só decide se mostra: o dia NÃO é gravado agora, e sim quando o gerente fecha a janela.
  // Comissões canceladas não entram.
  const avaliarMetas = useCallback((lista: Comissao[]) => {
    try {
      const batidas = batidasDe(lista);
      if (batidas.length === 0) return;
      if (window.localStorage.getItem(CHAVE_DIA) === hoje()) return;
      setCelebrar(batidas);
    } catch {
      // Sem acesso ao armazenamento: não celebra, para não repetir a cada carga.
    }
  }, []);

  // O dia só é marcado como visto quando o gerente realmente fechou a janela.
  const fecharCelebracao = useCallback(() => {
    try {
      window.localStorage.setItem(CHAVE_DIA, hoje());
    } catch {
      // ignora: no máximo a janela aparece de novo na próxima visita
    }
    setCelebrar([]);
  }, []);

  const carregar = useCallback(
    async (manual = false) => {
      if (manual) setAtualizando(true);
      else setCarregando(true);
      setErro("");
      try {
        const response = await fetch(API, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });
        const dados: RespostaAPI = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            dados.error || dados.mensagem || "Não foi possível carregar as comissões."
          );
        }
        if (!Array.isArray(dados.comissoes)) {
          throw new Error("A API não retornou uma lista válida de comissões.");
        }
        const lista = dados.comissoes.map(normalizarComissao);
        if (!ativoRef.current) return; // a página já foi fechada: não faz nada
        setComissoes(lista);
        setPagina(1);
        avaliarMetas(lista);
      } catch (e) {
        if (!ativoRef.current) return;
        setErro(e instanceof Error ? e.message : "Erro ao carregar as comissões.");
      } finally {
        if (ativoRef.current) {
          setCarregando(false);
          setAtualizando(false);
        }
      }
    },
    [avaliarMetas]
  );

  useEffect(() => {
    ativoRef.current = true;
    void carregar();
    return () => {
      ativoRef.current = false;
    };
  }, [carregar]);

  const referencias = useMemo(
    () => Array.from(new Set(comissoes.map((c) => c.referencia))).sort().reverse(),
    [comissoes]
  );

  const noPeriodo = useMemo(
    () => (referencia === "todas" ? comissoes : comissoes.filter((c) => c.referencia === referencia)),
    [comissoes, referencia]
  );

  const resumo = useMemo(() => {
    const validas = noPeriodo.filter((c) => c.status !== "cancelado");
    const soma = (lista: Comissao[]) => lista.reduce((t, c) => t + c.valor, 0);
    return {
      aPagar: soma(validas.filter((c) => c.status !== "pago")),
      pagas: soma(validas.filter((c) => c.status === "pago")),
      metasBatidas: batidasDe(noPeriodo).length,
      total: validas.length,
      beneficiarios: new Set(validas.map((c) => c.beneficiario)).size,
    };
  }, [noPeriodo]);

  const filtradas = useMemo(() => {
    const termo = semAcento(busca);
    return noPeriodo.filter((c) => {
      if (status !== "todos" && c.status !== status) return false;
      if (!termo) return true;
      return [c.beneficiario, c.perfil, c.referencia, rotuloReferencia(c.referencia)].some((t) =>
        semAcento(t).includes(termo)
      );
    });
  }, [noPeriodo, busca, status]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const visiveis = filtradas.slice(inicio, inicio + POR_PAGINA);
  const filtrosAtivos = busca !== "" || status !== "todos";
  const batidas = batidasDe(noPeriodo);

  function limparFiltros() {
    setBusca("");
    setStatus("todos");
    setPagina(1);
  }

  const indicadores: {
    rotulo: string;
    valor: string;
    detalhe: string;
    icone: LucideIcon;
    cor: string;
  }[] = [
    {
      rotulo: "A pagar",
      valor: moeda(resumo.aPagar),
      detalhe: "Comissões e bonificações em aberto",
      icone: Wallet,
      cor: "bg-amber-50 text-amber-700",
    },
    {
      rotulo: "Pagas",
      valor: moeda(resumo.pagas),
      detalhe: "No período selecionado",
      icone: CheckCircle2,
      cor: "bg-emerald-50 text-emerald-700",
    },
    {
      rotulo: "Metas batidas",
      valor: String(resumo.metasBatidas),
      detalhe: `de ${resumo.total} comissão(ões)`,
      icone: BadgeDollarSign,
      cor: "bg-teal-50 text-teal-700",
    },
    {
      rotulo: "Motoristas",
      valor: String(resumo.beneficiarios),
      detalhe: "Motoristas com comissão",
      icone: Users,
      cor: "bg-slate-100 text-slate-600",
    },
  ];

  return (
    <main className="min-h-screen space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Comissões e bonificações
          </h1>
          <p className="mt-0 text-sm text-white/90">
            Acompanhe metas, premiações e valores a pagar aos motoristas.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setCelebrar(batidas)}
            disabled={carregando || batidas.length === 0}
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/40 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 ${FOCO}`}
          >
            <Trophy className="h-4 w-4" />
            Ver quem bateu a meta
          </button>
          <button
            type="button"
            onClick={() => void carregar(true)}
            disabled={carregando || atualizando}
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-teal-800 shadow-lg transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60 ${FOCO}`}
          >
            <RefreshCw className={`h-4 w-4 ${atualizando ? "animate-spin" : ""}`} />
            Atualizar
          </button>
        </div>
      </header>

      <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {indicadores.map(({ rotulo, valor, detalhe, icone: Icone, cor }) => (
          <div
            key={rotulo}
            className="rounded-2xl border border-white/20 bg-white p-5 shadow-lg shadow-teal-950/10"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">{rotulo}</p>
              <div className={`rounded-xl p-2.5 ${cor}`}>
                <Icone className="h-5 w-5" />
              </div>
            </div>
            <p className="mt-0 text-2xl font-extrabold text-slate-900 sm:text-3xl">
              {carregando ? "—" : valor}
            </p>
            <p className="mt-1.5 text-xs text-slate-500">{carregando ? " " : detalhe}</p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-teal-950/10">
        <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
            <BadgeDollarSign className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">Comissões</h2>
            <p className="text-xs text-slate-500">
              Metas, valores atingidos e situação do pagamento.
            </p>
          </div>
        </div>

        <div className="grid gap-3 border-b border-slate-100 p-5 md:grid-cols-2 xl:grid-cols-[1fr_auto_auto]">
          <label className="relative block w-full md:col-span-2 xl:col-span-1">
            <span className="sr-only">Pesquisar comissão</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por motorista ou referência..."
              className={`${CAMPO} w-full py-3 pl-10 pr-4 placeholder:text-slate-400`}
            />
          </label>
          <label>
            <span className="sr-only">Mês de referência</span>
            <select
              value={referencia}
              onChange={(e) => {
                setReferencia(e.target.value);
                setPagina(1);
              }}
              className={`${CAMPO} w-full cursor-pointer`}
            >
              <option value="todas">Todos os meses</option>
              {referencias.map((r) => (
                <option key={r} value={r}>
                  {rotuloReferencia(r)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="sr-only">Situação</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagina(1);
              }}
              className={`${CAMPO} w-full cursor-pointer`}
            >
              <option value="todos">Todas as situações</option>
              {(Object.keys(STATUS) as Status[]).map((s) => (
                <option key={s} value={s}>
                  {STATUS[s].rotulo}
                </option>
              ))}
            </select>
          </label>
        </div>

        {carregando ? (
          <div className="space-y-5 p-6" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-4">
                <div className="h-10 w-10 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-48 rounded bg-slate-100" />
                  <div className="h-3 w-32 rounded bg-slate-100" />
                </div>
                <div className="h-3 w-20 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : erro ? (
          <div role="alert" className="m-5 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-600" />
            <p className="text-sm font-medium text-red-700">{erro}</p>
            <button
              type="button"
              onClick={() => void carregar()}
              className={`mt-3 cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-red-700 underline ${FOCO}`}
            >
              Tentar novamente
            </button>
          </div>
        ) : filtradas.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center sm:py-20">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-teal-700">
              <FileText className="h-9 w-9" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {filtrosAtivos ? "Nenhuma comissão encontrada" : "Nenhuma comissão no período"}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {filtrosAtivos
                ? "Altere ou limpe os filtros para ver outras comissões."
                : "Quando houver comissões lançadas, elas aparecem aqui."}
            </p>
            {filtrosAtivos && (
              <button
                type="button"
                onClick={limparFiltros}
                className={`mt-5 cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 ${FOCO}`}
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-4">Motoristas</th>
                    <th scope="col" className="px-5 py-4">Referência</th>
                    <th scope="col" className="px-5 py-4 text-right">Meta</th>
                    <th scope="col" className="px-5 py-4 text-right">Atingido</th>
                    <th scope="col" className="px-5 py-4">Meta atingida</th>
                    <th scope="col" className="px-5 py-4">Situação</th>
                    <th scope="col" className="px-5 py-4 text-right">Comissão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visiveis.map((c) => {
                    const batida = c.progresso >= 100;
                    return (
                      <tr key={`${c.id}-${c.beneficiario}`} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-sm font-bold text-teal-700">
                              {c.beneficiario.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="max-w-[240px] truncate font-semibold text-slate-900">
                                {c.beneficiario}
                              </p>
                              <p className="text-xs capitalize text-slate-500">{c.perfil}</p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {rotuloReferencia(c.referencia)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right text-slate-700">
                          {moeda(c.meta)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-slate-900">
                          {moeda(c.atingido)}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex min-w-[140px] items-center gap-3">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${batida ? "bg-emerald-500" : "bg-amber-500"}`}
                                style={{ width: `${Math.min(c.progresso, 100)}%` }}
                              />
                            </div>
                            <span
                              className={`w-14 text-right text-xs font-semibold ${
                                batida ? "text-emerald-700" : "text-slate-600"
                              }`}
                            >
                              {c.progresso.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${STATUS[c.status].classe}`}
                          >
                            {STATUS[c.status].rotulo}
                          </span>
                        </td>
                        <td
                          className={`whitespace-nowrap px-5 py-4 text-right font-semibold ${
                            c.status === "cancelado" ? "text-slate-400 line-through" : "text-slate-900"
                          }`}
                        >
                          {moeda(c.valor)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <footer className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Mostrando <b className="text-slate-800">{inicio + 1}</b> até{" "}
                <b className="text-slate-800">
                  {Math.min(inicio + POR_PAGINA, filtradas.length)}
                </b>{" "}
                de <b className="text-slate-800">{filtradas.length}</b> comissões
              </p>
              <nav aria-label="Paginação" className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPagina(paginaAtual - 1)}
                  disabled={paginaAtual <= 1}
                  className={`inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${FOCO}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <span className="whitespace-nowrap text-sm text-slate-600">
                  Página <b className="text-slate-900">{paginaAtual}</b> de{" "}
                  <b className="text-slate-900">{totalPaginas}</b>
                </span>
                <button
                  type="button"
                  onClick={() => setPagina(paginaAtual + 1)}
                  disabled={paginaAtual >= totalPaginas}
                  className={`inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${FOCO}`}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            </footer>
          </>
        )}
      </section>

      {celebrar.length > 0 && (
        <MetaCelebracao
          metas={celebrar.map((c) => ({
            nome: c.beneficiario,
            progresso: c.progresso,
            detalhe: rotuloReferencia(c.referencia),
          }))}
          aoFechar={fecharCelebracao}
        />
      )}
    </main>
  );
}