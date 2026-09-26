"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
    Plus,
    User,
    RefreshCw,
    BriefcaseBusiness,
    FileText,
    Eye,
    Trash2,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

type Usuario = {
    id: number | string;
    matricula: number | string;
    full_name: string;
    email: string;
    phone?: string | null;
    profile_image?: string | null;
    user_type: string;
    status?: "active" | "inactive" | "blocked" | null;
};

type Vaga = {
    id: number | string;
    titulo?: string | null;
    nome?: string | null;
    vaga?: string | null;
    plataforma?: string | null;
    plataformas?: string | null;
    data_inicio?: string | null;
    inicio?: string | null;
    comeco?: string | null;
    data_fim?: string | null;
    encerramento?: string | null;
    status?: string | null;
};

type Candidato = {
    id?: number | string | null;

    // IDENTIFICADOR DO RECRUTAMENTO
    numero_recrutamento?: string | null;

    nome_completo?: string | null;
    nome?: string | null;
    full_name?: string | null;
    candidato?: string | null;

    vaga?: string | null;
    vaga_titulo?: string | null;

    email?: string | null;

    phone?: string | null;
    telefone?: string | null;
    whatsapp?: string | null;

    data?: string | null;
    created_at?: string | null;
    data_candidatura?: string | null;

    status?: string | null;
};

type ApiResponse<T> = {
    usuarios?: T[];
    users?: T[];
    vagas?: T[];
    candidatos?: T[];
    data?: T[];
    message?: string;
};

const REGISTROS_POR_PAGINA = 10;

