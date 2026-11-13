"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  Activity, ArrowDownRight, ArrowRight, Building2, CalendarClock, Check,
  ChevronDown, ChevronRight, CircleAlert, Clock3, DollarSign, Filter,
  LayoutGrid, List, Loader2, MoreHorizontal, Plus, RefreshCw, Search,
  Target, UserRound, Users, X,
} from "lucide-react";

type Stage = "Novo" | "Contato" | "Qualificação" | "Proposta" | "Negociação" | "Ganho" | "Perdido";
type Deal = {
  id: string;
  title: string;
  contact_name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  stage: Stage;
  value: number;
  probability?: number | null;
  owner?: string | null;
  source?: string | null;
  next_action?: string | null;
  next_action_at?: string | null;
  updated_at?: string;
  created_at?: string;
};
type CrmResponse = {
  deals?: Deal[];
  totals?: { total?: number; pipeline?: number; ganhos?: number; perdidos?: number; previsao?: number; conversao?: number };
  stages?: Partial<Record<Stage, number>>;
};

const STAGES: Stage[] = ["Novo", "Contato", "Qualificação", "Proposta", "Negociação", "Ganho", "Perdido"];
const stageStyle: Record<Stage, string> = {
  Novo: "bg-sky-50 text-sky-700 border-sky-200",
  Contato: "bg-amber-50 text-amber-700 border-amber-200",
  Qualificação: "bg-violet-50 text-violet-700 border-violet-200",
  Proposta: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Negociação: "bg-orange-50 text-orange-700 border-orange-200",
  Ganho: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Perdido: "bg-rose-50 text-rose-700 border-rose-200",
};
const currency = (value?: number | null) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(value || 0));
const shortDate = (value?: string | null) => value ? new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short" }).format(new Date(value)) : "Sem data";
const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map(part => part[0]).join("").toUpperCase();

