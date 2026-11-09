"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
    type ReactNode,
} from "react";
import {
    AlertCircle,
    BadgeCheck,
    BriefcaseBusiness,
    CalendarClock,
    Camera,
    CalendarDays,
    Check,
    CheckCircle2,
    ChevronRight,
    Copy,
    ExternalLink,
    Eye,
    EyeOff,
    Fingerprint,
    KeyRound,
    LoaderCircle,
    LockKeyhole,
    Mail,
    Monitor,
    Phone,
    Save,
    ShieldCheck,
    Timer,
    UserRound,
    Video,
    X,
    XCircle,
} from "lucide-react";

interface Perfil {
    matricula: string;
    id: number | string;
    full_name: string;
    first_name: string;
    last_name: string;
    avatar: string;
    email: string;
    phone: string;
    user_type: string;
    created_at: string | null;
    email_verified: boolean;
    phone_verified: boolean;
}

interface Reuniao {
    id: number;
    topic: string;
    agenda?: string | null;
    start_time: string;
    duration?: number | null;
    timezone?: string | null;
    join_url?: string | null;
    password?: string | null;
    status?: string | null;
}

type Alerta = { tipo: "success" | "danger"; texto: string };
type Canal = "email" | "telefone";

const TIPOS: Record<string, string> = {
    gerente: "Gerente",
    driver: "Motorista",
    customer: "Passageiro",
    atendente: "Atendente",
    admin: "Administrador",
    promotor: "Promotor",
};

const CHAVES_AVATAR = [
    "avatar",
    "avatar_url",
    "avatarUrl",
    "foto",
    "foto_url",
    "photo",
    "photo_url",
    "profile_image",
    "profile_picture",
    "picture",
    "image",
    "imagem",
    "url",
];

const TAMANHO_MAX_FOTO = 5 * 1024 * 1024; // 5 MB

/* ───────────── Helpers ───────────── */

function nomeDoPerfil(perfil: Perfil | null) {
    if (!perfil) return "";
    return (
        perfil.full_name?.trim() ||
        `${perfil.first_name} ${perfil.last_name}`.trim()
    );
}

function iniciais(perfil: Perfil | null) {
    if (!perfil) return "?";
    const partes = nomeDoPerfil(perfil).split(/\s+/).filter(Boolean);
    if (partes.length === 0) return "?";
    const n = partes[0].charAt(0);
    const s = partes.length > 1 ? partes[partes.length - 1].charAt(0) : "";
    return (n + s).toUpperCase() || "?";
}

// Verdadeiro se QUALQUER valor indicar verificação
// (true, 1, "sim", "true" ou uma data ISO de verificação)
function paraBool(...valores: unknown[]) {
    for (const v of valores) {
        if (v === undefined || v === null || v === "") continue;
        if (typeof v === "boolean") {
            if (v) return true;
            continue;
        }
        if (typeof v === "number") {
            if (v === 1) return true;
            continue;
        }
        const s = String(v).trim().toLowerCase();
        if (["1", "true", "sim", "yes"].includes(s)) return true;
        if (/^\d{4}-\d{2}-\d{2}/.test(s)) return true; // data ISO
    }
    return false;
}

// Desembrulha respostas do tipo { user: {...} }, { data: {...} }, { perfil: {...} }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function desembrulhar(raw: any): Record<string, any> {
    let atual = raw;
    for (let i = 0; i < 3; i++) {
        if (!atual || typeof atual !== "object" || Array.isArray(atual)) break;
        const proximo = atual.user ?? atual.perfil ?? atual.profile ?? atual.data;
        if (proximo && typeof proximo === "object" && !Array.isArray(proximo)) {
            atual = proximo;
        } else {
            break;
        }
    }
    return atual && typeof atual === "object" ? atual : {};
}

// Retorna o primeiro valor preenchido entre as chaves informadas
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function pegar(obj: Record<string, any>, ...chaves: string[]) {
    for (const k of chaves) {
        const v = obj[k];
        if (v !== undefined && v !== null && String(v).trim() !== "") return v;
    }
    return undefined;
}

function gerarMatricula(id: unknown) {
    const valor = String(id ?? "").trim();
    return valor ? `MAY-${valor.padStart(6, "0")}` : "";
}

function formatarData(data: string | null) {
    if (!data) return "Não informado";
    const d = new Date(data);
    if (Number.isNaN(d.getTime())) return "Não informado";
    return d.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

function formatarDataHora(data: string) {
    const d = new Date(data);
    if (Number.isNaN(d.getTime())) return "Data não informada";
    const dia = d.toLocaleDateString("pt-BR", {
        weekday: "short",
        day: "2-digit",
        month: "short",
    });
    const hora = d.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
    });
    return `${dia} às ${hora}`;
}

function tempoDeCasa(data: string | null) {
    if (!data) return "—";
    const inicio = new Date(data);
    if (Number.isNaN(inicio.getTime())) return "—";

    const hoje = new Date();
    let meses =
        (hoje.getFullYear() - inicio.getFullYear()) * 12 +
        (hoje.getMonth() - inicio.getMonth());
    if (hoje.getDate() < inicio.getDate()) meses -= 1;
    if (meses < 1) return "Menos de 1 mês";

    const anos = Math.floor(meses / 12);
    const resto = meses % 12;
    const partes: string[] = [];
    if (anos) partes.push(`${anos} ${anos === 1 ? "ano" : "anos"}`);
    if (resto) partes.push(`${resto} ${resto === 1 ? "mês" : "meses"}`);
    return partes.join(" e ");
}

