"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileText,
  FolderArchive,
  Loader2,
  Pen,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Modelo = {
  id: string | number;
  nome: string;
  descricao: string;
  categoria: string;
  cor: string;
  conteudo: string | null;
  arquivo_url: string | null;
};

type Documento = {
  id: string | number;
  codigo: string;
  nome: string;
  categoria: string;
  responsavel: string;
  status: string;
  data: string;
};

type Resumo = {
  total: number;
  pendentes: number;
  aprovados: number;
  arquivados: number;
};

const LIMITE = 10;

const CORES_MODELO: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600",
  purple: "bg-purple-100 text-purple-600",
  amber: "bg-amber-100 text-amber-600",
  emerald: "bg-emerald-100 text-emerald-600",
  cyan: "bg-cyan-100 text-cyan-600",
  rose: "bg-rose-100 text-rose-600",
};

const getStatusStyle = (status: string) => {
  switch (status?.toLowerCase()) {
    case "aprovado":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "pendente":
      return "bg-amber-100 text-amber-700 border-amber-200";
    case "arquivado":
      return "bg-purple-100 text-purple-700 border-purple-200";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

function formatarDataHora(data: string | null) {
  if (!data) return "—";

  const d = new Date(data);

  if (Number.isNaN(d.getTime())) return data;

  return d
    .toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
    .replace(",", " às");
}

function TabelaDocumentos({
  documentos,
  loading,
  iconeClasse,
  vazio,
}: {
  documentos: Documento[];
  loading: boolean;
  iconeClasse: string;
  vazio: string;
}) {
  const cabecalho =
    "px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500";

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[950px]">
        <thead className="bg-slate-50">
          <tr className="border-b border-slate-200">
            <th className={cabecalho}>Documento</th>
            <th className={cabecalho}>Categoria</th>
            <th className={cabecalho}>Responsável</th>
            <th className={cabecalho}>Data</th>
            <th className={`${cabecalho} text-center`}>Status</th>
            <th className={`${cabecalho} text-right`}>Ações</th>
          </tr>
        </thead>

        <tbody>
          {loading ? (
            <tr>
              <td
                colSpan={6}
                className="px-6 py-12 text-center text-slate-500"
              >
                <span className="inline-flex items-center gap-3">
                  <Loader2 size={20} className="animate-spin" />
                  Carregando documentos...
                </span>
              </td>
            </tr>
          ) : documentos.length === 0 ? (
            <tr>
              <td
                colSpan={6}
                className="px-6 py-12 text-center text-sm text-slate-500"
              >
                {vazio}
              </td>
            </tr>
          ) : (
            documentos.map((documento) => (
              <tr
                key={documento.id}
                className="border-b border-slate-100 transition hover:bg-slate-50"
              >
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${iconeClasse}`}
                    >
                      <FileText size={19} />
                    </div>

                    <div>
                      <p className="font-semibold text-[#243746]">
                        {documento.nome}
                      </p>
                      <p className="text-xs text-slate-400">
                        {documento.codigo || `DOC-${documento.id}`}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-sm text-slate-600">
                  {documento.categoria || "—"}
                </td>

                <td className="px-6 py-4 text-sm text-slate-600">
                  {documento.responsavel || "—"}
                </td>

                <td className="px-6 py-4 text-sm text-slate-600">
                  {documento.data || "—"}
                </td>

                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(
                      documento.status
                    )}`}
                  >
                    {documento.status || "Sem status"}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <a
                      href={`/api/juridico/documentos/${documento.id}/visualizar`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Visualizar documento"
                      aria-label={`Visualizar ${documento.nome}`}
                      className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Eye size={18} />
                    </a>

                    <a
                      href={`/api/juridico/documentos/${documento.id}/download`}
                      title="Baixar documento"
                      aria-label={`Baixar ${documento.nome}`}
                      className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      <Download size={18} />
                    </a>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default function JuridicoPage() {
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [loadingModelos, setLoadingModelos] = useState(true);
  const [erroModelos, setErroModelos] = useState("");
  const [modeloAberto, setModeloAberto] = useState<Modelo | null>(null);

  const [resumo, setResumo] = useState<Resumo>({
    total: 0,
    pendentes: 0,
    aprovados: 0,
    arquivados: 0,
  });

  const [atualizadoEm, setAtualizadoEm] = useState<string | null>(null);
  const [carregadoEm, setCarregadoEm] = useState<string | null>(null);

  const [pendentes, setPendentes] = useState<Documento[]>([]);
  const [todos, setTodos] = useState<Documento[]>([]);

  const [totalFiltrado, setTotalFiltrado] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [pagina, setPagina] = useState(1);

  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");

  const [loadingDocs, setLoadingDocs] = useState(true);
  const [erroDocs, setErroDocs] = useState("");

  const carregarModelos = useCallback(async () => {
    try {
      setLoadingModelos(true);
      setErroModelos("");

      const res = await fetch("/api/juridico/modelos", {
        cache: "no-store",
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Não foi possível carregar os modelos.");
      }

      const data = await res.json();

      setModelos(Array.isArray(data.modelos) ? data.modelos : []);
    } catch (error) {
      setErroModelos(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os modelos."
      );
    } finally {
      setLoadingModelos(false);
    }
  }, []);

  const carregarDocumentos = useCallback(async () => {
    try {
      setLoadingDocs(true);
      setErroDocs("");

      const paramsTodos = new URLSearchParams({
        pagina: String(pagina),
        limite: String(LIMITE),
      });

      if (buscaAplicada) {
        paramsTodos.set("busca", buscaAplicada);
      }

      const paramsPendentes = new URLSearchParams({
        status: "Pendente",
        limite: "5",
      });

      const [resTodos, resPendentes] = await Promise.all([
        fetch(`/api/juridico/documentos?${paramsTodos.toString()}`, {
          cache: "no-store",
          credentials: "include",
        }),
        fetch(`/api/juridico/documentos?${paramsPendentes.toString()}`, {
          cache: "no-store",
          credentials: "include",
        }),
      ]);

      if (!resTodos.ok || !resPendentes.ok) {
        throw new Error("Não foi possível carregar os documentos.");
      }

      const [dataTodos, dataPendentes] = await Promise.all([
        resTodos.json(),
        resPendentes.json(),
      ]);

      setTodos(
        Array.isArray(dataTodos.documentos) ? dataTodos.documentos : []
      );

      setPendentes(
        Array.isArray(dataPendentes.documentos)
          ? dataPendentes.documentos
          : []
      );

      setTotalFiltrado(Number(dataTodos.total ?? 0));
      setTotalPaginas(Math.max(1, Number(dataTodos.totalPaginas ?? 1)));

      setResumo({
        total: Number(dataTodos.resumo?.total ?? 0),
        pendentes: Number(dataTodos.resumo?.pendentes ?? 0),
        aprovados: Number(dataTodos.resumo?.aprovados ?? 0),
        arquivados: Number(dataTodos.resumo?.arquivados ?? 0),
      });

      setAtualizadoEm(dataTodos.atualizadoEm ?? null);
      setCarregadoEm(new Date().toISOString());
    } catch (error) {
      setErroDocs(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os documentos."
      );
    } finally {
      setLoadingDocs(false);
    }
  }, [pagina, buscaAplicada]);

  useEffect(() => {
    void carregarModelos();
  }, [carregarModelos]);

  useEffect(() => {
    void carregarDocumentos();
  }, [carregarDocumentos]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const novaBusca = busca.trim();

      if (novaBusca !== buscaAplicada) {
        setPagina(1);
        setBuscaAplicada(novaBusca);
      }
    }, 400);

    return () => window.clearTimeout(timer);
  }, [busca, buscaAplicada]);

  const atualizarTudo = () => {
    void carregarModelos();
    void carregarDocumentos();
  };

  const visualizarModelo = (modelo: Modelo) => {
    setModeloAberto(modelo);
  };

  const editarModelo = (modelo: Modelo) => {
    if (!modelo.arquivo_url?.trim()) {
      alert("Este modelo ainda não possui um PDF cadastrado.");
      return;
    }

    const url = modelo.arquivo_url.trim();

    try {
      const destino = new URL(url, window.location.origin);

      if (!["http:", "https:"].includes(destino.protocol)) {
        alert("O endereço do PDF é inválido.");
        return;
      }

      window.open(destino.href, "_blank", "noopener,noreferrer");
    } catch {
      alert("Não foi possível abrir o PDF. Verifique o link cadastrado.");
    }
  };

  const cards = [
    {
      title: "Total de Documentos",
      value: resumo.total,
      description: "Todos os documentos cadastrados.",
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      title: "Documentos Pendentes",
      value: resumo.pendentes,
      description: "Aguardando análise ou atualização.",
      icon: Clock3,
      color: "bg-amber-500",
    },
    {
      title: "Documentos Aprovados",
      value: resumo.aprovados,
      description: "Documentos aprovados.",
      icon: CheckCircle2,
      color: "bg-emerald-500",
    },
    {
      title: "Arquivados",
      value: resumo.arquivados,
      description: "Documentos armazenados.",
      icon: FolderArchive,
      color: "bg-purple-500",
    },
  ];

  return (
    <main className="min-h-screen">
      <section className="px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-8xl flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">Área Jurídica</h1>
            <p className="mt-1 text-sm text-white/90">
              Gerencie e acompanhe todos os documentos da empresa.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={atualizarTudo}
              disabled={loadingModelos || loadingDocs}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  loadingModelos || loadingDocs ? "animate-spin" : ""
                }
              />
              Atualizar
            </button>

            <Link
              href="/diretor/juridico/enviar_documento"
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#087d7a] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] hover:bg-[#066966]"
            >
              <FileText size={17} />
              Enviar Documento
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-8xl space-y-6 px-0 py-3 sm:px-6">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#168d8b] text-white shadow-lg">
                <FileText size={27} />
              </div>

              <div>
                <h2 className="text-xl font-bold text-[#243746]">
                  Central de Documentos
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Organize, acompanhe e gerencie os documentos jurídicos.
                </p>
              </div>
            </div>

            <div className="text-left md:text-right">
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Última atualização
              </p>
              <p className="mt-1 text-sm font-bold text-[#243746]">
                {formatarDataHora(atualizadoEm ?? carregadoEm)}
              </p>
            </div>
          </div>
        </section>

        {erroDocs && (
          <div className="flex flex-col justify-between gap-3 rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700 sm:flex-row sm:items-center">
            <span>{erroDocs}</span>
            <button
              type="button"
              onClick={() => void carregarDocumentos()}
              className="w-fit cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 font-bold transition hover:bg-red-100"
            >
              Tentar novamente
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.title}
                className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color} text-white shadow-md`}
                  >
                    <Icon size={23} />
                  </div>
                  <p className="text-3xl font-bold text-[#243746]">
                    {card.value}
                  </p>
                </div>

                <div className="mt-6">
                  <h3 className="font-bold text-[#243746]">{card.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {card.description}
                  </p>
                </div>

                <div className="absolute bottom-0 left-0 h-1 w-0 bg-[#35a989] transition-all duration-300 group-hover:w-full" />
              </div>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#168d8b]/10 text-[#168d8b]">
                <FileText size={22} />
              </div>
              <div>
                <h2 className="font-bold text-[#243746]">
                  Modelos de Documentos
                </h2>
                <p className="text-sm text-slate-500">
                  Utilize modelos prontos para agilizar seus documentos
                  jurídicos.
                </p>
              </div>
            </div>

            <span className="w-fit rounded-xl bg-[#168d8b]/10 px-4 py-2 text-xs font-bold text-[#168d8b]">
              {modelos.length} modelos disponíveis
            </span>
          </div>

          {loadingModelos ? (
            <div className="flex items-center justify-center gap-3 p-12 text-slate-500">
              <Loader2 size={20} className="animate-spin" />
              Carregando modelos...
            </div>
          ) : erroModelos ? (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <p className="text-sm text-red-600">{erroModelos}</p>
              <button
                type="button"
                onClick={() => void carregarModelos()}
                className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Tentar novamente
              </button>
            </div>
          ) : modelos.length === 0 ? (
            <div className="p-12 text-center text-sm text-slate-500">
              Nenhum modelo cadastrado.
            </div>
          ) : (
            <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
              {modelos.map((modelo) => {
                const corModelo =
                  CORES_MODELO[modelo.cor] ??
                  modelo.cor ??
                  CORES_MODELO.blue;

                return (
                  <div
                    key={modelo.id}
                    className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#168d8b]/30 hover:shadow-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${corModelo}`}
                      >
                        <FileText size={23} />
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                        {modelo.categoria}
                      </span>
                    </div>

                    <h3 className="mt-5 font-bold text-[#243746]">
                      {modelo.nome}
                    </h3>
                    <p className="mt-1 min-h-[42px] text-sm leading-6 text-slate-500">
                      {modelo.descricao}
                    </p>

                    <div className="mt-5 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => visualizarModelo(modelo)}
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                      >
                        <Eye size={16} />
                        Visualizar
                      </button>

                      <button
                        type="button"
                        onClick={() => editarModelo(modelo)}
                        disabled={!modelo.arquivo_url?.trim()}
                        title={
                          modelo.arquivo_url
                            ? "Abrir PDF em nova aba"
                            : "Este modelo não possui PDF cadastrado"
                        }
                        className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#168d8b] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[#087d7a] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Pen size={16} />
                        Editar Documento
                      </button>
                    </div>

                    <Link
                      href={`/diretor/juridico/enviar_documento?modelo=${encodeURIComponent(
                        String(modelo.id)
                      )}`}
                      className="mt-2 flex w-full cursor-pointer items-center justify-center rounded-xl bg-[#243746] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[#172b3a]"
                    >
                      Usar este modelo
                    </Link>

                    {!modelo.arquivo_url && !modelo.conteudo && (
                      <p className="mt-2 text-center text-[11px] font-medium text-amber-600">
                        Este modelo ainda não possui arquivo ou conteúdo
                        cadastrado.
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <AlertCircle size={22} />
              </div>
              <div>
                <h2 className="font-bold text-[#243746]">
                  Documentos Pendentes
                </h2>
                <p className="text-sm text-slate-500">
                  Documentos que precisam de atenção.
                </p>
              </div>
            </div>

            <span className="w-fit rounded-2xl bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700">
              {resumo.pendentes} pendentes
            </span>
          </div>

          <TabelaDocumentos
            documentos={pendentes}
            loading={loadingDocs}
            iconeClasse="bg-red-50 text-red-500"
            vazio="Nenhum documento pendente."
          />
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#168d8b]/10 text-[#168d8b]">
                <FolderArchive size={22} />
              </div>
              <div>
                <h2 className="font-bold text-[#243746]">
                  Total de Documentos
                </h2>
                <p className="text-sm text-slate-500">
                  Todos os documentos cadastrados no sistema.
                </p>
              </div>
            </div>

            <div className="relative w-full lg:w-[320px]">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar documento..."
                aria-label="Buscar documento"
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#168d8b] focus:ring-4 focus:ring-[#168d8b]/10"
              />
            </div>
          </div>

          <TabelaDocumentos
            documentos={todos}
            loading={loadingDocs}
            iconeClasse="bg-[#168d8b]/10 text-[#168d8b]"
            vazio={
              buscaAplicada
                ? "Nenhum documento encontrado para essa busca."
                : "Nenhum documento cadastrado."
            }
          />

          <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Mostrando{" "}
              <strong className="text-[#243746]">{todos.length}</strong> de{" "}
              <strong className="text-[#243746]">{totalFiltrado}</strong>{" "}
              documentos.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagina <= 1 || loadingDocs}
                onClick={() => setPagina((p) => Math.max(1, p - 1))}
                className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>

              <span className="rounded-lg bg-[#168d8b] px-3 py-2 font-bold text-white">
                {pagina} / {totalPaginas}
              </span>

              <button
                type="button"
                disabled={pagina >= totalPaginas || loadingDocs}
                onClick={() =>
                  setPagina((p) => Math.min(totalPaginas, p + 1))
                }
                className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
          </div>
        </section>
      </div>

      {modeloAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setModeloAberto(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={modeloAberto.nome}
            className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <h3 className="font-bold text-[#243746]">
                  {modeloAberto.nome}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {modeloAberto.descricao}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setModeloAberto(null)}
                aria-label="Fechar visualização"
                className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden bg-slate-100">
              {modeloAberto.arquivo_url ? (
                <iframe
                  src={modeloAberto.arquivo_url}
                  title={modeloAberto.nome}
                  className="h-[70vh] w-full border-0"
                />
              ) : modeloAberto.conteudo ? (
                <div className="h-[70vh] overflow-y-auto bg-white p-6">
                  <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-slate-700">
                    {modeloAberto.conteudo}
                  </pre>
                </div>
              ) : (
                <div className="flex h-[300px] items-center justify-center bg-white p-6 text-center">
                  <div>
                    <FileText
                      size={42}
                      className="mx-auto text-slate-300"
                    />
                    <p className="mt-4 text-sm font-medium text-slate-500">
                      Este modelo ainda não possui um arquivo ou conteúdo
                      cadastrado.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 bg-white p-5 sm:flex-row">
              {modeloAberto.arquivo_url && (
                <>
                  <button
                    type="button"
                    onClick={() => editarModelo(modeloAberto)}
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#168d8b] px-3 py-3 text-sm font-bold text-white transition hover:bg-[#087d7a]"
                  >
                    <Pen size={16} />
                    Abrir PDF
                  </button>

                  <a
                    href={modeloAberto.arquivo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    <Eye size={16} />
                    Abrir em nova aba
                  </a>
                </>
              )}

              <Link
                href={`/diretor/juridico/enviar_documento?modelo=${encodeURIComponent(
                  String(modeloAberto.id)
                )}`}
                onClick={() => setModeloAberto(null)}
                className="flex flex-1 items-center justify-center rounded-xl bg-[#243746] px-3 py-3 text-sm font-bold text-white transition hover:bg-[#172b3a]"
              >
                Usar este modelo
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}