"use client";
import Image from 'next/image'
import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle,
    BadgeDollarSign,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    Clock,
    Download,
    FileText,
    Gift,
    Headset,
    Printer,
    RefreshCw,
    Search,
    TrendingUp,
    User,
    Wallet,
    XCircle,
} from "lucide-react";

/* ───────────────────────── Tipos ───────────────────────── */

type Atendimento = {
    id: string;
    protocolo: string;
    cliente: string;
    data: string;
    status: string;
    valor: number;
};

type Relatorio = {
    colaborador: string;
    salarioBase: number;
    comissoes: number;
    bonificacoes: number;
    descontos: number;
    totalAtendimentos: number;
    concluidos: number;
    pendentes: number;
    cancelados: number;
    totalReceber: number;
    beneficios?: { nome: string; valor: number; descricao?: string }[];
    atendimentos: Atendimento[];
};

type StatusFolha = "pago" | "processando" | "pendente";

type Folha = {
    id: string;
    competencia: string; // "AAAA-MM"
    salarioBase: number;
    comissoes: number;
    bonificacoes: number;
    descontos: number;
    totalLiquido: number;
    totalAtendimentos?: number;
    status: StatusFolha;
    dataPagamento: string | null;
};

type Aba = "mes" | "folhas";

type BeneficioCatalogo = {
    titulo: string;
    imagem: string;
    id: number | string;
    descricao?: string;
    valor?: number;
    ativo: number | boolean;
};

/* ───────────────────────── Helpers ───────────────────────── */

const moeda = (valor: number) =>
    new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
    }).format(valor || 0);

const MESES_CURTOS = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
];

