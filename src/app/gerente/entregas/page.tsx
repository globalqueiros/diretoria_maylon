
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Box,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Package,
  RefreshCw,
  Search,
  Truck,
  UserRound,
  Wallet,
  XCircle,
  AlertCircle,
  ChevronRight,
  Route,
} from "lucide-react";

type StatusEntrega = "pendente" | "em_rota" | "entregue" | "cancelada";
type FiltroEntrega = "todas" | StatusEntrega;

interface Entrega {
  id: number;
  codigo: string;
  remetente: string;
  destinatario: string;
  origem: string;
  destino: string;
  motorista: string | null;
  valor: number;
  status: StatusEntrega;
  criado_em: string;
}

const STATUS: Record<
  StatusEntrega,
  { label: string; classe: string; ponto: string }
> = {
  pendente: {
    label: "Pendente",
    classe: "bg-amber-50 text-amber-700 ring-amber-200",
    ponto: "bg-amber-500",
  },
  em_rota: {
    label: "Em rota",
    classe: "bg-sky-50 text-sky-700 ring-sky-200",
    ponto: "bg-sky-500",
  },
  entregue: {
    label: "Entregue",
    classe: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    ponto: "bg-emerald-500",
  },
  cancelada: {
    label: "Cancelada",
    classe: "bg-red-50 text-red-700 ring-red-200",
    ponto: "bg-red-500",
  },
};

const FILTROS: { valor: FiltroEntrega; label: string }[] = [
  { valor: "todas", label: "Todas" },
  { valor: "pendente", label: "Pendentes" },
  { valor: "em_rota", label: "Em rota" },
  { valor: "entregue", label: "Entregues" },
  { valor: "cancelada", label: "Canceladas" },
];

