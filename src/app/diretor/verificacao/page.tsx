"use client";

import {
    CheckCircle2,
    ChevronDown,
    Clock3,
    Filter,
    RefreshCw,
    Search,
    User,
    XCircle,
} from "lucide-react";
import { useMemo, useState } from "react";

type SessionStatus =
    | "Ativa"
    | "Concluída"
    | "Pendente"
    | "Cancelada";

type SessionType =
    | "Fornecedor"
    | "Cliente"
    | "Autenticação"
    | "Integração";

type Session = {
    id: string;
    userName: string;
    userEmail: string;
    sessionType: SessionType;
    status: SessionStatus;
    supplier: string;
    phone: string;
    createdAt: string;
};

/*
|--------------------------------------------------------------------------
| SESSÕES
|--------------------------------------------------------------------------
| Por enquanto deixamos vazio para reproduzir o estado:
| "Sem dados disponíveis"
|
| Depois você pode substituir pelo retorno da API.
|--------------------------------------------------------------------------
*/

const sessions: Session[] = [];

/*
|--------------------------------------------------------------------------
| STATUS
|--------------------------------------------------------------------------
*/

const statusClasses: Record<SessionStatus, string> = {
    Ativa: "bg-emerald-50 text-emerald-600",
    Concluída: "bg-blue-50 text-blue-600",
    Pendente: "bg-orange-50 text-orange-600",
    Cancelada: "bg-red-50 text-red-600",
};

function StatusIcon({ status }: { status: SessionStatus }) {
    if (status === "Ativa") {
        return <CheckCircle2 size={14} />;
    }

    if (status === "Concluída") {
        return <CheckCircle2 size={14} />;
    }

    if (status === "Pendente") {
        return <Clock3 size={14} />;
    }

    return <XCircle size={14} />;
}

/*
|--------------------------------------------------------------------------
| PÁGINA
|--------------------------------------------------------------------------
*/

