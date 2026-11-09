"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
    ArrowLeft,
    Check,
    CircleAlert,
    CircleCheck,
    Clock,
    Loader2,
    RefreshCw,
    Search,
    Send,
    ShieldCheck,
    UserPlus,
    X,
} from "lucide-react";

// Endereço da API: precisa ser igual à pasta src/app/api/maylon-pass
const API_BASE = "/api/planos";

// Página da lista de assinantes (para onde voltamos depois de criar o plano)
const LISTA_URL = "/comercial/planos";

/* ------------------------------------------------------------------ */
/* Tipos e dados                                                       */
/* ------------------------------------------------------------------ */

type PlanoPass = "basico" | "plus" | "premium";

const PLANOS: Record<PlanoPass, { label: string; destaque?: string }> = {
    basico: { label: "Básico" },
    plus: { label: "Plus", destaque: "Mais escolhido" },
    premium: { label: "Premium" },
};

const PRECOS: Record<PlanoPass, number> = {
    basico: 29.9,
    plus: 59.9,
    premium: 89.9,
};

const ADICIONAIS_NOVO = [
    { id: "home", nome: "Maylon Home", preco: 50 },
    { id: "van_escolar", nome: "Maylon Van Escolar", preco: 210 },
] as const;

type AdicionalId = (typeof ADICIONAIS_NOVO)[number]["id"];

interface UsuarioBusca {
    id: number | string;
    nome: string;
    email?: string | null;
    telefone?: string | null;
    temPlanoAtivo?: boolean;
    temSolicitacaoPendente?: boolean;
}

interface SolicitacaoResumo {
    id: number;
    status: string;
    plano: string;
    adicionais: string[];
    valor: number;
    motivoRecusa: string | null;
    criadoEm: string | null;
    decididoEm: string | null;
    usuario: { nome: string } | null;
    novoUsuario: { nome: string } | null;
}

const NOMES_ADICIONAL: Record<string, string> = {
    home: "Maylon Home",
    van_escolar: "Maylon Van Escolar",
};

const moeda = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#0a9a82] focus:ring-4 focus:ring-teal-500/10";

/* ------------------------------------------------------------------ */
/* Formatadores                                                        */
/* ------------------------------------------------------------------ */