function formatarTelefone(telefone: string | null | undefined) {
    let numeros = String(telefone ?? "").replace(/\D/g, "");
    if (!numeros) return "";
    if (numeros.startsWith("55") && numeros.length > 11) numeros = numeros.slice(2);
    if (numeros.length === 11)
        return numeros.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    if (numeros.length === 10)
        return numeros.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
    return telefone ?? "";
}

/* ───────────── Página ───────────── */

export default function PerfilPage() {
    const [perfil, setPerfil] = useState<Perfil | null>(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");
    const [alerta, setAlerta] = useState<Alerta | null>(null);

    const [reunioes, setReunioes] = useState<Reuniao[]>([]);
    const [loadingReunioes, setLoadingReunioes] = useState(true);

    const [modalSenha, setModalSenha] = useState(false);
    const [senhaAtual, setSenhaAtual] = useState("");
    const [novaSenha, setNovaSenha] = useState("");
    const [confirmarSenha, setConfirmarSenha] = useState("");
    const [mostrarSenhas, setMostrarSenhas] = useState(false);
    const [salvandoSenha, setSalvandoSenha] = useState(false);
    const [erroSenha, setErroSenha] = useState("");

    const [canalVerif, setCanalVerif] = useState<Canal | null>(null);
    const [codigoVerif, setCodigoVerif] = useState("");
    const [codigoEnviado, setCodigoEnviado] = useState(false);
    const [enviandoCodigo, setEnviandoCodigo] = useState(false);
    const [confirmandoCodigo, setConfirmandoCodigo] = useState(false);
    const [erroVerif, setErroVerif] = useState("");

    const inputFotoRef = useRef<HTMLInputElement>(null);
    const [modalFoto, setModalFoto] = useState(false);
    const [arquivoFoto, setArquivoFoto] = useState<File | null>(null);
    const [previaFoto, setPreviaFoto] = useState("");
    const [salvandoFoto, setSalvandoFoto] = useState(false);
    const [erroFoto, setErroFoto] = useState("");
    const [paginaAtual, setPaginaAtual] = useState(1);
    const ITENS_POR_PAGINA = 5;

    const totalPaginas = Math.ceil(reunioes.length / ITENS_POR_PAGINA);

    const paginaValida = Math.min(
        paginaAtual,
        Math.max(1, totalPaginas)
    );

    const indiceInicial = (paginaValida - 1) * ITENS_POR_PAGINA;

    const reunioesPaginadas = reunioes.slice(
        indiceInicial,
        indiceInicial + ITENS_POR_PAGINA
    );

    const primeiraReuniao = reunioes.length ? indiceInicial + 1 : 0;

    const ultimaReuniao = Math.min(
        indiceInicial + ITENS_POR_PAGINA,
        reunioes.length
    );

    useEffect(() => {
        setPaginaAtual(1);
    }, [reunioes.length]);

    const carregar = useCallback(async (silencioso = false) => {
        try {
            if (!silencioso) setLoading(true);
            setErro("");

            const res = await fetch("/api/me", {
                cache: "no-store",
                credentials: "include",
            });
            const bruto = await res.json().catch(() => null);

            if (!res.ok || !bruto) {
                throw new Error(
                    bruto?.error || `Não foi possível carregar o perfil (${res.status}).`,
                );
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const data: Record<string, any> = { ...desembrulhar(bruto) };

            // Dados complementares: só sobrescreve com valores PREENCHIDOS
            try {
                const resExtra = await fetch("/api/perfil", {
                    cache: "no-store",
                    credentials: "include",
                });
                if (resExtra.ok) {
                    const extraBruto = await resExtra.json().catch(() => null);
                    const extra = desembrulhar(extraBruto);
                    for (const [k, v] of Object.entries(extra)) {
                        if (v !== null && v !== undefined && v !== "") data[k] = v;
                    }
                }
            } catch {
                // usa só os dados de /api/me
            }

            const nomeBruto =
                String(pegar(data, "full_name", "name", "nome", "nome_completo") ?? "").trim();
            const partes = nomeBruto.split(/\s+/).filter(Boolean);

            const primeiroNome = String(
                pegar(data, "first_name", "firstName", "primeiro_nome") ?? partes[0] ?? "",
            );
            const sobrenome = String(
                pegar(data, "last_name", "lastName", "sobrenome") ?? partes.slice(1).join(" "),
            );

            const id = pegar(data, "id", "user_id", "usuario_id") ?? "";

            setPerfil({
                id,
                matricula: String(pegar(data, "matricula", "registration") ?? gerarMatricula(id)),
                full_name: nomeBruto || `${primeiroNome} ${sobrenome}`.trim(),
                first_name: primeiroNome,
                last_name: sobrenome,
                avatar: String(pegar(data, ...CHAVES_AVATAR.filter((k) => k !== "url")) ?? ""),
                email: String(pegar(data, "email", "e_mail") ?? ""),
                phone: String(pegar(data, "phone", "telefone", "celular", "phone_number") ?? ""),
                user_type: String(
                    pegar(data, "user_type", "userType", "role", "tipo", "cargo") ?? "",
                ).toLowerCase(),
                created_at:
                    (pegar(data, "created_at", "createdAt", "criado_em", "data_cadastro") as
                        | string
                        | undefined) ?? null,
                email_verified: paraBool(
                    data.email_verified,
                    data.email_verificado,
                    data.email_verified_at,
                    data.emailVerifiedAt,
                ),
                phone_verified: paraBool(
                    data.phone_verified,
                    data.telefone_verificado,
                    data.phone_verified_at,
                    data.phoneVerifiedAt,
                ),
            });
        } catch (e) {
            if (!silencioso) {
                setPerfil(null);
                setErro(e instanceof Error ? e.message : "Erro ao carregar as informações.");
            }
        } finally {
            setLoading(false);
        }
    }, []);

    const carregarReunioes = useCallback(async () => {
        try {
            setLoadingReunioes(true);
            const res = await fetch("/api/reunioes", {
                cache: "no-store",
                credentials: "include",
            });
            if (!res.ok) throw new Error("Erro ao buscar reuniões.");
            const data = await res.json();
            setReunioes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setReunioes([]);
        } finally {
            setLoadingReunioes(false);
        }
    }, []);

    useEffect(() => {
        void carregar();
        void carregarReunioes();
    }, [carregar, carregarReunioes]);

    function fecharModalSenha() {
        if (salvandoSenha) return;
        setModalSenha(false);
        setSenhaAtual("");
        setNovaSenha("");
        setConfirmarSenha("");
        setMostrarSenhas(false);
        setErroSenha("");
    }

    async function alterarSenha(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setErroSenha("");

        if (!senhaAtual || !novaSenha || !confirmarSenha) {
            setErroSenha("Preencha todos os campos de senha.");
            return;
        }
        if (novaSenha.length < 8) {
            setErroSenha("A nova senha deve ter pelo menos 8 caracteres.");
            return;
        }
        if (novaSenha !== confirmarSenha) {
            setErroSenha("A confirmação da senha não corresponde.");
            return;
        }
        if (senhaAtual === novaSenha) {
            setErroSenha("A nova senha deve ser diferente da senha atual.");
            return;
        }

        try {
            setSalvandoSenha(true);
            const res = await fetch("/api/perfil/alterar-senha", {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ senha_atual: senhaAtual, nova_senha: novaSenha }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || "Não foi possível alterar sua senha.");

            setSalvandoSenha(false);
            setModalSenha(false);
            setSenhaAtual("");
            setNovaSenha("");
            setConfirmarSenha("");
            setMostrarSenhas(false);
            setAlerta({ tipo: "success", texto: "Sua senha foi alterada com sucesso." });
        } catch (e) {
            setErroSenha(
                e instanceof Error ? e.message : "Ocorreu um erro ao alterar sua senha.",
            );
        } finally {
            setSalvandoSenha(false);
        }
    }

    async function enviarCodigo(canal: Canal) {
        setErroVerif("");
        setEnviandoCodigo(true);
        try {
            const res = await fetch("/api/perfil/verificacao/enviar", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ canal }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || "Não foi possível enviar o código.");
            setCodigoEnviado(true);
        } catch (e) {
            setErroVerif(e instanceof Error ? e.message : "Não foi possível enviar o código.");
        } finally {
            setEnviandoCodigo(false);
        }
    }

    function abrirVerificacao(canal: Canal) {
        setCanalVerif(canal);
        setCodigoVerif("");
        setCodigoEnviado(false);
        setErroVerif("");
        void enviarCodigo(canal);
    }

    function fecharVerificacao() {
        if (confirmandoCodigo) return;
        setCanalVerif(null);
        setCodigoVerif("");
        setCodigoEnviado(false);
        setErroVerif("");
    }

    async function confirmarCodigo(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!canalVerif) return;
        if (codigoVerif.length !== 6) {
            setErroVerif("Digite o código de 6 dígitos.");
            return;
        }

        setErroVerif("");
        setConfirmandoCodigo(true);
        try {
            const res = await fetch("/api/perfil/verificacao/confirmar", {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ canal: canalVerif, codigo: codigoVerif }),
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || "Código inválido ou expirado.");

            const campo = canalVerif === "email" ? "email_verified" : "phone_verified";
            setPerfil((p) => (p ? { ...p, [campo]: true } : p));
            setAlerta({
                tipo: "success",
                texto: `${canalVerif === "email" ? "E-mail" : "Telefone"} verificado com sucesso.`,
            });
            setConfirmandoCodigo(false);
            setCanalVerif(null);
            setCodigoVerif("");
            setCodigoEnviado(false);
        } catch (err) {
            setErroVerif(err instanceof Error ? err.message : "Código inválido ou expirado.");
        } finally {
            setConfirmandoCodigo(false);
        }
    }

    /* ── Foto de perfil ── */

    function avisarErroFoto(texto: string) {
        if (modalFoto) setErroFoto(texto);
        else setAlerta({ tipo: "danger", texto });
    }

    function selecionarFoto(e: ChangeEvent<HTMLInputElement>) {
        const arquivo = e.target.files?.[0];
        e.target.value = ""; // permite escolher o mesmo arquivo de novo
        if (!arquivo) return;

        if (!arquivo.type.startsWith("image/")) {
            avisarErroFoto("Escolha um arquivo de imagem (JPG, PNG, WEBP ou AVIF).");
            return;
        }
        if (arquivo.size > TAMANHO_MAX_FOTO) {
            avisarErroFoto("A imagem deve ter no máximo 5 MB.");
            return;
        }

        if (previaFoto) URL.revokeObjectURL(previaFoto);
        setArquivoFoto(arquivo);
        setPreviaFoto(URL.createObjectURL(arquivo));
        setErroFoto("");
        setModalFoto(true);
    }

    function limparFoto() {
        if (previaFoto) URL.revokeObjectURL(previaFoto);
        setModalFoto(false);
        setArquivoFoto(null);
        setPreviaFoto("");
        setErroFoto("");
    }

    function fecharModalFoto() {
        if (salvandoFoto) return;
        limparFoto();
    }

    async function salvarFoto() {
        if (!arquivoFoto) return;
        setErroFoto("");
        setSalvandoFoto(true);
        try {
            const form = new FormData();
            form.append("foto", arquivoFoto);

            const res = await fetch("/api/perfil/foto", {
                method: "POST",
                credentials: "include",
                body: form,
            });
            const data = await res.json().catch(() => null);
            if (!res.ok) throw new Error(data?.error || "Não foi possível atualizar a foto.");

            const nova = pegar(desembrulhar(data), ...CHAVES_AVATAR);
            if (nova) {
                const url = String(nova);
                const semCache = /^(data|blob):/.test(url)
                    ? url
                    : `${url}${url.includes("?") ? "&" : "?"}v=${Date.now()}`;
                setPerfil((p) => (p ? { ...p, avatar: semCache } : p));
            } else {
                await carregar(true);
            }

            limparFoto();
            setAlerta({ tipo: "success", texto: "Foto de perfil atualizada com sucesso." });
        } catch (e) {
            setErroFoto(e instanceof Error ? e.message : "Não foi possível atualizar a foto.");
        } finally {
            setSalvandoFoto(false);
        }
    }

    if (loading) {
        return (
            <main className="flex min-h-[70vh] items-center justify-center px-4">
                <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
                    <LoaderCircle className="animate-spin text-teal-600" size={32} />
                    <h2 className="mt-5 font-bold text-slate-900">Carregando seu perfil</h2>
                    <p className="mt-1.5 text-center text-sm text-slate-500">
                        Buscando suas informações.
                    </p>
                </div>
            </main>
        );
    }

    if (erro || !perfil) {
        return (
            <main className="flex min-h-[70vh] items-center justify-center px-4">
                <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <XCircle className="mx-auto text-red-500" size={36} />
                    <h1 className="mt-4 text-xl font-bold text-slate-900">
                        Não foi possível abrir seu perfil
                    </h1>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        {erro || "Ocorreu um erro ao buscar suas informações."}
                    </p>
                    <button
                        type="button"
                        onClick={() => void carregar()}
                        className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
                    >
                        Tentar novamente
                    </button>
                </div>
            </main>
        );
    }

    const nomeCompleto = nomeDoPerfil(perfil) || "Usuário Maylon";
    const cargo = TIPOS[perfil.user_type] || perfil.user_type || "Usuário";

    return (
        <main className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-8xl space-y-6">
                {alerta && (
                    <div
                        role="status"
                        aria-live="polite"
                        className={`flex items-start gap-3 rounded-xl border p-4 shadow-sm ${alerta.tipo === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-red-200 bg-red-50 text-red-800"
                            }`}
                    >
                        {alerta.tipo === "success" ? (
                            <CheckCircle2 className="mt-0.5 shrink-0" size={20} />
                        ) : (
                            <XCircle className="mt-0.5 shrink-0" size={20} />
                        )}
                        <p className="flex-1 text-sm font-medium">{alerta.texto}</p>
                        <button
                            type="button"
                            onClick={() => setAlerta(null)}
                            aria-label="Fechar notificação"
                            className="cursor-pointer rounded-lg p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100"
                        >
                            <X size={17} />
                        </button>
                    </div>
                )}

                <section className="overflow-hidden rounded-2xl bg-white shadow-lg shadow-teal-950/10">
                    <div className="h-48 bg-[url('/bg-fundo.avif')] bg-cover bg-center sm:h-60" />

                    <div className="px-6 pb-6 sm:px-8">
                        <div className="-mt-12 flex flex-col gap-5 sm:-mt-14 sm:flex-row sm:items-end sm:justify-between">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                                <Avatar
                                    src={perfil.avatar}
                                    nome={nomeCompleto}
                                    iniciais={iniciais(perfil)}
                                    onTrocar={() => inputFotoRef.current?.click()}
                                />
                                <div className="min-w-0 pb-1">
                                    <h1 className="break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                                        {nomeCompleto}
                                    </h1>
                                    <p className="mt-1 flex items-center gap-2 text-sm font-medium text-slate-600">
                                        <BriefcaseBusiness size={16} className="text-teal-700" />
                                        {cargo} na Maylon
                                    </p>
                                </div>
                            </div>

                            <span className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3.5 py-1.5 text-sm font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                                <BadgeCheck size={16} />
                                Conta ativa
                            </span>
                        </div>

                        <dl className="mt-6 grid grid-cols-1 gap-px overflow-hidden rounded-xl bg-slate-200 sm:grid-cols-3">
                            <Destaque
                                icone={<Fingerprint size={18} />}
                                rotulo="Matrícula"
                                valor={perfil.matricula || "Não informado"}
                                copiavel
                            />
                            <Destaque
                                icone={<CalendarDays size={18} />}
                                rotulo="Data de cadastro"
                                valor={formatarData(perfil.created_at)}
                            />
                            <Destaque
                                icone={<Timer size={18} />}
                                rotulo="Tempo de casa"
                                valor={tempoDeCasa(perfil.created_at)}
                            />
                        </dl>
                    </div>
                </section>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                    {/* ───── Dados pessoais ───── */}
                    <Cartao
                        titulo="Dados pessoais"
                        descricao="Informações de identificação e contato."
                        className="lg:col-span-3"
                    >
                        <dl className="divide-y divide-slate-100">
                            <Linha icone={<UserRound size={18} />} rotulo="Nome" valor={nomeCompleto} />
                            <Linha
                                icone={<Mail size={18} />}
                                rotulo="E-mail"
                                valor={perfil.email}
                                copiavel
                                verificado={perfil.email_verified}
                                onVerificar={() => abrirVerificacao("email")}
                            />
                            <Linha
                                icone={<Phone size={18} />}
                                rotulo="Telefone"
                                valor={formatarTelefone(perfil.phone)}
                                verificado={perfil.phone_verified}
                                onVerificar={() => abrirVerificacao("telefone")}
                            />
                        </dl>
                    </Cartao>

                    {/* ───── Dados profissionais ───── */}
                    <Cartao
                        titulo="Dados profissionais"
                        descricao="Seu vínculo e nível de acesso."
                        className="lg:col-span-2"
                    >
                        <dl className="divide-y divide-slate-100">
                            <Linha icone={<BriefcaseBusiness size={18} />} rotulo="Cargo" valor={cargo} />
                            <Linha
                                icone={<ShieldCheck size={18} />}
                                rotulo="Nível de acesso"
                                valor={cargo}
                            />
                            <Linha
                                icone={<CalendarDays size={18} />}
                                rotulo="Cadastro"
                                valor={formatarData(perfil.created_at)}
                            />
                        </dl>
                    </Cartao>
                </div>

                {/* ───── Reuniões ───── */}

                {/* ───── Reuniões ───── */}
                <Cartao
                    titulo="Reuniões"
                    descricao="Suas próximas reuniões e salas virtuais."
                >
                    {loadingReunioes ? (
                        <p className="flex items-center gap-2 py-4 text-sm text-slate-500">
                            <LoaderCircle size={17} className="animate-spin text-teal-600" />
                            Carregando reuniões...
                        </p>
                    ) : reunioes.length === 0 ? (
                        <div className="my-2 flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                            <Video size={20} className="shrink-0 text-slate-400" />
                            Nenhuma reunião agendada.
                        </div>
                    ) : (
                        <>
                            <ul className="divide-y divide-slate-100">
                                {reunioesPaginadas.map((r) => (
                                    <li
                                        key={r.id}
                                        className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center"
                                    >
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                                            <CalendarClock size={18} />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="break-words text-sm font-semibold text-slate-900">
                                                {r.topic}
                                            </p>

                                            <p className="mt-0.5 text-xs font-medium capitalize text-slate-500">
                                                {formatarDataHora(r.start_time)}
                                                {r.duration ? ` · ${r.duration} min` : ""}
                                            </p>

                                            {r.agenda && (
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {r.agenda}
                                                </p>
                                            )}

                                            {r.password && (
                                                <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                                    Senha:{" "}
                                                    <strong className="text-slate-700">
                                                        {r.password}
                                                    </strong>
                                                    <BotaoCopiar texto={r.password} />
                                                </p>
                                            )}
                                        </div>

                                        {r.join_url && (
                                            <a
                                                href={r.join_url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex w-fit shrink-0 cursor-pointer items-center gap-1.5 rounded-lg bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                                            >
                                                <Video size={16} />
                                                Entrar
                                                <ExternalLink size={14} />
                                            </a>
                                        )}
                                    </li>
                                ))}
                            </ul>

                            {/* Paginação */}
                            <div className="mt-4 flex flex-col gap-4 border-t border-slate-100 pt-5 sm:flex-row sm:items-center sm:justify-between">

                                <p className="text-xs font-medium text-slate-500">
                                    Exibindo{" "}
                                    <strong className="text-slate-700">
                                        {primeiraReuniao}–{ultimaReuniao}
                                    </strong>{" "}
                                    de{" "}
                                    <strong className="text-slate-700">
                                        {reunioes.length}
                                    </strong>{" "}
                                    reuniões
                                </p>

                                <div className="flex flex-wrap items-center justify-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPaginaAtual((p) => Math.max(1, p - 1))
                                        }
                                        disabled={paginaValida === 1}
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Anterior
                                    </button>

                                    {Array.from(
                                        { length: totalPaginas },
                                        (_, i) => i + 1
                                    ).map((pagina) => (
                                        <button
                                            key={pagina}
                                            type="button"
                                            onClick={() => setPaginaAtual(pagina)}
                                            aria-current={
                                                paginaValida === pagina
                                                    ? "page"
                                                    : undefined
                                            }
                                            className={`flex h-9 min-w-9 items-center justify-center rounded-lg px-3 text-sm font-bold transition ${paginaValida === pagina
                                                ? "bg-teal-700 text-white shadow-sm"
                                                : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                                                }`}
                                        >
                                            {pagina}
                                        </button>
                                    ))}

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setPaginaAtual((p) =>
                                                Math.min(totalPaginas, p + 1)
                                            )
                                        }
                                        disabled={paginaValida === totalPaginas}
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Próxima
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </Cartao>


                {/* ───── Segurança ───── */}
                <Cartao
                    titulo="Segurança da conta"
                    descricao="Mantenha seu acesso protegido."
                >
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <AcaoSeguranca
                            icone={<LockKeyhole size={20} />}
                            titulo="Senha"
                            texto="Atualize sua senha regularmente para manter sua conta protegida."
                            botao="Alterar senha"
                            onClick={() => {
                                setErroSenha("");
                                setModalSenha(true);
                            }}
                        />
                        <AcaoSeguranca
                            icone={<Monitor size={20} />}
                            titulo="Dispositivos"
                            texto="Veja e gerencie os dispositivos conectados à sua conta."
                            botao="Gerenciar dispositivos"
                            onClick={() => {
                                window.location.href = "/atendente/perfil/dispositivos";
                            }}
                        />
                    </div>
                </Cartao>
            </div>

            {/* ───── Modal de senha ───── */}
            {modalSenha && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
                    onClick={fecharModalSenha}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-modal-senha"
                        className="my-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                                    <KeyRound size={22} />
                                </div>
                                <div>
                                    <h2 id="titulo-modal-senha" className="text-lg font-bold text-slate-900">
                                        Alterar senha
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Proteja o acesso à sua conta Maylon.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                aria-label="Fechar"
                                disabled={salvandoSenha}
                                onClick={fecharModalSenha}
                                className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={alterarSenha} className="space-y-5 p-6">
                            {erroSenha && (
                                <div
                                    role="alert"
                                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                                >
                                    <XCircle className="mt-0.5 shrink-0" size={17} />
                                    <span>{erroSenha}</span>
                                </div>
                            )}

                            <CampoSenha
                                rotulo="Senha atual"
                                valor={senhaAtual}
                                onChange={setSenhaAtual}
                                visivel={mostrarSenhas}
                                desabilitado={salvandoSenha}
                                autoComplete="current-password"
                                placeholder="Digite sua senha atual"
                            />
                            <CampoSenha
                                rotulo="Nova senha"
                                valor={novaSenha}
                                onChange={setNovaSenha}
                                visivel={mostrarSenhas}
                                desabilitado={salvandoSenha}
                                autoComplete="new-password"
                                placeholder="Mínimo de 8 caracteres"
                            />
                            <CampoSenha
                                rotulo="Confirmar nova senha"
                                valor={confirmarSenha}
                                onChange={setConfirmarSenha}
                                visivel={mostrarSenhas}
                                desabilitado={salvandoSenha}
                                autoComplete="new-password"
                                placeholder="Repita a nova senha"
                            />

                            <button
                                type="button"
                                onClick={() => setMostrarSenhas((v) => !v)}
                                className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-teal-700 transition hover:text-teal-900"
                            >
                                {mostrarSenhas ? <EyeOff size={17} /> : <Eye size={17} />}
                                {mostrarSenhas ? "Ocultar senhas" : "Mostrar senhas"}
                            </button>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    disabled={salvandoSenha}
                                    onClick={fecharModalSenha}
                                    className="cursor-pointer rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={salvandoSenha}
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {salvandoSenha ? (
                                        <>
                                            <LoaderCircle size={17} className="animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={17} />
                                            Salvar nova senha
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}

            {/* ───── Seletor de foto (oculto) ───── */}
            <input
                ref={inputFotoRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={selecionarFoto}
                className="hidden"
            />

            {/* ───── Modal de foto ───── */}
            {modalFoto && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
                    onClick={fecharModalFoto}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-modal-foto"
                        className="my-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                                    <Camera size={22} />
                                </div>
                                <div>
                                    <h2 id="titulo-modal-foto" className="text-lg font-bold text-slate-900">
                                        Trocar foto de perfil
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        Confira como a foto vai ficar antes de salvar.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                aria-label="Fechar"
                                disabled={salvandoFoto}
                                onClick={fecharModalFoto}
                                className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-5 p-6">
                            {erroFoto && (
                                <div
                                    role="alert"
                                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                                >
                                    <XCircle className="mt-0.5 shrink-0" size={17} />
                                    <span>{erroFoto}</span>
                                </div>
                            )}

                            <div className="flex flex-col items-center gap-3">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={previaFoto}
                                    alt="Prévia da nova foto de perfil"
                                    className="h-44 w-44 rounded-full border-4 border-white bg-slate-100 object-cover shadow-lg ring-1 ring-slate-200"
                                />
                                <p className="max-w-full truncate text-xs text-slate-500">
                                    {arquivoFoto?.name}
                                </p>
                                <button
                                    type="button"
                                    disabled={salvandoFoto}
                                    onClick={() => inputFotoRef.current?.click()}
                                    className="cursor-pointer text-sm font-medium text-teal-700 transition hover:text-teal-900 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    Escolher outra foto
                                </button>
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    disabled={salvandoFoto}
                                    onClick={fecharModalFoto}
                                    className="cursor-pointer rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    disabled={salvandoFoto || !arquivoFoto}
                                    onClick={() => void salvarFoto()}
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {salvandoFoto ? (
                                        <>
                                            <LoaderCircle size={17} className="animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={17} />
                                            Salvar foto
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}

            {/* ───── Modal de verificação ───── */}
            {canalVerif && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
                    onClick={fecharVerificacao}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-modal-verif"
                        className="my-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                                    {canalVerif === "email" ? <Mail size={22} /> : <Phone size={22} />}
                                </div>
                                <div>
                                    <h2 id="titulo-modal-verif" className="text-lg font-bold text-slate-900">
                                        {canalVerif === "email" ? "Verificar e-mail" : "Verificar telefone"}
                                    </h2>
                                    <p className="break-all text-xs text-slate-500">
                                        {canalVerif === "email"
                                            ? perfil.email
                                            : formatarTelefone(perfil.phone)}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                aria-label="Fechar"
                                disabled={confirmandoCodigo}
                                onClick={fecharVerificacao}
                                className="cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={confirmarCodigo} className="space-y-5 p-6">
                            {erroVerif && (
                                <div
                                    role="alert"
                                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                                >
                                    <XCircle className="mt-0.5 shrink-0" size={17} />
                                    <span>{erroVerif}</span>
                                </div>
                            )}

                            {enviandoCodigo ? (
                                <p className="flex items-center gap-2 text-sm text-slate-600">
                                    <LoaderCircle size={17} className="animate-spin text-teal-600" />
                                    Enviando código...
                                </p>
                            ) : codigoEnviado ? (
                                <p className="text-sm leading-6 text-slate-600">
                                    Enviamos um código de 6 dígitos por{" "}
                                    {canalVerif === "email" ? "e-mail" : "SMS"}. Digite abaixo para
                                    confirmar.
                                </p>
                            ) : null}

                            <label className="block">
                                <span className="mb-1.5 block text-sm font-semibold text-slate-700">
                                    Código de verificação
                                </span>
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    autoComplete="one-time-code"
                                    maxLength={6}
                                    value={codigoVerif}
                                    onChange={(e) =>
                                        setCodigoVerif(e.target.value.replace(/\D/g, "").slice(0, 6))
                                    }
                                    disabled={confirmandoCodigo || !codigoEnviado}
                                    placeholder="000000"
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-center text-xl font-bold tracking-[0.5em] text-slate-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15 disabled:bg-slate-50"
                                />
                            </label>

                            <button
                                type="button"
                                disabled={enviandoCodigo || confirmandoCodigo}
                                onClick={() => void enviarCodigo(canalVerif)}
                                className="cursor-pointer text-sm font-medium text-teal-700 transition hover:text-teal-900 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Reenviar código
                            </button>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    disabled={confirmandoCodigo}
                                    onClick={fecharVerificacao}
                                    className="cursor-pointer rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={confirmandoCodigo || !codigoEnviado || codigoVerif.length !== 6}
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {confirmandoCodigo ? (
                                        <>
                                            <LoaderCircle size={17} className="animate-spin" />
                                            Confirmando...
                                        </>
                                    ) : (
                                        <>
                                            <BadgeCheck size={17} />
                                            Confirmar código
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </section>
                </div>
            )}
        </main>
    );
}

/* ───────────── Componentes ───────────── */

function Avatar({
    src,
    nome,
    iniciais,
    onTrocar,
}: {
    src?: string;
    nome: string;
    iniciais: string;
    onTrocar: () => void;
}) {
    const [falhou, setFalhou] = useState(false);

    // Se a URL da foto mudar, tenta carregar de novo
    useEffect(() => {
        setFalhou(false);
    }, [src]);

    return (
        <div className="relative h-24 w-24 shrink-0 sm:h-28 sm:w-28">
            {src && !falhou ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={src}
                    alt={`Foto de ${nome}`}
                    onError={() => setFalhou(true)}
                    referrerPolicy="no-referrer"
                    className="h-full w-full rounded-full border-4 border-white bg-slate-100 object-cover shadow-md"
                />
            ) : (
                <div
                    aria-hidden
                    className="flex h-full w-full items-center justify-center rounded-full border-4 border-white bg-teal-700 text-3xl font-bold tracking-tight text-white shadow-md sm:text-4xl"
                >
                    {iniciais}
                </div>
            )}

            <button
                type="button"
                onClick={onTrocar}
                aria-label="Trocar foto de perfil"
                title="Trocar foto"
                className="absolute bottom-0 right-0 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-teal-700 text-white shadow-md transition hover:bg-teal-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
                <Camera size={16} />
            </button>
        </div>
    );
}

function useCopiar(texto: string) {
    const [copiado, setCopiado] = useState(false);
    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(texto);
            setCopiado(true);
            setTimeout(() => setCopiado(false), 1800);
        } catch {
            // sem permissão de área de transferência
        }
    };
    return { copiado, copiar };
}

function BotaoCopiar({ texto }: { texto: string }) {
    const { copiado, copiar } = useCopiar(texto);
    return (
        <button
            type="button"
            onClick={copiar}
            aria-label={copiado ? "Copiado" : "Copiar"}
            title={copiado ? "Copiado" : "Copiar"}
            className="shrink-0 cursor-pointer rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
        >
            {copiado ? <Check size={16} className="text-emerald-600" /> : <Copy size={16} />}
        </button>
    );
}

function Cartao({
    titulo,
    descricao,
    children,
    className = "",
}: {
    titulo: string;
    descricao: string;
    children: ReactNode;
    className?: string;
}) {
    return (
        <section className={`rounded-2xl bg-white shadow-lg shadow-teal-950/10 ${className}`}>
            <div className="border-b border-slate-100 px-6 py-5 sm:px-8">
                <h2 className="text-lg font-bold text-slate-900">{titulo}</h2>
                <p className="mt-0.5 text-sm text-slate-500">{descricao}</p>
            </div>
            <div className="px-6 py-3 sm:px-8 sm:py-4">{children}</div>
        </section>
    );
}

function Destaque({
    icone,
    rotulo,
    valor,
    copiavel,
}: {
    icone: ReactNode;
    rotulo: string;
    valor: string;
    copiavel?: boolean;
}) {
    return (
        <div className="flex items-center gap-3 bg-slate-50 px-5 py-4">
            <div className="text-teal-700">{icone}</div>
            <div className="min-w-0 flex-1">
                <dt className="text-xs text-slate-500">{rotulo}</dt>
                <dd className="mt-0.5 break-words text-sm font-bold text-slate-900">{valor}</dd>
            </div>
            {copiavel && valor && valor !== "Não informado" && <BotaoCopiar texto={valor} />}
        </div>
    );
}

function Linha({
    icone,
    rotulo,
    valor,
    copiavel,
    verificado,
    onVerificar,
}: {
    icone: ReactNode;
    rotulo: string;
    valor?: string | null;
    copiavel?: boolean;
    verificado?: boolean;
    onVerificar?: () => void;
}) {
    const texto = valor?.trim() || "";
    return (
        <div className="flex items-center gap-4 py-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                {icone}
            </div>
            <div className="min-w-0 flex-1">
                <dt className="text-xs font-medium text-slate-500">{rotulo}</dt>
                <dd
                    className={`mt-0.5 break-words text-sm font-semibold ${texto ? "text-slate-900" : "text-slate-400"
                        }`}
                >
                    {texto || "Não informado"}
                </dd>
            </div>
            {verificado === true && texto && (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                    <BadgeCheck size={14} />
                    Verificado
                </span>
            )}
            {verificado === false && texto && (
                <button
                    type="button"
                    onClick={onVerificar}
                    className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/30 transition hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
                >
                    <AlertCircle size={14} />
                    Clique aqui
                </button>
            )}
            {copiavel && texto && <BotaoCopiar texto={texto} />}
        </div>
    );
}

function AcaoSeguranca({
    icone,
    titulo,
    texto,
    botao,
    onClick,
}: {
    icone: ReactNode;
    titulo: string;
    texto: string;
    botao: string;
    onClick: () => void;
}) {
    return (
        <div className="flex flex-col justify-between gap-4 rounded-xl border border-slate-200 p-5">
            <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
                    {icone}
                </div>
                <div>
                    <h3 className="text-sm font-bold text-slate-900">{titulo}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-500">{texto}</p>
                </div>
            </div>
            <button
                type="button"
                onClick={onClick}
                className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-lg border border-teal-700 px-4 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-600"
            >
                {botao}
                <ChevronRight size={16} />
            </button>
        </div>
    );
}

function CampoSenha({
    rotulo,
    valor,
    onChange,
    visivel,
    desabilitado,
    autoComplete,
    placeholder,
}: {
    rotulo: string;
    valor: string;
    onChange: (v: string) => void;
    visivel: boolean;
    desabilitado: boolean;
    autoComplete: string;
    placeholder: string;
}) {
    return (
        <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">{rotulo}</span>
            <input
                type={visivel ? "text" : "password"}
                autoComplete={autoComplete}
                value={valor}
                onChange={(e) => onChange(e.target.value)}
                required
                disabled={desabilitado}
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-4 focus:ring-teal-600/15 disabled:bg-slate-50"
            />
        </label>
    );
}