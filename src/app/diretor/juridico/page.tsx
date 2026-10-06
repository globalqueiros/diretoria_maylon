"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileText,
  FolderArchive,
<<<<<<< HEAD
  Loader2,
=======
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
  RefreshCw,
  Search,
  Trash2,
  Upload,
<<<<<<< HEAD
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Modelo = {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  cor: string;
  conteudo: string | null;
  arquivo_url: string | null;
};

type Documento = {
  id: number;
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

const CORES_MODELO: Record<string, string> = {
  blue: "bg-blue-100 text-blue-600",
  purple: "bg-purple-100 text-purple-600",
  amber: "bg-amber-100 text-amber-600",
  emerald: "bg-emerald-100 text-emerald-600",
  cyan: "bg-cyan-100 text-cyan-600",
  rose: "bg-rose-100 text-rose-600",
};

const getStatusStyle = (status: string) => {
  switch (status) {
    case "Aprovado":
      return "bg-emerald-100 text-emerald-700 border-emerald-200";

    case "Pendente":
      return "bg-amber-100 text-amber-700 border-amber-200";

    case "Arquivado":
      return "bg-purple-100 text-purple-700 border-purple-200";

    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
};

const LIMITE = 10;

function formatarDataHora(iso: string | null) {
  if (!iso) return "—";

  const d = new Date(iso);

  if (Number.isNaN(d.getTime())) {
    return iso;
  }

  const data = d.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  const hora = d.toLocaleTimeString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    minute: "2-digit",
  });

  return `${data} às ${hora}`;
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
    "px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500";

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[950px]">
        <thead className="bg-slate-50">
          <tr className="border-b border-slate-200">
            <th className={`${cabecalho} text-left`}>Documento</th>
            <th className={`${cabecalho} text-left`}>Categoria</th>
            <th className={`${cabecalho} text-left`}>Responsável</th>
            <th className={`${cabecalho} text-left`}>Data</th>
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
                      className={`flex h-10 w-10 items-center justify-center rounded-lg ${iconeClasse}`}
                    >
                      <FileText size={19} />
                    </div>

                    <div>
                      <p className="font-semibold text-[#243746]">
                        {documento.nome}
                      </p>

                      <p className="text-xs text-slate-400">
                        {documento.codigo}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-6 py-4 text-sm text-slate-600">
                  {documento.categoria}
                </td>

                <td className="px-6 py-4 text-sm text-slate-600">
                  {documento.responsavel}
                </td>

                <td className="px-6 py-4 text-sm text-slate-600">
                  {documento.data}
                </td>

                <td className="px-6 py-4 text-center">
                  <span
                    className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(
                      documento.status
                    )}`}
                  >
                    {documento.status}
                  </span>
                </td>

                <td className="px-6 py-4">
                  <div className="flex justify-end gap-2">
                    <a
                      href={`/api/juridico/documentos/${documento.id}/visualizar`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Visualizar"
                      className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Eye size={18} />
                    </a>

                    <a
                      href={`/api/juridico/documentos/${documento.id}/download`}
                      title="Baixar"
                      className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      <Download size={18} />
                    </a>

                    <button
                      type="button"
                      title="Excluir"
                      className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={18} />
                    </button>
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
      });

      if (!res.ok) {
        throw new Error("Erro ao carregar modelos.");
      }

      const data = await res.json();

      setModelos(data.modelos ?? []);
    } catch {
      setErroModelos("Não foi possível carregar os modelos.");
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
        fetch(`/api/juridico/documentos?${paramsTodos}`, {
          cache: "no-store",
        }),

        fetch(`/api/juridico/documentos?${paramsPendentes}`, {
          cache: "no-store",
        }),
      ]);

      if (!resTodos.ok || !resPendentes.ok) {
        throw new Error("Erro ao carregar documentos.");
      }

      const dataTodos = await resTodos.json();
      const dataPendentes = await resPendentes.json();

      setTodos(dataTodos.documentos ?? []);

      setTotalFiltrado(dataTodos.total ?? 0);

      setTotalPaginas(dataTodos.totalPaginas ?? 1);

      setResumo({
        total: dataTodos.resumo?.total ?? 0,
        pendentes: dataTodos.resumo?.pendentes ?? 0,
        aprovados: dataTodos.resumo?.aprovados ?? 0,
        arquivados: dataTodos.resumo?.arquivados ?? 0,
      });

      setAtualizadoEm(dataTodos.atualizadoEm ?? null);

      setCarregadoEm(new Date().toISOString());

      setPendentes(dataPendentes.documentos ?? []);
    } catch {
      setErroDocs("Não foi possível carregar os documentos.");
    } finally {
      setLoadingDocs(false);
    }
  }, [pagina, buscaAplicada]);

  useEffect(() => {
    carregarModelos();
  }, [carregarModelos]);

  useEffect(() => {
    carregarDocumentos();
  }, [carregarDocumentos]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPagina(1);
      setBuscaAplicada(busca.trim());
    }, 400);

    return () => clearTimeout(timer);
  }, [busca]);

  const atualizarTudo = () => {
    carregarModelos();
    carregarDocumentos();
  };

  const abrirModelo = (modelo: Modelo) => {
    setModeloAberto(modelo);
  };

  const baixarModelo = (modelo: Modelo) => {
    if (!modelo.arquivo_url) {
      alert("Este modelo ainda não possui um arquivo cadastrado.");
      return;
    }

    window.open(modelo.arquivo_url, "_blank", "noopener,noreferrer");
  };

  const visualizarModelo = (modelo: Modelo) => {
    if (!modelo.arquivo_url) {
      setModeloAberto(modelo);
      return;
    }

    setModeloAberto(modelo);
  };

  const cards = [
    {
      title: "Total de Documentos",
      value: resumo.total,
=======
} from "lucide-react";
import Link from "next/link";

export default function JuridicoPage() {
  const documentos = [
    {
      title: "Total de Documentos",
      value: "248",
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
      description: "Todos os documentos cadastrados.",
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      title: "Documentos Pendentes",
<<<<<<< HEAD
      value: resumo.pendentes,
=======
      value: "12",
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
      description: "Aguardando análise ou atualização.",
      icon: Clock3,
      color: "bg-amber-500",
    },
    {
      title: "Documentos Aprovados",
<<<<<<< HEAD
      value: resumo.aprovados,
=======
      value: "210",
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
      description: "Documentos aprovados.",
      icon: CheckCircle2,
      color: "bg-emerald-500",
    },
    {
      title: "Arquivados",
<<<<<<< HEAD
      value: resumo.arquivados,
=======
      value: "26",
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
      description: "Documentos armazenados.",
      icon: FolderArchive,
      color: "bg-purple-500",
    },
  ];

<<<<<<< HEAD
=======
  const modelos = [
    {
      id: "MOD-001",
      nome: "Contrato de Prestação de Serviços",
      descricao: "Modelo para contratação de serviços entre empresas ou profissionais.",
      categoria: "Contrato",
      cor: "bg-blue-100 text-blue-600",
    },
    {
      id: "MOD-002",
      nome: "Procuração",
      descricao: "Modelo de procuração para representação jurídica ou administrativa.",
      categoria: "Jurídico",
      cor: "bg-purple-100 text-purple-600",
    },
    {
      id: "MOD-003",
      nome: "Termo de Responsabilidade",
      descricao: "Modelo para formalizar responsabilidades e compromissos.",
      categoria: "Empresa",
      cor: "bg-amber-100 text-amber-600",
    },
    {
      id: "MOD-004",
      nome: "Contrato de Confidencialidade",
      descricao: "Modelo para proteção de informações confidenciais.",
      categoria: "Compliance",
      cor: "bg-emerald-100 text-emerald-600",
    },
    {
      id: "MOD-005",
      nome: "Política de Privacidade",
      descricao: "Modelo de política para tratamento e proteção de dados.",
      categoria: "Compliance",
      cor: "bg-cyan-100 text-cyan-600",
    },
    {
      id: "MOD-006",
      nome: "Contrato Social",
      descricao: "Modelo para constituição e organização societária da empresa.",
      categoria: "Empresa",
      cor: "bg-rose-100 text-rose-600",
    },
  ];

  const pendentes = [
    {
      id: "DOC-001",
      nome: "Contrato Social da Empresa",
      categoria: "Empresa",
      responsavel: "Maria Silva",
      data: "01/09/2026",
      status: "Pendente",
    },
    {
      id: "DOC-002",
      nome: "Procuração Jurídica",
      categoria: "Jurídico",
      responsavel: "João Santos",
      data: "30/08/2026",
      status: "Pendente",
    },
    {
      id: "DOC-003",
      nome: "Termo de Responsabilidade",
      categoria: "Contrato",
      responsavel: "Carlos Lima",
      data: "28/08/2026",
      status: "Pendente",
    },
  ];

  const todosDocumentos = [
    {
      id: "DOC-001",
      nome: "Contrato Social da Empresa",
      categoria: "Empresa",
      responsavel: "Maria Silva",
      data: "01/09/2026",
      status: "Pendente",
    },
    {
      id: "DOC-002",
      nome: "Contrato de Prestação de Serviços",
      categoria: "Contrato",
      responsavel: "João Santos",
      data: "30/08/2026",
      status: "Aprovado",
    },
    {
      id: "DOC-003",
      nome: "Procuração Jurídica",
      categoria: "Jurídico",
      responsavel: "Carlos Lima",
      data: "28/08/2026",
      status: "Pendente",
    },
    {
      id: "DOC-004",
      nome: "Regulamento Interno",
      categoria: "Empresa",
      responsavel: "Ana Costa",
      data: "25/08/2026",
      status: "Aprovado",
    },
    {
      id: "DOC-005",
      nome: "Política de Privacidade",
      categoria: "Compliance",
      responsavel: "Pedro Alves",
      data: "20/08/2026",
      status: "Arquivado",
    },
  ];

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Aprovado":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "Pendente":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Arquivado":
        return "bg-purple-100 text-purple-700 border-purple-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
  return (
    <main className="min-h-screen">
      <section className="px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-8xl flex-col justify-between gap-5 lg:flex-row lg:items-center">
          <div>
<<<<<<< HEAD
            <h1 className="text-2xl font-bold text-white">
              Área Jurídica
            </h1>

=======
            <h1 className="text-2xl font-bold text-white">Área Jurídica</h1>
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
            <p className="mt-1 text-sm text-white/90">
              Gerencie e acompanhe todos os documentos da empresa.
            </p>
          </div>
<<<<<<< HEAD

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={atualizarTudo}
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
            >
              <RefreshCw
                size={17}
                className={
                  loadingModelos || loadingDocs
                    ? "animate-spin"
                    : ""
                }
              />

              Atualizar
            </button>

=======
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
            >
              <RefreshCw size={17} />
              Atualizar
            </button>
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
            <Link
              href="/diretor/juridico/enviar_documento"
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#087d7a] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] hover:bg-[#066966]"
            >
              <Upload size={17} />
<<<<<<< HEAD

=======
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
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
<<<<<<< HEAD

=======
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
              <div>
                <h2 className="text-xl font-bold text-[#243746]">
                  Central de Documentos
                </h2>
<<<<<<< HEAD

=======
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
                <p className="mt-1 text-sm text-slate-500">
                  Organize, acompanhe e gerencie os documentos jurídicos.
                </p>
              </div>
            </div>
<<<<<<< HEAD

=======
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
            <div className="text-left md:text-right">
              <p className="text-xs uppercase tracking-wider text-slate-400">
                Última atualização
              </p>
<<<<<<< HEAD

              <p className="mt-1 text-sm font-bold text-[#243746]">
                {formatarDataHora(atualizadoEm ?? carregadoEm)}
=======
              <p className="mt-1 text-sm font-bold text-[#243746]">
                01/09/2026 às 00:36
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
              </p>
            </div>
          </div>
        </section>

<<<<<<< HEAD
        {erroDocs && (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-red-50 px-5 py-4 text-sm text-red-700">
            <span>{erroDocs}</span>

            <button
              type="button"
              onClick={carregarDocumentos}
              className="cursor-pointer rounded-lg border border-red-200 px-3 py-1.5 font-bold hover:bg-red-100"
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
=======
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {documentos.map((documento) => {
            const Icon = documento.icon;
            return (
              <div
                key={documento.title}
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
                className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div
<<<<<<< HEAD
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${card.color} text-white shadow-md`}
                  >
                    <Icon size={23} />
                  </div>

                  <p className="text-3xl font-bold text-[#243746]">
                    {card.value}
                  </p>
                </div>

                <div className="mt-6">
                  <h3 className="font-bold text-[#243746]">
                    {card.title}
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    {card.description}
                  </p>
                </div>

