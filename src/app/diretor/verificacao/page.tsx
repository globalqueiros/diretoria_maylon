"use client";

import Link from "next/link";
import {
    CheckCircle2,
    ChevronDown,
    Clock3,
    Eye,
    Filter,
    MinusCircle,
    RefreshCw,
    Search,
    ShieldCheck,
    XCircle,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type VerificacaoStatus =
    | "nao_iniciado"
    | "pendente"
    | "em_analise"
    | "aprovado"
    | "reprovado";

type Verificacao = {
    id: string;
    nome: string;
    email: string;
    telefone: string;
    foto: string;
    status: VerificacaoStatus;
    didit_status: string | null;
    is_verified: boolean;
    is_suspended: boolean;
    is_active: boolean;
    documento_tipo: string | null;
    last_liveness_at: string | null;
    prova_vida_devida: boolean;
    created_at: string | null;
    updated_at: string | null;
};

type Paginacao = {
    pagina: number;
    limite: number;
    total: number;
    totalPaginas: number;
};

const ITENS_POR_PAGINA = 10;

const statusConfig: Record<
    VerificacaoStatus,
    {
        label: string;
        className: string;
        icon: typeof CheckCircle2;
    }
> = {
    aprovado: {
        label: "Aprovado",
        className: "bg-emerald-50 text-emerald-600",
        icon: CheckCircle2,
    },
    em_analise: {
        label: "Em análise",
        className: "bg-blue-50 text-blue-600",
        icon: Clock3,
    },
    pendente: {
        label: "Pendente",
        className: "bg-orange-50 text-orange-600",
        icon: Clock3,
    },
    reprovado: {
        label: "Reprovado",
        className: "bg-red-50 text-red-600",
        icon: XCircle,
    },
    nao_iniciado: {
        label: "Não iniciado",
        className: "bg-slate-100 text-slate-500",
        icon: MinusCircle,
    },
};

function StatusBadge({ status }: { status: VerificacaoStatus }) {
    const config = statusConfig[status];
    const Icon = config.icon;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${config.className}`}
        >
            <Icon size={13} />
            {config.label}
        </span>
    );
}

function formatarData(data?: string | null) {
    if (!data) return "—";

    const date = new Date(data);

    if (Number.isNaN(date.getTime())) {
        return data;
    }

    return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
}

function formatarTelefone(telefone?: string | null) {
    if (!telefone) return "—";

    const numeros = String(telefone).replace(/\D/g, "");

    if (!numeros) return "—";

    const numeroBR =
        numeros.startsWith("55") && numeros.length >= 12
            ? numeros.slice(2)
            : numeros;

    if (numeroBR.length === 11) {
        return numeroBR.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    }

    if (numeroBR.length === 10) {
        return numeroBR.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
    }

    return telefone;
}

function formatarTipoDocumento(tipo?: string | null) {
    if (!tipo) return "—";

    const normalizado = tipo.toLowerCase();

    if (normalizado.includes("identity") || normalizado.includes("id card")) {
        return "Documento de identidade";
    }

    if (normalizado.includes("driving") || normalizado.includes("license")) {
        return "Carta de condução (CNH)";
    }

    if (normalizado.includes("passport")) {
        return "Passaporte";
    }

    return tipo;
}

function iniciais(nome: string) {
    return nome
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((parte) => parte[0])
        .join("")
        .toUpperCase();
}

export default function VerificacoesPage() {
    const [dados, setDados] = useState<Verificacao[]>([]);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");

    const [busca, setBusca] = useState("");
    const [buscaAplicada, setBuscaAplicada] = useState("");
    const [statusFiltro, setStatusFiltro] = useState("");
    const [pagina, setPagina] = useState(1);

    const [paginacao, setPaginacao] = useState<Paginacao>({
        pagina: 1,
        limite: ITENS_POR_PAGINA,
        total: 0,
        totalPaginas: 0,
    });

    // ---------------------------------------------
    // DEBOUNCE DA BUSCA
    // ---------------------------------------------

    useEffect(() => {
        const timer = setTimeout(() => {
            setBuscaAplicada(busca.trim());
        }, 400);

        return () => clearTimeout(timer);
    }, [busca]);

    // ---------------------------------------------
    // CARREGAR
    // ---------------------------------------------

    const carregar = useCallback(async () => {
        try {
            setLoading(true);
            setErro("");

            const params = new URLSearchParams();

            params.set("pagina", String(pagina));
            params.set("limite", String(ITENS_POR_PAGINA));

            if (buscaAplicada) {
                params.set("busca", buscaAplicada);
            }

            if (statusFiltro) {
                params.set("status", statusFiltro);
            }

            const response = await fetch(
                `/api/verificacoes?${params.toString()}`,
                { cache: "no-store" }
            );

            const data = await response.json();

            if (!response.ok || data?.sucesso === false) {
                throw new Error(
                    data?.error || "Erro ao carregar as verificações."
                );
            }

            setDados(Array.isArray(data?.dados) ? data.dados : []);

            setPaginacao({
                pagina: Number(data?.paginacao?.pagina) || pagina,
                limite:
                    Number(data?.paginacao?.limite) || ITENS_POR_PAGINA,
                total: Number(data?.paginacao?.total) || 0,
                totalPaginas: Number(data?.paginacao?.totalPaginas) || 0,
            });
        } catch (error) {
            console.error("Erro ao carregar verificações:", error);

            setDados([]);
            setErro(
                error instanceof Error
                    ? error.message
                    : "Não foi possível carregar as verificações."
            );
        } finally {
            setLoading(false);
        }
    }, [pagina, buscaAplicada, statusFiltro]);

    useEffect(() => {
        const timer = setTimeout(() => {
            carregar();
        }, 0);

        return () => clearTimeout(timer);
    }, [carregar]);

    // ---------------------------------------------
    // FILTROS
    // ---------------------------------------------

    function alterarBusca(valor: string) {
        setBusca(valor);

        if (pagina !== 1) {
            setPagina(1);
        }
    }

    function alterarStatus(valor: string) {
        setStatusFiltro(valor);

        if (pagina !== 1) {
            setPagina(1);
        }
    }

    function limparFiltros() {
        setBusca("");
        setBuscaAplicada("");
        setStatusFiltro("");
        setPagina(1);
    }

    // ---------------------------------------------
    // PAGINAÇÃO
    // ---------------------------------------------

    function irParaPagina(novaPagina: number) {
        if (novaPagina < 1) return;

        if (
            paginacao.totalPaginas > 0 &&
            novaPagina > paginacao.totalPaginas
        ) {
            return;
        }

        setPagina(novaPagina);
    }

    const primeiroRegistro =
        paginacao.total === 0
            ? 0
            : (pagina - 1) * ITENS_POR_PAGINA + 1;

    const ultimoRegistro =
        paginacao.total === 0
            ? 0
            : Math.min(pagina * ITENS_POR_PAGINA, paginacao.total);

    const temFiltros =
        busca !== "" || statusFiltro !== "";

    return (
        <main className="min-h-screen">
            <div className="mx-auto w-full max-w-[1600px]">
                {/* =====================================================
                    CABEÇALHO
                ===================================================== */}

                <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-[30px] font-extrabold tracking-tight text-white">
                            Verificações
                        </h1>

                        <p className="mt-1 text-sm text-white/95">
                            Acompanhe as verificações de identidade (Didit)
                            dos usuários do Maylon.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={carregar}
                        disabled={loading}
                        className="flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-[#00aaa2] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#009991] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw
                            size={17}
                            className={loading ? "animate-spin" : ""}
                        />
                        {loading ? "Atualizando..." : "Atualizar"}
                    </button>
                </header>

                {/* =====================================================
                    CONTEÚDO
                ===================================================== */}

                <section className="overflow-hidden rounded-xl bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                <ShieldCheck size={21} />
                            </div>

                            <div>
                                <h2 className="font-bold text-[#092b55]">
                                    Verificações de identidade
                                </h2>

                                <p className="text-xs text-slate-500">
                                    Status de documento e prova de vida dos
                                    usuários que iniciaram a verificação.
                                </p>
                            </div>
                        </div>

                        <div className="text-xs text-slate-500">
                            Total de verificações:{" "}
                            <strong className="text-[#092b55]">
                                {paginacao.total}
                            </strong>
                        </div>
                    </div>

                    {/* =================================================
                        BARRA DE FILTROS
                    ================================================= */}

                    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center">
                        <label className="flex h-[40px] w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-400 xl:max-w-[360px]">
                            <Search size={16} />

                            <input
                                type="text"
                                value={busca}
                                onChange={(event) =>
                                    alterarBusca(event.target.value)
                                }
                                placeholder="Buscar usuário, e-mail, telefone..."
                                className="w-full bg-transparent text-xs text-slate-600 outline-none placeholder:text-slate-400"
                            />
                        </label>

                        <label className="flex h-[40px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500">
                            <Filter size={15} />

                            <select
                                value={statusFiltro}
                                onChange={(event) =>
                                    alterarStatus(event.target.value)
                                }
                                className="cursor-pointer border-0 bg-transparent text-xs font-medium text-slate-600 outline-none"
                            >
                                <option value="">Todos os estados</option>
                                <option value="aprovado">Aprovado</option>
                                <option value="em_analise">Em análise</option>
                                <option value="pendente">Pendente</option>
                                <option value="reprovado">Reprovado</option>
                                <option value="nao_iniciado">
                                    Não iniciado
                                </option>
                            </select>

                            <ChevronDown size={14} />
                        </label>

                        {temFiltros && (
                            <button
                                type="button"
                                onClick={limparFiltros}
                                className="h-[40px] rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
                            >
                                Limpar filtros
                            </button>
                        )}
                    </div>

                    {/* =================================================
                        ERRO
                    ================================================= */}

                    {erro && (
                        <div className="border-b border-red-100 bg-red-50 px-5 py-3">
                            <p className="text-sm text-red-600">{erro}</p>
                        </div>
                    )}

                    {/* =================================================
                        TABELA
                    ================================================= */}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1250px] border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-200 bg-[#fafbfc]">
                                    <TableHead>Usuário</TableHead>
                                    <TableHead>Contato</TableHead>
                                    <TableHead>Documento</TableHead>
                                    <TableHead>Status Didit</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead>Prova de vida</TableHead>
                                    <TableHead>Verificado</TableHead>
                                    <TableHead>Cadastro</TableHead>
                                    <TableHead align="center">
                                        Ação
                                    </TableHead>
                                </tr>
                            </thead>

                            <tbody>
                                {/* LOADING */}

                                {loading && (
                                    <tr>
                                        <td
                                            colSpan={9}
                                            className="px-5 py-16"
                                        >
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#00aaa2] border-t-transparent" />

                                                <span className="text-sm text-slate-500">
                                                    Carregando verificações...
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                )}

                                {/* DADOS */}

                                {!loading &&
                                    !erro &&
                                    dados.length > 0 &&
                                    dados.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b border-slate-100 transition hover:bg-slate-50"
                                        >
                                            {/* MOTORISTA */}

                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-blue-50 text-xs font-bold text-blue-700 ring-1 ring-blue-100">
                                                        {item.foto ? (
                                                            <img
                                                                src={item.foto}
                                                                alt={item.nome}
                                                                className="h-full w-full object-cover"
                                                                onError={(
                                                                    event
                                                                ) => {
                                                                    event.currentTarget.style.display =
                                                                        "none";
                                                                }}
                                                            />
                                                        ) : (
                                                            iniciais(item.nome) ||
                                                            "M"
                                                        )}
                                                    </div>

                                                    <div className="min-w-0">
                                                        <p className="truncate text-sm font-semibold text-[#092b55]">
                                                            {item.nome}
                                                        </p>

                                                        <p className="mt-0.5 truncate text-xs text-slate-400">
                                                            {item.email || "—"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* CONTATO */}

                                            <td className="px-5 py-4">
                                                <span className="whitespace-nowrap text-sm text-slate-600">
                                                    {formatarTelefone(
                                                        item.telefone
                                                    )}
                                                </span>
                                            </td>

                                            {/* DOCUMENTO */}

                                            <td className="px-5 py-4">
                                                <span className="text-sm text-slate-600">
                                                    {formatarTipoDocumento(
                                                        item.documento_tipo
                                                    )}
                                                </span>
                                            </td>

                                            {/* STATUS DIDIT */}

                                            <td className="px-5 py-4">
                                                <span className="text-sm text-slate-600">
                                                    {item.didit_status || "—"}
                                                </span>
                                            </td>

                                            {/* ESTADO */}

                                            <td className="px-5 py-4">
                                                <StatusBadge
                                                    status={item.status}
                                                />
                                            </td>

                                            {/* PROVA DE VIDA */}

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${
                                                        item.prova_vida_devida
                                                            ? "bg-red-50 text-red-600"
                                                            : "bg-emerald-50 text-emerald-600"
                                                    }`}
                                                >
                                                    {item.prova_vida_devida ? (
                                                        <>
                                                            <XCircle size={13} />
                                                            Devida
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircle2
                                                                size={13}
                                                            />
                                                            Em dia
                                                        </>
                                                    )}
                                                </span>

                                                <p className="mt-1 whitespace-nowrap text-[11px] text-slate-400">
                                                    Última:{" "}
                                                    {formatarData(
                                                        item.last_liveness_at
                                                    )}
                                                </p>
                                            </td>

                                            {/* VERIFICADO */}

                                            <td className="px-5 py-4">
                                                <span
                                                    className={`text-sm font-semibold ${
                                                        item.is_verified
                                                            ? "text-emerald-600"
                                                            : "text-slate-400"
                                                    }`}
                                                >
                                                    {item.is_verified
                                                        ? "Sim"
                                                        : "Não"}
                                                </span>
                                            </td>

                                            {/* CADASTRO */}

                                            <td className="px-5 py-4">
                                                <span className="whitespace-nowrap text-xs text-slate-500">
                                                    {formatarData(
                                                        item.created_at
                                                    )}
                                                </span>
                                            </td>

                                            {/* AÇÃO */}

                                            <td className="px-5 py-4">
                                                <div className="flex justify-center">
                                                    <Link
                                                        href={`/diretor/passageiros_motoristas/visualizacao/${encodeURIComponent(
                                                            item.id
                                                        )}`}
                                                        title="Visualizar usuário"
                                                        aria-label={`Visualizar ${item.nome}`}
                                                        className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                                                    >
                                                        <Eye size={18} />
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                {/* VAZIO */}

                                {!loading && !erro && dados.length === 0 && (
                                    <EmptyState />
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* =================================================
                        PAGINAÇÃO
                    ================================================= */}

                    <div className="flex flex-col gap-4 border-t border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
                        <span className="text-xs text-slate-500">
                            Mostrando <strong>{primeiroRegistro}</strong> até{" "}
                            <strong>{ultimoRegistro}</strong> de{" "}
                            <strong>{paginacao.total}</strong> registros
                        </span>

                        {paginacao.totalPaginas > 0 && (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    disabled={pagina === 1 || loading}
                                    onClick={() => irParaPagina(pagina - 1)}
                                    className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 transition hover:border-[#00aaa2] hover:text-[#00aaa2] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Anterior
                                </button>

                                <span className="px-2 text-sm text-slate-500">
                                    Página{" "}
                                    <strong className="text-[#092b55]">
                                        {pagina}
                                    </strong>{" "}
                                    de{" "}
                                    <strong className="text-[#092b55]">
                                        {paginacao.totalPaginas}
                                    </strong>
                                </span>

                                <button
                                    type="button"
                                    disabled={
                                        pagina >= paginacao.totalPaginas ||
                                        loading
                                    }
                                    onClick={() => irParaPagina(pagina + 1)}
                                    className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 transition hover:border-[#00aaa2] hover:text-[#00aaa2] disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Próxima
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </main>
    );
}

/* =========================================================
   CABEÇALHO DA TABELA
========================================================= */

function TableHead({
    children,
    align = "left",
}: {
    children: React.ReactNode;
    align?: "left" | "center";
}) {
    return (
        <th
            className={`px-5 py-3 text-[10px] font-semibold uppercase tracking-wide text-slate-400 ${
                align === "center" ? "text-center" : "text-left"
            }`}
        >
            {children}
        </th>
    );
}

/* =========================================================
   ESTADO VAZIO
========================================================= */

function EmptyState() {
    return (
        <tr>
            <td colSpan={9} className="h-[390px] px-5 py-10">
                <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <ShieldCheck size={25} />
                    </div>

                    <h3 className="text-base font-semibold text-[#092b55]">
                        Sem dados disponíveis
                    </h3>

                    <p className="mt-2 max-w-[430px] text-xs leading-5 text-slate-400">
                        Não há verificações para exibir no momento. Tente
                        ajustar os filtros ou atualizar a página.
                    </p>
                </div>
            </td>
        </tr>
    );
}
