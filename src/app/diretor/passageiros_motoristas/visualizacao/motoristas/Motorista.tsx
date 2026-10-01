"use client";

import {
    ArrowLeft,
    BadgeCheck,
    CheckCircle2,
    Clock3,
    CreditCard,
    Edit3,
    FileText,
    Mail,
    MapPin,
    Phone,
    Star,
    Trash2,
    UserRound,
    Lock,
    ShieldCheck,
    AlertTriangle,
} from "lucide-react";

import { useParams, useRouter } from "next/navigation";

import {
    useEffect,
    useState,
    type ReactNode,
} from "react";

/* =========================================================
   TIPO
========================================================= */

type Usuario = {
    id: string;

    name?: string | null;
    nome?: string | null;

    email?: string | null;
    email_address?: string | null;
    mail?: string | null;
    email_usuario?: string | null;

    phone?: string | null;
    telefone?: string | null;

    type?: string | null;
    tipo?: string | null;

    ref_code?: string | null;

    is_active?: number | boolean | null;
    is_temp_blocked?: number | boolean | null;
    bloqueado?: boolean | null;
    blocked_at?: string | null;

    created_at?: string | null;
    updated_at?: string | null;

    foto?: string | null;
    foto_url?: string | null;
    avatar?: string | null;

    cidade?: string | null;
    estado?: string | null;

    servico?: string | null;
    service?: string | null;

    rating?: number | string | null;
    avaliacao?: number | string | null;
};

/* =========================================================
   RESPOSTA API
========================================================= */

type ApiResponse = {
    sucesso?: boolean;
    usuario?: Usuario;
    data?: Usuario;
    user?: Usuario;

    error?: string;
    message?: string;
};

type VerificacaoDocumento = {
    status?: string | null;
    didit_status?: string | null;
    is_verified?: boolean | null;
    identity_match?: unknown;
    documento_tipo?: string | null;
};

type ProvaVida = {
    devida?: boolean | null;
    last_liveness_at?: string | null;
};

type Verificacao = {
    documento?: VerificacaoDocumento | null;
    prova_vida?: ProvaVida | null;
};

/* =========================================================
   HELPERS
========================================================= */

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

function formatarTelefone(
    telefone?: string | null
): string {
    if (!telefone) return "—";

    const numeros = String(telefone).replace(/\D/g, "");

    if (!numeros) return "—";

    const numeroBR =
        numeros.startsWith("55") && numeros.length >= 12
            ? numeros.slice(2)
            : numeros;

    if (numeroBR.length === 11) {
        return numeroBR.replace(
            /^(\d{2})(\d{5})(\d{4})$/,
            "($1) $2-$3"
        );
    }

    if (numeroBR.length === 10) {
        return numeroBR.replace(
            /^(\d{2})(\d{4})(\d{4})$/,
            "($1) $2-$3"
        );
    }

    if (numeroBR.length === 9) {
        return numeroBR.replace(
            /^(\d{5})(\d{4})$/,
            "$1-$2"
        );
    }

    if (numeroBR.length === 8) {
        return numeroBR.replace(
            /^(\d{4})(\d{4})$/,
            "$1-$2"
        );
    }

    return telefone;
}

function numero(valor: unknown) {
    const n = Number(valor);

    return Number.isFinite(n) ? n : 0;
}

function getNome(usuario: Usuario) {
    return usuario.nome || usuario.name || "Motorista";
}

function getEmail(usuario: Usuario) {
    return (
        usuario.email ||
        usuario.email_address ||
        usuario.mail ||
        usuario.email_usuario ||
        "—"
    );
}

function getTelefone(usuario: Usuario) {
    return usuario.telefone || usuario.phone || "";
}

function getFoto(usuario: Usuario) {
    return (
        usuario.foto_url ||
        usuario.foto ||
        usuario.avatar ||
        ""
    );
}

function estaBloqueado(usuario: Usuario) {
    return (
        usuario.bloqueado === true ||
        Number(usuario.is_active) === 0 ||
        Number(usuario.is_temp_blocked) === 1 ||
        Boolean(usuario.blocked_at)
    );
}

/* =========================================================
   VERIFICAÇÃO
========================================================= */

function formatarTipoDocumento(tipo: string | null | undefined): string {
    if (!tipo) return "—";

    const mapa: Record<string, string> = {
        "identity card": "Carteira de identidade (RG)",
        "driving license": "Carteira de habilitação (CNH)",
        "driver's license": "Carteira de habilitação (CNH)",
        passport: "Passaporte",
        cpf: "CPF",
        "tax id": "CPF",
        "residence permit": "Comprovante de residência",
        "carteira de identidade (rg)": "Carteira de identidade (RG)",
        "carteira de habilitação (cnh)": "Carteira de habilitação (CNH)",
    };

    return mapa[tipo.trim().toLowerCase()] ?? tipo;
}

