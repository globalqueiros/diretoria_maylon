"use client";

import {
    BadgeDollarSign,
    CalendarDays,
    CheckCircle2,
    ChevronLeft,
    ChevronRight,
    CircleAlert,
    Clock,
    Download,
    RefreshCw,
    Search,
    Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

/* ------------------------------------------------------------------ */
/* Tipos                                                               */
/* ------------------------------------------------------------------ */

type StatusComissao = "pendente" | "aprovada" | "paga";

interface Comissao {
    id: number;
    descricao: string;
    cidade: string;
    data: string; // ISO
    valor_base: number;
    percentual: number;
    valor: number;
    status: StatusComissao;
}

type FiltroStatus = "todas" | StatusComissao;

/* ------------------------------------------------------------------ */
/* Utilitários                                                         */
/* ------------------------------------------------------------------ */

const moeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

const MESES = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
];

const STATUS_INFO: Record<
    StatusComissao,
    { rotulo: string; classe: string }
> = {
    pendente: {
        rotulo: "Pendente",
        classe: "bg-amber-100 text-amber-700",
    },
    aprovada: {
        rotulo: "Aprovada",
        classe: "bg-sky-100 text-sky-700",
    },
    paga: {
        rotulo: "Paga",
        classe: "bg-emerald-100 text-emerald-700",
    },
};

function formatarData(valor?: string | null) {
    if (!valor) return "—";
    const data = new Date(valor);
    return Number.isNaN(data.getTime())
        ? "—"
        : data.toLocaleDateString("pt-BR");
}

function chaveMes(ano: number, mes: number) {
    return `${ano}-${String(mes + 1).padStart(2, "0")}`;
}

