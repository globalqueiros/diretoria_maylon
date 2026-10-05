"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    BriefcaseBusiness,
    Hash,
    ShieldCheck,
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

export default function DetalhesColaborador() {
    const params = useParams<{ matricula: string }>();

    const matricula = params?.matricula;

    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState<string | null>(null);

    useEffect(() => {
        if (!matricula) {
            setErro("Matrícula não informada.");
            setLoading(false);
            return;
        }

        async function carregarColaborador() {
            try {
                setLoading(true);
                setErro(null);

                const response = await fetch(
                    `/api/users/${encodeURIComponent(String(matricula))}`,
                    {
                        method: "GET",
                        cache: "no-store",
                        headers: {
                            Accept: "application/json",
                        },
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data?.message ||
                            "Não foi possível carregar o colaborador."
                    );
                }

                setUsuario(data);
            } catch (error) {
                console.error(
                    "Erro ao carregar colaborador:",
                    error
                );

                setUsuario(null);

                setErro(
                    error instanceof Error
                        ? error.message
                        : "Erro ao carregar colaborador."
                );
            } finally {
                setLoading(false);
            }
        }

        carregarColaborador();
    }, [matricula]);

    /*
     * ==========================================
     * LOADING
     * ==========================================
     */
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                    <div className="mb-5 h-5 w-20 animate-pulse rounded bg-slate-200" />

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                        <div className="h-28 animate-pulse bg-slate-200" />

                        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 sm:p-6">
                            {[1, 2, 3, 4, 5].map((item) => (
                                <div
                                    key={item}
                                    className="h-24 animate-pulse rounded-xl bg-slate-100"
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /*
     * ==========================================
     * ERRO
     * ==========================================
     */
    if (erro || !usuario) {
        return (
            <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-3xl">
                    <Link
                        href="/diretor/colaboradores"
                        className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-teal-600"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Link>

                    <div className="rounded-2xl border border-red-200 bg-white p-8 text-center shadow-xl">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-50">
                            <User className="h-6 w-6 text-red-500" />
                        </div>

                        <h1 className="mt-4 text-lg font-bold text-slate-800">
                            Colaborador não encontrado
                        </h1>

                        <p className="mt-2 text-sm text-slate-500">
                            {erro || "Não foi possível carregar os dados."}
                        </p>

                        <Link
                            href="/diretor/colaboradores"
                            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-teal-700"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Voltar para colaboradores
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    /*
     * ==========================================
     * STATUS
     * ==========================================
     */
    const status = usuario.status || "Ativo";

    const statusAtivo =
        status.toLowerCase() === "ativo" ||
        status.toLowerCase() === "active";

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">

                {/* VOLTAR */}
                <Link
                    href="/diretor/colaboradores"
                    className="mb-5 inline-flex items-center gap-2 text-xs font-semibold text-slate-500 transition hover:text-teal-600"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                </Link>

                {/* CARD PRINCIPAL */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">

                    {/* CABEÇALHO */}
                    <div className="relative overflow-hidden bg-gradient-to-r from-teal-700 to-teal-500 px-5 py-6 sm:px-6">

                        <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-white/10" />

                        <div className="relative flex items-center gap-4">

                            {/* FOTO */}
                            {usuario.profile_image ? (
                                <img
                                    src={usuario.profile_image}
                                    alt={
                                        usuario.full_name ||
                                        "Colaborador"
                                    }
                                    className="h-14 w-14 shrink-0 rounded-xl border-2 border-white/30 object-cover shadow"
                                />
                            ) : (
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-teal-700 shadow">
                                    <User className="h-6 w-6" />
                                </div>
                            )}

                            <div className="min-w-0">
                                <h1 className="truncate text-lg font-bold text-white sm:text-xl">
                                    {usuario.full_name ||
                                        "Colaborador"}
                                </h1>

                                <p className="mt-1 text-xs text-teal-100">
                                    Detalhes do colaborador cadastrado
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* INFORMAÇÕES */}
                    <div className="p-5 sm:p-6">

                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                            {/* MATRÍCULA */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-2">
                                    <Hash className="h-4 w-4 text-teal-600" />

                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Matrícula
                                    </span>
                                </div>

                                <p className="mt-2 text-sm font-bold text-slate-800">
                                    {usuario.matricula || "—"}
                                </p>
                            </div>

                            {/* NOME */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-teal-600" />

                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Colaborador
                                    </span>
                                </div>

                                <p className="mt-2 truncate text-sm font-bold text-slate-800">
                                    {usuario.full_name ||
                                        "Não informado"}
                                </p>
                            </div>

                            {/* CARGO / PERFIL */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-2">
                                    <BriefcaseBusiness className="h-4 w-4 text-teal-600" />

                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Perfil
                                    </span>
                                </div>

                                <p className="mt-2 text-sm font-bold text-slate-800">
                                    {usuario.user_type ||
                                        "Não informado"}
                                </p>
                            </div>

                            {/* E-MAIL */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-teal-600" />

                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        E-mail
                                    </span>
                                </div>

                                <p className="mt-2 truncate text-sm font-bold text-slate-800">
                                    {usuario.email ||
                                        "Não informado"}
                                </p>
                            </div>

                            {/* TELEFONE */}
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:col-span-2">
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-teal-600" />

                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        Telefone
                                    </span>
                                </div>

                                <p className="mt-2 text-sm font-bold text-slate-800">
                                    {usuario.phone ||
                                        "Não informado"}
                                </p>
                            </div>
                        </div>

                        {/* STATUS */}
                        <div
                            className={`mt-5 flex items-center justify-between rounded-xl border px-4 py-3 ${
                                statusAtivo
                                    ? "border-emerald-200 bg-emerald-50"
                                    : "border-slate-200 bg-slate-50"
                            }`}
                        >
                            <div>
                                <p
                                    className={`text-[10px] font-bold uppercase tracking-wider ${
                                        statusAtivo
                                            ? "text-emerald-600"
                                            : "text-slate-500"
                                    }`}
                                >
                                    Status
                                </p>

                                <p
                                    className={`mt-1 text-sm font-bold ${
                                        statusAtivo
                                            ? "text-emerald-700"
                                            : "text-slate-700"
                                    }`}
                                >
                                    {status}
                                </p>
                            </div>

                            <div
                                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[9px] font-bold ${
                                    statusAtivo
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-slate-200 text-slate-600"
                                }`}
                            >
                                <ShieldCheck className="h-3 w-3" />

                                {statusAtivo
                                    ? "Cadastro ativo"
                                    : "Cadastro"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}