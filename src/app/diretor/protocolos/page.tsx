"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Filter,
  Plus,
  Search,
  Eye,
} from "lucide-react";

import type {
  Prioridade,
  Protocolo,
  Solicitante,
  Status,
} from "../../lib/protocolos";
import {
  PrioridadeBadge,
  StatusBadge,
  normalizarPrioridade,
  normalizarTexto,
  obterStatusValido,
  textoSeguro,
} from "../../lib/protocolos-ui";

export default function ProtocolosPage() {
  const router = useRouter();

  const [protocolos, setProtocolos] = useState<Protocolo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState<Status | "todos">("todos");
  const [prioridade, setPrioridade] = useState<Prioridade | "todas">("todas");
  const [tipo, setTipo] = useState<Solicitante | "todos">("todos");

  const [pagina, setPagina] = useState(1);
  const [porPagina, setPorPagina] = useState(10);

  const carregar = useCallback(async () => {
    setCarregando(true);

    try {
      const res = await fetch("/api/protocolos", {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Falha ao carregar protocolos");
      }

      const dados: unknown = await res.json();

      if (!Array.isArray(dados)) {
        throw new Error("Formato de resposta inválido");
      }

      setProtocolos(dados as Protocolo[]);
      setErro(null);
    } catch {
      setErro("Não foi possível carregar os protocolos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const contagens = useMemo(() => {
    const resultado: Record<Status, number> = {
      aberto: 0,
      andamento: 0,
      aguardando: 0,
      encerrado: 0,
    };

    for (const protocolo of protocolos) {
      const statusNormalizado = obterStatusValido(protocolo.status);

      if (statusNormalizado) {
        resultado[statusNormalizado] += 1;
      }
    }

    return resultado;
  }, [protocolos]);

  const filtrados = useMemo(() => {
    const termo = normalizarTexto(busca);

    return protocolos.filter((p) => {
      const statusNormalizado = obterStatusValido(p.status);
      const prioridadeNormalizada = normalizarPrioridade(p.prioridade);

      if (status !== "todos" && statusNormalizado !== status) {
        return false;
      }

      if (prioridade !== "todas" && prioridadeNormalizada !== prioridade) {
        return false;
      }

      if (
        tipo !== "todos" &&
        normalizarTexto(p.solicitante) !== normalizarTexto(tipo)
      ) {
        return false;
      }

      if (!termo) return true;

      return [p.numero, p.assunto, p.nome, p.categoria, p.solicitante].some(
        (campo) => normalizarTexto(textoSeguro(campo)).includes(termo)
      );
    });
  }, [protocolos, busca, status, prioridade, tipo]);

  useEffect(() => {
    setPagina(1);
  }, [busca, status, prioridade, tipo, porPagina]);

  const totalPaginas = Math.max(1, Math.ceil(filtrados.length / porPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * porPagina;
  const fim = inicio + porPagina;

  const paginados = useMemo(
    () => filtrados.slice(inicio, fim),
    [filtrados, inicio, fim]
  );

  function abrirDetalhes(id: number) {
    router.push(`/atendente/protocolos/${id}`);
  }

  return (
    <main className="min-h-screen">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/90 text-emerald-600">
            <FileText className="h-6 w-6" />
          </div>

          <div>
            <p className="text-sm text-white/90">Central de Atendimento</p>

            <h1 className="text-3xl font-bold leading-tight text-white">
              Protocolos
            </h1>

            <p className="mt-0 max-w-2xl text-sm text-white/90">
              Registre, filtre e acompanhe cada solicitação de passageiros e
              motoristas.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => window.location.assign("/protocolos/novo")}
          className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <Plus className="h-4 w-4" />
          Novo protocolo
        </button>
      </header>
      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metrica
          titulo="Total de protocolos"
          valor={protocolos.length}
          icone={<FileText className="h-5 w-5" />}
          cor="bg-teal-50 text-teal-700"
        />

        <Metrica
          titulo="Abertos"
          valor={contagens.aberto}
          icone={<AlertCircle className="h-5 w-5" />}
          cor="bg-emerald-50 text-emerald-600"
        />

        <Metrica
          titulo="Em andamento"
          valor={contagens.andamento}
          icone={<Clock className="h-5 w-5" />}
          cor="bg-yellow-50 text-yellow-600"
        />

        <Metrica
          titulo="Aguardando resposta"
          valor={contagens.aguardando}
          icone={<Clock className="h-5 w-5" />}
          cor="bg-sky-50 text-sky-600"
        />

        <Metrica
          titulo="Encerrados"
          valor={contagens.encerrado}
          icone={<CheckCircle2 className="h-5 w-5" />}
          cor="bg-red-50 text-red-600"
        />
      </section>
      <section className="rounded-3xl bg-white p-4 text-slate-900 shadow-sm sm:p-5">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <label className="relative min-w-0 flex-1 basis-full sm:basis-60">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar por número, assunto ou nome..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
            />
          </label>

          <Select
            valor={status}
            onChange={(v) => setStatus(v as Status | "todos")}
            opcoes={[
              ["todos", "Todos os status"],
              ["aberto", "Abertos"],
              ["andamento", "Em andamento"],
              ["aguardando", "Aguardando resposta"],
              ["encerrado", "Encerrados"],
            ]}
          />

          <Select
            valor={prioridade}
            onChange={(v) => setPrioridade(v as Prioridade | "todas")}
            opcoes={[
              ["todas", "Todas as prioridades"],
              ["alta", "Alta"],
              ["media", "Média"],
              ["baixa", "Baixa"],
            ]}
          />

          <Select
            valor={tipo}
            onChange={(v) => setTipo(v as Solicitante | "todos")}
            opcoes={[
              ["todos", "Passageiros e motoristas"],
              ["Passageiro", "Passageiros"],
              ["Motorista", "Motoristas"],
            ]}
          />

          <button
            type="button"
            onClick={() => {
              setBusca("");
              setStatus("todos");
              setPrioridade("todas");
              setTipo("todos");
            }}
            className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Limpar filtros
          </button>
        </div>

        <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            {filtrados.length === 0
              ? "0 protocolos encontrados"
              : `Mostrando ${inicio + 1}–${Math.min(fim, filtrados.length)} de ${filtrados.length} ${
                  filtrados.length === 1 ? "protocolo" : "protocolos"
                }`}
          </span>

          <button
            type="button"
            onClick={() => void carregar()}
            disabled={carregando}
            className="font-semibold text-teal-700 hover:text-teal-900 disabled:opacity-50"
          >
            {carregando ? "Atualizando..." : "Atualizar lista"}
          </button>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-slate-100">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Protocolo</th>
                <th className="px-4 py-3 font-semibold">Assunto</th>
                <th className="px-4 py-3 font-semibold">Solicitante</th>
                <th className="px-4 py-3 font-semibold">Prioridade</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Aberto em</th>
                <th className="px-4 py-3 font-semibold">
                  <span className="sr-only">Ver detalhes</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {carregando && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Carregando protocolos...
                  </td>
                </tr>
              )}

              {!carregando && erro && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center">
                    <p className="text-red-600">{erro}</p>

                    <button
                      type="button"
                      onClick={() => void carregar()}
                      className="mt-3 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Tentar novamente
                    </button>
                  </td>
                </tr>
              )}

              {!carregando && !erro && filtrados.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    <Filter className="mx-auto mb-2 h-5 w-5 text-slate-300" />
                    Nenhum protocolo encontrado. Ajuste os filtros ou a busca.
                  </td>
                </tr>
              )}

              {!carregando &&
                !erro &&
                paginados.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => abrirDetalhes(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        abrirDetalhes(p.id);
                      }
                    }}
                    tabIndex={0}
                    className="cursor-pointer transition hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500"
                  >
                    <td className="whitespace-nowrap px-4 py-3.5 font-semibold text-teal-700">
                      {p.numero}
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="block font-medium">{p.assunto}</span>

                      <span className="text-xs text-slate-400">
                        {p.categoria}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <span className="block">{p.nome}</span>

                      <span className="text-xs text-slate-400">
                        {p.solicitante}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5">
                      <PrioridadeBadge valor={p.prioridade} />
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5">
                      <StatusBadge valor={p.status} />
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                      {p.abertoEm}
                    </td>

                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">
                      <Eye className="h-5 w-5 text-black" aria-hidden="true" />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!carregando && !erro && filtrados.length > 0 && (
          <nav
            aria-label="Paginação"
            className="mt-4 flex flex-wrap items-center justify-between gap-3"
          >
            <label className="flex items-center gap-2 text-xs text-slate-500">
              Linhas por página
              <select
                value={porPagina}
                onChange={(e) => setPorPagina(Number(e.target.value))}
                className="cursor-pointer rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
              >
                {[10, 25, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPagina(paginaAtual - 1)}
                disabled={paginaAtual === 1}
                aria-label="Página anterior"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {gerarPaginas(paginaAtual, totalPaginas).map((item, i) =>
                item === "..." ? (
                  <span
                    key={`reticencias-${i}`}
                    className="px-2 text-slate-400"
                    aria-hidden="true"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPagina(item)}
                    aria-label={`Página ${item}`}
                    aria-current={item === paginaAtual ? "page" : undefined}
                    className={`h-9 min-w-9 cursor-pointer rounded-lg px-2 text-sm font-semibold transition ${
                      item === paginaAtual
                        ? "bg-teal-800 text-white"
                        : "border border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => setPagina(paginaAtual + 1)}
                disabled={paginaAtual === totalPaginas}
                aria-label="Próxima página"
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </nav>
        )}
      </section>
    </main>
  );
}

function gerarPaginas(atual: number, total: number): (number | "...")[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const paginas: (number | "...")[] = [1];
  const inicio = Math.max(2, atual - 1);
  const fim = Math.min(total - 1, atual + 1);

  if (inicio > 2) paginas.push("...");
  for (let i = inicio; i <= fim; i++) paginas.push(i);
  if (fim < total - 1) paginas.push("...");

  paginas.push(total);
  return paginas;
}

function Metrica({
  titulo,
  valor,
  icone,
  cor,
}: {
  titulo: string;
  valor: number;
  icone: React.ReactNode;
  cor: string;
}) {
  return (
    <div className="flex min-h-[104px] items-center justify-between gap-4 rounded-2xl bg-white px-5 py-4 text-slate-900 shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-5 text-slate-600">
          {titulo}
        </p>

        <p className="mt-2 text-3xl font-bold leading-none tracking-tight text-slate-950">
          {valor}
        </p>
      </div>

      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${cor}`}
      >
        {icone}
      </div>
    </div>
  );
}

function Select({
  valor,
  onChange,
  opcoes,
}: {
  valor: string;
  onChange: (v: string) => void;
  opcoes: [string, string][];
}) {
  return (
    <select
      value={valor}
      onChange={(e) => onChange(e.target.value)}
      className="max-w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
    >
      {opcoes.map(([v, label]) => (
        <option key={v} value={v}>
          {label}
        </option>
      ))}
    </select>
  );
}