export default function CrmComercialPage() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [totals, setTotals] = useState<CrmResponse["totals"]>({});
  const [stageCounts, setStageCounts] = useState<CrmResponse["stages"]>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [owner, setOwner] = useState("Todos");
  const [period, setPeriod] = useState("30");
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", contact_name: "", company: "", email: "", phone: "", city: "", value: "", stage: "Novo" as Stage, product: "planos_assinaturas", source: "Indicação", probability: "20", next_action: "", next_action_at: "" });

  const loadCrm = useCallback(async (silent = false) => {
    if (silent) setRefreshing(true); else setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ periodo: period });
      if (search.trim()) params.set("busca", search.trim());
      if (owner !== "Todos") params.set("responsavel", owner);
      const response = await fetch(`/api/comercial/crm?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Não foi possível carregar o CRM. Verifique a API /api/comercial/crm.");
      const data: CrmResponse = await response.json();
      setDeals(Array.isArray(data.deals) ? data.deals : []);
      setTotals(data.totals || {});
      setStageCounts(data.stages || {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar o CRM.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, search, owner]);

  useEffect(() => { void loadCrm(); }, [loadCrm]);

  const moveDeal = async (deal: Deal, nextStage: Stage) => {
    const previous = deal.stage;
    setMovingId(deal.id);
    setDeals(current => current.map(item => item.id === deal.id ? { ...item, stage: nextStage } : item));
    try {
      const response = await fetch(`/api/comercial/crm/${encodeURIComponent(deal.id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ stage: nextStage }),
      });
      if (!response.ok) throw new Error("Não foi possível atualizar a etapa da oportunidade.");
      await loadCrm(true);
    } catch (err) {
      setDeals(current => current.map(item => item.id === deal.id ? { ...item, stage: previous } : item));
      setError(err instanceof Error ? err.message : "Erro ao mover oportunidade.");
    } finally { setMovingId(null); }
  };

  const createDeal = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/comercial/crm", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, value: Number(form.value || 0), probability: Number(form.probability || 0) }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível cadastrar a oportunidade.");
      setShowNew(false);
      setForm({ title: "", contact_name: "", company: "", email: "", phone: "", city: "", value: "", stage: "Novo", product: "planos_assinaturas", source: "Indicação", probability: "20", next_action: "", next_action_at: "" });
      await loadCrm(true);
    } catch (err) { setError(err instanceof Error ? err.message : "Erro ao salvar oportunidade."); }
    finally { setSaving(false); }
  };

  const owners = useMemo(() => ["Todos", ...Array.from(new Set(deals.map(deal => deal.owner).filter((name): name is string => Boolean(name))))], [deals]);
  const activeDeals = deals.filter(deal => !["Ganho", "Perdido"].includes(deal.stage));
  const weightedForecast = totals?.previsao ?? activeDeals.reduce((sum, deal) => sum + deal.value * Number(deal.probability ?? 0) / 100, 0);
  const pipelineValue = totals?.pipeline ?? activeDeals.reduce((sum, deal) => sum + deal.value, 0);
  const visibleStages = STAGES.filter(stage => stage !== "Ganho" && stage !== "Perdido");

  return (
    <main className="min-h-screen text-slate-800">
      <div className="mx-auto max-w-8xl space-y-6">
        <header className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
          <div>
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700"><Activity size={22} /></div><div><h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">CRM Comercial</h1><p className="mt-0 text-sm text-white">Gerencie relacionamentos, oportunidades e o funil de vendas da MAYLON.</p></div></div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void loadCrm(true)} disabled={refreshing} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50 disabled:opacity-60"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""}/> Atualizar</button>
            <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"><Plus size={17}/> Nova oportunidade</button>
          </div>
        </header>

        {error && <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><CircleAlert size={18} className="mt-0.5 shrink-0"/><span>{error}</span><button className="ml-auto" onClick={() => setError("")} aria-label="Fechar"><X size={16}/></button></div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Oportunidades ativas", value: totals?.total ?? activeDeals.length, detail: "Negociações em andamento", icon: Target, tone: "bg-sky-50 text-sky-700" },
            { label: "Valor do pipeline", value: currency(pipelineValue), detail: "Soma das oportunidades abertas", icon: DollarSign, tone: "bg-emerald-50 text-emerald-700" },
            { label: "Previsão ponderada", value: currency(weightedForecast), detail: "Valor ajustado pela probabilidade", icon: ArrowDownRight, tone: "bg-violet-50 text-violet-700" },
            { label: "Vendas ganhas", value: currency(totals?.ganhos), detail: `${totals?.conversao ?? 0}% de conversão`, icon: Check, tone: "bg-teal-50 text-teal-700" },
          ].map(item => <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between gap-3"><span className="text-sm font-medium text-slate-500">{item.label}</span><span className={`rounded-xl p-2.5 ${item.tone}`}><item.icon size={19}/></span></div><div className="mt-4 text-2xl font-bold tracking-tight text-slate-900">{item.value}</div><p className="mt-1 text-xs text-slate-500">{item.detail}</p></article>)}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div><h2 className="font-bold text-slate-900">Funil de vendas</h2><p className="mt-1 text-xs text-slate-500">Acompanhe cada oportunidade da entrada ao fechamento.</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[220px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar oportunidade ou contato" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/></div>
              <div className="relative"><Filter size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><select value={owner} onChange={event => setOwner(event.target.value)} className="max-w-[180px] appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm outline-none focus:border-emerald-500">{owners.map(name => <option key={name}>{name}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"/></div>
              <select value={period} onChange={event => setPeriod(event.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"><option value="7">7 dias</option><option value="30">30 dias</option><option value="90">90 dias</option><option value="365">12 meses</option><option value="all">Todo período</option></select>
              <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1"><button onClick={() => setView("kanban")} title="Visualização Kanban" className={`rounded-lg p-2 ${view === "kanban" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-400"}`}><LayoutGrid size={17}/></button><button onClick={() => setView("list")} title="Visualização em lista" className={`rounded-lg p-2 ${view === "list" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-400"}`}><List size={17}/></button></div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7">{STAGES.map(stage => <div key={stage} className={`rounded-xl border px-3 py-2.5 ${stageStyle[stage]}`}><div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold">{stage}</span><span className="text-sm font-bold">{stageCounts?.[stage] ?? deals.filter(deal => deal.stage === stage).length}</span></div></div>)}</div>
        </section>

        {loading ? <div className="flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500"><Loader2 size={20} className="mr-2 animate-spin"/> Carregando oportunidades...</div> : view === "kanban" ? (
          <section className="-mx-1 overflow-x-auto pb-3"><div className="flex min-w-max items-start gap-4 px-1">{visibleStages.map(stage => {
            const stageDeals = deals.filter(deal => deal.stage === stage);
            const stageTotal = stageDeals.reduce((sum, deal) => sum + deal.value, 0);
            return <div key={stage} className="w-[290px] shrink-0 rounded-2xl border border-slate-200 bg-slate-100/80 p-3">
              <div className="mb-3 flex items-center justify-between gap-2 px-1"><div className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${stage === "Novo" ? "bg-sky-500" : stage === "Contato" ? "bg-amber-500" : stage === "Qualificação" ? "bg-violet-500" : stage === "Proposta" ? "bg-indigo-500" : "bg-orange-500"}`}/><h3 className="text-sm font-bold text-slate-800">{stage}</h3><span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-semibold text-slate-500">{stageDeals.length}</span></div><button onClick={() => { setForm(current => ({ ...current, stage })); setShowNew(true); }} title={`Adicionar em ${stage}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-emerald-700"><Plus size={16}/></button></div>
              <p className="mb-3 px-1 text-xs font-medium text-slate-500">{currency(stageTotal)}</p>
              <div className="space-y-3">{stageDeals.map(deal => <article key={deal.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <div className="flex items-start justify-between gap-2"><div className="min-w-0"><h4 className="line-clamp-2 text-sm font-bold text-slate-900">{deal.title}</h4><p className="mt-1 truncate text-xs text-slate-500">{deal.company || deal.contact_name}</p></div><button title="Mais opções" className="rounded-lg p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-600"><MoreHorizontal size={17}/></button></div>
                <div className="mt-3 flex items-center justify-between"><span className="text-base font-bold text-slate-900">{currency(deal.value)}</span><span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-semibold text-slate-600">{deal.probability ?? 0}%</span></div>
                <div className="mt-3 space-y-2 border-t border-slate-100 pt-3"><p className="flex items-center gap-2 text-xs text-slate-600"><span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50 text-[9px] font-bold text-emerald-700">{initials(deal.contact_name || "Lead")}</span><span className="truncate">{deal.contact_name}</span></p>{deal.next_action && <p className="flex items-center gap-1.5 text-[11px] text-slate-500"><CalendarClock size={13}/><span className="truncate">{deal.next_action}</span>{deal.next_action_at && <span className="ml-auto shrink-0">{shortDate(deal.next_action_at)}</span>}</p>}<div className="flex items-center justify-between text-[11px] text-slate-400"><span>{deal.owner || "Sem responsável"}</span><span>{deal.city || deal.source || "MAYLON"}</span></div></div>
                <div className="mt-3 flex items-center gap-2"><select aria-label={`Mover ${deal.title}`} disabled={movingId === deal.id} value={deal.stage} onChange={event => void moveDeal(deal, event.target.value as Stage)} className="min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2 py-2 text-[11px] font-semibold text-slate-600 outline-none focus:border-emerald-500">{STAGES.map(item => <option key={item}>{item}</option>)}</select><Link href={`/comercial/crm/${encodeURIComponent(deal.id)}`} title="Abrir oportunidade" className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"><ArrowRight size={15}/></Link></div>
              </article>)}{stageDeals.length === 0 && <div className="rounded-xl border border-dashed border-slate-300 bg-white/60 px-3 py-8 text-center text-xs text-slate-400">Nenhuma oportunidade nesta etapa.</div>}</div>
            </div>;
          })}</div></section>
        ) : (
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Oportunidade</th><th className="px-4 py-3">Contato</th><th className="px-4 py-3">Valor</th><th className="px-4 py-3">Probabilidade</th><th className="px-4 py-3">Responsável</th><th className="px-4 py-3">Próxima ação</th><th className="px-4 py-3">Etapa</th><th className="px-4 py-3"/></tr></thead><tbody className="divide-y divide-slate-100">{deals.map(deal => <tr key={deal.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><div className="font-semibold text-slate-900">{deal.title}</div><div className="text-xs text-slate-500">{deal.company || deal.city || "Oportunidade comercial"}</div></td><td className="px-4 py-4"><div className="font-medium text-slate-700">{deal.contact_name}</div><div className="text-xs text-slate-500">{deal.email || deal.phone || "—"}</div></td><td className="px-4 py-4 font-semibold">{currency(deal.value)}</td><td className="px-4 py-4">{deal.probability ?? 0}%</td><td className="px-4 py-4">{deal.owner || "Não atribuído"}</td><td className="px-4 py-4"><div>{deal.next_action || "—"}</div><div className="text-xs text-slate-400">{shortDate(deal.next_action_at)}</div></td><td className="px-4 py-4"><select value={deal.stage} onChange={event => void moveDeal(deal, event.target.value as Stage)} className={`rounded-full border px-2.5 py-1.5 text-xs font-semibold outline-none ${stageStyle[deal.stage]}`}>{STAGES.map(stage => <option key={stage}>{stage}</option>)}</select></td><td className="px-4 py-4"><Link href={`/comercial/crm/${encodeURIComponent(deal.id)}`} className="inline-flex rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700"><ArrowRight size={17}/></Link></td></tr>)}</tbody></table></div>{deals.length === 0 && <div className="p-12 text-center text-sm text-slate-500">Nenhuma oportunidade encontrada.</div>}</section>
        )}

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2"><div className="flex items-center gap-2"><Users size={18} className="text-emerald-700"/><h2 className="font-bold text-slate-900">Relacionamento com clientes</h2></div><p className="mt-1 text-sm text-slate-500">Acesse a base de clientes e acompanhe os contatos vinculados às oportunidades.</p><div className="mt-4 flex flex-wrap gap-2"><Link href="/comercial/clientes" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"><Building2 size={16}/> Cadastro de clientes <ChevronRight size={15}/></Link><Link href="/comercial/leads" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"><UserRound size={16}/> Gestão de leads <ChevronRight size={15}/></Link></div></div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center gap-2"><Clock3 size={18} className="text-amber-600"/><h2 className="font-bold text-slate-900">Próximos acompanhamentos</h2></div><p className="mt-1 text-sm text-slate-500">Oportunidades com uma próxima ação programada.</p><div className="mt-4 space-y-3">{deals.filter(deal => deal.next_action).slice(0, 4).map(deal => <div key={deal.id} className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3 last:border-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-semibold text-slate-800">{deal.contact_name}</p><p className="truncate text-xs text-slate-500">{deal.next_action}</p></div><span className="shrink-0 text-xs font-semibold text-emerald-700">{shortDate(deal.next_action_at)}</span></div>)}{deals.filter(deal => deal.next_action).length === 0 && <p className="rounded-xl bg-slate-50 p-4 text-xs text-slate-500">Nenhum acompanhamento agendado. Cadastre a próxima ação nas oportunidades.</p>}</div></div>
        </section>
    </div>

      {showNew && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget) setShowNew(false); }}><div className="max-h-[94vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-lg font-bold text-slate-900">Nova oportunidade</h2><p className="text-xs text-slate-500">Registre a negociação e defina o próximo acompanhamento.</p></div><button onClick={() => setShowNew(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Fechar"><X size={19}/></button></div><form onSubmit={createDeal} className="space-y-4 p-5"><div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Nome da oportunidade *</span><input required value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder="Ex.: Parceria comercial — MAYLON PASS" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"/></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Nome do contato *</span><input required value={form.contact_name} onChange={event => setForm({ ...form, contact_name: event.target.value })} placeholder="Nome do responsável" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"/></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Empresa</span><input value={form.company} onChange={event => setForm({ ...form, company: event.target.value })} placeholder="Nome da empresa" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"/></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">E-mail</span><input type="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} placeholder="contato@empresa.com.br" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"/></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Telefone / WhatsApp</span><input value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} placeholder="(13) 99999-9999" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"/></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Cidade</span><input value={form.city} onChange={event => setForm({ ...form, city: event.target.value })} placeholder="Ex.: Santos" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"/></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Produto *</span><select required value={form.product} onChange={event => setForm({ ...form, product: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"><option value="planos_assinaturas">Planos e assinaturas (10%)</option><option value="parcerias">Parcerias comerciais (5%)</option><option value="seguros_beneficios">Seguros e benefícios (10%)</option></select></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Valor estimado (R$)</span><input type="number" min="0" step="0.01" value={form.value} onChange={event => setForm({ ...form, value: event.target.value })} placeholder="0,00" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"/></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Etapa</span><select value={form.stage} onChange={event => setForm({ ...form, stage: event.target.value as Stage })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500">{STAGES.map(stage => <option key={stage}>{stage}</option>)}</select></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Probabilidade (%)</span><input type="number" min="0" max="100" value={form.probability} onChange={event => setForm({ ...form, probability: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"/></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Origem</span><select value={form.source} onChange={event => setForm({ ...form, source: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500">{["Indicação", "Site", "WhatsApp", "Instagram", "Facebook", "Campanha", "Prospecção", "Evento", "Outros"].map(source => <option key={source}>{source}</option>)}</select></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Próxima ação</span><input value={form.next_action} onChange={event => setForm({ ...form, next_action: event.target.value })} placeholder="Ex.: Ligar para apresentar proposta" className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"/></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Data do acompanhamento</span><input type="date" value={form.next_action_at} onChange={event => setForm({ ...form, next_action_at: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"/></label></div><div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setShowNew(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button><button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>} {saving ? "Salvando..." : "Salvar oportunidade"}</button></div></form></div></div>}
    </main>
  );
}
