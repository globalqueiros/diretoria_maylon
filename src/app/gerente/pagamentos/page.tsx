"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  AlertCircle,
  Banknote,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  CreditCard,
  Filter,
  MapPin,
  MessageSquarePlus,
  QrCode,
  Receipt,
  RefreshCw,
  Search,
  UserRound,
  Wallet,
  X,
} from "lucide-react";

type Pagamento = {
  id: number | string;
  status: string;
  metodo: string;
  valor: number | string | null;
  passageiro: string;
  corridaId: number | string | null;
  transacao: string;
  origem: string;
  destino: string;
  protocolo: string;
  data: string | null;
};

type RespostaAPI = Record<string, unknown> | unknown[];

type GrupoStatus = "pendente" | "aprovado" | "recusado" | "estornado" | "cancelado";
type FiltroStatus = "todos" | GrupoStatus;

const POR_PAGINA = 25;

const GRUPOS: Record<GrupoStatus, { nome: string; classe: string; aliases: string[] }> = {
  pendente: {
    nome: "Pendente",
    classe: "bg-amber-50 text-amber-700",
    aliases: ["pending", "pendente", "waiting", "aguardando", "processing", "processando", "in_process"],
  },
  aprovado: {
    nome: "Aprovado",
    classe: "bg-emerald-50 text-emerald-700",
    aliases: ["approved", "aprovado", "paid", "pago", "completed", "concluido", "succeeded", "confirmed", "confirmado"],
  },
  recusado: {
    nome: "Recusado",
    classe: "bg-red-50 text-red-700",
    aliases: ["failed", "falhou", "refused", "recusado", "declined", "rejected", "rejeitado", "error", "erro"],
  },
  estornado: {
    nome: "Estornado",
    classe: "bg-violet-50 text-violet-700",
    aliases: ["refunded", "estornado", "reembolsado", "chargeback", "partially_refunded"],
  },
  cancelado: {
    nome: "Cancelado",
    classe: "bg-slate-100 text-slate-700",
    aliases: ["canceled", "cancelled", "cancelado", "cancelada", "expired", "expirado"],
  },
};

const FILTROS: { valor: FiltroStatus; label: string }[] = [
  { valor: "todos", label: "Todos os status" },
  { valor: "pendente", label: "Pendentes" },
  { valor: "aprovado", label: "Aprovados" },
  { valor: "recusado", label: "Recusados" },
  { valor: "estornado", label: "Estornados" },
  { valor: "cancelado", label: "Cancelados" },
];

const METODOS: Record<string, { nome: string; aliases: string[]; icone: ReactNode }> = {
  pix: {
    nome: "Pix",
    aliases: ["pix"],
    icone: <QrCode className="h-4 w-4 shrink-0 text-slate-400" />,
  },
  credito: {
    nome: "Cartão de crédito",
    aliases: ["credit_card", "credito", "cartao_credito", "cartao_de_credito", "credit", "card", "cartao"],
    icone: <CreditCard className="h-4 w-4 shrink-0 text-slate-400" />,
  },
  debito: {
    nome: "Cartão de débito",
    aliases: ["debit_card", "debito", "cartao_debito", "cartao_de_debito", "debit"],
    icone: <CreditCard className="h-4 w-4 shrink-0 text-slate-400" />,
  },
  dinheiro: {
    nome: "Dinheiro",
    aliases: ["cash", "dinheiro", "money", "especie"],
    icone: <Banknote className="h-4 w-4 shrink-0 text-slate-400" />,
  },
  carteira: {
    nome: "Carteira",
    aliases: ["wallet", "carteira", "saldo", "balance"],
    icone: <Wallet className="h-4 w-4 shrink-0 text-slate-400" />,
  },
};

const ASSUNTOS_CHAMADO = [
  { valor: "reembolso", label: "Solicitar reembolso" },
  { valor: "cobranca_duplicada", label: "Cobrança duplicada" },
  { valor: "cobranca_indevida", label: "Cobrança indevida" },
  { valor: "valor_incorreto", label: "Valor incorreto" },
  { valor: "pagamento_nao_reconhecido", label: "Pagamento não reconhecido" },
  { valor: "outro", label: "Outro" },
];

