"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleAlert,
  Eye, Filter, Flame, LayoutGrid, List, Loader2, Mail, MessageCircle,
  MoreHorizontal, Phone, Plus, RefreshCw, Search, Target, UserPlus, Users, X,
} from "lucide-react";

type LeadStatus = "Novo" | "Em contato" | "Qualificado" | "Proposta" | "Convertido" | "Perdido";
type Lead = {
  id: string;
  name: string;
  company?: string | null;
  email?: string | null;
  phone?: string | null;
  city?: string | null;
  source?: string | null;
  status: LeadStatus;
  value?: number | null;
  owner?: string | null;
  created_at: string;
  next_contact_at?: string | null;
};
type DashboardResponse = {
  leads?: Lead[];
  totals?: { total?: number; novos?: number; em_contato?: number; qualificados?: number; convertidos?: number; conversao?: number };
  page?: number;
  pages?: number;
};

const STATUS: LeadStatus[] = ["Novo", "Em contato", "Qualificado", "Proposta", "Convertido", "Perdido"];
const statusStyle: Record<LeadStatus, string> = {
  Novo: "bg-sky-50 text-sky-700 ring-sky-200",
  "Em contato": "bg-amber-50 text-amber-700 ring-amber-200",
  Qualificado: "bg-violet-50 text-violet-700 ring-violet-200",
  Proposta: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  Convertido: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Perdido: "bg-rose-50 text-rose-700 ring-rose-200",
};
const money = (n?: number | null) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(Number(n || 0));
const date = (s?: string | null) => s ? new Intl.DateTimeFormat("pt-BR").format(new Date(s)) : "—";

