"use client";

import {
    ArrowDownToLine,
    ArrowUpToLine,
    Banknote,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    CreditCard,
    Download,
    FileText,
    Filter,
    RefreshCw,
    TrendingDown,
    TrendingUp,
    WalletCards,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type TransactionType = "Entrada" | "Saída";

type Transaction = {
    id: string;
    date: string;
    description: string;
    category: string;
    type: TransactionType;
    value: number;
    status: string;
};

const transactions: Transaction[] = [
    {
        id: "#00081",
        date: "01/09/2026 20:48",
        description: "Corrida #1048",
        category: "Corridas",
        type: "Entrada",
        value: 42.5,
        status: "Pago",
    },
    {
        id: "#00080",
        date: "01/09/2026 19:32",
        description: "Corrida #1047",
        category: "Corridas",
        type: "Entrada",
        value: 31.9,
        status: "Pago",
    },
    {
        id: "#00079",
        date: "01/09/2026 17:15",
        description: "Taxa da plataforma",
        category: "Taxas",
        type: "Saída",
        value: 7.35,
        status: "Pago",
    },
    {
        id: "#00078",
        date: "01/09/2026 14:21",
        description: "Corrida #1046",
        category: "Corridas",
        type: "Entrada",
        value: 54.8,
        status: "Pago",
    },
    {
        id: "#00077",
        date: "31/08/2026 21:04",
        description: "Repasse ao motorista",
        category: "Repasses",
        type: "Saída",
        value: 28.4,
        status: "Pago",
    },
    {
        id: "#00076",
        date: "31/08/2026 18:42",
        description: "Corrida #1045",
        category: "Corridas",
        type: "Entrada",
        value: 39.75,
        status: "Pago",
    },
    {
        id: "#00075",
        date: "31/08/2026 16:18",
        description: "Corrida #1044",
        category: "Corridas",
        type: "Entrada",
        value: 47.2,
        status: "Pago",
    },
];

const money = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

export default function FinanceiroPage() {
    const [period, setPeriod] = useState("Hoje");
    const [type, setType] = useState("Todos");
    const [query, setQuery] = useState("");

    // Estado do Pix BTG
    const [pixAtivo, setPixAtivo] = useState(false);

    const receitas = transactions
        .filter((item) => item.type === "Entrada")
        .reduce((total, item) => total + item.value, 0);

    const despesas = transactions
        .filter((item) => item.type === "Saída")
        .reduce((total, item) => total + item.value, 0);

    const saldo = receitas - despesas;

    const filteredTransactions = useMemo(() => {
        return transactions.filter((item) => {
            const matchesType = type === "Todos" || item.type === type;
            const search = query.toLowerCase();

            const matchesSearch =
                item.id.toLowerCase().includes(search) ||
                item.description.toLowerCase().includes(search) ||
                item.category.toLowerCase().includes(search);

            return matchesType && matchesSearch;
        });
    }, [type, query]);

    function handleExport() {
        const headers = [
            "ID",
            "Data",
            "Descrição",
            "Categoria",
            "Tipo",
            "Valor",
            "Status",
        ];

        const rows = transactions.map((item) => [
            item.id,
            item.date,
            item.description,
            item.category,
            item.type,
            item.value.toFixed(2).replace(".", ","),
            item.status,
        ]);

        const csv = [
            headers.join(";"),
            ...rows.map((row) => row.join(";")),
        ].join("\n");

        const blob = new Blob(["\ufeff" + csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "relatorio-financeiro.csv";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    function handlePix() {
        setPixAtivo((ativo) => !ativo);
    }

    return (
        <main className="min-h-screen">
            {/* HEADER */}
            <header className="mb-5 flex flex-col gap-4 text-white sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-[30px] font-extrabold tracking-tight">
                        Financeiro
                    </h1>

                    <p className="mt-0 text-sm text-white/95">
                        Acompanhe receitas, despesas e movimentações financeiras.
                    </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                    {/* ATUALIZAR */}
                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="flex cursor-pointer items-center justify-center gap-2 rounded-[10px] bg-[#00a99d] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#009990]"
                    >
                        <RefreshCw size={17} />
                        Atualizar
                    </button>
                </div>
            </header>

            {/* CARDS PRINCIPAIS */}
            <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                <SummaryCard
                    label="Saldo disponível"
                    value={saldo}
                    icon={<WalletCards size={23} />}
                    iconClass="bg-[#d3f9e8] text-[#00a681]"
                />

                <SummaryCard
                    label="Receitas"
                    value={receitas}
                    icon={<TrendingUp size={23} />}
                    iconClass="bg-[#dce9ff] text-[#1264e8]"
                />

                <SummaryCard
                    label="Despesas"
                    value={despesas}
                    icon={<TrendingDown size={23} />}
                    iconClass="bg-[#ffe2e2] text-[#e23b3b]"
                />
            </section>

            {/* PIX BTG */}
            <section className="mb-5 overflow-hidden rounded-xl bg-white shadow-[0_2px_7px_rgba(17,61,67,0.10)]">
                <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[11px] bg-[#e2f9ef] text-[#008f70]">
                            <Banknote size={23} />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-[#192c48]">
                                Pix BTG Pactual
                            </h2>
                            <p className="text-sm text-[#5f7391]">
                                Ative o Pix para receber pagamentos diretamente
                                na sua conta.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <Link
                            href="https://auth.maylon.com.br/admin/pix/status" target="_black"
                            className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold text-white transition ${
                                pixAtivo
                                    ? "bg-[#d94c4c] hover:bg-[#c94141]"
                                    : "bg-[#00a681] hover:bg-[#009574]"
                            }`}
                        >
                            <Banknote size={16} />
                            {pixAtivo
                                ? "Desativar Pix"
                                : "Ativar Pix"}
                        </Link>
                    </div>
                </div>
                {pixAtivo && (
                    <div className="border-t border-[#edf1f5] bg-[#f8fcfa] px-5 py-4">
                        <div className="flex flex-col gap-2 text-xs text-[#5f7391] sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <span className="font-semibold text-[#304a69]">
                                    Status da integração:
                                </span>{" "}
                                Conectado
                            </div>

                            <div>
                                <span className="font-semibold text-[#304a69]">
                                    Banco:
                                </span>{" "}
                                BTG Pactual
                            </div>

                            <div>
                                <span className="font-semibold text-[#304a69]">
                                    Recebimento:
                                </span>{" "}
                                Pix
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {/* RESUMO FINANCEIRO */}
            <section className="mb-5 overflow-hidden rounded-xl bg-white shadow-[0_2px_7px_rgba(17,61,67,0.10)]">
                <div className="flex min-h-[98px] items-center gap-3 border-b border-[#edf1f5] px-6 py-6">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-[#d3f9e8] text-[#00a681]">
                        <Banknote size={21} />
                    </div>

                    <div>
                        <h2 className="text-[18px] font-bold text-[#192c48]">
                            Resumo financeiro
                        </h2>

                        <p className="text-[13px] text-[#5f7391]">
                            Visão geral das movimentações do período selecionado.
                        </p>
                    </div>

                    <span className="ml-auto hidden whitespace-nowrap text-xs text-[#607493] lg:block">
                        Atualizado em{" "}
                        <strong className="text-[#1a3455]">
                            21:09:24 01/09/2026
                        </strong>
                    </span>
                </div>

                {/* FILTROS */}
                <div className="flex flex-wrap items-center gap-2 border-b border-[#edf1f5] px-6 py-4">
                    <label className="flex h-[38px] items-center gap-2 rounded-lg border border-[#dce4ed] bg-white px-3 text-[#5b6f8b]">
                        <CalendarDays size={16} />

                        <select
                            value={period}
                            onChange={(event) =>
                                setPeriod(event.target.value)
                            }
                            className="min-w-[125px] cursor-pointer border-0 bg-transparent text-xs text-[#334b69] outline-none"
                        >
                            <option>Hoje</option>
                            <option>Últimos 7 dias</option>
                            <option>Este mês</option>
                            <option>Últimos 30 dias</option>
                            <option>Este ano</option>
                        </select>
                    </label>

                    <label className="flex h-[38px] items-center gap-2 rounded-lg border border-[#dce4ed] bg-white px-3 text-[#5b6f8b]">
                        <Filter size={16} />

                        <select
                            value={type}
                            onChange={(event) =>
                                setType(event.target.value)
                            }
                            className="min-w-[110px] cursor-pointer border-0 bg-transparent text-xs text-[#334b69] outline-none"
                        >
                            <option>Todos</option>
                            <option>Entrada</option>
                            <option>Saída</option>
                        </select>
                    </label>

                    <button
                        type="button"
                        onClick={handleExport}
                        className="ml-auto flex h-[38px] items-center gap-2 rounded-lg border border-[#dce4ed] bg-white px-4 text-xs font-semibold text-[#38516f] transition hover:bg-[#f6f9fb]"
                    >
                        <Download size={16} />
                        Exportar
                    </button>
                </div>

                {/* MINI CARDS */}
                <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-3">
                    <MiniCard
                        label="Entradas"
                        value={money.format(receitas)}
                        description="Receitas do período"
                        dot="bg-[#18b88d]"
                    />

                    <MiniCard
                        label="Saídas"
                        value={money.format(despesas)}
                        description="Despesas do período"
                        dot="bg-[#ee5b5b]"
                    />

                    <MiniCard
                        label="Resultado"
                        value={money.format(saldo)}
                        description="Saldo líquido"
                        dot="bg-[#2776ed]"
                    />
                </div>
            </section>

            {/* MOVIMENTAÇÕES */}
            <section className="mb-5 overflow-hidden rounded-xl bg-white shadow-[0_2px_7px_rgba(17,61,67,0.10)]">
                <div className="flex min-h-[91px] items-center gap-3 border-b border-[#edf1f5] px-6 py-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-[#dce9ff] text-[#1264e8]">
                        <FileText size={21} />
                    </div>

                    <div>
                        <h2 className="text-[18px] font-bold text-[#192c48]">
                            Movimentações financeiras
                        </h2>

                        <p className="text-[13px] text-[#5f7391]">
                            Histórico de entradas e saídas da plataforma.
                        </p>
                    </div>

                    <div className="ml-auto hidden md:block">
                        <input
                            type="text"
                            value={query}
                            onChange={(event) =>
                                setQuery(event.target.value)
                            }
                            placeholder="Buscar movimentação..."
                            className="h-[38px] w-[235px] rounded-lg border border-[#dce4ed] px-3 text-xs text-[#314a69] outline-none transition placeholder:text-[#9aa9ba] focus:border-[#35b99b] focus:ring-3 focus:ring-[#35b99b]/10"
                        />
                    </div>
                </div>

                <div className="border-b border-[#edf1f5] px-4 py-3 md:hidden">
                    <input
                        type="text"
                        value={query}
                        onChange={(event) =>
                            setQuery(event.target.value)
                        }
                        placeholder="Buscar movimentação..."
                        className="h-[38px] w-full rounded-lg border border-[#dce4ed] px-3 text-xs text-[#314a69] outline-none focus:border-[#35b99b]"
                    />
                </div>

                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[950px] border-collapse">
                        <thead className="bg-[#f0f4f8]">
                            <tr>
                                <TableHead>ID</TableHead>
                                <TableHead>DATA</TableHead>
                                <TableHead>DESCRIÇÃO</TableHead>
                                <TableHead>CATEGORIA</TableHead>
                                <TableHead>TIPO</TableHead>
                                <TableHead>VALOR</TableHead>
                                <TableHead>STATUS</TableHead>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredTransactions.length > 0 ? (
                                filteredTransactions.map((item) => (
                                    <tr
                                        key={item.id}
                                        className="transition hover:bg-[#fafcfd]"
                                    >
                                        <TableCell className="font-semibold text-[#637893]">
                                            {item.id}
                                        </TableCell>

                                        <TableCell>{item.date}</TableCell>

                                        <TableCell className="font-semibold text-[#263d5a]">
                                            {item.description}
                                        </TableCell>

                                        <TableCell>
                                            {item.category}
                                        </TableCell>

                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                                                    item.type === "Entrada"
                                                        ? "bg-[#e2f9ef] text-[#009b76]"
                                                        : "bg-[#ffe8e8] text-[#db4747]"
                                                }`}
                                            >
                                                {item.type === "Entrada" ? (
                                                    <ArrowDownToLine size={13} />
                                                ) : (
                                                    <ArrowUpToLine size={13} />
                                                )}

                                                {item.type}
                                            </span>
                                        </TableCell>

                                        <TableCell
                                            className={`font-bold ${
                                                item.type === "Entrada"
                                                    ? "text-[#009b76]"
                                                    : "text-[#d94c4c]"
                                            }`}
                                        >
                                            {item.type === "Entrada"
                                                ? "+"
                                                : "-"}{" "}
                                            {money.format(item.value)}
                                        </TableCell>

                                        <TableCell>
                                            <span className="inline-flex rounded-full bg-[#e1f8ee] px-2.5 py-1 text-[11px] font-bold text-[#078d6d]">
                                                {item.status}
                                            </span>
                                        </TableCell>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="h-[120px] text-center text-sm text-[#9aa9b9]"
                                    >
                                        Nenhuma movimentação encontrada.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex min-h-[69px] flex-col items-start justify-between gap-4 px-5 py-4 text-xs text-[#637893] sm:flex-row sm:items-center">
                    <span>
                        Mostrando {filteredTransactions.length} de{" "}
                        {transactions.length} movimentações
                    </span>

                    <div className="flex gap-1.5">
                        <button
                            type="button"
                            disabled
                            className="flex h-[38px] items-center gap-1 rounded-lg border border-[#e3e9ef] bg-white px-3 text-xs text-[#a7b3c1] disabled:cursor-not-allowed"
                        >
                            <ChevronLeft size={16} />
                            Anterior
                        </button>

                        <button
                            type="button"
                            disabled
                            className="flex h-[38px] items-center gap-1 rounded-lg border border-[#e3e9ef] bg-white px-3 text-xs text-[#a7b3c1] disabled:cursor-not-allowed"
                        >
                            Próxima
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </section>

            {/* CARDS INFERIORES */}
            <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
                {/* PRÓXIMO REPASSE */}
                <section className="overflow-hidden rounded-xl bg-white shadow-[0_2px_7px_rgba(17,61,67,0.10)]">
                    <div className="flex min-h-[91px] items-center gap-3 border-b border-[#edf1f5] px-6 py-5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-[#e9e1ff] text-[#7651d8]">
                            <CreditCard size={21} />
                        </div>

                        <div>
                            <h2 className="text-[18px] font-bold text-[#192c48]">
                                Próximo repasse
                            </h2>

                            <p className="text-[13px] text-[#5f7391]">
                                Valores programados para pagamento.
                            </p>
                        </div>
                    </div>

                    <div className="px-6 pb-3 pt-5">
                        <strong className="text-[27px] font-extrabold text-[#152c4c]">
                            {money.format(0)}
                        </strong>
                    </div>

                    <div className="flex min-h-[45px] items-center justify-between border-t border-[#edf1f5] px-6 py-3 text-xs text-[#687c96]">
                        <span>Data prevista</span>

                        <strong className="text-[#304a69]">
                            05/09/2026
                        </strong>
                    </div>

                    <div className="flex min-h-[45px] items-center justify-between border-t border-[#edf1f5] px-6 py-3 text-xs text-[#687c96]">
                        <span>Status</span>

                        <span className="rounded-full bg-[#fff0cd] px-2.5 py-1 text-[11px] font-bold text-[#a26b00]">
                            Aguardando
                        </span>
                    </div>
                </section>

                {/* CONTAS A RECEBER */}
                <section className="overflow-hidden rounded-xl bg-white shadow-[0_2px_7px_rgba(17,61,67,0.10)]">
                    <div className="flex min-h-[91px] items-center gap-3 border-b border-[#edf1f5] px-6 py-5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-[#ffead3] text-[#e58a18]">
                            <Banknote size={21} />
                        </div>

                        <div>
                            <h2 className="text-[18px] font-bold text-[#192c48]">
                                Contas a receber
                            </h2>

                            <p className="text-[13px] text-[#5f7391]">
                                Valores ainda não compensados.
                            </p>
                        </div>
                    </div>

                    <div className="px-6 pb-3 pt-5">
                        <strong className="text-[27px] font-extrabold text-[#152c4c]">
                            {money.format(0)}
                        </strong>
                    </div>

                    <div className="flex min-h-[45px] items-center justify-between border-t border-[#edf1f5] px-6 py-3 text-xs text-[#687c96]">
                        <span>Transações pendentes</span>

                        <strong className="text-[#304a69]">
                            0
                        </strong>
                    </div>

                    <div className="flex min-h-[45px] items-center justify-between border-t border-[#edf1f5] px-6 py-3 text-xs text-[#687c96]">
                        <span>Última atualização</span>

                        <strong className="text-[#304a69]">
                            21:09:24
                        </strong>
                    </div>
                </section>
            </section>

            {/* BOTÃO DE AJUDA */}
            <button
                type="button"
                aria-label="Ajuda"
                className="fixed bottom-5 right-5 flex h-16 w-16 items-center justify-center rounded-full border-0 bg-[#00a6ad] text-2xl font-bold text-white shadow-[0_8px_22px_rgba(0,76,87,0.25)] transition hover:-translate-y-1 hover:bg-[#00969d]"
            >
                ?
            </button>
        </main>
    );
}

/* =========================
   COMPONENTE SUMMARY CARD
========================= */

function SummaryCard({
    label,
    value,
    icon,
    iconClass,
}: {
    label: string;
    value: number;
    icon: React.ReactNode;
    iconClass: string;
}) {
    return (
        <div className="flex min-h-[101px] items-center justify-between rounded-xl bg-white p-5 shadow-[0_2px_7px_rgba(17,61,67,0.10)]">
            <div>
                <p className="mb-2 text-sm text-[#526887]">
                    {label}
                </p>

                <strong className="text-2xl font-extrabold tracking-tight text-[#12284a]">
                    {money.format(value)}
                </strong>
            </div>

            <div
                className={`flex h-12 w-12 items-center justify-center rounded-[11px] ${iconClass}`}
            >
                {icon}
            </div>
        </div>
    );
}

/* =========================
   COMPONENTE MINI CARD
========================= */

function MiniCard({
    label,
    value,
    description,
    dot,
}: {
    label: string;
    value: string;
    description: string;
    dot: string;
}) {
    return (
        <div className="rounded-[9px] border border-[#edf1f5] bg-white p-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-[#647793]">
                <span
                    className={`h-[7px] w-[7px] rounded-full ${dot}`}
                />

                {label}
            </div>

            <strong className="block text-xl font-extrabold text-[#1a2e4b]">
                {value}
            </strong>

            <small className="text-[11px] text-[#73849b]">
                {description}
            </small>
        </div>
    );
}

/* =========================
   COMPONENTE TABLE HEAD
========================= */

function TableHead({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <th className="px-[17px] py-[13px] text-left text-[11px] font-bold text-[#344c6b]">
            {children}
        </th>
    );
}

/* =========================
   COMPONENTE TABLE CELL
========================= */

function TableCell({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <td
            className={`border-b border-[#edf1f5] px-[17px] py-[15px] text-xs text-[#526986] ${className}`}
        >
            {children}
        </td>
    );
}