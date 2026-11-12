"use client";

import {
    CheckCircle2,
    CircleAlert,
    Clock,
    Headset,
    RefreshCw,
    Search,
    User,
    Car,
    X,
    PlayCircle,
    MessageSquare,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

type StatusChamado = "aberto" | "em_atendimento" | "resolvido";
type Prioridade = "baixa" | "media" | "alta";
type TipoSolicitante = "passageiro" | "motorista";

interface Chamado {
    id: number;
    protocolo: string;
    assunto: string;
    descricao: string;
    solicitante: string;
    tipo: TipoSolicitante;
    cidade: string;
    prioridade: Prioridade;
    status: StatusChamado;
    criado_em: string;
    atualizado_em: string;
}

type FiltroStatus = "todos" | StatusChamado;

/* ------------------------------------------------------------------ */
/* Utilitários                                                         */
/* ------------------------------------------------------------------ */

const STATUS_INFO: Record<StatusChamado, { rotulo: string; classe: string }> = {
    aberto: { rotulo: "Aberto", classe: "bg-amber-100 text-amber-700" },
    em_atendimento: {
        rotulo: "Em atendimento",
        classe: "bg-sky-100 text-sky-700",
    },
    resolvido: { rotulo: "Resolvido", classe: "bg-emerald-100 text-emerald-700" },
};

const PRIORIDADE_INFO: Record<Prioridade, { rotulo: string; classe: string }> = {
    baixa: { rotulo: "Baixa", classe: "bg-slate-100 text-slate-600" },
    media: { rotulo: "Média", classe: "bg-orange-100 text-orange-700" },
    alta: { rotulo: "Alta", classe: "bg-red-100 text-red-700" },
};

function formatarDataHora(valor?: string | null) {
    if (!valor) return "—";
    const data = new Date(valor);
    return Number.isNaN(data.getTime())
        ? "—"
        : data.toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
          });
}

function tempoDecorrido(valor?: string | null) {
    if (!valor) return "—";
    const data = new Date(valor).getTime();
    if (Number.isNaN(data)) return "—";

    const min = Math.max(0, Math.floor((Date.now() - data) / 60000));
    if (min < 1) return "agora";
    if (min < 60) return `há ${min} min`;
    const h = Math.floor(min / 60);
    if (h < 24) return `há ${h} h`;
    return `há ${Math.floor(h / 24)} d`;
}

/* ------------------------------------------------------------------ */
/* Componentes auxiliares                                              */
/* ------------------------------------------------------------------ */