export default function LeadsComercialPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totals, setTotals] = useState<DashboardResponse["totals"]>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Todos");
  const [source, setSource] = useState("Todas as origens");
  const [period, setPeriod] = useState("30");
  const [view, setView] = useState<"table" | "cards">("table");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [showNew, setShowNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", city: "", source: "Site", value: "", notes: "" });

  const loadLeads = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ page: String(page), limit: "12", periodo: period });
      if (search.trim()) params.set("busca", search.trim());
      if (status !== "Todos") params.set("status", status);
      if (source !== "Todas as origens") params.set("origem", source);
      const response = await fetch(`/api/comercial/leads?${params.toString()}`, { cache: "no-store" });
      if (!response.ok) throw new Error("Não foi possível carregar os leads. Verifique a API /api/comercial/leads.");
      const data: DashboardResponse = await response.json();
      setLeads(data.leads || []); setTotals(data.totals || {}); setPages(Math.max(1, data.pages || 1));
    } catch (e) { setError(e instanceof Error ? e.message : "Erro ao carregar os leads."); }
    finally { setLoading(false); }
  }, [page, period, search, status, source]);

  useEffect(() => { void loadLeads(); }, [loadLeads]);

  const createLead = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setSaving(true); setError("");
    try {
      const response = await fetch("/api/comercial/leads", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, value: form.value ? Number(form.value) : null }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Não foi possível cadastrar o lead.");
      setShowNew(false); setForm({ name: "", email: "", phone: "", company: "", city: "", source: "Site", value: "", notes: "" });
      setPage(1); await loadLeads();
    } catch (e) { setError(e instanceof Error ? e.message : "Erro ao salvar lead."); }
    finally { setSaving(false); }
  };

  const updateStatus = async (lead: Lead, next: LeadStatus) => {
    try {
      const response = await fetch(`/api/comercial/leads/${encodeURIComponent(lead.id)}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }),
      });
      if (!response.ok) throw new Error("Falha ao atualizar o status.");
      setLeads(current => current.map(item => item.id === lead.id ? { ...item, status: next } : item));
    } catch (e) { setError(e instanceof Error ? e.message : "Erro ao atualizar lead."); }
  };

  const sources = useMemo(() => ["Todas as origens", "Site", "WhatsApp", "Instagram", "Facebook", "Indicação", "Campanha", "Telefone", "Outros"], []);
  const initials = (name: string) => name.split(" ").filter(Boolean).slice(0, 2).map(p => p[0]).join("").toUpperCase();

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-8xl space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">Gestão de leads</h1>
            <p className="mt-0 text-white text-sm text-slate-500">Organize oportunidades, acompanhe contatos e avance negociações.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => void loadLeads()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"><RefreshCw size={16}/> Atualizar</button>
            <button onClick={() => setShowNew(true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"><Plus size={17}/> Novo lead</button>
          </div>
        </div>

        {error && <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"><CircleAlert size={18} className="mt-0.5 shrink-0"/><span>{error}</span><button className="ml-auto" onClick={() => setError("")} aria-label="Fechar"><X size={16}/></button></div>}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          {[
            { label: "Total de leads", value: totals?.total ?? "—", icon: Users, tone: "bg-emerald-50 text-emerald-700", detail: "Base cadastrada" },
            { label: "Novos leads", value: totals?.novos ?? "—", icon: UserPlus, tone: "bg-sky-50 text-sky-700", detail: "Aguardando primeiro contato" },
            { label: "Em atendimento", value: totals?.em_contato ?? "—", icon: MessageCircle, tone: "bg-amber-50 text-amber-700", detail: "Em processo de contato" },
            { label: "Qualificados", value: totals?.qualificados ?? "—", icon: Flame, tone: "bg-violet-50 text-violet-700", detail: "Oportunidades com potencial" },
            { label: "Convertidos", value: totals?.convertidos ?? "—", icon: Target, tone: "bg-teal-50 text-teal-700", detail: `${Number(totals?.conversao || 0).toLocaleString("pt-BR")}% de conversão` },
          ].map((item) => <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">{item.label}</span><span className={`rounded-xl p-2.5 ${item.tone}`}><item.icon size={19}/></span></div><div className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{item.value}</div><p className="mt-1 text-xs text-slate-500">{item.detail}</p></div>)}
        </section>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between lg:p-5">
            <div><h2 className="font-bold text-slate-900">Todos os leads</h2><p className="mt-1 text-xs text-slate-500">Pesquise, filtre e atualize o andamento das oportunidades.</p></div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative min-w-[210px] flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar nome, e-mail ou telefone" className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"/></div>
              <div className="relative"><Filter size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="appearance-none rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm outline-none focus:border-emerald-500"><option>Todos</option>{STATUS.map(s => <option key={s}>{s}</option>)}</select><ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"/></div>
              <select value={source} onChange={e => { setSource(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500">{sources.map(s => <option key={s}>{s}</option>)}</select>
              <select value={period} onChange={e => { setPeriod(e.target.value); setPage(1); }} className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500"><option value="7">Últimos 7 dias</option><option value="30">Últimos 30 dias</option><option value="90">Últimos 90 dias</option><option value="365">Todo o ano</option><option value="all">Todo período</option></select>
              <div className="flex rounded-xl border border-slate-200 p-1"><button onClick={() => setView("table")} className={`rounded-lg p-2 ${view === "table" ? "bg-emerald-50 text-emerald-700" : "text-slate-400 hover:text-slate-700"}`} aria-label="Visualização em tabela"><List size={17}/></button><button onClick={() => setView("cards")} className={`rounded-lg p-2 ${view === "cards" ? "bg-emerald-50 text-emerald-700" : "text-slate-400 hover:text-slate-700"}`} aria-label="Visualização em cartões"><LayoutGrid size={17}/></button></div>
            </div>
          </div>

          {loading ? <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500"><Loader2 size={20} className="animate-spin text-emerald-600"/>Carregando leads...</div> : leads.length === 0 ? <div className="flex min-h-64 flex-col items-center justify-center px-5 text-center"><div className="rounded-2xl bg-emerald-50 p-4 text-emerald-700"><Users size={28}/></div><h3 className="mt-4 font-semibold text-slate-900">Nenhum lead encontrado</h3><p className="mt-1 max-w-sm text-sm text-slate-500">Ajuste os filtros ou cadastre uma nova oportunidade comercial.</p><button onClick={() => setShowNew(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><Plus size={16}/> Cadastrar lead</button></div> : view === "table" ? (
            <div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3 font-semibold">Lead</th><th className="px-4 py-3 font-semibold">Contato</th><th className="px-4 py-3 font-semibold">Origem</th><th className="px-4 py-3 font-semibold">Cidade</th><th className="px-4 py-3 font-semibold">Valor estimado</th><th className="px-4 py-3 font-semibold">Responsável</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-5 py-3 font-semibold">Cadastro</th><th className="px-4 py-3"/></tr></thead><tbody className="divide-y divide-slate-100">{leads.map(lead => <tr key={lead.id} className="hover:bg-slate-50/70"><td className="px-5 py-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">{initials(lead.name)}</div><div><div className="font-semibold text-slate-900">{lead.name}</div><div className="text-xs text-slate-500">{lead.company || "Pessoa física"}</div></div></div></td><td className="px-4 py-4"><div className="space-y-1">{lead.email && <div className="flex items-center gap-1.5 text-xs text-slate-600"><Mail size={13}/>{lead.email}</div>}{lead.phone && <div className="flex items-center gap-1.5 text-xs text-slate-600"><Phone size={13}/>{lead.phone}</div>}</div></td><td className="px-4 py-4 text-slate-600">{lead.source || "—"}</td><td className="px-4 py-4 text-slate-600">{lead.city || "—"}</td><td className="px-4 py-4 font-semibold text-slate-700">{money(lead.value)}</td><td className="px-4 py-4 text-slate-600">{lead.owner || "Não atribuído"}</td><td className="px-4 py-4"><select aria-label={`Status de ${lead.name}`} value={lead.status} onChange={e => void updateStatus(lead, e.target.value as LeadStatus)} className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset outline-none ${statusStyle[lead.status]}`}><option value="Novo">Novo</option>{STATUS.filter(s => s !== "Novo").map(s => <option key={s}>{s}</option>)}</select></td><td className="px-5 py-4 text-xs text-slate-500">{date(lead.created_at)}</td><td className="px-4 py-4"><Link href={`/comercial/leads/${encodeURIComponent(lead.id)}`} title="Ver lead" className="inline-flex rounded-lg p-2 text-slate-400 hover:bg-emerald-50 hover:text-emerald-700"><Eye size={17}/></Link></td></tr>)}</tbody></table></div>
          ) : <div className="grid gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">{leads.map(lead => <article key={lead.id} className="rounded-xl border border-slate-200 p-4"><div className="flex items-start justify-between gap-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">{initials(lead.name)}</div><div><h3 className="font-semibold text-slate-900">{lead.name}</h3><p className="text-xs text-slate-500">{lead.company || lead.city || "Lead comercial"}</p></div></div><span className="rounded-full bg-slate-100 p-1.5 text-slate-500"><MoreHorizontal size={16}/></span></div><div className="mt-4 space-y-2 text-xs text-slate-600">{lead.email && <p className="flex items-center gap-2"><Mail size={14}/>{lead.email}</p>}{lead.phone && <p className="flex items-center gap-2"><Phone size={14}/>{lead.phone}</p>}<p className="flex items-center gap-2"><CalendarDays size={14}/> Cadastrado em {date(lead.created_at)}</p></div><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><span className="font-semibold">{money(lead.value)}</span><select value={lead.status} onChange={e => void updateStatus(lead, e.target.value as LeadStatus)} className={`rounded-full px-2.5 py-1.5 text-xs font-semibold ring-1 ring-inset ${statusStyle[lead.status]}`}>{STATUS.map(s => <option key={s}>{s}</option>)}</select></div><Link href={`/comercial/leads/${encodeURIComponent(lead.id)}`} className="mt-3 block text-right text-xs font-semibold text-emerald-700 hover:text-emerald-800">Abrir detalhes <ChevronRight className="inline" size={14}/></Link></article>)}</div>}

          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-slate-500">Página {page} de {pages}</p><div className="flex items-center gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft size={15}/> Anterior</button><button disabled={page >= pages || loading} onClick={() => setPage(p => Math.min(pages, p + 1))} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40">Próxima <ChevronRight size={15}/></button></div></div>
        </section>
      </div>

      {showNew && <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 backdrop-blur-sm" onMouseDown={e => { if (e.target === e.currentTarget) setShowNew(false); }}><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="text-lg font-bold text-slate-900">Cadastrar novo lead</h2><p className="text-xs text-slate-500">Preencha os dados da nova oportunidade.</p></div><button onClick={() => setShowNew(false)} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100" aria-label="Fechar"><X size={19}/></button></div><form onSubmit={createLead} className="space-y-4 p-5"><div className="grid gap-4 sm:grid-cols-2"><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Nome completo *</span><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100" placeholder="Nome do contato"/></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">E-mail</span><input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" placeholder="email@exemplo.com"/></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Telefone / WhatsApp</span><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" placeholder="(13) 99999-9999"/></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Empresa</span><input value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" placeholder="Nome da empresa"/></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Cidade</span><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" placeholder="Ex.: Santos"/></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Origem</span><select value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-500">{sources.slice(1).map(s => <option key={s}>{s}</option>)}</select></label><label><span className="mb-1.5 block text-xs font-semibold text-slate-600">Valor estimado (R$)</span><input type="number" min="0" step="0.01" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" placeholder="0,00"/></label><label className="sm:col-span-2"><span className="mb-1.5 block text-xs font-semibold text-slate-600">Observações</span><textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-emerald-500" placeholder="Necessidade, interesse, próximo passo..."/></label></div><div className="flex justify-end gap-2 border-t border-slate-100 pt-4"><button type="button" onClick={() => setShowNew(false)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancelar</button><button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">{saving ? <Loader2 size={16} className="animate-spin"/> : <Check size={16}/>} {saving ? "Salvando..." : "Salvar lead"}</button></div></form></div></div>}
    </main>
  );
}