function moeda(valor: number) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataHora(valor: string) {
  const data = new Date(valor);

  if (Number.isNaN(data.getTime())) return "Data indisponível";

  return data.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatusBadge({ status }: { status: StatusEntrega }) {
  const item = STATUS[status] ?? STATUS.pendente;

  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${item.classe}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${item.ponto}`} />
      {item.label}
    </span>
  );
}

function StatCard({
  titulo,
  valor,
  descricao,
  icon: Icon,
  cor,
  selecionado,
  onClick,
}: {
  titulo: string;
  valor: number;
  descricao: string;
  icon: typeof Package;
  cor: string;
  selecionado?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-2xl border bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
        selecionado
          ? "border-teal-400 ring-2 ring-teal-500/10"
          : "border-slate-200 hover:border-teal-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{titulo}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {valor.toLocaleString("pt-BR")}
          </p>
        </div>

        <div className={`rounded-xl p-3 ${cor}`}>
          <Icon size={21} strokeWidth={2} />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">{descricao}</span>
        <ArrowUpRight
          size={16}
          className="text-slate-400 transition group-hover:text-teal-600"
        />
      </div>
    </button>
  );
}

export default function EntregasPage() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroEntrega>("todas");
  const [busca, setBusca] = useState("");

  const carregar = useCallback(async (silencioso = false) => {
    if (silencioso) {
      setAtualizando(true);
    } else {
      setCarregando(true);
    }

    setErro(null);

    try {
      const res = await fetch("/api/gerente/entregas", {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (!res.ok) {
        throw new Error(
          res.status === 401 || res.status === 403
            ? "Sua sessão expirou ou você não tem permissão para consultar as entregas."
            : "Não foi possível carregar as entregas."
        );
      }

      const data = await res.json();

      if (!Array.isArray(data.entregas)) {
        throw new Error("A resposta da API está em um formato inválido.");
      }

      setEntregas(data.entregas);
    } catch (e) {
      setErro(
        e instanceof Error
          ? e.message
          : "Ocorreu um erro ao carregar as entregas."
      );
    } finally {
      setCarregando(false);
      setAtualizando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const resumo = useMemo(() => {
    const total = entregas.length;

    return {
      total,
      pendente: entregas.filter((e) => e.status === "pendente").length,
      em_rota: entregas.filter((e) => e.status === "em_rota").length,
      entregue: entregas.filter((e) => e.status === "entregue").length,
      cancelada: entregas.filter((e) => e.status === "cancelada").length,
      valorEntregue: entregas
        .filter((e) => e.status === "entregue")
        .reduce((total, e) => total + (Number(e.valor) || 0), 0),
    };
  }, [entregas]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return entregas.filter((e) => {
      if (filtro !== "todas" && e.status !== filtro) return false;

      if (!termo) return true;

      return [
        e.codigo,
        e.remetente,
        e.destinatario,
        e.motorista ?? "",
        e.origem,
        e.destino,
      ]
        .join(" ")
        .toLocaleLowerCase("pt-BR")
        .includes(termo);
    });
  }, [entregas, filtro, busca]);

  const cards = [
    {
      titulo: "Total de entregas",
      valor: resumo.total,
      descricao: "Todos os registros",
      icon: Package,
      cor: "bg-teal-50 text-teal-700",
      filtro: "todas" as FiltroEntrega,
    },
    {
      titulo: "Pendentes",
      valor: resumo.pendente,
      descricao: "Aguardando atendimento",
      icon: Clock3,
      cor: "bg-amber-50 text-amber-700",
      filtro: "pendente" as FiltroEntrega,
    },
    {
      titulo: "Em rota",
      valor: resumo.em_rota,
      descricao: "Em andamento",
      icon: Truck,
      cor: "bg-sky-50 text-sky-700",
      filtro: "em_rota" as FiltroEntrega,
    },
    {
      titulo: "Entregues",
      valor: resumo.entregue,
      descricao: "Concluídas com sucesso",
      icon: CheckCircle2,
      cor: "bg-emerald-50 text-emerald-700",
      filtro: "entregue" as FiltroEntrega,
    },
  ];

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Gestão de entregas
            </h1>
            <p className="mt-0 max-w-2xl text-sm leading-6 text-white sm:text-sm">
              Acompanhe os pedidos, monitore os motoristas e gerencie cada
              etapa da operação em um só lugar.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void carregar(true)}
            disabled={carregando || atualizando}
            className="inline-flex cursor-pointer min-h-11 items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-teal-300 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-60 lg:self-center"
          >
            <RefreshCw
              size={17}
              className={atualizando ? "animate-spin" : ""}
            />
            Atualizar dados
          </button>
        </header>

        {/* Indicadores */}
        <section
          aria-label="Resumo das entregas"
          className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4"
        >
          {cards.map((card) => (
            <StatCard
              key={card.titulo}
              {...card}
              selecionado={filtro === card.filtro}
              onClick={() => setFiltro(card.filtro)}
            />
          ))}
        </section>

        {/* Resumo financeiro */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div className="flex items-center gap-4">
              <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
                <Wallet size={23} />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-500">
                  Valor das entregas concluídas
                </p>
                <p className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {moeda(resumo.valorEntregue)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start rounded-full bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:self-center">
              <Activity size={15} />
              {resumo.total > 0
                ? `${Math.round((resumo.entregue / resumo.total) * 100)}% concluídas`
                : "Nenhuma entrega registrada"}
            </div>
          </div>

          <div className="h-1.5 bg-slate-100">
            <div
              className="h-full rounded-r-full bg-teal-500 transition-all duration-500"
              style={{
                width: `${
                  resumo.total > 0
                    ? (resumo.entregue / resumo.total) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </section>

        {/* Listagem */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 p-4 sm:p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  Todas as entregas
                </h2>
                <p className="mt-0 text-sm text-slate-500">
                  Consulte pedidos e acompanhe o status operacional.
                </p>
              </div>

              <div className="relative w-full xl:max-w-md">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="search"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  placeholder="Buscar código, cliente, motorista..."
                  aria-label="Buscar entregas"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
                />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
              {FILTROS.map((item) => {
                const quantidade =
                  item.valor === "todas"
                    ? resumo.total
                    : resumo[item.valor];

                const ativo = filtro === item.valor;

                return (
                  <button
                    key={item.valor}
                    type="button"
                    onClick={() => setFiltro(item.valor)}
                    className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2.5 cursor-pointer text-sm font-semibold transition ${
                      ativo
                        ? "bg-teal-700 text-white shadow-sm shadow-teal-700/20"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {item.label}
                    <span
                      className={`rounded-md px-1.5 py-0.5 text-xs ${
                        ativo
                          ? "bg-white/15 text-white"
                          : "bg-white text-slate-500"
                      }`}
                    >
                      {quantidade}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Estado de erro */}
          {erro && (
            <div
              role="alert"
              className="m-4 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 sm:m-6 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-start gap-3">
                <AlertCircle
                  size={20}
                  className="mt-0.5 shrink-0 text-red-600"
                />
                <div>
                  <p className="text-sm font-semibold text-red-800">
                    Não foi possível carregar os dados
                  </p>
                  <p className="mt-1 text-sm text-red-700">{erro}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void carregar()}
                className="self-start rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* Tabela desktop */}
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/80 text-center text-xs uppercase tracking-wider text-slate-500">
                  <th className="px-6 py-4 font-semibold">Pedido</th>
                  <th className="px-6 py-4 font-semibold">Remetente</th>
                  <th className="px-6 py-4 font-semibold">Trajeto</th>
                  <th className="px-6 py-4 font-semibold">Motorista</th>
                  <th className="px-6 py-4 font-semibold">Valor</th>
                  <th className="px-6 py-4 font-semibold">Status</th>
                  <th className="px-6 py-4 font-semibold">Data</th>
                  <th className="px-6 py-4 text-right font-semibold">
                    Ação
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {carregando &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <td key={j} className="px-6 py-5">
                          <div className="h-4 animate-pulse rounded-md bg-slate-100" />
                        </td>
                      ))}
                    </tr>
                  ))}

                {!carregando && !erro && visiveis.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center">
                        <div className="rounded-2xl bg-slate-100 p-4 text-slate-400">
                          <Package size={28} />
                        </div>
                        <p className="mt-4 font-semibold text-slate-800">
                          Nenhuma entrega encontrada
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          Tente alterar o filtro ou utilizar outro termo de
                          pesquisa.
                        </p>
                        {(busca || filtro !== "todas") && (
                          <button
                            type="button"
                            onClick={() => {
                              setBusca("");
                              setFiltro("todas");
                            }}
                            className="mt-4 text-sm font-semibold text-teal-700 hover:text-teal-800"
                          >
                            Limpar filtros
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {!carregando &&
                  visiveis.map((e) => (
                    <tr
                      key={e.id}
                      className="group transition-colors hover:bg-teal-50/40"
                    >
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-900">{e.codigo}</p>
                        <p className="mt-1 text-xs text-slate-400">
                          ID #{e.id}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <p className="max-w-[170px] truncate font-medium text-slate-800">
                          {e.remetente}
                        </p>
                        <p className="mt-1 max-w-[170px] truncate text-xs text-slate-500">
                          Para: {e.destinatario}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex max-w-[230px] items-start gap-2">
                          <div className="flex flex-col items-center pt-1">
                            <span className="h-2 w-2 rounded-full border-2 border-teal-600" />
                            <span className="my-1 h-5 border-l border-dashed border-slate-300" />
                            <span className="h-2 w-2 rounded-full bg-teal-600" />
                          </div>
                          <div className="min-w-0 space-y-2">
                            <p className="truncate text-xs text-slate-600">
                              {e.origem}
                            </p>
                            <p className="truncate text-xs font-medium text-slate-800">
                              {e.destino}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="rounded-full bg-slate-100 p-2 text-slate-500">
                            <UserRound size={15} />
                          </div>
                          <span className="max-w-[130px] truncate text-slate-700">
                            {e.motorista || "Não atribuído"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-800">
                          {moeda(e.valor)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge status={e.status} />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <CalendarDays size={15} className="shrink-0" />
                          <span className="whitespace-nowrap">
                            {dataHora(e.criado_em)}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/gerente/entregas/${e.id}`}
                          aria-label={`Ver detalhes da entrega ${e.codigo}`}
                          className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
                        >
                          Detalhes
                          <ChevronRight size={14} />
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {/* Cards mobile */}
          <div className="divide-y divide-slate-100 md:hidden">
            {carregando &&
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="space-y-3 p-4">
                  <div className="h-5 w-1/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-slate-100" />
                  <div className="h-4 w-1/2 animate-pulse rounded bg-slate-100" />
                </div>
              ))}

            {!carregando && !erro && visiveis.length === 0 && (
              <div className="px-5 py-12 text-center">
                <Package className="mx-auto text-slate-300" size={32} />
                <p className="mt-3 font-semibold text-slate-800">
                  Nenhuma entrega encontrada
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Altere os filtros e tente novamente.
                </p>
              </div>
            )}

            {!carregando &&
              visiveis.map((e) => (
                <article
                  key={e.id}
                  className="space-y-4 p-4 transition hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Código do pedido
                      </p>
                      <h3 className="mt-1 text-base font-bold text-slate-900">
                        {e.codigo}
                      </h3>
                    </div>
                    <StatusBadge status={e.status} />
                  </div>

                  <div className="rounded-xl bg-slate-50 p-3.5">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 rounded-lg bg-white p-2 text-teal-700 shadow-sm">
                        <Route size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex gap-2">
                          <MapPin
                            size={14}
                            className="mt-0.5 shrink-0 text-teal-600"
                          />
                          <p className="text-sm text-slate-600">{e.origem}</p>
                        </div>
                        <div className="ml-1.5 my-1.5 h-4 border-l border-dashed border-slate-300" />
                        <div className="flex gap-2">
                          <MapPin
                            size={14}
                            className="mt-0.5 shrink-0 text-teal-700"
                          />
                          <p className="text-sm font-medium text-slate-800">
                            {e.destino}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Remetente</p>
                      <p className="mt-1 truncate text-sm font-medium text-slate-800">
                        {e.remetente}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Destinatário</p>
                      <p className="mt-1 truncate text-sm font-medium text-slate-800">
                        {e.destinatario}
                      </p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-slate-500">Motorista</p>
                      <p className="mt-1 flex items-center gap-1.5 truncate text-sm font-medium text-slate-800">
                        <UserRound size={14} className="shrink-0 text-slate-400" />
                        {e.motorista || "Não atribuído"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Valor</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {moeda(e.valor)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 border-t border-slate-100 pt-3 min-[380px]:flex-row min-[380px]:items-center min-[380px]:justify-between">
                    <p className="flex items-center gap-1.5 text-xs text-slate-500">
                      <CalendarDays size={14} />
                      {dataHora(e.criado_em)}
                    </p>
                    <Link
                      href={`/gerente/entregas/${e.id}`}
                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                    >
                      Ver detalhes
                      <ArrowRight size={16} />
                    </Link>
                  </div>
                </article>
              ))}
          </div>

          {/* Rodapé */}
          <footer className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>
              Exibindo{" "}
              <strong className="text-slate-700">
                {carregando ? "—" : visiveis.length}
              </strong>{" "}
              de{" "}
              <strong className="text-slate-700">{entregas.length}</strong>{" "}
              entregas
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span
                className={`h-2 w-2 rounded-full ${
                  erro ? "bg-red-500" : carregando ? "bg-amber-400" : "bg-emerald-500"
                }`}
              />
              {erro
                ? "Falha na consulta"
                : carregando
                  ? "Carregando dados..."
                  : "Dados carregados"}
            </span>
          </footer>
        </section>

        <p className="pb-2 text-center text-xs text-slate-400">
          Maylon · Gestão operacional de entregas
        </p>
      </div>
    </main>
  );
}