export default function SessoesPage() {
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("Todos");
    const [type, setType] = useState("Todos");

    const filteredSessions = useMemo(() => {
        const normalizedSearch = search.toLowerCase().trim();

        return sessions.filter((session) => {
            const matchesSearch =
                !normalizedSearch ||
                session.id.toLowerCase().includes(normalizedSearch) ||
                session.userName.toLowerCase().includes(normalizedSearch) ||
                session.userEmail.toLowerCase().includes(normalizedSearch) ||
                session.supplier.toLowerCase().includes(normalizedSearch) ||
                session.phone.toLowerCase().includes(normalizedSearch);

            const matchesStatus =
                status === "Todos" || session.status === status;

            const matchesType =
                type === "Todos" || session.sessionType === type;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesType
            );
        });
    }, [search, status, type]);

    function handleRefresh() {
        window.location.reload();
    }

    return (
        <main className="min-h-screen">
            <div className="mx-auto w-full max-w-[1600px]">
                {/* =====================================================
                    CABEÇALHO
                ===================================================== */}

                <header className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h1 className="text-[30px] font-extrabold tracking-tight text-white">
                            Sessões
                        </h1>

                        <p className="mt-1 text-sm text-white/95">
                            Acompanhe sessões, utilizadores, fornecedores e
                            autenticações do Maylon.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleRefresh}
                        className="flex w-fit cursor-pointer items-center gap-2 rounded-lg bg-[#00aaa2] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#009991]"
                    >
                        <RefreshCw size={17} />
                        Atualizar
                    </button>
                </header>

                {/* =====================================================
                    FILTROS
                ===================================================== */}

                <section className="overflow-hidden rounded-xl bg-white shadow-sm">
                    <div className="flex flex-col gap-4 border-b border-slate-100 p-5 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                                    <User size={21} />
                                </div>

                                <div>
                                    <h2 className="font-bold text-[#092b55]">
                                        Sessões do sistema
                                    </h2>

                                    <p className="text-xs text-slate-500">
                                        Gerencie e acompanhe as sessões
                                        realizadas no Maylon.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-slate-500">
                            Total de sessões:{" "}
                            <strong className="text-[#092b55]">
                                {filteredSessions.length}
                            </strong>
                        </div>
                    </div>

                    {/* =================================================
                        BARRA DE FILTROS
                    ================================================= */}

                    <div className="flex flex-col gap-3 border-b border-slate-100 p-4 xl:flex-row xl:items-center">
                        {/* BUSCA */}

                        <label className="flex h-[40px] w-full items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-400 xl:max-w-[360px]">
                            <Search size={16} />

                            <input
                                type="text"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Buscar sessão, utilizador..."
                                className="w-full bg-transparent text-xs text-slate-600 outline-none placeholder:text-slate-400"
                            />
                        </label>

                        {/* STATUS */}

                        <label className="flex h-[40px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500">
                            <Filter size={15} />

                            <select
                                value={status}
                                onChange={(event) =>
                                    setStatus(event.target.value)
                                }
                                className="cursor-pointer border-0 bg-transparent text-xs font-medium text-slate-600 outline-none"
                            >
                                <option value="Todos">
                                    Todos os estados
                                </option>

                                <option value="Ativa">
                                    Ativa
                                </option>

                                <option value="Concluída">
                                    Concluída
                                </option>

                                <option value="Pendente">
                                    Pendente
                                </option>

                                <option value="Cancelada">
                                    Cancelada
                                </option>
                            </select>

                            <ChevronDown size={14} />
                        </label>

                        {/* TIPO */}

                        <label className="flex h-[40px] items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-500">
                            <select
                                value={type}
                                onChange={(event) =>
                                    setType(event.target.value)
                                }
                                className="cursor-pointer border-0 bg-transparent text-xs font-medium text-slate-600 outline-none"
                            >
                                <option value="Todos">
                                    Todos os tipos
                                </option>

                                <option value="Fornecedor">
                                    Fornecedor
                                </option>

                                <option value="Cliente">
                                    Cliente
                                </option>

                                <option value="Autenticação">
                                    Autenticação
                                </option>

                                <option value="Integração">
                                    Integração
                                </option>
                            </select>

                            <ChevronDown size={14} />
                        </label>

                        {/* LIMPAR */}

                        {(search ||
                            status !== "Todos" ||
                            type !== "Todos") && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearch("");
                                    setStatus("Todos");
                                    setType("Todos");
                                }}
                                className="h-[40px] rounded-lg border border-slate-200 px-4 text-xs font-semibold text-slate-500 transition hover:bg-slate-50"
                            >
                                Limpar filtros
                            </button>
                        )}
                    </div>

                    {/* =================================================
                        TABELA
                    ================================================= */}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] border-collapse text-left">
                            <thead>
                                <tr className="border-b border-slate-200 bg-[#fafbfc]">
                                    <th className="w-[60px] px-4 py-3">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-slate-300"
                                        />
                                    </th>

                                    <TableHead>
                                        SESSION
                                    </TableHead>

                                    <TableHead>
                                        INFO DO UTILIZADOR
                                    </TableHead>

                                    <TableHead>
                                        TIPO DE SESSÃO
                                    </TableHead>

                                    <TableHead>
                                        ESTADO
                                    </TableHead>

                                    <TableHead>
                                        DADOS DO FORNECEDOR
                                    </TableHead>

                                    <TableHead>
                                        TELEFONE
                                    </TableHead>

                                    <TableHead>
                                        CRIADO EM
                                    </TableHead>
                                </tr>
                            </thead>

                            <tbody>
                                {filteredSessions.length > 0 ? (
                                    filteredSessions.map((session) => (
                                        <tr
                                            key={session.id}
                                            className="border-b border-slate-100 transition hover:bg-slate-50"
                                        >
                                            {/* CHECKBOX */}

                                            <td className="px-4 py-4">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-slate-300"
                                                />
                                            </td>

                                            {/* SESSION */}

                                            <td className="px-4 py-4">
                                                <span className="font-mono text-xs font-semibold text-[#092b55]">
                                                    {session.id}
                                                </span>
                                            </td>

                                            {/* UTILIZADOR */}

                                            <td className="px-4 py-4">
                                                <div>
                                                    <p className="text-sm font-semibold text-[#092b55]">
                                                        {session.userName}
                                                    </p>

                                                    <p className="mt-0.5 text-xs text-slate-400">
                                                        {session.userEmail}
                                                    </p>
                                                </div>
                                            </td>

                                            {/* TIPO */}

                                            <td className="px-4 py-4">
                                                <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-600">
                                                    {session.sessionType}
                                                </span>
                                            </td>

                                            {/* ESTADO */}

                                            <td className="px-4 py-4">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold ${statusClasses[session.status]}`}
                                                >
                                                    <StatusIcon
                                                        status={
                                                            session.status
                                                        }
                                                    />

                                                    {session.status}
                                                </span>
                                            </td>

                                            {/* FORNECEDOR */}

                                            <td className="px-4 py-4">
                                                <span className="text-sm text-slate-600">
                                                    {session.supplier ||
                                                        "—"}
                                                </span>
                                            </td>

                                            {/* TELEFONE */}

                                            <td className="px-4 py-4">
                                                <span className="text-sm text-slate-500">
                                                    {session.phone || "—"}
                                                </span>
                                            </td>

                                            {/* DATA */}

                                            <td className="px-4 py-4">
                                                <span className="whitespace-nowrap text-xs text-slate-500">
                                                    {session.createdAt}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <EmptyState />
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}

/*
|--------------------------------------------------------------------------
| CABEÇALHO DA TABELA
|--------------------------------------------------------------------------
*/

function TableHead({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {children}
        </th>
    );
}

/*
|--------------------------------------------------------------------------
| ESTADO VAZIO
|--------------------------------------------------------------------------
*/

function EmptyState() {
    return (
        <tr>
            <td
                colSpan={8}
                className="h-[390px] px-5 py-10"
            >
                <div className="flex h-full flex-col items-center justify-center text-center">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <User size={25} />
                    </div>

                    <h3 className="text-base font-semibold text-[#092b55]">
                        Sem dados disponíveis
                    </h3>

                    <p className="mt-2 max-w-[430px] text-xs leading-5 text-slate-400">
                        Não há dados para exibir no momento.
                        Tente ajustar os seus filtros ou atualizar
                        a página.
                    </p>

                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="mt-5 cursor-pointer flex items-center gap-2 rounded-lg bg-[#252525] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[#333]"
                    >
                        <RefreshCw size={15} />
                        Atualizar
                    </button>
                </div>
            </td>
        </tr>
    );
}