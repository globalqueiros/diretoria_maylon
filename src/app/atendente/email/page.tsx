"use client";
import { useState } from "react";
import { Copy, Mail, LockKeyhole, Eye, EyeOff, Check } from "lucide-react";

export default function EmailAtendentePage() {
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [copiado, setCopiado] = useState("");
    const [mostrarCredenciais, setMostrarCredenciais] = useState(false);

    const email = "suporte@maylon.com.br";
    const senha = "6hbJC;w-~rZ4nuj[";
    const webmailUrl = "https://webmail.maylon.com.br";

    async function copiar(texto: string, campo: string) {
        try {
            await navigator.clipboard.writeText(texto);
            setCopiado(campo);
            window.setTimeout(() => setCopiado(""), 2000);
        } catch {
            alert("Não foi possível copiar. Verifique a permissão do navegador.");
        }
    }

    return (
        <main className="min-h-screen space-y-4">
            <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-semibold text-gray-800">
                        Caixa de e-mail MAYLON
                    </h2>
                    <a
                        href={webmailUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                    >
                        Abrir Roundcube
                    </a>
                </div>
                <iframe
                    src={webmailUrl}
                    title="Roundcube Webmail MAYLON"
                    className="h-[75vh] min-h-[800px] w-full rounded-2xl border bg-white"
                    referrerPolicy="strict-origin"
                    allow="clipboard-read; clipboard-write"
                />
            </div>

            <section className="my-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h2 className="font-semibold text-gray-800">
                        Credenciais do e-mail para acesso
                    </h2>

                    <button
                        type="button"
                        onClick={() => setMostrarCredenciais(!mostrarCredenciais)}
                        className="text-sm font-medium text-emerald-800 hover:text-emerald-950"
                    >
                        {mostrarCredenciais ? "Ocultar" : "Mostrar credenciais"}
                    </button>
                </div>

                <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <Mail size={20} className="shrink-0 text-emerald-700" />
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500">E-mail</p>
                            <p className="break-all text-sm font-medium text-gray-800">
                                {email}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => copiar(email, "email")}
                        aria-label="Copiar e-mail"
                        className="flex shrink-0 items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm hover:bg-emerald-100"
                    >
                        {copiado === "email" ? (
                            <Check size={16} />
                        ) : (
                            <Copy size={16} />
                        )}
                        {copiado === "email" ? "Copiado" : "Copiar"}
                    </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                        <LockKeyhole
                            size={20}
                            className="shrink-0 text-emerald-700"
                        />
                        <div className="min-w-0">
                            <p className="text-xs text-gray-500">Senha</p>
                            <p className="break-all text-sm font-medium text-gray-800">
                                {mostrarCredenciais && mostrarSenha
                                    ? senha
                                    : "••••••••••••"}
                            </p>
                        </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setMostrarSenha(!mostrarSenha)}
                            aria-label={mostrarSenha ? "Ocultar senha" : "Revelar senha"}
                            className="rounded-lg border border-emerald-200 bg-white p-2 hover:bg-emerald-100"
                        >
                            {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>

                        <button
                            type="button"
                            onClick={() => copiar(senha, "senha")}
                            aria-label="Copiar senha"
                            className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm hover:bg-emerald-100"
                        >
                            {copiado === "senha" ? (
                                <Check size={16} />
                            ) : (
                                <Copy size={16} />
                            )}
                            {copiado === "senha" ? "Copiado" : "Copiar"}
                        </button>
                    </div>
                </div>

                <p className="mt-4 text-xs leading-5 text-gray-600">
                    Restrinja o acesso a esta página aos atendentes autorizados.
                    Não compartilhe essas credenciais publicamente.
                </p>
            </section>
        </main>
    );
}