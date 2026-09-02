"use client";

import {
    Users,
    Car,
    WalletMinimal,
    Check,
    X,
    RefreshCw,
    Eye,
    BriefcaseBusiness,
    FileText,
} from "lucide-react";
import { useEffect, useState } from "react";

interface Campanha {
    id: number;
    titulo: string;
    descricao: string;
    responsavel: string;
    canal: string;
    orcamento: number;
    data_inicio: string;
    data_fim: string;
    status: "PENDENTE" | "APROVADA" | "REJEITADA";
    observacao_diretor: string | null;
}

interface Usuario {
    id: number;
    first_name: string;
    last_name: string;
    full_name?: string;
    email: string;
    phone: string;
    user_type: string;
    created_at: string;
}

interface Candidato {
    id: number;
    first_name: string;
    last_name: string;
    vaga: string;
    etapa: string;
    status: string;
    created_at: string;
}

export default function Page() {
    const [agora, setAgora] = useState(new Date());
    const [campanhas, setCampanhas] = useState<Campanha[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [candidatos, setCandidatos] = useState<Candidato[]>([]);
    const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
    const [loadingUsuarioLogado, setLoadingUsuarioLogado] = useState(true);
    const [loading, setLoading] = useState(true);
    const [loadingUsuarios, setLoadingUsuarios] = useState(true);
    const [loadingCandidatos, setLoadingCandidatos] = useState(true);
    const [faturamentoDia, setFaturamentoDia] = useState(0);
    const [corridasDia, setCorridasDia] = useState(0);
    const [totalAssinantes, setTotalAssinantes] = useState(0);
    const [observacao, setObservacao] = useState("");
    const [campanhaSelecionada, setCampanhaSelecionada] = useState<number | null>(null);
    const [modalRejeicao, setModalRejeicao] = useState(false);
    const [mensagem, setMensagem] = useState("");
    const [tipoMensagem, setTipoMensagem] = useState<"success" | "danger" | "">("");
    const [paginaUsuarios, setPaginaUsuarios] = useState(1);
    const [paginaCampanhas, setPaginaCampanhas] = useState(1);

    const registrosPorPaginaUsuarios = 5;
    const registrosPorPaginaCampanhas = 4;

    const ultimoUsuario = paginaUsuarios * registrosPorPaginaUsuarios;
    const primeiroUsuario = ultimoUsuario - registrosPorPaginaUsuarios;
    const usuariosPaginados = usuarios.slice(primeiroUsuario, ultimoUsuario);
    const totalPaginasUsuarios = Math.ceil(usuarios.length / registrosPorPaginaUsuarios);

    const campanhasPendentes = campanhas.filter(
        (campanha) => campanha.status === "PENDENTE"
    );

    const ultimoRegistro = paginaCampanhas * registrosPorPaginaCampanhas;
    const primeiroRegistro = ultimoRegistro - registrosPorPaginaCampanhas;
    const campanhasPaginadas = campanhasPendentes.slice(
        primeiroRegistro,
        ultimoRegistro
    );
    const totalPaginasCampanhas = Math.ceil(
        campanhasPendentes.length / registrosPorPaginaCampanhas
    );

    async function carregarUsuarioLogado() {
        try {
            setLoadingUsuarioLogado(true);
            const res = await fetch("/api/me", {
                method: "GET",
                cache: "no-store",
            });

            if (!res.ok) {
                throw new Error("Erro ao carregar usuário logado.");
            }

            const data = await res.json();
            setUsuarioLogado(data);
        } catch (error) {
            console.error("Erro ao carregar usuário logado:", error);
            setUsuarioLogado(null);
        } finally {
            setLoadingUsuarioLogado(false);
        }
    }

    async function carregarCampanhas() {
        try {
            setLoading(true);
            const res = await fetch("/api/marketing/campaigns", {
                cache: "no-store",
            });

            if (!res.ok) {
                throw new Error("Erro ao buscar campanhas.");
            }

            const data = await res.json();
            setCampanhas(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setCampanhas([]);
        } finally {
            setLoading(false);
        }
    }

    async function carregarFaturamentoDia() {
        try {
            const res = await fetch("/api/faturamento-dia", {
                cache: "no-store",
            });

            if (!res.ok) {
                setFaturamentoDia(0);
                return;
            }

            const data = await res.json();
            setFaturamentoDia(Number(data.total) || 0);
        } catch (error) {
            console.error(error);
            setFaturamentoDia(0);
        }
    }

    async function carregarCorridasDia() {
        try {
            const res = await fetch("/api/corridas-dia", {
                cache: "no-store",
            });

            if (!res.ok) {
                setCorridasDia(0);
                return;
            }

            const data = await res.json();
            setCorridasDia(Number(data.total) || 0);
        } catch (error) {
            console.error(error);
            setCorridasDia(0);
        }
    }

    async function carregarUsuarios() {
        try {
            setLoadingUsuarios(true);
            const res = await fetch("/api/novos-usuarios", {
                cache: "no-store",
            });

            if (!res.ok) {
                throw new Error("Erro ao carregar usuários.");
            }

            const data = await res.json();
            setUsuarios(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setUsuarios([]);
        } finally {
            setLoadingUsuarios(false);
        }
    }

    async function carregarCandidatos() {
        try {
            setLoadingCandidatos(true);
            const res = await fetch("/api/rh", {
                cache: "no-store",
            });

            if (!res.ok) {
                throw new Error("Erro ao carregar candidatos.");
            }

            const data = await res.json();
            setCandidatos(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setCandidatos([]);
        } finally {
            setLoadingCandidatos(false);
        }
    }

    async function carregarAssinantes() {
        try {
            const res = await fetch("/api/beneficios", {
                cache: "no-store",
            });

            if (!res.ok) {
                setTotalAssinantes(0);
                return;
            }

            const data = await res.json();
            setTotalAssinantes(Number(data.total_assinantes) || 0);
        } catch (error) {
            console.error(error);
            setTotalAssinantes(0);
        }
    }

    async function atualizarTudo() {
        await Promise.all([
            carregarUsuarioLogado(),
            carregarUsuarios(),
            carregarCampanhas(),
            carregarFaturamentoDia(),
            carregarCorridasDia(),
            carregarCandidatos(),
            carregarAssinantes(),
        ]);
    }

    useEffect(() => {
        atualizarTudo();

        const interval = setInterval(() => {
            setAgora(new Date());
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const hora = agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    const dataAtual = agora.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    const atualizadoEm = `${hora} ${dataAtual}`;

    const nomeUsuario =
        usuarioLogado?.full_name ||
        `${usuarioLogado?.first_name || ""} ${usuarioLogado?.last_name || ""}`.trim() ||
        "Usuário";

    async function aprovarCampanha(id: number) {
        try {
            const res = await fetch(`/api/marketing/campaigns/${id}/approve`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    aprovadoPor: usuarioLogado?.id || 1,
                    observacao: "Aprovado pelo Diretor Geral.",
                }),
            });

            if (!res.ok) {
                throw new Error("Erro ao aprovar campanha.");
            }

            setTipoMensagem("success");
            setMensagem("Campanha aprovada com sucesso.");
            await carregarCampanhas();

            setTimeout(() => {
                setMensagem("");
                setTipoMensagem("");
            }, 3000);
        } catch (error) {
            console.error(error);
            setTipoMensagem("danger");
            setMensagem("Não foi possível aprovar a campanha.");
        }
    }

    async function rejeitarCampanha(id: number) {
        try {
            const res = await fetch(`/api/marketing/campaigns/${id}/reject`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    aprovadoPor: usuarioLogado?.id || 2,
                    observacao,
                }),
            });

            if (!res.ok) {
                throw new Error("Erro ao rejeitar campanha.");
            }

            setTipoMensagem("danger");
            setMensagem("Campanha rejeitada com sucesso.");
            await carregarCampanhas();
            setModalRejeicao(false);
            setCampanhaSelecionada(null);
            setObservacao("");

            setTimeout(() => {
                setMensagem("");
                setTipoMensagem("");
            }, 3000);
        } catch (error) {
            console.error(error);
            setTipoMensagem("danger");
            setMensagem("Não foi possível rejeitar a campanha.");
        }
    }

    return (
        <main className="min-h-screen">
            <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white sm:text-3xl">
                        {agora.getHours() < 12
                            ? `Bom Dia, ${nomeUsuario}!`
                            : agora.getHours() < 18
                                ? `Boa Tarde, ${nomeUsuario}!`
                                : `Boa Noite, ${nomeUsuario}!`}
                    </h1>
                    <p className="mt-0 text-sm text-white/70">
                        {loadingUsuarioLogado
                            ? "Carregando usuário..."
                            : "Bem-vindo ao painel administrativo."}
                    </p>
                </div>

                <button
                    onClick={atualizarTudo}
                    className="flex cursor-pointer w-fit items-center gap-2 rounded-xl bg-[#00a99d] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00958b]"
                >
                    <RefreshCw size={17} />
                    Atualizar
                </button>
            </header>

            <section className="mb-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-xl bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Faturamento do Dia
                                </p>
                                <h2 className="mt-2 text-2xl font-bold text-slate-800">
                                    {faturamentoDia
                                        ? faturamentoDia.toLocaleString("pt-BR", {
                                              style: "currency",
                                              currency: "BRL",
                                          })
                                        : "R$ 0,00"}
                                </h2>
                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                                <WalletMinimal
                                    size={23}
                                    className="text-emerald-600"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Total de Corridas
                                </p>
                                <h2 className="mt-2 text-2xl font-bold text-slate-800">
                                    {corridasDia >= 1000
                                        ? corridasDia.toLocaleString("pt-BR")
                                        : corridasDia.toString().padStart(3, "0")}
                                    <span className="ml-1 text-sm font-medium text-slate-500">
                                        / Dia
                                    </span>
                                </h2>
                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                                <Car
                                    size={23}
                                    className="text-emerald-600"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-xl bg-white p-5 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-slate-500">
                                    Maylon Pass
                                </p>
                                <h2 className="mt-2 text-2xl font-bold text-slate-800">
                                    {String(totalAssinantes).padStart(3, "0")}
                                    <span className="ml-1 text-sm font-medium text-slate-500">
                                        / Mês
                                    </span>
                                </h2>
                            </div>

                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100">
                                <Users
                                    size={23}
                                    className="text-emerald-600"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <section className="mb-5">
                <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
                                <Users
                                    size={21}
                                    className="text-emerald-600"
                                />
                            </div>

                            <div>
                                <h2 className="text-lg font-bold text-slate-800">
                                    Novos Passageiros e Motoristas
                                </h2>
                                <p className="mt-0.5 text-sm text-slate-500">
                                    Lista dos usuários cadastrados recentemente.
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-slate-500 lg:text-right">
                            Atualizado em{" "}
                            <strong className="text-slate-700">
                                {atualizadoEm}
                            </strong>
                        </p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[850px]">
                            <thead>
                                <tr className="bg-slate-100">
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase text-slate-700">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase text-slate-700">
                                        Nome
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase text-slate-700">
                                        E-mail
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-bold uppercase text-slate-700">
                                        Telefone
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-bold uppercase text-slate-700">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-bold uppercase text-slate-700">
                                        Cadastro
                                    </th>
                                </tr>
                            </thead>

                            <tbody>
                                {loadingUsuarios ? (
                                    <tr>
                                        <td
                                            colSpan={6}
                                            className="py-12 text-center text-sm text-slate-500"
                                        >
                                            Carregando...
                                        </td>
                                    </tr>
                                ) : usuarios.length === 0 ? (
                                    <tr>
                                        <td colSpan={6}>
                                            <div className="m-5 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-center text-sm font-medium text-red-600">
                                                Não há cadastros novos.
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    usuariosPaginados.map((usuario) => (
                                        <tr
                                            key={usuario.id}
                                            className="border-t border-slate-100 transition hover:bg-slate-50"
                                        >
                                            <td className="px-6 py-4 text-sm font-semibold text-slate-700">
                                                {usuario.id}
                                            </td>

                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                                                        {usuario.first_name
                                                            ?.charAt(0)
                                                            .toUpperCase()}
                                                    </div>

                                                    <span className="text-sm font-semibold text-slate-800">
                                                        {usuario.full_name ||
                                                            `${usuario.first_name} ${usuario.last_name}`}
                                                    </span>
                                                </div>
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {usuario.email}
                                            </td>

                                            <td className="px-6 py-4 text-sm text-slate-600">
                                                {usuario.phone?.replace(
                                                    /(\d{2})(\d{5})(\d{4})/,
                                                    "($1) $2-$3"
                                                ) || "—"}
                                            </td>

                                            <td className="px-6 py-4 text-center">
                                                <span
                                                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                        usuario.user_type === "driver"
                                                            ? "bg-blue-100 text-blue-700"
                                                            : "bg-emerald-100 text-emerald-700"
                                                    }`}
                                                >
                                                    {usuario.user_type === "driver"
                                                        ? "Motorista"
                                                        : "Passageiro"}
                                                </span>
                                            </td>

                                            <td className="px-6 py-4 text-center text-sm text-slate-600">
                                                {new Date(
                                                    usuario.created_at
                                                ).toLocaleDateString("pt-BR")}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-4 border-t border-slate-100 px-5 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">
                        <span className="text-xs text-slate-500">
                            Mostrando{" "}
                            <strong>
                                {usuarios.length === 0
                                    ? 0
                                    : primeiroUsuario + 1}
                            </strong>{" "}
                            até{" "}
                            <strong>
                                {Math.min(ultimoUsuario, usuarios.length)}
                            </strong>{" "}
                            de <strong>{usuarios.length}</strong> registros
                        </span>

                        <div className="flex items-center gap-1.5">
                            <button
                                onClick={() =>
                                    setPaginaUsuarios((p) => Math.max(p - 1, 1))
                                }
                                disabled={paginaUsuarios === 1}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Anterior
                            </button>

                            {Array.from(
                                { length: totalPaginasUsuarios },
                                (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() =>
                                            setPaginaUsuarios(i + 1)
                                        }
                                        className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold ${
                                            paginaUsuarios === i + 1
                                                ? "bg-emerald-600 text-white"
                                                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                        }`}
                                    >
                                        {i + 1}
                                    </button>
                                )
                            )}

                            <button
                                onClick={() =>
                                    setPaginaUsuarios((p) =>
                                        Math.min(
                                            p + 1,
                                            totalPaginasUsuarios
                                        )
                                    )
                                }
                                disabled={
                                    paginaUsuarios === totalPaginasUsuarios ||
                                    totalPaginasUsuarios === 0
                                }
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section>
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                        <div className="border-b border-slate-100 p-5 sm:p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100">
                                    <BriefcaseBusiness
                                        size={21}
                                        className="text-emerald-600"
                                    />
                                </div>

                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">
                                        Aprovação de Recursos Humanos
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Candidatos aguardando análise.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                                    {candidatos.length} candidatos
                                </span>

                                <span className="text-xs text-slate-500">
                                    Atualizado em <strong>{hora}</strong>
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-100">
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-700">
                                            ID
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-700">
                                            Nome
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-700">
                                            Vaga
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-700">
                                            Etapa
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-700">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-700">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loadingCandidatos ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="py-12 text-center text-sm text-slate-500"
                                            >
                                                Carregando...
                                            </td>
                                        </tr>
                                    ) : candidatos.length === 0 ? (
                                        <tr>
                                            <td colSpan={6}>
                                                <div className="m-5 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-center text-sm text-red-600">
                                                    Nenhum candidato encontrado.
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        candidatos.map((candidato) => (
                                            <tr
                                                key={candidato.id}
                                                className="border-t border-slate-100 hover:bg-slate-50"
                                            >
                                                <td className="px-4 py-4 text-center text-sm font-semibold text-slate-700">
                                                    {candidato.id}
                                                </td>

                                                <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                                                    {candidato.first_name}{" "}
                                                    {candidato.last_name}
                                                </td>

                                                <td className="px-4 py-4 text-sm text-slate-600">
                                                    {candidato.vaga}
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                            candidato.etapa ===
                                                            "aprovado"
                                                                ? "bg-emerald-100 text-emerald-700"
                                                                : candidato.etapa ===
                                                                    "reprovado"
                                                                  ? "bg-red-100 text-red-700"
                                                                  : candidato.etapa ===
                                                                      "entrevista"
                                                                    ? "bg-purple-100 text-purple-700"
                                                                    : candidato.etapa ===
                                                                        "triagem"
                                                                      ? "bg-yellow-100 text-yellow-700"
                                                                      : "bg-blue-100 text-blue-700"
                                                        }`}
                                                    >
                                                        {candidato.etapa
                                                            ? candidato.etapa
                                                                  .charAt(0)
                                                                  .toUpperCase() +
                                                              candidato.etapa.slice(
                                                                  1
                                                              )
                                                            : "—"}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                                            candidato.status ===
                                                            "active"
                                                                ? "bg-emerald-100 text-emerald-700"
                                                                : candidato.status ===
                                                                    "blocked"
                                                                  ? "bg-red-100 text-red-700"
                                                                  : "bg-yellow-100 text-yellow-700"
                                                        }`}
                                                    >
                                                        {candidato.status ===
                                                        "active"
                                                            ? "Ativo"
                                                            : candidato.status ===
                                                                "blocked"
                                                              ? "Bloqueado"
                                                              : "Inativo"}
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4 text-center">
                                                    <button
                                                        title="Visualizar"
                                                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <div className="border-t border-slate-100 px-5 py-4">
                            <span className="text-xs text-slate-500">
                                Mostrando <strong>{candidatos.length}</strong>{" "}
                                candidatos
                            </span>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                        <div className="border-b border-slate-100 p-5 sm:p-6">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100">
                                    <FileText
                                        size={21}
                                        className="text-blue-600"
                                    />
                                </div>

                                <div>
                                    <h2 className="text-lg font-bold text-slate-800">
                                        Aprovação do Marketing
                                    </h2>
                                    <p className="text-sm text-slate-500">
                                        Campanhas aguardando aprovação.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                                    {campanhasPendentes.length} pendentes
                                </span>

                                <span className="text-xs text-slate-500">
                                    Atualizado em <strong>{hora}</strong>
                                </span>
                            </div>
                        </div>

                        {mensagem && (
                            <div
                                className={`mx-5 mt-5 rounded-lg border px-4 py-3 text-sm font-medium ${
                                    tipoMensagem === "success"
                                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                        : "border-red-200 bg-red-50 text-red-700"
                                }`}
                            >
                                {mensagem}
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px]">
                                <thead>
                                    <tr className="bg-slate-100">
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-700">
                                            ID
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-700">
                                            Campanha
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-bold uppercase text-slate-700">
                                            Responsável
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-700">
                                            Canal
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-700">
                                            Orçamento
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-bold uppercase text-slate-700">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="py-12 text-center text-sm text-slate-500"
                                            >
                                                Carregando...
                                            </td>
                                        </tr>
                                    ) : campanhasPendentes.length === 0 ? (
                                        <tr>
                                            <td colSpan={6}>
                                                <div className="m-5 rounded-lg border border-red-200 bg-red-50 px-5 py-4 text-center text-sm text-red-600">
                                                    Nenhuma campanha pendente para
                                                    aprovação.
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        campanhasPaginadas.map((campanha) => (
                                            <tr
                                                key={campanha.id}
                                                className="border-t border-slate-100 hover:bg-slate-50"
                                            >
                                                <td className="px-4 py-4 text-center text-sm font-semibold text-slate-700">
                                                    {campanha.id}
                                                </td>

                                                <td className="px-4 py-4 text-sm font-semibold text-slate-800">
                                                    {campanha.titulo}
                                                </td>

                                                <td className="px-4 py-4 text-sm text-slate-600">
                                                    {campanha.responsavel}
                                                </td>

                                                <td className="px-4 py-4 text-center text-sm text-slate-600">
                                                    {campanha.canal}
                                                </td>

                                                <td className="px-4 py-4 text-center text-sm font-semibold text-slate-700">
                                                    R${" "}
                                                    {Number(
                                                        campanha.orcamento
                                                    ).toLocaleString("pt-BR", {
                                                        minimumFractionDigits: 2,
                                                    })}
                                                </td>

                                                <td className="px-4 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() =>
                                                                aprovarCampanha(
                                                                    campanha.id
                                                                )
                                                            }
                                                            title="Aprovar"
                                                            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg bg-emerald-500 text-white transition hover:bg-emerald-600"
                                                        >
                                                            <Check size={17} />
                                                        </button>

                                                        <button
                                                            onClick={() => {
                                                                setCampanhaSelecionada(
                                                                    campanha.id
                                                                );
                                                                setObservacao("");
                                                                setModalRejeicao(
                                                                    true
                                                                );
                                                            }}
                                                            title="Rejeitar"
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

                        <div className="flex items-center justify-center border-t border-slate-100 px-5 py-4">
                            <div className="flex items-center gap-1.5">
                                <button
                                    disabled={paginaCampanhas === 1}
                                    onClick={() =>
                                        setPaginaCampanhas((p) =>
                                            Math.max(p - 1, 1)
                                        )
                                    }
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Anterior
                                </button>

                                {Array.from(
                                    { length: totalPaginasCampanhas },
                                    (_, index) => (
                                        <button
                                            key={index}
                                            onClick={() =>
                                                setPaginaCampanhas(index + 1)
                                            }
                                            className={`h-9 min-w-9 rounded-lg px-3 text-sm font-semibold ${
                                                paginaCampanhas === index + 1
                                                    ? "bg-emerald-600 text-white"
                                                    : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                        >
                                            {index + 1}
                                        </button>
                                    )
                                )}

                                <button
                                    disabled={
                                        paginaCampanhas ===
                                            totalPaginasCampanhas ||
                                        totalPaginasCampanhas === 0
                                    }
                                    onClick={() =>
                                        setPaginaCampanhas((p) =>
                                            Math.min(
                                                p + 1,
                                                totalPaginasCampanhas
                                            )
                                        )
                                    }
                                    className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {modalRejeicao && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl">
                        <div className="border-b border-slate-100 px-6 py-5">
                            <h2 className="text-lg font-bold text-slate-800">
                                Rejeitar campanha
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Informe o motivo da rejeição.
                            </p>
                        </div>

                        <div className="p-6">
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Observação
                            </label>

                            <textarea
                                rows={4}
                                value={observacao}
                                onChange={(e) =>
                                    setObservacao(e.target.value)
                                }
                                placeholder="Informe o motivo da rejeição..."
                                className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-100"
                            />

                            <div className="mt-5 flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        setModalRejeicao(false);
                                        setCampanhaSelecionada(null);
                                        setObservacao("");
                                    }}
                                    className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    onClick={() => {
                                        if (campanhaSelecionada !== null) {
                                            rejeitarCampanha(
                                                campanhaSelecionada
                                            );
                                        }
                                    }}
                                    className="cursor-pointer rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600"
                                >
                                    Confirmar rejeição
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}