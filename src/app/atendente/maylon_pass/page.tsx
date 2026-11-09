"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  Receipt,
  RefreshCw,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";
type UsuarioMaylonPass = {
  id: number | string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | number | boolean | null;
  plano?: string | null;
  valor?: number | string | null;
  created_at?: string | null;
  profile_image?: string | null;
};
type RespostaAPI = {
  usuarios?: Record<string, unknown>[];
  error?: string;
  mensagem?: string;
};
type RespostaFaturas = {
  faturas?: Record<string, unknown>[];
  data?: Record<string, unknown>[];
  error?: string;
  mensagem?: string;
};
const POR_PAGINA = 10;
const CONSULTAS_SIMULTANEAS = 5;
const STATUS_INATIVOS = [
  "inativo",
  "inactive",
  "0",
  "false",
  "bloqueado",
  "blocked",
  "cancelado",
  "canceled",
  "cancelled",
  "suspenso",
  "suspended",
  "desativado",
  "disabled",
  "expirado",
  "expired",
  "banido",
  "banned",
];
const STATUS_FATURA_PENDENTE = [
  "pendente",
  "pending",
  "aberto",
  "aberta",
  "open",
  "vencido",
  "vencida",
  "atrasado",
  "atrasada",
  "overdue",
];
const FOCO =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30";
function paraTexto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  const resultado = String(valor).trim();
  return resultado || null;
}
function normalizarStatus(status: unknown): string {
  return String(status ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}
function usuarioAtivo(usuario: UsuarioMaylonPass): boolean {
  return !STATUS_INATIVOS.includes(normalizarStatus(usuario.status));
}
function paraNumero(valor?: number | string | null): number | null {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  let normalizado = valor.trim();
  if (normalizado.includes(",")) {
    normalizado = normalizado.replace(/\./g, "").replace(",", ".");
  }
  const numero = Number(normalizado);
  return Number.isFinite(numero) ? numero : null;
}
function formatarMoeda(valor?: number | string | null): string {
  const numero = paraNumero(valor);
  if (numero === null) return "—";
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
function formatarData(valor?: string | null): string {
  if (!valor) return "—";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}
function formatarTelefone(valor?: string | null): string {
  if (!valor) return "Não informado";
  let digitos = valor.replace(/\D/g, "").replace(/^0+/, "");
  if (digitos.startsWith("55") && (digitos.length === 12 || digitos.length === 13)) {
    digitos = digitos.slice(2);
  }
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return valor.trim();
}
function iniciais(nome?: string | null): string {
  const resultado = (nome ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");
  return resultado || "?";
}
function texto(valor?: string | null): string {
  return valor?.trim() || "Não informado";
}
function normalizarUsuario(r: Record<string, unknown>): UsuarioMaylonPass {
  return {
    id: (r.id ?? r.user_id ?? "") as number | string,
    full_name: paraTexto(r.full_name ?? r.nome ?? r.name),
    email: paraTexto(r.email),
    phone: paraTexto(r.phone ?? r.telefone ?? r.celular),
    status: (r.status ?? r.situacao ?? r.ativo ?? r.active ?? r.is_active ?? null) as
      UsuarioMaylonPass["status"],
    plano: paraTexto(r.plano ?? r.plan ?? r.plan_name),
    valor: (r.valor ?? r.price ?? r.amount ?? null) as number | string | null,
    created_at: paraTexto(r.created_at ?? r.criado_em),
    profile_image: paraTexto(r.profile_image ?? r.avatar ?? r.foto),
  };
}
async function contarFaturasPendentes(
  usuarioId: string,
  signal: AbortSignal
): Promise<number> {
  const response = await fetch(
    `/api/maylon-pass/faturas?usuario_id=${encodeURIComponent(usuarioId)}`,
    {
      method: "GET",
      cache: "no-store",
      credentials: "include",
      signal,
    }
  );
  const dados = (await response.json().catch(() => ({}))) as
    | RespostaFaturas
    | Record<string, unknown>[];
  if (!response.ok) {
    throw new Error("Não foi possível consultar as faturas.");
  }
  let lista: Record<string, unknown>[] = [];
  if (Array.isArray(dados)) {
    lista = dados;
  } else if (Array.isArray(dados.faturas)) {
    lista = dados.faturas;
  } else if (Array.isArray(dados.data)) {
    lista = dados.data;
  }
  return lista.filter((fatura) =>
    STATUS_FATURA_PENDENTE.includes(normalizarStatus(fatura.status))
  ).length;
}
export default function MaylonPassPage() {
  const [usuarios, setUsuarios] = useState<UsuarioMaylonPass[]>([]);
  const [busca, setBusca] = useState("");
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [pendencias, setPendencias] = useState<Record<string, number>>({});
  const [falhas, setFalhas] = useState(0);
  const [verificando, setVerificando] = useState(false);
  const [tentativa, setTentativa] = useState(0);
  const consultados = useRef<Set<string>>(new Set());
  const carregar = useCallback(async (manual = false) => {
    if (manual) setAtualizando(true);
    else setCarregando(true);
    setErro("");
    try {
      const response = await fetch("/api/maylon-pass", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });
      const dados: RespostaAPI = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          dados.error ||
            dados.mensagem ||
            "Não foi possível carregar os usuários do Maylon Pass."
        );
      }
      if (!Array.isArray(dados.usuarios)) {
        throw new Error("A API não retornou uma lista válida de usuários.");
      }
      consultados.current.clear();
      setPendencias({});
      setFalhas(0);
      setUsuarios(dados.usuarios.map(normalizarUsuario));
      setPagina(1);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar os usuários.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);
  useEffect(() => {
    void carregar();
  }, [carregar]);
  useEffect(() => {
    if (carregando) return;
    const fila = usuarios
      .filter(usuarioAtivo)
      .filter((usuario) => !consultados.current.has(String(usuario.id)));
    if (fila.length === 0) {
      setVerificando(false);
      return;
    }
    let cancelado = false;
    const controle = new AbortController();
    setVerificando(true);
    setFalhas(0);
    async function trabalhador() {
      while (!cancelado) {
        const usuario = fila.shift();
        if (!usuario) return;
        const chave = String(usuario.id);
        try {
          const quantidade = await contarFaturasPendentes(chave, controle.signal);
          if (cancelado) return;
          consultados.current.add(chave);
          setPendencias((atual) => ({ ...atual, [chave]: quantidade }));
        } catch {
          if (cancelado) return;
          setFalhas((atual) => atual + 1);
        }
      }
    }
    void Promise.all(
      Array.from({ length: Math.min(CONSULTAS_SIMULTANEAS, fila.length) }, () =>
        trabalhador()
      )
    ).then(() => {
      if (!cancelado) setVerificando(false);
    });
    return () => {
      cancelado = true;
      controle.abort();
      setVerificando(false);
    };
  }, [usuarios, carregando, tentativa]);
  const totalAtivos = useMemo(() => usuarios.filter(usuarioAtivo).length, [usuarios]);
  const verificados = useMemo(
    () =>
      usuarios.filter(
        (usuario) => usuarioAtivo(usuario) && String(usuario.id) in pendencias
      ).length,
    [usuarios, pendencias]
  );
  const comPendencia = useMemo(
    () =>
      usuarios.filter(
        (usuario) =>
          usuarioAtivo(usuario) && (pendencias[String(usuario.id)] ?? 0) > 0
      ),
    [usuarios, pendencias]
  );
  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    if (!termo) return comPendencia;
    const digitos = termo.replace(/\D/g, "");
    return comPendencia.filter((usuario) => {
      const campos = [
        String(usuario.id),
        usuario.full_name,
        usuario.email,
        usuario.phone,
        usuario.plano,
        formatarData(usuario.created_at),
      ];
      const achouTexto = campos.some((campo) =>
        String(campo ?? "").toLocaleLowerCase("pt-BR").includes(termo)
      );
      const achouTelefone =
        digitos !== "" && (usuario.phone ?? "").replace(/\D/g, "").includes(digitos);
      return achouTexto || achouTelefone;
    });
  }, [comPendencia, busca]);
  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const visiveis = filtrados.slice(inicio, inicio + POR_PAGINA);
  const progresso =
    totalAtivos > 0 ? Math.round((verificados / totalAtivos) * 100) : 0;
  const mostrarAviso = !carregando && !erro && (verificando || falhas > 0);
  function limparBusca() {
    setBusca("");
    setPagina(1);
  }
  return (
    <main className="min-h-screen space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Maylon Pass
          </h1>
          <p className="mt-2 text-sm text-white/90">
            Consulte e acompanhe os usuários do Maylon Pass.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void carregar(true)}
          disabled={carregando || atualizando}
          className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-teal-800 shadow-lg transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60 ${FOCO}`}
        >
          <RefreshCw className={`h-4 w-4 ${atualizando ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </header>
      <section
        aria-label="Indicadores"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3"
      >
        <div className="rounded-2xl border border-white/20 bg-white p-5 shadow-lg shadow-teal-950/10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-black'">Total de assinantes</p>
            <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-0 text-3xl font-extrabold text-slate-900">{usuarios.length}</p>
          <p className="mt-1.5 text-xs text-black">Total de usúario assinantes</p>
        </div>
        <div className="rounded-2xl border border-white/20 bg-white p-5 shadow-lg shadow-teal-950/10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-black">Assinantes ativos</p>
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-0 text-3xl font-extrabold text-slate-900">{totalAtivos}</p>
          <p className="mt-1.5 text-xs text-black">Usúarios ativos no plano</p>
        </div>
        <div className="rounded-2xl border border-white/20 bg-white p-5 shadow-lg shadow-teal-950/10">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-black">Assinantes com fatura pendente</p>
            <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
              <Receipt className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-0 text-3xl font-extrabold text-slate-900">
            {comPendencia.length}
          </p>
          <p className="mt-1.5 text-xs text-black">Usúarios com fatura em aberto</p>
        </div>
      </section>
      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-teal-950/10">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <CreditCard className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Assinantes</h2>
              <p className="mt-0 text-xs text-slate-500">
                Só aparecem assinantes ativos do Maylon Pass com pelo menos uma fatura em aberto.
              </p>
            </div>
          </div>
        </div>
        <div className="border-b border-slate-100 p-5">
          <label className="relative block w-full">
            <span className="sr-only">Pesquisar usuário</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por nome, e-mail, telefone ou ID..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            />
          </label>
        </div>
        {mostrarAviso && (
          <div className="border-b border-slate-100 bg-slate-50 px-5 py-4">
            {verificando && (
              <div role="status" aria-live="polite">
                <p className="text-sm font-medium text-slate-700">
                  Verificando faturas dos usuários ativos: {verificados} de {totalAtivos}
                </p>
                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progresso}
                  aria-label="Progresso da verificação de faturas"
                  className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200"
                >
                  <div
                    className="h-full rounded-full bg-teal-600 transition-all"
                    style={{ width: `${progresso}%` }}
                  />
                </div>
              </div>
            )}
            {!verificando && falhas > 0 && (
              <div
                role="alert"
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm text-red-700">
                  Não foi possível consultar as faturas de {falhas}{" "}
                  {falhas === 1 ? "usuário" : "usuários"}. A lista pode estar
                  incompleta.
                </p>
                <button
                  type="button"
                  onClick={() => setTentativa((n) => n + 1)}
                  className={`w-fit cursor-pointer rounded-lg border border-red-200 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-50 ${FOCO}`}
                >
                  Tentar novamente
                </button>
              </div>
            )}
          </div>
        )}
        {carregando ? (
          <div className="space-y-5 p-6" aria-busy="true">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex animate-pulse items-center gap-4">
                <div className="h-11 w-11 rounded-full bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 rounded bg-slate-100" />
                  <div className="h-3 w-56 max-w-full rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : erro ? (
          <div
            role="alert"
            className="m-5 rounded-2xl border border-red-200 bg-red-50 p-6 text-center"
          >
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-600" />
            <p className="text-sm font-medium text-red-700">{erro}</p>
            <button
              type="button"
              onClick={() => void carregar()}
              className={`mt-3 cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-red-700 underline ${FOCO}`}
            >
              Tentar novamente
            </button>
          </div>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center sm:py-20">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-teal-700">
              <Receipt className="h-9 w-9" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {usuarios.length === 0
                ? "Nenhum assinante encontrado"
                : verificando
                  ? "Verificando faturas..."
                  : busca
                    ? "Nenhum resultado para sua busca"
                    : "Nenhum assinante ativo com fatura pendente"}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {usuarios.length === 0
                ? "Não retornou assinantes do Maylon Pass."
                : verificando
                  ? "Os usuários com faturas pendentes aparecem aqui conforme a consulta avança."
                  : busca
                    ? "Tente alterar a pesquisa."
                    : "Todos os assinantes ativos consultados estão com as faturas em dia."}
            </p>
            {busca && (
              <button
                type="button"
                onClick={limparBusca}
                className={`mt-5 cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 ${FOCO}`}
              >
                Limpar pesquisa
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-4">Usuário</th>
                    <th scope="col" className="px-5 py-4">Telefone</th>
                    <th scope="col" className="px-5 py-4">Plano</th>
                    <th scope="col" className="px-5 py-4">Valor do plano</th>
                    <th scope="col" className="px-5 py-4">Faturas pendentes</th>
                    <th scope="col" className="px-5 py-4">Cadastro</th>
                    <th scope="col" className="px-5 py-4 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visiveis.map((usuario) => {
                    const quantidade = pendencias[String(usuario.id)] ?? 0;
                    return (
                      <tr key={usuario.id} className="transition-colors hover:bg-slate-50/70">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {usuario.profile_image ? (
                              <img
                                src={usuario.profile_image}
                                alt=""
                                className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-slate-100"
                              />
                            ) : (
                              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-bold text-teal-700">
                                {iniciais(usuario.full_name)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="max-w-[220px] truncate font-semibold text-slate-900">
                                {texto(usuario.full_name)}
                              </p>
                              <p className="max-w-[220px] truncate text-xs text-slate-500">
                                {texto(usuario.email)}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatarTelefone(usuario.phone)}
                        </td>
                        <td className="px-5 py-4 text-slate-700">{texto(usuario.plano)}</td>
                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                          {formatarMoeda(usuario.valor)}
                        </td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                            <Receipt className="h-3.5 w-3.5" />
                            {quantidade} {quantidade === 1 ? "fatura" : "faturas"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                          {formatarData(usuario.created_at)}
                        </td>
                        <td className="px-5 py-4 text-center font-medium text-slate-700">
                          <Link
                            href={`/gerente/maylon_pass/${usuario.id}`}
                            title="Visualizar usuário"
                            aria-label={`Visualizar usuário ${texto(usuario.full_name)}`}
                            className={`inline-flex cursor-pointer items-center justify-center rounded-lg p-2 text-teal-700 transition hover:bg-teal-50 hover:text-teal-900 ${FOCO}`}
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <footer className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Mostrando <b className="text-slate-800">{inicio + 1}</b> até{" "}
                <b className="text-slate-800">
                  {Math.min(inicio + POR_PAGINA, filtrados.length)}
                </b>{" "}
                de <b className="text-slate-800">{filtrados.length}</b> usuários
              </p>
              <nav aria-label="Paginação" className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPagina(paginaAtual - 1)}
                  disabled={paginaAtual <= 1}
                  className={`inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${FOCO}`}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Anterior
                </button>
                <span className="whitespace-nowrap text-sm text-slate-600">
                  Página <b className="text-slate-900">{paginaAtual}</b> de{" "}
                  <b className="text-slate-900">{totalPaginas}</b>
                </span>
                <button
                  type="button"
                  onClick={() => setPagina(paginaAtual + 1)}
                  disabled={paginaAtual >= totalPaginas}
                  className={`inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${FOCO}`}
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            </footer>
          </>
        )}
      </section>
    </main>
  );
}