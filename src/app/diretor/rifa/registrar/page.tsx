"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    CalendarDays,
    Check,
    CircleDollarSign,
    Image as ImageIcon,
    Info,
    Ticket,
    Hash,
} from "lucide-react";

export default function RifaForm() {
    const [numeroRifa, setNumeroRifa] = useState("");
    const [titulo, setTitulo] = useState("");
    const [descricao, setDescricao] = useState("");
    const [imagem, setImagem] = useState("");
    const [valorNumero, setValorNumero] = useState("");
    const [totalNumeros, setTotalNumeros] = useState("");
    const [dataSorteio, setDataSorteio] = useState("");
    const [status, setStatus] = useState("aberta");

    const [alert, setAlert] = useState("");
    const [alertTipo, setAlertTipo] = useState<"success" | "error">(
        "success"
    );
    const [salvando, setSalvando] = useState(false);

    const gerarNumeroRifa = () => {
        const numero = Math.floor(
            10000000000 + Math.random() * 90000000000
        ).toString();

        setNumeroRifa(numero);
    };

    useEffect(() => {
  gerarNumeroRifa();
}, []);

    const cadastrarRifa = async (
        e: React.FormEvent<HTMLFormElement>
    ) => {
        e.preventDefault();

        if (!numeroRifa.trim()) {
            setAlertTipo("error");
            setAlert("Informe o número da rifa.");
            return;
        }

        if (!titulo.trim()) {
            setAlertTipo("error");
            setAlert("Informe o título da rifa.");
            return;
        }

        if (!valorNumero || Number(valorNumero) <= 0) {
            setAlertTipo("error");
            setAlert("Informe um valor válido para o número.");
            return;
        }

        if (!totalNumeros || Number(totalNumeros) <= 0) {
            setAlertTipo("error");
            setAlert("Informe a quantidade de números.");
            return;
        }

        if (!dataSorteio) {
            setAlertTipo("error");
            setAlert("Informe a data do sorteio.");
            return;
        }

        try {
            setSalvando(true);

            const response = await fetch("/api/rifas", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    numero_rifa: numeroRifa,
                    titulo,
                    descricao,
                    imagem,
                    valor_numero: Number(valorNumero),
                    total_numeros: Number(totalNumeros),
                    data_sorteio: dataSorteio,
                    status,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                setAlertTipo("error");
                setAlert(
                    data.mensagem || "Não foi possível cadastrar a rifa."
                );
                return;
            }

            setAlertTipo("success");
            setAlert(
                data.mensagem || "Rifa cadastrada com sucesso!"
            );

            setNumeroRifa("");
            setTitulo("");
            setDescricao("");
            setImagem("");
            setValorNumero("");
            setTotalNumeros("");
            setDataSorteio("");
            setStatus("aberta");

            setTimeout(() => {
                setAlert("");
            }, 4000);
        } catch (error) {
            console.error(error);

            setAlertTipo("error");
            setAlert("Não foi possível conectar ao servidor.");

            setTimeout(() => {
                setAlert("");
            }, 4000);
        } finally {
            setSalvando(false);
        }
    };

    return (
        <>
            {alert && (
                <div
                    className={`fixed right-5 top-5 z-[200] flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-xl ${alertTipo === "success"
                        ? "bg-emerald-500"
                        : "bg-red-500"
                        }`}
                >
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
                        {alertTipo === "success" ? (
                            <Check className="h-4 w-4" />
                        ) : (
                            "!"
                        )}
                    </div>

                    <span>{alert}</span>
                </div>
            )}

            <div className="w-full">
                <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                            Registrar nova rifa
                        </h1>

                        <p className="mt-0 text-sm text-white">
                            Preencha os dados abaixo para criar uma nova rifa.
                        </p>
                    </div>

                    <Link
                        href="/diretor/rifa"
                        className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Voltar
                    </Link>

                </div>

                <form onSubmit={cadastrarRifa}>

                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                        <div className="border-b border-slate-200 px-6 py-5">
                            <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                                    <Info className="h-5 w-5 text-teal-600" />
                                </div>

                                <div>
                                    <h2 className="text-base font-bold text-slate-900">
                                        Informações da rifa
                                    </h2>

                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Informações básicas para identificação da rifa.
                                    </p>
                                </div>

                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">

                            <div>
                                <label
                                    htmlFor="numero_rifa"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Número da Rifa
                                </label>

                                <div className="relative">
                                    <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                    <input
                                        id="numero_rifa"
                                        type="text"
                                        value={numeroRifa}
                                        onChange={(e) =>
                                            setNumeroRifa(e.target.value)
                                        }
                                        placeholder="Ex: 6188699"
                                        className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="titulo"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Título da Rifa
                                </label>

                                <input
                                    id="titulo"
                                    type="text"
                                    value={titulo}
                                    onChange={(e) =>
                                        setTitulo(e.target.value)
                                    }
                                    placeholder="Ex: Rifa iPhone 17 Pro Max"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                                />
                            </div>

                            <div className="md:col-span-2">
                                <label
                                    htmlFor="descricao"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Descrição
                                </label>

                                <textarea
                                    id="descricao"
                                    rows={4}
                                    value={descricao}
                                    onChange={(e) =>
                                        setDescricao(e.target.value)
                                    }
                                    placeholder="Descreva a premiação, regras e demais informações da rifa..."
                                    className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                                />
                            </div>

                        </div>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                        <div className="border-b border-slate-200 px-6 py-5">
                            <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                                    <CircleDollarSign className="h-5 w-5 text-teal-600" />
                                </div>

                                <div>
                                    <h2 className="text-base font-bold text-slate-900">
                                        Configuração da rifa
                                    </h2>

                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Defina o valor e a quantidade de números.
                                    </p>
                                </div>

                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">

                            <div>
                                <label
                                    htmlFor="valor_numero"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Valor por número
                                </label>

                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                                        R$
                                    </span>

                                    <input
                                        id="valor_numero"
                                        type="number"
                                        min="0.01"
                                        step="0.01"
                                        value={valorNumero}
                                        onChange={(e) =>
                                            setValorNumero(e.target.value)
                                        }
                                        placeholder="10,00"
                                        className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="total_numeros"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Quantidade de números
                                </label>

                                <input
                                    id="total_numeros"
                                    type="number"
                                    min="1"
                                    value={totalNumeros}
                                    onChange={(e) =>
                                        setTotalNumeros(e.target.value)
                                    }
                                    placeholder="Ex: 100"
                                    className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                                />
                            </div>

                        </div>
                    </div>

                    <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                        <div className="border-b border-slate-200 px-6 py-5">
                            <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">
                                    <CalendarDays className="h-5 w-5 text-teal-600" />
                                </div>

                                <div>
                                    <h2 className="text-base font-bold text-slate-900">
                                        Sorteio e imagem
                                    </h2>

                                    <p className="mt-0.5 text-xs text-slate-500">
                                        Defina quando será o sorteio e a imagem da campanha.
                                    </p>
                                </div>

                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">

                            <div>
                                <label
                                    htmlFor="data_sorteio"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    Data e hora do sorteio
                                </label>

                                <div className="relative">
                                    <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                    <input
                                        id="data_sorteio"
                                        type="datetime-local"
                                        value={dataSorteio}
                                        onChange={(e) =>
                                            setDataSorteio(e.target.value)
                                        }
                                        className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label
                                    htmlFor="imagem"
                                    className="mb-2 block text-sm font-semibold text-slate-700"
                                >
                                    URL da imagem
                                </label>

                                <div className="relative">
                                    <ImageIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                    <input
                                        id="imagem"
                                        type="url"
                                        value={imagem}
                                        onChange={(e) =>
                                            setImagem(e.target.value)
                                        }
                                        placeholder="https://exemplo.com/imagem.jpg"
                                        className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
                                    />
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="mt-5 rounded-2xl border border-teal-100 bg-teal-50/50 p-5">

                        <div className="flex gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-100">
                                <Ticket className="h-4 w-4 text-teal-700" />
                            </div>

                            <div>
                                <h3 className="text-sm font-bold text-teal-900">
                                    Antes de cadastrar
                                </h3>

                                <p className="mt-1 text-xs leading-5 text-teal-700">
                                    Ao cadastrar a rifa, os números serão criados
                                    automaticamente como disponíveis.
                                </p>
                            </div>

                        </div>
                    </div>

                    <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                        <Link
                            href="/diretor/rifa"
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Cancelar
                        </Link>

                        <button
                            type="submit"
                            disabled={salvando}
                            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-teal-600 px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <Check className="h-4 w-4" />

                            {salvando
                                ? "Cadastrando..."
                                : "Cadastrar Rifa"}
                        </button>

                    </div>

                </form>
            </div>
        </>
    );
}