function nomeCompetencia(competencia: string) {
    const [ano, mes] = competencia.split("-").map(Number);
    if (!ano || !mes) return competencia;
    const texto = new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
    });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function formatarData(data: string | null) {
    if (!data) return "—";
    const d = new Date(data);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function liquido(f: Folha) {
    return (
        f.totalLiquido ??
        f.salarioBase + f.comissoes + f.bonificacoes - f.descontos
    );
}

function statusAtendimento(status: string) {
    const s = (status || "").toLowerCase();
    if (s === "resolvido" || s === "concluido" || s === "concluído")
        return {
            rotulo: "Concluído",
            classe: "bg-green-50 text-green-700 ring-green-600/20",
        };
    if (s === "cancelado")
        return {
            rotulo: "Cancelado",
            classe: "bg-red-50 text-red-700 ring-red-600/20",
        };
    return {
        rotulo: "Pendente",
        classe: "bg-amber-50 text-amber-700 ring-amber-600/20",
    };
}

const STATUS_FOLHA: Record<StatusFolha, { rotulo: string; classe: string }> = {
    pago: {
        rotulo: "Pago",
        classe: "bg-green-50 text-green-700 ring-green-600/20",
    },
    processando: {
        rotulo: "Em processamento",
        classe: "bg-blue-50 text-blue-700 ring-blue-600/20",
    },
    pendente: {
        rotulo: "Pendente",
        classe: "bg-amber-50 text-amber-700 ring-amber-600/20",
    },
};

/* ───────────────────────── Página ───────────────────────── */

export default function RelatorioColaboradorPage() {
    const hoje = new Date();
    const competenciaAtual = hoje.toISOString().slice(0, 7);

    const [aba, setAba] = useState<Aba>("mes");

    // Relatório do mês
    const [dados, setDados] = useState<Relatorio | null>(null);
    const [competencia, setCompetencia] = useState(competenciaAtual);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState("");

    // Filtros da tabela de atendimentos
    const [busca, setBusca] = useState("");
    const [filtroStatus, setFiltroStatus] = useState("todos");

    // Folhas anteriores
    const [ano, setAno] = useState(hoje.getFullYear());
    const [folhas, setFolhas] = useState<Folha[]>([]);
    const [carregandoFolhas, setCarregandoFolhas] = useState(true);
    const [erroFolhas, setErroFolhas] = useState("");
    const [expandida, setExpandida] = useState<string | null>(null);

    // Modal de benefícios
    const [modalBeneficios, setModalBeneficios] = useState(false);
    const [beneficios, setBeneficios] = useState<BeneficioCatalogo[]>([]);
    const [loadingBeneficios, setLoadingBeneficios] = useState(false);
    const [erroBeneficios, setErroBeneficios] = useState("");

    const carregarBeneficios = async () => {
        setLoadingBeneficios(true);
        setErroBeneficios("");
        setBeneficios([]);

        try {
            const response = await fetch("/api/beneficio", {
                method: "GET",
                cache: "no-store",
            });

            const resultado = await response.json();

            console.log("Resposta da API benefícios:", resultado);

            if (!response.ok) {
                throw new Error(resultado?.error || "Erro ao buscar benefícios.");
            }

            const lista = Array.isArray(resultado)
                ? resultado
                : resultado.beneficios ?? resultado.data ?? resultado.rows ?? [];

            if (!Array.isArray(lista)) {
                throw new Error("Formato de resposta inválido.");
            }

            setBeneficios(lista);

        } catch (error) {
            console.error("Erro benefícios:", error);

            setErroBeneficios(
                error instanceof Error ? error.message : "Erro ao carregar benefícios."
            );
        } finally {
            setLoadingBeneficios(false);
        }
    };

    const alterarBeneficio = async (beneficio: BeneficioCatalogo) => {
        const novoStatus = Number(beneficio.ativo) === 1 ? 0 : 1;

        try {
            const response = await fetch(`/api/beneficio/${beneficio.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ ativo: novoStatus }),
            });

            if (!response.ok) {
                throw new Error("Erro ao atualizar benefício");
            }

            setBeneficios((anteriores) =>
                anteriores.map((item) =>
                    item.id === beneficio.id ? { ...item, ativo: novoStatus } : item
                )
            );
            carregarRelatorio(); // atualiza os descontos na tela
        } catch (error) {
            console.error(error);
            alert("Não foi possível atualizar o benefício.");
        }
    };

    const carregarRelatorio = useCallback(async () => {
        try {
            setCarregando(true);
            setErro("");

            const response = await fetch(
                `/api/colaborador/relatorio?competencia=${competencia}`,
                { cache: "no-store" }
            );

            if (!response.ok) {
                throw new Error("Não foi possível carregar o relatório.");
            }

            setDados(await response.json());
        } catch (error) {
            setErro(
                error instanceof Error ? error.message : "Erro ao carregar relatório."
            );
        } finally {
            setCarregando(false);
        }
    }, [competencia]);

    const carregarFolhas = useCallback(async () => {
        try {
            setCarregandoFolhas(true);
            setErroFolhas("");

            const response = await fetch(`/api/colaborador/folhas?ano=${ano}`, {
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error("Não foi possível carregar as folhas de pagamento.");
            }

            const resultado = await response.json();
            setFolhas(Array.isArray(resultado) ? resultado : resultado.folhas ?? []);
        } catch (error) {
            setErroFolhas(
                error instanceof Error ? error.message : "Erro ao carregar folhas."
            );
            setFolhas([]);
        } finally {
            setCarregandoFolhas(false);
        }
    }, [ano]);

    useEffect(() => {
        carregarRelatorio();
    }, [carregarRelatorio]);

    useEffect(() => {
        carregarFolhas();
    }, [carregarFolhas]);

    /* ── Derivados ── */

    const atendimentosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        return (dados?.atendimentos ?? []).filter((item) => {
            const rotulo = statusAtendimento(item.status).rotulo.toLowerCase();
            const passaStatus = filtroStatus === "todos" || rotulo === filtroStatus;
            const passaBusca =
                !termo ||
                item.protocolo?.toLowerCase().includes(termo) ||
                item.cliente?.toLowerCase().includes(termo);
            return passaStatus && passaBusca;
        });
    }, [dados, busca, filtroStatus]);

    const folhasOrdenadas = useMemo(
        () =>
            [...folhas].sort((a, b) => b.competencia.localeCompare(a.competencia)),
        [folhas]
    );

    const resumoAno = useMemo(() => {
        const pagas = folhas.filter((f) => f.status === "pago");
        const total = pagas.reduce((acc, f) => acc + liquido(f), 0);
        const melhor = pagas.reduce<Folha | null>(
            (acc, f) => (!acc || liquido(f) > liquido(acc) ? f : acc),
            null
        );
        return {
            total,
            media: pagas.length ? total / pagas.length : 0,
            melhor,
            quantidade: pagas.length,
        };
    }, [folhas]);

    const serieGrafico = useMemo(() => {
        const valores = MESES_CURTOS.map((rotulo, i) => {
            const chave = `${ano}-${String(i + 1).padStart(2, "0")}`;
            const folha = folhas.find((f) => f.competencia === chave);
            return { rotulo, chave, valor: folha ? liquido(folha) : 0 };
        });
        const maximo = Math.max(...valores.map((v) => v.valor), 1);
        return { valores, maximo };
    }, [folhas, ano]);

    const anosDisponiveis = useMemo(() => {
        const atual = hoje.getFullYear();
        return [atual, atual - 1, atual - 2, atual - 3];
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const cards = [
        {
            titulo: "Total a receber",
            valor: moeda(dados?.totalReceber ?? 0),
            descricao: "Previsão líquida do mês",
            icon: Wallet,
            cor: "text-[#159B78]",
            fundo: "bg-[#159B78]/10",
        },
        {
            titulo: "Atendimentos",
            valor: dados?.totalAtendimentos ?? 0,
            descricao: "Total no período",
            icon: Headset,
            cor: "text-blue-600",
            fundo: "bg-blue-50",
        },
        {
            titulo: "Concluídos",
            valor: dados?.concluidos ?? 0,
            descricao: "Atendimentos finalizados",
            icon: CheckCircle2,
            cor: "text-green-600",
            fundo: "bg-green-50",
        },
        {
            titulo: "Pendentes",
            valor: dados?.pendentes ?? 0,
            descricao: "Aguardando conclusão",
            icon: Clock,
            cor: "text-amber-600",
            fundo: "bg-amber-50",
        },
    ];

    const taxaConclusao = dados?.totalAtendimentos
        ? Math.round((dados.concluidos / dados.totalAtendimentos) * 100)
        : 0;

    const linhasFinanceiras = [
        {
            titulo: "Salário base",
            valor: dados?.salarioBase ?? 0,
            tipo: "provento",
        },
        { titulo: "Comissões", valor: dados?.comissoes ?? 0, tipo: "provento" },
        {
            titulo: "Bonificações",
            valor: dados?.bonificacoes ?? 0,
            tipo: "provento",
        },
        { titulo: "Descontos", valor: dados?.descontos ?? 0, tipo: "desconto" },
    ];

    const listaBeneficios = dados?.beneficios ?? [];
    const totalBeneficios = listaBeneficios.reduce((acc, b) => acc + b.valor, 0);

    const folhaDoMes = folhas.find((f) => f.competencia === competencia);

    /* ── Loading inicial ── */

    if (carregando && !dados) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <RefreshCw
                    className="animate-spin text-[#159B78]"
                    size={30}
                    aria-label="Carregando"
                />
            </div>
        );
    }

    return (
        <main className="min-h-screen">
            <div className="mx-auto max-w-8xl space-y-6">
                {/* ───── Cabeçalho ───── */}
                <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-white md:text-3xl">
                            Meu relatório
                        </h1>
                        <p className="text-sm text-white/90">
                            Acompanhe seus atendimentos, sua remuneração e suas folhas de
                            pagamento.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2 print:hidden">
                        <label className="sr-only" htmlFor="competencia">
                            Competência
                        </label>
                        <input
                            id="competencia"
                            type="month"
                            value={competencia}
                            max={competenciaAtual}
                            onChange={(e) => e.target.value && setCompetencia(e.target.value)}
                            className="rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#159B78] focus:ring-2 focus:ring-[#159B78]/20"
                        />
                        <button
                            onClick={() => {
                                carregarRelatorio();
                                carregarFolhas();
                            }}
                            disabled={carregando}
                            className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#159B78] px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#107C61] focus:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-60"
                        >
                            <RefreshCw size={17} className={carregando ? "animate-spin" : ""} />
                            Atualizar
                        </button>
                        <button
                            onClick={() => window.print()}
                            className="flex cursor-pointer items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
                        >
                            <Printer size={17} />
                            Imprimir
                        </button>
                    </div>
                </header>

                {erro && (
                    <div
                        role="alert"
                        className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        <AlertCircle size={18} className="mt-0.5 shrink-0" />
                        <div className="flex-1">
                            <p className="font-semibold">Não foi possível carregar os dados</p>
                            <p>{erro}</p>
                        </div>
                        <button
                            onClick={carregarRelatorio}
                            className="cursor-pointer font-semibold underline"
                        >
                            Tentar novamente
                        </button>
                    </div>
                )}

                {/* ───── Perfil do colaborador ───── */}
                <section className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#159B78]/10 text-[#159B78]">
                            <User size={26} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Colaborador</p>
                            <h2 className="text-lg font-bold text-gray-900">
                                {dados?.colaborador || "Meu perfil"}
                            </h2>
                            <p className="flex items-center gap-1.5 text-xs text-gray-500">
                                <CalendarDays size={13} />
                                {nomeCompetencia(competencia)}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 sm:text-right">
                        <div>
                            <p className="text-xs text-gray-500">Taxa de conclusão</p>
                            <p className="text-lg font-bold text-gray-900">
                                {taxaConclusao}%
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Folha do mês</p>
                            {folhaDoMes ? (
                                <span
                                    className={`mt-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_FOLHA[folhaDoMes.status].classe}`}
                                >
                                    {STATUS_FOLHA[folhaDoMes.status].rotulo}
                                </span>
                            ) : (
                                <p className="text-sm font-semibold text-gray-400">
                                    Em aberto
                                </p>
                            )}
                        </div>
                    </div>
                </section>

                {/* ───── Abas ───── */}
                <div
                    role="tablist"
                    aria-label="Seções do relatório"
                    className="inline-flex rounded-xl bg-white/15 p-1 print:hidden"
                >
                    {(
                        [
                            ["mes", "Visão do mês", TrendingUp],
                            ["folhas", "Folhas de pagamento", FileText],
                        ] as const
                    ).map(([id, rotulo, Icon]) => (
                        <button
                            key={id}
                            role="tab"
                            aria-selected={aba === id}
                            onClick={() => setAba(id)}
                            className={`flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white ${aba === id
                                ? "bg-white text-[#159B78] shadow-sm"
                                : "text-white hover:bg-white/10"
                                }`}
                        >
                            <Icon size={16} />
                            {rotulo}
                        </button>
                    ))}
                </div>

                {/* ═════════════ ABA: VISÃO DO MÊS ═════════════ */}
                {aba === "mes" && (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                            {cards.map((card) => {
                                const Icon = card.icon;
                                return (
                                    <div
                                        key={card.titulo}
                                        className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-500">
                                                {card.titulo}
                                            </span>
                                            <div className={`rounded-xl p-2 ${card.fundo}`}>
                                                <Icon size={20} className={card.cor} />
                                            </div>
                                        </div>
                                        <p className="mt-2 text-2xl font-bold text-gray-900">
                                            {card.valor}
                                        </p>
                                        <p className="mt-1.5 text-xs text-gray-400">
                                            {card.descricao}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="rounded-lg bg-red-50 p-2 text-red-500">
                                    <XCircle size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">
                                        Atendimentos cancelados
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Total no período selecionado
                                    </p>
                                </div>
                            </div>
                            <span className="text-xl font-bold text-red-500">
                                {dados?.cancelados ?? 0}
                            </span>
                        </div>

                        {/* Resumo financeiro */}
                        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                            <div className="flex items-center gap-3 border-b border-gray-100 p-5">
                                <div className="rounded-xl bg-[#159B78]/10 p-3 text-[#159B78]">
                                    <BadgeDollarSign size={22} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-gray-900">Resumo financeiro</h2>
                                    <p className="text-sm text-gray-500">
                                        Demonstrativo da sua remuneração em{" "}
                                        {nomeCompetencia(competencia)}
                                    </p>
                                </div>
                            </div>

                            <dl className="space-y-4 p-5">
                                {linhasFinanceiras.map((linha) => (
                                    <div
                                        key={linha.titulo}
                                        className="flex justify-between gap-3 text-sm"
                                    >
                                        <dt className="text-gray-500">{linha.titulo}</dt>
                                        <dd
                                            className={`font-semibold ${linha.tipo === "desconto"
                                                ? "text-red-600"
                                                : "text-gray-800"
                                                }`}
                                        >
                                            {linha.tipo === "desconto" && linha.valor > 0 ? "− " : ""}
                                            {moeda(linha.valor)}
                                        </dd>
                                    </div>
                                ))}

                                <div className="border-t border-dashed border-gray-200 pt-4">
                                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                                        <div>
                                            <p className="font-bold text-gray-900">
                                                Total líquido previsto
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Valor estimado para recebimento
                                            </p>
                                        </div>
                                        <p className="text-2xl font-bold text-[#159B78]">
                                            {moeda(dados?.totalReceber ?? 0)}
                                        </p>
                                    </div>
                                </div>
                            </dl>
                        </section>

                        {/* Benefícios */}
                        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                            <div className="flex flex-col justify-between gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center">
                                <div className="flex w-full items-center gap-3">
                                    <div className="rounded-xl bg-[#159B78]/10 p-3 text-[#159B78]">
                                        <Gift size={22} />
                                    </div>
                                    <div>
                                        <h2 className="font-bold text-gray-900">Benefícios</h2>
                                        <p className="text-sm text-gray-500">
                                            Benefícios ativos descontados na sua remuneração.
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setModalBeneficios(true);
                                            carregarBeneficios();
                                        }}
                                        className="ml-auto cursor-pointer rounded-lg bg-[#159B78] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#117c61] print:hidden"
                                    >
                                        Ver benefícios
                                    </button>
                                </div>

                                {listaBeneficios.length > 0 && (
                                    <div className="sm:text-right">
                                        <p className="text-xs text-gray-500">Total em benefícios</p>
                                        <p className="text-lg font-bold text-red-600">
                                            − {moeda(totalBeneficios)}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {listaBeneficios.length > 0 ? (
                                <ul className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                                    {listaBeneficios.map((b, i) => (
                                        <li
                                            key={`${b.nome}-${i}`}
                                            className="flex flex-col justify-between gap-3 rounded-xl border border-green-100 bg-green-50/50 p-4"
                                        >
                                            <div className="flex items-start justify-between gap-2">
                                                <div>
                                                    <p className="font-semibold text-gray-900">
                                                        {b.nome}
                                                    </p>

                                                    {b.descricao && (
                                                        <p className="mt-1 line-clamp-2 text-xs text-gray-500">
                                                            {b.descricao}
                                                        </p>
                                                    )}
                                                </div>

                                                <span className="shrink-0 rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                                                    Ativo
                                                </span>
                                            </div>

                                            <p className="text-sm font-bold text-red-600">
                                                − {moeda(Number(b.valor))}
                                                <span className="ml-1 text-xs font-normal text-gray-400">
                                                    por mês
                                                </span>
                                            </p>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <p className="px-5 py-10 text-center text-sm text-gray-400">
                                    Nenhum benefício ativo para desconto neste mês.
                                </p>
                            )}
                        </section>

                        {/* Histórico de atendimentos */}
                        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                            <div className="flex flex-col justify-between gap-3 border-b border-gray-100 p-5 lg:flex-row lg:items-center">
                                <div>
                                    <h2 className="font-bold text-gray-900">
                                        Histórico de atendimentos
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Seus registros durante a competência.
                                    </p>
                                </div>

                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center print:hidden">
                                    <div className="relative">
                                        <Search
                                            size={16}
                                            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                        />
                                        <input
                                            type="search"
                                            value={busca}
                                            onChange={(e) => setBusca(e.target.value)}
                                            placeholder="Buscar protocolo ou cliente"
                                            className="w-full rounded-lg border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#159B78] focus:ring-2 focus:ring-[#159B78]/20 sm:w-64"
                                        />
                                    </div>
                                    <select
                                        value={filtroStatus}
                                        onChange={(e) => setFiltroStatus(e.target.value)}
                                        aria-label="Filtrar por status"
                                        className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#159B78] focus:ring-2 focus:ring-[#159B78]/20"
                                    >
                                        <option value="todos">Todos os status</option>
                                        <option value="concluído">Concluídos</option>
                                        <option value="pendente">Pendentes</option>
                                        <option value="cancelado">Cancelados</option>
                                    </select>
                                    <span className="rounded-lg bg-gray-100 px-3 py-2.5 text-center text-xs font-semibold text-gray-600">
                                        {atendimentosFiltrados.length} registros
                                    </span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-xs text-gray-500">
                                        <tr>
                                            <th className="px-5 py-4 font-semibold">Protocolo</th>
                                            <th className="px-5 py-4 font-semibold">Cliente</th>
                                            <th className="px-5 py-4 font-semibold">Data</th>
                                            <th className="px-5 py-4 font-semibold">Status</th>
                                            <th className="px-5 py-4 text-right font-semibold">
                                                Valor
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {atendimentosFiltrados.map((item) => {
                                            const st = statusAtendimento(item.status);
                                            return (
                                                <tr key={item.id} className="hover:bg-gray-50">
                                                    <td className="whitespace-nowrap px-5 py-4 font-semibold text-gray-800">
                                                        {item.protocolo}
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-4 text-gray-600">
                                                        {item.cliente}
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                                                        {formatarData(item.data)}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <span
                                                            className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${st.classe}`}
                                                        >
                                                            {st.rotulo}
                                                        </span>
                                                    </td>
                                                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-gray-800">
                                                        {moeda(item.valor)}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {!atendimentosFiltrados.length && (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-5 py-10 text-center text-gray-400"
                                                >
                                                    {dados?.atendimentos?.length
                                                        ? "Nenhum atendimento corresponde aos filtros."
                                                        : "Nenhum atendimento encontrado nesta competência."}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}

                {/* ═════════════ ABA: FOLHAS DE PAGAMENTO ═════════════ */}
                {aba === "folhas" && (
                    <>
                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                            <p className="text-sm text-white/90">
                                Consulte o histórico de pagamentos e baixe seus holerites.
                            </p>
                            <div className="flex items-center gap-2 print:hidden">
                                <label htmlFor="ano" className="text-sm font-medium text-white">
                                    Ano
                                </label>
                                <select
                                    id="ano"
                                    value={ano}
                                    onChange={(e) => setAno(Number(e.target.value))}
                                    className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-[#159B78] focus:ring-2 focus:ring-[#159B78]/20"
                                >
                                    {anosDisponiveis.map((a) => (
                                        <option key={a} value={a}>
                                            {a}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {erroFolhas && (
                            <div
                                role="alert"
                                className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                            >
                                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                                <div className="flex-1">
                                    <p className="font-semibold">Folhas indisponíveis</p>
                                    <p>{erroFolhas}</p>
                                </div>
                                <button
                                    onClick={carregarFolhas}
                                    className="cursor-pointer font-semibold underline"
                                >
                                    Tentar novamente
                                </button>
                            </div>
                        )}

                        {/* Resumo do ano */}
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                                <p className="text-sm font-medium text-gray-500">
                                    Recebido em {ano}
                                </p>
                                <p className="mt-2 text-2xl font-bold text-[#159B78]">
                                    {moeda(resumoAno.total)}
                                </p>
                                <p className="mt-1.5 text-xs text-gray-400">
                                    {resumoAno.quantidade}{" "}
                                    {resumoAno.quantidade === 1
                                        ? "folha paga"
                                        : "folhas pagas"}
                                </p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                                <p className="text-sm font-medium text-gray-500">
                                    Média mensal
                                </p>
                                <p className="mt-2 text-2xl font-bold text-gray-900">
                                    {moeda(resumoAno.media)}
                                </p>
                                <p className="mt-1.5 text-xs text-gray-400">
                                    Considera apenas folhas pagas
                                </p>
                            </div>
                            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                                <p className="text-sm font-medium text-gray-500">
                                    Melhor competência
                                </p>
                                <p className="mt-2 text-2xl font-bold text-gray-900">
                                    {resumoAno.melhor ? moeda(liquido(resumoAno.melhor)) : "—"}
                                </p>
                                <p className="mt-1.5 text-xs text-gray-400">
                                    {resumoAno.melhor
                                        ? nomeCompetencia(resumoAno.melhor.competencia)
                                        : "Sem folhas pagas no ano"}
                                </p>
                            </div>
                        </div>

                        {/* Gráfico */}
                        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                            <div className="mb-5">
                                <h2 className="font-bold text-gray-900">
                                    Evolução do líquido em {ano}
                                </h2>
                                <p className="text-sm text-gray-500">
                                    Valor líquido de cada folha, mês a mês.
                                </p>
                            </div>

                            <div
                                className="flex h-44 items-end gap-2 sm:gap-3"
                                role="img"
                                aria-label={`Gráfico de valor líquido mensal de ${ano}`}
                            >
                                {serieGrafico.valores.map((item) => {
                                    const altura = item.valor
                                        ? Math.max((item.valor / serieGrafico.maximo) * 100, 4)
                                        : 0;
                                    const selecionado = item.chave === competencia;
                                    return (
                                        <div
                                            key={item.chave}
                                            className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                                        >
                                            <div className="flex w-full flex-1 items-end">
                                                <div
                                                    title={`${item.rotulo}: ${moeda(item.valor)}`}
                                                    style={{ height: `${altura}%` }}
                                                    className={`w-full rounded-t-md transition-all ${item.valor
                                                        ? selecionado
                                                            ? "bg-[#107C61]"
                                                            : "bg-[#159B78]/70"
                                                        : "bg-gray-100"
                                                        } ${item.valor ? "" : "h-1"}`}
                                                />
                                            </div>
                                            <span className="text-[11px] text-gray-500">
                                                {item.rotulo}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        {/* Tabela de folhas */}
                        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                            <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-5">
                                <div>
                                    <h2 className="font-bold text-gray-900">
                                        Folhas de pagamento anteriores
                                    </h2>
                                    <p className="text-sm text-gray-500">
                                        Toque em uma competência para ver o detalhamento.
                                    </p>
                                </div>
                                <span className="rounded-lg bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-600">
                                    {folhasOrdenadas.length} folhas
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-xs text-gray-500">
                                        <tr>
                                            <th className="px-5 py-4 font-semibold">Competência</th>
                                            <th className="px-5 py-4 font-semibold">Status</th>
                                            <th className="px-5 py-4 font-semibold">Pagamento</th>
                                            <th className="px-5 py-4 text-right font-semibold">
                                                Líquido
                                            </th>
                                            <th className="px-5 py-4 text-right font-semibold print:hidden">
                                                Ações
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {carregandoFolhas && (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-5 py-10 text-center text-gray-400"
                                                >
                                                    <RefreshCw
                                                        size={20}
                                                        className="mx-auto animate-spin text-[#159B78]"
                                                    />
                                                </td>
                                            </tr>
                                        )}

                                        {!carregandoFolhas &&
                                            folhasOrdenadas.map((folha) => {
                                                const aberta = expandida === folha.id;
                                                const st = STATUS_FOLHA[folha.status];
                                                return (
                                                    <Fragment key={folha.id}>
                                                        <tr
                                                            className={`hover:bg-gray-50 ${aberta ? "bg-gray-50" : ""
                                                                }`}
                                                        >
                                                            <td className="whitespace-nowrap px-5 py-4">
                                                                <button
                                                                    onClick={() =>
                                                                        setExpandida(aberta ? null : folha.id)
                                                                    }
                                                                    aria-expanded={aberta}
                                                                    className="flex cursor-pointer items-center gap-2 font-semibold text-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#159B78]"
                                                                >
                                                                    <ChevronDown
                                                                        size={16}
                                                                        className={`text-gray-400 transition-transform ${aberta ? "rotate-180" : ""
                                                                            }`}
                                                                    />
                                                                    {nomeCompetencia(folha.competencia)}
                                                                </button>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span
                                                                    className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset ${st.classe}`}
                                                                >
                                                                    {st.rotulo}
                                                                </span>
                                                            </td>
                                                            <td className="whitespace-nowrap px-5 py-4 text-gray-500">
                                                                {formatarData(folha.dataPagamento)}
                                                            </td>
                                                            <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-gray-800">
                                                                {moeda(liquido(folha))}
                                                            </td>
                                                            <td className="whitespace-nowrap px-5 py-4 text-right print:hidden">
                                                                <a
                                                                    href={`/api/colaborador/folhas/${folha.id}/holerite`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition-colors hover:border-[#159B78] hover:text-[#159B78]"
                                                                >
                                                                    <Download size={14} />
                                                                    Holerite
                                                                </a>
                                                            </td>
                                                        </tr>

                                                        {aberta && (
                                                            <tr className="bg-gray-50">
                                                                <td colSpan={5} className="px-5 pb-5 pt-1">
                                                                    <dl className="grid grid-cols-2 gap-4 rounded-xl border border-gray-100 bg-white p-4 text-sm lg:grid-cols-5">
                                                                        <div>
                                                                            <dt className="text-xs text-gray-500">
                                                                                Salário base
                                                                            </dt>
                                                                            <dd className="font-semibold text-gray-800">
                                                                                {moeda(folha.salarioBase)}
                                                                            </dd>
                                                                        </div>
                                                                        <div>
                                                                            <dt className="text-xs text-gray-500">
                                                                                Comissões
                                                                            </dt>
                                                                            <dd className="font-semibold text-gray-800">
                                                                                {moeda(folha.comissoes)}
                                                                            </dd>
                                                                        </div>
                                                                        <div>
                                                                            <dt className="text-xs text-gray-500">
                                                                                Bonificações
                                                                            </dt>
                                                                            <dd className="font-semibold text-gray-800">
                                                                                {moeda(folha.bonificacoes)}
                                                                            </dd>
                                                                        </div>
                                                                        <div>
                                                                            <dt className="text-xs text-gray-500">
                                                                                Descontos
                                                                            </dt>
                                                                            <dd className="font-semibold text-red-600">
                                                                                {folha.descontos > 0 ? "− " : ""}
                                                                                {moeda(folha.descontos)}
                                                                            </dd>
                                                                        </div>
                                                                        <div>
                                                                            <dt className="text-xs text-gray-500">
                                                                                Atendimentos
                                                                            </dt>
                                                                            <dd className="font-semibold text-gray-800">
                                                                                {folha.totalAtendimentos ?? "—"}
                                                                            </dd>
                                                                        </div>
                                                                    </dl>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </Fragment>
                                                );
                                            })}

                                        {!carregandoFolhas && !folhasOrdenadas.length && (
                                            <tr>
                                                <td
                                                    colSpan={5}
                                                    className="px-5 py-10 text-center text-gray-400"
                                                >
                                                    Nenhuma folha de pagamento encontrada em {ano}.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}

                <footer className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-500">
                    <CalendarDays size={17} />
                    Relatório referente a {nomeCompetencia(competencia)}. Valores
                    sujeitos a conferência no fechamento da folha.
                </footer>
            </div>

            {modalBeneficios && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 print:hidden">
                    <div className="w-full max-w-6xl rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b p-5">
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">Meus benefícios</h2>
                                <p className="text-sm text-gray-500">
                                    Gerencie seus benefícios disponíveis.
                                </p>
                            </div>
                            <button
                                onClick={() => setModalBeneficios(false)}
                                aria-label="Fechar"
                                className="cursor-pointer text-xl text-gray-400 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="max-h-[65vh] space-y-3 overflow-y-auto p-5">
                            {loadingBeneficios ? (
                                <p className="py-8 text-center text-gray-500">
                                    Carregando benefícios...
                                </p>
                            ) : erroBeneficios ? (
                                <p className="py-8 text-center text-red-600">{erroBeneficios}</p>
                            ) : beneficios.length === 0 ? (
                                <p className="py-8 text-center text-gray-500">
                                    Nenhum benefício cadastrado.
                                </p>
                            ) : (
                                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                                    {beneficios.map((beneficio) => (
                                        <div
                                            key={beneficio.id}
                                            className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                                        >
                                            {/* Imagem */}
                                            <div className="relative flex h-48 items-center justify-center overflow-hidden bg-gray-50">
                                                <Image
                                                    src={beneficio.imagem || "/images/beneficio-placeholder.png"}
                                                    width={250}
                                                    height={300}
                                                    alt={beneficio.titulo}
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                                <span
                                                    className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${Number(beneficio.ativo) === 1
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-gray-200 text-gray-600"
                                                        }`}
                                                >
                                                    {Number(beneficio.ativo) === 1 ? "Ativo" : "Inativo"}
                                                </span>
                                            </div>
                                            <div className="flex min-h-[190px] flex-col p-5">
                                                <h3 className="text-lg font-bold text-gray-900">
                                                    {beneficio.titulo}
                                                </h3>
                                                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-gray-500">
                                                    {beneficio.descricao}
                                                </p>

                                                {beneficio.valor !== undefined && (
                                                    <p className="mt-3 text-lg font-bold text-[#159B78]">
                                                        {moeda(Number(beneficio.valor))}
                                                        <span className="ml-1 text-xs font-normal text-gray-400">
                                                            / mês
                                                        </span>
                                                    </p>
                                                )}

                                                {/* Botão */}
                                                <button
                                                    type="button"
                                                    onClick={() => alterarBeneficio(beneficio)}
                                                    className={`mt-auto w-full cursor-pointer rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${Number(beneficio.ativo) === 1
                                                        ? "bg-red-500 hover:bg-red-600"
                                                        : "bg-[#159B78] hover:bg-[#117c61]"
                                                        }`}
                                                >
                                                    {Number(beneficio.ativo) === 1
                                                        ? "Desativar benefício"
                                                        : "Ativar benefício"}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end border-t p-4">
                            <button
                                onClick={() => setModalBeneficios(false)}
                                className="cursor-pointer rounded-lg bg-gray-100 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}