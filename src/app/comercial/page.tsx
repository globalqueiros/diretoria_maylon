"use client";

import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  ChartNoAxesCombined,
  ChevronRight,
  Clock3,
  Handshake,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  UserPlus,
  Wallet,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

/* -------------------------------------------------------------------------- */
/* Tipos da resposta de /api/comercial/dashboard                              */
/* -------------------------------------------------------------------------- */

type Tendencia = "alta" | "baixa" | "estavel";

interface Indicador {
  valor: number;
  variacao?: number;
  tendencia?: Tendencia;
}

interface MetaComercial {
  meta: number;
  realizado: number;
}

interface VendaPorMes {
  mes: string;
  vendas: number;
  meta?: number;
}

interface DesempenhoCidade {
  cidade: string;
  vendas: number;
  meta: number;
  faturamento?: number;
}

// Item da tabela "Metas". A API pode devolver `metas` no dashboard;
// se não devolver, a tabela é montada com a meta geral e as cidades.
interface MetaItem {
  id: string | number;
  titulo: string;
  escopo?: string | null; // ex.: "Geral", "Santos", nome do vendedor
  prazo?: string | null; // data final da meta (ISO)
  meta: number;
  realizado: number;
  unidade?: "moeda" | "numero";
}

interface DashboardComercial {
  leads: Indicador;
  clientes: Indicador;
  propostas: Indicador;
  vendas: Indicador;
  faturamento: Indicador;
  conversao: Indicador;
  meta: MetaComercial;
  vendas_por_mes: VendaPorMes[];
  desempenho_cidades: DesempenhoCidade[];
  metas?: MetaItem[];
  atualizado_em?: string;
}

interface Usuario {
  first_name?: string;
  last_name?: string;
  full_name?: string;
}

/* -------------------------------------------------------------------------- */
/* Utilitários                                                                */
/* -------------------------------------------------------------------------- */

const numeroBR = new Intl.NumberFormat("pt-BR");
const moedaBR = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

function percentual(realizado: number, meta: number) {
  return meta > 0 ? Math.round((realizado / meta) * 100) : 0;
}

function formatarData(valor?: string | null) {
  if (!valor) return "—";
  const data = new Date(valor);
  return Number.isNaN(data.getTime())
    ? "—"
    : data.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatarValorMeta(valor: number, unidade?: "moeda" | "numero") {
  return unidade === "moeda" ? moedaBR.format(valor) : numeroBR.format(valor);
}

function saudacao(hora: number) {
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
}

function statusMeta(progresso: number) {
  if (progresso >= 100) {
    return { rotulo: "Atingida", classe: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", barra: "bg-emerald-500" };
  }
  if (progresso >= 50) {
    return { rotulo: "Em andamento", classe: "bg-blue-50 text-blue-700 ring-blue-600/20", barra: "bg-teal-600" };
  }
  return { rotulo: "Atenção", classe: "bg-amber-50 text-amber-700 ring-amber-600/20", barra: "bg-amber-500" };
}

/* -------------------------------------------------------------------------- */
/* Componentes visuais                                                        */
/* -------------------------------------------------------------------------- */

function CardIndicador({
  titulo,
  valor,
  legenda,
  icone,
  cor,
  variacao,
  tendencia,
  carregando,
}: {
  titulo: string;
  valor: string;
  legenda: string;
  icone: ReactNode;
  cor: string;
  variacao?: number;
  tendencia?: Tendencia;
  carregando: boolean;
}) {
  const positiva = tendencia === "alta";
  const negativa = tendencia === "baixa";

  return (
    <article className="group rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{titulo}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {carregando ? "—" : valor}
          </p>
          <p className="mt-1 text-xs text-slate-500">{legenda}</p>
        </div>
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cor}`}>
          {icone}
        </div>
      </div>
      {typeof variacao === "number" && !carregando && (
        <div className="mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3">
          {positiva ? <ArrowUpRight size={15} className="text-emerald-600" /> : negativa ? <ArrowDownRight size={15} className="text-rose-600" /> : <TrendingUp size={15} className="text-slate-400" />}
          <span className={`text-xs font-semibold ${positiva ? "text-emerald-700" : negativa ? "text-rose-700" : "text-slate-500"}`}>
            {variacao > 0 ? "+" : ""}{variacao}%
          </span>
          <span className="text-xs text-slate-400">em relação ao período anterior</span>
        </div>
      )}
    </article>
  );
}

function BarraProgresso({ valor, cor = "bg-teal-600" }: { valor: number; cor?: string }) {
  const largura = Math.min(100, Math.max(0, valor));
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={largura} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all duration-700 ${cor}`} style={{ width: `${largura}%` }} />
    </div>
  );
}

