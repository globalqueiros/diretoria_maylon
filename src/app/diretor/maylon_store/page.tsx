"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";

import {
    Package,
    ShoppingCart,
    TrendingUp,
    AlertTriangle,
    Plus,
    Search,
    Eye,
    Pencil,
    MoreHorizontal,
    RefreshCw,
    Filter,
    ArrowUpRight,
    ArrowDownRight,
    Box,
    Receipt,
} from "lucide-react";

/* ============================================================
   TIPOS
============================================================ */

type ProdutoStatus =
    | "Ativo"
    | "Baixo estoque"
    | "Sem estoque";

type TransacaoTipo =
    | "Venda"
    | "Estorno"
    | "Pagamento";

type TransacaoStatusType =
    | "Concluída"
    | "Pendente"
    | "Cancelada";

type Produto = {
    imagem_principal: string;
    id: number;
    codigo: string;
    nome: string;
    descricao: string;
    categoria: string;
    estoque: number;
    estoqueMinimo: number;
    preco: number;
    vendas: number;
    status: ProdutoStatus;
};

type Transacao = {
    id: number;
    codigo: string;
    cliente: string;
    produto: string;
    tipo: TransacaoTipo;
    valor: number;
    data: string;
    status: TransacaoStatusType;
};

type Indicadores = {
    valorEstoque: number;
    produtosCadastrados: number;
    totalVendas: number;
    estoqueBaixo: number;
    semEstoque: number;
};

type StoreResponse = {
    produtos: Produto[];
    transacoes: Transacao[];
    indicadores: Indicadores;
};

/* ============================================================
   FORMATADORES
============================================================ */

function formatCurrency(value: number) {
    return Number(value || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
}

function formatDate(value: string) {
    if (!value) return "-";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date.toLocaleDateString("pt-BR");
}

/* ============================================================
   STATUS PRODUTO
============================================================ */

function ProdutoStatusBadge({
    status,
}: {
    status: ProdutoStatus;
}) {
    const styles: Record<ProdutoStatus, string> = {
        Ativo: "border-emerald-200 bg-emerald-50 text-emerald-700",
        "Baixo estoque":
            "border-orange-200 bg-orange-50 text-orange-600",
        "Sem estoque":
            "border-red-200 bg-red-50 text-red-600",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}
        >
            {status}
        </span>
    );
}

/* ============================================================
   STATUS TRANSAÇÃO
============================================================ */