function StatusBadgeVerificacao({
    status,
}: {
    status?: string | null;
}) {
    const config: Record<
        string,
        { label: string; className: string }
    > = {
        aprovado: {
            label: "Aprovado",
            className: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100",
        },
        reprovado: {
            label: "Reprovado",
            className: "bg-red-50 text-red-600 ring-1 ring-red-100",
        },
        em_analise: {
            label: "Em análise",
            className: "bg-blue-50 text-blue-600 ring-1 ring-blue-100",
        },
        pendente: {
            label: "Pendente",
            className: "bg-amber-50 text-amber-600 ring-1 ring-amber-100",
        },
        nao_iniciado: {
            label: "Não iniciado",
            className: "bg-gray-100 text-gray-600 ring-1 ring-gray-200",
        },
    };

    const atual = config[status ?? ""] ?? config.nao_iniciado;

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${atual.className}`}
        >
            {atual.label}
        </span>
    );
}

/* =========================================================
   PÁGINA
========================================================= */

export default function MotoristaPage({
    usuario: usuarioProp,
    verificacao = null,
}: {
    usuario?: Usuario | null;
    verificacao?: Verificacao | null;
}) {
    const params = useParams();
    const router = useRouter();

    const id = Array.isArray(params?.id)
        ? params.id[0]
        : String(params?.id ?? "");

    const [usuario, setUsuario] =
        useState<Usuario | null>(usuarioProp ?? null);

    const [loading, setLoading] =
        useState(true);

    const [erro, setErro] =
        useState("");

    /* =======================================================
       BUSCAR MOTORISTA
    ======================================================= */

    useEffect(() => {
        if (!id) {
            setErro("ID do motorista não informado.");
            setLoading(false);
            return;
        }

        let ativo = true;

        async function carregarUsuario() {
            try {
                setLoading(true);
                setErro("");

                /*
                 * IMPORTANTE:
                 *
                 * Aqui estamos buscando os dados da API.
                 * A página NÃO é /api/usuarios.
                 *
                 * A URL da página é:
                 *
                 * /visualizacao/motoristas/[id]
                 *
                 * A API é:
                 *
                 * /api/usuarios/[id]
                 */

                const response = await fetch(
                    `/api/usuarios/${encodeURIComponent(id)}`,
                    {
                        method: "GET",
                        cache: "no-store",
                        headers: {
                            Accept: "application/json",
                        },
                    }
                );

                const texto = await response.text();

                let data: ApiResponse = {};

                if (texto) {
                    try {
                        data = JSON.parse(texto);
                    } catch {
                        throw new Error(
                            `A API não retornou JSON. Status: ${response.status}.`
                        );
                    }
                }

                if (!response.ok) {
                    throw new Error(
                        data.error ||
                        data.message ||
                        `Erro ${response.status} ao buscar motorista.`
                    );
                }

                const encontrado =
                    data.usuario ??
                    data.data ??
                    data.user;

                if (!encontrado) {
                    throw new Error(
                        "A API não enviou os dados do motorista."
                    );
                }

                if (ativo) {
                    setUsuario(encontrado);
                }
            } catch (error) {
                if (ativo) {
                    setErro(
                        error instanceof Error
                            ? error.message
                            : "Erro ao carregar motorista."
                    );
                }
            } finally {
                if (ativo) {
                    setLoading(false);
                }
            }
        }

        carregarUsuario();

        return () => {
            ativo = false;
        };
    }, [id]);

    /* =======================================================
       LOADING
    ======================================================= */

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
                <div className="flex h-[400px] w-[550px] max-w-full flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white shadow-sm">
                    <div className="text-center">
                        <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-[5px] border-gray-200 border-t-emerald-500" />

                        <p className="text-sm font-medium text-gray-500">
                            Carregando motorista...
                        </p>
                    </div>
                </div>
            </main>
        );
    }

    /* =======================================================
       ERRO
    ======================================================= */

    if (erro || !usuario) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
                <div className="w-[550px] max-w-full">
                    <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

                        <div className="mb-6 flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                                <UserRound
                                    size={30}
                                    className="text-red-500"
                                />
                            </div>
                        </div>

                        <div className="text-center">
                            <h1 className="text-xl font-bold text-gray-900">
                                Não foi possível visualizar o motorista
                            </h1>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                                Ocorreu um problema ao carregar
                                os dados deste motorista.
                            </p>

                            {erro && (
                                <div className="mt-5 rounded-lg border border-red-100 bg-red-50 px-4 py-3 text-left">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-red-500">
                                        Detalhes do erro
                                    </p>

                                    <p className="mt-1 break-words text-sm text-red-700">
                                        {erro}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="mt-7 flex justify-center">
                            <button
                                type="button"
                                onClick={() => router.back()}
                                className="flex h-10 items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                            >
                                <ArrowLeft size={16} />
                                Voltar
                            </button>
                        </div>

                    </div>
                </div>
            </main>
        );
    }

    /* =======================================================
       DADOS
    ======================================================= */

    const nome = getNome(usuario);

    const telefone =
        getTelefone(usuario);

    const email =
        getEmail(usuario);

    const foto =
        getFoto(usuario);

    const bloqueado =
        estaBloqueado(usuario);

    const rating = numero(
        usuario.rating ??
        usuario.avaliacao
    );

    const servico =
        usuario.servico ||
        usuario.service ||
        "Ride Request, Parcel (Capacity-Unlimited)";

    const localizacao =
        usuario.cidade ||
            usuario.estado
            ? `${usuario.cidade || ""}${usuario.cidade &&
                usuario.estado
                ? " - "
                : ""
            }${usuario.estado || ""}`
            : "—";

    /* =======================================================
       HTML
    ======================================================= */

    return (
        <main className="min-h-screen p-4 md:p-6">

            {/* HEADER */}

            <div className="mx-auto mb-4 flex w-full max-w-[1536px] flex-wrap items-center justify-between gap-3">

                <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/80">
                        MOTORISTA
                    </p>

                    <h1 className="text-2xl font-bold text-gray-900">
                        Driver #{usuario.id}
                    </h1>
                </div>

                <div className="flex flex-wrap items-center gap-2">

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                        <ArrowLeft size={16} />
                        Voltar
                    </button>

                    <button
                        type="button"
                        className="flex h-9 items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 text-sm font-medium text-red-500 transition hover:bg-red-100"
                    >
                        <Trash2 size={16} />
                        Delete
                    </button>

                    <button
                        type="button"
                        className="flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                    >
                        <Clock3 size={16} />
                        Activity log
                    </button>

                    <Status
                        bloqueado={bloqueado}
                    />

                    <button
                        type="button"
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                        Suspend Driver
                    </button>

                    <button
                        type="button"
                        className="flex h-9 items-center gap-2 rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                        <Edit3 size={16} />
                        Edit
                    </button>

                </div>
            </div>

            {/* DRIVER INFORMATION */}

            <section className="mx-auto mt-6 w-full max-w-[1536px] rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
                <Title
                    icon={<UserRound size={19} />}
                    title="Driver Information"
                />

                <div className="flex flex-col gap-6 md:flex-row">

                    <Avatar
                        nome={nome}
                        foto={foto}
                    />

                    <div className="min-w-0 flex-1">

                        <div className="mb-3 flex flex-wrap items-center gap-3">

                            <h2 className="text-xl font-bold text-gray-900">
                                {nome}
                            </h2>

                            <span
                                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${bloqueado
                                        ? "bg-red-50 text-red-600"
                                        : "bg-emerald-50 text-emerald-600"
                                    }`}
                            >
                                {bloqueado ? (
                                    <>
                                        <Lock size={13} />
                                        Bloqueado
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle2 size={13} />
                                        Ativo
                                    </>
                                )}
                            </span>

                        </div>

                        <div className="mb-4 flex items-center gap-3">

                            <span className="rounded-md bg-emerald-500 px-2 py-1 text-xs font-semibold text-white">
                                No Level Found
                            </span>

                            <span className="text-sm font-medium text-gray-600">
                                {rating.toFixed(1)}
                            </span>

                            <Star
                                size={17}
                                className="fill-orange-400 text-orange-400"
                            />

                        </div>

                        <div className="grid grid-cols-1 gap-3 text-sm text-gray-700">

                            <InfoLine
                                icon={<Phone size={16} />}
                                value={formatarTelefone(telefone)}
                            />

                            <InfoLine
                                icon={<Mail size={16} />}
                                value={email}
                            />

                            <InfoLine
                                icon={<UserRound size={16} />}
                                value={servico}
                            />

                            {usuario.ref_code && (
                                <InfoLine
                                    icon={<FileText size={16} />}
                                    value={`Ref. Code: ${usuario.ref_code}`}
                                />
                            )}

                            <InfoLine
                                icon={<Clock3 size={16} />}
                                value={`Cadastro: ${formatarData(
                                    usuario.created_at
                                )}`}
                            />

                        </div>

                    </div>

                </div>

            </section>

            {/* DRIVER RATE + DETAILS */}

            <section className="mx-auto mt-6 w-full max-w-[1536px] rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">

                    {/* RATE */}

                    <div>

                        <Title
                            icon={<UserRound size={19} />}
                            title="Driver rate info"
                        />

                        <div className="mb-7 flex items-center gap-3">

                            <span className="whitespace-nowrap text-sm font-medium text-emerald-500">
                                Average Active Rate/Day
                            </span>

                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                                <div
                                    className="h-full rounded-full bg-emerald-400"
                                    style={{ width: "0%" }}
                                />
                            </div>

                            <span className="text-xs font-medium text-emerald-500">
                                0%
                            </span>

                        </div>

                        <div className="rounded-xl border border-gray-200 p-5">

                            <div className="grid grid-cols-2 gap-6 md:grid-cols-5">

                                <Circle
                                    value="0 R$"
                                    label="Avg. earning value"
                                />

                                <Circle
                                    value="0%"
                                    label="Positive Review Rate"
                                    blue
                                />

                                <Circle
                                    value="0%"
                                    label="Success Rate"
                                />

                                <Circle
                                    value="0%"
                                    label="Cancellation Rate"
                                    red
                                />

                                <Circle
                                    value="0%"
                                    label="Today Idle Hour Rate"
                                    orange
                                />

                            </div>

                        </div>

                    </div>

                    {/* DETAILS */}

                    <div>

                        <Title
                            icon={<UserRound size={19} />}
                            title="Driver Details"
                        />

                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                            <Card
                                icon={<Phone size={19} />}
                                title="Telefone"
                                value={formatarTelefone(telefone)}
                            />

                            <Card
                                icon={<Mail size={19} />}
                                title="E-mail"
                                value={email}
                            />

                            <Card
                                icon={<Clock3 size={19} />}
                                title="Cadastro"
                                value={formatarData(
                                    usuario.created_at
                                )}
                            />

                            <Card
                                icon={<MapPin size={19} />}
                                title="Localização"
                                value={localizacao}
                            />

                        </div>

                    </div>

                </div>

            </section>

            {/* VERIFICAÇÃO */}

            <section className="mx-auto mt-6 w-full max-w-[1536px] rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">

                <Title
                    icon={<ShieldCheck size={19} />}
                    title="Verificação"
                />

                {verificacao?.documento || verificacao?.prova_vida ? (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                        {verificacao.documento && (
                            <div className="rounded-xl border border-gray-200 p-5">

                                <div className="mb-4 flex items-center justify-between gap-3">

                                    <span className="text-sm font-semibold text-gray-900">
                                        Documento
                                    </span>

                                    <StatusBadgeVerificacao
                                        status={verificacao.documento.status}
                                    />

                                </div>

                                <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 sm:grid-cols-2">

                                    <InfoLine
                                        icon={<FileText size={16} />}
                                        value={`Didit: ${
                                            verificacao.documento.didit_status ||
                                            "—"
                                        }`}
                                    />

                                    <InfoLine
                                        icon={<BadgeCheck size={16} />}
                                        value={`Verificado: ${
                                            verificacao.documento.is_verified
                                                ? "Sim"
                                                : "Não"
                                        }`}
                                    />

                                    {verificacao.documento.documento_tipo && (
                                        <div className="flex min-w-0 items-center gap-3 sm:col-span-2">

                                            <span className="shrink-0 text-gray-400">
                                                <CreditCard size={16} />
                                            </span>

                                            <span className="truncate text-sm text-gray-700">
                                                Tipo de documento:{" "}
                                                {formatarTipoDocumento(
                                                    verificacao.documento.documento_tipo
                                                )}
                                            </span>

                                        </div>
                                    )}

                                </div>

                            </div>
                        )}

                        {verificacao.prova_vida && (
                            <div className="rounded-xl border border-gray-200 p-5">

                                <div className="mb-4 flex items-center justify-between gap-3">

                                    <span className="text-sm font-semibold text-gray-900">
                                        Prova de vida
                                    </span>

                                    <span
                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                            verificacao.prova_vida.devida
                                                ? "bg-red-50 text-red-600 ring-1 ring-red-100"
                                                : "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100"
                                        }`}
                                    >
                                        {verificacao.prova_vida.devida ? (
                                            <>
                                                <AlertTriangle size={13} />
                                                Devida
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle2 size={13} />
                                                Em dia
                                            </>
                                        )}
                                    </span>

                                </div>

                                <div className="grid grid-cols-1 gap-3 text-sm text-gray-700">

                                    <InfoLine
                                        icon={<Clock3 size={16} />}
                                        value={`Última prova: ${formatarData(
                                            verificacao.prova_vida.last_liveness_at
                                        )}`}
                                    />

                                </div>

                            </div>
                        )}

                    </div>
                ) : (
                    <p className="text-sm text-gray-500">
                        Nenhuma verificação cadastrada para este motorista.
                    </p>
                )}

            </section>

        </main>
    );
}

/* =========================================================
   STATUS
========================================================= */

function Status({
    bloqueado,
}: {
    bloqueado: boolean;
}) {
    return (
        <div className="flex h-9 items-center gap-3 rounded-md border border-gray-300 bg-white px-3">

            <span className="text-sm text-gray-700">
                Status
            </span>

            <div
                className={`relative h-6 w-11 rounded-full ${bloqueado
                        ? "bg-gray-300"
                        : "bg-emerald-500"
                    }`}
            >
                <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white shadow ${bloqueado
                            ? "left-1"
                            : "left-6"
                        }`}
                />
            </div>

            <span
                className={`text-xs font-medium ${bloqueado
                        ? "text-red-500"
                        : "text-emerald-600"
                    }`}
            >
                {bloqueado
                    ? "Bloqueado"
                    : "Ativo"}
            </span>

        </div>
    );
}

