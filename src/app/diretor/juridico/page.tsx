"use client";

import {
  AlertCircle,
  CheckCircle2,
  Clock3,
  Download,
  Eye,
  FileText,
  FolderArchive,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from "lucide-react";
import Link from "next/link";

export default function JuridicoPage() {
  const documentos = [
    {
      title: "Total de Documentos",
      value: "248",
      description: "Todos os documentos cadastrados.",
      icon: FileText,
      color: "bg-blue-500",
    },
    {
      title: "Documentos Pendentes",
      value: "12",
      description: "Aguardando análise ou atualização.",
      icon: Clock3,
      color: "bg-amber-500",
    },
    {
      title: "Documentos Aprovados",
      value: "210",
      description: "Documentos aprovados.",
      icon: CheckCircle2,
      color: "bg-emerald-500",
    },
    {
      title: "Arquivados",
      value: "26",
      description: "Documentos armazenados.",
      icon: FolderArchive,
      color: "bg-purple-500",
    },
  ];

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
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-white/15 px-5 py-3 text-sm font-bold text-white backdrop-blur transition hover:bg-white/25"
            >
              <RefreshCw size={17} />
              Atualizar
            </button>
            <Link
              href="/diretor/juridico/enviar_documento"
              className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#087d7a] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:scale-[1.02] hover:bg-[#066966]"
            >
              <Upload size={17} />
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
                01/09/2026 às 00:36
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {documentos.map((documento) => {
            const Icon = documento.icon;
            return (
              <div
                key={documento.title}
                className="group relative overflow-hidden rounded-2xl bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="flex items-start justify-between">
                  <div
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
                  Utilize modelos prontos para agilizar seus documentos jurídicos.
                </p>
              </div>
            </div>
            <span className="w-fit rounded-xl bg-[#168d8b]/10 px-4 py-2 text-xs font-bold text-[#168d8b]">
              {modelos.length} modelos disponíveis
            </span>
          </div>

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
                placeholder="Buscar documento..."
                className="w-full rounded-xl border border-slate-200 py-3 pl-10 pr-4 text-sm outline-none transition focus:border-[#168d8b] focus:ring-4 focus:ring-[#168d8b]/10"
              />
            </div>
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

          <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>
              Mostrando{" "}
              <strong className="text-[#243746]">
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
              >
                Próximo
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}