function formatarTelefone(valor?: string | null) {
    if (!valor) return "—";
    const n = valor.replace(/\D/g, "");
    if (n.length === 11) return n.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
    if (n.length === 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
    return valor;
}

function mascaraCpf(valor: string) {
    const n = valor.replace(/\D/g, "").slice(0, 11);
    return n
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function mascaraTelefone(valor: string) {
    const n = valor.replace(/\D/g, "").slice(0, 11);
    if (n.length <= 10) {
        return n
            .replace(/(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{4})(\d{1,4})$/, "$1-$2");
    }
    return n.replace(/(\d{2})(\d{5})(\d{1,4})$/, "($1) $2-$3");
}

function emailValido(valor: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor.trim());
}

function formatarData(valor?: string | null) {
    if (!valor) return null;
    const data = new Date(valor);
    if (Number.isNaN(data.getTime())) return null;
    return data.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

/* ------------------------------------------------------------------ */
/* Página                                                              */
/* ------------------------------------------------------------------ */

export default function NovoPlanoMaylonPassPage() {
    const [passo, setPasso] = useState<1 | 2>(1);

    const [buscaUsuario, setBuscaUsuario] = useState("");
    const [resultados, setResultados] = useState<UsuarioBusca[]>([]);
    const [buscandoUsuario, setBuscandoUsuario] = useState(false);
    const [erroBusca, setErroBusca] = useState("");
    const [usuarioSel, setUsuarioSel] = useState<UsuarioBusca | null>(null);

    const [modoNovoUsuario, setModoNovoUsuario] = useState(false);
    const [novoNome, setNovoNome] = useState("");
    const [novoEmail, setNovoEmail] = useState("");
    const [novoTelefone, setNovoTelefone] = useState("");
    const [novoCpf, setNovoCpf] = useState("");

    const [planoNovo, setPlanoNovo] = useState<PlanoPass>("plus");
    const [adicionaisNovo, setAdicionaisNovo] = useState<AdicionalId[]>([]);
    const [observacao, setObservacao] = useState("");

    const [enviando, setEnviando] = useState(false);
    const [erro, setErro] = useState("");
    const [alerta, setAlerta] = useState<{ texto: string } | null>(null);

    // Solicitações já enviadas (tabela maylon_pass_solicitacoes)
    const [minhas, setMinhas] = useState<SolicitacaoResumo[]>([]);
    const [carregandoMinhas, setCarregandoMinhas] = useState(true);
    const [erroMinhas, setErroMinhas] = useState("");

    function alternarAdicional(id: AdicionalId) {
        setAdicionaisNovo((atual) =>
            atual.includes(id) ? atual.filter((a) => a !== id) : [...atual, id]
        );
    }

    const carregarMinhas = useCallback(async () => {
        try {
            setCarregandoMinhas(true);
            setErroMinhas("");

            const res = await fetch(
                `${API_BASE}/solicitacoes?minhas=1&status=todos`,
                { cache: "no-store" }
            );
            const data = await res.json().catch(() => null);

            if (!res.ok) {
                if (res.status >= 500) {
                    console.error("[minhas solicitações]", res.status, data?.error);
                }
                setMinhas([]);
                setErroMinhas(
                    data?.error || "Não foi possível carregar suas solicitações."
                );
                return;
            }

            setMinhas(Array.isArray(data?.solicitacoes) ? data.solicitacoes : []);
        } catch (error) {
            console.error(error);
            setMinhas([]);
            setErroMinhas(
                "Não foi possível carregar suas solicitações. Verifique sua conexão."
            );
        } finally {
            setCarregandoMinhas(false);
        }
    }, []);

    useEffect(() => {
        carregarMinhas();
    }, [carregarMinhas]);

    // Fecha o aviso de sucesso sozinho depois de alguns segundos
    useEffect(() => {
        if (!alerta) return;
        const timer = setTimeout(() => setAlerta(null), 8000);
        return () => clearTimeout(timer);
    }, [alerta]);

    // Busca de usuário com atraso (debounce)
    useEffect(() => {
        if (usuarioSel || modoNovoUsuario) return;

        const termo = buscaUsuario.trim();
        if (termo.length < 2) {
            setResultados([]);
            setErroBusca("");
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            try {
                setBuscandoUsuario(true);
                setErroBusca("");

                const res = await fetch(
                    `${API_BASE}/usuarios?busca=${encodeURIComponent(termo)}`,
                    { signal: controller.signal, cache: "no-store" }
                );

                if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    setResultados([]);
                    setErroBusca(
                        data?.error || "Não foi possível buscar usuários."
                    );
                    return;
                }

                const data = await res.json();
                setResultados(Array.isArray(data) ? data : []);
            } catch (error: any) {
                if (error?.name !== "AbortError") {
                    setResultados([]);
                    setErroBusca(
                        "Não foi possível buscar usuários. Verifique sua conexão."
                    );
                }
            } finally {
                setBuscandoUsuario(false);
            }
        }, 350);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [buscaUsuario, usuarioSel, modoNovoUsuario]);

    const cpfDigitos = novoCpf.replace(/\D/g, "");
    const novoUsuarioValido =
        novoNome.trim().length >= 3 &&
        emailValido(novoEmail) &&
        novoTelefone.replace(/\D/g, "").length >= 10 &&
        (cpfDigitos.length === 0 || cpfDigitos.length === 11);
    const usuarioPronto = !!usuarioSel || (modoNovoUsuario && novoUsuarioValido);

    const adicionaisSel = ADICIONAIS_NOVO.filter((a) =>
        adicionaisNovo.includes(a.id)
    );
    const totalNovo =
        PRECOS[planoNovo] + adicionaisSel.reduce((soma, a) => soma + a.preco, 0);

    const nomeResumo = usuarioSel?.nome ?? (novoNome.trim() || "");

    async function enviarSolicitacao() {
        if (!usuarioPronto || enviando) return;

        try {
            setEnviando(true);
            setErro("");

            const res = await fetch(API_BASE, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...(usuarioSel
                        ? { usuarioId: usuarioSel.id }
                        : {
                              novoUsuario: {
                                  nome: novoNome.trim(),
                                  email: novoEmail.trim().toLowerCase(),
                                  telefone: novoTelefone.replace(/\D/g, ""),
                                  cpf: cpfDigitos || null,
                              },
                          }),
                    plano: planoNovo,
                    adicionais: adicionaisNovo,
                    observacao: observacao.trim() || null,
                }),
            });

            // Resposta de erro da API: mostra a mensagem na tela.
            // Não lança exceção para não aparecer como erro no console.
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                const mensagemApi: string | undefined =
                    data?.error ?? data?.message;

                // Só erros inesperados (500...) vão para o console
                if (res.status >= 500) {
                    console.error("[enviarSolicitacao]", res.status, mensagemApi);
                }

                if (res.status === 409) {
                    setErro(
                        mensagemApi ||
                            "Este usuário já possui plano ativo, uma solicitação pendente ou já existe um cadastro com esses dados."
                    );
                } else {
                    setErro(
                        mensagemApi || "Não foi possível enviar a solicitação."
                    );
                }
                return;
            }

            const nomeUsuario = usuarioSel?.nome ?? novoNome.trim();
            const dataOk = await res.json().catch(() => null);
            const existente = dataOk?.usuarioExistente?.nome as string | undefined;
            const mensagem = existente
                ? `${existente} já tinha cadastro. Solicitação do plano ${PLANOS[planoNovo].label} enviada ao gerente para o usuário existente.`
                : usuarioSel
                ? `Solicitação do plano ${PLANOS[planoNovo].label} para ${nomeUsuario} enviada ao gerente. Aguarde a aprovação.`
                : `Solicitação enviada ao gerente. ${nomeUsuario} será cadastrado e o plano ${PLANOS[planoNovo].label} criado quando o gerente aprovar.`;

            // Mostra o aviso e deixa a tela pronta para uma nova solicitação
            setAlerta({ texto: mensagem });
            setPasso(1);
            setUsuarioSel(null);
            setBuscaUsuario("");
            setResultados([]);
            setErroBusca("");
            setModoNovoUsuario(false);
            setNovoNome("");
            setNovoEmail("");
            setNovoTelefone("");
            setNovoCpf("");
            setPlanoNovo("plus");
            setAdicionaisNovo([]);
            setObservacao("");
            window.scrollTo({ top: 0, behavior: "smooth" });

            // Atualiza a lista de solicitações enviadas
            carregarMinhas();
        } catch (error: any) {
            // Falha de rede ou algo inesperado
            console.error(error);
            setErro(
                "Não foi possível enviar a solicitação. Verifique sua conexão e tente novamente."
            );
        } finally {
            setEnviando(false);
        }
    }

    /* -------------------------------------------------------------- */
    /* Ações (usadas no resumo lateral e na barra fixa do celular)     */
    /* -------------------------------------------------------------- */

    const botaoPrimarioCls =
        "flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-extrabold text-[#0a6f5e] transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50";

    const acaoPrimaria =
        passo === 1 ? (
            <button
                type="button"
                disabled={!usuarioPronto}
                onClick={() => setPasso(2)}
                className={botaoPrimarioCls}
            >
                Continuar
            </button>
        ) : (
            <button
                type="button"
                disabled={enviando}
                onClick={enviarSolicitacao}
                className={botaoPrimarioCls}
            >
                {enviando ? (
                    <Loader2 size={16} className="animate-spin" />
                ) : (
                    <Send size={15} />
                )}
                {enviando ? "Enviando..." : "Enviar para o gerente"}
            </button>
        );

    const acaoSecundaria =
        passo === 1 ? (
            <Link
                href={LISTA_URL}
                className="block w-full rounded-xl border border-white/20 px-5 py-2.5 text-center text-sm font-bold text-white/80 transition hover:bg-white/10"
            >
                Cancelar
            </Link>
        ) : (
            <button
                type="button"
                disabled={enviando}
                onClick={() => {
                    setErro("");
                    setPasso(1);
                }}
                className="w-full cursor-pointer rounded-xl border border-white/20 px-5 py-2.5 text-sm font-bold text-white/80 transition hover:bg-white/10 disabled:opacity-50"
            >
                Voltar e editar
            </button>
        );

    return (
        <main className="min-h-screen">
            <div className="mx-auto max-w-8xl">
                {/* Topo */}
                <div className="mb-5">
                    <Link
                        href={LISTA_URL}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-white transition hover:underline"
                    >
                        <ArrowLeft size={16} />
                        Voltar para Maylon Pass
                    </Link>
                    <h1 className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">
                        Novo plano Maylon Pass
                    </h1>
                    <p className="mt-1 max-w-xl text-sm text-white/85">
                        Escolha o usuário e o plano e envie a solicitação. O plano só é
                        criado depois que o gerente aprovar.
                    </p>
                </div>

                {/* Aviso de sucesso */}
                {alerta && (
                    <div
                        role="status"
                        className="mb-5 flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm"
                    >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-100 text-[#0a9a82]">
                            <CircleCheck size={18} />
                        </span>
                        <p className="flex-1 pt-1 text-sm font-semibold text-slate-800">
                            {alerta.texto}
                        </p>
                        <button
                            type="button"
                            onClick={() => setAlerta(null)}
                            aria-label="Fechar aviso"
                            className="shrink-0 cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {/* Progresso */}
                <ol className="mb-5 grid grid-cols-2 gap-3">
                    {[
                        { n: 1, label: "Usuário e plano" },
                        { n: 2, label: "Envio ao gerente" },
                    ].map((etapa) => {
                        const feito = passo > etapa.n;
                        const atual = passo === etapa.n;
                        return (
                            <li
                                key={etapa.n}
                                aria-current={atual ? "step" : undefined}
                            >
                                <div
                                    className={`h-1.5 rounded-full transition ${
                                        passo >= etapa.n ? "bg-white" : "bg-white/30"
                                    }`}
                                />
                                <div
                                    className={`mt-2 flex items-center gap-2 text-sm font-bold ${
                                        passo >= etapa.n ? "text-white" : "text-white/60"
                                    }`}
                                >
                                    <span
                                        className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                                            passo >= etapa.n
                                                ? "bg-white text-[#0a6f5e]"
                                                : "bg-white/25 text-white"
                                        }`}
                                    >
                                        {feito ? <Check size={12} strokeWidth={3} /> : etapa.n}
                                    </span>
                                    {etapa.label}
                                </div>
                            </li>
                        );
                    })}
                </ol>

                <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
                    {/* ======================= Coluna principal ======================= */}
                    <div className="space-y-5">
                        {passo === 1 ? (
                            <>
                                {/* Usuário */}
                                <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                                    <div className="mb-4 flex items-start justify-between gap-3">
                                        <div>
                                            <h2 className="text-base font-extrabold text-slate-900">
                                                {modoNovoUsuario ? "Novo usuário" : "Quem vai receber o plano?"}
                                            </h2>
                                            <p className="mt-0.5 text-xs text-slate-500">
                                                {modoNovoUsuario
                                                    ? "O cadastro só é feito depois que o gerente aprovar."
                                                    : "Busque por nome, e-mail ou telefone."}
                                            </p>
                                        </div>

                                        {!usuarioSel && (
                                            <button
                                                type="button"
                                                onClick={() => setModoNovoUsuario((v) => !v)}
                                                className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-[#0a9a82] transition hover:bg-teal-50"
                                            >
                                                {modoNovoUsuario ? (
                                                    <>
                                                        <Search size={13} />
                                                        Buscar existente
                                                    </>
                                                ) : (
                                                    <>
                                                        <UserPlus size={13} />
                                                        Novo usuário
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>

                                    {modoNovoUsuario ? (
                                        <div className="grid gap-3 sm:grid-cols-2">
                                            <div className="sm:col-span-2">
                                                <label
                                                    htmlFor="novo-nome"
                                                    className="mb-1 block text-xs font-semibold text-slate-600"
                                                >
                                                    Nome completo *
                                                </label>
                                                <input
                                                    id="novo-nome"
                                                    type="text"
                                                    autoFocus
                                                    value={novoNome}
                                                    onChange={(e) => setNovoNome(e.target.value)}
                                                    className={inputCls}
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="novo-email"
                                                    className="mb-1 block text-xs font-semibold text-slate-600"
                                                >
                                                    E-mail *
                                                </label>
                                                <input
                                                    id="novo-email"
                                                    type="email"
                                                    value={novoEmail}
                                                    onChange={(e) => setNovoEmail(e.target.value)}
                                                    className={inputCls}
                                                />
                                                {novoEmail && !emailValido(novoEmail) && (
                                                    <p className="mt-1 text-[11px] text-red-600">
                                                        E-mail inválido.
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="novo-telefone"
                                                    className="mb-1 block text-xs font-semibold text-slate-600"
                                                >
                                                    Telefone *
                                                </label>
                                                <input
                                                    id="novo-telefone"
                                                    type="tel"
                                                    inputMode="numeric"
                                                    value={novoTelefone}
                                                    onChange={(e) =>
                                                        setNovoTelefone(mascaraTelefone(e.target.value))
                                                    }
                                                    placeholder="(00) 00000-0000"
                                                    className={inputCls}
                                                />
                                            </div>

                                            <div className="sm:col-span-2">
                                                <label
                                                    htmlFor="novo-cpf"
                                                    className="mb-1 block text-xs font-semibold text-slate-600"
                                                >
                                                    CPF *
                                                </label>
                                                <input
                                                    id="novo-cpf"
                                                    type="text"
                                                    inputMode="numeric"
                                                    value={novoCpf}
                                                    onChange={(e) => setNovoCpf(mascaraCpf(e.target.value))}
                                                    placeholder="000.000.000-00"
                                                    className={inputCls}
                                                />
                                                {cpfDigitos.length > 0 && cpfDigitos.length < 11 && (
                                                    <p className="mt-1 text-[11px] text-red-600">
                                                        CPF incompleto.
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    ) : usuarioSel ? (
                                        <div className="flex items-center gap-3 rounded-2xl bg-teal-50 px-4 py-3">
                                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0a9a82] text-sm font-extrabold text-white">
                                                {usuarioSel.nome.trim().charAt(0).toUpperCase()}
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-bold text-slate-900">
                                                    {usuarioSel.nome}
                                                </p>
                                                <p className="truncate text-xs text-slate-500">
                                                    {usuarioSel.email ||
                                                        formatarTelefone(usuarioSel.telefone)}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setUsuarioSel(null);
                                                    setBuscaUsuario("");
                                                }}
                                                aria-label="Trocar usuário"
                                                className="flex shrink-0 cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-[#0a9a82] transition hover:bg-white"
                                            >
                                                <X size={14} />
                                                Trocar
                                            </button>
                                        </div>
                                    ) : (
                                        <div>
                                            <div className="relative">
                                                <Search
                                                    size={17}
                                                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                                                />
                                                <input
                                                    id="busca-usuario"
                                                    type="search"
                                                    autoFocus
                                                    aria-label="Buscar usuário"
                                                    value={buscaUsuario}
                                                    onChange={(e) => setBuscaUsuario(e.target.value)}
                                                    placeholder="Digite ao menos 2 caracteres..."
                                                    className={`${inputCls} pl-10 pr-10`}
                                                />
                                                {buscandoUsuario && (
                                                    <Loader2
                                                        size={16}
                                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-slate-400"
                                                    />
                                                )}
                                            </div>

                                            {buscaUsuario.trim().length >= 2 && !buscandoUsuario && (
                                                <ul className="mt-2 max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-2xl border border-slate-200 bg-white">
                                                    {erroBusca ? (
                                                        <li
                                                            role="alert"
                                                            className="flex items-start gap-2 px-4 py-4 text-sm font-medium text-red-700"
                                                        >
                                                            <CircleAlert
                                                                size={16}
                                                                className="mt-0.5 shrink-0"
                                                            />
                                                            {erroBusca}
                                                        </li>
                                                    ) : resultados.length === 0 ? (
                                                        <li className="flex flex-col items-center gap-2 px-4 py-5 text-center text-sm text-slate-500">
                                                            Nenhum usuário encontrado.
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const termo = buscaUsuario.trim();
                                                                    if (emailValido(termo)) setNovoEmail(termo);
                                                                    else if (/\d{8,}/.test(termo))
                                                                        setNovoTelefone(mascaraTelefone(termo));
                                                                    else setNovoNome(termo);
                                                                    setModoNovoUsuario(true);
                                                                }}
                                                                className="cursor-pointer rounded-lg bg-[#0a9a82] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#08846f]"
                                                            >
                                                                Cadastrar novo usuário
                                                            </button>
                                                        </li>
                                                    ) : (
                                                        resultados.map((u) => {
                                                            const bloqueado =
                                                                !!u.temPlanoAtivo ||
                                                                !!u.temSolicitacaoPendente;
                                                            const motivo = u.temPlanoAtivo
                                                                ? "Já possui plano ativo"
                                                                : "Solicitação pendente";

                                                            return (
                                                                <li key={u.id}>
                                                                    <button
                                                                        type="button"
                                                                        disabled={bloqueado}
                                                                        onClick={() => {
                                                                            setUsuarioSel(u);
                                                                            setResultados([]);
                                                                        }}
                                                                        className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
                                                                            bloqueado
                                                                                ? "cursor-not-allowed bg-slate-50 opacity-70"
                                                                                : "cursor-pointer hover:bg-slate-50"
                                                                        }`}
                                                                    >
                                                                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                                                            {u.nome.trim().charAt(0).toUpperCase()}
                                                                        </span>
                                                                        <span className="min-w-0 flex-1">
                                                                            <span className="block truncate text-sm font-semibold text-slate-900">
                                                                                {u.nome}
                                                                            </span>
                                                                            <span className="block truncate text-xs text-slate-500">
                                                                                {[
                                                                                    u.email,
                                                                                    u.telefone
                                                                                        ? formatarTelefone(u.telefone)
                                                                                        : null,
                                                                                ]
                                                                                    .filter(Boolean)
                                                                                    .join(" · ")}
                                                                            </span>
                                                                        </span>
                                                                        {bloqueado && (
                                                                            <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                                                                                {motivo}
                                                                            </span>
                                                                        )}
                                                                    </button>
                                                                </li>
                                                            );
                                                        })
                                                    )}
                                                </ul>
                                            )}
                                        </div>
                                    )}
                                </section>

                                {/* Plano */}
                                <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                                    <h2 className="text-base font-extrabold text-slate-900">
                                        Plano
                                    </h2>
                                    <div
                                        role="radiogroup"
                                        aria-label="Plano"
                                        className="mt-3 space-y-2"
                                    >
                                        {(Object.keys(PLANOS) as PlanoPass[]).map((p) => {
                                            const ativo = planoNovo === p;
                                            return (
                                                <button
                                                    key={p}
                                                    type="button"
                                                    role="radio"
                                                    aria-checked={ativo}
                                                    onClick={() => setPlanoNovo(p)}
                                                    className={`flex w-full cursor-pointer items-center gap-4 rounded-2xl border-2 px-4 py-3.5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#0a9a82] ${
                                                        ativo
                                                            ? "border-[#0a9a82] bg-teal-50/60"
                                                            : "border-slate-200 hover:border-[#0a9a82]/50"
                                                    }`}
                                                >
                                                    <span
                                                        aria-hidden="true"
                                                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                                                            ativo
                                                                ? "border-[#0a9a82] bg-[#0a9a82] text-white"
                                                                : "border-slate-300 text-transparent"
                                                        }`}
                                                    >
                                                        <Check size={12} strokeWidth={3} />
                                                    </span>
                                                    <span className="flex flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                                                        <span className="text-sm font-extrabold text-slate-900">
                                                            {PLANOS[p].label}
                                                        </span>
                                                        {PLANOS[p].destaque && (
                                                            <span className="rounded-full bg-[#0a9a82] px-2 py-0.5 text-[10px] font-bold text-white">
                                                                {PLANOS[p].destaque}
                                                            </span>
                                                        )}
                                                    </span>
                                                    <span className="text-right">
                                                        <span className="text-base font-extrabold text-[#0a9a82]">
                                                            {moeda.format(PRECOS[p])}
                                                        </span>
                                                        <span className="text-xs font-medium text-slate-400">
                                                            {" "}
                                                            / mês
                                                        </span>
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </section>

                                {/* Adicionais */}
                                <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                                    <h2 className="text-base font-extrabold text-slate-900">
                                        Adicionais{" "}
                                        <span className="text-sm font-medium text-slate-400">
                                            (opcional)
                                        </span>
                                    </h2>
                                    <ul className="mt-3 space-y-2">
                                        {ADICIONAIS_NOVO.map((a) => {
                                            const ativo = adicionaisNovo.includes(a.id);
                                            return (
                                                <li
                                                    key={a.id}
                                                    className={`flex items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 transition ${
                                                        ativo
                                                            ? "border-[#0a9a82] bg-teal-50/60"
                                                            : "border-slate-200"
                                                    }`}
                                                >
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900">
                                                            {a.nome}
                                                        </p>
                                                        <p className="text-xs font-semibold text-[#0a9a82]">
                                                            + {moeda.format(a.preco)} / mês
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        role="switch"
                                                        aria-checked={ativo}
                                                        aria-label={`${ativo ? "Remover" : "Adicionar"} ${a.nome}`}
                                                        onClick={() => alternarAdicional(a.id)}
                                                        className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#0a9a82] ${
                                                            ativo ? "bg-[#0a9a82]" : "bg-slate-300"
                                                        }`}
                                                    >
                                                        <span
                                                            className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                                                                ativo ? "left-[1.375rem]" : "left-0.5"
                                                            }`}
                                                        />
                                                    </button>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </section>
                            </>
                        ) : (
                            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
                                <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4">
                                    <ShieldCheck
                                        size={20}
                                        className="mt-0.5 shrink-0 text-amber-600"
                                    />
                                    <div>
                                        <h2 className="text-sm font-bold text-amber-900">
                                            Aprovação do gerente
                                        </h2>
                                        <p className="mt-1 text-xs leading-relaxed text-amber-800">
                                            Ao enviar, a solicitação aparece no painel do gerente.
                                            O plano só é criado quando ele aprovar.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-4">
                                    <label
                                        htmlFor="observacao-plano"
                                        className="mb-1.5 block text-sm font-bold text-slate-800"
                                    >
                                        Observação{" "}
                                        <span className="font-medium text-slate-400">(opcional)</span>
                                    </label>
                                    <textarea
                                        id="observacao-plano"
                                        rows={3}
                                        maxLength={500}
                                        value={observacao}
                                        onChange={(e) => setObservacao(e.target.value)}
                                        placeholder="Ex.: plano criado a pedido do cliente por telefone."
                                        className={`${inputCls} resize-none`}
                                    />
                                </div>

                                {erro && (
                                    <div
                                        role="alert"
                                        className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700"
                                    >
                                        <CircleAlert size={15} className="mt-0.5 shrink-0" />
                                        {erro}
                                    </div>
                                )}
                            </section>
                        )}
                    </div>

                    {/* ======================= Resumo lateral ======================= */}
                    <aside className="rounded-3xl bg-[#0c3d35] p-5 text-white shadow-lg sm:p-6 lg:sticky lg:top-4">
                        <h2 className="text-base font-extrabold">Resumo do plano</h2>

                        <dl className="mt-4 space-y-3 text-sm">
                            <div className="flex justify-between gap-3">
                                <dt className="text-white/60">Usuário</dt>
                                <dd className="min-w-0 text-right font-semibold">
                                    {nomeResumo ? (
                                        <>
                                            <span className="block truncate">{nomeResumo}</span>
                                            {!usuarioSel && (
                                                <span className="mt-0.5 inline-block rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold">
                                                    novo cadastro
                                                </span>
                                            )}
                                        </>
                                    ) : (
                                        <span className="font-normal text-white/50">
                                            Não escolhido
                                        </span>
                                    )}
                                </dd>
                            </div>

                            <div className="flex justify-between gap-3">
                                <dt className="text-white/60">Plano {PLANOS[planoNovo].label}</dt>
                                <dd className="font-semibold">{moeda.format(PRECOS[planoNovo])}</dd>
                            </div>

                            {adicionaisSel.map((a) => (
                                <div key={a.id} className="flex justify-between gap-3">
                                    <dt className="text-white/60">{a.nome}</dt>
                                    <dd className="font-semibold">{moeda.format(a.preco)}</dd>
                                </div>
                            ))}
                        </dl>

                        <div className="mt-4 border-t border-white/15 pt-4">
                            <p className="text-xs text-white/60">Total por mês</p>
                            <p className="mt-0.5 text-3xl font-extrabold tracking-tight">
                                {moeda.format(totalNovo)}
                            </p>
                        </div>

                        {/* Ações no desktop */}
                        <div className="mt-5 hidden space-y-2 lg:block">
                            {acaoPrimaria}
                            {acaoSecundaria}
                        </div>
                    </aside>
                </div>                
            </div>

            {/* Barra fixa no celular e tablet */}
            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-white/10 bg-[#0c3d35] px-4 py-3 shadow-[0_-8px_24px_rgba(0,0,0,0.15)] lg:hidden">
                <div className="mx-auto flex max-w-xl items-center gap-3">
                    <div className="shrink-0 text-white">
                        <p className="text-[11px] text-white/60">Total por mês</p>
                        <p className="text-lg font-extrabold leading-tight">
                            {moeda.format(totalNovo)}
                        </p>
                    </div>
                    <div className="flex flex-1 gap-2">
                        {passo === 2 && (
                            <button
                                type="button"
                                disabled={enviando}
                                onClick={() => {
                                    setErro("");
                                    setPasso(1);
                                }}
                                className="shrink-0 cursor-pointer rounded-xl border border-white/20 px-4 py-3 text-sm font-bold text-white/80 disabled:opacity-50"
                            >
                                Voltar
                            </button>
                        )}
                        <div className="flex-1">{acaoPrimaria}</div>
                    </div>
                </div>
            </div>
        </main>
    );
}