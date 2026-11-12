"use client";

import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    Phone,
    Send,
    ShieldAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function Page() {
    const router = useRouter();
    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);

    function enviarEmergencia(event: FormEvent<HTMLFormElement>) {
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
                            Emergência registrada
                        </h1>

                        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
                            A ocorrência foi registrada para análise da equipe
                            responsável.
                        </p>

                        <div className="mt-6 rounded-xl border border-red-100 bg-red-50 p-4 text-left">
                            <p className="text-sm font-bold text-red-700">
                                Se a situação ainda estiver acontecendo,
                                procure imediatamente o serviço público de
                                emergência adequado.
                            </p>
                        </div>

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
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                        <ShieldAlert
                            size={23}
                            className="text-red-600"
                        />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-white/60">
                            Suporte e Ocorrências
                        </p>

                        <h1 className="text-2xl font-bold text-white sm:text-3xl">
                            Emergências
                        </h1>
                    </div>
                </div>

                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/70">
                    Utilize esta área para comunicar uma situação de emergência
                    relacionada a uma viagem ou atendimento.
                </p>
            </header>

            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-100">
                        <AlertTriangle
                            size={20}
                            className="text-red-600"
                        />
                    </div>

                    <div>
                        <h2 className="font-bold text-red-800">
                            Emergência imediata?
                        </h2>

                        <p className="mt-1 text-sm leading-6 text-red-700">
                            Se houver risco imediato à vida, violência,
                            incêndio ou necessidade urgente de atendimento,
                            entre em contato diretamente com o serviço público
                            apropriado.
                        </p>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-3">
                    <a
                        href="tel:190"
                        className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-4 text-sm font-bold text-red-700 shadow-sm ring-1 ring-red-200 transition hover:bg-red-100"
                    >
                        <Phone size={17} />
                        190 — Polícia
                    </a>

                    <a
                        href="tel:192"
                        className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-4 text-sm font-bold text-red-700 shadow-sm ring-1 ring-red-200 transition hover:bg-red-100"
                    >
                        <Phone size={17} />
                        192 — SAMU
                    </a>

                    <a
                        href="tel:193"
                        className="flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-4 text-sm font-bold text-red-700 shadow-sm ring-1 ring-red-200 transition hover:bg-red-100"
                    >
                        <Phone size={17} />
                        193 — Bombeiros
                    </a>
                </div>
            </div>

            <section className="rounded-2xl bg-white shadow-sm">
                <div className="border-b border-slate-100 p-5 sm:p-6">
                    <h2 className="text-lg font-bold text-slate-800">
                        Comunicar emergência
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                        Os campos marcados com * são obrigatórios.
                    </p>
                </div>

                <form
                    onSubmit={enviarEmergencia}
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
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
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
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Tipo de emergência *
                            </label>

                            <select
                                name="tipo"
                                required
                                defaultValue=""
                                className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                            >
                                <option value="" disabled>
                                    Selecione uma opção
                                </option>
                                <option value="acidente">
                                    Acidente
                                </option>
                                <option value="violencia">
                                    Violência / ameaça
                                </option>
                                <option value="problema-medico">
                                    Problema médico
                                </option>
                                <option value="incendio">
                                    Incêndio
                                </option>
                                <option value="risco">
                                    Risco à segurança
                                </option>
                                <option value="outros">
                                    Outros
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Número da viagem
                            </label>

                            <input
                                name="viagem"
                                type="text"
                                placeholder="Se souber, informe"
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Local da emergência *
                        </label>

                        <input
                            name="local"
                            type="text"
                            required
                            placeholder="Informe o endereço ou localização"
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                        />
                    </div>

                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Data *
                            </label>

                            <input
                                name="data"
                                type="date"
                                required
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                            />
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-semibold text-slate-700">
                                Horário *
                            </label>

                            <input
                                name="horario"
                                type="time"
                                required
                                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Descrição da emergência *
                        </label>

                        <textarea
                            name="descricao"
                            required
                            rows={7}
                            placeholder="Descreva o que está acontecendo, quem está envolvido e outras informações importantes."
                            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-700 outline-none transition focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100"
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
                            Anexe imagens ou documentos somente se isso puder
                            ser feito com segurança.
                        </p>
                    </div>

                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                        <p className="text-xs leading-5 text-amber-800">
                            O envio deste formulário não substitui o contato
                            com os serviços públicos de emergência. Em uma
                            situação de risco imediato, utilize os números
                            indicados acima.
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
                            className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Send size={17} />
                            {enviando
                                ? "Registrando..."
                                : "Registrar emergência"}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}