function baixarCSV(linhas: Comissao[], nomeArquivo: string) {
    const cabecalho = [
        "ID",
        "Descrição",
        "Cidade",
        "Data",
        "Valor base",
        "Percentual",
        "Comissão",
        "Status",
    ];

    const corpo = linhas.map((c) => [
        c.id,
        `"${c.descricao.replace(/"/g, '""')}"`,
        `"${c.cidade.replace(/"/g, '""')}"`,
        formatarData(c.data),
        c.valor_base.toFixed(2).replace(".", ","),
        `${c.percentual}%`,
        c.valor.toFixed(2).replace(".", ","),
        STATUS_INFO[c.status].rotulo,
    ]);

    const csv = [cabecalho, ...corpo].map((l) => l.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], {
        type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nomeArquivo;
    a.click();
    URL.revokeObjectURL(url);
}

/* ------------------------------------------------------------------ */
/* Componentes auxiliares                                              */
/* ------------------------------------------------------------------ */

function CardResumo({
    titulo,
    valor,
    legenda,
    corValor,
    fundoIcone,
    icone,
    carregando,
}: {
    titulo: string;
    valor: string;
    legenda: string;
    corValor?: string;
    fundoIcone: string;
    icone: ReactNode;
    carregando: boolean;
}) {
    return (
        <div className="rounded-xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-500">{titulo}</p>
                    <h3
                        className={`mt-2 truncate text-2xl font-bold sm:text-3xl ${
                            corValor ?? "text-slate-800"
                        }`}
                    >
                        {carregando ? "--" : valor}
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">{legenda}</p>
                </div>

                <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${fundoIcone}`}
                >
                    {icone}
                </div>
            </div>
        </div>
    );
}

function BadgeStatus({ status }: { status: StatusComissao }) {
    const info = STATUS_INFO[status] ?? STATUS_INFO.pendente;
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

export default function ComissoesPage() {
    const hoje = new Date();
    const [ano, setAno] = useState(hoje.getFullYear());
    const [mes, setMes] = useState(hoje.getMonth());

    const [comissoes, setComissoes] = useState<Comissao[]>([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState(false);

    const [filtro, setFiltro] = useState<FiltroStatus>("todas");
    const [busca, setBusca] = useState("");

    /* ---------------------------- Carregamento ---------------------------- */

    async function carregarComissoes() {
        try {
            setLoading(true);
            setErro(false);

            const res = await fetch(
                `/api/atendente/comissoes?mes=${chaveMes(ano, mes)}`,
                { cache: "no-store" }
            );
            if (!res.ok) throw new Error("Erro ao buscar comissões.");

            const data = await res.json();
            const lista: Partial<Comissao>[] = Array.isArray(data)
                ? data
                : Array.isArray(data?.comissoes)
                  ? data.comissoes
                  : [];

            setComissoes(
                lista.map((c) => ({
                    id: Number(c.id ?? 0),
                    descricao: String(c.descricao ?? "—"),
                    cidade: String(c.cidade ?? "Sem cidade"),
                    data: String(c.data ?? ""),
                    valor_base: Number(c.valor_base ?? 0),
                    percentual: Number(c.percentual ?? 0),
                    valor: Number(c.valor ?? 0),
                    status: (c.status as StatusComissao) ?? "pendente",
                }))
            );
        } catch (error) {
            console.error(error);
            setComissoes([]);
            setErro(true);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        carregarComissoes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ano, mes]);

    /* ---------------------------- Navegação de mês ---------------------------- */

    function mesAnterior() {
        if (mes === 0) {
            setMes(11);
            setAno((a) => a - 1);
        } else setMes((m) => m - 1);
    }

    function proximoMes() {
        if (mes === 11) {
            setMes(0);
            setAno((a) => a + 1);
        } else setMes((m) => m + 1);
    }

    const ehMesAtual =
        ano === hoje.getFullYear() && mes === hoje.getMonth();

    /* ---------------------------- Derivados ---------------------------- */

    const totais = useMemo(() => {
        const soma = (st?: StatusComissao) =>
            comissoes
                .filter((c) => !st || c.status === st)
                .reduce((s, c) => s + c.valor, 0);

        return {
            total: soma(),
            pendente: soma("pendente"),
            aprovada: soma("aprovada"),
            paga: soma("paga"),
        };
    }, [comissoes]);

    const filtradas = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return comissoes.filter((c) => {
            if (filtro !== "todas" && c.status !== filtro) return false;
            if (!termo) return true;
            return (
                c.descricao.toLowerCase().includes(termo) ||
                c.cidade.toLowerCase().includes(termo)
            );
        });
    }, [comissoes, filtro, busca]);

    const totalFiltrado = filtradas.reduce((s, c) => s + c.valor, 0);

    const abas: { id: FiltroStatus; rotulo: string }[] = [
        { id: "todas", rotulo: "Todas" },
        { id: "pendente", rotulo: "Pendentes" },
        { id: "aprovada", rotulo: "Aprovadas" },
        { id: "paga", rotulo: "Pagas" },
    ];

    /* ---------------------------- Render ---------------------------- */

    return (
        <main className="min-h-screen">
            {/* CABEÇALHO */}
            <header className="mb-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white sm:text-3xl">
                            Comissões
                        </h1>
                        <p className="mt-1 text-sm text-white/70">
                            Acompanhe seus ganhos e o status de cada pagamento.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Seletor de mês */}
                        <div className="flex items-center rounded-xl bg-white/10 text-white">
                            <button
                                type="button"
                                onClick={mesAnterior}
                                aria-label="Mês anterior"
                                className="cursor-pointer rounded-l-xl p-3 transition hover:bg-white/20"
                            >
                                <ChevronLeft size={18} />
                            </button>

                            <div className="flex min-w-[150px] items-center justify-center gap-2 px-2 text-sm font-semibold">
                                <CalendarDays size={16} />
                                {MESES[mes]} {ano}
                            </div>

                            <button
                                type="button"
                                onClick={proximoMes}
                                disabled={ehMesAtual}
                                aria-label="Próximo mês"
                                className="cursor-pointer rounded-r-xl p-3 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                            >
                                <ChevronRight size={18} />
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={() =>
                                baixarCSV(
                                    filtradas,
                                    `comissoes-${chaveMes(ano, mes)}.csv`
                                )
                            }
                            disabled={loading || filtradas.length === 0}
                            className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Download size={17} />
                            Exportar
                        </button>

                        <button
                            type="button"
                            onClick={carregarComissoes}
                            disabled={loading}
                            className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#00a99d] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00958b] disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            <RefreshCw
                                size={17}
                                className={loading ? "animate-spin" : ""}
                            />
                            {loading ? "Atualizando..." : "Atualizar"}
                        </button>
                    </div>
                </div>
            </header>

            {/* CARDS DE RESUMO */}
            <section className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <CardResumo
                    titulo="Total do mês"
                    valor={moeda.format(totais.total)}
                    legenda={`${comissoes.length} comissões registradas`}
                    fundoIcone="bg-teal-100"
                    icone={<BadgeDollarSign size={24} className="text-teal-700" />}
                    carregando={loading}
                />
                <CardResumo
                    titulo="Pendentes"
                    valor={moeda.format(totais.pendente)}
                    legenda="Aguardando aprovação"
                    corValor="text-amber-600"
                    fundoIcone="bg-amber-100"
                    icone={<Clock size={24} className="text-amber-600" />}
                    carregando={loading}
                />
                <CardResumo
                    titulo="Aprovadas"
                    valor={moeda.format(totais.aprovada)}
                    legenda="Liberadas para pagamento"
                    corValor="text-sky-600"
                    fundoIcone="bg-sky-100"
                    icone={<CheckCircle2 size={24} className="text-sky-600" />}
                    carregando={loading}
                />
                <CardResumo
                    titulo="Pagas"
                    valor={moeda.format(totais.paga)}
                    legenda="Já recebidas"
                    corValor="text-emerald-600"
                    fundoIcone="bg-emerald-100"
                    icone={<Wallet size={24} className="text-emerald-600" />}
                    carregando={loading}
                />
            </section>

            {/* TABELA */}
            <section>
                <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                    {/* Barra de filtros */}
                    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-100">
                                <BadgeDollarSign
                                    size={21}
                                    className="text-teal-700"
                                />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">
                                    Extrato de comissões
                                </h3>
                                <p className="text-sm text-slate-500">
                                    {MESES[mes]} de {ano}
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex rounded-xl bg-slate-100 p-1">
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
                                    placeholder="Buscar descrição ou cidade"
                                    className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#00a99d] focus:ring-2 focus:ring-[#00a99d]/20 sm:w-64"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[760px]">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-700">
                                        Data
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-700">
                                        Descrição
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-700">
                                        Cidade
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-700">
                                        Valor base
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-700">
                                        %
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-bold uppercase text-slate-700">
                                        Comissão
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-700">
                                        Status
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
                                            Carregando comissões...
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
                                                Não foi possível carregar as comissões.
                                            </p>
                                            <button
                                                type="button"
                                                onClick={carregarComissoes}
                                                className="mt-3 cursor-pointer rounded-lg bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200"
                                            >
                                                Tentar novamente
                                            </button>
                                        </td>
                                    </tr>
                                ) : filtradas.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="py-12 text-center text-sm text-slate-500"
                                        >
                                            Nenhuma comissão encontrada neste período.
                                        </td>
                                    </tr>
                                ) : (
                                    filtradas.map((c) => (
                                        <tr
                                            key={c.id}
                                            className="border-t border-slate-100 transition hover:bg-slate-50"
                                        >
                                            <td className="whitespace-nowrap px-4 py-4 text-sm text-slate-600">
                                                {formatarData(c.data)}
                                            </td>
                                            <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                                                {c.descricao}
                                            </td>
                                            <td className="px-4 py-4 text-sm text-slate-600">
                                                {c.cidade}
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm text-slate-600">
                                                {moeda.format(c.valor_base)}
                                            </td>
                                            <td className="px-4 py-4 text-center text-sm text-slate-600">
                                                {c.percentual}%
                                            </td>
                                            <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-bold text-slate-800">
                                                {moeda.format(c.valor)}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <BadgeStatus status={c.status} />
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>

                            {!loading && !erro && filtradas.length > 0 && (
                                <tfoot>
                                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                                        <td
                                            colSpan={5}
                                            className="px-4 py-3 text-sm font-bold text-slate-800"
                                        >
                                            Total ({filtradas.length}{" "}
                                            {filtradas.length === 1
                                                ? "registro"
                                                : "registros"}
                                            )
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-3 text-right text-sm font-bold text-slate-800">
                                            {moeda.format(totalFiltrado)}
                                        </td>
                                        <td />
                                    </tr>
                                </tfoot>
                            )}
                        </table>
                    </div>
                </div>
            </section>
        </main>
    );
}