/* ───────────── Helpers ───────────── */

function normalizarTexto(valor?: string | null) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}

function grupoDoStatus(status?: string | null): GrupoStatus | null {
  const s = normalizarTexto(status);
  const grupo = (Object.keys(GRUPOS) as GrupoStatus[]).find((g) =>
    GRUPOS[g].aliases.includes(s)
  );
  return grupo ?? null;
}

function formatarStatus(status?: string | null) {
  const grupo = grupoDoStatus(status);
  if (grupo) return GRUPOS[grupo].nome;
  const s = normalizarTexto(status);
  if (!s) return "Não informado";
  return s.replace(/_/g, " ").replace(/^./, (letra) => letra.toUpperCase());
}

function classeStatus(status?: string | null) {
  const grupo = grupoDoStatus(status);
  return grupo ? GRUPOS[grupo].classe : "bg-slate-100 text-slate-700";
}

function metodoDe(metodo?: string | null) {
  const s = normalizarTexto(metodo);
  return Object.values(METODOS).find((m) => m.aliases.includes(s)) ?? null;
}

function formatarMetodo(metodo?: string | null) {
  const encontrado = metodoDe(metodo);
  if (encontrado) return encontrado.nome;
  const s = normalizarTexto(metodo);
  if (!s) return "Não informado";
  return s.replace(/_/g, " ").replace(/^./, (letra) => letra.toUpperCase());
}

