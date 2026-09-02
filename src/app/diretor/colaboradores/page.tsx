"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Plus,
    User,
    RefreshCw,
    BriefcaseBusiness,
    FileText,
    Eye,
    Download,
    Trash2,
    ArrowLeft,
} from "lucide-react";

type Usuario = {
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
    id: number | string;
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
    const router = useRouter();

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

    async function lerJson<T>(response: Response): Promise<T | null> {
        const texto = await response.text();

        if (!texto) {
            return null;
        }

        try {
            return JSON.parse(texto) as T;
        } catch {
            console.error("Resposta que não é JSON:", texto.substring(0, 500));

            throw new Error(
                response.status === 404
                    ? "A rota da API não foi encontrada."
                    : "A API retornou uma resposta inválida."
            );
        }
    }

    function formatarTelefone(telefone?: string | null) {
        if (!telefone) {
            return "—";
        }

        const numeros = telefone.replace(/\D/g, "");

        if (numeros.length === 11) {
            return numeros.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        }

        if (numeros.length === 10) {
            return numeros.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
        }

        return telefone;
    }

    function formatarData(data?: string | null) {
        if (!data) {
            return "—";
        }

        const dataObj = new Date(data);

        if (Number.isNaN(dataObj.getTime())) {
            return data;
        }

        return dataObj.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
        });
    }

    function nomeVaga(vaga: Vaga) {
        return vaga.titulo || vaga.nome || vaga.vaga || "Vaga não informada";
    }

    function nomeCandidato(candidato: Candidato) {
        return (
            candidato.nome ||
            candidato.full_name ||
            candidato.candidato ||
            "Candidato não informado"
        );
    }

    function nomeDaVagaDoCandidato(candidato: Candidato) {
        return candidato.vaga || candidato.vaga_titulo || "—";
    }

    function statusVaga(status?: string | null) {
        const valor = status?.toLowerCase();

        if (valor === "aberta" || valor === "open" || valor === "active") {
            return {
                texto: "Aberta",
                classe: "bg-emerald-100 text-emerald-700",
            };
        }

        if (
            valor === "encerrada" ||
            valor === "closed" ||
            valor === "inactive"
        ) {
            return {
                texto: "Encerrada",
                classe: "bg-slate-100 text-slate-600",
            };
        }

        if (valor === "pausada" || valor === "paused") {
            return {
                texto: "Pausada",
                classe: "bg-amber-100 text-amber-700",
            };
        }

        return {
            texto: status || "Não informado",
            classe: "bg-slate-100 text-slate-600",
        };
    }

    function statusCandidato(status?: string | null) {
        const valor = status?.toLowerCase();

        if (
            valor === "aprovado" ||
            valor === "approved" ||
            valor === "contratado" ||
            valor === "hired"
        ) {
            return {
                texto: "Aprovado",
                classe: "bg-emerald-100 text-emerald-700",
            };
        }

        if (valor === "reprovado" || valor === "rejected") {
            return {
                texto: "Reprovado",
                classe: "bg-red-100 text-red-700",
            };
        }

        if (valor === "entrevista" || valor === "interview") {
            return {
                texto: "Entrevista",
                classe: "bg-blue-100 text-blue-700",
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
                classe: "bg-amber-100 text-amber-700",
            };
        }

        return {
            texto: status || "Não informado",
            classe: "bg-slate-100 text-slate-600",
        };
    }

    async function carregarUsuarios() {
        try {
            setLoadingUsuarios(true);
            setErroUsuarios(null);

            const response = await fetch("/api/users", {
                method: "GET",
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                },
            });

            const data = await lerJson<ApiResponse<Usuario> | Usuario[]>(
                response
            );

            if (!response.ok) {
                const mensagem =
                    data && !Array.isArray(data) && data.message
                        ? data.message
                        : `Erro ao carregar usuários. Status: ${response.status}`;

                throw new Error(mensagem);
            }

            const lista = extrairLista<Usuario>(data, "usuarios");

            setUsuarios(lista);
            setPaginaUsuarios(1);
        } catch (error) {
            console.error("Erro ao carregar usuários:", error);

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

            const response = await fetch("/api/vagas", {
                method: "GET",
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                },
            });

            const data = await lerJson<ApiResponse<Vaga> | Vaga[]>(response);

            if (!response.ok) {
                const mensagem =
                    data && !Array.isArray(data) && data.message
                        ? data.message
                        : `Erro ao carregar vagas. Status: ${response.status}`;

                throw new Error(mensagem);
            }

            const lista = extrairLista<Vaga>(data, "vagas");

            setVagas(lista);
            setPaginaVagas(1);
        } catch (error) {
            console.error("Erro ao carregar vagas:", error);

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

            const response = await fetch("/api/candidatos", {
                method: "GET",
                cache: "no-store",
                headers: {
                    Accept: "application/json",
                },
            });

            const data = await lerJson<ApiResponse<Candidato> | Candidato[]>(
                response
            );

            if (!response.ok) {
                const mensagem =
                    data && !Array.isArray(data) && data.message
                        ? data.message
                        : `Erro ao carregar candidatos. Status: ${response.status}`;

                throw new Error(mensagem);
            }

            const lista = extrairLista<Candidato>(data, "candidatos");

            setCandidatos(lista);
            setPaginaCandidatos(1);
        } catch (error) {
            console.error("Erro ao carregar candidatos:", error);

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
            `${agora.toLocaleTimeString("pt-BR")} ${agora.toLocaleDateString(
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

    const totalPaginasUsuarios = Math.max(
        1,
        Math.ceil(usuarios.length / REGISTROS_POR_PAGINA)
    );

    const primeiroUsuario =
        (paginaUsuarios - 1) * REGISTROS_POR_PAGINA;

    const ultimoUsuario = primeiroUsuario + REGISTROS_POR_PAGINA;

    const usuariosPaginados = useMemo(
        () => usuarios.slice(primeiroUsuario, ultimoUsuario),
        [usuarios, primeiroUsuario, ultimoUsuario]
    );

    const totalPaginasVagas = Math.max(
        1,
        Math.ceil(vagas.length / REGISTROS_POR_PAGINA)
    );

    const primeiroVaga =
        (paginaVagas - 1) * REGISTROS_POR_PAGINA;

    const ultimoVaga = primeiroVaga + REGISTROS_POR_PAGINA;

    const vagasPaginadas = useMemo(
        () => vagas.slice(primeiroVaga, ultimoVaga),
        [vagas, primeiroVaga, ultimoVaga]
    );

    const totalPaginasCandidatos = Math.max(
        1,
        Math.ceil(candidatos.length / REGISTROS_POR_PAGINA)
    );

    const primeiroCandidato =
        (paginaCandidatos - 1) * REGISTROS_POR_PAGINA;

    const ultimoCandidato =
        primeiroCandidato + REGISTROS_POR_PAGINA;

    const candidatosPaginados = useMemo(
        () => candidatos.slice(primeiroCandidato, ultimoCandidato),
        [candidatos, primeiroCandidato, ultimoCandidato]
    );

    function irParaPagina(
        pagina: number,
        totalPaginas: number,
        setPagina: (pagina: number) => void
    ) {
        if (pagina < 1 || pagina > totalPaginas) {
            return;
        }

        setPagina(pagina);
    }

    return (
        <div className="min-h-screen text-white">
            <div className="mx-auto max-w-8xl">
                <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight text-white">
                                Recursos Humanos (RH)
                            </h1>
                            <p className="mt-1 text-sm text-white">
                                Acompanhe as principais informações dos funcionários cadastrados.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={atualizarTudo}
                            disabled={
                                loadingUsuarios ||
                                loadingVagas ||
                                loadingCandidatos
                            }
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-500 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            <RefreshCw
                                className={`h-4 w-4 ${
                                    loadingUsuarios ||
                                    loadingVagas ||
                                    loadingCandidatos
                                        ? "animate-spin"
                                        : ""
                                }`}
                            />
                            Atualizar
                        </button>

                        <Link
                            href="/diretor/colaboradores/admissao"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
                        >
                            <Plus className="h-4 w-4" />
                            Cadastrar Currículo
                        </Link>
                    </div>
                </div>

                <section>
                    <div className="overflow-hidden rounded-2xl bg-white shadow-xl">
                        <div className="flex flex-col gap-4 px-5 py-5 sm:px-6 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-900/20">
                                    <User className="h-5 w-5" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-semibold text-slate-800">
                                        Funcionários cadastrados
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Lista de pessoas cadastradas no sistema.
                                    </p>
                                </div>
                            </div>

                            <div className="text-sm text-slate-500 md:text-right">
                                Atualizado em{" "}
                                <strong className="text-slate-700">
                                    {atualizadoEm || "—"}
                                </strong>
                            </div>
                        </div>

                        {erroUsuarios && (
                            <div className="mx-5 my-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 sm:mx-6">
                                {erroUsuarios}
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[950px] divide-y divide-slate-200">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-black">
                                            Matrícula
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-black">
                                            Nome
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-black">
                                            E-mail
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-black">
                                            Whatsapp
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase tracking-wider text-black">
                                            Tipo
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-black">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold uppercase tracking-wider text-black">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {loadingUsuarios ? (
                                        Array.from({ length: 5 }).map((_, index) => (
                                            <tr key={index}>
                                                <td colSpan={7} className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                                                        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                                                        <div className="h-4 w-56 animate-pulse rounded bg-slate-200" />
                                                        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : usuariosPaginados.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center">
                                                <div className="mx-auto flex max-w-md flex-col items-center">
                                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                                                        <User className="h-6 w-6 text-slate-400" />
                                                    </div>
                                                    <h3 className="text-base font-semibold text-slate-700">
                                                        Nenhum funcionário encontrado
                                                    </h3>
                                                    <p className="mt-1 text-sm text-slate-500">
                                                        Não há cadastros disponíveis no momento.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        usuariosPaginados.map((usuario) => (
                                            <tr
                                                key={String(usuario.matricula)}
                                                className="transition hover:bg-slate-50"
                                            >
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-sm font-bold text-black">
                                                        {usuario.matricula}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                                                            {usuario.profile_image &&
                                                            usuario.profile_image !== "/favicon.ico" ? (
                                                                <img
                                                                    src={usuario.profile_image}
                                                                    alt={usuario.full_name || "Usuário"}
                                                                    className="h-full w-full object-cover"
                                                                    onError={(event) => {
                                                                        event.currentTarget.style.display =
                                                                            "none";
                                                                    }}
                                                                />
                                                            ) : (
                                                                usuario.full_name
                                                                    ?.charAt(0)
                                                                    ?.toUpperCase() || "U"
                                                            )}
                                                        </div>

                                                        <p className="truncate font-semibold text-black">
                                                            {usuario.full_name || "Nome não informado"}
                                                        </p>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-black">
                                                        {usuario.email || "—"}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="font-medium text-black">
                                                        {formatarTelefone(usuario.phone)}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-black">
                                                        {usuario.user_type || "Não informado"}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-center">
                                                    <span
                                                        className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                                            usuario.status === "active"
                                                                ? "bg-emerald-100 text-emerald-700"
                                                                : usuario.status === "blocked"
                                                                  ? "bg-red-100 text-red-700"
                                                                  : "bg-slate-100 text-slate-600"
                                                        }`}
                                                    >
                                                        {usuario.status === "active"
                                                            ? "Ativo"
                                                            : usuario.status === "blocked"
                                                              ? "Bloqueado"
                                                              : usuario.status === "inactive"
                                                                ? "Inativo"
                                                                : "Não informado"}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            title="Visualizar"
                                                            className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                                                        >
                                                            <Eye size={18} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            title="Baixar"
                                                            className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                                                        >
                                                            <Download size={18} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            title="Excluir"
                                                            className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {!loadingUsuarios && usuarios.length > 0 && (
                            <div className="border-t border-slate-200 px-5 py-4 sm:px-6">
                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                    <span className="text-xs text-slate-500">
                                        Mostrando{" "}
                                        <strong className="text-slate-700">
                                            {primeiroUsuario + 1}
                                        </strong>{" "}
                                        até{" "}
                                        <strong className="text-slate-700">
                                            {Math.min(ultimoUsuario, usuarios.length)}
                                        </strong>{" "}
                                        de{" "}
                                        <strong className="text-slate-700">
                                            {usuarios.length}
                                        </strong>{" "}
                                        registros
                                    </span>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                irParaPagina(
                                                    paginaUsuarios - 1,
                                                    totalPaginasUsuarios,
                                                    setPaginaUsuarios
                                                )
                                            }
                                            disabled={paginaUsuarios === 1}
                                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Anterior
                                        </button>

                                        {Array.from(
                                            { length: totalPaginasUsuarios },
                                            (_, i) => i + 1
                                        ).map((pagina) => (
                                            <button
                                                key={pagina}
                                                type="button"
                                                onClick={() =>
                                                    irParaPagina(
                                                        pagina,
                                                        totalPaginasUsuarios,
                                                        setPaginaUsuarios
                                                    )
                                                }
                                                className={`h-10 min-w-10 rounded-lg px-3 text-sm font-medium transition ${
                                                    paginaUsuarios === pagina
                                                        ? "bg-teal-600 text-white"
                                                        : "border border-slate-300 text-slate-600 hover:bg-slate-100"
                                                }`}
                                            >
                                                {pagina}
                                            </button>
                                        ))}

                                        <button
                                            type="button"
                                            onClick={() =>
                                                irParaPagina(
                                                    paginaUsuarios + 1,
                                                    totalPaginasUsuarios,
                                                    setPaginaUsuarios
                                                )
                                            }
                                            disabled={
                                                paginaUsuarios === totalPaginasUsuarios
                                            }
                                            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Próxima
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </section>

                <div className="mt-5 grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <section className="overflow-hidden rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
                                    <BriefcaseBusiness className="h-5 w-5 text-teal-700" />
                                </div>

                                <div>
                                    <h2 className="text-lg font-bold text-black">
                                        Vagas Abertas
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Vagas disponíveis para recrutamento.
                                    </p>
                                </div>
                            </div>

                            <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700">
                                {vagas.length} vagas
                            </span>
                        </div>

                        {erroVagas && (
                            <div className="mx-5 my-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {erroVagas}
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[850px]">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 text-center text-xs font-bold uppercase text-black">
                                            ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase text-black">
                                            Vaga
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase text-black">
                                            Plataforma
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold uppercase text-black">
                                            Começo
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold uppercase text-black">
                                            Encerramento
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold uppercase text-black">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold uppercase text-black">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {loadingVagas ? (
                                        Array.from({ length: 4 }).map((_, index) => (
                                            <tr key={index}>
                                                <td colSpan={7} className="px-6 py-5">
                                                    <div className="flex gap-4">
                                                        <div className="h-4 w-12 animate-pulse rounded bg-slate-200" />
                                                        <div className="h-4 w-40 animate-pulse rounded bg-slate-200" />
                                                        <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                                                        <div className="h-4 w-20 animate-pulse rounded bg-slate-200" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : vagasPaginadas.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-6 py-12 text-center text-sm text-slate-500"
                                            >
                                                Nenhuma vaga encontrada.
                                            </td>
                                        </tr>
                                    ) : (
                                        vagasPaginadas.map((vaga) => {
                                            const status = statusVaga(vaga.status);

                                            return (
                                                <tr
                                                    key={String(vaga.id)}
                                                    className="transition hover:bg-slate-50"
                                                >
                                                    <td className="px-6 py-4 text-center font-bold text-black">
                                                        {vaga.id}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="font-semibold text-black">
                                                            {nomeVaga(vaga)}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4 text-sm text-slate-600">
                                                        {vaga.plataformas ||
                                                            vaga.plataforma ||
                                                            "—"}
                                                    </td>

                                                    <td className="px-6 py-4 text-center text-sm text-slate-600">
                                                        {formatarData(
                                                            vaga.data_inicio ||
                                                                vaga.inicio ||
                                                                vaga.comeco
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4 text-center text-sm text-slate-600">
                                                        {formatarData(
                                                            vaga.data_fim ||
                                                                vaga.encerramento
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4 text-center">
                                                        <span
                                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${status.classe}`}
                                                        >
                                                            {status.texto}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-center gap-2">
                                                            <button
                                                                type="button"
                                                                title="Visualizar"
                                                                className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                                                            >
                                                                <Eye size={18} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                title="Baixar"
                                                                className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                                                            >
                                                                <Download size={18} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                title="Excluir"
                                                                className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {!loadingVagas && vagas.length > 0 && (
                            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                                <span className="text-xs text-slate-500">
                                    Mostrando{" "}
                                    <strong className="text-slate-700">
                                        {primeiroVaga + 1}
                                    </strong>{" "}
                                    até{" "}
                                    <strong className="text-slate-700">
                                        {Math.min(ultimoVaga, vagas.length)}
                                    </strong>{" "}
                                    de{" "}
                                    <strong className="text-slate-700">
                                        {vagas.length}
                                    </strong>
                                </span>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            irParaPagina(
                                                paginaVagas - 1,
                                                totalPaginasVagas,
                                                setPaginaVagas
                                            )
                                        }
                                        disabled={paginaVagas === 1}
                                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 disabled:opacity-40"
                                    >
                                        Anterior
                                    </button>

                                    <span className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white">
                                        {paginaVagas}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            irParaPagina(
                                                paginaVagas + 1,
                                                totalPaginasVagas,
                                                setPaginaVagas
                                            )
                                        }
                                        disabled={
                                            paginaVagas === totalPaginasVagas
                                        }
                                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 disabled:opacity-40"
                                    >
                                        Próxima
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>

                    <section className="overflow-hidden rounded-2xl bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                                    <FileText className="h-5 w-5 text-blue-700" />
                                </div>

                                <div>
                                    <h2 className="text-lg font-bold text-black">
                                        Recrutamento de Currículos
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Candidatos inscritos nas vagas.
                                    </p>
                                </div>
                            </div>

                            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                                {candidatos.length} candidatos
                            </span>
                        </div>

                        {erroCandidatos && (
                            <div className="mx-5 my-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                {erroCandidatos}
                            </div>
                        )}

                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[950px]">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 text-center text-xs font-bold uppercase text-black">
                                            ID
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase text-black">
                                            Candidato
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase text-black">
                                            Vaga
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase text-black">
                                            Email
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-bold uppercase text-black">
                                            Whatsapp
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold uppercase text-black">
                                            Data
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold uppercase text-black">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-bold uppercase text-black">
                                            Ações
                                        </th>
                                    </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {loadingCandidatos ? (
                                        Array.from({ length: 4 }).map((_, index) => (
                                            <tr key={index}>
                                                <td colSpan={8} className="px-6 py-5">
                                                    <div className="flex gap-4">
                                                        <div className="h-4 w-10 animate-pulse rounded bg-slate-200" />
                                                        <div className="h-4 w-36 animate-pulse rounded bg-slate-200" />
                                                        <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
                                                        <div className="h-4 w-44 animate-pulse rounded bg-slate-200" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : candidatosPaginados.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center">
                                                <div className="mx-auto flex max-w-md flex-col items-center">
                                                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                                                        <FileText className="h-6 w-6 text-slate-400" />
                                                    </div>

                                                    <h3 className="text-base font-semibold text-slate-700">
                                                        Nenhum candidato encontrado
                                                    </h3>

                                                    <p className="mt-1 text-sm text-slate-500">
                                                        Ainda não existem currículos cadastrados.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        candidatosPaginados.map((candidato) => {
                                            const status = statusCandidato(
                                                candidato.status
                                            );

                                            return (
                                                <tr
                                                    key={String(candidato.id)}
                                                    className="transition hover:bg-slate-50"
                                                >
                                                    <td className="px-6 py-4 text-center font-bold text-black">
                                                        {candidato.id}
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="font-semibold text-black">
                                                            {nomeCandidato(candidato)}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="font-medium text-slate-700">
                                                            {nomeDaVagaDoCandidato(
                                                                candidato
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="font-medium text-black">
                                                            {candidato.email || "—"}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <span className="font-medium text-black">
                                                            {formatarTelefone(
                                                                candidato.phone ||
                                                                    candidato.telefone ||
                                                                    candidato.whatsapp
                                                            )}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4 text-center text-sm text-slate-600">
                                                        {formatarData(
                                                            candidato.data ||
                                                                candidato.data_candidatura ||
                                                                candidato.created_at
                                                        )}
                                                    </td>

                                                    <td className="px-6 py-4 text-center">
                                                        <span
                                                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${status.classe}`}
                                                        >
                                                            {status.texto}
                                                        </span>
                                                    </td>

                                                    <td className="px-6 py-4">
                                                        <div className="flex justify-center gap-2">
                                                            <button
                                                                type="button"
                                                                title="Visualizar"
                                                                className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                                                            >
                                                                <Eye size={18} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                title="Baixar"
                                                                className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                                                            >
                                                                <Download size={18} />
                                                            </button>

                                                            <button
                                                                type="button"
                                                                title="Excluir"
                                                                className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {!loadingCandidatos && candidatos.length > 0 && (
                            <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
                                <span className="text-xs text-slate-500">
                                    Mostrando{" "}
                                    <strong className="text-slate-700">
                                        {primeiroCandidato + 1}
                                    </strong>{" "}
                                    até{" "}
                                    <strong className="text-slate-700">
                                        {Math.min(
                                            ultimoCandidato,
                                            candidatos.length
                                        )}
                                    </strong>{" "}
                                    de{" "}
                                    <strong className="text-slate-700">
                                        {candidatos.length}
                                    </strong>
                                </span>

                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            irParaPagina(
                                                paginaCandidatos - 1,
                                                totalPaginasCandidatos,
                                                setPaginaCandidatos
                                            )
                                        }
                                        disabled={paginaCandidatos === 1}
                                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 disabled:opacity-40"
                                    >
                                        Anterior
                                    </button>

                                    <span className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white">
                                        {paginaCandidatos}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            irParaPagina(
                                                paginaCandidatos + 1,
                                                totalPaginasCandidatos,
                                                setPaginaCandidatos
                                            )
                                        }
                                        disabled={
                                            paginaCandidatos ===
                                            totalPaginasCandidatos
                                        }
                                        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-600 disabled:opacity-40"
                                    >
                                        Próxima
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}