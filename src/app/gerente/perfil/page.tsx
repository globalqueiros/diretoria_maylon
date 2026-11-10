"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
    type ChangeEvent,
    type FormEvent,
} from "react";
import Image from "next/image";
import {
    User,
    Mail,
    Phone,
    ShieldCheck,
    Camera,
    Save,
    Lock,
    Eye,
    EyeOff,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    AlertCircle,
    Loader2,
    RefreshCw,
    BadgeCheck,
    KeyRound,
    UserRound,
    X,
} from "lucide-react";

type Profile = {
    id: string | number;
    name: string;
    email: string;
    phone: string;
    cpf: string;
    username: string;
    user_type: string;
    user_level?: string;
    department: string;
    position: string;
    profile_image: string | null;
    created_at?: string;
};

type Notice = {
    type: "success" | "error";
    message: string;
};

type PasswordData = {
    current_password: string;
    new_password: string;
    confirm_password: string;
};

const EMPTY_PROFILE: Profile = {
    id: "",
    name: "",
    email: "",
    phone: "",
    cpf: "",
    username: "",
    user_type: "comercial",
    department: "Comercial",
    position: "Equipe Comercial",
    profile_image: null,
};

function normalizeProfile(data: any): Profile {
    const user =
        data?.user ??
        data?.usuario ??
        data?.data?.user ??
        data?.data?.usuario ??
        data?.data ??
        data;

    return {
        id: user?.id ?? "",
        name:
            user?.name ??
            user?.nome ??
            user?.nome_completo ??
            user?.full_name ??
            "",
        email: user?.email ?? "",
        phone: user?.phone ?? user?.telefone ?? "",
        cpf: user?.cpf ?? "",
        username: user?.username ?? user?.name_user ?? "",
        user_type: user?.user_type ?? "comercial",
        user_level: user?.user_level ?? "",
        department: user?.department ?? user?.departamento ?? "Comercial",
        position: user?.position ?? user?.cargo ?? "Equipe Comercial",
        profile_image:
            user?.profile_image ??
            user?.profileImage ??
            user?.avatar_url ??
            user?.avatar ??
            null,
        created_at: user?.created_at ?? user?.data_cadastro,
    };
}

function formatDate(date?: string) {
    if (!date) return "Não informado";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return "Não informado";
    }

    return parsed.toLocaleDateString("pt-BR");
}