function CardResumo({
    titulo,
    valor,
    legenda,
    corLegenda,
    fundoIcone,
    icone,
    carregando,
}: {
    titulo: string;
    valor: number;
    legenda: string;
    corLegenda: string;
    fundoIcone: string;
    icone: ReactNode;
    carregando: boolean;
}) {
    return (
        <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-slate-500">{titulo}</p>
                    <h3 className="mt-2 text-3xl font-bold text-slate-800">
                        {carregando ? "--" : String(valor).padStart(2, "0")}
                    </h3>
                    <p className={`mt-1 text-xs ${corLegenda}`}>{legenda}</p>
                </div>

                <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${fundoIcone}`}
                >
                    {icone}
                </div>
            </div>
        </div>
    );
}

function BadgeStatus({ status }: { status: StatusChamado }) {
    const info = STATUS_INFO[status] ?? STATUS_INFO.aberto;
    return (
        <span
            className={`inline-flex whitespace-nowrap rounded-lg px-2.5 py-1 text-xs font-bold ${info.classe}`}
        >
            {info.rotulo}
        </span>
    );
}

function BadgePrioridade({ prioridade }: { prioridade: Prioridade }) {
    const info = PRIORIDADE_INFO[prioridade] ?? PRIORIDADE_INFO.baixa;
    return (
        <span
            className={`inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${info.classe}`}
        >
            {info.rotulo}
        </span>
    );
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function AtendimentoPage() {
    const [chamados, setChamados] = useState<Chamado[]>([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(false);

    const [filtro, setFiltro] = useState<FiltroStatus>("todos");
    const [busca, setBusca] = useState("");

    const [selecionado, setSelecionado] = useState<Chamado | null>(null);
    const [salvando, setSalvando] = useState(false);
    const [erroAcao, setErroAcao] = useState("");

    /* ---------------------------- Carregamento ---------------------------- */

    async function carregarChamados(silencioso = false) {
        try {
            if (!silencioso) setLoading(true);
            setErro(false);

            const res = await fetch("/api/atendente/chamados", {
                cache: "no-store",
            });
            if (!res.ok) throw new Error("Erro ao buscar chamados.");

            const data = await res.json();
            const lista: Partial<Chamado>[] = Array.isArray(data)
                ? data
                : Array.isArray(data?.chamados)
                  ? data.chamados
                  : [];

            setChamados(
                lista.map((c) => ({
                    id: Number(c.id ?? 0),
                    protocolo: String(c.protocolo ?? `#${c.id ?? 0}`),
                    assunto: String(c.assunto ?? "Sem assunto"),
                    descricao: String(c.descricao ?? ""),
                    solicitante: String(c.solicitante ?? "Não informado"),
                    tipo: (c.tipo as TipoSolicitante) ?? "passageiro",
                    cidade: String(c.cidade ?? "—"),
                    prioridade: (c.prioridade as Prioridade) ?? "media",
                    status: (c.status as StatusChamado) ?? "aberto",
                    criado_em: String(c.criado_em ?? ""),
                    atualizado_em: String(c.atualizado_em ?? ""),
                }))
            );
        } catch (error) {
            console.error(error);
            setChamados([]);
            setErro(true);
        } finally {
            setLoading(false);
        }
    }

    async function alterarStatus(chamado: Chamado, status: StatusChamado) {
        try {
            setSalvando(true);
            setErroAcao("");

            const res = await fetch(`/api/atendente/chamados/${chamado.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status }),
            });
            if (!res.ok) throw new Error("Erro ao atualizar chamado.");

            const agora = new Date().toISOString();
            const atualizado = { ...chamado, status, atualizado_em: agora };

            setChamados((lista) =>
                lista.map((c) => (c.id === chamado.id ? atualizado : c))
            );
            setSelecionado(atualizado);
        } catch (error) {
            console.error(error);
            setErroAcao("Não foi possível atualizar o chamado. Tente novamente.");
        } finally {
            setSalvando(false);
        }
    }

    /* ---------------------------- Efeitos ---------------------------- */

    useEffect(() => {
        carregarChamados();
        // atualiza a fila a cada 30 segundos
        const interval = setInterval(() => carregarChamados(true), 30000);
        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        function aoTeclar(e: KeyboardEvent) {
            if (e.key === "Escape") setSelecionado(null);
        }
        window.addEventListener("keydown", aoTeclar);
        return () => window.removeEventListener("keydown", aoTeclar);
    }, []);

    /* ---------------------------- Derivados ---------------------------- */

    const contagem = useMemo(
        () => ({
            aberto: chamados.filter((c) => c.status === "aberto").length,
            em_atendimento: chamados.filter((c) => c.status === "em_atendimento")
                .length,
            resolvido: chamados.filter((c) => c.status === "resolvido").length,
        }),
        [chamados]
    );

    const filtrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        const peso: Record<Prioridade, number> = { alta: 0, media: 1, baixa: 2 };

        return chamados
            .filter((c) => {
                if (filtro !== "todos" && c.status !== filtro) return false;
                if (!termo) return true;
                return (
                    c.protocolo.toLowerCase().includes(termo) ||
                    c.assunto.toLowerCase().includes(termo) ||
                    c.solicitante.toLowerCase().includes(termo) ||
                    c.cidade.toLowerCase().includes(termo)
                );
            })
            .sort((a, b) => {
                // resolvidos por último, depois prioridade, depois mais antigos primeiro
                const ra = a.status === "resolvido" ? 1 : 0;
                const rb = b.status === "resolvido" ? 1 : 0;
                if (ra !== rb) return ra - rb;
                if (peso[a.prioridade] !== peso[b.prioridade])
                    return peso[a.prioridade] - peso[b.prioridade];
                return (
                    new Date(a.criado_em).getTime() -
                    new Date(b.criado_em).getTime()
                );
            });
    }, [chamados, filtro, busca]);

    const abas: { id: FiltroStatus; rotulo: string; qtd: number }[] = [
        { id: "todos", rotulo: "Todos", qtd: chamados.length },
        { id: "aberto", rotulo: "Abertos", qtd: contagem.aberto },
        {
            id: "em_atendimento",
            rotulo: "Em atendimento",
            qtd: contagem.em_atendimento,
        },
        { id: "resolvido", rotulo: "Resolvidos", qtd: contagem.resolvido },
    ];

    /* ---------------------------- Render ---------------------------- */

    return (
        <main className="min-h-screen">
            {/* CABEÇALHO */}
            <header className="mb-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white sm:text-3xl">
                            Atendimento
                        </h1>
                        <p className="mt-1 text-sm text-white/70">
                            Fila de chamados de passageiros e motoristas.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => carregarChamados()}
                        disabled={loading}
                        className="flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-[#00a99d] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00958b] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <RefreshCw
                            size={17}
                            className={loading ? "animate-spin" : ""}
                        />
                        {loading ? "Atualizando..." : "Atualizar"}
                    </button>
                </div>
            </header>

            {/* CARDS */}
            <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <CardResumo
                    titulo="Abertos"
                    valor={contagem.aberto}
                    legenda="Aguardando atendente"
                    corLegenda="text-amber-600"
                    fundoIcone="bg-amber-100"
                    icone={<Clock size={24} className="text-amber-600" />}
                    carregando={loading}
                />
                <CardResumo
                    titulo="Em atendimento"
                    valor={contagem.em_atendimento}
                    legenda="Sendo tratados agora"
                    corLegenda="text-sky-600"
                    fundoIcone="bg-sky-100"
                    icone={<Headset size={24} className="text-sky-600" />}
                    carregando={loading}
                />
                <CardResumo
                    titulo="Resolvidos"
                    valor={contagem.resolvido}
                    legenda="Finalizados"
                    corLegenda="text-emerald-600"
                    fundoIcone="bg-emerald-100"
                    icone={<CheckCircle2 size={24} className="text-emerald-600" />}
                    carregando={loading}
                />
            </section>

            {/* FILA */}
            <section>
                <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100">
                                <MessageSquare size={21} className="text-teal-700" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">
                                    Fila de chamados
                                </h3>
                                <p className="text-sm text-slate-500">
                                    Ordenada por prioridade e tempo de espera.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex flex-wrap rounded-xl bg-slate-100 p-1">
                                {abas.map((aba) => (
                                    <button
                                        key={aba.id}
                                        type="button"
                                        onClick={() => setFiltro(aba.id)}
                                        className={`cursor-pointer rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                                            filtro === aba.id
                                                ? "bg-white text-slate-900 shadow-sm"
                                                : "text-slate-500 hover:text-slate-700"
                                        }`}
                                    >
                                        {aba.rotulo}
                                        <span className="ml-1.5 text-slate-400">
                                            {aba.qtd}
                                        </span>
                                    </button>
                                ))}
                            </div>

                            <div className="relative">
                                <Search
                                    size={16}
                                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    type="text"
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    placeholder="Buscar protocolo, nome ou assunto"
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#00a99d] focus:ring-2 focus:ring-[#00a99d]/20 sm:w-72"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[860px]">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-700">
                                        Protocolo
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-700">
                                        Solicitante
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-700">
                                        Assunto
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-700">
                                        Cidade
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-700">
                                        Prioridade
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-700">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-700">
                                        Aberto
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-12 text-center text-sm text-slate-500"
                                        >
                                            <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#00a99d]" />
                                            Carregando chamados...
                                        </td>
                                    </tr>
                                ) : erro ? (
                                    <tr>
                                        <td colSpan={7} className="py-12 text-center">
                                            <CircleAlert
                                                size={28}
                                                className="mx-auto text-red-500"
                                            />
                                            <p className="mt-2 text-sm font-medium text-red-600">
                                                Não foi possível carregar os chamados.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={() => carregarChamados()}
                                                className="mt-3 cursor-pointer rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                                            >
                                                Tentar novamente
                                            </button>
                                        </td>
                                    </tr>
                                ) : filtrados.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-12 text-center text-sm text-slate-500"
                                        >
                                            Nenhum chamado encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    filtrados.map((c) => (
                                        <tr
                                            key={c.id}
                                            onClick={() => {
                                                setErroAcao("");
                                                setSelecionado(c);
                                            }}
                                            className="cursor-pointer border-t border-slate-100 transition hover:bg-slate-50"
                                        >
                                            <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-slate-800">
                                                {c.protocolo}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div
                                                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                                                            c.tipo === "motorista"
                                                                ? "bg-indigo-100 text-indigo-600"
                                                                : "bg-teal-100 text-teal-700"
                                                        }`}
                                                    >
                                                        {c.tipo === "motorista" ? (
                                                            <Car size={16} />
                                                        ) : (
                                                            <User size={16} />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-semibold text-slate-800">
                                                            {c.solicitante}
                                                        </p>
                                                        <p className="text-xs capitalize text-slate-500">
                                                            {c.tipo}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="max-w-[260px] truncate px-4 py-4 text-sm text-slate-700">
                                                {c.assunto}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-600">
                                                {c.cidade}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <BadgePrioridade
                                                    prioridade={c.prioridade}
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <BadgeStatus status={c.status} />
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-500">
                                                {tempoDecorrido(c.criado_em)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* MODAL DO CHAMADO */}
            {selecionado && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-md sm:p-6"
                    onClick={() => setSelecionado(null)}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="chamado-titulo"
                        className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl shadow-slate-950/30"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="relative overflow-hidden bg-gradient-to-r from-[#087f70] to-[#00a99d] px-6 py-6 text-white">
                            <div className="absolute -right-8 -top-12 h-40 w-40 rounded-full bg-white/10" />
                            <div className="absolute -bottom-16 right-24 h-40 w-40 rounded-full bg-white/10" />

                            <div className="relative flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                                        Chamado {selecionado.protocolo}
                                    </p>
                                    <h2
                                        id="chamado-titulo"
                                        className="mt-1 text-xl font-bold sm:text-2xl"
                                    >
                                        {selecionado.assunto}
                                    </h2>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setSelecionado(null)}
                                    aria-label="Fechar modal"
                                    className="cursor-pointer rounded-xl border border-white/20 bg-white/10 p-2 text-white transition hover:bg-white/20"
                                >
                                    <X size={19} />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-y-auto p-5 sm:p-6">
                            <div className="flex flex-wrap items-center gap-2">
                                <BadgeStatus status={selecionado.status} />
                                <BadgePrioridade prioridade={selecionado.prioridade} />
                            </div>

                            <dl className="mt-5 grid grid-cols-2 gap-3">
                                {[
                                    ["Solicitante", selecionado.solicitante],
                                    [
                                        "Tipo",
                                        selecionado.tipo === "motorista"
                                            ? "Motorista"
                                            : "Passageiro",
                                    ],
                                    ["Cidade", selecionado.cidade],
                                    ["Aberto em", formatarDataHora(selecionado.criado_em)],
                                ].map(([rotulo, valor]) => (
                                    <div
                                        key={rotulo}
                                        className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                                    >
                                        <dt className="text-xs font-semibold text-slate-500">
                                            {rotulo}
                                        </dt>
                                        <dd className="mt-1 text-sm font-bold text-slate-800">
                                            {valor}
                                        </dd>
                                    </div>
                                ))}
                            </dl>

                            <div className="mt-4">
                                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                                    Descrição
                                </p>
                                <p className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-white p-4 text-sm leading-relaxed text-slate-700">
                                    {selecionado.descricao || "Sem descrição informada."}
                                </p>
                            </div>

                            <p className="mt-3 text-xs text-slate-400">
                                Última atualização:{" "}
                                {formatarDataHora(selecionado.atualizado_em)}
                            </p>

                            {erroAcao && (
                                <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                                    {erroAcao}
                                </p>
                            )}

                            <div className="mt-5 flex flex-wrap justify-end gap-2">
                                {selecionado.status === "aberto" && (
                                    <button
                                        type="button"
                                        disabled={salvando}
                                        onClick={() =>
                                            alterarStatus(selecionado, "em_atendimento")
                                        }
                                        className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#00a99d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#00958b] disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        <PlayCircle size={17} />
                                        {salvando ? "Salvando..." : "Iniciar atendimento"}
                                    </button>
                                )}

                                {selecionado.status === "em_atendimento" && (
                                    <button
                                        type="button"
                                        disabled={salvando}
                                        onClick={() =>
                                            alterarStatus(selecionado, "resolvido")
                                        }
                                        className="flex cursor-pointer items-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        <CheckCircle2 size={17} />
                                        {salvando ? "Salvando..." : "Marcar como resolvido"}
                                    </button>
                                )}

                                {selecionado.status === "resolvido" && (
                                    <button
                                        type="button"
                                        disabled={salvando}
                                        onClick={() => alterarStatus(selecionado, "aberto")}
                                        className="cursor-pointer rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-70"
                                    >
                                        Reabrir chamado
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}