function paraNumero(valor?: number | string | null) {
  if (valor === null || valor === undefined || valor === "") return null;
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : null;
  let s = valor.trim();
  if (s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
  const numero = Number(s);
  return Number.isFinite(numero) ? numero : null;
}

function formatarMoeda(valor?: number | string | null) {
  const numero = paraNumero(valor);
  if (numero === null) return "—";
  return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(valor?: string | null) {
  if (!valor) return "—";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function texto(valor?: string | null) {
  return valor?.trim() || "Não informado";
}

// UUID grande vira os 8 primeiros caracteres (o id completo fica no title)
function idCurto(valor?: number | string | null) {
  const s = String(valor ?? "");
  return s.length > 12 ? s.slice(0, 8) : s;
}

// Pega o primeiro campo preenchido entre os nomes possíveis que a API pode usar
function pegar(raw: Record<string, unknown>, ...chaves: string[]) {
  for (const chave of chaves) {
    const v = raw[chave];
    if (v !== undefined && v !== null && String(v).trim() !== "") return v;
  }
  return undefined;
}

function normalizar(raw: Record<string, unknown>): Pagamento {
  const corrida = pegar(raw, "corrida_id", "corridaId", "ride_id", "rideId", "trip_id");
  const valor = pegar(raw, "valor", "amount", "total", "value", "price");

  return {
    id: (pegar(raw, "id", "pagamento_id", "payment_id") ?? "") as number | string,
    status: String(pegar(raw, "status", "situacao", "payment_status") ?? ""),
    metodo: String(
      pegar(raw, "metodo", "forma_pagamento", "payment_method", "method", "tipo") ?? ""
    ),
    valor: (valor ?? null) as number | string | null,
    passageiro: String(
      pegar(raw, "passageiro", "cliente", "customer_name", "passenger", "user_name", "nome") ?? ""
    ),
    corridaId: (corrida ?? null) as number | string | null,
    transacao: String(
      pegar(raw, "transacao", "transaction_id", "transacao_id", "codigo", "gateway_id") ?? ""
    ),
    origem: String(pegar(raw, "origem", "pickup_address") ?? ""),
    destino: String(pegar(raw, "destino", "destination_address") ?? ""),
    protocolo: String(pegar(raw, "protocolo_chamado", "protocolo") ?? ""),
    data: (pegar(raw, "data", "created_at", "createdAt", "criado_em", "paid_at") ?? null) as
      | string
      | null,
  };
}

function extrairLista(dados: RespostaAPI): Record<string, unknown>[] | null {
  if (Array.isArray(dados)) return dados as Record<string, unknown>[];
  const lista = dados.pagamentos ?? dados.payments ?? dados.data;
  return Array.isArray(lista) ? (lista as Record<string, unknown>[]) : null;
}

/* ───────────── Página ───────────── */

export default function PagamentosPage() {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<FiltroStatus>("todos");
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const [chamado, setChamado] = useState<Pagamento | null>(null);
  const [aviso, setAviso] = useState("");

  const carregar = useCallback(async (manual = false) => {
    if (manual) setAtualizando(true);
    else setCarregando(true);
    setErro("");

    try {
      const response = await fetch("/api/gerente/pagamentos", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });

      const dados: RespostaAPI = await response.json().catch(() => ({}));

      if (!response.ok) {
        const d = dados as Record<string, unknown>;
        throw new Error(
          String(d.error || d.mensagem || "Não foi possível carregar os pagamentos.")
        );
      }

      const lista = extrairLista(dados);
      if (!lista) {
        throw new Error("A API não retornou uma lista válida. Verifique /api/gerente/pagamentos.");
      }

      setPagamentos(lista.map(normalizar));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Ocorreu um erro ao carregar os pagamentos.");
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const contagens = useMemo(() => {
    const resultado: Record<FiltroStatus, number> = {
      todos: pagamentos.length,
      pendente: 0,
      aprovado: 0,
      recusado: 0,
      estornado: 0,
      cancelado: 0,
    };

    for (const pagamento of pagamentos) {
      const grupo = grupoDoStatus(pagamento.status);
      if (grupo) resultado[grupo]++;
    }

    return resultado;
  }, [pagamentos]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return pagamentos.filter((pagamento) => {
      if (status !== "todos" && grupoDoStatus(pagamento.status) !== status) return false;
      if (!termo) return true;

      const campos = [
        String(pagamento.id),
        pagamento.corridaId,
        pagamento.passageiro,
        pagamento.transacao,
        pagamento.origem,
        pagamento.destino,
        pagamento.protocolo,
        pagamento.status,
        formatarStatus(pagamento.status),
        formatarMetodo(pagamento.metodo),
        formatarMoeda(pagamento.valor),
        formatarData(pagamento.data),
      ];

      return campos.some((campo) =>
        String(campo ?? "").toLocaleLowerCase("pt-BR").includes(termo)
      );
    });
  }, [pagamentos, busca, status]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const visiveis = filtrados.slice(inicio, inicio + POR_PAGINA);

  function limparFiltros() {
    setBusca("");
    setStatus("todos");
    setPagina(1);
  }

  return (
    <main className="min-h-screen space-y-6 p-4 sm:p-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Pagamentos
          </h1>
          <p className="mt-1.5 text-sm text-white/90">
            Acompanhe os pagamentos da plataforma, seus métodos e respectivos status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => void carregar(true)}
          disabled={carregando || atualizando}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-teal-800 shadow-lg transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${atualizando ? "animate-spin" : ""}`} />
          Atualizar
        </button>
      </header>

      {aviso && (
        <div
          role="status"
          className="flex items-center justify-between gap-3 rounded-2xl bg-white px-5 py-4 text-sm font-medium text-emerald-700 shadow-lg"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" /> {aviso}
          </span>
          <button type="button" onClick={() => setAviso("")} aria-label="Fechar aviso">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-teal-950/10">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Receipt className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Todos os pagamentos</h2>
              <p className="mt-1 text-xs text-slate-500">
                Pesquise e filtre os registros da plataforma.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row">
          <label className="relative block w-full flex-1">
            <span className="sr-only">Pesquisar pagamentos</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por ID, corrida, passageiro, endereço, protocolo ou método..."
              className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            />
          </label>

          <label className="relative block w-full lg:w-60 lg:shrink-0">
            <span className="sr-only">Filtrar por status</span>
            <Filter className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as FiltroStatus);
                setPagina(1);
              }}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-10 text-sm text-slate-800 outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10"
            >
              {FILTROS.map((filtro) => (
                <option key={filtro.valor} value={filtro.valor}>
                  {filtro.label} ({contagens[filtro.valor]})
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          </label>
        </div>

        {carregando ? (
          <div className="space-y-5 p-6" aria-busy="true">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-slate-100" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-40 rounded bg-slate-100" />
                  <div className="h-3 w-64 max-w-full rounded bg-slate-100" />
                </div>
              </div>
            ))}
          </div>
        ) : erro ? (
          <div role="alert" className="m-5 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-600" />
            <p className="text-sm font-medium text-red-700">{erro}</p>
            <button
              type="button"
              onClick={() => void carregar()}
              className="mt-3 rounded-lg px-4 py-2 text-sm font-semibold text-red-700 underline"
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
              {pagamentos.length === 0
                ? "Nenhum pagamento encontrado"
                : "Nenhum resultado para sua busca"}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {pagamentos.length === 0
                ? "A API não retornou pagamentos. Verifique os dados e a rota /api/gerente/pagamentos."
                : "Altere os termos de pesquisa ou selecione outro status para encontrar pagamentos."}
            </p>
            {(busca || status !== "todos") && (
              <button
                type="button"
                onClick={limparFiltros}
                className="mt-5 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1400px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-4">Pagamento</th>
                    <th scope="col" className="px-5 py-4">Corrida</th>
                    <th scope="col" className="px-5 py-4">Passageiro</th>
                    <th scope="col" className="px-5 py-4">Trajeto</th>
                    <th scope="col" className="px-5 py-4">Método</th>
                    <th scope="col" className="px-5 py-4">Valor</th>
                    <th scope="col" className="px-5 py-4">Status</th>
                    <th scope="col" className="px-5 py-4">Data</th>
                    <th scope="col" className="px-5 py-4 text-right">Ações</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {visiveis.map((pagamento, i) => {
                    const metodo = metodoDe(pagamento.metodo);

                    return (
                      <tr
                        key={`${pagamento.id}-${i}`}
                        className="transition-colors hover:bg-slate-50/70"
                      >
                        <td className="whitespace-nowrap px-5 py-4">
                          <div className="flex items-center gap-2 font-semibold text-slate-900">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                              <Receipt className="h-4 w-4" />
                            </span>
                            <div>
                              <p title={String(pagamento.id)}>#{idCurto(pagamento.id)}</p>
                              {pagamento.transacao && (
                                <p
                                  title={pagamento.transacao}
                                  className="max-w-[140px] truncate text-[11px] font-normal text-slate-400"
                                >
                                  {pagamento.transacao}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4">
                          {pagamento.corridaId ? (
                            <Link
                              href={`/gerente/pagamentos`}
                              title={String(pagamento.corridaId)}
                              className="font-semibold text-teal-700 underline-offset-2 hover:underline"
                            >
                              #{idCurto(pagamento.corridaId)}
                            </Link>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                            <span className="max-w-[170px] truncate text-slate-700">
                              {texto(pagamento.passageiro)}
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                            <div className="max-w-[280px] space-y-0.5 text-xs">
                              <p title={pagamento.origem} className="truncate text-slate-700">
                                <span className="font-semibold text-slate-500">De:</span>{" "}
                                {texto(pagamento.origem)}
                              </p>
                              <p title={pagamento.destino} className="truncate text-slate-700">
                                <span className="font-semibold text-slate-500">Para:</span>{" "}
                                {texto(pagamento.destino)}
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2">
                            {metodo?.icone ?? <CreditCard className="h-4 w-4 shrink-0 text-slate-400" />}
                            <span className="whitespace-nowrap text-slate-700">
                              {formatarMetodo(pagamento.metodo)}
                            </span>
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                          {formatarMoeda(pagamento.valor)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${classeStatus(pagamento.status)}`}
                          >
                            {formatarStatus(pagamento.status)}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                          <div className="flex items-center gap-2">
                            <CalendarDays className="h-4 w-4 shrink-0" />
                            {formatarData(pagamento.data)}
                          </div>
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right">
                          {pagamento.protocolo ? (
                            <div
                              title={`Chamado ${pagamento.protocolo} em andamento`}
                              className="inline-flex flex-col items-end gap-1"
                            >
                              <span className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-xs font-semibold text-amber-700">
                                <Clock3 className="h-4 w-4" />
                                Em andamento
                              </span>
                              <span className="text-[11px] font-medium text-slate-400">
                                {pagamento.protocolo}
                              </span>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setChamado(pagamento)}
                              title="Abrir chamado sobre este pagamento"
                              aria-label={`Abrir chamado do pagamento #${idCurto(pagamento.id)}`}
                              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-violet-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-500/30"
                            >
                              <MessageSquarePlus className="h-4 w-4" />
                              Abrir chamado
                            </button>
                          )}
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
                de <b className="text-slate-800">{filtrados.length}</b> pagamentos
              </p>

              <nav aria-label="Paginação" className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPagina(paginaAtual - 1)}
                  disabled={paginaAtual <= 1}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
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
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Próxima
                  <ChevronRight className="h-4 w-4" />
                </button>
              </nav>
            </footer>
          </>
        )}
      </section>

      {chamado && (
        <ChamadoModal
          pagamento={chamado}
          onClose={() => setChamado(null)}
          onSucesso={(protocolo) => {
            setChamado(null);
            setAviso(`Chamado aberto com sucesso. Protocolo ${protocolo}.`);
            void carregar(true);
          }}
        />
      )}
    </main>
  );
}