/* =========================================================
   AVATAR
========================================================= */

function Avatar({
    nome,
    foto,
}: {
    nome: string;
    foto: string;
}) {
    const iniciais = nome
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((item) => item[0])
        .join("")
        .toUpperCase();

    if (foto) {
        return (
            <div className="h-36 w-36 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                <img
                    src={foto}
                    alt={nome}
                    className="h-full w-full object-cover"
                />
            </div>
        );
    }

    return (
        <div className="flex h-36 w-36 shrink-0 items-center justify-center rounded-xl bg-gray-100">

            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-500">

                {iniciais || (
                    <UserRound size={38} />
                )}

            </div>

        </div>
    );
}

/* =========================================================
   TITLE
========================================================= */

function Title({
    icon,
    title,
}: {
    icon: ReactNode;
    title: string;
}) {
    return (
        <div className="mb-6 flex items-center gap-2 text-emerald-600">

            {icon}

            <h2 className="font-semibold text-gray-900">
                {title}
            </h2>

        </div>
    );
}

/* =========================================================
   INFO LINE
========================================================= */

function InfoLine({
    icon,
    value,
}: {
    icon: ReactNode;
    value: string;
}) {
    return (
        <div className="flex min-w-0 items-center gap-3">

            <span className="shrink-0 text-gray-400">
                {icon}
            </span>

            <span className="truncate text-sm text-gray-700">
                {value}
            </span>

        </div>
    );
}

