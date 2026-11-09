'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDownUp, ArrowUpRight, BarChart3, CalendarDays, Check, CheckCircle2,
  ChevronDown, ChevronLeft, ChevronRight, Clock3, Download, ExternalLink,
  Filter, Mail, MessageCircle, RefreshCw, Search, Sparkles,
  TrendingUp, Users, X,
} from 'lucide-react';

type Status = 'nova' | 'em_contato' | 'proposta_enviada' | 'fechada' | 'perdida';
type Cotacao = {
  id: number;
  criadoEm: string;
  nome: string;
  empresa: string;
  email: string;
  whatsapp: string;
  objetivo: string;
  canais: string[];
  meses: number;
  orcamento: number;
  total: number;
  status: Status;
};
type Campo = 'criadoEm' | 'empresa' | 'total';

const STATUS: { valor: Status; rotulo: string; cor: string; ponto: string }[] = [
  { valor: 'nova', rotulo: 'Nova', cor: 'bg-sky-50 text-sky-700 ring-sky-200', ponto: 'bg-sky-500' },
  { valor: 'em_contato', rotulo: 'Em contato', cor: 'bg-amber-50 text-amber-700 ring-amber-200', ponto: 'bg-amber-500' },
  { valor: 'proposta_enviada', rotulo: 'Proposta enviada', cor: 'bg-violet-50 text-violet-700 ring-violet-200', ponto: 'bg-violet-500' },
  { valor: 'fechada', rotulo: 'Fechada', cor: 'bg-emerald-50 text-emerald-700 ring-emerald-200', ponto: 'bg-emerald-500' },
  { valor: 'perdida', rotulo: 'Perdida', cor: 'bg-slate-100 text-slate-600 ring-slate-200', ponto: 'bg-slate-400' },
];
const NOMES_CANAIS: Record<string, string> = {
  instagram: 'Instagram e Facebook', google: 'Google Ads', tiktok: 'TikTok',
  whatsapp: 'WhatsApp', email: 'E-mail', influenciadores: 'Influenciadores',
};
const POR_PAGINA = 10;
const brl = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v || 0);
const dataCurta = (iso: string) => new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
const dataLonga = (iso: string) => new Date(iso).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
const statusInfo = (s: Status) => STATUS.find((x) => x.valor === s) ?? STATUS[0];