/* ───────────── Modal de chamado ───────────── */

function ChamadoModal({
  pagamento,
  onClose,
  onSucesso,
}: {
  pagamento: Pagamento;
  onClose: () => void;
  onSucesso: (protocolo: string) => void;
}) {
  const [assunto, setAssunto] = useState("");
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const fechar = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !enviando) onClose();
    };
    window.addEventListener("keydown", fechar);
    return () => window.removeEventListener("keydown", fechar);
  }, [enviando, onClose]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (!assunto) return setErro("Selecione o assunto do chamado.");
    if (descricao.trim().length < 10)
      return setErro("Descreva o problema com pelo menos 10 caracteres.");

    setEnviando(true);
    setErro("");

    try {
      const res = await fetch("/api/chamados/reembolso", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          corridaId: pagamento.corridaId ?? pagamento.id,
          motivo: assunto,
          descricao: descricao.trim(),
        }),
      });

      const dados = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(dados.error || "Não foi possível abrir o chamado.");

      onSucesso(dados.protocolo);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao abrir o chamado.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && !enviando && onClose()}
    >
      <form
        onSubmit={enviar}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-chamado"
        className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
              <MessageSquarePlus className="h-5 w-5" />
            </div>
            <div>
              <h2 id="titulo-chamado" className="font-bold text-slate-900">
                Abrir chamado
              </h2>
              <p className="text-xs text-slate-500">
                Corrida #{idCurto(pagamento.corridaId ?? pagamento.id)} ·{" "}
                {formatarMoeda(pagamento.valor)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            aria-label="Fechar"
            className="cursor-pointer rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {(pagamento.origem || pagamento.destino) && (
          <div className="mt-5 space-y-1.5 rounded-2xl bg-slate-50 p-4 text-xs text-slate-700">
            <p>
              <span className="font-semibold text-slate-500">De:</span> {texto(pagamento.origem)}
            </p>
            <p>
              <span className="font-semibold text-slate-500">Para:</span> {texto(pagamento.destino)}
            </p>
          </div>
        )}

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Assunto</span>
            <select
              value={assunto}
              onChange={(e) => setAssunto(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
            >
              <option value="">Selecione...</option>
              {ASSUNTOS_CHAMADO.map((a) => (
                <option key={a.valor} value={a.valor}>
                  {a.label}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">Descrição</span>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Explique o que aconteceu e o que o cliente está pedindo..."
              className="w-full resize-none rounded-xl border border-slate-200 px-3.5 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
            />
          </label>

          {erro && (
            <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {erro}
            </p>
          )}
        </div>

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={enviando}
            className="cursor-pointer rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={enviando}
            className="cursor-pointer rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {enviando ? "Abrindo..." : "Abrir chamado"}
          </button>
        </div>
      </form>
    </div>
  );
}