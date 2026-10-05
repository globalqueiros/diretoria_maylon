"use client";

import {
  Trophy,
  X,
  Sparkles,
  Dices,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Rifa = {
  id: number;
  titulo: string;
  descricao: string | null;
  imagem: string | null;
  valor_numero: number;
  total_numeros: number;
  data_sorteio: string | null;
  status: "aberta" | "encerrada" | "sorteada";
};

type RifaNumero = {
  id: number;
  numero: number;
  nome_cliente: string | null;
  telefone: string | null;
  status: "disponivel" | "reservado" | "pago";
};

type Props = {
  rifa: Rifa;
  numeros: RifaNumero[];
  estatisticas: {
    disponiveis: number;
    reservados: number;
    pagos: number;
    total: number;
    percentual: number;
  };
};

type Ganhador = {
  numero: number;
  nome_cliente: string;
  telefone: string;
};

function dinheiro(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor) || 0);
}

function formatarData(data: string | null) {
  if (!data) {
    return "A definir";
  }

  const dataFormatada = new Date(data);

  if (Number.isNaN(dataFormatada.getTime())) {
    return "A definir";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(dataFormatada);
}

function formatarNumero(numero: number) {
  return String(numero).padStart(3, "0");
}

export default function RifaClient({
  rifa,
  numeros,
  estatisticas,
}: Props) {
  const router = useRouter();

  const [pagina, setPagina] = useState(1);

  const [alert, setAlert] = useState("");
  const [alertTipo, setAlertTipo] = useState<"success" | "error">(
    "success"
  );

  const [modalAberto, setModalAberto] = useState(false);
  const [quantidadeNumeros, setQuantidadeNumeros] = useState("");
  const [adicionandoNumeros, setAdicionandoNumeros] = useState(false);

  const [modalSorteioAberto, setModalSorteioAberto] = useState(false);
  const [sorteando, setSorteando] = useState(false);

  const [ganhador, setGanhador] = useState<Ganhador | null>(null);

  const [numeroSelecionado, setNumeroSelecionado] = useState<
    number | null
  >(null);

  const registrosPorPagina = 15;

  const totalPaginas = Math.max(
    1,
    Math.ceil(numeros.length / registrosPorPagina)
  );

  const primeiroNumero = (pagina - 1) * registrosPorPagina;
  const ultimoNumero = primeiroNumero + registrosPorPagina;

  const numerosPaginados = useMemo(() => {
    return numeros.slice(primeiroNumero, ultimoNumero);
  }, [numeros, primeiroNumero, ultimoNumero]);

  const percentual = Math.min(
    Math.max(Number(estatisticas.percentual) || 0, 0),
    100
  );

  useEffect(() => {
    if (pagina > totalPaginas) {
      setPagina(totalPaginas);
    }
  }, [pagina, totalPaginas]);

  useEffect(() => {
    if (!alert) {
      return;
    }

    const timer = window.setTimeout(() => {
      setAlert("");
    }, 4000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [alert]);

  function mostrarAlerta(
    mensagem: string,
    tipo: "success" | "error" = "success"
  ) {
    setAlert(mensagem);
    setAlertTipo(tipo);
  }

  async function abrirRifa() {
    const quantidade = Number(quantidadeNumeros);

    if (!Number.isInteger(quantidade) || quantidade <= 0) {
      mostrarAlerta(
        "Informe uma quantidade válida de números.",
        "error"
      );
      return;
    }

    if (adicionandoNumeros) {
      return;
    }

    setAdicionandoNumeros(true);

    try {
      const response = await fetch(
        `/api/rifas/${rifa.id}/numeros`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantidade,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        mostrarAlerta(
          data?.mensagem ||
          data?.message ||
          "Erro ao adicionar números.",
          "error"
        );
        return;
      }

      setQuantidadeNumeros("");
      setModalAberto(false);

      mostrarAlerta(
        data?.mensagem ||
        data?.message ||
        "Números adicionados com sucesso!",
        "success"
      );

      window.setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      console.error("Erro ao adicionar números:", error);

      mostrarAlerta(
        "Não foi possível conectar ao servidor.",
        "error"
      );
    } finally {
      setAdicionandoNumeros(false);
    }
  }

  function mascararNome(nome: string) {
    if (!nome?.trim()) {
      return "Cliente";
    }

    const partes = nome.trim().split(/\s+/);

    if (partes.length === 1) {
      return `${partes[0]} ***`;
    }

    return `${partes[0]} ***`;
  }

  function mascararTelefone(telefone: string) {
    const numeros = telefone.replace(/\D/g, "");

    if (numeros.length < 10) {
      return telefone;
    }

    const ddd = numeros.substring(0, 2);
    const inicio = numeros.substring(2, 5);
    const final = numeros.substring(numeros.length - 4);

    return `(${ddd}) ${inicio} ** ** ${final}`;
  }

  async function sortearRifa() {
    if (sorteando) {
      return;
    }

    if (rifa.status === "sorteada") {
      mostrarAlerta(
        "Esta rifa já foi sorteada.",
        "error"
      );
      return;
    }

    if (estatisticas.pagos <= 0) {
      mostrarAlerta(
        "Não existem números pagos para realizar o sorteio.",
        "error"
      );
      return;
    }

    setSorteando(true);

    try {
      const response = await fetch(
        `/api/rifas/${rifa.id}/sortear`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        mostrarAlerta(
          data?.mensagem ||
          data?.message ||
          "Não foi possível realizar o sorteio.",
          "error"
        );
        return;
      }

      if (!data?.ganhador) {
        mostrarAlerta(
          "O servidor não retornou o ganhador.",
          "error"
        );
        return;
      }

      setGanhador({
        numero: Number(data.ganhador.numero),
        nome_cliente:
          data.ganhador.nome_cliente || "Cliente",
        telefone:
          data.ganhador.telefone || "",
      });

      setModalSorteioAberto(true);
    } catch (error) {
      console.error("Erro ao realizar sorteio:", error);

      mostrarAlerta(
        "Não foi possível conectar ao servidor.",
        "error"
      );
    } finally {
      setSorteando(false);
    }
  }

  function abrirModalSorteio() {
    if (rifa.status === "sorteada") {
      mostrarAlerta(
        "Esta rifa já foi sorteada.",
        "error"
      );
      return;
    }

    setGanhador(null);
    setModalSorteioAberto(true);
  }

  function fecharModalSorteio() {
    if (sorteando) {
      return;
    }

    setModalSorteioAberto(false);
  }

  function selecionarNumero(numero: number) {
    const numeroEncontrado = numeros.find(
      (item) => item.numero === numero
    );

    if (
      numeroEncontrado &&
      numeroEncontrado.status !== "disponivel"
    ) {
      mostrarAlerta(
        "Este número não está disponível.",
        "error"
      );
      return;
    }

    setNumeroSelecionado(numero);
  }

  function fecharModalNumeros() {
    if (adicionandoNumeros) {
      return;
    }

    setModalAberto(false);
    setQuantidadeNumeros("");
  }

  function enviarPagamentoWhatsApp() {
    if (numeroSelecionado === null) {
      mostrarAlerta("Selecione um número primeiro.", "error");
      return;
    }

    const numeroFormatado = formatarNumero(numeroSelecionado);

    // Troque esta URL pela URL da sua página de pagamento
    const linkPagamento = `${window.location.origin}/pagamento/rifa/${rifa.id}?numero=${numeroSelecionado}`;

    const valor = dinheiro(rifa.valor_numero);

    const mensagem = `Olá! 👋

    Quero participar da rifa *${rifa.titulo}*.

    🎟️ Número: *${numeroFormatado}*
    💰 Valor: *${valor}*

    Para realizar o pagamento, acesse:
    ${linkPagamento}`;

    const mensagemWhatsApp = encodeURIComponent(mensagem);

    // Abre o WhatsApp
    window.open(
      `https://wa.me/?text=${mensagemWhatsApp}`,
      "_blank",
      "noopener,noreferrer"
    );
  }


  return (
    <>
      <div className="mx-auto w-full max-w-[1600px] px-4 pb-10 sm:px-6 lg:px-8">

        {/* ALERTA */}
        {alert && (
          <div
            role="alert"
            className={`fixed right-5 top-5 z-[300] flex max-w-[calc(100%-2rem)] items-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-xl ${alertTipo === "success"
              ? "bg-emerald-500"
              : "bg-red-500"
              }`}
          >
            <span className="text-lg">
              {alertTipo === "success" ? "✓" : "!"}
            </span>

            <span>{alert}</span>

            <button
              type="button"
              onClick={() => setAlert("")}
              className="ml-2 rounded-md p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Fechar alerta"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* CABEÇALHO */}
        <div className="mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="min-w-0">
              <h1 className="text-2xl font-bold text-white">
                Rifa
              </h1>

              <p className="mt-1 text-sm text-white/90">
                Escolha seu número para participar do sorteio.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">

              <button
                type="button"
                onClick={() => router.back()}
                title="Voltar para a página anterior"
                aria-label="Voltar para a página anterior"
                className="inline-flex h-11 shrink-0 cursor-pointer items-center gap-2 rounded-xl border-2 border-white/30 bg-white px-4 text-sm font-bold text-slate-700 shadow-lg transition-all duration-200 hover:bg-slate-100 hover:text-teal-600 active:scale-95"
              >
                <ArrowLeft
                  className="h-5 w-5"
                  strokeWidth={2.5}
                />

                <span>Voltar</span>
              </button>

              <button
                type="button"
                onClick={abrirModalSorteio}
                disabled={
                  rifa.status === "sorteada" ||
                  sorteando
                }
                className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 text-sm font-semibold text-white shadow-lg transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Dices className="h-4 w-4" />

                {rifa.status === "sorteada"
                  ? "Rifa Sorteada"
                  : sorteando
                    ? "Sorteando..."
                    : "Sortear"}
              </button>

            </div>
          </div>
        </div>

        {/* INFORMAÇÕES DA RIFA */}
        <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

              <div className="flex min-w-0 items-center gap-4">

                <img
                  src={rifa.imagem || "/favicon.webp"}
                  alt={rifa.titulo || "Rifa"}
                  className="h-24 w-24 shrink-0 rounded-xl border border-slate-200 bg-slate-100 object-cover sm:h-28 sm:w-28"
                />

                <div className="min-w-0">

                  <span
                    className={`inline-flex w-fit rounded-lg px-3 py-1 text-xs font-semibold ${rifa.status === "aberta"
                      ? "bg-emerald-50 text-emerald-700"
                      : rifa.status === "encerrada"
                        ? "bg-orange-50 text-orange-700"
                        : "bg-blue-50 text-blue-700"
                      }`}
                  >
                    {rifa.status === "aberta"
                      ? "Rifa aberta"
                      : rifa.status === "encerrada"
                        ? "Rifa encerrada"
                        : "Rifa sorteada"}
                  </span>

                  <h2 className="mt-1 truncate text-xl font-bold text-slate-900">
                    {rifa.titulo}
                  </h2>

                  {rifa.descricao && (
                    <p className="mt-0 line-clamp-2 text-sm text-slate-500">
                      {rifa.descricao}
                    </p>
                  )}

                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">

                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <span className="block text-xs text-slate-500">
                    Valor
                  </span>

                  <strong className="text-sm font-bold text-slate-900">
                    {dinheiro(rifa.valor_numero)}
                  </strong>
                </div>

                <div className="rounded-xl bg-slate-50 px-4 py-3">
                  <span className="block text-xs text-slate-500">
                    Sorteio
                  </span>

                  <strong className="text-sm font-bold text-slate-900">
                    {formatarData(rifa.data_sorteio)}
                  </strong>
                </div>

              </div>

            </div>
          </div>

          {/* ESTATÍSTICAS */}
          <div className="grid grid-cols-2 border-t border-slate-200 sm:grid-cols-4">

            <div className="border-b border-slate-200 p-4 py-3 sm:border-b-0 sm:border-r">
              <span className="text-xs text-slate-500">
                Disponíveis
              </span>

              <strong className="mt-1 block text-xl font-bold text-emerald-600">
                {estatisticas.disponiveis}
              </strong>
            </div>

            <div className="border-b border-slate-200 p-4 py-3 sm:border-b-0 sm:border-r">
              <span className="text-xs text-slate-500">
                Reservados
              </span>

              <strong className="mt-1 block text-xl font-bold text-orange-600">
                {estatisticas.reservados}
              </strong>
            </div>

            <div className="border-b border-slate-200 p-4 py-3 sm:border-b-0 sm:border-r">
              <span className="text-xs text-slate-500">
                Pagos
              </span>

              <strong className="mt-1 block text-xl font-bold text-green-600">
                {estatisticas.pagos}
              </strong>
            </div>

            <div className="p-4 py-3">
              <span className="text-xs text-slate-500">
                Total
              </span>

              <strong className="mt-1 block text-xl font-bold text-slate-900">
                {rifa.total_numeros}
              </strong>
            </div>

          </div>

          {/* PROGRESSO */}
          <div className="border-t border-slate-200 px-5 py-5 sm:px-6">

            <div className="mb-2 flex items-center justify-between">

              <div>
                <span className="text-sm font-semibold text-slate-700">
                  Números vendidos
                </span>

                <span className="ml-2 text-xs text-slate-500">
                  {estatisticas.pagos} de {rifa.total_numeros}
                </span>
              </div>

              <strong className="text-sm font-bold text-indigo-600">
                {percentual}%
              </strong>

            </div>

            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-500 transition-all duration-500"
                style={{
                  width: `${percentual}%`,
                }}
              />
            </div>

          </div>

        </section>

        {/* LISTA DE NÚMEROS */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

          <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">

            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Números da Rifa
              </h2>

              <p className="mt-0 text-sm text-slate-500">
                Selecione um número disponível.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">

              <div className="flex flex-wrap items-center gap-3 text-xs">

                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-lg bg-emerald-500" />
                  Disponível
                </span>

                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-lg bg-orange-500" />
                  Reservado
                </span>

                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-lg bg-red-500" />
                  Pago
                </span>

              </div>

              <button
                type="button"
                onClick={() => setModalAberto(true)}
                disabled={rifa.status !== "aberta"}
                className="cursor-pointer rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                + Abrir Números
              </button>

            </div>
          </div>

          {/* TABELA */}
          <div className="overflow-x-auto">

            <table className="w-full min-w-[650px] text-left">

              <thead className="border-b border-slate-200 bg-slate-50">
                <tr>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Número
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Cliente
                  </th>

                  <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Status
                  </th>

                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Ação
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">

                {numerosPaginados.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-5 py-10 text-center text-sm text-slate-400"
                    >
                      Nenhum número encontrado.
                    </td>
                  </tr>
                ) : (
                  numerosPaginados.map((item) => {

                    const disponivel =
                      item.status === "disponivel";

                    const selecionado =
                      numeroSelecionado === item.numero;

                    const corNumero =
                      item.status === "disponivel"
                        ? "bg-emerald-50 text-emerald-700"
                        : item.status === "reservado"
                          ? "bg-orange-50 text-orange-700"
                          : "bg-red-50 text-red-700";

                    const corBolinha =
                      item.status === "disponivel"
                        ? "bg-emerald-500"
                        : item.status === "reservado"
                          ? "bg-orange-500"
                          : "bg-red-500";

                    return (
                      <tr
                        key={item.id}
                        className={`transition ${selecionado
                          ? "bg-indigo-50"
                          : "hover:bg-slate-50"
                          }`}
                      >

                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex h-9 min-w-12 items-center justify-center rounded-lg px-3 text-sm font-bold ${corNumero}`}
                          >
                            {formatarNumero(item.numero)}
                          </span>
                        </td>

                        <td className="px-5 py-3">

                          {item.nome_cliente ? (
                            <div className="flex items-center gap-3">

                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                                {item.nome_cliente
                                  .charAt(0)
                                  .toUpperCase()}
                              </div>

                              <span className="text-sm font-medium text-slate-700">
                                {item.nome_cliente}
                              </span>

                            </div>
                          ) : (
                            <span className="text-sm text-slate-400">
                              —
                            </span>
                          )}

                        </td>

                        <td className="px-5 py-3">

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${corNumero}`}
                          >

                            <span
                              className={`h-1.5 w-1.5 rounded-lg ${corBolinha}`}
                            />

                            {item.status === "disponivel"
                              ? "Disponível"
                              : item.status === "reservado"
                                ? "Reservado"
                                : "Pago"}

                          </span>

                        </td>

                        <td className="px-5 py-3 text-right">

                          <button
                            type="button"
                            disabled={
                              !disponivel ||
                              rifa.status !== "aberta"
                            }
                            onClick={() => {
                              if (disponivel) {
                                selecionarNumero(item.numero);
                              }
                            }}
                            className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${disponivel &&
                              rifa.status === "aberta"
                              ? "cursor-pointer bg-teal-600 text-white hover:bg-teal-700"
                              : "cursor-not-allowed bg-slate-100 text-slate-400"
                              }`}
                          >
                            {selecionado
                              ? "Selecionado"
                              : disponivel
                                ? "Escolher"
                                : "Indisponível"}
                          </button>

                        </td>

                      </tr>
                    );
                  })
                )}

              </tbody>

            </table>

          </div>

          {/* PAGINAÇÃO */}
          <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">

            <p className="text-sm text-slate-500">

              Mostrando{" "}

              <strong className="text-slate-700">
                {numeros.length === 0 ? 0 : primeiroNumero + 1}
              </strong>

              {" "}até{" "}

              <strong className="text-slate-700">
                {Math.min(ultimoNumero, numeros.length)}
              </strong>

              {" "}de{" "}

              <strong className="text-slate-700">
                {numeros.length}
              </strong>

              {" "}números

            </p>

            {totalPaginas > 1 && (
              <div className="flex flex-wrap gap-2">

                <button
                  type="button"
                  onClick={() =>
                    setPagina((p) => Math.max(p - 1, 1))
                  }
                  disabled={pagina === 1}
                  className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Anterior
                </button>

                {Array.from(
                  { length: totalPaginas },
                  (_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPagina(i + 1)}
                      className={`h-9 min-w-9 cursor-pointer rounded-lg px-3 text-sm font-medium ${pagina === i + 1
                        ? "bg-teal-600 text-white"
                        : "border border-slate-300 text-slate-700 hover:bg-teal-50"
                        }`}
                    >
                      {i + 1}
                    </button>
                  )
                )}

                <button
                  type="button"
                  onClick={() =>
                    setPagina((p) =>
                      Math.min(p + 1, totalPaginas)
                    )
                  }
                  disabled={pagina === totalPaginas}
                  className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Próxima
                </button>

              </div>
            )}

          </div>

        </section>

        {/* NÚMERO SELECIONADO */}
        {numeroSelecionado !== null && (
          <div className="fixed bottom-5 left-1/2 z-40 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-teal-200 bg-white p-4 shadow-2xl">

            <div className="flex items-center justify-between gap-4">

              <div>
                <p className="text-xs font-medium text-slate-500">
                  Número selecionado
                </p>

                <p className="text-xl font-bold text-teal-600">
                  {formatarNumero(numeroSelecionado)}
                </p>
              </div>

              <div className="flex gap-2">

                <button
                  type="button"
                  onClick={() => setNumeroSelecionado(null)}
                  className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-red-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={enviarPagamentoWhatsApp}
                  disabled={numeroSelecionado === null}
                  className="cursor-pointer rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Continuar
                </button>


              </div>

            </div>

          </div>
        )}

        {/* MODAL DE SORTEIO */}
        {modalSorteioAberto && (
          <div
            className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
            onClick={fecharModalSorteio}
          >

            <div
              className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >

              <div className="relative border-b border-slate-100 px-6 py-5">

                <button
                  type="button"
                  onClick={fecharModalSorteio}
                  disabled={sorteando}
                  className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Fechar modal"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50">
                    <Dices className="h-6 w-6 text-teal-600" />
                  </div>

                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Sortear Rifa
                    </h2>

                    <p className="mt-0.5 text-sm text-slate-500">
                      Realizar o sorteio do ganhador
                    </p>
                  </div>

                </div>

              </div>

              <div className="px-6 py-6">

                {!ganhador ? (
                  <>
                    <div className="rounded-xl border border-teal-100 bg-teal-50 p-4">

                      <div className="flex gap-3">

                        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-600">
                          <Sparkles className="h-5 w-5 text-white" />
                        </div>

                        <div>

                          <p className="text-sm font-semibold text-teal-900">
                            Atenção antes de sortear
                          </p>

                          <p className="mt-1 text-sm leading-5 text-teal-700">
                            O sistema irá selecionar aleatoriamente
                            um dos números que já foram pagos.
                          </p>

                        </div>

                      </div>

                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">

                      <div className="rounded-xl bg-slate-50 p-4">
                        <span className="text-xs text-slate-500">
                          Números pagos
                        </span>

                        <strong className="mt-1 block text-xl font-bold text-emerald-600">
                          {estatisticas.pagos}
                        </strong>
                      </div>

                      <div className="rounded-xl bg-slate-50 p-4">
                        <span className="text-xs text-slate-500">
                          Total da rifa
                        </span>

                        <strong className="mt-1 block text-xl font-bold text-slate-900">
                          {rifa.total_numeros}
                        </strong>
                      </div>

                    </div>
                  </>
                ) : (
                  <div className="text-center">

                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-amber-50">
                      <Trophy className="h-10 w-10 text-amber-500" />
                    </div>

                    <div className="mt-5">

                      <p className="text-sm font-medium uppercase tracking-wider text-teal-600">
                        Resultado do sorteio
                      </p>

                      <h3 className="mt-2 text-2xl font-bold text-slate-900">
                        Parabéns! 🎉
                      </h3>

                    </div>

                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5">

                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Número sorteado
                      </p>

                      <p className="mt-1 text-4xl font-black text-teal-600">
                        {formatarNumero(ganhador.numero)}
                      </p>

                      <div className="my-5 h-px bg-slate-200" />

                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Ganhador
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {mascararNome(ganhador.nome_cliente)}
                      </p>

                      {ganhador.telefone && (
                        <p className="mt-1 text-sm text-slate-500">
                          {mascararTelefone(ganhador.telefone)}
                        </p>
                      )}

                    </div>

                  </div>
                )}

              </div>

              <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">

                {!ganhador ? (
                  <>
                    <button
                      type="button"
                      disabled={sorteando}
                      onClick={fecharModalSorteio}
                      className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Cancelar
                    </button>

                    <button
                      type="button"
                      disabled={
                        sorteando ||
                        estatisticas.pagos === 0 ||
                        rifa.status === "sorteada"
                      }
                      onClick={sortearRifa}
                      className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Dices className="h-4 w-4" />

                      {sorteando
                        ? "Sorteando..."
                        : "Realizar Sorteio"}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setModalSorteioAberto(false);
                      window.location.reload();
                    }}
                    className="cursor-pointer rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
                  >
                    Fechar
                  </button>
                )}

              </div>

            </div>
          </div>
        )}

        {/* MODAL ABRIR NÚMEROS */}
        {modalAberto && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            onClick={fecharModalNumeros}
          >

            <div
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >

              <div className="mb-5">

                <h2 className="text-lg font-bold text-slate-800">
                  Abrir nova rifa
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Digite a quantidade de números que a rifa terá.
                </p>

              </div>

              <div>

                <label
                  htmlFor="quantidadeNumeros"
                  className="mb-2 block text-sm font-medium text-slate-700"
                >
                  Quantidade de números
                </label>

                <input
                  id="quantidadeNumeros"
                  type="number"
                  min="1"
                  step="1"
                  value={quantidadeNumeros}
                  disabled={adicionandoNumeros}
                  onChange={(e) =>
                    setQuantidadeNumeros(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" &&
                      quantidadeNumeros &&
                      Number(quantidadeNumeros) > 0
                    ) {
                      abrirRifa();
                    }

                    if (e.key === "Escape") {
                      fecharModalNumeros();
                    }
                  }}
                  placeholder="Ex: 100"
                  autoFocus
                  className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:bg-slate-100"
                />

              </div>

              <div className="mt-6 flex justify-end gap-3">

                <button
                  type="button"
                  onClick={fecharModalNumeros}
                  disabled={adicionandoNumeros}
                  className="cursor-pointer rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={abrirRifa}
                  disabled={
                    adicionandoNumeros ||
                    !quantidadeNumeros ||
                    !Number.isInteger(Number(quantidadeNumeros)) ||
                    Number(quantidadeNumeros) <= 0
                  }
                  className="cursor-pointer rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {adicionandoNumeros
                    ? "Adicionando..."
                    : "Adicionar Números"}
                </button>

              </div>

            </div>
          </div>
        )}

      </div>
    </>
  );
}