export default function PerfilComercialPage() {
    const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [notice, setNotice] = useState<Notice | null>(null);
    const [activeTab, setActiveTab] = useState<"dados" | "seguranca">("dados");
    const [showPassword, setShowPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    const [password, setPassword] = useState<PasswordData>({
        current_password: "",
        new_password: "",
        confirm_password: "",
    });

    // Foto escolhida, ainda NÃO salva (pré-visualização)
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const [imageError, setImageError] = useState(false);

    const fileRef = useRef<HTMLInputElement>(null);
    const previewUrlRef = useRef<string | null>(null);

    const clearImagePreview = useCallback(() => {
        if (previewUrlRef.current) {
            URL.revokeObjectURL(previewUrlRef.current);
            previewUrlRef.current = null;
        }

        setImagePreview(null);
        setPendingFile(null);
    }, []);

    useEffect(() => {
        return () => {
            if (previewUrlRef.current) {
                URL.revokeObjectURL(previewUrlRef.current);
            }
        };
    }, []);

    // silent: recarrega os dados sem tela de "Carregando" e sem apagar o aviso
    const loadProfile = useCallback(async (options?: { silent?: boolean }) => {
        const silent = options?.silent === true;

        try {
            if (!silent) {
                setLoading(true);
                setNotice(null);
            }

            const response = await fetch("/api/me", {
                method: "GET",
                credentials: "include",
                cache: "no-store",
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data?.message || "Não foi possível carregar seu perfil."
                );
            }

            const normalized = normalizeProfile(data);

            if (!normalized.id) {
                throw new Error("Usuário não identificado.");
            }

            setProfile(normalized);
        } catch (error) {
            setNotice({
                type: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "Erro ao carregar perfil.",
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProfile();
    }, [loadProfile]);

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const { name, value } = event.target;

        if (name !== "name" && name !== "phone") {
            return;
        }

        setProfile((current) => ({
            ...current,
            [name]: value,
        }));
    }

    async function handleSaveProfile(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!profile.name.trim()) {
            setNotice({
                type: "error",
                message: "Informe seu nome completo.",
            });
            return;
        }

        try {
            setSaving(true);
            setNotice(null);

            const response = await fetch("/api/me", {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: profile.name.trim(),
                    phone: profile.phone.trim(),
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data?.message || "Não foi possível atualizar o perfil."
                );
            }

            setNotice({
                type: "success",
                message: data?.message || "Perfil atualizado com sucesso!",
            });

            await loadProfile({ silent: true });
        } catch (error) {
            setNotice({
                type: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "Erro ao salvar perfil.",
            });
        } finally {
            setSaving(false);
        }
    }

    // 1) Escolher a foto: só mostra a pré-visualização, NÃO envia ainda.
    function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];

        if (!file) return;

        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

        if (!allowedTypes.includes(file.type)) {
            setNotice({
                type: "error",
                message: "Selecione uma imagem JPG, PNG ou WEBP.",
            });

            event.target.value = "";
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setNotice({
                type: "error",
                message: "A imagem deve ter no máximo 5 MB.",
            });

            event.target.value = "";
            return;
        }

        clearImagePreview();

        const preview = URL.createObjectURL(file);

        previewUrlRef.current = preview;
        setImagePreview(preview);
        setPendingFile(file);
        setImageError(false);
        setNotice(null);

        event.target.value = "";
    }

    // 2) Confirmar: aí sim envia a foto para o servidor.
    async function handleConfirmImage() {
        if (!pendingFile || uploading) return;

        try {
            setUploading(true);
            setNotice(null);

            const formData = new FormData();
            formData.append("avatar", pendingFile);

            const response = await fetch("/api/me/avatar", {
                method: "POST",
                credentials: "include",
                body: formData,
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data?.message || "Não foi possível atualizar a foto."
                );
            }

            const updatedImage =
                data?.profile_image ??
                data?.profileImage ??
                data?.avatar_url ??
                data?.url ??
                null;

            if (updatedImage) {
                setProfile((current) => ({
                    ...current,
                    profile_image: updatedImage,
                }));
                setImageError(false);
            }

            clearImagePreview();

            setNotice({
                type: "success",
                message: "Foto de perfil atualizada com sucesso!",
            });

            await loadProfile({ silent: true });
        } catch (error) {
            // Mantém a pré-visualização para a pessoa tentar salvar de novo
            setNotice({
                type: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "Erro ao enviar imagem.",
            });
        } finally {
            setUploading(false);
        }
    }

    function handleCancelImage() {
        if (uploading) return;
        clearImagePreview();
    }

    function formatPhone(value: string) {
        const digits = value.replace(/\D/g, "").slice(0, 11);

        if (!digits) return "";

        if (digits.length <= 2) {
            return `(${digits}`;
        }

        if (digits.length <= 6) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
        }

        if (digits.length <= 10) {
            return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
        }

        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
    }

    async function handleChangePassword(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!password.current_password) {
            setNotice({
                type: "error",
                message: "Informe sua senha atual.",
            });
            return;
        }

        if (password.new_password.length < 8) {
            setNotice({
                type: "error",
                message: "A nova senha deve ter pelo menos 8 caracteres.",
            });
            return;
        }

        if (password.new_password !== password.confirm_password) {
            setNotice({
                type: "error",
                message: "As senhas não coincidem.",
            });
            return;
        }

        if (password.current_password === password.new_password) {
            setNotice({
                type: "error",
                message: "A nova senha deve ser diferente da senha atual.",
            });
            return;
        }

        try {
            setSaving(true);
            setNotice(null);

            const response = await fetch("/api/me/password", {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(password),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data?.message || "Não foi possível alterar a senha."
                );
            }

            setPassword({
                current_password: "",
                new_password: "",
                confirm_password: "",
            });

            setShowPassword(false);
            setShowNewPassword(false);

            setNotice({
                type: "success",
                message: data?.message || "Senha alterada com sucesso!",
            });
        } catch (error) {
            setNotice({
                type: "error",
                message:
                    error instanceof Error
                        ? error.message
                        : "Erro ao alterar senha.",
            });
        } finally {
            setSaving(false);
        }
    }

    const displayImage = imagePreview || profile.profile_image;
    const firstName = profile.name.split(/\s+/)[0] || "Colaborador";
    const roleLabel = profile.user_level || profile.position || "Equipe Comercial";

    // O aviso de sucesso some sozinho depois de alguns segundos
    useEffect(() => {
        if (notice?.type !== "success") return;
        const timer = setTimeout(() => setNotice(null), 6000);
        return () => clearTimeout(timer);
    }, [notice]);

    // Fecha o modal da foto com Esc
    useEffect(() => {
        if (!pendingFile) return;

        function aoTeclar(e: KeyboardEvent) {
            if (e.key === "Escape" && !uploading) clearImagePreview();
        }

        window.addEventListener("keydown", aoTeclar);
        return () => window.removeEventListener("keydown", aoTeclar);
    }, [pendingFile, uploading, clearImagePreview]);

    // Se a foto salva quebrar, volta a tentar quando a URL mudar
    useEffect(() => {
        setImageError(false);
    }, [displayImage]);

    function formatCpf(value: string) {
        const n = (value || "").replace(/\D/g, "").slice(0, 11);

        return n
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d)/, "$1.$2")
            .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center px-4">
                <div
                    role="status"
                    aria-live="polite"
                    className="w-full max-w-xs rounded-2xl border border-gray-200 bg-white px-8 py-10 text-center shadow-sm"
                >
                    <Loader2
                        size={35}
                        className="mx-auto animate-spin text-[#35a989]"
                    />
                    <p className="mt-4 text-sm font-medium text-gray-600">
                        Carregando seu perfil...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen">
            <div className="mx-auto max-w-8xl">
                <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                            Meu perfil
                        </h1>
                        <p className="mt-1 text-sm text-white">
                            Gerencie suas informações pessoais e sua segurança.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => loadProfile()}
                        disabled={saving || uploading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw size={16} />
                        Atualizar dados
                    </button>
                </div>

                {notice && (
                    <div
                        role="status"
                        aria-live="polite"
                        className={`mb-6 flex items-center gap-3 rounded-xl border p-4 ${notice.type === "success"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                            : "border-red-200 bg-red-50 text-red-700"
                            }`}
                    >
                        {notice.type === "success" ? (
                            <CheckCircle2 size={20} />
                        ) : (
                            <AlertCircle size={20} />
                        )}

                        <p className="text-sm font-medium">{notice.message}</p>

                        <button
                            type="button"
                            onClick={() => setNotice(null)}
                            className="ml-auto text-current opacity-60 hover:opacity-100"
                            aria-label="Fechar aviso"
                        >
                            ✕
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                    <aside className="space-y-5 lg:col-span-4">
                        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                            <div className="h-28 bg-gradient-to-r from-[#238b70] via-[#35a989] to-[#73c7ad]" />

                            <div className="px-5 pb-6">
                                <div className="-mt-12 flex justify-center">
                                    <div className="group relative">
                                        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-[#e5f5ef] shadow-md">
                                            {displayImage && !imageError ? (
                                                <Image
                                                    src={displayImage}
                                                    alt="Foto de perfil"
                                                    width={96}
                                                    height={96}
                                                    unoptimized
                                                    onError={() => setImageError(true)}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <UserRound
                                                    size={42}
                                                    className="text-[#27876d]"
                                                />
                                            )}
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => fileRef.current?.click()}
                                            disabled={uploading}
                                            aria-label="Escolher foto de perfil"
                                            className="absolute cursor-pointer bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-white bg-[#35a989] text-white shadow-md transition hover:bg-[#27876d] disabled:opacity-50"
                                        >
                                            <Camera size={17} />
                                        </button>

                                        <input
                                            ref={fileRef}
                                            type="file"
                                            accept="image/png,image/jpeg,image/webp"
                                            onChange={handleImageChange}
                                            className="hidden"
                                        />
                                    </div>
                                </div>

                                <div className="mt-4 text-center">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {profile.name || firstName}
                                    </h2>

                                    <p className="mt-1 break-all text-sm text-gray-500">
                                        {profile.email || "E-mail não informado"}
                                    </p>

                                    <div className="mt-3 flex justify-center">
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e5f5ef] px-3 py-1.5 text-xs font-semibold text-[#27876d]">
                                            <BadgeCheck size={14} />
                                            {roleLabel}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-6 space-y-4 border-t border-gray-100 pt-5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                                            <BriefcaseBusiness size={17} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-gray-400">
                                                Departamento
                                            </p>
                                            <p className="text-sm font-semibold text-gray-700">
                                                {profile.department}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                                            <CalendarDays size={17} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-gray-400">
                                                Data de cadastro
                                            </p>
                                            <p className="text-sm font-semibold text-gray-700">
                                                {formatDate(profile.created_at)}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-500">
                                            <ShieldCheck size={17} />
                                        </div>
                                        <div>
                                            <p className="text-[11px] text-gray-400">
                                                Situação da conta
                                            </p>
                                            <p className="text-sm font-semibold text-emerald-600">
                                                Autenticada
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
                            <p className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                Configurações da conta
                            </p>

                            <button
                                type="button"
                                onClick={() => setActiveTab("dados")}
                                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${activeTab === "dados"
                                    ? "bg-[#e5f5ef] text-[#27876d]"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <User size={18} />
                                Dados pessoais
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab("seguranca")}
                                className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${activeTab === "seguranca"
                                    ? "bg-[#e5f5ef] text-[#27876d]"
                                    : "text-gray-600 hover:bg-gray-50"
                                    }`}
                            >
                                <Lock size={18} />
                                Segurança e senha
                            </button>
                        </section>
                    </aside>

                    <section className="min-w-0 lg:col-span-8">
                        {activeTab === "dados" ? (
                            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                                <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e5f5ef] text-[#27876d]">
                                            <User size={21} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">
                                                Informações pessoais
                                            </h2>
                                            <p className="text-xs text-gray-500">
                                                Atualize seus dados cadastrais com seu gerente
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <form
                                    onSubmit={handleSaveProfile}
                                    className="space-y-6 p-5 sm:p-7"
                                >
                                    <div>
                                        <h3 className="mb-4 text-sm font-bold text-gray-800">
                                            Identificação
                                        </h3>

                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <label
                                                    htmlFor="name"
                                                    className="mb-2 block text-sm font-medium text-gray-700"
                                                >
                                                    Nome completo *
                                                </label>

                                                <div className="relative">
                                                    <User
                                                        size={17}
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                    />
                                                    <input
                                                        id="name"
                                                        name="name"
                                                        value={profile.name}
                                                        readOnly
                                                        disabled
                                                        placeholder="Não informado"
                                                        className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-500 outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="cpf"
                                                    className="mb-2 block text-sm font-medium text-gray-700"
                                                >
                                                    CPF
                                                </label>
                                                <input
                                                    id="cpf"
                                                    value={formatCpf(profile.cpf)}
                                                    readOnly
                                                    disabled
                                                    placeholder="Não informado"
                                                    className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 outline-none"
                                                />
                                                <p className="mt-1 text-xs text-gray-400">
                                                    CPF protegido. Solicite alterações à diretoria.
                                                </p>
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="username"
                                                    className="mb-2 block text-sm font-medium text-gray-700"
                                                >
                                                    Usuário
                                                </label>
                                                <input
                                                    id="username"
                                                    value={profile.email}
                                                    readOnly
                                                    className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100" />

                                    <div>
                                        <h3 className="mb-4 text-sm font-bold text-gray-800">
                                            Informações de contato
                                        </h3>

                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <label
                                                    htmlFor="email"
                                                    className="mb-2 block text-sm font-medium text-gray-700"
                                                >
                                                    E-mail
                                                </label>

                                                <div className="relative">
                                                    <Mail
                                                        size={17}
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                    />
                                                    <input
                                                        id="email"
                                                        type="email"
                                                        value={profile.email}
                                                        readOnly
                                                        disabled
                                                        className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-500 outline-none"
                                                    />
                                                </div>

                                                <p className="mt-1 text-xs text-gray-400">
                                                    E-mail protegido. Para alterações, solicite à diretoria.
                                                </p>
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label
                                                    htmlFor="phone"
                                                    className="mb-2 block text-sm font-medium text-gray-700"
                                                >
                                                    Telefone / WhatsApp
                                                </label>

                                                <div className="relative">
                                                    <Phone
                                                        size={17}
                                                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                                    />
                                                    <input
                                                        id="phone"
                                                        name="phone"
                                                        type="tel"
                                                        value={formatPhone(profile.phone || "")}
                                                        readOnly
                                                        disabled
                                                        placeholder="Não informado"
                                                        className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 py-3 pl-10 pr-4 text-sm text-gray-500 outline-none"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border-t border-gray-100" />

                                    <div>
                                        <h3 className="mb-4 text-sm font-bold text-gray-800">
                                            Informações profissionais
                                        </h3>

                                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    Departamento
                                                </label>
                                                <input
                                                    value={profile.department}
                                                    readOnly
                                                    className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500"
                                                />
                                            </div>

                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-gray-700">
                                                    Cargo / função
                                                </label>
                                                <input
                                                    value={roleLabel}
                                                    readOnly
                                                    className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        ) : (
                            <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
                                <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e5f5ef] text-[#27876d]">
                                            <ShieldCheck size={22} />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-gray-900">
                                                Segurança da conta
                                            </h2>
                                            <p className="text-xs text-gray-500">
                                                Mantenha suas credenciais protegidas.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <form
                                    onSubmit={handleChangePassword}
                                    className="space-y-6 p-5 sm:p-7"
                                >
                                    <div className="rounded-xl border border-[#d9eee7] bg-[#f1faf6] p-4">
                                        <div className="flex items-start gap-3">
                                            <ShieldCheck
                                                size={21}
                                                className="mt-0.5 shrink-0 text-[#27876d]"
                                            />
                                            <div>
                                                <p className="text-sm font-semibold text-[#236c57]">
                                                    Proteção da conta MAYLON
                                                </p>
                                                <p className="mt-1 text-xs leading-relaxed text-[#43816d]">
                                                    Utilize uma senha exclusiva, com letras maiúsculas, minúsculas, números e caracteres especiais.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="current_password"
                                            className="mb-2 block text-sm font-medium text-gray-700"
                                        >
                                            Senha atual *
                                        </label>

                                        <div className="relative">
                                            <Lock
                                                size={17}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            />
                                            <input
                                                id="current_password"
                                                type={showPassword ? "text" : "password"}
                                                value={password.current_password}
                                                onChange={(e) =>
                                                    setPassword((current) => ({
                                                        ...current,
                                                        current_password: e.target.value,
                                                    }))
                                                }
                                                autoComplete="current-password"
                                                required
                                                placeholder="Digite sua senha atual"
                                                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-12 text-sm outline-none transition focus:border-[#35a989] focus:ring-2 focus:ring-[#35a989]/10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((value) => !value)}
                                                aria-label="Mostrar ou ocultar senha"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                                            >
                                                {showPassword ? (
                                                    <EyeOff size={18} />
                                                ) : (
                                                    <Eye size={18} />
                                                )}
                                            </button>
                                        </div>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="new_password"
                                            className="mb-2 block text-sm font-medium text-gray-700"
                                        >
                                            Nova senha *
                                        </label>

                                        <div className="relative">
                                            <KeyRound
                                                size={17}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            />
                                            <input
                                                id="new_password"
                                                type={showNewPassword ? "text" : "password"}
                                                value={password.new_password}
                                                onChange={(e) =>
                                                    setPassword((current) => ({
                                                        ...current,
                                                        new_password: e.target.value,
                                                    }))
                                                }
                                                autoComplete="new-password"
                                                required
                                                minLength={8}
                                                placeholder="Digite a nova senha"
                                                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-12 text-sm outline-none transition focus:border-[#35a989] focus:ring-2 focus:ring-[#35a989]/10"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNewPassword((value) => !value)}
                                                aria-label="Mostrar ou ocultar nova senha"
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                                            >
                                                {showNewPassword ? (
                                                    <EyeOff size={18} />
                                                ) : (
                                                    <Eye size={18} />
                                                )}
                                            </button>
                                        </div>

                                        <p className="mt-2 text-xs text-gray-400">
                                            Mínimo de 8 caracteres.
                                        </p>
                                    </div>

                                    <div>
                                        <label
                                            htmlFor="confirm_password"
                                            className="mb-2 block text-sm font-medium text-gray-700"
                                        >
                                            Confirmar nova senha *
                                        </label>

                                        <div className="relative">
                                            <Lock
                                                size={17}
                                                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                                            />
                                            <input
                                                id="confirm_password"
                                                type="password"
                                                value={password.confirm_password}
                                                onChange={(e) =>
                                                    setPassword((current) => ({
                                                        ...current,
                                                        confirm_password: e.target.value,
                                                    }))
                                                }
                                                autoComplete="new-password"
                                                required
                                                placeholder="Confirme a nova senha"
                                                className="w-full rounded-xl border border-gray-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#35a989] focus:ring-2 focus:ring-[#35a989]/10"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex justify-end border-t border-gray-100 pt-5">
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#35a989] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#27876d] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
                                        >
                                            {saving ? (
                                                <Loader2 size={17} className="animate-spin" />
                                            ) : (
                                                <Lock size={17} />
                                            )}
                                            {saving ? "Atualizando..." : "Alterar senha"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </section>
                </div>
            </div>
            {/* MODAL: pré-visualização da foto antes de salvar */}
            {pendingFile && imagePreview && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
                    onClick={handleCancelImage}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="titulo-foto-perfil"
                        className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
                            <div>
                                <h2
                                    id="titulo-foto-perfil"
                                    className="text-lg font-extrabold text-gray-900"
                                >
                                    Nova foto de perfil
                                </h2>
                                <p className="mt-1 text-xs text-gray-500">
                                    Confira como a foto vai ficar. Ela só é salva
                                    quando você confirmar.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={handleCancelImage}
                                disabled={uploading}
                                aria-label="Fechar"
                                className="cursor-pointer rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="flex justify-center bg-gray-50 px-5 py-8">
                            <div className="h-56 w-56 overflow-hidden rounded-full border-4 border-white bg-[#e5f5ef] shadow-lg">
                                <Image
                                    src={imagePreview}
                                    alt="Pré-visualização da foto de perfil"
                                    width={224}
                                    height={224}
                                    unoptimized
                                    className="h-full w-full object-cover"
                                />
                            </div>
                        </div>

                        <div className="space-y-3 border-t border-gray-100 p-5">
                            <button
                                type="button"
                                onClick={handleConfirmImage}
                                disabled={uploading}
                                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-[#35a989] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#27876d] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {uploading ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <Save size={16} />
                                )}
                                {uploading ? "Salvando..." : "Salvar foto"}
                            </button>

                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    type="button"
                                    onClick={() => fileRef.current?.click()}
                                    disabled={uploading}
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Camera size={15} />
                                    Trocar foto
                                </button>

                                <button
                                    type="button"
                                    onClick={handleCancelImage}
                                    disabled={uploading}
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <X size={15} />
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}