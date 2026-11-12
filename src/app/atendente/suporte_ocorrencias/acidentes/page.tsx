"use client";

import {
    ArrowLeft,
    CarFront,
    CheckCircle2,
    MapPin,
    Send,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function Page() {
    const router = useRouter();
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);

    function enviarAcidente(event: FormEvent<HTMLFormElement>) {
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
                    <div className="rounded-2xl bg-white p-8 text-center shadow-sm sm:p-10">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                            <CheckCircle2
                                size={32}
                                className="text-emerald-600"
                            />
                        </div>

                        <h1 className="mt-5 text-2xl font-bold text-slate-800">
                            Acidente registrado
                        </h1>

                        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                            Sua ocorrência foi registrada com sucesso. Nossa
                            equipe poderá analisar as informações e os anexos
                            enviados.
                        </p>

                        <button
                            type="button"
                            onClick={() => router.push("/suporte")}
                            className="mt-6 cursor-pointer rounded-xl bg-[#00a99d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#00958b]"
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
                    className="mb-4 flex cursor-pointer items-center gap-2 text-sm font-semibold text-white/70 transition hover:text-white"
                >
                    <ArrowLeft size={17} />
                    Voltar
                </button>

                <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                        <CarFront
                            size={23}
                            className="text-orange-600"
                        />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-white/60">
                            Suporte e Ocorrências
                        </p>

                        <h1 className="text-2xl font-bold text-white sm:text-3xl">
                            Acidentes
                        </h1>
                    </div>
                </div>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                    Informe os detalhes do acidente para que nossa equipe possa
                    registrar e analisar a ocorrência.
                </p>
            </header>

            <section className="rounded-2xl bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5 sm:p-6">
                    <h2 className="text-lg font-bold text-slate-800">
                        Registro de acidente
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Os campos marcados com * são obrigatórios.
                    </p>
                </div>

                <form
                    onSubmit={enviarAcidente}
                    className="space-y-5 p-5 sm:p-6"
                >
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Nome *
                            </label>

                            <input
                                name="nome"
                                type="text"
                                required
                                placeholder="Digite seu nome"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Telefone / WhatsApp *
                            </label>

                            <input
                                name="telefone"
                                type="tel"
                                required
                                placeholder="(00) 00000-0000"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Número da viagem
                            </label>

                            <input
                                name="viagem"
                                type="text"
                                placeholder="Se souber, informe"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Data do acidente *
                            </label>

                            <input
                                name="data"
                                type="date"
                                required
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Horário *
                            </label>

                            <input
                                name="horario"
                                type="time"
                                required
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Gravidade *
                            </label>

                            <select
                                name="gravidade"
                                required
                                defaultValue=""
                                className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                            >
                                <option value="" disabled>
                                    Selecione
                                </option>
                                <option value="leve">Leve</option>
                                <option value="moderado">Moderado</option>
                                <option value="grave">Grave</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Local do acidente *
                        </label>

                        <div className="relative">
                            <MapPin
                                size={18}
                                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                            <input
                                name="local"
                                type="text"
                                required
                                placeholder="Rua, número, bairro, cidade"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Houve feridos?
                        </label>

                        <div className="flex flex-wrap gap-3">
                            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                                <input
                                    type="radio"
                                    name="feridos"
                                    value="sim"
                                    className="accent-orange-500"
                                />
                                Sim
                            </label>

                            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700">
                                <input
                                    type="radio"
                                    name="feridos"
                                    value="nao"
                                    defaultChecked
                                    className="accent-orange-500"
                                />
                                Não
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Descrição do acidente *
                        </label>

                        <textarea
                            name="descricao"
                            required
                            rows={7}
                            placeholder="Descreva o que aconteceu, veículos envolvidos, condições da via e outras informações importantes."
                            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-100"
                        />
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Anexos
                        </label>

                        <input
                            name="anexos"
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            className="block w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-600 file:mr-4 file:cursor-pointer file:border-0 file:bg-slate-100 file:px-4 file:py-3 file:text-sm file:font-semibold file:text-slate-700"
                        />

                        <p className="mt-2 text-xs text-slate-400">
                            Você pode anexar fotos do acidente, documentos ou
                            outros arquivos relacionados.
                        </p>
                    </div>

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="cursor-pointer rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            disabled={enviando}
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-orange-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Send size={17} />
                            {enviando ? "Registrando..." : "Registrar acidente"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}