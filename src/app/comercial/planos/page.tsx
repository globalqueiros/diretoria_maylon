"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    CircleCheck,
    Eye,
    MapPin,
    RefreshCw,
    Search,
    UserPlus,
    UserX,
    Users,
    Plus,
} from "lucide-react";

const API_BASE = "/api/maylon-pass";

const NOVO_PLANO_URL = "/comercial/planos/novo";

const ALERTA_KEY = "maylon-pass:alerta";

type PlanoPass = "basico" | "plus" | "premium";
type FiltroStatus = "todos" | "ativo" | "inativo";

interface Assinante {
    id: number | string;
    numero?: string | null;
    nome: string;
    email?: string | null;
    telefone?: string | null;
    cidade?: string | null;
    plano?: string | null;
    status: number | boolean | string; // 0 = Ativo | 1 = Inativo
    criado_em?: string | null;
}

/* ------------------------------------------------------------------ */
/* Regras e formatadores                                               */
/* ------------------------------------------------------------------ */

// Status: 0 = Ativo | 1 = Inativo (tinyint(1) pode chegar como boolean)
function estaAtivo(status: unknown) {
    if (status === false) return true;
    if (status === true) return false;
    const v = String(status ?? "").trim().toLowerCase();
    return v === "0" || v === "ativo";
}

function estaInativo(status: unknown) {
    if (status === true) return true;
    if (status === false) return false;
    const v = String(status ?? "").trim().toLowerCase();
    return v === "1" || v === "inativo";
}

const PLANOS: Record<PlanoPass, { label: string; classe: string }> = {
    basico: {
        label: "Básico",
        classe: "bg-slate-100 text-slate-600 ring-slate-300/60",
    },
    plus: {
        label: "Plus",
        classe: "bg-emerald-50 text-emerald-700 ring-emerald-300/60",
    },
    premium: {
        label: "Premium",
        classe: "bg-amber-50 text-amber-700 ring-amber-300/60",
    },
};

function resolverPlano(plano?: string | null) {
    const chave = String(plano ?? "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") as PlanoPass;

    return PLANOS[chave] ?? null;
}

function formatarTelefone(valor?: string | null) {
    if (!valor) return "—";
    const n = valor.replace(/\D/g, "");
    if (n.length === 11) return n.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    if (n.length === 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    return valor;
}

function numeroAssinante(a: Assinante) {
    if (a.numero) return a.numero;
    return `MP-${String(a.id).padStart(4, "0")}`;
}

function criadoNosUltimosDias(valor: string | null | undefined, dias: number) {
    if (!valor) return false;
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return false;
    return Date.now() - data.getTime() <= dias * 24 * 60 * 60 * 1000;
}

function semAcento(texto: string) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

const POR_PAGINA = 10;

function numeroBRFormat(n: number) {
    return new Intl.NumberFormat("pt-BR").format(n);
}

/* ------------------------------------------------------------------ */
/* Componentes                                                         */
/* ------------------------------------------------------------------ */

function CardIndicador({
    titulo,
    valor,
    icone,
    fundo,
    carregando,
}: {
    titulo: string;
    valor: number;
    icone: ReactNode;
    fundo: string;
    carregando: boolean;
}) {
    return (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm sm:p-5">
            <div className="min-w-0">
                <p className="truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                    {titulo}
                </p>
                <p className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                    {carregando ? "--" : numeroBRFormat(valor)}
                </p>
            </div>

            <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-12 sm:w-12 ${fundo}`}
            >
                {icone}
            </div>
        </div>
    );
}

function BadgeStatus({ status }: { status: unknown }) {
    if (estaAtivo(status)) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-300/60">
                <CircleCheck size={13} />
                Ativo
            </span>
        );
    }

    if (estaInativo(status)) {
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-300/60">
                <UserX size={13} />
                Inativo
            </span>
        );
    }

    return (
        <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-300/60">
            Não informado
        </span>
    );
}

function BadgePlano({ plano }: { plano?: string | null }) {
    const info = resolverPlano(plano);

    if (!info) {
        return <span className="text-sm text-slate-400">—</span>;
    }

    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset ${info.classe}`}
        >
            {info.label}
        </span>
    );
}