/* =========================================================
   CIRCLE
========================================================= */

function Circle({
    value,
    label,
    blue = false,
    red = false,
    orange = false,
}: {
    value: string;
    label: string;
    blue?: boolean;
    red?: boolean;
    orange?: boolean;
}) {
    const classe = red
        ? "text-red-500"
        : orange
            ? "text-orange-500"
            : blue
                ? "text-blue-500"
                : "text-emerald-500";

    return (
        <div className="text-center">

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border-[6px] border-gray-100">

                <span
                    className={`text-xs font-semibold ${classe}`}
                >
                    {value}
                </span>

            </div>

            <p
                className={`text-xs font-medium ${classe}`}
            >
                {label}
            </p>

        </div>
    );
}

/* =========================================================
   CARD
========================================================= */

function Card({
    icon,
    title,
    value,
    className = "",
}: {
    icon: ReactNode;
    title: string;
    value: string;
    className?: string;
}) {
    return (
        <div
            className={`rounded-xl border border-gray-200 bg-white p-5 transition hover:border-emerald-200 hover:shadow-sm ${className}`}
        >

            <div className="mb-3 flex items-center gap-2 text-emerald-600">

                {icon}

                <span className="text-sm font-semibold text-gray-900">
                    {title}
                </span>

            </div>

            <p className="break-words text-sm text-gray-700">
                {value}
            </p>

        </div>
    );
}