function StatusBadge({ status }: { status: Status }) {
  const s = statusInfo(status);
  return <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${s.cor}`}><span className={`h-1.5 w-1.5 rounded-full ${s.ponto}`} />{s.rotulo}</span>;
}

export default function CotacoesMarketingPage() {
  const [lista, setLista] = useState<Cotacao[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [atualizadoEm, setAtualizadoEm] = useState('');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<'todos' | Status>('todos');
  const [ordem, setOrdem] = useState<{ campo: Campo; dir: 'asc' | 'desc' }>({ campo: 'criadoEm', dir: 'desc' });
  const [pagina, setPagina] = useState(1);
  const [selecionadaId, setSelecionadaId] = useState<number | null>(null);
  const [salvandoId, setSalvandoId] = useState<number | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro('');
    try {
      const res = await fetch('/api/cotacao', { cache: 'no-store' });
      if (!res.ok) throw new Error('Falha ao carregar cotações.');
      const data: unknown = await res.json();
      if (!Array.isArray(data)) throw new Error('Formato de resposta inválido.');
      setLista(data as Cotacao[]);
      setAtualizadoEm(new Date().toLocaleString('pt-BR'));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar as cotações.');
    } finally { setCarregando(false); }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);
  useEffect(() => {
    if (selecionadaId === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelecionadaId(null); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selecionadaId]);

  async function mudarStatus(id: number, status: Status) {
    const anterior = lista;
    setLista((items) => items.map((c) => c.id === id ? { ...c, status } : c));
    setSalvandoId(id);
    setErro('');
    try {
      const res = await fetch('/api/cotacao', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status }) });
      if (!res.ok) throw new Error('Não foi possível salvar a alteração.');
    } catch (e) {
      setLista(anterior);
      setErro(e instanceof Error ? e.message : 'A alteração não foi salva.');
    } finally { setSalvandoId(null); }
  }

  const contagens = useMemo(() => {
    const m: Record<string, number> = { todos: lista.length };
    STATUS.forEach((s) => { m[s.valor] = lista.filter((c) => c.status === s.valor).length; });
    return m;
  }, [lista]);

  const indicadores = useMemo(() => {
    const fechadas = lista.filter((c) => c.status === 'fechada');
    const abertas = lista.filter((c) => c.status !== 'fechada' && c.status !== 'perdida');
    const decididas = fechadas.length + lista.filter((c) => c.status === 'perdida').length;
    return {
      novas: contagens.nova ?? 0,
      pipeline: abertas.reduce((s, c) => s + c.total, 0),
      fechado: fechadas.reduce((s, c) => s + c.total, 0),
      conversao: decididas ? Math.round(fechadas.length / decididas * 100) : 0,
    };
  }, [lista, contagens]);

  const filtradas = useMemo(() => {
    const q = busca.trim().toLowerCase();
    const base = lista.filter((c) => {
      if (filtro !== 'todos' && c.status !== filtro) return false;
      return !q || [c.empresa, c.nome, c.email, c.whatsapp, c.objetivo].some((v) => (v || '').toLowerCase().includes(q));
    });
    const fator = ordem.dir === 'asc' ? 1 : -1;
    return [...base].sort((a, b) => {
      const va = a[ordem.campo]; const vb = b[ordem.campo];
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * fator;
      return String(va).localeCompare(String(vb), 'pt-BR') * fator;
    });
  }, [lista, busca, filtro, ordem]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const visiveis = filtradas.slice((paginaAtual - 1) * POR_PAGINA, paginaAtual * POR_PAGINA);
  const selecionada = lista.find((c) => c.id === selecionadaId) ?? null;

  function exportarCsv() {
    const cab = ['Data', 'Empresa', 'Contato', 'E-mail', 'WhatsApp', 'Objetivo', 'Canais', 'Meses', 'Verba mensal', 'Estimativa', 'Status'];
    const esc = (v: string | number) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const linhas = filtradas.map((c) => [dataCurta(c.criadoEm), c.empresa, c.nome, c.email, c.whatsapp, c.objetivo, c.canais.map((x) => NOMES_CANAIS[x] ?? x).join(' + '), c.meses, c.orcamento, c.total, statusInfo(c.status).rotulo].map(esc).join(';'));
    const blob = new Blob(['\uFEFF' + [cab.map(esc).join(';'), ...linhas].join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob); const a = document.createElement('a');
    a.href = url; a.download = `cotacoes-marketing-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }

  function ordenarPor(campo: Campo) {
    setOrdem((o) => o.campo === campo ? { campo, dir: o.dir === 'asc' ? 'desc' : 'asc' } : { campo, dir: campo === 'empresa' ? 'asc' : 'desc' });
  }

  return (
    <main className="min-h-screen text-slate-900">
      <div className="mx-auto max-w-8xl">
        <section className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#063f3b] via-[#075d54] to-[#078b79] px-6 py-7 text-white shadow-xl shadow-teal-950/10 sm:px-8 sm:py-9">
          <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full border-[38px] border-white/5" />
          <div className="pointer-events-none absolute bottom-[-115px] right-[22%] h-64 w-64 rounded-full bg-emerald-300/10 blur-2xl" />
          <div className="relative flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-teal-50"><Sparkles size={14} /> CENTRAL DE MARKETING</div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Cotações de campanha</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-teal-50/80 sm:text-base">Gerencie solicitações, acompanhe negociações e transforme oportunidades em novos projetos.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => void carregar()} disabled={carregando} className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20 disabled:opacity-60"><RefreshCw size={16} className={carregando ? 'animate-spin' : ''} /> Atualizar</button>
              <button onClick={exportarCsv} disabled={!filtradas.length} className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#075d54] shadow-sm transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"><Download size={16} /> Exportar dados</button>
            </div>
          </div>
          <div className="relative mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-xs text-teal-50/75">
            <span className="inline-flex items-center gap-1.5"><CalendarDays size={14} /> Visão geral das solicitações</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> {atualizadoEm ? `Atualizado ${atualizadoEm}` : 'Aguardando atualização'}</span>
          </div>
        </section>

        <section className="-mt-1 grid grid-cols-1 gap-3 pt-5 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">Novas solicitações</span><span className="rounded-xl bg-sky-50 p-2.5 text-sky-700"><Users size={19}/></span></div><div className="mt-3 flex items-end justify-between"><strong className="text-3xl font-bold tracking-tight">{carregando ? '—' : indicadores.novas}</strong><span className="text-xs text-slate-400">Aguardando contato</span></div></article>
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">Pipeline em aberto</span><span className="rounded-xl bg-violet-50 p-2.5 text-violet-700"><BarChart3 size={19}/></span></div><div className="mt-3 flex items-end justify-between"><strong className="text-2xl font-bold tracking-tight">{carregando ? '—' : brl(indicadores.pipeline)}</strong><span className="text-xs text-slate-400">Valor estimado</span></div></article>
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">Negócios fechados</span><span className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700"><CheckCircle2 size={19}/></span></div><div className="mt-3 flex items-end justify-between"><strong className="text-2xl font-bold tracking-tight">{carregando ? '—' : brl(indicadores.fechado)}</strong><span className="text-xs text-slate-400">Total confirmado</span></div></article>
          <article className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-500">Conversão</span><span className="rounded-xl bg-teal-50 p-2.5 text-teal-700"><TrendingUp size={19}/></span></div><div className="mt-3 flex items-end justify-between"><strong className="text-3xl font-bold tracking-tight">{carregando ? '—' : `${indicadores.conversao}%`}</strong><span className="text-xs text-slate-400">Fechadas / decididas</span></div></article>
        </section>

        <section className="mt-6 overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">
            <div><div className="flex items-center gap-2"><h2 className="text-lg font-bold tracking-tight">Solicitações recebidas</h2><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">{filtradas.length}</span></div><p className="mt-1 text-sm text-slate-500">Consulte os dados e atualize o andamento de cada oportunidade.</p></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <label className="relative block sm:w-72"><Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input value={busca} onChange={(e) => { setBusca(e.target.value); setPagina(1); }} placeholder="Buscar empresa, contato..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"/></label>
              <button onClick={() => { setFiltro('todos'); setBusca(''); setPagina(1); }} className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"><Filter size={16}/> Limpar filtros</button>
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto border-b border-slate-100 px-5 py-3 sm:px-6">
            {[{ valor: 'todos' as const, rotulo: 'Todas' }, ...STATUS].map((s) => {
              const ativo = filtro === s.valor;
              return <button key={s.valor} onClick={() => { setFiltro(s.valor); setPagina(1); }} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-semibold transition ${ativo ? 'bg-[#075d54] text-white shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}>{s.rotulo}<span className={`rounded-md px-1.5 py-0.5 text-[11px] ${ativo ? 'bg-white/15 text-white' : 'bg-white text-slate-500'}`}>{contagens[s.valor] ?? 0}</span></button>;
            })}
          </div>

          {erro && <div role="alert" className="mx-5 mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 sm:mx-6">{erro}</div>}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead><tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-[0.08em] text-slate-500"><th className="px-6 py-4">Empresa / contato</th><th className="px-5 py-4">Objetivo</th><th className="px-5 py-4">Investimento</th><th className="px-5 py-4">Status</th><th className="px-5 py-4"><button onClick={() => ordenarPor('criadoEm')} className="inline-flex items-center gap-1.5 hover:text-slate-900">Recebida <ArrowDownUp size={13}/></button></th><th className="px-5 py-4 text-right">Ação</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {carregando && Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={6} className="px-6 py-5"><div className="h-10 animate-pulse rounded-lg bg-slate-100"/></td></tr>)}
                {!carregando && visiveis.length === 0 && <tr><td colSpan={6} className="px-6 py-16 text-center"><div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400"><Search size={21}/></div><p className="mt-3 font-semibold text-slate-700">{lista.length ? 'Nenhum resultado encontrado' : 'Nenhuma cotação recebida'}</p><p className="mt-1 text-sm text-slate-500">{lista.length ? 'Ajuste a busca ou selecione outro status.' : 'As solicitações enviadas pelo formulário aparecerão aqui.'}</p></td></tr>}
                {!carregando && visiveis.map((c) => <tr key={c.id} className="group transition hover:bg-[#f7fbfa]">
                  <td className="px-6 py-4"><button onClick={() => setSelecionadaId(c.id)} className="flex min-w-0 items-center gap-3 text-left"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-teal-100 to-emerald-50 text-sm font-bold text-teal-800">{(c.empresa || c.nome || '?').trim().charAt(0).toUpperCase()}</span><span className="min-w-0"><span className="block truncate font-semibold text-slate-800 group-hover:text-teal-800">{c.empresa || 'Empresa não informada'}</span><span className="mt-0.5 block truncate text-xs text-slate-500">{c.nome} · {c.email || c.whatsapp}</span></span></button></td>
                  <td className="px-5 py-4"><span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">{c.objetivo || '—'}</span></td>
                  <td className="px-5 py-4"><span className="block font-semibold tabular-nums text-slate-800">{brl(c.total)}</span><span className="mt-0.5 block text-xs text-slate-400">{c.meses} {c.meses === 1 ? 'mês' : 'meses'}</span></td>
                  <td className="px-5 py-4"><div className="flex flex-col items-start gap-1.5"><StatusBadge status={c.status}/>{salvandoId === c.id && <span className="text-[10px] text-slate-400">Salvando...</span>}</div></td>
                  <td className="px-5 py-4 text-sm text-slate-500">{dataCurta(c.criadoEm)}</td>
                  <td className="px-5 py-4 text-right"><button onClick={() => setSelecionadaId(c.id)} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold text-teal-800 transition hover:bg-teal-50">Detalhes <ArrowUpRight size={14}/></button></td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p className="text-xs text-slate-500">{filtradas.length ? `Exibindo ${(paginaAtual - 1) * POR_PAGINA + 1}–${Math.min(paginaAtual * POR_PAGINA, filtradas.length)} de ${filtradas.length} solicitações` : 'Nenhum registro para exibir'}</p><div className="flex items-center gap-2"><button disabled={paginaAtual <= 1} onClick={() => setPagina((p) => p - 1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronLeft size={16}/></button><span className="min-w-20 text-center text-xs font-semibold text-slate-600">Página {paginaAtual} de {totalPaginas}</span><button disabled={paginaAtual >= totalPaginas} onClick={() => setPagina((p) => p + 1)} className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:opacity-40"><ChevronRight size={16}/></button></div></div>
        </section>
      </div>

      {selecionada && <div className="fixed inset-0 z-50"><button aria-label="Fechar painel" onClick={() => setSelecionadaId(null)} className="absolute inset-0 cursor-default bg-slate-950/45 backdrop-blur-[2px]"/><aside role="dialog" aria-modal="true" aria-label={`Detalhes da cotação ${selecionada.empresa}`} className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5"><div><p className="text-xs font-bold uppercase tracking-wider text-teal-700">Detalhes da oportunidade · #{selecionada.id}</p><h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">{selecionada.empresa}</h2><p className="mt-1 text-sm text-slate-500">Recebida em {dataLonga(selecionada.criadoEm)}</p></div><button onClick={() => setSelecionadaId(null)} aria-label="Fechar" className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-50"><X size={18}/></button></div>
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
          <div className="rounded-2xl bg-gradient-to-br from-[#064b45] to-[#087f70] p-5 text-white"><p className="text-xs font-semibold uppercase tracking-wider text-teal-100">Estimativa total</p><p className="mt-2 text-3xl font-bold tabular-nums">{brl(selecionada.total)}</p><div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/15 pt-4"><div><p className="text-xs text-teal-100">Verba mensal</p><p className="mt-1 font-semibold">{brl(selecionada.orcamento)}</p></div><div><p className="text-xs text-teal-100">Duração</p><p className="mt-1 font-semibold">{selecionada.meses} {selecionada.meses === 1 ? 'mês' : 'meses'}</p></div></div></div>
          <div><label htmlFor="status-cotacao" className="mb-2 block text-sm font-semibold text-slate-700">Etapa da negociação</label><div className="relative"><select id="status-cotacao" value={selecionada.status} onChange={(e) => void mudarStatus(selecionada.id, e.target.value as Status)} className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-semibold text-slate-700 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10">{STATUS.map((s) => <option key={s.valor} value={s.valor}>{s.rotulo}</option>)}</select><ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"/></div></div>
          <div><h3 className="mb-3 text-sm font-bold text-slate-800">Informações de contato</h3><div className="space-y-3 rounded-2xl border border-slate-200 p-4"><div><p className="text-xs text-slate-400">Pessoa responsável</p><p className="mt-0.5 font-semibold text-slate-800">{selecionada.nome || 'Não informado'}</p></div><div className="flex items-center gap-2 text-sm text-slate-600"><Mail size={15} className="text-slate-400"/>{selecionada.email || 'E-mail não informado'}</div><div className="flex items-center gap-2 text-sm text-slate-600"><MessageCircle size={15} className="text-slate-400"/>{selecionada.whatsapp || 'WhatsApp não informado'}</div><div className="flex flex-wrap gap-2 pt-2">{selecionada.whatsapp && <a href={`https://wa.me/55${selecionada.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-[#0b8f78] px-3.5 py-2.5 text-xs font-bold text-white hover:bg-[#087b68]">WhatsApp <ExternalLink size={13}/></a>}{selecionada.email && <a href={`mailto:${selecionada.email}`} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50">Enviar e-mail <ArrowUpRight size={13}/></a>}</div></div></div>
          <div><h3 className="mb-3 text-sm font-bold text-slate-800">Resumo da campanha</h3><dl className="divide-y divide-slate-100 rounded-2xl border border-slate-200 px-4"><div className="flex justify-between gap-4 py-3 text-sm"><dt className="text-slate-500">Objetivo</dt><dd className="text-right font-medium text-slate-800">{selecionada.objetivo || '—'}</dd></div><div className="flex justify-between gap-4 py-3 text-sm"><dt className="text-slate-500">Canais</dt><dd className="max-w-[65%] text-right font-medium text-slate-800">{(selecionada.canais || []).map((x) => NOMES_CANAIS[x] ?? x).join(', ') || '—'}</dd></div></dl></div>
        </div>
        <div className="border-t border-slate-100 px-6 py-4"><button onClick={() => setSelecionadaId(null)} className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"><Check size={16} className="mr-2 inline"/> Concluir visualização</button></div>
      </aside></div>}
    </main>
  );
}
