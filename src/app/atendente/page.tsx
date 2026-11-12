"use client";
import {
    Headset,
    MessageCircle,
    Clock,
    CheckCircle2,
    RefreshCw,
    Send,
    User,
    Car,
    Paperclip,
    ChevronRight,
    CircleAlert,
    IdCard,
    Check,
    X,
    Eye,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface Atendente {
    id: number;
    first_name: string;
    last_name: string;
    full_name?: string;
    email: string;
}

interface Chamado {
    id: number;
    solicitante_nome: string;
    solicitante_tipo: "passageiro" | "motorista";
    assunto: string;
    canal: "chat" | "whatsapp" | "telefone" | "email";
    prioridade: "baixa" | "media" | "alta" | "urgente";
    status: "aberto" | "em_atendimento" | "resolvido";
    ultima_mensagem: string;
    atualizado_em: string;
    aberto_em: string;
}

interface Mensagem {
    id: number;
    chamado_id: number;
    autor: "atendente" | "usuario";
    texto: string;
    criado_em: string;
}

interface CadastroMotorista {
    id: number;
    nome: string;
    cpf: string;
    cnh: string;
    placa: string;
    veiculo: string;
    telefone: string;
    documentos_url?: string;
    status: "pendente" | "aprovado" | "reprovado";
    criado_em: string;
    observacao?: string | null;
}

export default function Page() {
    const [agora, setAgora] = useState(new Date());
    const [atendente, setAtendente] = useState<Atendente | null>(null);
    const [loadingAtendente, setLoadingAtendente] = useState(true);

    const [chamados, setChamados] = useState<Chamado[]>([]);
    const [loadingChamados, setLoadingChamados] = useState(true);
    const [filtroStatus, setFiltroStatus] = useState<
        "todos" | "aberto" | "em_atendimento" | "resolvido"
    >("todos");
    const [filtroTipo, setFiltroTipo] = useState<
        "todos" | "passageiro" | "motorista"
    >("todos");

    const [chamadoSelecionado, setChamadoSelecionado] = useState<Chamado | null>(
        null
    );
    const [mensagens, setMensagens] = useState<Mensagem[]>([]);
    const [loadingMensagens, setLoadingMensagens] = useState(false);
    const [resposta, setResposta] = useState("");
    const [enviando, setEnviando] = useState(false);
    const mensagensRef = useRef<HTMLDivElement>(null);

    const [mensagemAlerta, setMensagemAlerta] = useState("");
    const [tipoAlerta, setTipoAlerta] = useState<"success" | "danger" | "">("");

    const [cadastrosMotoristas, setCadastrosMotoristas] = useState<
        CadastroMotorista[]
    >([]);
    const [loadingCadastros, setLoadingCadastros] = useState(true);
    const [modalRejeicaoCadastro, setModalRejeicaoCadastro] = useState(false);
    const [cadastroSelecionado, setCadastroSelecionado] = useState<
        number | null
    >(null);
    const [observacaoCadastro, setObservacaoCadastro] = useState("");

    const router = useRouter();

    async function carregarAtendente() {
        try {
            setLoadingAtendente(true);
            const res = await fetch("/api/me", { cache: "no-store" });
            if (!res.ok) throw new Error("Erro ao carregar atendente.");
            const data = await res.json();
            // /api/me devolve { user: {...} }
            setAtendente(data?.user ?? data?.usuario ?? data);
        } catch (error) {
            console.error(error);
            setAtendente(null);
        } finally {
            setLoadingAtendente(false);
        }
    }

    async function carregarChamados() {
        try {
            setLoadingChamados(true);
            const res = await fetch("/api/atendente/chamados", {
                cache: "no-store",
            });
            if (!res.ok) throw new Error("Erro ao buscar chamados.");
            const data = await res.json();
            setChamados(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setChamados([]);
        } finally {
            setLoadingChamados(false);
        }
    }

    async function carregarCadastrosMotoristas() {
        try {
            setLoadingCadastros(true);
            const res = await fetch("/api/atendente/motoristas/pendentes", {
                cache: "no-store",
            });
            if (!res.ok) throw new Error("Erro ao buscar cadastros.");
            const data = await res.json();
            setCadastrosMotoristas(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setCadastrosMotoristas([]);
        } finally {
            setLoadingCadastros(false);
        }
    }

    async function atualizarTudo() {
        await Promise.all([
            carregarAtendente(),
            carregarChamados(),
            carregarCadastrosMotoristas(),
        ]);
    }

    useEffect(() => {
        atualizarTudo();
        const interval = setInterval(() => setAgora(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        mensagensRef.current?.scrollTo({
            top: mensagensRef.current.scrollHeight,
            behavior: "smooth",
        });
    }, [mensagens]);

    async function abrirChamado(chamado: Chamado) {
        setChamadoSelecionado(chamado);
        setMensagens([]);
        try {
            setLoadingMensagens(true);
            const res = await fetch(
                `/api/atendente/chamados/${chamado.id}/mensagens`,
                { cache: "no-store" }
            );
            if (!res.ok) throw new Error("Erro ao carregar mensagens.");
            const data = await res.json();
            setMensagens(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setMensagens([]);
        } finally {
            setLoadingMensagens(false);
        }

        if (chamado.status === "aberto") {
            try {
                await fetch(`/api/atendente/chamados/${chamado.id}/assumir`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ atendidoPor: atendente?.id }),
                });
                await carregarChamados();
            } catch (error) {
                console.error(error);
            }
        }
    }

    async function enviarResposta() {
        if (!chamadoSelecionado || !resposta.trim()) return;
        const texto = resposta.trim();
        setResposta("");
        setEnviando(true);

        const otimista: Mensagem = {
            id: Date.now(),
            chamado_id: chamadoSelecionado.id,
            autor: "atendente",
            texto,
            criado_em: new Date().toISOString(),
        };
        setMensagens((prev) => [...prev, otimista]);

        try {
            const res = await fetch(
                `/api/atendente/chamados/${chamadoSelecionado.id}/mensagens`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        autor: "atendente",
                        texto,
                        atendenteId: atendente?.id,
                    }),
                }
            );
            if (!res.ok) throw new Error("Erro ao enviar resposta.");
            await carregarChamados();
        } catch (error) {
            console.error(error);
            setTipoAlerta("danger");
            setMensagemAlerta("Não foi possível enviar a mensagem.");
            setTimeout(() => {
                setMensagemAlerta("");
                setTipoAlerta("");
            }, 3000);
        } finally {
            setEnviando(false);
        }
    }

    async function resolverChamado() {
        if (!chamadoSelecionado) return;
        try {
            const res = await fetch(
                `/api/atendente/chamados/${chamadoSelecionado.id}/resolver`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ atendidoPor: atendente?.id }),
                }
            );
            if (!res.ok) throw new Error("Erro ao resolver chamado.");
            setTipoAlerta("success");
            setMensagemAlerta("Chamado marcado como resolvido.");
            setChamadoSelecionado((prev) =>
                prev ? { ...prev, status: "resolvido" } : prev
            );
            await carregarChamados();
            setTimeout(() => {
                setMensagemAlerta("");
                setTipoAlerta("");
            }, 3000);
        } catch (error) {
            console.error(error);
            setTipoAlerta("danger");
            setMensagemAlerta("Não foi possível resolver o chamado.");
        }
    }

    async function aprovarCadastro(id: number) {
        try {
            const res = await fetch(
                `/api/atendente/motoristas/${id}/aprovar`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        aprovadoPor: atendente?.id,
                    }),
                }
            );
            if (!res.ok) throw new Error("Erro ao aprovar cadastro.");
            setTipoAlerta("success");
            setMensagemAlerta("Cadastro de motorista aprovado com sucesso.");
            await carregarCadastrosMotoristas();
            setTimeout(() => {
                setMensagemAlerta("");
                setTipoAlerta("");
            }, 3000);
        } catch (error) {
            console.error(error);
            setTipoAlerta("danger");
            setMensagemAlerta("Não foi possível aprovar o cadastro.");
        }
    }

    async function rejeitarCadastro(id: number) {
        try {
            const res = await fetch(
                `/api/atendente/motoristas/${id}/reprovar`,
                {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        reprovadoPor: atendente?.id,
                        observacao: observacaoCadastro,
                    }),
                }
            );
            if (!res.ok) throw new Error("Erro ao rejeitar cadastro.");
            setTipoAlerta("danger");
            setMensagemAlerta("Cadastro de motorista reprovado.");
            await carregarCadastrosMotoristas();
            setModalRejeicaoCadastro(false);
            setCadastroSelecionado(null);
            setObservacaoCadastro("");
            setTimeout(() => {
                setMensagemAlerta("");
                setTipoAlerta("");
            }, 3000);
        } catch (error) {
            console.error(error);
            setTipoAlerta("danger");
            setMensagemAlerta("Não foi possível reprovar o cadastro.");
        }
    }

    const hora = agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    const nomeAtendente =
        atendente?.full_name ||
        `${atendente?.first_name || ""} ${atendente?.last_name || ""}`.trim() ||
        "Atendente";

    const chamadosAbertos = chamados.filter((c) => c.status === "aberto");
    const chamadosEmAtendimento = chamados.filter(
        (c) => c.status === "em_atendimento"
    );
    const chamadosResolvidosHoje = chamados.filter((c) => {
        if (c.status !== "resolvido") return false;
        const d = new Date(c.atualizado_em);
        return d.toDateString() === agora.toDateString();
    });

    const chamadosFiltrados = chamados.filter((c) => {
        const okStatus = filtroStatus === "todos" || c.status === filtroStatus;
        const okTipo =
            filtroTipo === "todos" || c.solicitante_tipo === filtroTipo;
        return okStatus && okTipo;
    });

    const prioridadeCor: Record<Chamado["prioridade"], string> = {
        baixa: "bg-slate-100 text-slate-600",
        media: "bg-blue-100 text-blue-700",
        alta: "bg-amber-100 text-amber-700",
        urgente: "bg-red-100 text-red-700",
    };

    const statusCor: Record<Chamado["status"], string> = {
        aberto: "bg-amber-100 text-amber-700",
        em_atendimento: "bg-blue-100 text-blue-700",
        resolvido: "bg-emerald-100 text-emerald-700",
    };

    const statusLabel: Record<Chamado["status"], string> = {
        aberto: "Aberto",
        em_atendimento: "Em atendimento",
        resolvido: "Resolvido",
    };

    return (
        <main className="min-h-screen">
            <header className="mb-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white sm:text-3xl">
                            {agora.getHours() < 12
                                ? `Bom Dia, ${nomeAtendente}!`
                                : agora.getHours() < 18
                                    ? `Boa Tarde, ${nomeAtendente}!`
                                    : `Boa Noite, ${nomeAtendente}!`}
                        </h1>

                        <p className="mt-1 text-sm text-white/70">
                            {loadingAtendente
                                ? "Carregando atendente..."
                                : "Central de atendimento a passageiros e motoristas."}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={atualizarTudo}
                            className="flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-[#00a99d] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00958b]"
                        >
                            <RefreshCw size={17} />
                            Atualizar
                        </button>
                    </div>
                </div>
            </header>

            {mensagemAlerta && (
                <div
                    className={`mb-5 rounded-lg border px-4 py-3 text-sm font-medium ${tipoAlerta === "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-red-200 bg-red-50 text-red-700"
                        }`}
                >
                    {mensagemAlerta}
                </div>
            )}

            <section className="mb-6">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-white">
                        Resumo dos atendimentos
                    </h2>

                    <p className="mt-1 text-sm text-white/60">
                        Acompanhe os principais indicadores da central de atendimento.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-xl bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Chamados abertos
                                </p>

                                <h3 className="mt-2 text-3xl font-bold text-slate-800">
                                    {String(chamadosAbertos.length).padStart(2, "0")}
                                </h3>

                                <p className="mt-1 text-xs text-amber-600">
                                    Aguardando atendimento
                                </p>
                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                                <CircleAlert size={23} className="text-amber-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Em atendimento
                                </p>

                                <h3 className="mt-2 text-3xl font-bold text-slate-800">
                                    {String(chamadosEmAtendimento.length).padStart(2, "0")}
                                </h3>

                                <p className="mt-1 text-xs text-blue-600">
                                    Atendimentos em andamento
                                </p>
                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                                <Headset size={23} className="text-blue-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Resolvidos hoje
                                </p>

                                <h3 className="mt-2 text-3xl font-bold text-slate-800">
                                    {String(chamadosResolvidosHoje.length).padStart(2, "0")}
                                </h3>

                                <p className="mt-1 text-xs text-emerald-600">
                                    Atendimentos concluídos
                                </p>
                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                                <CheckCircle2 size={23} className="text-emerald-600" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-slate-500">
                                    Indicadores do dia
                                </p>

                                <h3 className="mt-2 text-3xl font-bold text-slate-800">
                                    {String(
                                        chamadosAbertos.length +
                                        chamadosEmAtendimento.length +
                                        chamadosResolvidosHoje.length
                                    ).padStart(2, "0")}
                                </h3>

                                <p className="mt-1 text-xs text-purple-600">
                                    Total de movimentações
                                </p>
                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                                <Clock size={23} className="text-purple-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-5">
                <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100">
                                <IdCard size={21} className="text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    Aprovação de Cadastro de Motoristas
                                </h2>
                                <p className="text-sm text-slate-500">
                                    Novos motoristas aguardando validação de
                                    documentos.
                                </p>
                            </div>
                        </div>

                        <span className="w-fit rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                            {cadastrosMotoristas.length} pendentes
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px]">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-700">
                                        ID
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-700">
                                        Nome
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-700">
                                        CNH
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-700">
                                        Veículo / Placa
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-700">
                                        Enviado em
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-700">
                                        Ações
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loadingCadastros ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-12 text-center text-sm text-slate-500"
                                        >
                                            Carregando...
                                        </td>
                                    </tr>
                                ) : cadastrosMotoristas.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="m-5 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-center text-sm font-medium text-red-600">
                                                Nenhum cadastro pendente de
                                                aprovação.
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    cadastrosMotoristas.map((cadastro) => (
                                        <tr
                                            key={cadastro.id}
                                            className="border-t border-slate-100 transition hover:bg-slate-50"
                                        >
                                            <td className="px-4 py-4 text-center text-sm font-semibold text-slate-700">
                                                {cadastro.id}
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                                                        {cadastro.nome
                                                            ?.charAt(0)
                                                            .toUpperCase()}
                                                    </div>
                                                    <span className="text-sm font-semibold text-slate-800">
                                                        {cadastro.nome}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-4 py-4 text-sm text-slate-600">
                                                {cadastro.cnh}
                                            </td>

                                            <td className="px-4 py-4 text-sm text-slate-600">
                                                {cadastro.veiculo} —{" "}
                                                <span className="font-semibold text-slate-700">
                                                    {cadastro.placa}
                                                </span>
                                            </td>

                                            <td className="px-4 py-4 text-center text-sm text-slate-600">
                                                {new Date(
                                                    cadastro.criado_em
                                                ).toLocaleDateString("pt-BR")}
                                            </td>

                                            <td className="px-4 py-4">
                                                <div className="flex justify-center gap-2">
                                                    {cadastro.documentos_url && (
                                                        <a
                                                            href={
                                                                cadastro.documentos_url
                                                            }
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            title="Ver documentos"
                                                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                                                        >
                                                            <Eye size={17} />
                                                        </a>
                                                    )}

                                                    <button
                                                        onClick={() =>
                                                            aprovarCadastro(
                                                                cadastro.id
                                                            )
                                                        }
                                                        title="Aprovar"
                                                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-emerald-500 text-white transition hover:bg-emerald-600"
                                                    >
                                                        <Check size={17} />
                                                    </button>

                                                    <button
                                                        onClick={() => {
                                                            setCadastroSelecionado(
                                                                cadastro.id
                                                            );
                                                            setObservacaoCadastro(
                                                                ""
                                                            );
                                                            setModalRejeicaoCadastro(
                                                                true
                                                            );
                                                        }}
                                                        title="Reprovar"
                                                        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-red-500 text-white transition hover:bg-red-600"
                                                    >
                                                        <X size={17} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
            <p className="mt-5 text-right text-xs text-white/50">
                Atualizado em <strong className="text-white/70">{hora}</strong>
            </p>

            {modalRejeicaoCadastro && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/65 p-3 backdrop-blur-md sm:p-6"
                    onClick={() => {
                        setModalRejeicaoCadastro(false);
                        setCadastroSelecionado(null);
                        setObservacaoCadastro("");
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="rejeicao-titulo"
                        className="w-full max-w-lg overflow-hidden rounded-2xl border border-white/20 bg-white shadow-2xl shadow-slate-950/30"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* CABEÇALHO */}
                        <div className="border-b border-red-100 bg-gradient-to-r from-red-600 to-rose-500 px-6 py-6 text-white">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/20 bg-white/15">
                                        <CircleAlert size={25} />
                                    </div>

                                    <div>
                                        <p className="text-xs font-semibold uppercase tracking-wider text-white/75">
                                            Análise cadastral
                                        </p>

                                        <h2
                                            id="rejeicao-titulo"
                                            className="mt-1 text-lg font-bold sm:text-xl"
                                        >
                                            Reprovar cadastro
                                        </h2>

                                        <p className="mt-1 text-sm text-white/80">
                                            Motorista #{cadastroSelecionado}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => {
                                        setModalRejeicaoCadastro(false);
                                        setCadastroSelecionado(null);
                                        setObservacaoCadastro("");
                                    }}
                                    aria-label="Fechar modal"
                                    className="rounded-xl border border-white/20 bg-white/10 p-2 transition hover:bg-white/20"
                                >
                                    <X size={19} />
                                </button>
                            </div>
                        </div>

                        {/* CONTEÚDO */}
                        <div className="p-6">
                            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                                <div className="flex items-start gap-3">
                                    <CircleAlert
                                        size={20}
                                        className="mt-0.5 shrink-0 text-amber-600"
                                    />

                                    <div>
                                        <p className="text-sm font-bold text-amber-800">
                                            Atenção: ação de reprovação
                                        </p>

                                        <p className="mt-1 text-xs leading-relaxed text-amber-700">
                                            Informe claramente o motivo da reprovação para
                                            que a pendência possa ser compreendida e corrigida.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5">
                                <label
                                    htmlFor="observacao-reprovacao"
                                    className="mb-2 block text-sm font-bold text-slate-800"
                                >
                                    Motivo da reprovação
                                    <span className="ml-1 text-red-500">*</span>
                                </label>

                                <textarea
                                    id="observacao-reprovacao"
                                    rows={5}
                                    maxLength={1000}
                                    required
                                    value={observacaoCadastro}
                                    onChange={(e) =>
                                        setObservacaoCadastro(e.target.value)
                                    }
                                    placeholder="Descreva o motivo. Ex.: CNH vencida, documento ilegível ou informações divergentes..."
                                    className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#00a99d] focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                                />

                                <div className="mt-2 flex items-center justify-between">
                                    <p className="text-xs text-slate-400">
                                        A observação será registrada no cadastro.
                                    </p>

                                    <span className="text-xs font-medium text-slate-400">
                                        {observacaoCadastro.length}/1000
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                onClick={() => {
                                    setModalRejeicaoCadastro(false);
                                    setCadastroSelecionado(null);
                                    setObservacaoCadastro("");
                                }}
                                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
                            >
                                Cancelar
                            </button>

                            <button
                                type="button"
                                disabled={
                                    !observacaoCadastro.trim() ||
                                    enviando
                                }
                                onClick={() => {
                                    if (cadastroSelecionado !== null) {
                                        rejeitarCadastro(cadastroSelecionado);
                                    }
                                }}
                                className="flex items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <X size={17} />
                                Confirmar reprovação
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}