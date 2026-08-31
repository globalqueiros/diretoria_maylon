"use client";
import {
  Trophy,
  X,
  Sparkles,
  Dices,
} from "lucide-react";
import { useMemo, useState } from "react";

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

function dinheiro(valor: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(valor));
}

function formatarData(data: string | null) {
  if (!data) {
    return "A definir";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(data));
}

export default function RifaClient({
  rifa,
  numeros,
  estatisticas,
}: Props) {
  const [pagina, setPagina] = useState(1);
  const [alert, setAlert] = useState("");
  const [alertTipo, setAlertTipo] = useState<"success" | "error">("success");
  const [modalAberto, setModalAberto] = useState(false);
  const [quantidadeNumeros, setQuantidadeNumeros] = useState("");
  const [quantidadeRifa, setQuantidadeRifa] = useState<number | null>(null);
  const [modalSorteioAberto, setModalSorteioAberto] = useState(false);
  const [sorteando, setSorteando] = useState(false);

  const [ganhador, setGanhador] = useState<{
    numero: number;
    nome_cliente: string;
    telefone: string;
  } | null>(null);

  const [numeroSelecionado, setNumeroSelecionado] =
    useState<number | null>(null);

  const registrosPorPagina = 15;

  const totalPaginas = Math.ceil(
    numeros.length / registrosPorPagina
  );

  const primeiroNumero =
    (pagina - 1) * registrosPorPagina;

  const ultimoNumero =
    primeiroNumero + registrosPorPagina;

  const numerosPaginados = useMemo(() => {
    return numeros.slice(
      primeiroNumero,
      ultimoNumero
    );
  }, [
    numeros,
    primeiroNumero,
    ultimoNumero,
  ]);

  const abrirRifa = async () => {
    const quantidade = Number(quantidadeNumeros);

    if (!quantidade || quantidade <= 0) {
      setAlert("Informe uma quantidade válida de números.");

      setTimeout(() => {
        setAlert("");
      }, 4000);

      return;
    }

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

      const data = await response.json();

      if (!response.ok) {
        setAlert(
          data.mensagem || "Erro ao adicionar números."
        );

        setTimeout(() => {
          setAlert("");
        }, 4000);

        return;
      }

      setQuantidadeRifa(quantidade);
      setQuantidadeNumeros("");
      setModalAberto(false);

      setAlert(
        data.mensagem || "Números adicionados com sucesso!"
      );

      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error(error);

      setAlert(
        "Não foi possível conectar ao servidor."
      );

      setTimeout(() => {
        setAlert("");
      }, 4000);
    }
  };

  const mascararNome = (nome: string) => {
    if (!nome) return "Cliente";

    const partes = nome.trim().split(/\s+/);

    if (partes.length === 1) {
      return `${partes[0]} ***`;
    }

    return `${partes[0]} ***`;
  };

  const mascararTelefone = (telefone: string) => {
    const numeros = telefone.replace(/\D/g, "");

    if (numeros.length < 10) {
      return telefone;
    }

    const ddd = numeros.substring(0, 2);
    const inicio = numeros.substring(2, 5);
    const final = numeros.substring(numeros.length - 4);

    return `(${ddd}) ${inicio} ** ** ${final}`;
  };

  const sortearRifa = async () => {
    if (sorteando) return;

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

      const data = await response.json();

      if (!response.ok) {
        setAlert(
          data.mensagem || "Não foi possível realizar o sorteio."
        );
        setAlertTipo("error");

        setTimeout(() => {
          setAlert("");
        }, 4000);

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

      setAlert(
        "Não foi possível conectar ao servidor."
      );

      setAlertTipo("error");

      setTimeout(() => {
        setAlert("");
      }, 4000);

    } finally {
      setSorteando(false);
    }
  };



  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Rifa
            </h1>
            <p className="mt-1 text-sm text-white">
              Escolha seu número para participar do sorteio.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalSorteioAberto(true)}
            disabled={rifa.status === "sorteada"}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Dices className="h-4 w-4" />

            {rifa.status === "sorteada"
              ? "Rifa Sorteada"
              : "Sortear"}
          </button>

        </div>
      </div>

      <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="p-5 sm:p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <img
                src={rifa.imagem || "/favicon.webp"}
                alt={rifa.titulo || "Rifa"}
                className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 object-cover sm:h-28 sm:w-28"
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
              {estatisticas.percentual}%
            </strong>

          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-teal-500"
              style={{
                width: `${estatisticas.percentual}%`,
              }}
            />
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-5">
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
                <span className="h-2.5 w-2.5 rounded-lg bg-green-500" />
                Pago
              </span>
            </div>
            <button
              type="button"
              onClick={() => setModalAberto(true)}
              className="rounded-lg cursor-pointer bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              + Abrir Números
            </button>
          </div>
        </div>
        {alert && (
          <div
            className={`fixed right-5 top-5 z-[200] flex items-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-lg ${alertTipo === "success"
              ? "bg-emerald-500"
              : "bg-red-500"
              }`}
          >
            <span className="text-lg">
              {alertTipo === "success" ? "✓" : "!"}
            </span>

            <span>{alert}</span>
          </div>
        )}
        {quantidadeRifa !== null && (
          <div className="mt-5">
            <div className="mb-3">
              <h3 className="text-sm font-bold text-slate-800">
                Números disponíveis
              </h3>
              <p className="text-xs text-slate-500">
                {quantidadeRifa} números criados
              </p>
            </div>
            <div className="flex max-h-[400px] flex-wrap gap-4 overflow-y-auto rounded-xl bg-slate-50 p-4">
              {Array.from(
                { length: quantidadeRifa },
                (_, index) => (
                  <button
                    key={index}
                    type="button"
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-xs font-bold text-white transition hover:scale-105 hover:bg-emerald-600"
                  >
                    {String(index + 1).padStart(3, "0")}
                  </button>
                )
              )}
            </div>
          </div>
        )}
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
              {numerosPaginados.map((item) => {
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
                const corStatus =
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
                        {String(item.numero).padStart(3, "0")}
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
                        className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold ${corStatus}`}
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
                        disabled={!disponivel}
                        onClick={() => {
                          if (disponivel) {
                            setNumeroSelecionado(item.numero);
                          }
                        }}
                        className={`rounded-lg px-4 py-2 cursor-pointer text-xs font-semibold transition ${disponivel
                          ? selecionado
                            ? "bg-teal-600 text-white"
                            : "bg-teal-600 text-white hover:bg-teal-700"
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
              })}
            </tbody>
          </table>
        </div>
        <div className="flex flex-col gap-4 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-slate-500">
            Mostrando{" "}
            <strong className="text-slate-700">
              {numeros.length === 0
                ? 0
                : primeiroNumero + 1}
            </strong>
            {" "}até{" "}
            <strong className="text-slate-700">
              {Math.min(
                ultimoNumero,
                numeros.length
              )}
            </strong>
            {" "}de{" "}
            <strong className="text-slate-700">
              {numeros.length}
            </strong>
            {" "}números
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                setPagina((p) =>
                  Math.max(p - 1, 1)
                )
              }
              disabled={pagina === 1}
              className="rounded-lg cursor-pointer border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>
            {Array.from(
              {
                length: totalPaginas,
              },
              (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() =>
                    setPagina(i + 1)
                  }
                  className={`h-9 min-w-9 rounded-lg cursor-pointer px-3 text-sm font-medium ${pagina === i + 1
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
                  Math.min(
                    p + 1,
                    totalPaginas
                  )
                )
              }
              disabled={
                pagina === totalPaginas ||
                totalPaginas === 0
              }
              className="rounded-lg cursor-pointer border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        </div>
      </section>
      {numeroSelecionado !== null && (
        <div className="fixed bottom-5 left-1/2 z-40 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-2xl border border-teal-200 bg-white p-4 shadow-2xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-medium text-slate-500">
                Número selecionado
              </p>
              <p className="text-xl font-bold text-teal-600">
                {String(numeroSelecionado).padStart(3, "0")}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setNumeroSelecionado(null)
                }
                className="rounded-lg cursor-pointer border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-red -50"
              >
                Cancelar
              </button>
              <button
                type="button"
                className="rounded-lg cursor-pointer bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalSorteioAberto && (
        <div
          className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onClick={() => {
            if (!sorteando) {
              setModalSorteioAberto(false);
            }
          }}
        >
          <div
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* CABEÇALHO */}
            <div className="relative border-b border-slate-100 px-6 py-5">

              <button
                type="button"
                onClick={() => {
                  if (!sorteando) {
                    setModalSorteioAberto(false);
                  }
                }}
                className="absolute right-4 top-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
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

            {/* CONTEÚDO */}
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
                /* RESULTADO */
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
                      {String(ganhador.numero).padStart(3, "0")}
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

            {/* RODAPÉ */}
            <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4">

              {!ganhador ? (
                <>
                  <button
                    type="button"
                    disabled={sorteando}
                    onClick={() => setModalSorteioAberto(false)}
                    className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="button"
                    disabled={sorteando || estatisticas.pagos === 0}
                    onClick={sortearRifa}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
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

      {modalAberto && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModalAberto(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5">
              <h2 className="mb-0 text-lg font-bold text-slate-800">
                Abrir nova rifa
              </h2>
              <p className="mt-0 text-sm text-slate-500">
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
                value={quantidadeNumeros}
                onChange={(e) =>
                  setQuantidadeNumeros(e.target.value)
                }
                placeholder="Ex: 100"
                autoFocus
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setModalAberto(false);
                  setQuantidadeNumeros("");
                }}
                className="rounded-lg cursor-pointer border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={abrirRifa}
                disabled={
                  !quantidadeNumeros ||
                  Number(quantidadeNumeros) <= 0
                }
                className="rounded-lg cursor-pointer bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Adicionar Números
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}