function Atalho({ href, titulo, descricao, icone }: { href: string; titulo: string; descricao: string; icone: ReactNode }) {
  return (
    <Link href={href} className="group flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition hover:border-teal-300 hover:bg-teal-50/40">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700 transition group-hover:bg-teal-100">{icone}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-slate-800">{titulo}</span>
        <span className="mt-0.5 block text-xs text-slate-500">{descricao}</span>
      </span>
      <ChevronRight size={17} className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-teal-700" />
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/* Página principal                                                           */
/* -------------------------------------------------------------------------- */

export default function DashboardComercialPage() {
  const [agora, setAgora] = useState(() => new Date());
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [dashboard, setDashboard] = useState<DashboardComercial | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [periodo, setPeriodo] = useState("mes");

  const carregarDashboard = useCallback(async (silencioso = false) => {
    try {
      if (silencioso) setAtualizando(true);
      else setCarregando(true);
      setErro("");

      const [resUsuario, resDashboard] = await Promise.all([
        fetch("/api/me", { cache: "no-store" }),
        fetch(`/api/comercial/dashboard?periodo=${periodo}`, { cache: "no-store" }),
      ]);

      if (resUsuario.ok) {
        const dadosUsuario = await resUsuario.json();
        setUsuario(dadosUsuario?.user ?? dadosUsuario?.usuario ?? dadosUsuario ?? null);
      }

      if (!resDashboard.ok) {
        throw new Error(`Não foi possível carregar o dashboard comercial (${resDashboard.status}).`);
      }

      const dados = await resDashboard.json();
      setDashboard(dados?.data ?? dados);
    } catch (error) {
      console.error("Erro ao carregar dashboard comercial:", error);
      setErro(error instanceof Error ? error.message : "Ocorreu um erro ao carregar os dados.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, [periodo]);

  useEffect(() => {
    void carregarDashboard();
    const relogio = window.setInterval(() => setAgora(new Date()), 1000);
    return () => window.clearInterval(relogio);
  }, [carregarDashboard]);

  const nomeUsuario = useMemo(() => {
    return usuario?.full_name || `${usuario?.first_name ?? ""} ${usuario?.last_name ?? ""}`.trim() || "Equipe Comercial";
  }, [usuario]);

  const metaPercentual = dashboard ? percentual(dashboard.meta.realizado, dashboard.meta.meta) : 0;
  const faltaMeta = dashboard ? Math.max(0, dashboard.meta.meta - dashboard.meta.realizado) : 0;
  const hora = agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  const maxVendas = Math.max(1, ...(dashboard?.vendas_por_mes ?? []).map((item) => item.vendas));

  // Metas: usa `metas` da API; se não existir, monta com a meta geral + cidades
  const metas: MetaItem[] = useMemo(() => {
    if (!dashboard) return [];
    if (dashboard.metas?.length) return dashboard.metas;

    const lista: MetaItem[] = [];

    if (dashboard.meta && dashboard.meta.meta > 0) {
      lista.push({
        id: "geral",
        titulo: "Meta comercial",
        escopo: "Geral",
        meta: dashboard.meta.meta,
        realizado: dashboard.meta.realizado,
        unidade: "moeda",
      });
    }

    (dashboard.desempenho_cidades ?? []).forEach((cidade) => {
      lista.push({
        id: `cidade-${cidade.cidade}`,
        titulo: "Vendas por cidade",
        escopo: cidade.cidade,
        meta: cidade.meta,
        realizado: cidade.vendas,
        unidade: "numero",
      });
    });

    return lista;
  }, [dashboard]);

  const metasAtingidas = metas.filter((m) => m.meta > 0 && m.realizado >= m.meta).length;

  return (
    <main className="min-h-screen space-y-6">
      <header className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#075f56] via-[#087f70] to-[#00a99d] p-5 text-white shadow-lg shadow-teal-900/10 sm:p-7">
        <div className="pointer-events-none absolute -right-12 -top-24 h-72 w-72 rounded-full border-[35px] border-white/5" />
        <div className="pointer-events-none absolute -bottom-32 right-1/3 h-64 w-64 rounded-full bg-white/5 blur-2xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{saudacao(agora.getHours())}, {nomeUsuario}!</h1>
            <p className="mt-2 max-w-2xl text-sm text-white/75">Acompanhe oportunidades, desempenho de vendas, clientes e metas da equipe comercial.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-3 text-sm text-white backdrop-blur-sm">
              <CalendarDays size={17} />
              <select value={periodo} onChange={(event) => setPeriodo(event.target.value)} className="cursor-pointer bg-transparent font-medium outline-none [&>option]:text-slate-900" aria-label="Período do dashboard">
                <option value="hoje">Hoje</option>
                <option value="semana">Esta semana</option>
                <option value="mes">Este mês</option>
                <option value="ano">Este ano</option>
              </select>
            </label>
            <button type="button" onClick={() => void carregarDashboard(true)} disabled={atualizando} className="flex items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-semibold text-teal-800 shadow-sm transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-70">
              <RefreshCw size={16} className={atualizando ? "animate-spin" : ""} />
              {atualizando ? "Atualizando" : "Atualizar"}
            </button>
          </div>
        </div>
        <div className="relative mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-xs text-white/70">
          <span className="flex items-center gap-1.5"><Clock3 size={14} /> {hora}</span>
          <span className="flex items-center gap-1.5"><CalendarDays size={14} /> {agora.toLocaleDateString("pt-BR", { dateStyle: "long" })}</span>
          <span className="flex items-center gap-1.5"><BadgeCheck size={14} /> Painel de acompanhamento comercial</span>
        </div>
      </header>

      {/* Erro de integração */}
      {erro && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <XCircle size={19} className="mt-0.5 shrink-0 text-amber-700" />
            <div>
              <p className="text-sm font-semibold text-amber-900">Não foi possível atualizar os indicadores</p>
              <p className="mt-1 text-xs text-amber-800">{erro} Verifique se a rota da API comercial está implementada.</p>
            </div>
          </div>
          <button type="button" onClick={() => void carregarDashboard()} className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-900 hover:bg-amber-100">Tentar novamente</button>
        </div>
      )}

      {/* Indicadores */}
      <section aria-label="Indicadores comerciais" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <CardIndicador titulo="Leads recebidos" valor={numeroBR.format(dashboard?.leads.valor ?? 0)} legenda="Oportunidades no período" icone={<UserPlus size={21} />} cor="bg-blue-50 text-blue-700" variacao={dashboard?.leads.variacao} tendencia={dashboard?.leads.tendencia} carregando={carregando} />
        <CardIndicador titulo="Clientes" valor={numeroBR.format(dashboard?.clientes.valor ?? 0)} legenda="Base de clientes" icone={<Users size={21} />} cor="bg-violet-50 text-violet-700" variacao={dashboard?.clientes.variacao} tendencia={dashboard?.clientes.tendencia} carregando={carregando} />
        <CardIndicador titulo="Propostas" valor={numeroBR.format(dashboard?.propostas.valor ?? 0)} legenda="Propostas encaminhadas" icone={<BriefcaseBusiness size={21} />} cor="bg-amber-50 text-amber-700" variacao={dashboard?.propostas.variacao} tendencia={dashboard?.propostas.tendencia} carregando={carregando} />
        <CardIndicador titulo="Vendas fechadas" valor={numeroBR.format(dashboard?.vendas.valor ?? 0)} legenda="Negócios concluídos" icone={<Handshake size={21} />} cor="bg-emerald-50 text-emerald-700" variacao={dashboard?.vendas.variacao} tendencia={dashboard?.vendas.tendencia} carregando={carregando} />
        <CardIndicador titulo="Faturamento" valor={moedaBR.format(dashboard?.faturamento.valor ?? 0)} legenda="Receita no período" icone={<Wallet size={21} />} cor="bg-teal-50 text-teal-700" variacao={dashboard?.faturamento.variacao} tendencia={dashboard?.faturamento.tendencia} carregando={carregando} />
        <CardIndicador titulo="Conversão" valor={`${dashboard?.conversao.valor ?? 0}%`} legenda="Leads convertidos em vendas" icone={<ChartNoAxesCombined size={21} />} cor="bg-indigo-50 text-indigo-700" variacao={dashboard?.conversao.variacao} tendencia={dashboard?.conversao.tendencia} carregando={carregando} />
      </section>

      {/* Meta e evolução */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Meta comercial</p>
              <p className="mt-1 text-xs text-slate-500">Acompanhamento do período selecionado</p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700"><Target size={20} /></span>
          </div>
          {carregando ? (
            <div className="mt-7 h-28 animate-pulse rounded-xl bg-slate-100" />
          ) : (
            <>
              <div className="mt-7 flex items-end justify-between gap-3">
                <div>
                  <p className="text-4xl font-bold tracking-tight text-slate-900">{metaPercentual}%</p>
                  <p className="mt-1 text-xs text-slate-500">do objetivo alcançado</p>
                </div>
                <span className={`rounded-lg px-2.5 py-1.5 text-xs font-bold ${metaPercentual >= 100 ? "bg-emerald-50 text-emerald-700" : "bg-teal-50 text-teal-700"}`}>
                  {metaPercentual >= 100 ? "Meta atingida" : "Em andamento"}
                </span>
              </div>
              <div className="mt-5"><BarraProgresso valor={metaPercentual} cor={metaPercentual >= 100 ? "bg-emerald-500" : "bg-teal-600"} /></div>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Realizado</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{moedaBR.format(dashboard?.meta.realizado ?? 0)}</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">Meta definida</p>
                  <p className="mt-1 text-lg font-bold text-slate-900">{moedaBR.format(dashboard?.meta.meta ?? 0)}</p>
                </div>
              </div>
              <p className="mt-4 text-xs text-slate-500">{faltaMeta > 0 ? `Faltam ${moedaBR.format(faltaMeta)} para alcançar a meta.` : "Parabéns! O objetivo comercial foi alcançado."}</p>
            </>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Evolução das vendas</p>
              <p className="mt-1 text-xs text-slate-500">Volume de vendas ao longo dos últimos meses</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700"><TrendingUp size={14} /> Desempenho</span>
          </div>
          {carregando ? (
            <div className="mt-6 h-44 animate-pulse rounded-xl bg-slate-100" />
          ) : dashboard?.vendas_por_mes?.length ? (
            <div className="mt-6 flex h-48 items-end gap-2 border-b border-slate-100 px-1 sm:gap-4">
              {dashboard.vendas_por_mes.map((item, index) => {
                const altura = Math.max(5, (item.vendas / maxVendas) * 100);
                return (
                  <div key={`${item.mes}-${index}`} className="group flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-2">
                    <span className="text-[10px] font-semibold text-slate-500 sm:text-xs">{numeroBR.format(item.vendas)}</span>
                    <div className="flex h-[75%] w-full items-end justify-center">
                      <div title={`${item.mes}: ${item.vendas} vendas`} className="w-full max-w-12 rounded-t-lg bg-gradient-to-t from-[#087f70] to-[#35b99f] transition-all duration-500 group-hover:brightness-110" style={{ height: `${altura}%` }} />
                    </div>
                    <span className="mb-2 truncate text-[10px] font-medium text-slate-500 sm:text-xs">{item.mes}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-6 flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-sm text-slate-500">Ainda não há dados de vendas para exibir.</div>
          )}
        </article>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <p className="text-sm font-semibold text-slate-800">Metas</p>
            <p className="mt-1 text-xs text-slate-500">
              {carregando
                ? "Acompanhamento das metas do período"
                : `${metasAtingidas} de ${metas.length} ${metas.length === 1 ? "meta atingida" : "metas atingidas"} no período`}
            </p>
          </div>
          <Link href="/comercial/metas" className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 hover:text-teal-900">Ver todas <ArrowRight size={16} /></Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead className="bg-slate-50">
              <tr className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-3">Meta</th>
                <th className="px-6 py-3">Prazo</th>
                <th className="px-6 py-3 text-right">Realizado</th>
                <th className="px-6 py-3 text-right">Objetivo</th>
                <th className="w-64 px-6 py-3">Progresso</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {carregando ? (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">Carregando metas...</td></tr>
              ) : metas.length ? metas.map((item) => {
                const progresso = percentual(item.realizado, item.meta);
                const status = statusMeta(progresso);
                return (
                  <tr key={item.id} className="transition hover:bg-slate-50/80">
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-slate-800">{item.titulo}</p>
                      {item.escopo && <p className="mt-0.5 text-xs text-slate-500">{item.escopo}</p>}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-600">{formatarData(item.prazo)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-semibold text-slate-800">{formatarValorMeta(item.realizado, item.unidade)}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-slate-600">{formatarValorMeta(item.meta, item.unidade)}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <BarraProgresso valor={progresso} cor={status.barra} />
                        <span className="w-11 shrink-0 text-right text-xs font-bold text-slate-700">{progresso}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4"><span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${status.classe}`}>{status.rotulo}</span></td>
                  </tr>
                );
              }) : (
                <tr><td colSpan={6} className="px-6 py-10 text-center text-sm text-slate-500">Nenhuma meta cadastrada para este período.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-800">Desempenho por cidade</p>
              <p className="mt-1 text-xs text-slate-500">Acompanhamento das vendas em cada região</p>
            </div>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">{dashboard?.desempenho_cidades?.length ?? 0} cidades</span>
          </div>
          {carregando ? (
            <div className="mt-5 space-y-4">{[1, 2, 3].map((item) => <div key={item} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
          ) : dashboard?.desempenho_cidades?.length ? (
            <div className="mt-5 space-y-5">
              {dashboard.desempenho_cidades.map((cidade) => {
                const progresso = percentual(cidade.vendas, cidade.meta);
                return (
                  <div key={cidade.cidade}>
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{cidade.cidade}</p><p className="mt-0.5 text-xs text-slate-500">{numeroBR.format(cidade.vendas)} vendas de {numeroBR.format(cidade.meta)}</p></div>
                      <div className="text-right"><p className="text-sm font-bold text-slate-800">{progresso}%</p>{typeof cidade.faturamento === "number" && <p className="text-[11px] text-slate-400">{moedaBR.format(cidade.faturamento)}</p>}</div>
                    </div>
                    <BarraProgresso valor={progresso} cor={progresso >= 100 ? "bg-emerald-500" : "bg-teal-600"} />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500">Nenhum resultado por cidade cadastrado.</div>
          )}
        </article>

        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-800">Acesso rápido</p>
            <p className="mt-1 text-xs text-slate-500">Principais ferramentas comerciais</p>
          </div>
          <div className="space-y-3">
            <Atalho href="/comercial/leads" titulo="Gestão de leads" descricao="Acompanhar oportunidades" icone={<UserPlus size={19} />} />
            <Atalho href="/comercial/clientes" titulo="Clientes" descricao="Consultar carteira comercial" icone={<Users size={19} />} />
            <Atalho href="/comercial/crm" titulo="CRM" descricao="Organizar o relacionamento" icone={<Handshake size={19} />} />
            <Atalho href="/comercial/relatorios" titulo="Relatórios" descricao="Analisar resultados" icone={<ChartNoAxesCombined size={19} />} />
          </div>
        </article>
      </section>
    </main>
  );
}