=======
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${documento.color} text-white shadow-md`}
                  >
                    <Icon size={23} />
                  </div>
                  <p className="text-3xl font-bold text-[#243746]">
                    {documento.value}
                  </p>
                </div>
                <div className="mt-6">
                  <h3 className="font-bold text-[#243746]">
                    {documento.title}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {documento.description}
                  </p>
                </div>
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
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
<<<<<<< HEAD

=======
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
              <div>
                <h2 className="font-bold text-[#243746]">
                  Modelos de Documentos
                </h2>
<<<<<<< HEAD

                <p className="text-sm text-slate-500">
                  Utilize modelos prontos para agilizar seus documentos
                  jurídicos.
                </p>
              </div>
            </div>

=======
                <p className="text-sm text-slate-500">
                  Utilize modelos prontos para agilizar seus documentos jurídicos.
                </p>
              </div>
            </div>
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
            <span className="w-fit rounded-xl bg-[#168d8b]/10 px-4 py-2 text-xs font-bold text-[#168d8b]">
              {modelos.length} modelos disponíveis
            </span>
          </div>

<<<<<<< HEAD
          {loadingModelos ? (
            <div className="flex items-center justify-center gap-3 p-12 text-slate-500">
              <Loader2 size={20} className="animate-spin" />
              Carregando modelos...
            </div>
          ) : erroModelos ? (
            <div className="flex flex-col items-center gap-3 p-12 text-center">
              <p className="text-sm text-red-600">
                {erroModelos}
              </p>

              <button
                type="button"
                onClick={carregarModelos}
                className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
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
              {modelos.map((modelo) => (
                <div
                  key={modelo.id}
                  className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#168d8b]/30 hover:shadow-lg"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-xl ${CORES_MODELO[modelo.cor] ??
                        CORES_MODELO.blue
                        }`}
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

                    <Link
                      href={`/diretor/juridico/enviar_documento?modelo=${encodeURIComponent(
                        modelo.id
                      )}`}
                      className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#168d8b] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[#087d7a]"
                    >
                      Usar este modelo
                    </Link>
                  </div> 
                  {!modelo.arquivo_url && (
                    <p className="mt-2 text-center text-[11px] font-medium text-amber-600">
                      Este modelo não possui PDF cadastrado.
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
=======
          <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {modelos.map((modelo) => (
              <div
                key={modelo.id}
                className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#168d8b]/30 hover:shadow-lg"
              >
                <div className="flex items-start justify-between gap-4">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl ${modelo.cor}`}
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
                <p className="mt-2 min-h-[42px] text-sm leading-6 text-slate-500">
                  {modelo.descricao}
                </p>
                <div className="mt-5 flex gap-2">
                  <button
                    type="button"
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    <Eye size={16} />
                    Visualizar
                  </button>
                  <button
                    type="button"
                    className="flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#168d8b] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[#087d7a]"
                  >
                    <Download size={16} />
                    Baixar
                  </button>
                </div>
                <Link
                  href="/diretor/juridico/enviar_documento"
                  className="mt-2 flex w-full items-center justify-center rounded-xl bg-[#243746] px-3 py-2.5 text-sm font-bold text-white transition hover:bg-[#172b3a]"
                >
                  Usar este modelo
                </Link>
              </div>
            ))}
          </div>
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <AlertCircle size={22} />
              </div>
<<<<<<< HEAD

=======
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
              <div>
                <h2 className="font-bold text-[#243746]">
                  Documentos Pendentes
                </h2>
<<<<<<< HEAD

=======
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
                <p className="text-sm text-slate-500">
                  Documentos que precisam de atenção.
                </p>
              </div>
            </div>
<<<<<<< HEAD

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
=======
            <span className="w-fit rounded-2xl bg-amber-100 px-4 py-2 text-sm font-bold text-amber-700">
              {pendentes.length} pendentes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Documento
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Categoria
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Responsável
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Data
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendentes.map((documento) => (
                  <tr
                    key={documento.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-500">
                          <FileText size={19} />
                        </div>
                        <div>
                          <p className="font-semibold text-[#243746]">
                            {documento.nome}
                          </p>
                          <p className="text-xs text-slate-400">
                            {documento.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {documento.categoria}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {documento.responsavel}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {documento.data}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(documento.status)}`}
                      >
                        {documento.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          type="button"
                          className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          type="button"
                          className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
        </section>

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-center">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#168d8b]/10 text-[#168d8b]">
                <FolderArchive size={22} />
              </div>
<<<<<<< HEAD

=======
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
              <div>
                <h2 className="font-bold text-[#243746]">
                  Total de Documentos
                </h2>
<<<<<<< HEAD

=======
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
                <p className="text-sm text-slate-500">
                  Todos os documentos cadastrados no sistema.
                </p>
              </div>
            </div>
<<<<<<< HEAD

=======
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
            <div className="relative w-full lg:w-[320px]">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
<<<<<<< HEAD

              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
=======
              <input
                type="text"
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
                placeholder="Buscar documento..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#168d8b] focus:ring-4 focus:ring-[#168d8b]/10"
              />
            </div>
          </div>

<<<<<<< HEAD
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
=======
          <div className="overflow-x-auto">
            <table className="w-full min-w-[950px]">
              <thead className="bg-slate-50">
                <tr className="border-b border-slate-200">
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Documento
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Categoria
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Responsável
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    Data
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody>
                {todosDocumentos.map((documento) => (
                  <tr
                    key={documento.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#168d8b]/10 text-[#168d8b]">
                          <FileText size={19} />
                        </div>
                        <div>
                          <p className="font-semibold text-[#243746]">
                            {documento.nome}
                          </p>
                          <p className="text-xs text-slate-400">
                            {documento.id}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {documento.categoria}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {documento.responsavel}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {documento.data}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusStyle(documento.status)}`}
                      >
                        {documento.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Eye size={18} />
                        </button>
                        <button
                          type="button"
                          className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-600"
                        >
                          <Download size={18} />
                        </button>
                        <button
                          type="button"
                          className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1

          <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Mostrando{" "}
              <strong className="text-[#243746]">
<<<<<<< HEAD
                {todos.length}
              </strong>{" "}
              de{" "}
              <strong className="text-[#243746]">
                {totalFiltrado}
              </strong>{" "}
              documentos.
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={pagina <= 1 || loadingDocs}
                onClick={() =>
                  setPagina((p) => Math.max(1, p - 1))
                }
                className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Anterior
              </button>

              <span className="rounded-lg bg-[#168d8b] px-3 py-2 font-bold text-white">
                {pagina} / {totalPaginas}
              </span>

              <button
                type="button"
                disabled={
                  pagina >= totalPaginas || loadingDocs
                }
                onClick={() =>
                  setPagina((p) =>
                    Math.min(totalPaginas, p + 1)
                  )
                }
                className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
=======
                {todosDocumentos.length}
              </strong>{" "}
              documentos cadastrados.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-2 transition hover:bg-slate-50"
              >
                Anterior
              </button>
              <button
                type="button"
                className="rounded-lg bg-[#168d8b] px-3 py-2 font-bold text-white"
              >
                1
              </button>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-2 transition hover:bg-slate-50"
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
              >
                Próximo
              </button>
            </div>
          </div>
        </section>
      </div>
<<<<<<< HEAD

      {modeloAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setModeloAberto(null)}
        >
          <div
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
                className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-hidden bg-slate-100">
              {modeloAberto.arquivo_url ? (
                <iframe
                  src={`${modeloAberto.arquivo_url}${modeloAberto.arquivo_url.includes("#") ? "&" : "#"}toolbar=0&navpanes=0&scrollbar=0`}
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
                      Este modelo ainda não possui um arquivo ou
                      conteúdo cadastrado.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 border-t border-slate-200 bg-white p-5 sm:flex-row">
              {modeloAberto.arquivo_url && (
                <>
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
                  modeloAberto.id
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
=======
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
    </main>
  );
}