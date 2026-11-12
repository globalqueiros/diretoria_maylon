"use client";

import { useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import {
    ArrowLeft,
    Camera,
    Check,
    ChevronRight,
    Copy,
    Mail,
    Phone,
    RefreshCw,
    TriangleAlert,
    Upload,
    X,
} from "lucide-react";

type Usuario = {
    matricula: number | string;
    full_name?: string | null;
    email?: string | null;
    phone?: string | null;
    profile_image?: string | null;
    user_type?: string | null;
    status?: string | null;
};

const VOLTAR_HREF = "/diretor/colaboradores";
const NAO_INFORMADO = "Não informado";

/* ==================== HELPERS ==================== */

function iniciais(nome?: string | null) {
    if (!nome) return "?";
    const partes = nome.trim().split(/\s+/).filter(Boolean);
    if (partes.length === 0) return "?";
    if (partes.length === 1) return partes[0][0].toUpperCase();
    return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function formatarTelefone(valor?: string | null) {
    if (!valor) return null;
    const d = valor.replace(/\D/g, "");
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return valor;
}

function capitalizar(valor?: string | null) {
    if (!valor) return null;
    return valor.charAt(0).toUpperCase() + valor.slice(1).toLowerCase();
}

/* ==================== PÁGINA ==================== */

export default function DetalhesColaborador() {
    const params = useParams();

    // Aceita [matricula], [id], [slug] ou qualquer outro nome de pasta dinâmica
    const bruto =
        params?.matricula ??
        params?.id ??
        params?.slug ??
        Object.values(params ?? {})[0];

    const matricula = Array.isArray(bruto) ? bruto[0] : bruto;

    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState<string | null>(null);
    const [imagemFalhou, setImagemFalhou] = useState(false);
    const [tentativa, setTentativa] = useState(0);
    const [modalFoto, setModalFoto] = useState(false);

    useEffect(() => {
        if (!matricula) {
            setErro(
                "Matrícula não informada na URL. Confira se a pasta da rota se chama [matricula] e se o link da lista inclui a matrícula."
            );
            setLoading(false);
            return;
        }

        let ativo = true;

        async function carregarColaborador() {
            try {
                setLoading(true);
                setErro(null);
                setImagemFalhou(false);

                const response = await fetch(
                    `/api/users/${encodeURIComponent(String(matricula))}`,
                    {
                        method: "GET",
                        cache: "no-store",
                        headers: { Accept: "application/json" },
                    }
                );

                const texto = await response.text();

                let data: any = null;

                if (texto) {
                    try {
                        data = JSON.parse(texto);
                    } catch {
                        throw new Error(
                            `A API não retornou JSON (status ${response.status}). Verifique se a rota /api/users/[matricula] existe.`
                        );
                    }
                }

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                            data?.error ||
                            (response.status === 404
                                ? "Colaborador não encontrado."
                                : `Erro ${response.status} ao carregar o colaborador.`)
                    );
                }

                // Aceita {…}, { usuario }, { user } ou { data }
                const encontrado: Usuario | null =
                    data?.usuario ?? data?.user ?? data?.data ?? data;

                if (!encontrado || typeof encontrado !== "object") {
                    throw new Error("A API não enviou os dados do colaborador.");
                }

                if (ativo) setUsuario(encontrado);
            } catch (error) {
                console.error("Erro ao carregar colaborador:", error);

                if (!ativo) return;

                setUsuario(null);
                setErro(
                    error instanceof Error
                        ? error.message
                        : "Erro ao carregar colaborador."
                );
            } finally {
                if (ativo) setLoading(false);
            }
        }

        carregarColaborador();

        return () => {
            ativo = false;
        };
    }, [matricula, tentativa]);

    /* ==================== LOADING ==================== */

    if (loading) {
        return (
            <Container>
                <div
                    className="animate-pulse"
                    aria-busy="true"
                    aria-label="Carregando colaborador"
                >
                    <div className="mb-6 h-4 w-64 rounded bg-slate-200" />

                    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                        <div className="flex items-center gap-5">
                            <div className="h-20 w-20 rounded-full bg-slate-200" />
                            <div className="space-y-3">
                                <div className="h-5 w-56 rounded bg-slate-200" />
                                <div className="h-4 w-36 rounded bg-slate-100" />
                            </div>
                        </div>
                    </div>

                    <div className="mt-6 grid gap-6 lg:grid-cols-3">
                        <div className="h-64 rounded-xl border border-slate-200 bg-white lg:col-span-2" />
                        <div className="h-64 rounded-xl border border-slate-200 bg-white" />
                    </div>
                </div>
            </Container>
        );
    }

    /* ==================== ERRO ==================== */

    if (erro || !usuario) {
        return (
            <Container>
                <Link
                    href={VOLTAR_HREF}
                    className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para colaboradores
                </Link>

                <div
                    role="alert"
                    className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm"
                >
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
                        <TriangleAlert className="h-6 w-6" />
                    </div>

                    <h1 className="mt-4 text-lg font-semibold text-slate-900">
                        Não foi possível abrir o colaborador
                    </h1>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600">
                        {erro || "Não foi possível carregar os dados."}
                    </p>

                    <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
                        {matricula && (
                            <button
                                type="button"
                                onClick={() => setTentativa((n) => n + 1)}
                                className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Tentar novamente
                            </button>
                        )}

                        <Link
                            href={VOLTAR_HREF}
                            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Voltar para colaboradores
                        </Link>
                    </div>
                </div>
            </Container>
        );
    }

    /* ==================== CONTEÚDO ==================== */

    const status = usuario.status || "Ativo";
    const statusNormalizado = status.toLowerCase();
    const statusAtivo =
        statusNormalizado === "ativo" || statusNormalizado === "active";

    const nome = usuario.full_name || "Colaborador";
    const matriculaExibida = String(usuario.matricula ?? matricula ?? "—");
    const telefone = formatarTelefone(usuario.phone);
    const perfil = capitalizar(usuario.user_type);
    const mostrarFoto = !!usuario.profile_image && !imagemFalhou;

    return (
        <Container>
            <header className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-5">
                        <button
                            type="button"
                            onClick={() => setModalFoto(true)}
                            aria-label="Ver ou trocar foto do colaborador"
                            className="group relative shrink-0 cursor-pointer rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                        >
                            {mostrarFoto ? (
                                <img
                                    src={usuario.profile_image as string}
                                    alt={`Foto de ${nome}`}
                                    onError={() => setImagemFalhou(true)}
                                    className="h-20 w-20 rounded-full border border-slate-200 object-cover"
                                />
                            ) : (
                                <div
                                    aria-hidden="true"
                                    className="flex h-20 w-20 items-center justify-center rounded-full bg-teal-700 text-2xl font-semibold tracking-wide text-white"
                                >
                                    {iniciais(usuario.full_name)}
                                </div>
                            )}

                            <span className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm transition group-hover:text-teal-700">
                                <Camera className="h-3.5 w-3.5" />
                            </span>
                        </button>

                        <div className="min-w-0">
                            <h1 className="truncate text-2xl font-semibold text-slate-900">
                                {nome}
                            </h1>

                            <p className="mt-1 text-sm text-slate-600">
                                {perfil ? `${perfil} · ` : ""}Matrícula{" "}
                                <span className="font-medium tabular-nums text-slate-800">
                                    {matriculaExibida}
                                </span>
                            </p>

                            <span
                                className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
                                    statusAtivo
                                        ? "bg-emerald-50 text-emerald-800 ring-emerald-600/20"
                                        : "bg-slate-100 text-slate-700 ring-slate-500/20"
                                }`}
                            >
                                <span
                                    aria-hidden="true"
                                    className={`h-1.5 w-1.5 rounded-full ${
                                        statusAtivo ? "bg-emerald-500" : "bg-slate-400"
                                    }`}
                                />
                                {status}
                            </span>
                        </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-2">
                        {usuario.email && (
                            <a
                                href={`mailto:${usuario.email}`}
                                className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2"
                            >
                                <Mail className="h-4 w-4" />
                                Enviar e-mail
                            </a>
                        )}

                        {usuario.phone && (
                            <a
                                href={`tel:${usuario.phone.replace(/[^\d+]/g, "")}`}
                                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                            >
                                <Phone className="h-4 w-4" />
                                Ligar
                            </a>
                        )}
                    </div>
                </div>
            </header>

            {/* Detalhes */}
            <div className="mt-6 grid gap-6 lg:grid-cols-3">
                <Secao titulo="Dados do colaborador" className="lg:col-span-2">
                    <dl className="divide-y divide-slate-100">
                        <Linha
                            rotulo="Nome completo"
                            valor={usuario.full_name}
                        />
                        <Linha
                            rotulo="Matrícula"
                            valor={matriculaExibida}
                            copiavel
                            tabular
                        />
                        <Linha rotulo="Perfil de acesso" valor={perfil} />
                        <Linha
                            rotulo="E-mail"
                            valor={usuario.email}
                            copiavel
                            href={usuario.email ? `mailto:${usuario.email}` : undefined}
                        />
                        <Linha
                            rotulo="Telefone"
                            valor={telefone}
                            copiavel
                            tabular
                            href={
                                usuario.phone
                                    ? `tel:${usuario.phone.replace(/[^\d+]/g, "")}`
                                    : undefined
                            }
                        />
                    </dl>
                </Secao>

                <Secao titulo="Situação do cadastro">
                    <div className="p-5">
                        <div
                            className={`rounded-lg border p-4 ${
                                statusAtivo
                                    ? "border-emerald-200 bg-emerald-50"
                                    : "border-slate-200 bg-slate-50"
                            }`}
                        >
                            <p className="text-sm text-slate-600">Status atual</p>
                            <p
                                className={`mt-1 text-lg font-semibold ${
                                    statusAtivo ? "text-emerald-800" : "text-slate-800"
                                }`}
                            >
                                {status}
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-slate-600">
                                {statusAtivo
                                    ? "O colaborador está com o cadastro ativo e pode acessar o sistema."
                                    : "O cadastro deste colaborador não está ativo."}
                            </p>
                        </div>
                    </div>
                </Secao>
            </div>

            <div className="mt-8">
                <Link
                    href={VOLTAR_HREF}
                    className="inline-flex items-center gap-2 rounded text-sm font-medium text-slate-600 transition hover:text-teal-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para colaboradores
                </Link>
            </div>

            {modalFoto && (
                <ModalFoto
                    nome={nome}
                    imagemAtual={mostrarFoto ? (usuario.profile_image as string) : null}
                    iniciaisTexto={iniciais(usuario.full_name)}
                    matricula={String(matricula ?? usuario.matricula)}
                    onFechar={() => setModalFoto(false)}
                    onSucesso={(url) => {
                        setUsuario((atual) =>
                            atual ? { ...atual, profile_image: url } : atual
                        );
                        setImagemFalhou(false);
                        setModalFoto(false);
                    }}
                />
            )}
        </Container>
    );
}

/* ==================== COMPONENTES ==================== */

function Container({ children }: { children: ReactNode }) {
    return (
        <div className="min-h-screen">
            <div className="mx-auto w-full max-w-8xl">{children}</div>
        </div>
    );
}

function Secao({
    titulo,
    children,
    className = "",
}: {
    titulo: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section
            className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}
        >
            <div className="border-b border-slate-200 px-5 py-4">
                <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
            </div>
            {children}
        </section>
    );
}

function Linha({
    rotulo,
    valor,
    copiavel = false,
    tabular = false,
    href,
}: {
    rotulo: string;
    valor?: string | null;
    copiavel?: boolean;
    tabular?: boolean;
    href?: string;
}) {
    const [copiado, setCopiado] = useState(false);
    const preenchido = !!valor;

    const copiar = useCallback(async () => {
        if (!valor) return;
        try {
            await navigator.clipboard.writeText(valor);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1800);
        } catch {
            /* clipboard indisponível: ignora */
        }
    }, [valor]);

    return (
        <div className="grid grid-cols-1 gap-1 px-5 py-4 sm:grid-cols-3 sm:items-center sm:gap-4">
            <dt className="text-sm text-slate-500">{rotulo}</dt>

            <dd className="flex min-w-0 items-center justify-between gap-3 sm:col-span-2">
                {preenchido ? (
                    href ? (
                        <a
                            href={href}
                            className={`min-w-0 truncate text-sm font-medium text-teal-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 ${
                                tabular ? "tabular-nums" : ""
                            }`}
                        >
                            {valor}
                        </a>
                    ) : (
                        <span
                            className={`min-w-0 break-words text-sm font-medium text-slate-900 ${
                                tabular ? "tabular-nums" : ""
                            }`}
                        >
                            {valor}
                        </span>
                    )
                ) : (
                    <span className="text-sm italic text-slate-400">
                        {NAO_INFORMADO}
                    </span>
                )}

                {copiavel && preenchido && (
                    <button
                        type="button"
                        onClick={copiar}
                        aria-label={`Copiar ${rotulo.toLowerCase()}`}
                        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
                    >
                        {copiado ? (
                            <>
                                <Check className="h-3.5 w-3.5 text-emerald-600" />
                                Copiado
                            </>
                        ) : (
                            <>
                                <Copy className="h-3.5 w-3.5" />
                                Copiar
                            </>
                        )}
                    </button>
                )}
            </dd>
        </div>
    );
}


/* ==================== MODAL DA FOTO ==================== */

const TIPOS_ACEITOS = ["image/jpeg", "image/png", "image/webp"];
const TAMANHO_MAXIMO = 5 * 1024 * 1024; // 5 MB

function ModalFoto({
    nome,
    imagemAtual,
    iniciaisTexto,
    matricula,
    onFechar,
    onSucesso,
}: {
    nome: string;
    imagemAtual: string | null;
    iniciaisTexto: string;
    matricula: string;
    onFechar: () => void;
    onSucesso: (novaUrl: string) => void;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [arquivo, setArquivo] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    // Esc fecha o modal e trava o scroll da página
    useEffect(() => {
        function aoTeclar(e: KeyboardEvent) {
            if (e.key === "Escape" && !enviando) onFechar();
        }
        document.addEventListener("keydown", aoTeclar);
        const overflowAnterior = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        return () => {
            document.removeEventListener("keydown", aoTeclar);
            document.body.style.overflow = overflowAnterior;
        };
    }, [enviando, onFechar]);

    // Libera a memória da pré-visualização
    useEffect(() => {
        return () => {
            if (previewUrl) URL.revokeObjectURL(previewUrl);
        };
    }, [previewUrl]);

    function escolherArquivo(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        e.target.value = "";
        if (!file) return;

        if (!TIPOS_ACEITOS.includes(file.type)) {
            setErro("Formato inválido. Envie uma imagem JPG, PNG ou WebP.");
            return;
        }

        if (file.size > TAMANHO_MAXIMO) {
            setErro("A imagem é muito grande. O tamanho máximo é 5 MB.");
            return;
        }

        setErro(null);
        setArquivo(file);
        setPreviewUrl(URL.createObjectURL(file));
    }

    async function salvar() {
        if (!arquivo) return;

        try {
            setEnviando(true);
            setErro(null);

            const formData = new FormData();
            formData.append("file", arquivo);

            const response = await fetch(
                `/api/users/${encodeURIComponent(matricula)}/photo`,
                { method: "POST", body: formData }
            );

            const data = await response.json().catch(() => null);

            if (!response.ok || !data?.profile_image) {
                throw new Error(
                    data?.error ||
                        data?.message ||
                        `Erro ${response.status} ao enviar a foto.`
                );
            }

            onSucesso(data.profile_image);
        } catch (error) {
            setErro(
                error instanceof Error ? error.message : "Erro ao enviar a foto."
            );
        } finally {
            setEnviando(false);
        }
    }

    const exibida = previewUrl ?? imagemAtual;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !enviando) onFechar();
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="titulo-modal-foto"
                className="w-full max-w-lg rounded-xl bg-white shadow-xl"
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <h2
                        id="titulo-modal-foto"
                        className="text-base font-semibold text-slate-900"
                    >
                        Foto de {nome}
                    </h2>

                    <button
                        type="button"
                        onClick={onFechar}
                        disabled={enviando}
                        aria-label="Fechar"
                        autoFocus
                        className="cursor-pointer rounded-md p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="px-5 py-6">
                    {/* Foto em 50% da largura do modal */}
                    <div className="mx-auto aspect-square w-1/2 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        {exibida ? (
                            <img
                                src={exibida}
                                alt={`Foto de ${nome}`}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <div className="flex h-full w-full items-center justify-center bg-teal-700 text-5xl font-semibold text-white">
                                {iniciaisTexto}
                            </div>
                        )}
                    </div>

                    <p className="mt-4 text-center text-sm text-slate-600">
                        {arquivo
                            ? "Confira a nova foto e clique em Salvar foto."
                            : "Formatos JPG, PNG ou WebP, até 5 MB."}
                    </p>

                    {erro && (
                        <p
                            role="alert"
                            className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700"
                        >
                            {erro}
                        </p>
                    )}

                    <input
                        ref={inputRef}
                        type="file"
                        accept={TIPOS_ACEITOS.join(",")}
                        onChange={escolherArquivo}
                        className="hidden"
                    />
                </div>

                <div className="flex flex-col-reverse gap-2 border-t border-slate-200 px-5 py-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={() => inputRef.current?.click()}
                        disabled={enviando}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <Upload className="h-4 w-4" />
                        {arquivo ? "Escolher outra" : "Trocar foto"}
                    </button>

                    {arquivo && (
                        <button
                            type="button"
                            onClick={salvar}
                            disabled={enviando}
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {enviando ? (
                                <>
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                    Salvando…
                                </>
                            ) : (
                                <>
                                    <Check className="h-4 w-4" />
                                    Salvar foto
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}