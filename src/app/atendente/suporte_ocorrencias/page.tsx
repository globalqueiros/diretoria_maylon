"use client";

import {
    AlertTriangle,
    ArrowRight,
    Car,
    FileWarning,
    PackageSearch,
    ShieldAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function Page() {
    const router = useRouter();

    const ocorrencias = [
        {
            titulo: "Objetos Perdidos",
            descricao: "Registre ou consulte informações sobre objetos esquecidos durante uma viagem.",
            icon: PackageSearch,
            cor: "blue",
            rota: "/atendente/suporte_ocorrencias/objetos-perdidos",
        },
        {
            titulo: "Acidentes",
            descricao: "Registre ocorrências envolvendo acidentes durante uma viagem.",
            icon: Car,
            cor: "amber",
            rota: "/atendente/suporte_ocorrencias/acidentes",
        },
        {
            titulo: "Emergências",
            descricao: "Acesse rapidamente o atendimento para situações de emergência.",
            icon: ShieldAlert,
            cor: "red",
            rota: "/atendente/suporte_ocorrencias/emergencias",
        },
        {
            titulo: "Denúncias",
            descricao: "Envie uma denúncia através de um formulário seguro e detalhado.",
            icon: FileWarning,
            cor: "purple",
            rota: "/atendente/suporte_ocorrencias/denuncias",
        },
    ];

    const cores = {
        blue: {
            bg: "bg-blue-100",
            icon: "text-blue-600",
            hover: "hover:border-blue-200 hover:bg-blue-50/50",
            button: "bg-blue-600 hover:bg-blue-700",
        },
        amber: {
            bg: "bg-amber-100",
            icon: "text-amber-600",
            hover: "hover:border-amber-200 hover:bg-amber-50/50",
            button: "bg-amber-500 hover:bg-amber-600",
        },
        red: {
            bg: "bg-red-100",
            icon: "text-red-600",
            hover: "hover:border-red-200 hover:bg-red-50/50",
            button: "bg-red-500 hover:bg-red-600",
        },
        purple: {
            bg: "bg-purple-100",
            icon: "text-purple-600",
            hover: "hover:border-purple-200 hover:bg-purple-50/50",
            button: "bg-purple-600 hover:bg-purple-700",
        },
    } as const;

    return (
        <main className="min-h-screen">
            <header className="mb-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-white sm:text-3xl">
                            Suporte e Ocorrências
                        </h1>

                        <p className="mt-1 max-w-2xl text-sm text-white/70">
                            Central para registro e acompanhamento de situações
                            relacionadas às viagens.
                        </p>
                    </div>
                </div>
            </header>

            <section className="mb-6">
                <div className="mb-4">
                    <h2 className="text-xl font-bold text-white">
                        Selecione uma ocorrência
                    </h2>

                    <p className="mt-1 text-sm text-white/60">
                        Escolha abaixo o tipo de atendimento que deseja registrar.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {ocorrencias.map((item) => {
                        const Icon = item.icon;
                        const cor = cores[item.cor as keyof typeof cores];

                        return (
                            <div
                                key={item.titulo}
                                onClick={() => router.push(item.rota)}
                                className={`group cursor-pointer rounded-xl border border-transparent bg-white p-5 shadow-sm transition duration-200 ${cor.hover}`}
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div
                                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${cor.bg}`}
                                    >
                                        <Icon size={23} className={cor.icon} />
                                    </div>

                                    <ArrowRight
                                        size={18}
                                        className="mt-1 text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-500"
                                    />
                                </div>

                                <h3 className="mt-5 text-lg font-bold text-slate-800">
                                    {item.titulo}
                                </h3>

                                <p className="mt-2 min-h-[48px] text-sm leading-6 text-slate-500">
                                    {item.descricao}
                                </p>

                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        router.push(item.rota);
                                    }}
                                    className={`mt-5 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition ${cor.button}`}
                                >
                                    Acessar
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>

            <section className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100">
                        <AlertTriangle size={23} className="text-red-600" />
                    </div>

                    <div>
                        <h2 className="text-lg font-bold text-slate-800">
                            Situação de emergência
                        </h2>

                        <p className="mt-1 text-sm text-slate-500">
                            Para situações que ofereçam risco imediato à vida ou à
                            segurança, utilize os canais oficiais de emergência.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
