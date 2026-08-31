"use client";

import { useEffect, useState } from "react";
import {
  Eye,
  Plus,
  RefreshCw,
  Ticket,
  CalendarDays,
  DollarSign,
  Hash,
  Search,
  PackageOpen,
} from "lucide-react";
import Link from "next/link";

type Rifa = {
  id: number;
  numero_rifa: string;
  titulo: string;
  descricao: string | null;
  imagem: string | null;
  valor_numero: number;
  total_numeros: number;
  data_sorteio: string | null;
  status:
    | "aberta"
    | "encerrada"
    | "sorteada"
    | "cancelada";

  created_at: string | null;

  numeros_criados: number;
  numeros_pagos: number;
  numeros_reservados: number;
  numeros_disponiveis: number;
};

export default function RifasPage() {
  const [rifas, setRifas] = useState<Rifa[]>([]);

  const [carregando, setCarregando] =
    useState(true);

  const [erro, setErro] =
    useState("");

  const [busca, setBusca] =
    useState("");

  // =====================================================
  // BUSCAR RIFAS
  // =====================================================

  const carregarRifas = async () => {
    try {
      setCarregando(true);
      setErro("");

      const response = await fetch(
        "/api/rifas",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.mensagem ||
            "Erro ao carregar as rifas."
        );
      }

      setRifas(data.rifas || []);
    } catch (error) {
      console.error(error);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as rifas."
      );
    } finally {
      setCarregando(false);
    }
  };

  // =====================================================
  // CARREGAR AO ABRIR
  // =====================================================

  useEffect(() => {
    carregarRifas();
  }, []);

  // =====================================================
  // FILTRO
  // =====================================================

  const rifasFiltradas = rifas.filter(
    (rifa) => {
      const termo =
        busca.toLowerCase().trim();

      if (!termo) {
        return true;
      }

      return (
        rifa.numero_rifa
          .toLowerCase()
          .includes(termo) ||
        rifa.titulo
          .toLowerCase()
          .includes(termo) ||
        (rifa.descricao || "")
          .toLowerCase()
          .includes(termo)
      );
    }
  );

  // =====================================================
  // FORMATAÇÕES
  // =====================================================

  const formatarValor = (
    valor: number
  ) => {
    return valor.toLocaleString(
      "pt-BR",
      {
        style: "currency",
        currency: "BRL",
      }
    );
  };

  const formatarData = (
    data: string | null
  ) => {
    if (!data) {
      return "Não informado";
    }

    const dataObj = new Date(data);

    if (Number.isNaN(dataObj.getTime())) {
      return "Data inválida";
    }

    return dataObj.toLocaleString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }
    );
  };

  // =====================================================
  // STATUS
  // =====================================================

  const statusConfig = (
    status: Rifa["status"]
  ) => {
    switch (status) {
      case "aberta":
        return {
          label: "Aberta",
          className:
            "bg-emerald-100 text-emerald-700",
        };

      case "encerrada":
        return {
          label: "Encerrada",
          className:
            "bg-orange-100 text-orange-700",
        };

      case "sorteada":
        return {
          label: "Sorteada",
          className:
            "bg-blue-100 text-blue-700",
        };

      case "cancelada":
        return {
          label: "Cancelada",
          className:
            "bg-red-100 text-red-700",
        };

      default:
        return {
          label: status,
          className:
            "bg-slate-100 text-slate-600",
        };
    }
  };

  // =====================================================
  // TELA
  // =====================================================

  return (
    <div className="min-h-screen p-6">

      <div className="mx-auto max-w-[1600px]">

        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

          <div>
            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
                <Ticket className="h-5 w-5" />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Rifas
                </h1>

                <p className="mt-0 text-sm text-white">
                  Gerencie todas as rifas cadastradas.
                </p>
              </div>

            </div>
          </div>

          <Link
            href="/diretor/rifa/registrar"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <Plus className="h-4 w-4" />
            Nova Rifa
          </Link>

        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">


          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-base font-bold text-slate-900">
                Todas as Rifas
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {rifas.length}{" "}
                {rifas.length === 1
                  ? "rifa cadastrada"
                  : "rifas cadastradas"}
              </p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">

              <div className="relative">

                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <input
                  type="text"
                  value={busca}
                  onChange={(e) =>
                    setBusca(e.target.value)
                  }
                  placeholder="Buscar rifa..."
                  className="w-full rounded-lg border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 sm:w-64"
                />

              </div>

              <button
                type="button"
                onClick={carregarRifas}
                disabled={carregando}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RefreshCw
                  className={`h-4 w-4 ${
                    carregando
                      ? "animate-spin"
                      : ""
                  }`}
                />

                Atualizar
              </button>

            </div>

          </div>

          {erro && (
            <div className="m-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {erro}
            </div>
          )}

          {carregando ? (
            <div className="flex min-h-[350px] items-center justify-center">

              <div className="flex flex-col items-center">

                <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600" />

                <p className="mt-4 text-sm text-slate-500">
                  Carregando rifas...
                </p>

              </div>

            </div>
          ) : rifasFiltradas.length === 0 ? (

            <div className="flex min-h-[350px] flex-col items-center justify-center px-6 text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <PackageOpen className="h-7 w-7 text-slate-400" />
              </div>

              <h3 className="mt-5 text-lg font-bold text-slate-900">
                {busca
                  ? "Nenhuma rifa encontrada"
                  : "Nenhuma rifa cadastrada"}
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                {busca
                  ? "Não encontramos nenhuma rifa correspondente à sua busca."
                  : "Cadastre sua primeira rifa para começar a gerenciar os números e participantes."}
              </p>

              {!busca && (
                <Link
                  href="/diretor/rifa/registrar"
                  className="mt-5 inline-flex items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                >
                  <Plus className="h-4 w-4" />
                  Cadastrar Rifa
                </Link>
              )}

            </div>
          ) : (

            <div className="overflow-x-auto">

              <table className="w-full min-w-[1200px]">

                <thead>

                  <tr className="border-b border-slate-200 bg-slate-50">

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                      Nº da Rifa
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                      Imagem do Produto
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                      Produto Sorteado
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                      Valor do Número
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                      Quant. de Números
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wide text-slate-600">
                      Data do Sorteio
                    </th>

                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                      Status
                    </th>

                    <th className="px-6 py-4 text-center text-xs font-bold uppercase tracking-wide text-slate-600">
                      Ação
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {rifasFiltradas.map(
                    (rifa) => {

                      const status =
                        statusConfig(
                          rifa.status
                        );

                      return (
                        <tr
                          key={rifa.id}
                          className="border-b border-slate-100 transition hover:bg-slate-50"
                        >

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-2">

                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-teal-50 text-teal-600">
                                <Hash className="h-4 w-4" />
                              </div>

                              <span className="font-semibold text-slate-800">
                                {rifa.numero_rifa}
                              </span>

                            </div>

                          </td>

                          <td className="px-6 py-5">

                            {rifa.imagem ? (
                              <img
                                src={rifa.imagem}
                                alt={rifa.titulo}
                                className="h-20 w-20 rounded-xl border border-slate-200 object-cover shadow-sm"
                              />
                            ) : (
                              <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                                <PackageOpen className="h-7 w-7 text-slate-300" />
                              </div>
                            )}

                          </td>

                          <td className="px-6 py-5">

                            <div className="max-w-[230px]">

                              <p className="font-bold text-slate-900">
                                {rifa.titulo}
                              </p>

                              <p className="mt-1 line-clamp-2 text-sm leading-5 text-slate-500">
                                {rifa.descricao ||
                                  `Rifa de ${rifa.titulo}`}
                              </p>

                            </div>

                          </td>

                          <td className="px-6 py-5">

                            <div className="flex items-center gap-2">

                              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                                <DollarSign className="h-4 w-4" />
                              </div>

                              <span className="font-bold text-slate-900">
                                {formatarValor(
                                  rifa.valor_numero
                                )}
                              </span>

                            </div>

                          </td>

                          <td className="px-6 py-5">

                            <p className="font-semibold text-slate-900">
                              {rifa.total_numeros.toLocaleString(
                                "pt-BR"
                              )}{" "}
                              números
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {rifa.numeros_pagos}{" "}
                              pagos
                            </p>

                            {rifa.numeros_reservados >
                              0 && (
                              <p className="mt-0.5 text-xs text-orange-500">
                                {rifa.numeros_reservados}{" "}
                                reservados
                              </p>
                            )}

                          </td>

                          <td className="px-6 py-5">

                            <div className="flex items-start gap-2">

                              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

                              <span className="text-sm font-medium text-slate-700">
                                {formatarData(
                                  rifa.data_sorteio
                                )}
                              </span>

                            </div>

                          </td>

                          <td className="px-6 py-5 text-center">

                            <span
                              className={`inline-flex rounded-lg px-4 py-2 text-xs font-bold ${status.className}`}
                            >
                              {status.label}
                            </span>

                          </td>

                          <td className="px-6 py-5 text-center">

                            <Link
                              href={`/diretor/rifa/visualizacao/${rifa.id}`}
                              title="Visualizar rifa"
                              className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm transition hover:bg-teal-700 hover:shadow-md"
                            >
                              <Eye className="h-5 w-5" />
                            </Link>

                          </td>

                        </tr>
                      );
                    }
                  )}

                </tbody>

              </table>

            </div>
          )}

          {!carregando &&
            rifasFiltradas.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">

                <span>
                  Exibindo{" "}
                  <strong className="font-semibold text-slate-700">
                    {rifasFiltradas.length}
                  </strong>{" "}
                  de{" "}
                  <strong className="font-semibold text-slate-700">
                    {rifas.length}
                  </strong>{" "}
                  rifas
                </span>

                {busca && (
                  <span>
                    Filtro:{" "}
                    <strong className="font-semibold text-slate-700">
                      {busca}
                    </strong>
                  </span>
                )}

              </div>
            )}

        </div>

      </div>

    </div>
  );
}