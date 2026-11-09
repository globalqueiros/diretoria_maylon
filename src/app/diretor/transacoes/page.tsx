"use client";
import { useEffect, useMemo, useState } from "react";
import {
    ArrowDownLeft,
    ArrowUpRight,
    Wallet,
    RefreshCw,
    Search,
    CreditCard,
    Receipt,
    Eye,
    X,
    TrendingDown,
    Filter,
    CheckCircle2,
    Clock,
    AlertCircle,
    BadgeCheck,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

type Transacao = {
    id: string;
    codigo: string;
    descricao: string;
    categoria: string;
    tipo: "Entrada" | "Saída";
    valor: number;
    data: string;
    responsavel: string;
    metodo: string;
    status: "Concluída" | "Pendente" | "Cancelada";
};

const moeda = (valor: number) =>
    valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });

const dataBR = (data: string) =>
    new Date(`${String(data).slice(0, 10)}T12:00:00`).toLocaleDateString("pt-BR");

// Gera a lista de páginas com reticências: [1, "...", 4, 5, 6, "...", 20]
function gerarPaginas(atual: number, total: number): (number | "...")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

    const paginas: (number | "...")[] = [1];
    const inicio = Math.max(2, atual - 1);
    const fim = Math.min(total - 1, atual + 1);

    if (inicio > 2) paginas.push("...");
    for (let i = inicio; i <= fim; i++) paginas.push(i);
    if (fim < total - 1) paginas.push("...");

    paginas.push(total);
    return paginas;
}

