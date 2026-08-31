"use client";
import {
    Users,
    Car,
    WalletMinimal,
    ChartNoAxesCombined,
    Check,
    X,
    MessageCircleMore
} from "lucide-react";
import { useEffect, useState } from "react";

interface Campanha {
    id: number;
    titulo: string;
    descricao: string;
    responsavel: string;
    canal: string;
    orcamento: number;
    data_inicio: string;
    data_fim: string;
    status: "PENDENTE" | "APROVADA" | "REJEITADA";
    observacao_diretor: string | null;
}

interface Usuario {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    user_type: string;
    created_at: string;
}

interface Candidato {
    id: number;
    first_name: string;
    last_name: string;
    vaga: string;
    etapa: string;
    status: string;
    created_at: string;
}

export default function Page() {
    const [agora, setAgora] = useState(new Date());
    const [campanhas, setCampanhas] = useState<Campanha[]>([]);
    const [loading, setLoading] = useState(true);
    const [observacao, setObservacao] = useState("");
    const [campanhaSelecionada, setCampanhaSelecionada] = useState<number | null>(null);
    const [modalRejeicao, setModalRejeicao] = useState(false);
    const [mensagem, setMensagem] = useState("");
    const [faturamentoDia, setFaturamentoDia] = useState(0);
    const [corridasDia, setCorridasDia] = useState(0);
    const [totalAssinantes, setTotalAssinantes] = useState(0);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [candidatos, setCandidatos] = useState<Candidato[]>([]);
    const [loadingCandidatos, setLoadingCandidatos] = useState(true);
    const [loadingUsuarios, setLoadingUsuarios] = useState(true);
    const [tipoMensagem, setTipoMensagem] = useState<"success" | "danger" | "">("");
    const [paginaUsuarios, setPaginaUsuarios] = useState(1);
    const registrosPorPaginaUsuarios = 5;

    const ultimoUsuario =
        paginaUsuarios * registrosPorPaginaUsuarios;
    const primeiroUsuario =
        ultimoUsuario - registrosPorPaginaUsuarios;
    const usuariosPaginados = usuarios.slice(
        primeiroUsuario,
        ultimoUsuario
    );
    const totalPaginasUsuarios = Math.ceil(
        usuarios.length / registrosPorPaginaUsuarios
    );

    const [paginaAtual, setPaginaAtual] = useState(1);
    const registrosPorPagina = 4;
    const ultimoRegistro = paginaAtual * registrosPorPagina;
    const primeiroRegistro = ultimoRegistro - registrosPorPagina;
    const campanhasPaginadas = campanhas.slice(
        primeiroRegistro,
        ultimoRegistro
    );
    const totalPaginas = Math.ceil(
        campanhas.length / registrosPorPagina
    );

    const campanhasPendentes = campanhas.filter(
        (campanha: any) => campanha.status === "PENDENTE"
    );

    async function carregarCampanhas() {
        try {
            setLoading(true);
            const res = await fetch("/api/marketing/campaigns");
            if (!res.ok) {
                throw new Error("Erro ao buscar campanhas.");
            }
            const data = await res.json();
            setCampanhas(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            setCampanhas([]);
        } finally {
            setLoading(false);
        }
    }

    async function carregarFaturamentoDia() {
        try {
            const res = await fetch("/api/faturamento-dia");
            console.log("Status:", res.status);
            if (!res.ok) {
                const erro = await res.text();
                console.log(erro);
                throw new Error("Erro na API");
            }
            const data = await res.json();
            setFaturamentoDia(Number(data.total));
        } catch (error) {
            console.error(error);
        }
    }

    async function carregarCorridasDia() {
        try {
            const res = await fetch("/api/corridas-dia");
            if (!res.ok) {
                setCorridasDia(0);
                return;
            }
            const data = await res.json();
            setCorridasDia(Number(data.total) || 0);
        } catch (error) {
            console.error(error);
            setCorridasDia(0);
        }
    }

    async function carregarUsuarios() {
        try {
            setLoadingUsuarios(true);
            const res = await fetch("/api/novos-usuarios");
            if (!res.ok) throw new Error();
            const data = await res.json();
            setUsuarios(data);
        } catch (error) {
            console.error(error);
            setUsuarios([]);
        } finally {
            setLoadingUsuarios(false);
        }
    }

    async function carregarCandidatos() {
        try {
            setLoadingCandidatos(true);
            const res = await fetch("/api/rh");
            if (!res.ok) throw new Error();
            const data = await res.json();
            setCandidatos(data);
        } catch (error) {
            console.error(error);
            setCandidatos([]);
        } finally {
            setLoadingCandidatos(false);
        }
    }

    useEffect(() => {
        carregarUsuarios();
        carregarCampanhas();
        carregarFaturamentoDia();
        carregarCorridasDia();

        const interval = setInterval(() => {
            setAgora(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setAgora(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        fetch("/api/beneficios")
            .then(res => res.json())
            .then(data => {
                setTotalAssinantes(data.total_assinantes);
            });

    }, []);

    const hora = agora.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
    });

    const data = agora.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

    const atualizadoEm = `${hora} ${data}`;

    async function aprovarCampanha(id: number) {
        try {
            const res = await fetch(`/api/marketing/campaigns/${id}/approve`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    aprovadoPor: 1,
                    observacao: "Aprovado pelo Diretor Geral."
                }),
            });
            if (res.ok) {
                setTipoMensagem("success");
                setMensagem("Campanha aprovada com sucesso.");
                carregarCampanhas();
                setTimeout(() => {
                    setMensagem("");
                    setTipoMensagem("");
                }, 3000);
            }
        } catch (error) {
            console.error(error);
        }
    }

    async function rejeitarCampanha(id: number) {
        try {
            const res = await fetch(`/api/marketing/campaigns/${id}/reject`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    aprovadoPor: 2,
                    observacao: observacao,
                }),
            });
            if (res.ok) {
                setTipoMensagem("danger");
                setMensagem("Campanha rejeitada com sucesso.");
                carregarCampanhas();
                setModalRejeicao(false);
                setTimeout(() => {
                    setMensagem("");
                    setTipoMensagem("");
                }, 3000);
            }
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <>
            <section>
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total do Dia</p>
                                <h2 className="mt-1 text-2xl font-bold text-gray-800">
                                    {faturamentoDia
                                        ? faturamentoDia.toLocaleString("pt-BR", {
                                            style: "currency",
                                            currency: "BRL",
                                        })
                                        : "R$ 0.000,00"}
                                </h2>
                            </div>
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
                                <WalletMinimal className="h-7 w-7 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Total de Corridas</p>
                                <h2 className="mt-1 text-2xl font-bold text-gray-800">
                                    {corridasDia >= 1000
                                        ? corridasDia.toLocaleString("pt-BR")
                                        : corridasDia.toString().padStart(3, "0")}
                                    <span className="text-base"> / Dia</span>
                                </h2>
                            </div>
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
                                <Car className="h-7 w-7 text-green-600" />
                            </div>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg transition">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Maylon Pass</p>
                                <h2 className="mt-1 text-2xl font-bold text-gray-800">
                                    {totalAssinantes
                                        ? String(totalAssinantes).padStart(3, "0")
                                        : "0.000"} <span className="text-base">/ Mês</span>
                                </h2>
                            </div>
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100">
                                <Users className="h-7 w-7 text-green-600" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <section>
                <div className="rounded-2xl border border-gray-200 bg-white p-6 py-5 mt-4 shadow-md">
                    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <h2 className="text-xl font-semibold text-gray-800">
                            Novos Passageiros e Motoristas
                        </h2>
                        <p className="text-sm text-black capitalize whitespace-nowrap md:text-right">
                            Atualizado em <strong>{atualizadoEm}</strong>
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[650px] divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase">
                                        ID
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase">
                                        Nome
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase">
                                        E-mail
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase">
                                        Telefone
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase">
                                        Tipo
                                    </th>
                                    <th className="px-6 py-3 text-center text-xs font-semibold uppercase">
                                        Cadastro
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 bg-white">
                                {loadingUsuarios ? (
                                    <tr>
                                        <td colSpan={6} className="py-4 text-center">
                                            Carregando...
                                        </td>
                                    </tr>
                                ) : usuarios.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-0">
                                            <div className="w-full border border-red-300 bg-red-200 px-6 py-4 text-center font-medium text-red-600">
                                                Não há cadastros novos.
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    usuariosPaginados.map((usuario) => (
                                        <tr
                                            key={usuario.id}
                                            className="transition hover:bg-gray-50"
                                        >
                                            <td className="px-6 py-4 text-center">
                                                {usuario.id}
                                            </td>
                                            <td className="px-6 py-4">
                                                {usuario.first_name} {usuario.last_name}
                                            </td>
                                            <td className="px-6 py-4">
                                                {usuario.email}
                                            </td>
                                            <td className="px-6 py-4">
                                                {usuario.phone?.replace(
                                                    /(\d{2})(\d{5})(\d{4})/,
                                                    "($1) $2-$3"
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {usuario.user_type === "driver"
                                                    ? "Motorista"
                                                    : "Passageiro"}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {new Date(
                                                    usuario.created_at
                                                ).toLocaleDateString("pt-BR")}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="mt-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <span className="text-xs text-gray-600">
                            Mostrando{" "}
                            {usuarios.length === 0
                                ? 0
                                : primeiroUsuario + 1}
                            {" "}até{" "}
                            {Math.min(ultimoUsuario, usuarios.length)}
                            {" "}de{" "}
                            {usuarios.length} registros
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() =>
                                    setPaginaUsuarios((p) => Math.max(p - 1, 1))
                                }
                                disabled={paginaUsuarios === 1}
                                className="rounded-lg cursor-pointer border border-gray-300 px-4 py-2 text-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Anterior
                            </button>
                            {Array.from(
                                { length: totalPaginasUsuarios },
                                (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() =>
                                            setPaginaUsuarios(i + 1)
                                        }
                                        className={`h-10 w-10 rounded-lg cursor-pointer text-sm font-medium transition ${paginaUsuarios === i + 1
                                            ? "bg-emerald-600 text-white"
                                            : "border border-gray-300 hover:bg-gray-100"
                                            }`}
                                    >
                                        {i + 1}
                                    </button>
                                )
                            )}
                            <button
                                onClick={() =>
                                    setPaginaUsuarios((p) =>
                                        Math.min(
                                            p + 1,
                                            totalPaginasUsuarios
                                        )
                                    )
                                }
                                disabled={
                                    paginaUsuarios === totalPaginasUsuarios ||
                                    totalPaginasUsuarios === 0
                                }
                                className="rounded-lg cursor-pointer border border-gray-300 px-4 py-2 text-sm transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Próxima
                            </button>
                        </div>
                    </div>
                </div>
            </section>
            <section>
                <div className="grid grid-cols-2 gap-6 xl:grid-cols-2 mt-4">
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
                        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <h2 className="text-xl font-semibold text-gray-800">
                                Aprovação <br></br> Recursos Humanos (RH)
                            </h2>
                            <p className="text-sm text-black whitespace-nowrap">
                                Atualizado em <strong>{atualizadoEm}</strong>
                            </p>
                        </div>
                        <div className="overflow-x-auto rounded-xl">
                            <table className="w-full min-w-[650px] divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                                            Matrícula
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                                            Nome
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-600">
                                            Vaga
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                                            Etapa
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                                            Status Conta
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                                            Cadastro
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white">
                                    {candidatos.map((candidato: any) => (
                                        <tr key={candidato.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 text-center">
                                                {candidato.id}
                                            </td>
                                            <td className="px-4 py-4">
                                                {candidato.first_name} {candidato.last_name}
                                            </td>
                                            <td className="px-4 py-4">
                                                {candidato.vaga}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {candidato.etapa === "inscrito" && (
                                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                                                        Inscrito
                                                    </span>
                                                )}
                                                {candidato.etapa === "triagem" && (
                                                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                                                        Triagem
                                                    </span>
                                                )}
                                                {candidato.etapa === "entrevista" && (
                                                    <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                                                        Entrevista
                                                    </span>
                                                )}
                                                {candidato.etapa === "aprovado" && (
                                                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                                        Aprovado
                                                    </span>
                                                )}
                                                {candidato.etapa === "reprovado" && (
                                                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                                        Reprovado
                                                    </span>
                                                )}
                                                {candidato.etapa === "contratado" && (
                                                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                                        Contratado
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {candidato.status === "active" && (
                                                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                                                        Ativo
                                                    </span>
                                                )}
                                                {candidato.status === "inactive" && (
                                                    <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-semibold text-yellow-700">
                                                        Inativo
                                                    </span>
                                                )}
                                                {candidato.status === "blocked" && (
                                                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                                                        Bloqueado
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {new Date(candidato.created_at).toLocaleDateString("pt-BR")}
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                <button className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700">
                                                    Visualizar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-md">
                        <div className="mb-5  flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-800">
                                    Aprovação do Marketing
                                </h2>
                                <p className="mt-1 text-sm text-justify text-gray-500">
                                    Analise e aprove ou rejeite os banners enviadas pelo setor de Marketing pela empresas.
                                </p>
                            </div>

                            <p className="whitespace-nowrap text-sm text-black">
                                Atualizado em <strong>{atualizadoEm}</strong>
                            </p>
                        </div>
                        {mensagem && (
                            <div
                                className={`mb-4 rounded-lg border px-4 py-3 ${tipoMensagem === "success"
                                    ? "border-green-200 bg-green-100 text-green-800"
                                    : "border-red-200 bg-red-100 text-red-800"
                                    }`}
                            >
                                {mensagem}
                            </div>
                        )}
                        <div className="overflow-x-auto rounded-xl">
                            <table className="w-full min-w-[1100px] divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                                            ID
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                                            Campanha
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                                            Responsável
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                                            Canal
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                                            Orçamento
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                                            Início
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                                            Aprovar
                                        </th>
                                        <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-gray-600">
                                            Negar
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 bg-white text-sm text-center">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={9} className="py-4 text-center text-gray-500 font-medium">
                                                Carregando...
                                            </td>
                                        </tr>
                                    ) : campanhasPendentes.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-0">
                                                <div
                                                    className="border border-red-300 bg-red-200 px-4 py-3 text-red-600"
                                                    role="alert"
                                                >
                                                    <strong>Atenção!</strong> Não há campanhas de marketing pendentes para aprovação.
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        campanhasPendentes
                                            .slice(primeiroRegistro, ultimoRegistro)
                                            .map((campanha: any) => (
                                                <tr key={campanha.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-4">{campanha.id}</td>
                                                    <td className="px-4 py-4">
                                                        {campanha.titulo}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {campanha.responsavel}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {campanha.canal}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        R$ {Number(campanha.orcamento).toLocaleString("pt-BR", {
                                                            minimumFractionDigits: 2,
                                                        })}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {new Date(campanha.data_inicio).toLocaleDateString("pt-BR")}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        {campanha.status}
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <button
                                                            onClick={() => aprovarCampanha(campanha.id)}
                                                            className="rounded-lg cursor-pointer bg-emerald-500 p-2 text-white transition hover:bg-emerald-600"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-4">
                                                        <button
                                                            onClick={() => {
                                                                setCampanhaSelecionada(campanha.id);
                                                                setObservacao("");
                                                                setModalRejeicao(true);
                                                            }}
                                                            className="rounded-lg cursor-pointer bg-red-500 p-2 text-white transition hover:bg-red-600"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                        {modalRejeicao && (
                                                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
                                                                <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-lg">
                                                                    <h2 className="mb-4 text-xl font-semibold">
                                                                        Rejeitar campanha
                                                                    </h2>
                                                                    <label className="mb-2 text-left font-semibold  block">
                                                                        Observação
                                                                    </label>
                                                                    <textarea
                                                                        className="w-full rounded border p-2"
                                                                        rows={4}
                                                                        value={observacao}
                                                                        onChange={(e) => setObservacao(e.target.value)}
                                                                        placeholder="Informe o motivo da rejeição..."
                                                                    />
                                                                    <div className="mt-4 flex justify-end gap-2">
                                                                        <button
                                                                            onClick={() => setModalRejeicao(false)}
                                                                            className="rounded rounded-xl text-sm cursor-pointer bg-gray-300 px-4 py-2"
                                                                        >
                                                                            Cancelar
                                                                        </button>
                                                                        <button
                                                                            onClick={() => campanhaSelecionada && rejeitarCampanha(campanhaSelecionada)}
                                                                            className="rounded rounded-xl text-sm cursor-pointer bg-red-600 px-4 py-2 text-white"
                                                                        >
                                                                            Confirmar rejeição
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-5 flex justify-center">
                            <div className="flex items-center gap-2">
                                <button
                                    disabled={paginaAtual === 1}
                                    onClick={() => setPaginaAtual((p) => p - 1)}
                                    className="rounded-lg cursor-pointer border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-100"
                                >
                                    Anterior
                                </button>
                                {Array.from({ length: totalPaginas }).map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setPaginaAtual(index + 1)}
                                        className={`rounded-lg cursor-pointer px-4 py-2 text-sm transition ${paginaAtual === index + 1
                                            ? "bg-emerald-600 text-white"
                                            : "border border-gray-300 hover:bg-gray-100"
                                            }`}
                                    >
                                        {index + 1}
                                    </button>
                                ))}
                                <button
                                    disabled={paginaAtual === totalPaginas}
                                    onClick={() => setPaginaAtual((p) => p + 1)}
                                    className="rounded-lg cursor-pointer border border-gray-300 px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-100"
                                >
                                    Próxima
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}