export default function Page() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loadingUsuarios, setLoadingUsuarios] = useState(true);
    const [erroUsuarios, setErroUsuarios] = useState<string | null>(null);
    const [paginaUsuarios, setPaginaUsuarios] = useState(1);

    const [vagas, setVagas] = useState<Vaga[]>([]);
    const [loadingVagas, setLoadingVagas] = useState(true);
    const [erroVagas, setErroVagas] = useState<string | null>(null);
    const [paginaVagas, setPaginaVagas] = useState(1);

    const [candidatos, setCandidatos] = useState<Candidato[]>([]);
    const [loadingCandidatos, setLoadingCandidatos] = useState(true);
    const [erroCandidatos, setErroCandidatos] = useState<string | null>(null);
    const [paginaCandidatos, setPaginaCandidatos] = useState(1);

    const [atualizadoEm, setAtualizadoEm] = useState("");

    function extrairLista<T>(
        data: ApiResponse<T> | T[] | null,
        chave: "usuarios" | "vagas" | "candidatos"
    ): T[] {
        if (Array.isArray(data)) {
            return data;
        }

        if (!data) {
            return [];
        }

        if (Array.isArray(data[chave])) {
            return data[chave] as T[];
        }

        if (Array.isArray(data.data)) {
            return data.data;
        }

        if (chave === "usuarios" && Array.isArray(data.users)) {
            return data.users;
        }

        return [];
    }

    async function lerJson<T>(
        response: Response
    ): Promise<T | null> {
        const texto = await response.text();

        if (!texto) {
            return null;
        }

        try {
            return JSON.parse(texto) as T;
        } catch {
            console.error(
                "Resposta que não é JSON:",
                texto.substring(0, 500)
            );

            throw new Error(
                response.status === 404
                    ? "A rota da API não foi encontrada."
                    : "A API retornou uma resposta inválida."
            );
        }
    }

    function formatarTelefone(
        telefone?: string | null
    ) {
        if (!telefone) {
            return "—";
        }

        const numeros = telefone.replace(/\D/g, "");

        if (numeros.length === 11) {
            return numeros.replace(
                /(\d{2})(\d{5})(\d{4})/,
                "($1) $2-$3"
            );
        }

        if (numeros.length === 10) {
            return numeros.replace(
                /(\d{2})(\d{4})(\d{4})/,
                "($1) $2-$3"
            );
        }

        return telefone;
    }

    function formatarData(
        data?: string | null
    ) {
        if (!data) {
            return "—";
        }

        const dataObj = new Date(data);

        if (Number.isNaN(dataObj.getTime())) {
            return data;
        }

        return dataObj.toLocaleDateString(
            "pt-BR",
            {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
            }
        );
    }

    function nomeVaga(vaga: Vaga) {
        return (
            vaga.titulo ||
            vaga.nome ||
            vaga.vaga ||
            "Vaga não informada"
        );
    }

    function nomeCandidato(
        candidato: Candidato
    ) {
        return (
            candidato.nome_completo ||
            candidato.nome ||
            candidato.full_name ||
            candidato.candidato ||
            "Candidato não informado"
        );
    }

    function nomeDaVagaDoCandidato(
        candidato: Candidato
    ) {
        return (
            candidato.vaga ||
            candidato.vaga_titulo ||
            "—"
        );
    }

    function statusVaga(
        status?: string | null
    ) {
        const valor = status?.toLowerCase();

        if (
            valor === "aberta" ||
            valor === "open" ||
            valor === "active"
        ) {
            return {
                texto: "Aberta",
                classe:
                    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
            };
        }

        if (
            valor === "encerrada" ||
            valor === "closed" ||
            valor === "inactive"
        ) {
            return {
                texto: "Encerrada",
                classe:
                    "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
            };
        }

        if (
            valor === "pausada" ||
            valor === "paused"
        ) {
            return {
                texto: "Pausada",
                classe:
                    "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
            };
        }

        return {
            texto: status || "Não informado",
            classe:
                "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
        };
    }

    function statusCandidato(
        status?: string | null
    ) {
        const valor = status
            ?.toLowerCase()
            .trim();

        if (
            valor === "aprovado" ||
            valor === "approved" ||
            valor === "contratado" ||
            valor === "hired"
        ) {
            return {
                texto: "Aprovado",
                classe:
                    "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
            };
        }

        if (
            valor === "reprovado" ||
            valor === "rejected"
        ) {
            return {
                texto: "Reprovado",
                classe:
                    "bg-red-50 text-red-700 ring-1 ring-red-200",
            };
        }

        if (
            valor === "entrevista" ||
            valor === "interview"
        ) {
            return {
                texto: "Entrevista",
                classe:
                    "bg-blue-50 text-blue-700 ring-1 ring-blue-200",
            };
        }

        if (
            valor === "analise" ||
            valor === "análise" ||
            valor === "pending" ||
            valor === "pendente"
        ) {
            return {
                texto: "Em análise",
                classe:
                    "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
            };
        }

        return {
            texto: status || "Não informado",
            classe:
                "bg-slate-100 text-slate-600 ring-1 ring-slate-200",
        };
    }

    async function carregarUsuarios() {
        try {
            setLoadingUsuarios(true);
            setErroUsuarios(null);

            const response = await fetch(
                "/api/users",
                {
                    method: "GET",
                    cache: "no-store",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            const data =
                await lerJson<
                    ApiResponse<Usuario> | Usuario[]
                >(response);

            if (!response.ok) {
                const mensagem =
                    data &&
                        !Array.isArray(data) &&
                        data.message
                        ? data.message
                        : `Erro ao carregar usuários. Status: ${response.status}`;

                throw new Error(mensagem);
            }

            setUsuarios(
                extrairLista<Usuario>(
                    data,
                    "usuarios"
                )
            );

            setPaginaUsuarios(1);
        } catch (error) {
            console.error(
                "Erro ao carregar usuários:",
                error
            );

            setUsuarios([]);

            setErroUsuarios(
                error instanceof Error
                    ? error.message
                    : "Erro ao carregar os usuários."
            );
        } finally {
            setLoadingUsuarios(false);
        }
    }

    async function carregarVagas() {
        try {
            setLoadingVagas(true);
            setErroVagas(null);

            const response = await fetch(
                "/api/vagas",
                {
                    method: "GET",
                    cache: "no-store",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            const data =
                await lerJson<
                    ApiResponse<Vaga> | Vaga[]
                >(response);

            if (!response.ok) {
                const mensagem =
                    data &&
                        !Array.isArray(data) &&
                        data.message
                        ? data.message
                        : `Erro ao carregar vagas. Status: ${response.status}`;

                throw new Error(mensagem);
            }

            setVagas(
                extrairLista<Vaga>(
                    data,
                    "vagas"
                )
            );

            setPaginaVagas(1);
        } catch (error) {
            console.error(
                "Erro ao carregar vagas:",
                error
            );

            setVagas([]);

            setErroVagas(
                error instanceof Error
                    ? error.message
                    : "Erro ao carregar as vagas."
            );
        } finally {
            setLoadingVagas(false);
        }
    }

    async function carregarCandidatos() {
        try {
            setLoadingCandidatos(true);
            setErroCandidatos(null);

            const response = await fetch(
                "/api/candidatos",
                {
                    method: "GET",
                    cache: "no-store",
                    headers: {
                        Accept: "application/json",
                    },
                }
            );

            const data =
                await lerJson<
                    ApiResponse<Candidato> | Candidato[]
                >(response);

            if (!response.ok) {
                const mensagem =
                    data &&
                        !Array.isArray(data) &&
                        data.message
                        ? data.message
                        : `Erro ao carregar candidatos. Status: ${response.status}`;

                throw new Error(mensagem);
            }

            const lista =
                extrairLista<Candidato>(
                    data,
                    "candidatos"
                );

            setCandidatos(lista);
            setPaginaCandidatos(1);
        } catch (error) {
            console.error(
                "Erro ao carregar candidatos:",
                error
            );

            setCandidatos([]);

            setErroCandidatos(
                error instanceof Error
                    ? error.message
                    : "Erro ao carregar os candidatos."
            );
        } finally {
            setLoadingCandidatos(false);
        }
    }

    function atualizarData() {
        const agora = new Date();

        setAtualizadoEm(
            `${agora.toLocaleTimeString(
                "pt-BR"
            )} ${agora.toLocaleDateString(
                "pt-BR"
            )}`
        );
    }

    async function atualizarTudo() {
        await Promise.all([
            carregarUsuarios(),
            carregarVagas(),
            carregarCandidatos(),
        ]);

        atualizarData();
    }

    useEffect(() => {
        carregarUsuarios();
        carregarVagas();
        carregarCandidatos();
        atualizarData();
    }, []);

    /* =====================================================
       PAGINAÇÃO - USUÁRIOS
    ===================================================== */

    const totalPaginasUsuarios =
        Math.max(
            1,
            Math.ceil(
                usuarios.length /
                REGISTROS_POR_PAGINA
            )
        );

    const primeiroUsuario =
        (paginaUsuarios - 1) *
        REGISTROS_POR_PAGINA;

    const ultimoUsuario =
        primeiroUsuario +
        REGISTROS_POR_PAGINA;

    const usuariosPaginados =
        useMemo(
            () =>
                usuarios.slice(
                    primeiroUsuario,
                    ultimoUsuario
                ),
            [
                usuarios,
                primeiroUsuario,
                ultimoUsuario,
            ]
        );

    /* =====================================================
       PAGINAÇÃO - VAGAS
    ===================================================== */

    const totalPaginasVagas =
        Math.max(
            1,
            Math.ceil(
                vagas.length /
                REGISTROS_POR_PAGINA
            )
        );

    const primeiroVaga =
        (paginaVagas - 1) *
        REGISTROS_POR_PAGINA;

    const ultimoVaga =
        primeiroVaga +
        REGISTROS_POR_PAGINA;

    const vagasPaginadas =
        useMemo(
            () =>
                vagas.slice(
                    primeiroVaga,
                    ultimoVaga
                ),
            [
                vagas,
                primeiroVaga,
                ultimoVaga,
            ]
        );

    /* =====================================================
       PAGINAÇÃO - CANDIDATOS
    ===================================================== */

    const totalPaginasCandidatos =
        Math.max(
            1,
            Math.ceil(
                candidatos.length /
                REGISTROS_POR_PAGINA
            )
        );

    const primeiroCandidato =
        (paginaCandidatos - 1) *
        REGISTROS_POR_PAGINA;

    const ultimoCandidato =
        primeiroCandidato +
        REGISTROS_POR_PAGINA;

    const candidatosPaginados =
        useMemo(
            () =>
                candidatos.slice(
                    primeiroCandidato,
                    ultimoCandidato
                ),
            [
                candidatos,
                primeiroCandidato,
                ultimoCandidato,
            ]
        );

    function irParaPagina(
        pagina: number,
        totalPaginas: number,
        setPagina: (
            pagina: number
        ) => void
    ) {
        if (
            pagina < 1 ||
            pagina > totalPaginas
        ) {
            return;
        }

        setPagina(pagina);
    }

    return (
        <div className="min-h-screen text-white">
            <div className="mx-auto max-w-[1600px]">

                {/* =====================================================
                    CABEÇALHO
                ===================================================== */}

                <div className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                            Recursos Humanos
                        </h1>

                        <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-300">
                            Gerencie funcionários,
                            acompanhe vagas e organize
                            o processo de recrutamento
                            em um único painel.
                        </p>
                    </div>

                    <div className="flex flex-col items-start gap-2">

                        <button
                            type="button"
                            onClick={atualizarTudo}
                            disabled={
                                loadingUsuarios ||
                                loadingVagas ||
                                loadingCandidatos
                            }
                            className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-500 px-4 text-xs font-bold text-white shadow-lg shadow-teal-950/20 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${loadingUsuarios ||
                                        loadingVagas ||
                                        loadingCandidatos
                                        ? "animate-spin"
                                        : ""
                                    }`}
                            />

                            Atualizar dados
                        </button>

                        <div className="mt-1 w-full text-right">
                            <p className="text-xs tracking-wider text-white/40">
                                Última Atualização
                            </p>

                            <p className="mt-0.5 text-xs font-semibold text-white">
                                {atualizadoEm || "—"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* =====================================================
                    FUNCIONÁRIOS
                ===================================================== */}

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl shadow-black/10">

                    <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">

                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-600/20">
                                <User className="h-5 w-5" />
                            </div>

                            <div>
                                <div className="flex items-center gap-2">

                                    <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                                        Colaboradores cadastrados
                                    </h2>

                                    <span className="rounded-full bg-teal-50 px-2 py-0.5 text-[9px] font-bold text-teal-700">
                                        {usuarios.length}
                                    </span>
                                </div>

                                <p className="mt-1 text-[11px] text-slate-500">
                                    Lista de pessoas
                                    cadastradas no sistema.
                                </p>
                            </div>
                        </div>

                        <Link
                            href="/diretor/colaboradores/admissao"
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 text-xs font-bold text-white transition hover:bg-teal-700"
                        >
                            <Plus className="h-4 w-4" />
                            Cadastrar currículo
                        </Link>
                    </div>

                    {erroUsuarios && (
                        <div className="mx-5 my-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 sm:mx-6">
                            {erroUsuarios}
                        </div>
                    )}

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[950px]">

                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50">

                                    <th className="px-5 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                        Matrícula
                                    </th>

                                    <th className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                        Funcionário
                                    </th>

                                    <th className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                        E-mail
                                    </th>

                                    <th className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                        Whatsapp
                                    </th>

                                    <th className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                        Tipo
                                    </th>

                                    <th className="px-5 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                        Status
                                    </th>

                                    <th className="px-5 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                        Ações
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {loadingUsuarios ? (

                                    Array.from({
                                        length: 5,
                                    }).map(
                                        (_, index) => (
                                            <tr
                                                key={index}
                                            >
                                                <td
                                                    colSpan={
                                                        7
                                                    }
                                                    className="px-5 py-5"
                                                >
                                                    <div className="flex animate-pulse items-center gap-4">
                                                        <div className="h-3 w-16 rounded bg-slate-200" />
                                                        <div className="h-3 w-36 rounded bg-slate-200" />
                                                        <div className="h-3 w-52 rounded bg-slate-200" />
                                                        <div className="h-3 w-28 rounded bg-slate-200" />
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )

                                ) : usuariosPaginados.length === 0 ? (

                                    <tr>
                                        <td
                                            colSpan={7}
                                            className="px-6 py-14 text-center"
                                        >
                                            <div className="mx-auto flex max-w-sm flex-col items-center">

                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                                    <User className="h-5 w-5 text-slate-400" />
                                                </div>

                                                <h3 className="mt-3 text-sm font-bold text-slate-800">
                                                    Nenhum funcionário encontrado
                                                </h3>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Não há funcionários cadastrados.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>

                                ) : (

                                    usuariosPaginados.map(
                                        (usuario) => (
                                            <tr
                                                key={String(
                                                    usuario.matricula
                                                )}
                                                className="group transition hover:bg-slate-50"
                                            >

                                                <td className="px-5 py-4 text-center">
                                                    <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-700">
                                                        {
                                                            usuario.matricula
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">

                                                    <div className="flex items-center gap-3">

                                                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-50 text-xs font-bold text-teal-700 ring-1 ring-teal-100">

                                                            {usuario.profile_image &&
                                                                usuario.profile_image !==
                                                                "/favicon.ico" ? (

                                                                <img
                                                                    src={
                                                                        usuario.profile_image
                                                                    }
                                                                    alt={
                                                                        usuario.full_name ||
                                                                        "Usuário"
                                                                    }
                                                                    className="h-full w-full object-cover"
                                                                    onError={(
                                                                        event
                                                                    ) => {
                                                                        event.currentTarget.style.display =
                                                                            "none";
                                                                    }}
                                                                />

                                                            ) : (

                                                                usuario.full_name
                                                                    ?.charAt(
                                                                        0
                                                                    )
                                                                    ?.toUpperCase() ||
                                                                "U"
                                                            )}
                                                        </div>

                                                        <div className="min-w-0">

                                                            <p className="max-w-[200px] truncate text-xs font-bold text-slate-900">
                                                                {
                                                                    usuario.full_name
                                                                }
                                                            </p>

                                                            <p className="mt-0.5 text-[10px] text-slate-400">
                                                                Matrícula{" "}
                                                                {
                                                                    usuario.matricula
                                                                }
                                                            </p>

                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="text-xs font-medium text-slate-600">
                                                        {
                                                            usuario.email ||
                                                            "—"
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="text-xs font-medium text-slate-600">
                                                        {formatarTelefone(
                                                            usuario.phone
                                                        )}
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <span className="text-[10px] font-bold capitalize text-slate-700">
                                                        {
                                                            usuario.user_type ||
                                                            "Não informado"
                                                        }
                                                    </span>
                                                </td>

                                                <td className="px-5 py-4 text-center">

                                                    <span
                                                        className={`inline-flex rounded-2xl px-2.5 py-1 text-[9px] font-bold ${usuario.status ===
                                                                "active"
                                                                ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                                                : usuario.status ===
                                                                    "blocked"
                                                                    ? "bg-red-50 text-red-700 ring-1 ring-red-200"
                                                                    : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                                                            }`}
                                                    >
                                                        {usuario.status ===
                                                            "active"
                                                            ? "Ativo"
                                                            : usuario.status ===
                                                                "blocked"
                                                                ? "Bloqueado"
                                                                : usuario.status ===
                                                                    "inactive"
                                                                    ? "Inativo"
                                                                    : "Não informado"}
                                                    </span>

                                                </td>

                                                <td className="px-5 py-4">

                                                    <div className="flex justify-center gap-1">

                                                        <Link
                                                            href={`/diretor/colaboradores/${usuario.matricula}`}
                                                            title="Visualizar funcionário"
                                                            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Link>

                                                    </div>

                                                </td>

                                            </tr>
                                        )
                                    )
                                )}

                            </tbody>
                        </table>
                    </div>

                    {!loadingUsuarios &&
                        usuarios.length > 0 && (
                            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">

                                <p className="text-[10px] text-slate-500">
                                    Mostrando{" "}
                                    <strong className="text-slate-800">
                                        {primeiroUsuario + 1}
                                    </strong>{" "}
                                    até{" "}
                                    <strong className="text-slate-800">
                                        {Math.min(
                                            ultimoUsuario,
                                            usuarios.length
                                        )}
                                    </strong>{" "}
                                    de{" "}
                                    <strong className="text-slate-800">
                                        {usuarios.length}
                                    </strong>{" "}
                                    registros
                                </p>

                                <div className="flex items-center gap-1">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            irParaPagina(
                                                paginaUsuarios -
                                                1,
                                                totalPaginasUsuarios,
                                                setPaginaUsuarios
                                            )
                                        }
                                        disabled={
                                            paginaUsuarios ===
                                            1
                                        }
                                        className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                        Anterior
                                    </button>

                                    <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-teal-600 px-2 text-[10px] font-bold text-white">
                                        {
                                            paginaUsuarios
                                        }
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            irParaPagina(
                                                paginaUsuarios +
                                                1,
                                                totalPaginasUsuarios,
                                                setPaginaUsuarios
                                            )
                                        }
                                        disabled={
                                            paginaUsuarios ===
                                            totalPaginasUsuarios
                                        }
                                        className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Próxima
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </button>

                                </div>
                            </div>
                        )}
                </section>

                {/* =====================================================
                    VAGAS + RECRUTAMENTO
                ===================================================== */}

                <div className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">

                    {/* VAGAS */}

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-black/5">

                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">

                            <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                                    <BriefcaseBusiness className="h-5 w-5" />
                                </div>

                                <div>

                                    <h2 className="text-sm font-bold text-slate-900">
                                        Vagas abertas
                                    </h2>

                                    <p className="mt-1 text-[10px] text-slate-500">
                                        Oportunidades disponíveis.
                                    </p>

                                </div>
                            </div>

                            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[9px] font-bold text-teal-700">
                                {vagas.length} vagas
                            </span>

                        </div>

                        {erroVagas && (
                            <div className="mx-5 my-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
                                {erroVagas}
                            </div>
                        )}

                        <div className="overflow-x-auto">

                            <table className="w-full min-w-[800px]">

                                <thead className="bg-slate-50">

                                    <tr>

                                        <th className="px-5 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                            ID
                                        </th>

                                        <th className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                            Vaga
                                        </th>

                                        <th className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                            Plataforma
                                        </th>

                                        <th className="px-5 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                            Início
                                        </th>

                                        <th className="px-5 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                            Encerramento
                                        </th>

                                        <th className="px-5 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                            Status
                                        </th>

                                        <th className="px-5 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                            Ações
                                        </th>

                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100">

                                    {loadingVagas ? (

                                        Array.from({
                                            length: 4,
                                        }).map(
                                            (_, index) => (
                                                <tr
                                                    key={
                                                        index
                                                    }
                                                >
                                                    <td
                                                        colSpan={
                                                            7
                                                        }
                                                        className="px-5 py-5"
                                                    >
                                                        <div className="flex animate-pulse gap-4">
                                                            <div className="h-3 w-10 rounded bg-slate-200" />
                                                            <div className="h-3 w-36 rounded bg-slate-200" />
                                                            <div className="h-3 w-28 rounded bg-slate-200" />
                                                        </div>
                                                    </td>
                                                </tr>
                                            )
                                        )

                                    ) : vagasPaginadas.length === 0 ? (

                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-6 py-12 text-center text-xs text-slate-500"
                                            >
                                                Nenhuma vaga encontrada.
                                            </td>
                                        </tr>

                                    ) : (

                                        vagasPaginadas.map(
                                            (vaga) => {
                                                const status =
                                                    statusVaga(
                                                        vaga.status
                                                    );

                                                return (
                                                    <tr
                                                        key={String(
                                                            vaga.id
                                                        )}
                                                        className="transition hover:bg-slate-50"
                                                    >

                                                        <td className="px-5 py-4 text-center text-xs font-bold text-slate-800">
                                                            {
                                                                vaga.id
                                                            }
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <span className="text-xs font-bold text-slate-900">
                                                                {
                                                                    nomeVaga(
                                                                        vaga
                                                                    )
                                                                }
                                                            </span>
                                                        </td>

                                                        <td className="px-5 py-4 text-xs text-slate-600">
                                                            {
                                                                vaga.plataformas ||
                                                                vaga.plataforma ||
                                                                "—"
                                                            }
                                                        </td>

                                                        <td className="px-5 py-4 text-center text-[10px] text-slate-600">
                                                            {formatarData(
                                                                vaga.data_inicio ||
                                                                vaga.inicio ||
                                                                vaga.comeco
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4 text-center text-[10px] text-slate-600">
                                                            {formatarData(
                                                                vaga.data_fim ||
                                                                vaga.encerramento
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-4 text-center">

                                                            <span
                                                                className={`inline-flex rounded-full px-2.5 py-1 text-[9px] font-bold ${status.classe}`}
                                                            >
                                                                {
                                                                    status.texto
                                                                }
                                                            </span>

                                                        </td>

                                                        <td className="px-5 py-4">

                                                            <div className="flex justify-center">

                                                                <button
                                                                    type="button"
                                                                    title="Visualizar vaga"
                                                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </button>

                                                            </div>

                                                        </td>

                                                    </tr>
                                                );
                                            }
                                        )
                                    )}

                                </tbody>

                            </table>
                        </div>

                        {!loadingVagas &&
                            vagas.length > 0 && (
                                <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4">

                                    <span className="text-[10px] text-slate-500">
                                        {primeiroVaga +
                                            1}
                                        –
                                        {Math.min(
                                            ultimoVaga,
                                            vagas.length
                                        )}{" "}
                                        de{" "}
                                        {
                                            vagas.length
                                        }
                                    </span>

                                    <div className="flex items-center gap-1">

                                        <button
                                            type="button"
                                            onClick={() =>
                                                irParaPagina(
                                                    paginaVagas -
                                                    1,
                                                    totalPaginasVagas,
                                                    setPaginaVagas
                                                )
                                            }
                                            disabled={
                                                paginaVagas ===
                                                1
                                            }
                                            className="flex h-8 items-center rounded-lg border border-slate-200 px-3 text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                        >
                                            <ChevronLeft className="h-3.5 w-3.5" />
                                        </button>

                                        <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-teal-600 px-2 text-[10px] font-bold text-white">
                                            {
                                                paginaVagas
                                            }
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                irParaPagina(
                                                    paginaVagas +
                                                    1,
                                                    totalPaginasVagas,
                                                    setPaginaVagas
                                                )
                                            }
                                            disabled={
                                                paginaVagas ===
                                                totalPaginasVagas
                                            }
                                            className="flex h-8 items-center rounded-lg border border-slate-200 px-3 text-[10px] font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                                        >
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </button>

                                    </div>
                                </div>
                            )}
                    </section>

                    {/* RECRUTAMENTO */}

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-black/5">

                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-5">

                            <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                                    <FileText className="h-5 w-5" />
                                </div>

                                <div>

                                    <h2 className="text-sm font-bold text-slate-900">
                                        Recrutamento de currículos
                                    </h2>

                                    <p className="mt-1 text-[10px] text-slate-500">
                                        Acompanhe os candidatos recebidos.
                                    </p>

                                </div>
                            </div>

                            <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[9px] font-bold text-blue-700">
                                {
                                    candidatos.length
                                }
                            </span>

                        </div>

                        <div className="p-5">

                            <div className="rounded-2xl bg-slate-50 p-5">

                                <div className="flex items-center justify-between">

                                    <div>

                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                            Total de candidatos
                                        </p>

                                        <p className="mt-2 text-3xl font-bold text-slate-900">
                                            {
                                                candidatos.length
                                            }
                                        </p>

                                    </div>

                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                                        <FileText className="h-6 w-6" />
                                    </div>

                                </div>

                                <div className="mt-5 grid grid-cols-2 gap-3">

                                    <div className="rounded-xl border border-slate-200 bg-white p-3">

                                        <p className="text-[9px] font-bold uppercase text-slate-400">
                                            Em análise
                                        </p>

                                        <p className="mt-1 text-lg font-bold text-amber-600">
                                            {
                                                candidatos.filter(
                                                    (
                                                        item
                                                    ) =>
                                                        statusCandidato(
                                                            item.status
                                                        ).texto ===
                                                        "Em análise"
                                                ).length
                                            }
                                        </p>

                                    </div>

                                    <div className="rounded-xl border border-slate-200 bg-white p-3">

                                        <p className="text-[9px] font-bold uppercase text-slate-400">
                                            Aprovados
                                        </p>

                                        <p className="mt-1 text-lg font-bold text-emerald-600">
                                            {
                                                candidatos.filter(
                                                    (
                                                        item
                                                    ) =>
                                                        statusCandidato(
                                                            item.status
                                                        ).texto ===
                                                        "Aprovado"
                                                ).length
                                            }
                                        </p>

                                    </div>

                                </div>

                                <Link
                                    href="/diretor/colaboradores/admissao"
                                    className="mt-4 flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 text-xs font-bold text-white transition hover:bg-blue-700"
                                >
                                    <Plus className="h-4 w-4" />
                                    Novo recrutamento
                                </Link>

                            </div>
                        </div>

                    </section>

                </div>

                {/* =====================================================
                    TABELA DE CANDIDATOS
                ===================================================== */}

                <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-black/5">

                    <div className="flex flex-col gap-4 border-b border-slate-200 px-5 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between">

                        <div className="flex items-center gap-3">

                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                                <FileText className="h-5 w-5" />
                            </div>

                            <div>

                                <div className="flex items-center gap-2">

                                    <h2 className="text-sm font-bold text-slate-900 sm:text-base">
                                        Candidatos
                                    </h2>

                                    <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[9px] font-bold text-blue-700">
                                        {
                                            candidatos.length
                                        }
                                    </span>

                                </div>

                                <p className="mt-1 text-[11px] text-slate-500">
                                    Candidatos inscritos no processo de recrutamento.
                                </p>

                            </div>
                        </div>
                    </div>

                    {erroCandidatos && (
                        <div className="mx-5 my-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 sm:mx-6">
                            {erroCandidatos}
                        </div>
                    )}

                    <div className="overflow-x-auto">

                        <table className="w-full min-w-[1150px]">

                            <thead>

                                <tr className="border-b border-slate-200 bg-slate-50">

                                    <th className="px-5 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                        Recrutamento
                                    </th>

                                    <th className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                        Candidato
                                    </th>

                                    <th className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                        Vaga
                                    </th>

                                    <th className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                        E-mail
                                    </th>

                                    <th className="px-5 py-3 text-left text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                        Whatsapp
                                    </th>

                                    <th className="px-5 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                        Data
                                    </th>

                                    <th className="px-5 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                        Status
                                    </th>

                                    <th className="px-5 py-3 text-center text-[9px] font-bold uppercase tracking-wider text-slate-500">
                                        Ações
                                    </th>

                                </tr>

                            </thead>

                            <tbody className="divide-y divide-slate-100">

                                {loadingCandidatos ? (

                                    Array.from({
                                        length: 5,
                                    }).map(
                                        (_, index) => (
                                            <tr
                                                key={
                                                    index
                                                }
                                            >
                                                <td
                                                    colSpan={
                                                        8
                                                    }
                                                    className="px-5 py-5"
                                                >
                                                    <div className="flex animate-pulse gap-4">
                                                        <div className="h-3 w-20 rounded bg-slate-200" />
                                                        <div className="h-3 w-40 rounded bg-slate-200" />
                                                        <div className="h-3 w-32 rounded bg-slate-200" />
                                                        <div className="h-3 w-52 rounded bg-slate-200" />
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    )

                                ) : candidatosPaginados.length === 0 ? (

                                    <tr>

                                        <td
                                            colSpan={8}
                                            className="px-6 py-14 text-center"
                                        >

                                            <div className="mx-auto flex max-w-sm flex-col items-center">

                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                                                    <FileText className="h-5 w-5 text-slate-400" />
                                                </div>

                                                <h3 className="mt-3 text-sm font-bold text-slate-800">
                                                    Nenhum candidato encontrado
                                                </h3>

                                                <p className="mt-1 text-xs text-slate-500">
                                                    Ainda não existem currículos cadastrados.
                                                </p>

                                            </div>

                                        </td>

                                    </tr>

                                ) : (

                                    candidatosPaginados.map(
                                        (candidato) => {

                                            const status =
                                                statusCandidato(
                                                    candidato.status
                                                );

                                            /*
                                             * USAMOS numero_recrutamento
                                             * COMO IDENTIFICADOR
                                             */
                                            const numeroRecrutamento =
                                                candidato.numero_recrutamento?.trim();

                                            const nome =
                                                nomeCandidato(
                                                    candidato
                                                );

                                            return (
                                                <tr
                                                    key={
                                                        numeroRecrutamento ||
                                                        String(
                                                            candidato.id
                                                        )
                                                    }
                                                    className="transition hover:bg-slate-50"
                                                >

                                                    {/* NÚMERO DO RECRUTAMENTO */}

                                                    <td className="px-5 py-4 text-center">

                                                        <span className="inline-flex rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-700">
                                                            {
                                                                numeroRecrutamento ||
                                                                "—"
                                                            }
                                                        </span>

                                                    </td>

                                                    {/* CANDIDATO */}

                                                    <td className="px-5 py-4">

                                                        <div className="flex items-center gap-3">

                                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">
                                                                {nome
                                                                    .charAt(
                                                                        0
                                                                    )
                                                                    .toUpperCase()}
                                                            </div>

                                                            <div className="min-w-0">

                                                                <p className="max-w-[220px] truncate text-xs font-bold text-slate-900">
                                                                    {
                                                                        nome
                                                                    }
                                                                </p>

                                                                <p className="mt-0.5 text-[10px] text-slate-400">
                                                                    Recrutamento{" "}
                                                                    {
                                                                        numeroRecrutamento ||
                                                                        "—"
                                                                    }
                                                                </p>

                                                            </div>

                                                        </div>

                                                    </td>

                                                    {/* VAGA */}

                                                    <td className="px-5 py-4">

                                                        <span className="text-xs font-semibold capitalize text-slate-700">
                                                            {nomeDaVagaDoCandidato(
                                                                candidato
                                                            )}
                                                        </span>

                                                    </td>

                                                    {/* EMAIL */}

                                                    <td className="px-5 py-4">

                                                        <span className="text-xs font-medium text-slate-600">
                                                            {
                                                                candidato.email ||
                                                                "—"
                                                            }
                                                        </span>

                                                    </td>

                                                    {/* WHATSAPP */}

                                                    <td className="px-5 py-4">

                                                        <span className="text-xs font-medium text-slate-600">
                                                            {formatarTelefone(
                                                                candidato.phone ||
                                                                candidato.telefone ||
                                                                candidato.whatsapp
                                                            )}
                                                        </span>

                                                    </td>

                                                    {/* DATA */}

                                                    <td className="px-5 py-4 text-center">

                                                        <span className="text-[10px] font-medium text-slate-600">
                                                            {formatarData(
                                                                candidato.data ||
                                                                candidato.data_candidatura ||
                                                                candidato.created_at
                                                            )}
                                                        </span>

                                                    </td>

                                                    {/* STATUS */}

                                                    <td className="px-5 py-4 text-center">

                                                        <span
                                                            className={`inline-flex rounded-2xl px-2.5 py-1 text-[9px] font-bold ${status.classe}`}
                                                        >
                                                            {
                                                                status.texto
                                                            }
                                                        </span>

                                                    </td>

                                                    {/* AÇÕES */}

                                                    <td className="px-5 py-4">

                                                        <div className="flex justify-center gap-1">

                                                            {numeroRecrutamento ? (

                                                                <Link
                                                                    href={`/diretor/colaboradores/candidatos/${encodeURIComponent(
                                                                        numeroRecrutamento
                                                                    )}`}
                                                                    title="Visualizar candidato"
                                                                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-blue-50 hover:text-blue-600"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </Link>

                                                            ) : (

                                                                <button
                                                                    type="button"
                                                                    disabled
                                                                    title="Número de recrutamento não informado"
                                                                    className="flex h-8 w-8 cursor-not-allowed items-center justify-center rounded-lg text-slate-300"
                                                                >
                                                                    <Eye className="h-4 w-4" />
                                                                </button>

                                                            )}

                                                            <button
                                                                type="button"
                                                                title="Excluir candidato"
                                                                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </button>

                                                        </div>

                                                    </td>

                                                </tr>
                                            );
                                        }
                                    )
                                )}

                            </tbody>
                        </table>
                    </div>

                    {/* PAGINAÇÃO */}

                    {!loadingCandidatos &&
                        candidatos.length > 0 && (

                            <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:px-6 md:flex-row md:items-center md:justify-between">

                                <p className="text-[10px] text-slate-500">

                                    Mostrando{" "}

                                    <strong className="text-slate-800">
                                        {
                                            primeiroCandidato +
                                            1
                                        }
                                    </strong>{" "}

                                    até{" "}

                                    <strong className="text-slate-800">
                                        {Math.min(
                                            ultimoCandidato,
                                            candidatos.length
                                        )}
                                    </strong>{" "}

                                    de{" "}

                                    <strong className="text-slate-800">
                                        {
                                            candidatos.length
                                        }
                                    </strong>{" "}

                                    candidatos

                                </p>

                                <div className="flex items-center gap-1">

                                    <button
                                        type="button"
                                        onClick={() =>
                                            irParaPagina(
                                                paginaCandidatos -
                                                1,
                                                totalPaginasCandidatos,
                                                setPaginaCandidatos
                                            )
                                        }
                                        disabled={
                                            paginaCandidatos ===
                                            1
                                        }
                                        className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <ChevronLeft className="h-3.5 w-3.5" />
                                        Anterior
                                    </button>

                                    <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-blue-600 px-2 text-[10px] font-bold text-white">
                                        {
                                            paginaCandidatos
                                        }
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            irParaPagina(
                                                paginaCandidatos +
                                                1,
                                                totalPaginasCandidatos,
                                                setPaginaCandidatos
                                            )
                                        }
                                        disabled={
                                            paginaCandidatos ===
                                            totalPaginasCandidatos
                                        }
                                        className="flex h-8 items-center gap-1 rounded-lg border border-slate-200 px-3 text-[10px] font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Próxima
                                        <ChevronRight className="h-3.5 w-3.5" />
                                    </button>

                                </div>
                            </div>
                        )}

                </section>

                <div className="h-8" />

            </div>
        </div>
    );
}