export default function TransacoesPage() {
    const [transacoes, setTransacoes] = useState<Transacao[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    const [busca, setBusca] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("Todos");
    const [filtroStatus, setFiltroStatus] = useState("Todos");
    const [filtroCategoria, setFiltroCategoria] = useState("Todas");
    const [selecionada, setSelecionada] = useState<Transacao | null>(null);
    const [atualizando, setAtualizando] = useState(false);

    const [pagina, setPagina] = useState(1);
    const [porPagina, setPorPagina] = useState(10);

    async function carregar() {
        try {
            setErro("");
            const res = await fetch("/api/transacoes", { cache: "no-store" });
            if (!res.ok) throw new Error();
            const dados: Transacao[] = await res.json();
            setTransacoes(
                dados.map((t) => ({ ...t, id: String(t.id), valor: Number(t.valor) }))
            );
        } catch {
            setErro("Não foi possível carregar as transações.");
        } finally {
            setCarregando(false);
        }
    }

    useEffect(() => {
        carregar();
    }, []);

    async function atualizar() {
        setAtualizando(true);
        await carregar();
        setAtualizando(false);
    }

    // Total pago: valores recebidos (entradas) já concluídos
    const totalPago = transacoes
        .filter((t) => t.tipo === "Entrada" && t.status === "Concluída")
        .reduce((total, t) => total + t.valor, 0);

    // Total pendente: valores ainda aguardando pagamento/processamento
    const pendentesLista = transacoes.filter((t) => t.status === "Pendente");
    const totalPendente = pendentesLista.reduce((total, t) => total + t.valor, 0);

    const saidas = transacoes
        .filter((t) => t.tipo === "Saída" && t.status === "Concluída")
        .reduce((total, t) => total + t.valor, 0);

    const saldo = totalPago - saidas;

    const filtradas = useMemo(() => {
        const termo = busca.toLowerCase();

        return transacoes.filter((t) => {
            const correspondeBusca =
                t.codigo.toLowerCase().includes(termo) ||
                t.descricao.toLowerCase().includes(termo) ||
                t.responsavel.toLowerCase().includes(termo);

            const correspondeTipo = filtroTipo === "Todos" || t.tipo === filtroTipo;
            const correspondeStatus =
                filtroStatus === "Todos" || t.status === filtroStatus;
            const correspondeCategoria =
                filtroCategoria === "Todas" || t.categoria === filtroCategoria;

            return (
                correspondeBusca &&
                correspondeTipo &&
                correspondeStatus &&
                correspondeCategoria
            );
        });
    }, [transacoes, busca, filtroTipo, filtroStatus, filtroCategoria]);

    // Paginação
    const totalPaginas = Math.max(1, Math.ceil(filtradas.length / porPagina));
    const paginaAtual = Math.min(pagina, totalPaginas);
    const indiceInicial = (paginaAtual - 1) * porPagina;
    const paginadas = filtradas.slice(indiceInicial, indiceInicial + porPagina);
    const primeiroItem = filtradas.length === 0 ? 0 : indiceInicial + 1;
    const ultimoItem = indiceInicial + paginadas.length;

    // Volta para a primeira página quando filtros ou tamanho da página mudam
    useEffect(() => {
        setPagina(1);
    }, [busca, filtroTipo, filtroStatus, filtroCategoria, porPagina]);

    function limparFiltros() {
        setBusca("");
        setFiltroTipo("Todos");
        setFiltroStatus("Todos");
        setFiltroCategoria("Todas");
    }

    const categorias = Array.from(new Set(transacoes.map((t) => t.categoria)));

    return (
        <main className="min-h-screen">
            <div className="mx-auto max-w-8xl space-y-6">
                <header className="flex flex-col justify-between gap-4 rounded-2xl bg-gradient-to-r from-[#35a989] to-[#43c5a2] p-6 text-white shadow-sm sm:flex-row sm:items-center">
                    <div>
                        <div className="flex items-center gap-2">
                            <Receipt size={23} />
                            <h1 className="text-2xl font-bold">Transações Financeiras</h1>
                        </div>
                        <p className="mt-2 text-sm text-white/85">
                            Controle, acompanhamento e rastreabilidade das movimentações financeiras.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={atualizar}
                        className="flex items-center justify-center gap-2 rounded-xl bg-[#08a99d] px-5 py-3 text-sm font-bold shadow-md transition hover:bg-[#078f85]"
                    >
                        <RefreshCw size={17} className={atualizando ? "animate-spin" : ""} />
                        Atualizar
                    </button>
                </header>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <ResumoCard
                        titulo="Saldo disponível"
                        valor={moeda(saldo)}
                        descricao="Total pago menos saídas concluídas"
                        icon={Wallet}
                        cor="green"
                    />

                    <ResumoCard
                        titulo="Total pago"
                        valor={moeda(totalPago)}
                        descricao="Recebimentos concluídos"
                        icon={BadgeCheck}
                        cor="blue"
                    />

                    <ResumoCard
                        titulo="Total pendente"
                        valor={moeda(totalPendente)}
                        descricao={`${pendentesLista.length} transação(ões) aguardando pagamento`}
                        icon={Clock}
                        cor="orange"
                    />

                    <ResumoCard
                        titulo="Total de saídas"
                        valor={moeda(saidas)}
                        descricao="Estornos e pagamentos concluídos"
                        icon={TrendingDown}
                        cor="red"
                    />
                </section>

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-5 sm:p-6">
                        <h2 className="text-lg font-bold text-slate-900">
                            Histórico de transações
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Movimentações financeiras registradas no sistema.
                        </p>
                    </div>

                    <div className="space-y-4 p-5 sm:p-6">
                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(200px,1fr)_170px_170px_190px_auto]">
                            <div className="relative">
                                <Search
                                    size={18}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                                />
                                <input
                                    value={busca}
                                    onChange={(e) => setBusca(e.target.value)}
                                    placeholder="Buscar código, descrição, responsável..."
                                    className="h-11 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none transition focus:border-[#35a989] focus:ring-2 focus:ring-[#35a989]/10"
                                />
                            </div>

                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#35a989]"
                            >
                                <option value="Todos">Todos os tipos</option>
                                <option value="Entrada">Entradas</option>
                                <option value="Saída">Saídas</option>
                            </select>

                            <select
                                value={filtroStatus}
                                onChange={(e) => setFiltroStatus(e.target.value)}
                                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#35a989]"
                            >
                                <option value="Todos">Todos os status</option>
                                <option value="Concluída">Concluídas</option>
                                <option value="Pendente">Pendentes</option>
                                <option value="Cancelada">Canceladas</option>
                            </select>

                            <select
                                value={filtroCategoria}
                                onChange={(e) => setFiltroCategoria(e.target.value)}
                                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-[#35a989]"
                            >
                                <option value="Todas">Todas as categorias</option>
                                {categorias.map((categoria) => (
                                    <option key={categoria} value={categoria}>
                                        {categoria}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={limparFiltros}
                                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 text-sm font-bold text-white transition cursor-pointer"
                            >
                                <Filter size={16} />
                                Limpar
                            </button>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
                            <span className="font-semibold">Legenda:</span>
                            <Legenda cor="bg-emerald-500" texto="Entrada" />
                            <Legenda cor="bg-red-500" texto="Saída" />
                            <Legenda cor="bg-amber-400" texto="Pendente" />
                            <Legenda cor="bg-blue-500" texto="Concluída" />
                            <Legenda cor="bg-slate-400" texto="Cancelada" />
                        </div>

                        {erro && (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {erro}
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1050px] text-left">
                            <thead className="bg-slate-50 text-[11px] font-bold uppercase text-slate-500">
                                <tr>
                                    <th className="px-5 py-4">Código</th>
                                    <th className="px-5 py-4">Descrição</th>
                                    <th className="px-5 py-4">Categoria</th>
                                    <th className="px-5 py-4">Tipo</th>
                                    <th className="px-5 py-4">Valor</th>
                                    <th className="px-5 py-4">Data</th>
                                    <th className="px-5 py-4">Pagamento</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4 text-right">Ações</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {paginadas.map((t) => (
                                    <tr key={t.id} className="transition hover:bg-slate-50/80">
                                        <td className="px-5 py-5">
                                            <span className="font-bold text-[#0b3d70]">
                                                {t.codigo}
                                            </span>
                                        </td>

                                        <td className="px-5 py-5">
                                            <p className="text-sm font-bold text-slate-800">
                                                {t.descricao}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-400">
                                                Responsável: {t.responsavel}
                                            </p>
                                        </td>

                                        <td className="px-5 py-5">
                                            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
                                                {t.categoria}
                                            </span>
                                        </td>

                                        <td className="px-5 py-5">
                                            <span
                                                className={`flex items-center gap-2 text-xs font-bold ${
                                                    t.tipo === "Entrada"
                                                        ? "text-emerald-600"
                                                        : "text-red-600"
                                                }`}
                                            >
                                                {t.tipo === "Entrada" ? (
                                                    <ArrowDownLeft size={16} />
                                                ) : (
                                                    <ArrowUpRight size={16} />
                                                )}
                                                {t.tipo}
                                            </span>
                                        </td>

                                        <td className="px-5 py-5">
                                            <span
                                                className={`text-sm font-bold ${
                                                    t.tipo === "Entrada"
                                                        ? "text-emerald-600"
                                                        : "text-red-600"
                                                }`}
                                            >
                                                {t.tipo === "Entrada" ? "+" : "-"}
                                                {moeda(t.valor)}
                                            </span>
                                        </td>

                                        <td className="px-5 py-5 text-sm text-slate-600">
                                            {dataBR(t.data)}
                                        </td>

                                        <td className="px-5 py-5">
                                            <span className="flex items-center gap-2 text-sm text-slate-600">
                                                <CreditCard size={15} className="text-slate-400" />
                                                {t.metodo}
                                            </span>
                                        </td>

                                        <td className="px-5 py-5">
                                            <Status status={t.status} />
                                        </td>

                                        <td className="px-5 py-5 text-right">
                                            <button
                                                type="button"
                                                onClick={() => setSelecionada(t)}
                                                className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-[#e9f7f2] hover:text-[#259b78]"
                                            >
                                                <Eye size={15} />
                                                Detalhes
                                            </button>
                                        </td>
                                    </tr>
                                ))}

                                {carregando && (
                                    <tr>
                                        <td colSpan={9} className="px-5 py-16 text-center text-sm text-slate-500">
                                            Carregando transações...
                                        </td>
                                    </tr>
                                )}

                                {!carregando && filtradas.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-5 py-16 text-center">
                                            <Search size={30} className="mx-auto text-slate-300" />
                                            <p className="mt-3 font-semibold text-slate-600">
                                                Nenhuma transação encontrada
                                            </p>
                                            <p className="mt-1 text-sm text-slate-400">
                                                Tente alterar os filtros da pesquisa.
                                            </p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 text-xs text-slate-500 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex flex-wrap items-center gap-4">
                            <span>
                                Exibindo {primeiroItem}–{ultimoItem} de {filtradas.length}
                                {filtradas.length !== transacoes.length &&
                                    ` (total: ${transacoes.length})`}{" "}
                                transações
                            </span>

                            <label className="flex items-center gap-2">
                                Por página
                                <select
                                    value={porPagina}
                                    onChange={(e) => setPorPagina(Number(e.target.value))}
                                    className="h-8 cursor-pointer rounded-lg border border-slate-200 bg-white px-2 text-xs outline-none focus:border-[#35a989]"
                                >
                                    <option value={10}>10</option>
                                    <option value={25}>25</option>
                                    <option value={50}>50</option>
                                    <option value={100}>100</option>
                                </select>
                            </label>
                        </div>

                        <nav aria-label="Paginação" className="flex flex-wrap items-center gap-1">
                            <button
                                type="button"
                                onClick={() => setPagina(paginaAtual - 1)}
                                disabled={paginaAtual === 1}
                                aria-label="Página anterior"
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            {gerarPaginas(paginaAtual, totalPaginas).map((p, i) =>
                                p === "..." ? (
                                    <span key={`e${i}`} className="px-2 text-slate-400">
                                        …
                                    </span>
                                ) : (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => setPagina(p)}
                                        aria-current={p === paginaAtual ? "page" : undefined}
                                        className={`h-8 min-w-8 cursor-pointer rounded-lg border px-2 text-xs font-semibold transition ${
                                            p === paginaAtual
                                                ? "border-teal-500 bg-teal-500 text-white"
                                                : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        {p}
                                    </button>
                                )
                            )}

                            <button
                                type="button"
                                onClick={() => setPagina(paginaAtual + 1)}
                                disabled={paginaAtual === totalPaginas}
                                aria-label="Próxima página"
                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </nav>
                    </div>
                </section>
            </div>

            {selecionada && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 p-5">
                            <div>
                                <h2 className="font-bold text-slate-900">
                                    Detalhes da transação
                                </h2>
                                <p className="mt-1 text-xs text-slate-400">
                                    {selecionada.codigo}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelecionada(null)}
                                aria-label="Fechar detalhes"
                                className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 p-5">
                            <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-xs text-slate-500">Valor da movimentação</p>
                                <p
                                    className={`mt-1 text-2xl font-bold ${
                                        selecionada.tipo === "Entrada"
                                            ? "text-emerald-600"
                                            : "text-red-600"
                                    }`}
                                >
                                    {moeda(selecionada.valor)}
                                </p>
                            </div>

                            {[
                                ["Descrição", selecionada.descricao],
                                ["Categoria", selecionada.categoria],
                                ["Tipo", selecionada.tipo],
                                ["Data", dataBR(selecionada.data)],
                                ["Pagamento", selecionada.metodo],
                                ["Responsável", selecionada.responsavel],
                                ["Status", selecionada.status],
                            ].map(([label, value]) => (
                                <div
                                    key={label}
                                    className="flex justify-between gap-4 border-b border-slate-100 pb-3 text-sm"
                                >
                                    <span className="text-slate-500">{label}</span>
                                    <span className="text-right font-semibold text-slate-800">
                                        {value}
                                    </span>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={() => setSelecionada(null)}
                                className="w-full rounded-2xl bg-teal-500 py-3 text-sm font-bold text-white cursor-pointer"
                            >
                                Fechar detalhes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

function ResumoCard({
    titulo,
    valor,
    descricao,
    icon: Icon,
    cor,
}: {
    titulo: string;
    valor: string;
    descricao: string;
    icon: React.ElementType;
    cor: "green" | "blue" | "red" | "orange";
}) {
    const cores = {
        green: "bg-emerald-100 text-emerald-600",
        blue: "bg-blue-100 text-blue-600",
        red: "bg-red-100 text-red-600",
        orange: "bg-amber-100 text-amber-600",
    };

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">{titulo}</p>
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${cores[cor]}`}>
                    <Icon size={21} />
                </div>
            </div>
            <h3 className="mt-4 text-2xl font-extrabold tracking-tight text-[#0b3d70]">
                {valor}
            </h3>
            <p className="mt-2 text-xs text-slate-500">{descricao}</p>
        </div>
    );
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
    return (
        <span className="flex items-center gap-2">
            <span className={`h-2.5 w-2.5 rounded-full ${cor}`} />
            {texto}
        </span>
    );
}

function Status({ status }: { status: Transacao["status"] }) {
    const configuracao = {
        Concluída: {
            cor: "bg-emerald-50 text-emerald-700 border-emerald-200",
            icon: CheckCircle2,
        },
        Pendente: {
            cor: "bg-amber-50 text-amber-700 border-amber-200",
            icon: Clock,
        },
        Cancelada: {
            cor: "bg-red-50 text-red-700 border-red-200",
            icon: AlertCircle,
        },
    };

    const { cor, icon: Icon } = configuracao[status];

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${cor}`}
        >
            <Icon size={13} />
            {status}
        </span>
    );
}