function TransacaoStatusBadge({
    status,
}: {
    status: TransacaoStatusType;
}) {
    const styles: Record<TransacaoStatusType, string> = {
        Concluída:
            "border-emerald-200 bg-emerald-50 text-emerald-700",

        Pendente:
            "border-yellow-200 bg-yellow-50 text-yellow-700",

        Cancelada:
            "border-red-200 bg-red-50 text-red-600",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${styles[status]}`}
        >
            {status}
        </span>
    );
}

/* ============================================================
   CARD
============================================================ */

function DashboardCard({
    title,
    value,
    description,
    icon,
    iconClass,
    descriptionClass,
}: {
    title: string;
    value: string;
    description: string;
    icon: ReactNode;
    iconClass: string;
    descriptionClass: string;
}) {
    return (
        <div className="min-h-[136px] rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-sm text-[#607d94]">
                        {title}
                    </p>

                    <p className="mt-5 truncate text-2xl font-bold text-[#073b70]">
                        {value}
                    </p>

                    <p
                        className={`mt-1 text-[11px] font-semibold ${descriptionClass}`}
                    >
                        {description}
                    </p>
                </div>

                <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}
                >
                    {icon}
                </div>
            </div>
        </div>
    );
}

/* ============================================================
   LOADING
============================================================ */

function LoadingTable({
    aba,
}: {
    aba: "produtos" | "transacoes";
}) {
    return (
        <div className="overflow-hidden">
            <div className="flex items-center justify-center gap-3 py-16">
                <RefreshCw
                    className="h-5 w-5 animate-spin text-[#00a99d]"
                />

                <span className="text-sm font-medium text-slate-500">
                    Carregando{" "}
                    {aba === "produtos"
                        ? "produtos"
                        : "transações"}
                    ...
                </span>
            </div>
        </div>
    );
}

/* ============================================================
   PÁGINA
============================================================ */

export default function StorePage() {
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [transacoes, setTransacoes] = useState<Transacao[]>([]);

    const [indicadores, setIndicadores] =
        useState<Indicadores>({
            valorEstoque: 0,
            produtosCadastrados: 0,
            totalVendas: 0,
            estoqueBaixo: 0,
            semEstoque: 0,
        });

    const [busca, setBusca] = useState("");

    const [categoria, setCategoria] = useState(
        "Todas as categorias"
    );

    const [status, setStatus] = useState(
        "Todos os status"
    );

    const [aba, setAba] = useState<
        "produtos" | "transacoes"
    >("produtos");

    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");

    /* ==========================================================
       BUSCAR MYSQL
    ========================================================== */

    async function carregarStore() {
        try {
            setLoading(true);
            setErro("");

            const response = await fetch("/api/store", {
                method: "GET",
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                },
            });

            const data: Partial<StoreResponse> =
                await response.json();

            if (!response.ok) {
                throw new Error(
                    (data as { message?: string })?.message ||
                    "Erro ao carregar dados da Store."
                );
            }

            setProdutos(
                Array.isArray(data.produtos)
                    ? data.produtos
                    : []
            );

            setTransacoes(
                Array.isArray(data.transacoes)
                    ? data.transacoes
                    : []
            );

            setIndicadores({
                valorEstoque:
                    Number(data.indicadores?.valorEstoque) || 0,

                produtosCadastrados:
                    Number(
                        data.indicadores?.produtosCadastrados
                    ) || 0,

                totalVendas:
                    Number(data.indicadores?.totalVendas) || 0,

                estoqueBaixo:
                    Number(data.indicadores?.estoqueBaixo) || 0,

                semEstoque:
                    Number(data.indicadores?.semEstoque) || 0,
            });
        } catch (error) {
            console.error(
                "Erro ao carregar Maylon Store:",
                error
            );

            setErro(
                error instanceof Error
                    ? error.message
                    : "Não foi possível carregar os dados."
            );

            setProdutos([]);
            setTransacoes([]);

            setIndicadores({
                valorEstoque: 0,
                produtosCadastrados: 0,
                totalVendas: 0,
                estoqueBaixo: 0,
                semEstoque: 0,
            });
        } finally {
            setLoading(false);
        }
    }

    /* ==========================================================
       CARREGAR AO ABRIR
    ========================================================== */

    useEffect(() => {
        carregarStore();
    }, []);

    /* ==========================================================
       CATEGORIAS
    ========================================================== */

    const categorias = useMemo(() => {
        const lista = produtos
            .map((produto) => produto.categoria)
            .filter(
                (categoria): categoria is string =>
                    Boolean(categoria)
            );

        return [
            "Todas as categorias",
            ...Array.from(new Set(lista)),
        ];
    }, [produtos]);

    /* ==========================================================
       PRODUTOS FILTRADOS
    ========================================================== */

    const produtosFiltrados = useMemo(() => {
        const textoBusca = busca
            .toLowerCase()
            .trim();

        return produtos.filter((produto) => {
            const texto = `
        ${produto.codigo}
        ${produto.nome}
        ${produto.descricao}
        ${produto.categoria}
      `.toLowerCase();

            const encontrouBusca =
                !textoBusca ||
                texto.includes(textoBusca);

            const encontrouCategoria =
                categoria === "Todas as categorias" ||
                produto.categoria === categoria;

            const encontrouStatus =
                status === "Todos os status" ||
                produto.status === status;

            return (
                encontrouBusca &&
                encontrouCategoria &&
                encontrouStatus
            );
        });
    }, [
        produtos,
        busca,
        categoria,
        status,
    ]);

    /* ==========================================================
       TRANSAÇÕES FILTRADAS
    ========================================================== */

    const transacoesFiltradas = useMemo(() => {
        const textoBusca = busca
            .toLowerCase()
            .trim();

        if (!textoBusca) {
            return transacoes;
        }

        return transacoes.filter((transacao) => {
            const texto = `
        ${transacao.codigo}
        ${transacao.cliente}
        ${transacao.produto}
        ${transacao.tipo}
        ${transacao.status}
      `.toLowerCase();

            return texto.includes(textoBusca);
        });
    }, [transacoes, busca]);

    /* ==========================================================
       LIMPAR FILTROS
    ========================================================== */

    function limparFiltros() {
        setBusca("");
        setCategoria("Todas as categorias");
        setStatus("Todos os status");
    }

    /* ==========================================================
       RENDER
    ========================================================== */

    return (
        <div className="min-h-screen w-full">
            <div className="mx-auto w-full max-w-9xl">
                {/* ====================================================
            CABEÇALHO
        ===================================================== */}

                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-3xl">
                            Maylon Store
                        </h1>

                        <p className="mt-0 text-sm text-white/90">
                            Gestão de produtos, estoque e
                            transações da loja.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={carregarStore}
                        disabled={loading}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#08a9a0] px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#07978f] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                        <RefreshCw
                            size={16}
                            className={
                                loading ? "animate-spin" : ""
                            }
                        />

                        {loading
                            ? "Atualizando..."
                            : "Atualizar"}
                    </button>
                </div>

                {/* ====================================================
            CONTEÚDO
        ===================================================== */}

                {/* ==================================================
              CARDS
          =================================================== */}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5 mt-5">
                    <DashboardCard
                        title="Valor em estoque"
                        value={
                            loading
                                ? "..."
                                : formatCurrency(
                                    indicadores.valorEstoque
                                )
                        }
                        description="↗ Patrimônio da loja"
                        descriptionClass="text-emerald-600"
                        icon={<Package size={20} />}
                        iconClass="bg-emerald-100 text-emerald-600"
                    />

                    <DashboardCard
                        title="Produtos cadastrados"
                        value={
                            loading
                                ? "..."
                                : String(
                                    indicadores.produtosCadastrados
                                )
                        }
                        description="↗ Produtos cadastrados"
                        descriptionClass="text-blue-600"
                        icon={<Box size={20} />}
                        iconClass="bg-blue-100 text-blue-600"
                    />

                    <DashboardCard
                        title="Vendas realizadas"
                        value={
                            loading
                                ? "..."
                                : formatCurrency(
                                    indicadores.totalVendas
                                )
                        }
                        description="↗ Vendas concluídas"
                        descriptionClass="text-emerald-600"
                        icon={<ShoppingCart size={20} />}
                        iconClass="bg-emerald-100 text-emerald-600"
                    />

                    <DashboardCard
                        title="Estoque baixo"
                        value={
                            loading
                                ? "..."
                                : String(
                                    indicadores.estoqueBaixo
                                )
                        }
                        description="↗ Precisam reposição"
                        descriptionClass="text-orange-600"
                        icon={<AlertTriangle size={20} />}
                        iconClass="bg-orange-100 text-orange-600"
                    />

                    <DashboardCard
                        title="Sem estoque"
                        value={
                            loading
                                ? "..."
                                : String(
                                    indicadores.semEstoque
                                )
                        }
                        description="↗ Itens indisponíveis"
                        descriptionClass="text-red-600"
                        icon={<Package size={20} />}
                        iconClass="bg-red-100 text-red-600"
                    />
                </div>

                {/* ==================================================
              ÁREA PRINCIPAL
          =================================================== */}

                <section className="mt-6 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    {/* ==================================================
                CABEÇALHO
            ================================================== */}

                    <div className="px-4 pt-5 sm:px-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <div>
                                <h2 className="text-lg font-bold text-[#073b70]">
                                    Gestão da Maylon Store
                                </h2>

                                <p className="mt-0 text-sm text-[#607d94]">
                                    Controle de produtos, estoque
                                    e movimentações financeiras.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <Link
                                    href="/diretor/maylon_store/adicionar_produto"
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#08a9a0] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#07978f]"
                                >
                                    <Plus size={16} />
                                    Adicionar Produto
                                </Link>

                                <Link
                                    href="/diretor/store/transacoes"
                                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                                >
                                    <Receipt size={16} />
                                    Ver Transações
                                </Link>
                            </div>
                        </div>

                        {/* =================================================
                  ABAS
              ================================================== */}

                        <div className="mt-6 flex items-center gap-6 border-b border-slate-200">
                            <button
                                type="button"
                                onClick={() =>
                                    setAba("produtos")
                                }
                                className={`border-b-2 pb-3 cursor-pointer text-sm font-semibold transition ${aba === "produtos"
                                    ? "border-[#00a99d] text-[#00a99d]"
                                    : "border-transparent text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                Produtos
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    setAba("transacoes")
                                }
                                className={`border-b-2 pb-3 cursor-pointer text-sm font-semibold transition ${aba === "transacoes"
                                    ? "border-[#00a99d] text-[#00a99d]"
                                    : "border-transparent text-slate-400 hover:text-slate-600"
                                    }`}
                            >
                                Transações
                            </button>
                        </div>
                    </div>

                    {/* ==================================================
                ERRO
            ================================================== */}

                    {erro && (
                        <div className="mx-4 mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-4 sm:mx-5">
                            <div className="flex items-start gap-3">
                                <AlertTriangle
                                    size={20}
                                    className="mt-0.5 shrink-0 text-red-600"
                                />

                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-red-700">
                                        Erro ao carregar a Maylon Store
                                    </p>

                                    <p className="mt-1 break-words text-xs text-red-600">
                                        {erro}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ==================================================
                FILTROS
            ================================================== */}

                    <div className="px-4 py-4 sm:px-5">
                        <div className="flex flex-col gap-2 xl:flex-row">
                            {/* BUSCA */}

                            <div className="relative flex-1">
                                <Search
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />

                                <input
                                    type="text"
                                    value={busca}
                                    onChange={(e) =>
                                        setBusca(e.target.value)
                                    }
                                    placeholder={
                                        aba === "produtos"
                                            ? "Buscar código, produto, categoria..."
                                            : "Buscar cliente, produto ou transação..."
                                    }
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-[#00a99d] focus:ring-2 focus:ring-[#00a99d]/10"
                                />
                            </div>

                            {/* FILTROS DE PRODUTO */}

                            {aba === "produtos" && (
                                <>
                                    <select
                                        value={status}
                                        onChange={(e) =>
                                            setStatus(e.target.value)
                                        }
                                        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-[#00a99d] focus:ring-2 focus:ring-[#00a99d]/10"
                                    >
                                        <option value="Todos os status">
                                            Todos os status
                                        </option>

                                        <option value="Ativo">
                                            Ativo
                                        </option>

                                        <option value="Baixo estoque">
                                            Baixo estoque
                                        </option>

                                        <option value="Sem estoque">
                                            Sem estoque
                                        </option>
                                    </select>

                                    <select
                                        value={categoria}
                                        onChange={(e) =>
                                            setCategoria(e.target.value)
                                        }
                                        className="h-11 rounded-xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-[#00a99d] focus:ring-2 focus:ring-[#00a99d]/10"
                                    >
                                        {categorias.map((item) => (
                                            <option
                                                key={item}
                                                value={item}
                                            >
                                                {item}
                                            </option>
                                        ))}
                                    </select>
                                </>
                            )}

                            {/* BOTÃO FILTRAR */}

                            <button
                                type="button"
                                onClick={() => {
                                    // Os filtros já são aplicados automaticamente.
                                }}
                                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#073b70] px-5 text-sm font-semibold text-white transition hover:bg-[#052f59]"
                            >
                                <Filter size={16} />
                                Filtrar
                            </button>

                            {/* LIMPAR */}

                            {(busca ||
                                categoria !==
                                "Todas as categorias" ||
                                status !== "Todos os status") && (
                                    <button
                                        type="button"
                                        onClick={limparFiltros}
                                        className="inline-flex h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                                    >
                                        Limpar
                                    </button>
                                )}
                        </div>
                    </div>

                    {/* ==================================================
                LEGENDA
            ================================================== */}

                    {aba === "produtos" && (
                        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-100 px-4 py-4 text-xs sm:px-5">
                            <span className="font-semibold text-slate-500">
                                Legenda:
                            </span>

                            <span className="flex items-center gap-1.5 text-slate-600">
                                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                Disponível
                            </span>

                            <span className="flex items-center gap-1.5 text-slate-600">
                                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                                Estoque baixo
                            </span>

                            <span className="flex items-center gap-1.5 text-slate-600">
                                <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                                Sem estoque
                            </span>
                        </div>
                    )}

                    {/* ==================================================
                LOADING
            ================================================== */}

                    {loading ? (
                        <LoadingTable aba={aba} />
                    ) : (
                        <>
                            {/* ==================================================
                    PRODUTOS
                ================================================== */}

                            {aba === "produtos" && (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1050px]">
                                        <thead className="border-b border-slate-100 bg-slate-50">
                                            <tr className="text-left">
                                                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#607d94]">
                                                    Código
                                                </th>

                                                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#607d94]">
                                                    Produto
                                                </th>

                                                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#607d94]">
                                                    Categoria
                                                </th>

                                                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#607d94]">
                                                    Estoque
                                                </th>

                                                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#607d94]">
                                                    Preço
                                                </th>

                                                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#607d94]">
                                                    Vendas
                                                </th>

                                                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#607d94]">
                                                    Status
                                                </th>

                                                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#607d94]">
                                                    Ações
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {produtosFiltrados.map(
                                                (produto) => (
                                                    <tr
                                                        key={produto.id}
                                                        className="border-b border-slate-100 transition hover:bg-slate-50/70"
                                                    >
                                                        {/* CÓDIGO */}

                                                        <td className="px-5 py-4">
                                                            <p className="text-sm font-bold text-[#073b70]">
                                                                {produto.codigo}
                                                            </p>

                                                            <p className="mt-1 text-[11px] text-slate-400">
                                                                ID #{produto.id}
                                                            </p>
                                                        </td>

                                                        {/* PRODUTO */}

                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#d8f7eb] text-[#00a99d]">
                                                                    {produto.imagem_principal ? (
                                                                        <img
                                                                            src={produto.imagem_principal}
                                                                            alt={produto.nome}
                                                                            className="h-full w-full object-cover"
                                                                        />
                                                                    ) : (
                                                                        <Package size={19} />
                                                                    )}
                                                                </div>

                                                                <div className="max-w-[300px]">
                                                                    <p className="truncate text-sm font-bold text-[#102a43]">
                                                                        {produto.nome}
                                                                    </p>

                                                                    <p className="mt-1 truncate text-xs text-[#607d94]">
                                                                        {produto.descricao ||
                                                                            "-"}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        {/* CATEGORIA */}

                                                        <td className="px-5 py-4">
                                                            <span className="inline-flex rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                                                {produto.categoria ||
                                                                    "-"}
                                                            </span>
                                                        </td>

                                                        {/* ESTOQUE */}

                                                        <td className="px-5 py-4">
                                                            <p
                                                                className={`text-sm font-bold ${produto.estoque ===
                                                                    0
                                                                    ? "text-red-600"
                                                                    : produto.estoque <=
                                                                        produto.estoqueMinimo
                                                                        ? "text-orange-600"
                                                                        : "text-[#073b70]"
                                                                    }`}
                                                            >
                                                                {produto.estoque}
                                                            </p>

                                                            <p className="mt-1 text-[10px] text-slate-400">
                                                                Mín.{" "}
                                                                {
                                                                    produto.estoqueMinimo
                                                                }
                                                            </p>
                                                        </td>

                                                        {/* PREÇO */}

                                                        <td className="px-5 py-4">
                                                            <p className="text-sm font-bold text-[#073b70]">
                                                                {formatCurrency(
                                                                    produto.preco
                                                                )}
                                                            </p>
                                                        </td>

                                                        {/* VENDAS */}

                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-1.5">
                                                                <TrendingUp
                                                                    size={14}
                                                                    className="text-emerald-500"
                                                                />

                                                                <span className="text-sm font-semibold text-slate-700">
                                                                    {produto.vendas}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* STATUS */}

                                                        <td className="px-5 py-4">
                                                            <ProdutoStatusBadge
                                                                status={
                                                                    produto.status
                                                                }
                                                            />
                                                        </td>

                                                        {/* AÇÕES */}

                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center justify-end gap-1">
                                                                <Link
                                                                    href={`/diretor/maylon_store/${encodeURIComponent(produto.codigo)}`}
                                                                    title="Visualizar produto"
                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                                                                >
                                                                    <Eye size={16} />
                                                                </Link>

                                                                <Link
                                                                    href={`/diretor/maylon_store/${encodeURIComponent(produto.codigo)}/editar`}
                                                                    title="Editar produto"
                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-emerald-50 hover:text-[#08a99c]"
                                                                >
                                                                    <Pencil size={16} />
                                                                </Link>

                                                                <button
                                                                    type="button"
                                                                    title="Mais opções"
                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                                                                >
                                                                    <MoreHorizontal
                                                                        size={16}
                                                                    />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>

                                    {/* SEM PRODUTOS */}

                                    {produtosFiltrados.length ===
                                        0 && (
                                            <div className="py-16 text-center">
                                                <Package
                                                    size={35}
                                                    className="mx-auto text-slate-300"
                                                />

                                                <p className="mt-3 text-sm font-semibold text-slate-500">
                                                    Nenhum produto encontrado
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    Tente alterar os filtros.
                                                </p>
                                            </div>
                                        )}
                                </div>
                            )}

                            {/* ==================================================
                    TRANSAÇÕES
                ================================================== */}

                            {aba === "transacoes" && (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[1050px]">
                                        <thead className="border-b border-slate-100 bg-slate-50">
                                            <tr className="text-left">
                                                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#607d94]">
                                                    Transação
                                                </th>

                                                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#607d94]">
                                                    Cliente
                                                </th>

                                                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#607d94]">
                                                    Produto
                                                </th>

                                                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#607d94]">
                                                    Tipo
                                                </th>

                                                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#607d94]">
                                                    Valor
                                                </th>

                                                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#607d94]">
                                                    Data
                                                </th>

                                                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-[#607d94]">
                                                    Status
                                                </th>

                                                <th className="px-5 py-3 text-right text-[11px] font-semibold uppercase tracking-wide text-[#607d94]">
                                                    Ações
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {transacoesFiltradas.map(
                                                (transacao) => (
                                                    <tr
                                                        key={transacao.id}
                                                        className="border-b border-slate-100 transition hover:bg-slate-50/70"
                                                    >
                                                        {/* TRANSAÇÃO */}

                                                        <td className="px-5 py-4">
                                                            <p className="text-sm font-bold text-[#073b70]">
                                                                {transacao.codigo}
                                                            </p>

                                                            <p className="mt-1 text-[11px] text-slate-400">
                                                                #{transacao.id}
                                                            </p>
                                                        </td>

                                                        {/* CLIENTE */}

                                                        <td className="px-5 py-4">
                                                            <p className="text-sm font-semibold text-[#102a43]">
                                                                {transacao.cliente ||
                                                                    "-"}
                                                            </p>
                                                        </td>

                                                        {/* PRODUTO */}

                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                                                                    <Package
                                                                        size={15}
                                                                        className="text-slate-500"
                                                                    />
                                                                </div>

                                                                <span className="max-w-[250px] truncate text-sm text-slate-700">
                                                                    {transacao.produto ||
                                                                        "-"}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* TIPO */}

                                                        <td className="px-5 py-4">
                                                            <span
                                                                className={`inline-flex items-center gap-1 text-xs font-semibold ${transacao.tipo ===
                                                                    "Estorno"
                                                                    ? "text-red-600"
                                                                    : "text-emerald-600"
                                                                    }`}
                                                            >
                                                                {transacao.tipo ===
                                                                    "Estorno" ? (
                                                                    <ArrowDownRight
                                                                        size={14}
                                                                    />
                                                                ) : (
                                                                    <ArrowUpRight
                                                                        size={14}
                                                                    />
                                                                )}

                                                                {transacao.tipo}
                                                            </span>
                                                        </td>

                                                        {/* VALOR */}

                                                        <td className="px-5 py-4">
                                                            <p
                                                                className={`text-sm font-bold ${transacao.tipo ===
                                                                    "Estorno"
                                                                    ? "text-red-600"
                                                                    : "text-[#073b70]"
                                                                    }`}
                                                            >
                                                                {transacao.tipo ===
                                                                    "Estorno"
                                                                    ? "-"
                                                                    : ""}

                                                                {formatCurrency(
                                                                    transacao.valor
                                                                )}
                                                            </p>
                                                        </td>

                                                        {/* DATA */}

                                                        <td className="px-5 py-4">
                                                            <span className="text-sm text-slate-600">
                                                                {formatDate(
                                                                    transacao.data
                                                                )}
                                                            </span>
                                                        </td>

                                                        {/* STATUS */}

                                                        <td className="px-5 py-4">
                                                            <TransacaoStatusBadge
                                                                status={
                                                                    transacao.status
                                                                }
                                                            />
                                                        </td>

                                                        {/* AÇÕES */}

                                                        <td className="px-5 py-4">
                                                            <div className="flex justify-end">
                                                                <Link
                                                                    href={`/diretor/store/transacoes/${transacao.id}`}
                                                                    title="Visualizar transação"
                                                                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                                                                >
                                                                    <Eye size={16} />
                                                                </Link>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )
                                            )}
                                        </tbody>
                                    </table>

                                    {/* SEM TRANSAÇÕES */}

                                    {transacoesFiltradas.length ===
                                        0 && (
                                            <div className="py-16 text-center">
                                                <Receipt
                                                    size={35}
                                                    className="mx-auto text-slate-300"
                                                />

                                                <p className="mt-3 text-sm font-semibold text-slate-500">
                                                    Nenhuma transação encontrada
                                                </p>

                                                <p className="mt-1 text-xs text-slate-400">
                                                    Não existem transações
                                                    cadastradas.
                                                </p>
                                            </div>
                                        )}
                                </div>
                            )}
                        </>
                    )}

                    {/* ==================================================
                RODAPÉ
            ================================================== */}

                    {!loading && (
                        <div className="flex flex-col gap-3 border-t border-slate-100 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                            <p className="text-xs text-slate-400">
                                Exibindo{" "}
                                <strong className="text-slate-600">
                                    {aba === "produtos"
                                        ? produtosFiltrados.length
                                        : transacoesFiltradas.length}
                                </strong>{" "}
                                {aba === "produtos"
                                    ? "produtos"
                                    : "transações"}
                            </p>

                            <p className="text-xs text-slate-400">
                                Dados atualizados diretamente do
                                MySQL
                            </p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}