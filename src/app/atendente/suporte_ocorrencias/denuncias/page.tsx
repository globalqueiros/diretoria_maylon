"use client";

import {
    ArrowLeft,
    CheckCircle2,
    FileWarning,
    Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function Page() {
    const router = useRouter();

    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);

    function enviarDenuncia(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setEnviando(true);

        setTimeout(() => {
            setEnviando(false);
            setEnviado(true);
        }, 800);
    }

    if (enviado) {
        return (
            <main className="min-h-screen">
                <div className="mx-auto max-w-2xl">
                    <div className="rounded-lg border border-slate-200 bg-white p-8 text-center sm:p-10">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-slate-50">
                            <CheckCircle2
                                size={26}
                                className="text-slate-700"
                            />
                        </div>

                        <h1 className="mt-5 text-xl font-semibold text-slate-900">
                            Denúncia enviada
                        </h1>

                        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                            Sua denúncia foi registrada. As informações serão
                            encaminhadas para análise pela equipe responsável.
                        </p>

                        <button
                            type="button"
                            onClick={() => router.push("/suporte")}
                            className="mt-6 cursor-pointer rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                            Voltar para Suporte e Ocorrências
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen">
            <header className="mb-6">
                <button
                    type="button"
                    onClick={() => router.back()}
                    className="mb-4 flex cursor-pointer items-center gap-2 text-sm font-medium text-white/60 transition hover:text-white"
                >
                    <ArrowLeft size={16} />
                    Voltar
                </button>

                <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-white/15 bg-white/5">
                        <FileWarning size={20} className="text-white/80" />
                    </div>

                    <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-white/50">
                            Suporte e Ocorrências
                        </p>

                        <h1 className="text-2xl font-semibold text-white sm:text-3xl">
                            Denúncias
                        </h1>
                    </div>
                </div>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
                    Preencha o formulário abaixo com o máximo de informações
                    possível para que a ocorrência possa ser analisada.
                </p>
            </header>

            <section className="rounded-lg border border-slate-200 bg-white">
                <div className="border-b border-slate-100 p-5 sm:p-6">
                    <h2 className="text-base font-semibold text-slate-900">
                        Formulário de denúncia
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Os campos marcados com * são obrigatórios.
                    </p>
                </div>

                <form
                    onSubmit={enviarDenuncia}
                    className="space-y-5 p-5 sm:p-6"
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Nome
                            </label>

                            <input
                                name="nome"
                                type="text"
                                placeholder="Digite seu nome"
                                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Telefone / WhatsApp
                            </label>

                            <input
                                name="telefone"
                                type="tel"
                                placeholder="(00) 00000-0000"
                                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Tipo de ocorrência *
                            </label>

                            <select
                                name="tipo"
                                required
                                defaultValue=""
                                className="w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                            >
                                <option value="" disabled>
                                    Selecione uma opção
                                </option>
                                <option value="passageiro">
                                    Ocorrência com passageiro
                                </option>
                                <option value="motorista">
                                    Ocorrência com motorista
                                </option>
                                <option value="viagem">
                                    Ocorrência durante viagem
                                </option>
                                <option value="outros">
                                    Outros
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-slate-700">
                                Número da viagem
                            </label>

                            <input
                                name="viagem"
                                type="text"
                                placeholder="Se souber, informe o número"
                                className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Assunto *
                        </label>

                        <input
                            name="assunto"
                            type="text"
                            required
                            placeholder="Descreva brevemente o assunto"
                            className="w-full rounded-md border border-slate-200 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Descrição da ocorrência *
                        </label>

                        <textarea
                            name="descricao"
                            required
                            rows={7}
                            placeholder="Conte com detalhes o que aconteceu, informando data, horário, local e outras informações que possam ajudar na análise."
                            className="w-full resize-none rounded-md border border-slate-200 bg-white p-3.5 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-slate-400 focus:ring-1 focus:ring-slate-300"
                        />
                    </div>

                    <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-700">
                            Anexos
                        </label>

                        <input
                            name="anexos"
                            type="file"
                            multiple
                            className="block w-full cursor-pointer rounded-md border border-slate-200 bg-white text-sm text-slate-600 file:mr-4 file:cursor-pointer file:border-0 file:border-r file:border-slate-200 file:bg-slate-50 file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-slate-700"
                        />

                        <p className="mt-2 text-xs text-slate-400">
                            Você pode anexar fotos, documentos ou outros arquivos
                            relacionados à ocorrência.
                        </p>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="cursor-pointer rounded-md border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={enviando}
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Send size={16} />
                            {enviando ? "Enviando..." : "Enviar denúncia"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}