"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  Download,
  Trash2,
  Loader2,
  X,
  AlertTriangle,
  Check,
} from "lucide-react";
import Link from "next/link";

type RifaStatus =
  | "aberta"
  | "encerrada"
  | "sorteada"
  | "cancelada";

type Rifa = {
  id: number;
  numero_rifa: string;
  titulo: string;
  descricao: string | null;
  imagem: string | null;
  valor_numero: number;
  total_numeros: number;
  data_sorteio: string | null;
  status: RifaStatus;
  created_at: string | null;
  numeros_criados: number;
  numeros_pagos: number;
  numeros_reservados: number;
  numeros_disponiveis: number;
};

type ApiResponse = {
  sucesso?: boolean;
  mensagem?: string;
  message?: string;
  error?: string;
  detalhes?: string;
  details?: string;
  rifas?: Rifa[];
};

type StatusConfig = {
  label: string;
  className: string;
};

type ModalExclusao = {
  aberto: boolean;
  rifa: Rifa | null;
};

export default function RifasPage() {
  const [rifas, setRifas] = useState<Rifa[]>([]);

  const [carregando, setCarregando] = useState(true);

  const [excluindo, setExcluindo] = useState(false);

  const [erro, setErro] = useState("");

  const [sucesso, setSucesso] = useState("");

  const [busca, setBusca] = useState("");

  const [modalExclusao, setModalExclusao] =
    useState<ModalExclusao>({
      aberto: false,
      rifa: null,
    });

  /*
   * ============================================================
   * ALERTA DE SUCESSO
   * ============================================================
   */

  const mostrarSucesso = useCallback(
    (mensagem: string) => {
      setErro("");
      setSucesso(mensagem);

      const timeout = window.setTimeout(() => {
        setSucesso("");
      }, 4000);

      return () => {
        window.clearTimeout(timeout);
      };
    },
    []
  );

  /*
   * ============================================================
   * CARREGAR RIFAS
   * ============================================================
   */

  const carregarRifas = useCallback(async () => {
    try {
      setCarregando(true);
      setErro("");

      const response = await fetch("/api/rifas", {
        method: "GET",
        cache: "no-store",
      });

      let data: ApiResponse = {};

      const texto = await response.text();

      if (texto) {
        try {
          data = JSON.parse(texto);
        } catch {
          throw new Error(
            "O servidor retornou uma resposta inválida."
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.mensagem ||
            data.message ||
            data.error ||
            "Erro ao carregar as rifas."
        );
      }

      setRifas(
        Array.isArray(data.rifas)
          ? data.rifas
          : []
      );
    } catch (error) {
      console.error(
        "Erro ao carregar rifas:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as rifas."
      );

      setRifas([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  /*
   * ============================================================
   * CARREGAMENTO INICIAL
   * ============================================================
   */

  useEffect(() => {
    carregarRifas();
  }, [carregarRifas]);

  /*
   * ============================================================
   * BUSCA
   * ============================================================
   */

  const rifasFiltradas = useMemo(() => {
    const termo = busca
      .toLowerCase()
      .trim();

    if (!termo) {
      return rifas;
    }

    return rifas.filter((rifa) => {
      const numero = String(
        rifa.numero_rifa || ""
      ).toLowerCase();

      const titulo = String(
        rifa.titulo || ""
      ).toLowerCase();

      const descricao = String(
        rifa.descricao || ""
      ).toLowerCase();

      return (
        numero.includes(termo) ||
        titulo.includes(termo) ||
        descricao.includes(termo)
      );
    });
  }, [rifas, busca]);

  /*
   * ============================================================
   * FORMATAÇÕES
   * ============================================================
   */

  const formatarValor = (valor: number) => {
    const numero = Number(valor);

    if (!Number.isFinite(numero)) {
      return "R$ 0,00";
    }

    return numero.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const formatarData = (
    data: string | null
  ) => {
    if (!data) {
      return "Não informado";
    }

    const dataObj = new Date(data);

    if (
      Number.isNaN(dataObj.getTime())
    ) {
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

  /*
   * ============================================================
   * STATUS
   * ============================================================
   */

  const statusConfig = (
    status: RifaStatus
  ): StatusConfig => {
    switch (status) {
      case "aberta":
        return {
          label: "Aberta",
          className:
            "bg-[#d8f7eb] text-[#008f78]",
        };

      case "encerrada":
        return {
          label: "Encerrada",
          className:
            "bg-orange-50 text-orange-600",
        };

      case "sorteada":
        return {
          label: "Sorteada",
          className:
            "bg-blue-50 text-blue-600",
        };

      case "cancelada":
        return {
          label: "Cancelada",
          className:
            "bg-red-50 text-red-600",
        };

      default:
        return {
          label: "Desconhecido",
          className:
            "bg-gray-100 text-gray-600",
        };
    }
  };

  /*
   * ============================================================
   * BAIXAR RIFA
   * ============================================================
   */

  const baixarRifa = (rifa: Rifa) => {
    try {
      const dados = {
        id: rifa.id,
        numero_rifa: rifa.numero_rifa,
        titulo: rifa.titulo,
        descricao: rifa.descricao,
        imagem: rifa.imagem,
        valor_numero: rifa.valor_numero,
        total_numeros: rifa.total_numeros,
        data_sorteio: rifa.data_sorteio,
        status: rifa.status,
        numeros_criados:
          rifa.numeros_criados,
        numeros_pagos:
          rifa.numeros_pagos,
        numeros_reservados:
          rifa.numeros_reservados,
        numeros_disponiveis:
          rifa.numeros_disponiveis,
      };

      const blob = new Blob(
        [
          JSON.stringify(
            dados,
            null,
            2
          ),
        ],
        {
          type: "application/json",
        }
      );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;

      link.download =
        `rifa-${rifa.numero_rifa}.json`;

      document.body.appendChild(link);

      link.click();

      document.body.removeChild(link);

      URL.revokeObjectURL(url);

      mostrarSucesso(
        "Dados da rifa baixados com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao baixar rifa:",
        error
      );

      setErro(
        "Não foi possível baixar os dados da rifa."
      );
    }
  };

  /*
   * ============================================================
   * ABRIR MODAL
   * ============================================================
   */

  const abrirModalExclusao = (
    rifa: Rifa
  ) => {
    if (excluindo) {
      return;
    }

    setErro("");
    setSucesso("");

    setModalExclusao({
      aberto: true,
      rifa,
    });
  };

  /*
   * ============================================================
   * FECHAR MODAL
   * ============================================================
   */

  const fecharModalExclusao = () => {
    if (excluindo) {
      return;
    }

    setModalExclusao({
      aberto: false,
      rifa: null,
    });
  };

  /*
   * ============================================================
   * EXCLUIR RIFA
   * ============================================================
   */

  const confirmarExclusao = async () => {
    const rifa = modalExclusao.rifa;

    if (!rifa || excluindo) {
      return;
    }

    try {
      setExcluindo(true);

      setErro("");
      setSucesso("");

      const response = await fetch(
        `/api/rifas/${rifa.id}`,
        {
          method: "DELETE",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        }
      );

      let data: ApiResponse = {};

      const texto = await response.text();

      /*
       * ========================================================
       * LER RESPOSTA DA API
       * ========================================================
       */

      if (texto) {
        try {
          data = JSON.parse(texto);
        } catch {
          data = {
            error: texto,
          };
        }
      }

      /*
       * ========================================================
       * VERIFICAR ERRO HTTP
       * ========================================================
       */

      if (!response.ok) {
        const mensagemErro =
          data.mensagem ||
          data.message ||
          data.error ||
          data.detalhes ||
          data.details ||
          `Erro ao excluir a rifa. Status HTTP: ${response.status}`;

        throw new Error(
          mensagemErro
        );
      }

      /*
       * ========================================================
       * VERIFICAR SUCESSO DA API
       * ========================================================
       */

      if (
        data.sucesso === false
      ) {
        throw new Error(
          data.mensagem ||
            data.message ||
            data.error ||
            "Não foi possível excluir a rifa."
        );
      }

      /*
       * ========================================================
       * REMOVER DA LISTA
       * ========================================================
       */

      setRifas((rifasAtuais) =>
        rifasAtuais.filter(
          (item) =>
            item.id !== rifa.id
        )
      );

      /*
       * ========================================================
       * FECHAR MODAL
       * ========================================================
       */

      setModalExclusao({
        aberto: false,
        rifa: null,
      });

      /*
       * ========================================================
       * MOSTRAR ALERTA DE SUCESSO
       * ========================================================
       */

      mostrarSucesso(
        data.mensagem ||
          "Rifa excluída com sucesso."
      );
    } catch (error) {
      console.error(
        "Erro ao excluir rifa:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível excluir a rifa."
      );
    } finally {
      setExcluindo(false);
    }
  };

  /*
   * ============================================================
   * ESC PARA FECHAR MODAL
   * ============================================================
   */

  useEffect(() => {
    if (!modalExclusao.aberto) {
      return;
    }

    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      if (
        event.key === "Escape" &&
        !excluindo
      ) {
        fecharModalExclusao();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, [
    modalExclusao.aberto,
    excluindo,
  ]);

  /*
   * ============================================================
   * TELA
   * ============================================================
   */

  return (
    <div className="min-h-screen">

      {/* ======================================================
          ALERTA DE SUCESSO - TOGGLE
      ======================================================= */}

      {sucesso && (
        <div
          role="alert"
          aria-live="polite"
          className="fixed right-5 top-5 z-[1000] w-[calc(100%-40px)] max-w-sm animate-in slide-in-from-right-5 fade-in duration-300"
        >
          <div className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-4 shadow-xl">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Check
                size={20}
                className="text-emerald-600"
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-[#102a43]">
                Sucesso!
              </p>

              <p className="mt-0.5 text-xs leading-5 text-[#607d94]">
                {sucesso}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setSucesso("")
              }
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#91a4b2] transition hover:bg-emerald-50 hover:text-emerald-600"
              aria-label="Fechar alerta de sucesso"
            >
              <X size={16} />
            </button>

          </div>
        </div>
      )}

      {/* ======================================================
          MODAL DE EXCLUSÃO
      ======================================================= */}

      {modalExclusao.aberto &&
        modalExclusao.rifa && (
          <div
            className="fixed inset-0 z-[500] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onMouseDown={(event) => {
              if (
                event.target ===
                  event.currentTarget &&
                !excluindo
              ) {
                fecharModalExclusao();
              }
            }}
          >
            <div
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
              role="dialog"
              aria-modal="true"
              aria-labelledby="modal-excluir-rifa"
            >

              {/* Cabeçalho */}

              <div className="border-b border-[#edf1f3] px-5 py-5">
                <div className="flex items-start gap-3">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-100">
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  </div>

                  <div className="min-w-0">

                    <h2
                      id="modal-excluir-rifa"
                      className="text-base font-bold text-[#102a43]"
                    >
                      Excluir rifa?
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-[#607d94]">
                      Tem certeza que deseja
                      excluir esta rifa?
                    </p>

                    <div className="mt-3 rounded-xl bg-[#f8fbfa] px-3 py-2.5">

                      <p className="text-xs font-semibold text-[#102a43]">
                        {
                          modalExclusao
                            .rifa.titulo
                        }
                      </p>

                      <p className="mt-1 text-[11px] text-[#607d94]">
                        Nº{" "}
                        {
                          modalExclusao
                            .rifa.numero_rifa
                        }
                      </p>

                    </div>

                    <p className="mt-3 text-xs leading-5 text-red-500">
                      Esta ação não poderá ser
                      desfeita.
                    </p>

                  </div>
                </div>
              </div>

              {/* Botões */}

              <div className="flex flex-col-reverse gap-3 bg-[#f8fbfa] px-5 py-4 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  onClick={
                    fecharModalExclusao
                  }
                  disabled={excluindo}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#dfe7eb] bg-white px-5 py-2.5 text-sm font-semibold text-[#607d94] transition hover:bg-[#f1f5f3] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X className="h-4 w-4" />

                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    confirmarExclusao
                  }
                  disabled={excluindo}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {excluindo ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}

                  {excluindo
                    ? "Excluindo..."
                    : "Sim, excluir"}

                </button>

              </div>
            </div>
          </div>
        )}

      {/* ======================================================
          CONTEÚDO
      ======================================================= */}

      <main className="w-full">
        <div className="mx-auto w-full max-w-[1600px] space-y-4">

          {/* ====================================================
              CABEÇALHO
          ===================================================== */}

          <section className="rounded-2xl bg-white px-5 py-5 shadow-sm md:px-7">

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d8f7eb]">
                  <Ticket
                    size={21}
                    className="text-[#00a99d]"
                  />
                </div>

                <div>

                  <h1 className="text-lg font-bold text-[#102a43] md:text-xl">
                    Rifas
                  </h1>

                  <p className="mt-0.5 text-xs text-[#607d94] md:text-sm">
                    Gerencie todas as rifas cadastradas.
                  </p>

                </div>

              </div>

              <Link
                href="/diretor/rifa/registrar"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#00a99d] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#008f85]"
              >
                <Plus size={16} />

                Nova Rifa
              </Link>

            </div>

          </section>

          {/* ====================================================
              ALERTA DE ERRO
          ===================================================== */}

          {erro && (
            <div
              role="alert"
              aria-live="assertive"
              className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 shadow-sm"
            >

              <div className="flex items-center gap-2">
                <AlertTriangle
                  size={17}
                  className="shrink-0"
                />

                <span>{erro}</span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setErro("")
                }
                className="shrink-0 rounded-lg p-1 transition hover:bg-red-100"
                aria-label="Fechar alerta"
              >
                <X size={15} />
              </button>

            </div>
          )}

          {/* ====================================================
              CARD PRINCIPAL
          ===================================================== */}

          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">

            {/* Cabeçalho */}

            <div className="flex flex-col gap-4 border-b border-[#edf1f3] px-5 py-5 md:flex-row md:items-center md:justify-between md:px-6">

              <div>

                <div className="flex items-center gap-2">

                  <h2 className="text-base font-bold text-[#102a43]">
                    Todas as Rifas
                  </h2>

                  <span className="rounded-full bg-[#d8f7eb] px-2.5 py-1 text-[10px] font-bold text-[#008f78]">
                    {rifas.length}
                  </span>

                </div>

                <p className="mt-1 text-xs text-[#607d94]">
                  {rifas.length === 1
                    ? "1 rifa cadastrada"
                    : `${rifas.length} rifas cadastradas`}
                </p>

              </div>

              <div className="flex flex-col gap-2 sm:flex-row">

                {/* Busca */}

                <div className="relative">

                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#91a4b2]"
                  />

                  <input
                    type="text"
                    value={busca}
                    onChange={(event) =>
                      setBusca(
                        event.target.value
                      )
                    }
                    placeholder="Buscar rifa..."
                    aria-label="Buscar rifa"
                    className="h-10 w-full rounded-xl border border-[#dfe7eb] bg-white py-2 pl-9 pr-3 text-xs text-[#102a43] outline-none transition placeholder:text-[#9aaab5] focus:border-[#00a99d] focus:ring-2 focus:ring-[#00a99d]/10 sm:w-64"
                  />

                </div>

                {/* Atualizar */}

                <button
                  type="button"
                  onClick={
                    carregarRifas
                  }
                  disabled={carregando}
                  className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-[#dfe7eb] bg-white px-4 text-xs font-semibold text-[#607d94] transition hover:bg-[#f6faf8] hover:text-[#00a99d] disabled:cursor-not-allowed disabled:opacity-50"
                >

                  <RefreshCw
                    size={15}
                    className={
                      carregando
                        ? "animate-spin"
                        : ""
                    }
                  />

                  Atualizar

                </button>

              </div>

            </div>

            {/* ==================================================
                CARREGANDO
            =================================================== */}

            {carregando ? (
              <div className="flex min-h-[420px] items-center justify-center">

                <div className="flex flex-col items-center">

                  <Loader2 className="h-9 w-9 animate-spin text-[#00a99d]" />

                  <p className="mt-4 text-xs font-medium text-[#607d94]">
                    Carregando rifas...
                  </p>

                </div>

              </div>

            ) : rifasFiltradas.length === 0 ? (

              /* ==================================================
                  VAZIO
              =================================================== */

              <div className="flex min-h-[420px] flex-col items-center justify-center px-6 text-center">

                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#f1f8f5]">
                  <PackageOpen
                    size={28}
                    className="text-[#9aabb5]"
                  />
                </div>

                <h3 className="mt-5 text-base font-bold text-[#102a43]">
                  {busca
                    ? "Nenhuma rifa encontrada"
                    : "Nenhuma rifa cadastrada"}
                </h3>

                <p className="mt-2 max-w-md text-xs leading-5 text-[#607d94]">
                  {busca
                    ? "Não encontramos nenhuma rifa correspondente à sua busca."
                    : "Cadastre sua primeira rifa para começar a gerenciar os números e participantes."}
                </p>

                {busca ? (

                  <button
                    type="button"
                    onClick={() =>
                      setBusca("")
                    }
                    className="mt-5 inline-flex items-center gap-2 rounded-xl border border-[#dfe7eb] bg-white px-5 py-2.5 text-xs font-semibold text-[#607d94] transition hover:bg-[#f6faf8] hover:text-[#00a99d]"
                  >
                    <Search size={15} />

                    Limpar busca
                  </button>

                ) : (

                  <Link
                    href="/diretor/rifa/registrar"
                    className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#00a99d] px-5 py-2.5 text-xs font-semibold text-white transition hover:bg-[#008f85]"
                  >
                    <Plus size={15} />

                    Cadastrar Rifa
                  </Link>

                )}

              </div>

            ) : (

              /* ==================================================
                  TABELA
              =================================================== */

              <div className="overflow-x-auto">

                <table className="w-full min-w-[1250px]">

                  <thead>

                    <tr className="bg-[#f1f5f8]">

                      <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wide text-[#314e68]">
                        Nº da Rifa
                      </th>

                      <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wide text-[#314e68]">
                        Imagem
                      </th>

                      <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wide text-[#314e68]">
                        Produto Sorteado
                      </th>

                      <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wide text-[#314e68]">
                        Valor
                      </th>

                      <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wide text-[#314e68]">
                        Números
                      </th>

                      <th className="px-6 py-3.5 text-left text-[11px] font-bold uppercase tracking-wide text-[#314e68]">
                        Sorteio
                      </th>

                      <th className="px-6 py-3.5 text-center text-[11px] font-bold uppercase tracking-wide text-[#314e68]">
                        Status
                      </th>

                      <th className="px-6 py-3.5 text-center text-[11px] font-bold uppercase tracking-wide text-[#314e68]">
                        Ações
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
                            className="border-b border-[#edf1f3] transition hover:bg-[#fbfdfc]"
                          >

                            {/* Número */}

                            <td className="px-6 py-4">

                              <div className="flex items-center gap-2.5">

                                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#d8f7eb]">

                                  <Hash
                                    size={16}
                                    className="text-[#00a99d]"
                                  />

                                </div>

                                <span className="text-sm font-bold text-[#102a43]">
                                  {
                                    rifa.numero_rifa
                                  }
                                </span>

                              </div>

                            </td>

                            {/* Imagem */}

                            <td className="px-6 py-4">

                              {rifa.imagem ? (

                                <img
                                  src={
                                    rifa.imagem
                                  }
                                  alt={`Imagem da rifa ${rifa.titulo}`}
                                  className="h-16 w-16 rounded-xl border border-[#e5ecef] bg-white object-cover shadow-sm"
                                  loading="lazy"
                                />

                              ) : (

                                <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-[#e5ecef] bg-[#f7fafb]">

                                  <PackageOpen
                                    size={23}
                                    className="text-[#a7b5bd]"
                                  />

                                </div>

                              )}

                            </td>

                            {/* Produto */}

                            <td className="px-6 py-4">

                              <div className="max-w-[240px]">

                                <p className="text-sm font-bold text-[#102a43]">
                                  {
                                    rifa.titulo
                                  }
                                </p>

                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#607d94]">
                                  {rifa.descricao ||
                                    `Rifa de ${rifa.titulo}`}
                                </p>

                              </div>

                            </td>

                            {/* Valor */}

                            <td className="px-6 py-4">

                              <div className="flex items-center gap-2">

                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#d8f7eb]">

                                  <DollarSign
                                    size={15}
                                    className="text-[#00a99d]"
                                  />

                                </div>

                                <span className="text-sm font-bold text-[#102a43]">
                                  {formatarValor(
                                    rifa.valor_numero
                                  )}
                                </span>

                              </div>

                            </td>

                            {/* Números */}

                            <td className="px-6 py-4">

                              <div>

                                <p className="text-sm font-bold text-[#102a43]">
                                  {Number(
                                    rifa.total_numeros
                                  ).toLocaleString(
                                    "pt-BR"
                                  )}
                                </p>

                                <p className="mt-0.5 text-[11px] text-[#607d94]">
                                  números
                                </p>

                                <div className="mt-2 flex flex-wrap gap-1">

                                  <span className="rounded-full bg-[#d8f7eb] px-2 py-0.5 text-[9px] font-semibold text-[#008f78]">
                                    {
                                      rifa.numeros_pagos
                                    }{" "}
                                    pagos
                                  </span>

                                  {rifa.numeros_reservados >
                                    0 && (

                                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[9px] font-semibold text-orange-600">
                                      {
                                        rifa.numeros_reservados
                                      }{" "}
                                      reservados
                                    </span>

                                  )}

                                </div>

                              </div>

                            </td>

                            {/* Data */}

                            <td className="px-6 py-4">

                              <div className="flex items-start gap-2">

                                <CalendarDays
                                  size={15}
                                  className="mt-0.5 shrink-0 text-[#00a99d]"
                                />

                                <span className="max-w-[150px] text-xs font-medium leading-5 text-[#607d94]">
                                  {formatarData(
                                    rifa.data_sorteio
                                  )}
                                </span>

                              </div>

                            </td>

                            {/* Status */}

                            <td className="px-6 py-4 text-center">

                              <span
                                className={`inline-flex rounded-full px-3 py-1.5 text-[10px] font-bold ${status.className}`}
                              >
                                {
                                  status.label
                                }
                              </span>

                            </td>

                            {/* Ações */}

                            <td className="px-6 py-4">

                              <div className="flex items-center justify-center gap-1">

                                {/* Visualizar */}

                                <Link
                                  href={`/diretor/rifa/visualizacao/${rifa.id}`}
                                  title="Visualizar rifa"
                                  aria-label="Visualizar rifa"
                                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-[#7890a4] transition hover:bg-[#eaf7f3] hover:text-[#00a99d]"
                                >
                                  <Eye size={17} />
                                </Link>

                                {/* Excluir */}

                                <button
                                  type="button"
                                  title="Excluir rifa"
                                  aria-label="Excluir rifa"
                                  onClick={() =>
                                    abrirModalExclusao(
                                      rifa
                                    )
                                  }
                                  disabled={
                                    excluindo
                                  }
                                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl text-[#7890a4] transition hover:bg-red-50 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  <Trash2
                                    size={17}
                                  />
                                </button>

                              </div>

                            </td>

                          </tr>
                        );
                      }
                    )}

                  </tbody>

                </table>

              </div>
            )}

            {/* ==================================================
                RODAPÉ
            =================================================== */}

            {!carregando &&
              rifasFiltradas.length >
                0 && (

              <div className="flex flex-col gap-2 border-t border-[#edf1f3] bg-[#fbfcfd] px-5 py-4 text-xs text-[#607d94] sm:flex-row sm:items-center sm:justify-between">

                <span>

                  Mostrando{" "}

                  <strong className="font-bold text-[#102a43]">
                    {
                      rifasFiltradas.length
                    }
                  </strong>{" "}

                  de{" "}

                  <strong className="font-bold text-[#102a43]">
                    {rifas.length}
                  </strong>{" "}

                  {rifas.length === 1
                    ? "registro"
                    : "registros"}

                </span>

                {busca && (

                  <span>
                    Busca:{" "}

                    <strong className="font-semibold text-[#102a43]">
                      {busca}
                    </strong>
                  </span>

                )}

              </div>

            )}

          </section>

        </div>
      </main>
    </div>
  );
}
