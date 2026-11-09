"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertCircle,
  CalendarDays,
  CarFront,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Eye,
  Filter,
  MapPin,
  RefreshCw,
  Route,
  Search,
  UserRound,
} from "lucide-react";
type Corrida = {
  id: number | string;
  status?: string | null;
  origem?: string | null;
  destino?: string | null;
  passageiro?: string | null;
  motorista?: string | null;
  valor?: number | string | null;
  data?: string | null;
};
type RespostaAPI = {
  corridas?: Corrida[];
  error?: string;
  mensagem?: string;
};
type GrupoStatus = "pendente" | "confirmada" | "em_andamento" | "concluida" | "cancelada";
type FiltroStatus = "todos" | GrupoStatus;
const POR_PAGINA = 25;
const GRUPOS: Record<GrupoStatus, { nome: string; classe: string; aliases: string[] }> = {
  pendente: {
    nome: "Pendente",
    classe: "bg-amber-50 text-amber-700",
    aliases: ["pending", "pendente"],
  },
  confirmada: {
    nome: "Confirmada",
    classe: "bg-teal-50 text-teal-700",
    aliases: ["confirmed", "confirmada", "accepted", "aceito"],
  },
  em_andamento: {
    nome: "Em andamento",
    classe: "bg-blue-50 text-blue-700",
    aliases: ["em_andamento", "in_progress", "started", "ongoing"],
  },
  concluida: {
    nome: "Concluída",
    classe: "bg-emerald-50 text-emerald-700",
    aliases: ["completed", "complete", "concluida", "finished"],
  },
  cancelada: {
    nome: "Cancelada",
    classe: "bg-red-50 text-red-700",
    aliases: ["cancelada", "canceled", "cancelled", "rejected"],
  },
};
const FILTROS: { valor: FiltroStatus; label: string }[] = [
  { valor: "todos", label: "Todos os status" },
  { valor: "pendente", label: "Pendentes" },
  { valor: "confirmada", label: "Confirmadas" },
  { valor: "em_andamento", label: "Em andamento" },
  { valor: "concluida", label: "Concluídas" },
  { valor: "cancelada", label: "Canceladas" },
];
function normalizarStatus(status?: string | null) {
  return (status ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[\s-]+/g, "_");
}
function grupoDoStatus(status?: string | null): GrupoStatus | null {
  const s = normalizarStatus(status);
  const grupo = (Object.keys(GRUPOS) as GrupoStatus[]).find((g) =>
    GRUPOS[g].aliases.includes(s)
  );
  return grupo ?? null;
}
function formatarStatus(status?: string | null) {
  const grupo = grupoDoStatus(status);
  if (grupo) return GRUPOS[grupo].nome;
  const s = normalizarStatus(status);
  if (!s) return "Não informado";
  return s.replace(/_/g, " ").replace(/^./, (letra) => letra.toUpperCase());
}
function classeStatus(status?: string | null) {
  const grupo = grupoDoStatus(status);
  return grupo ? GRUPOS[grupo].classe : "bg-slate-100 text-slate-700";
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
export default function CorridasPage() {
  const [corridas, setCorridas] = useState<Corrida[]>([]);
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<FiltroStatus>("todos");
  const [pagina, setPagina] = useState(1);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");
  const carregar = useCallback(async (manual = false) => {
    if (manual) setAtualizando(true);
    else setCarregando(true);
    setErro("");
    try {
      const response = await fetch("/api/corridas/atendentes", {
        method: "GET",
        cache: "no-store",
        credentials: "include",
      });
      const dados: RespostaAPI = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          dados.error || dados.mensagem || "Não foi possível carregar as corridas."
        );
      }
      if (!Array.isArray(dados.corridas)) {
        throw new Error("A API não retornou uma lista válida. Verifique /api/corridas.");
      }
      setCorridas(dados.corridas);
      setPagina(1);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Ocorreu um erro ao carregar as corridas.");
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
      todos: corridas.length,
      pendente: 0,
      confirmada: 0,
      em_andamento: 0,
      concluida: 0,
      cancelada: 0,
    };
    for (const corrida of corridas) {
      const grupo = grupoDoStatus(corrida.status);
      if (grupo) resultado[grupo]++;
    }
    return resultado;
  }, [corridas]);
  const valorTotal = useMemo(
    () => corridas.reduce((total, corrida) => total + (paraNumero(corrida.valor) ?? 0), 0),
    [corridas]
  );
  const filtradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return corridas.filter((corrida) => {
      if (status !== "todos" && grupoDoStatus(corrida.status) !== status) return false;
      if (!termo) return true;
      const campos = [
        String(corrida.id),
        corrida.origem,
        corrida.destino,
        corrida.passageiro,
        corrida.motorista,
        corrida.status,
        formatarStatus(corrida.status),
        formatarMoeda(corrida.valor),
        formatarData(corrida.data),
      ];
      return campos.some((campo) =>
        String(campo ?? "").toLocaleLowerCase("pt-BR").includes(termo)
      );
    });
  }, [corridas, busca, status]);
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const visiveis = filtradas.slice(inicio, inicio + POR_PAGINA);
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
            Corridas
          </h1>
          <p className="mt-0 text-sm text-white/90">
            Consulte as corridas da plataforma, seus trajetos e respectivos status.
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
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          titulo="Total de corridas"
          valor={corridas.length}
          legenda="Registros retornados pela API"
          icone={<Route className="h-5 w-5" />}
          cor="bg-teal-50 text-teal-700"
        />
        <StatCard
          titulo="Em andamento"
          valor={contagens.em_andamento}
          legenda="Corridas em execução"
          icone={<CarFront className="h-5 w-5" />}
          cor="bg-blue-50 text-blue-700"
        />
        <StatCard
          titulo="Concluídas"
          valor={contagens.concluida}
          legenda="Viagens finalizadas"
          icone={<CheckCircle2 className="h-5 w-5" />}
          cor="bg-emerald-50 text-emerald-700"
        />
        <StatCard
          titulo="Valor das corridas"
          valor={formatarMoeda(valorTotal)}
          legenda="Soma dos valores retornados pela API"
          icone={<CircleDollarSign className="h-5 w-5" />}
          cor="bg-amber-50 text-amber-700"
          pequeno
        />
      </section>
      <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-teal-950/10">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
              <Route className="h-6 w-6" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900">Todas as corridas</h2>
              <p className="mt-1 text-xs text-slate-500">
                Pesquise e filtre os registros da plataforma.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 lg:flex-row">
          <label className="relative block w-full flex-1">
            <span className="sr-only">Pesquisar corridas</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
              placeholder="Buscar por ID, origem, destino, passageiro ou motorista..."
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
        ) : filtradas.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-14 text-center sm:py-20">
            <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-teal-700">
              <Route className="h-9 w-9" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {corridas.length === 0
                ? "Nenhuma corrida encontrada"
                : "Nenhum resultado para sua busca"}
            </h3>
            <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
              {corridas.length === 0
                ? "A API não retornou corridas. Verifique os dados e a rota /api/corridas."
                : "Altere os termos de pesquisa ou selecione outro status para encontrar corridas."}
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
              <table className="w-full min-w-[1150px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-5 py-4">Corrida</th>
                    <th scope="col" className="px-5 py-4">Trajeto</th>
                    <th scope="col" className="px-5 py-4">Passageiro</th>
                    <th scope="col" className="px-5 py-4">Motorista</th>
                    <th scope="col" className="px-5 py-4">Valor</th>
                    <th scope="col" className="px-5 py-4">Status</th>
                    <th scope="col" className="px-5 py-4">Data</th>
                    <th scope="col" className="px-5 py-4 text-right">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visiveis.map((corrida) => (
                    <tr key={corrida.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="whitespace-nowrap px-5 py-4">
                        <div className="flex items-center gap-2 font-semibold text-slate-900">
                          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                            <CarFront className="h-4 w-4" />
                          </span>
                          #{corrida.id}
                        </div>
                      </td>
                      <td className="max-w-[280px] px-5 py-4">
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                            <span className="line-clamp-2 text-xs text-slate-700">
                              {texto(corrida.origem)}
                            </span>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                            <span className="line-clamp-2 text-xs text-slate-700">
                              {texto(corrida.destino)}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <UserRound className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="max-w-[150px] truncate text-slate-700">
                            {texto(corrida.passageiro)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <CarFront className="h-4 w-4 shrink-0 text-slate-400" />
                          <span className="max-w-[150px] truncate text-slate-700">
                            {texto(corrida.motorista)}
                          </span>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-900">
                        {formatarMoeda(corrida.valor)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${classeStatus(corrida.status)}`}
                        >
                          {formatarStatus(corrida.status)}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 shrink-0" />
                          {formatarData(corrida.data)}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/atendente/corridas/${corrida.id}`}
                          aria-label={`Ver detalhes da corrida #${corrida.id}`}
                          title="Ver detalhes"
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-teal-500 hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <footer className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-500">
                Mostrando <b className="text-slate-800">{inicio + 1}</b> até{" "}
                <b className="text-slate-800">
                  {Math.min(inicio + POR_PAGINA, filtradas.length)}
                </b>{" "}
                de <b className="text-slate-800">{filtradas.length}</b> corridas
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
    </main>
  );
}
function StatCard({
  titulo,
  valor,
  legenda,
  icone,
  cor,
  pequeno = false,
}: {
  titulo: string;
  valor: ReactNode;
  legenda: string;
  icone: ReactNode;
  cor: string;
  pequeno?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white p-5 shadow-lg shadow-teal-950/10">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{titulo}</p>
        <div className={`rounded-xl p-2.5 ${cor}`}>{icone}</div>
      </div>
      <p
        className={`mt-3 font-extrabold text-slate-900 ${pequeno ? "text-2xl" : "text-3xl"}`}
      >
        {valor}
      </p>
      <p className="mt-1 text-xs text-slate-500">{legenda}</p>
    </div>
  );
}