function BotaoVer({ id }: { id: number | string }) {
    return (
        <Link
            href={`/maylon-pass/${id}`}
            aria-label="Ver detalhes do assinante"
            title="Ver detalhes"
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:border-[#0a9a82] hover:text-[#0a9a82] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0a9a82]"
        >
            <Eye size={16} />
        </Link>
    );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function MaylonPassPage() {
    const [assinantes, setAssinantes] = useState<Assinante[]>([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");

    const [busca, setBusca] = useState("");
    const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>("todos");
    const [filtroPlano, setFiltroPlano] = useState<"todos" | PlanoPass>("todos");
    const [pagina, setPagina] = useState(1);

    const [alerta, setAlerta] = useState("");

    // CORREÇÃO: a API devolve { usuarios: [...] } com campos em inglês
    // (full_name, phone, created_at). Aqui convertemos para o formato da página.
    const carregar = useCallback(async () => {
        try {
            setLoading(true);
            setErro("");

            const res = await fetch(API_BASE, { cache: "no-store" });
            if (!res.ok) throw new Error("Erro ao buscar assinantes.");

            const data = await res.json();
            const lista: any[] = Array.isArray(data)
                ? data
                : data?.usuarios ?? data?.assinantes ?? [];

            setAssinantes(
                lista.map((u) => ({
                    id: u.id,
                    numero: u.numero ?? null,
                    nome: u.nome ?? u.full_name ?? "Nome não informado",
                    email: u.email ?? null,
                    telefone: u.telefone ?? u.phone ?? null,
                    cidade: u.cidade ?? null,
                    plano: u.plano ?? null,
                    // a API só lista assinaturas ativas; sem status = Ativo
                    status: u.status ?? 0,
                    criado_em: u.criado_em ?? u.created_at ?? null,
                }))
            );
        } catch (error) {
            console.error(error);
            setAssinantes([]);
            setErro("Não foi possível carregar os assinantes do Maylon Pass.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        carregar();
    }, [carregar]);

    // Mostra o aviso de sucesso vindo da página "Novo plano"
    useEffect(() => {
        try {
            const mensagem = sessionStorage.getItem(ALERTA_KEY);
            if (mensagem) {
                setAlerta(mensagem);
                sessionStorage.removeItem(ALERTA_KEY);
            }
        } catch {
            /* sessionStorage indisponível: ignora */
        }
    }, []);

    // Some com o aviso de sucesso depois de alguns segundos
    useEffect(() => {
        if (!alerta) return;
        const timer = setTimeout(() => setAlerta(""), 6000);
        return () => clearTimeout(timer);
    }, [alerta]);

    /* Indicadores */
    const total = assinantes.length;
    const ativos = assinantes.filter((a) => estaAtivo(a.status)).length;
    const inativos = assinantes.filter((a) => estaInativo(a.status)).length;
    const novos = assinantes.filter((a) => criadoNosUltimosDias(a.criado_em, 30)).length;

    /* Filtros */
    const filtrados = useMemo(() => {
        const termo = semAcento(busca.trim());

        return assinantes.filter((a) => {
            if (filtroStatus === "ativo" && !estaAtivo(a.status)) return false;
            if (filtroStatus === "inativo" && !estaInativo(a.status)) return false;

            if (filtroPlano !== "todos") {
                const info = resolverPlano(a.plano);
                if (info?.label !== PLANOS[filtroPlano].label) return false;
            }

            if (!termo) return true;

            const alvo = semAcento(
                `${numeroAssinante(a)} ${a.nome ?? ""} ${a.email ?? ""} ${a.telefone ?? ""}`
            );
            return alvo.includes(termo);
        });
    }, [assinantes, busca, filtroStatus, filtroPlano]);

    const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const visiveis = filtrados.slice(
        (paginaAtual - 1) * POR_PAGINA,
        paginaAtual * POR_PAGINA
    );

    // Volta para a primeira página ao mudar filtros
    useEffect(() => {
        setPagina(1);
    }, [busca, filtroStatus, filtroPlano]);

    const classeChip = (ativo: boolean) =>
        `cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0a9a82] ${
            ativo
                ? "bg-[#0a9a82] text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        }`;

    return (
        <main className="min-h-screen bg-gradient-to-b from-[#35b890] to-[#4cc9a5] px-3 pb-10 pt-3 sm:px-5 lg:px-8 2xl:px-12">
            <div className="mx-auto max-w-[1600px] space-y-5">
                {/* INDICADORES */}
                <section
                    aria-label="Indicadores do Maylon Pass"
                    className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4"
                >
                    <CardIndicador
                        titulo="Total de assinantes"
                        valor={total}
                        carregando={loading}
                        fundo="bg-teal-50 text-teal-600"
                        icone={<Users size={22} />}
                    />
                    <CardIndicador
                        titulo="Assinantes ativos"
                        valor={ativos}
                        carregando={loading}
                        fundo="bg-emerald-50 text-emerald-600"
                        icone={<CircleCheck size={22} />}
                    />
                    <CardIndicador
                        titulo="Assinantes inativos"
                        valor={inativos}
                        carregando={loading}
                        fundo="bg-amber-50 text-amber-500"
                        icone={<UserX size={22} />}
                    />
                    <CardIndicador
                        titulo="Novos (30 dias)"
                        valor={novos}
                        carregando={loading}
                        fundo="bg-blue-50 text-blue-600"
                        icone={<UserPlus size={22} />}
                    />
                </section>

                {alerta && (
                    <div
                        role="status"
                        className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white px-5 py-4 text-sm font-medium text-emerald-700 shadow-sm"
                    >
                        <CircleCheck size={18} className="mt-0.5 shrink-0" />
                        {alerta}
                    </div>
                )}

                {/* LISTA */}
                <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-600">
                                <Users size={22} />
                            </div>

                            <div>
                                <h1 className="text-lg font-bold text-slate-900 sm:text-xl">
                                    Maylon Pass
                                </h1>
                                <p className="text-sm text-slate-400">
                                    Acompanhe os assinantes, planos e status das
                                    assinaturas.
                                </p>
                            </div>
                        </div>

                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
                            <Link
                                href={NOVO_PLANO_URL}
                                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#0a9a82] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#08846f] sm:w-auto"
                            >
                                <Plus size={16} />
                                Novo plano
                            </Link>

                            <button
                                type="button"
                                onClick={carregar}
                                disabled={loading}
                                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#0a9a82] bg-white px-5 py-2.5 text-sm font-bold text-[#0a9a82] transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
                            >
                                <RefreshCw
                                    size={16}
                                    className={loading ? "animate-spin" : ""}
                                />
                                Atualizar
                            </button>
                        </div>
                    </div>

                    {/* Busca e filtros */}
                    <div className="space-y-4 p-5 sm:p-6">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="relative w-full lg:max-w-md">
                                <Search
                                    size={17}
                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="search"
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    placeholder="Pesquisar assinante, número ou e-mail..."
                                    aria-label="Pesquisar assinante"
                                    className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0a9a82] focus:ring-4 focus:ring-teal-500/10"
                                />
                            </div>

                            <span className="w-fit rounded-md bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-500">
                                {filtrados.length}{" "}
                                {filtrados.length === 1 ? "assinante" : "assinantes"}
                            </span>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
                            <div
                                className="flex flex-wrap items-center gap-2"
                                role="group"
                                aria-label="Filtrar por status"
                            >
                                <span className="mr-1 text-xs font-semibold text-slate-400">
                                    Status
                                </span>
                                {(
                                    [
                                        ["todos", "Todos"],
                                        ["ativo", "Ativos"],
                                        ["inativo", "Inativos"],
                                    ] as [FiltroStatus, string][]
                                ).map(([valor, label]) => (
                                    <button
                                        key={valor}
                                        type="button"
                                        aria-pressed={filtroStatus === valor}
                                        onClick={() => setFiltroStatus(valor)}
                                        className={classeChip(filtroStatus === valor)}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>

                            <div
                                className="flex flex-wrap items-center gap-2"
                                role="group"
                                aria-label="Filtrar por plano"
                            >
                                <span className="mr-1 text-xs font-semibold text-slate-400">
                                    Plano
                                </span>
                                <button
                                    type="button"
                                    aria-pressed={filtroPlano === "todos"}
                                    onClick={() => setFiltroPlano("todos")}
                                    className={classeChip(filtroPlano === "todos")}
                                >
                                    Todos
                                </button>
                                {(Object.keys(PLANOS) as PlanoPass[]).map((p) => (
                                    <button
                                        key={p}
                                        type="button"
                                        aria-pressed={filtroPlano === p}
                                        onClick={() => setFiltroPlano(p)}
                                        className={classeChip(filtroPlano === p)}
                                    >
                                        {PLANOS[p].label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Conteúdo */}
                    {loading ? (
                        <div className="space-y-px border-t border-slate-100" aria-busy="true">
                            {Array.from({ length: 5 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="flex animate-pulse items-center gap-4 px-6 py-5"
                                >
                                    <div className="h-4 w-20 rounded bg-slate-100" />
                                    <div className="h-4 flex-1 rounded bg-slate-100" />
                                    <div className="hidden h-4 w-40 rounded bg-slate-100 md:block" />
                                    <div className="h-6 w-16 rounded-full bg-slate-100" />
                                </div>
                            ))}
                        </div>
                    ) : erro ? (
                        <div className="border-t border-slate-100 px-6 py-14 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-red-500">
                                <CircleAlert size={28} />
                            </div>
                            <p className="mt-4 text-sm font-semibold text-slate-800">
                                {erro}
                            </p>
                            <button
                                type="button"
                                onClick={carregar}
                                className="mt-4 cursor-pointer rounded-lg bg-[#0a9a82] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#08846f]"
                            >
                                Tentar novamente
                            </button>
                        </div>
                    ) : filtrados.length === 0 ? (
                        <div className="border-t border-slate-100 px-6 py-14 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                <Users size={26} />
                            </div>
                            <p className="mt-4 text-sm font-semibold text-slate-800">
                                {assinantes.length === 0
                                    ? "Nenhum assinante cadastrado ainda."
                                    : "Nenhum assinante encontrado com esses filtros."}
                            </p>
                            {assinantes.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBusca("");
                                        setFiltroStatus("todos");
                                        setFiltroPlano("todos");
                                    }}
                                    className="mt-3 cursor-pointer text-sm font-bold text-[#0a9a82] hover:underline"
                                >
                                    Limpar filtros
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Tabela (md em diante) */}
                            <div className="hidden overflow-x-auto border-t border-slate-100 md:block">
                                <table className="w-full min-w-[860px]">
                                    <thead>
                                        <tr className="bg-slate-50">
                                            {[
                                                "Nº assinante",
                                                "Nome completo",
                                                "Contato",
                                                "Telefone",
                                                "Plano",
                                                "Status",
                                                "Ação",
                                            ].map((titulo) => (
                                                <th
                                                    key={titulo}
                                                    scope="col"
                                                    className="px-4 py-4 text-center text-[11px] font-bold uppercase tracking-wider text-slate-400"
                                                >
                                                    {titulo}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {visiveis.map((a) => (
                                            <tr
                                                key={a.id}
                                                className="border-t border-slate-100 transition hover:bg-slate-50/70"
                                            >
                                                <td className="px-4 py-5 text-center text-sm font-bold text-sky-700">
                                                    {numeroAssinante(a)}
                                                </td>

                                                <td className="px-4 py-5 text-center">
                                                    <span className="text-sm font-bold text-slate-900">
                                                        {a.nome}
                                                    </span>
                                                    {a.cidade && (
                                                        <span className="mt-0.5 flex items-center justify-center gap-1 text-xs text-slate-400">
                                                            <MapPin size={12} />
                                                            {a.cidade}
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="px-4 py-5 text-center text-sm text-slate-700">
                                                    {a.email || "—"}
                                                </td>

                                                <td className="px-4 py-5 text-center text-sm text-slate-700">
                                                    {formatarTelefone(a.telefone)}
                                                </td>

                                                <td className="px-4 py-5 text-center">
                                                    <BadgePlano plano={a.plano} />
                                                </td>

                                                <td className="px-4 py-5 text-center">
                                                    <BadgeStatus status={a.status} />
                                                </td>

                                                <td className="px-4 py-5 text-center">
                                                    <BotaoVer id={a.id} />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Cards (celular) */}
                            <ul className="divide-y divide-slate-100 border-t border-slate-100 md:hidden">
                                {visiveis.map((a) => (
                                    <li key={a.id} className="space-y-3 p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-sky-700">
                                                    {numeroAssinante(a)}
                                                </p>
                                                <p className="mt-0.5 break-words text-base font-bold text-slate-900">
                                                    {a.nome}
                                                </p>
                                            </div>
                                            <BadgeStatus status={a.status} />
                                        </div>

                                        <div className="space-y-1 text-sm text-slate-600">
                                            <p className="break-all">{a.email || "—"}</p>
                                            <p>{formatarTelefone(a.telefone)}</p>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <BadgePlano plano={a.plano} />
                                            <BotaoVer id={a.id} />
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            {/* Paginação */}
                            {totalPaginas > 1 && (
                                <nav
                                    aria-label="Paginação"
                                    className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 sm:px-6"
                                >
                                    <p className="text-xs text-slate-500">
                                        Página{" "}
                                        <strong className="text-slate-700">
                                            {paginaAtual}
                                        </strong>{" "}
                                        de {totalPaginas}
                                    </p>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setPagina(paginaAtual - 1)}
                                            disabled={paginaAtual === 1}
                                            className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            <ChevronLeft size={14} />
                                            Anterior
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setPagina(paginaAtual + 1)}
                                            disabled={paginaAtual === totalPaginas}
                                            className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Próxima
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </nav>
                            )}
                        </>
                    )}
                </section>
            </div>

        </main>
    );
}