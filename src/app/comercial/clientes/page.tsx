"use client";

import { useState, useEffect } from "react";
import {
    Users,
    UserPlus,
    UserX,
    CircleCheck,
    Search,
    Eye,
    MapPin,
    RefreshCw,
    LoaderCircle,
} from "lucide-react";
import Link from "next/link";

type Cliente = {
    id: number;
    numero: string;
    nome: string;
    email: string | null;
    telefone: string | null;
    cidade: string | null;
    status: number;
    criado_em?: string | null;
};

export default function ClientesPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [busca, setBusca] = useState("");
    const [loading, setLoading] = useState(true);
    const [erro, setErro] = useState("");

    // BUSCAR CLIENTES DO MYSQL
    async function buscarClientes() {
        try {
            setLoading(true);
            setErro("");

            const response = await fetch("/api/clientes", {
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error("Erro ao buscar clientes.");
            }

            const dados = await response.json();
            setClientes(dados);

        } catch (error) {
            console.error(error);
            setErro("Não foi possível carregar os clientes.");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        buscarClientes();
    }, []);

    // INDICADORES
    const ativos = clientes.filter((c) => Number(c.status) === 0).length;

    const inativos = clientes.length - ativos;

    const novos = clientes.filter((c) => {
        if (!c.criado_em) return false;
        const data = new Date(c.criado_em).getTime();
        return Number.isFinite(data) && data >= Date.now() - 30 * 24 * 60 * 60 * 1000;
    }).length;

    const filtrados = clientes.filter((c) =>
        `${c.numero} ${c.nome} ${c.email || ""} ${c.telefone || ""} ${c.cidade || ""}`
            .toLowerCase()
            .includes(busca.toLowerCase())
    );

    return (
        <main className="min-h-screen">

            {/* INDICADORES */}
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">

                <Card
                    titulo="TOTAL DE CLIENTES"
                    valor={clientes.length}
                    icon={<Users size={21} />}
                    cor="teal"
                />

                <Card
                    titulo="CLIENTES ATIVOS"
                    valor={ativos}
                    icon={<CircleCheck size={21} />}
                    cor="green"
                />

                <Card
                    titulo="CLIENTES INATIVOS"
                    valor={inativos}
                    icon={<UserX size={21} />}
                    cor="orange"
                />

                <Card
                    titulo="NOVOS CLIENTES"
                    valor={novos}
                    icon={<UserPlus size={21} />}
                    cor="blue"
                />

            </section>

            {/* TABELA */}
            <section className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

                {/* CABEÇALHO */}
                <div className="flex flex-col justify-between gap-4 border-b border-slate-100 p-5 md:flex-row md:items-center">

                    <div className="flex items-center gap-3">

                        <div className="rounded-lg bg-teal-50 p-2.5 text-teal-600">
                            <Users size={21} />
                        </div>

                        <div>
                            <h2 className="text-lg font-bold text-slate-900">
                                Histórico de clientes
                            </h2>

                            <p className="mt-1 text-sm text-slate-400">
                                Confira todos os clientes cadastrados.
                            </p>
                        </div>

                    </div>

                    {/* BOTÃO ATUALIZAR */}
                    <button
                        type="button"
                        onClick={buscarClientes}
                        disabled={loading}
                        className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? (
                            <LoaderCircle
                                size={17}
                                className="animate-spin"
                            />
                        ) : (
                            <RefreshCw size={17} />
                        )}

                        {loading ? "Atualizando..." : "Atualizar"}
                    </button>

                </div>

                {/* PESQUISA */}
                <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center">

                    <div className="relative w-full sm:max-w-md">

                        <Search
                            size={18}
                            className="absolute left-3 top-3 text-slate-400"
                        />

                        <input
                            value={busca}
                            onChange={(e) => setBusca(e.target.value)}
                            placeholder="Pesquisar cliente, número ou e-mail..."
                            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500"
                        />

                    </div>

                    <span className="rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
                        {clientes.length} clientes
                    </span>

                </div>

                {/* TABELA */}
                <div className="overflow-x-auto">

                    <table className="w-full min-w-[1050px] text-left">

                        <thead className="bg-slate-50">

                            <tr className="text-[11px] font-semibold tracking-wider text-slate-400">

                                <th className="px-6 py-5 text-center">
                                    Nº CLIENTE
                                </th>

                                <th className="px-6 py-5 text-center">
                                    NOME COMPLETO / RAZÃO SOCIAL
                                </th>

                                <th className="px-6 py-5 text-center">
                                    CONTATO
                                </th>

                                <th className="px-6 py-5 text-center">
                                    TELEFONE
                                </th>

                                <th className="px-6 py-5 text-center">
                                    LOCALIZAÇÃO
                                </th>

                                <th className="px-6 py-5 text-center">
                                    STATUS
                                </th>

                                <th className="px-6 py-5 text-center">
                                    AÇÃO
                                </th>

                            </tr>

                        </thead>

                        <tbody className="divide-y divide-slate-100 text-center">

                            {/* CARREGANDO */}
                            {loading && (
                                <tr>
                                    <td colSpan={7} className="py-12 text-sm text-slate-400">
                                        Carregando clientes...
                                    </td>
                                </tr>
                            )}

                            {/* ERRO */}
                            {!loading && erro && (
                                <tr>
                                    <td colSpan={7} className="py-12 text-sm text-red-500">
                                        {erro}

                                        <button
                                            onClick={buscarClientes}
                                            className="ml-3 font-semibold text-teal-600 underline"
                                        >
                                            Tentar novamente
                                        </button>
                                    </td>
                                </tr>
                            )}

                            {/* CLIENTES */}
                            {!loading && !erro && filtrados.map((cliente) => (

                                <tr
                                    key={cliente.id}
                                    className="transition hover:bg-slate-50/80"
                                >

                                    <td className="px-6 py-5">
                                        <strong className="text-sm font-bold text-[#1765A1]">
                                            {cliente.numero}
                                        </strong>
                                    </td>

                                    <td className="px-6 py-5">
                                        <span className="text-sm font-semibold text-[#17345A]">
                                            {cliente.nome}
                                        </span>
                                    </td>

                                    <td className="px-6 py-5">
                                        <span className="text-sm text-slate-700">
                                            {cliente.email || "-"}
                                        </span>
                                    </td>

                                    <td className="px-6 py-5 text-sm text-slate-600">
                                        {cliente.telefone || "-"}
                                    </td>

                                    <td className="px-6 py-5">
                                        <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                                            <MapPin size={16} className="text-teal-500" />
                                            {cliente.cidade || "-"}
                                        </div>
                                    </td>

                                    <td className="px-6 py-5">

                                        <span
                                            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ${
                                                Number(cliente.status) === 0
                                                    ? "border-green-100 bg-green-50 text-green-600"
                                                    : "border-red-100 bg-red-50 text-red-500"
                                            }`}
                                        >
                                            <CircleCheck size={13} />
                                            {Number(cliente.status) === 0 ? "Ativo" : "Inativo"}
                                        </span>

                                    </td>

                                    <td className="px-6 py-5">

                                        <div className="flex items-center justify-center gap-2">

                                            <Link
                                                href={`/comercial/clientes/${cliente.id}`}
                                                title="Ver detalhes"
                                                className="inline-flex cursor-pointer rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-100"
                                            >
                                                <Eye size={16} />
                                            </Link>

                                        </div>

                                    </td>

                                </tr>

                            ))}

                            {/* NENHUM CLIENTE */}
                            {!loading && !erro && filtrados.length === 0 && (

                                <tr>
                                    <td colSpan={7} className="py-12 text-center text-sm text-slate-400">
                                        {busca
                                            ? "Nenhum cliente encontrado."
                                            : "Nenhum cliente cadastrado."}
                                    </td>
                                </tr>

                            )}

                        </tbody>

                    </table>

                </div>

                {/* RODAPÉ */}
                <footer className="border-t border-slate-100 p-5 text-xs text-slate-400">
                    Exibindo {filtrados.length} de {clientes.length} clientes cadastrados
                </footer>

            </section>

        </main>
    );
}

// CARD DOS INDICADORES
function Card({ titulo, valor, icon, cor }: any) {

    const cores: any = {
        teal: "bg-teal-50 text-teal-600",
        green: "bg-green-50 text-green-600",
        orange: "bg-amber-50 text-amber-600",
        blue: "bg-blue-50 text-blue-600",
    };

    return (
        <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

            <div>
                <p className="text-[11px] font-semibold tracking-widest text-slate-400">
                    {titulo}
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    {valor}
                </h2>
            </div>

            <div className={`rounded-xl p-3 ${cores[cor]}`}>
                {icon}
            </div>

        </div>
    );
}
