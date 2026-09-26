"use client";

import {
  Archive,
  ArrowRight,
  CheckCircle2,
  Clock3,
  Headphones,
  Inbox,
  MessageCircle,
  MoreVertical,
  Phone,
  Plus,
  Search,
  Send,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type StatusAtendimento =
  | "aberto"
  | "andamento"
  | "aguardando"
  | "encerrado";

type Atendimento = {
  id: number;
  protocolo: string;
  nome: string;
  telefone: string;
  assunto: string;
  ultimaMensagem: string;
  horario: string;
  status: StatusAtendimento;
  mensagens: {
    id: number;
    remetente: "cliente" | "atendente";
    texto: string;
    horario: string;
  }[];
};

const ATENDIMENTOS_INICIAIS: Atendimento[] = [
  {
    id: 1,
    protocolo: "ATD-20260921-001",
    nome: "Carlos Eduardo",
    telefone: "(11) 99872-4512",
    assunto: "Problema durante a viagem",
    ultimaMensagem: "Preciso de ajuda com uma cobrança.",
    horario: "03:18",
    status: "andamento",
    mensagens: [
      {
        id: 1,
        remetente: "cliente",
        texto:
          "Olá, tive um problema com uma cobrança da minha última viagem.",
        horario: "03:14",
      },
      {
        id: 2,
        remetente: "atendente",
        texto:
          "Olá, Carlos. Vou verificar o que aconteceu para você.",
        horario: "03:15",
      },
      {
        id: 3,
        remetente: "cliente",
        texto: "Preciso de ajuda com uma cobrança.",
        horario: "03:18",
      },
    ],
  },
  {
    id: 2,
    protocolo: "ATD-20260921-002",
    nome: "Mariana Santos",
    telefone: "(11) 98745-2310",
    assunto: "Objeto perdido",
    ultimaMensagem: "Deixei meu celular no veículo.",
    horario: "03:09",
    status: "aguardando",
    mensagens: [
      {
        id: 1,
        remetente: "cliente",
        texto: "Acredito que deixei meu celular no carro.",
        horario: "03:04",
      },
      {
        id: 2,
        remetente: "atendente",
        texto:
          "Vou verificar as informações da sua viagem.",
        horario: "03:06",
      },
      {
        id: 3,
        remetente: "cliente",
        texto: "Deixei meu celular no veículo.",
        horario: "03:09",
      },
    ],
  },
  {
    id: 3,
    protocolo: "ATD-20260921-003",
    nome: "Rafael Oliveira",
    telefone: "(11) 97654-9821",
    assunto: "Cancelamento de viagem",
    ultimaMensagem: "Gostaria de cancelar minha solicitação.",
    horario: "02:57",
    status: "aberto",
    mensagens: [
      {
        id: 1,
        remetente: "cliente",
        texto: "Gostaria de cancelar minha solicitação.",
        horario: "02:57",
      },
    ],
  },
  {
    id: 4,
    protocolo: "ATD-20260920-184",
    nome: "Fernanda Alves",
    telefone: "(11) 96542-7788",
    assunto: "Pagamento",
    ultimaMensagem: "Obrigado pelo atendimento.",
    horario: "Ontem",
    status: "encerrado",
    mensagens: [
      {
        id: 1,
        remetente: "cliente",
        texto: "Meu pagamento não foi identificado.",
        horario: "Ontem 18:41",
      },
      {
        id: 2,
        remetente: "atendente",
        texto:
          "Verifiquei o pagamento e ele já foi identificado no sistema.",
        horario: "Ontem 18:47",
      },
      {
        id: 3,
        remetente: "cliente",
        texto: "Obrigado pelo atendimento.",
        horario: "Ontem 18:49",
      },
    ],
  },
];

const ATENDENTES = [
  "Atendimento Geral",
  "Suporte Financeiro",
  "Suporte ao Motorista",
  "Suporte ao Passageiro",
  "Supervisão",
];

function statusLabel(status: StatusAtendimento) {
  switch (status) {
    case "aberto":
      return "Novo";

    case "andamento":
      return "Em andamento";

    case "aguardando":
      return "Aguardando";

    case "encerrado":
      return "Encerrado";
  }
}

function statusClass(status: StatusAtendimento) {
  switch (status) {
    case "aberto":
      return "bg-blue-50 text-blue-700";

    case "andamento":
      return "bg-emerald-50 text-emerald-700";

    case "aguardando":
      return "bg-amber-50 text-amber-700";

    case "encerrado":
      return "bg-slate-100 text-slate-500";
  }
}

export default function AtendimentoPage() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>(
    ATENDIMENTOS_INICIAIS
  );

  const [selecionadoId, setSelecionadoId] = useState<number>(
    ATENDIMENTOS_INICIAIS[0]?.id ?? 0
  );

  const [busca, setBusca] = useState("");

  const [filtro, setFiltro] = useState<
    "todos" | StatusAtendimento
  >("todos");

  const [mensagem, setMensagem] = useState("");

  const [mostrarTransferencia, setMostrarTransferencia] =
    useState(false);

  const [mostrarNovo, setMostrarNovo] = useState(false);

  const [mostrarMenuSituacao, setMostrarMenuSituacao] =
    useState(false);

  const [novoNome, setNovoNome] = useState("");
  const [novoTelefone, setNovoTelefone] = useState("");
  const [novoAssunto, setNovoAssunto] = useState("");

  const selecionado = atendimentos.find(
    (item) => item.id === selecionadoId
  );

  const filtrados = useMemo(() => {
    return atendimentos.filter((item) => {
      const texto =
        `${item.nome} ${item.protocolo} ${item.assunto} ${item.telefone}`.toLowerCase();

      const correspondeBusca = texto.includes(
        busca.toLowerCase()
      );

      const correspondeFiltro =
        filtro === "todos" || item.status === filtro;

      return correspondeBusca && correspondeFiltro;
    });
  }, [atendimentos, busca, filtro]);

  const emAndamento = atendimentos.filter(
    (item) => item.status === "andamento"
  ).length;

  const aguardando = atendimentos.filter(
    (item) => item.status === "aguardando"
  ).length;

  const encerrados = atendimentos.filter(
    (item) => item.status === "encerrado"
  ).length;

  useEffect(() => {
    if (!mostrarMenuSituacao) return;

    function fecharMenu(event: MouseEvent) {
      const target = event.target as HTMLElement;

      if (!target.closest("[data-menu-situacao]")) {
        setMostrarMenuSituacao(false);
      }
    }

    document.addEventListener("mousedown", fecharMenu);

    return () => {
      document.removeEventListener(
        "mousedown",
        fecharMenu
      );
    };
  }, [mostrarMenuSituacao]);

  useEffect(() => {
    function handleKeyboard(event: KeyboardEvent) {
      if (!selecionado) return;

      if (
        event.ctrlKey &&
        event.key.toLowerCase() === "g"
      ) {
        event.preventDefault();
        recolocarNaFila();
      }

      if (
        event.ctrlKey &&
        event.key.toLowerCase() === "e"
      ) {
        event.preventDefault();
        finalizarConversa();
      }

      if (
        event.ctrlKey &&
        event.key.toLowerCase() === "u"
      ) {
        event.preventDefault();
        abrirTransferencia();
      }
    }

    document.addEventListener(
      "keydown",
      handleKeyboard
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyboard
      );
    };
  }, [selecionado]);

  function enviarMensagem() {
    if (!mensagem.trim() || !selecionado) return;

    const textoMensagem = mensagem.trim();

    setAtendimentos((atual) =>
      atual.map((item) => {
        if (item.id !== selecionado.id) return item;

        return {
          ...item,
          status: "andamento",
          ultimaMensagem: textoMensagem,
          horario: "Agora",
          mensagens: [
            ...item.mensagens,
            {
              id: Date.now(),
              remetente: "atendente",
              texto: textoMensagem,
              horario: "Agora",
            },
          ],
        };
      })
    );

    setMensagem("");
  }

  function encerrarAtendimento() {
    if (!selecionado) return;

    setAtendimentos((atual) =>
      atual.map((item) =>
        item.id === selecionado.id
          ? {
              ...item,
              status: "encerrado",
              ultimaMensagem:
                "Atendimento encerrado.",
              horario: "Agora",
            }
          : item
      )
    );
  }

  function recolocarNaFila() {
    if (!selecionado) return;

    setAtendimentos((atual) =>
      atual.map((item) =>
        item.id === selecionado.id
          ? {
              ...item,
              status: "aguardando",
              ultimaMensagem:
                "Atendimento recolocado na fila.",
              horario: "Agora",
            }
          : item
      )
    );

    setMostrarMenuSituacao(false);
  }

  function arquivarConversa() {
    if (!selecionado) return;

    setAtendimentos((atual) =>
      atual.map((item) =>
        item.id === selecionado.id
          ? {
              ...item,
              status: "encerrado",
              ultimaMensagem:
                "Conversa arquivada.",
              horario: "Agora",
            }
          : item
      )
    );

    setMostrarMenuSituacao(false);
  }

  function finalizarConversa() {
    if (!selecionado) return;

    setAtendimentos((atual) =>
      atual.map((item) =>
        item.id === selecionado.id
          ? {
              ...item,
              status: "encerrado",
              ultimaMensagem:
                "Atendimento finalizado.",
              horario: "Agora",
            }
          : item
      )
    );

    setMostrarMenuSituacao(false);
  }

  function abrirTransferencia() {
    setMostrarMenuSituacao(false);
    setMostrarTransferencia(true);
  }

  function criarAtendimento() {
    if (!novoNome.trim() || !novoAssunto.trim()) return;

    const novo: Atendimento = {
      id: Date.now(),
      protocolo: `ATD-${new Date()
        .toISOString()
        .slice(0, 10)
        .replaceAll("-", "")}-${String(
        atendimentos.length + 1
      ).padStart(3, "0")}`,
      nome: novoNome.trim(),
      telefone:
        novoTelefone.trim() || "Não informado",
      assunto: novoAssunto.trim(),
      ultimaMensagem:
        "Novo atendimento iniciado.",
      horario: "Agora",
      status: "aberto",
      mensagens: [],
    };

    setAtendimentos((atual) => [novo, ...atual]);

    setSelecionadoId(novo.id);

    setNovoNome("");
    setNovoTelefone("");
    setNovoAssunto("");

    setMostrarNovo(false);
  }

  function transferirAtendimento(nome: string) {
    if (!selecionado) return;

    setAtendimentos((atual) =>
      atual.map((item) =>
        item.id === selecionado.id
          ? {
              ...item,
              ultimaMensagem: `Atendimento transferido para ${nome}.`,
              status: "aguardando",
              horario: "Agora",
            }
          : item
      )
    );

    setMostrarTransferencia(false);
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e8f7f3]">
                  <Headphones
                    size={24}
                    className="text-[#149C8B]"
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    Central de Atendimento
                  </p>

                  <h1 className="text-2xl font-bold text-white sm:text-3xl">
                    Atendimento
                  </h1>
                </div>
              </div>

              <p className="mt-1.5 max-w-2xl text-sm text-white/75">
                Gerencie conversas, acompanhe atendimentos e
                ofereça suporte aos passageiros e motoristas da
                Maylon.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setMostrarNovo(true)}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#149C8B] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#118777]"
            >
              <Plus size={18} />
              Novo Atendimento
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Atendimentos em Andamento
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {emAndamento}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50">
                <MessageCircle
                  size={21}
                  className="text-emerald-600"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Aguardando Resposta
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {aguardando}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                <Clock3
                  size={21}
                  className="text-amber-600"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Histórico de Conversas
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {encerrados}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100">
                <Archive
                  size={21}
                  className="text-slate-600"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500">
                  Total de Atendimentos
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {atendimentos.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e8f7f3]">
                <UsersRound
                  size={21}
                  className="text-[#149C8B]"
                />
              </div>
            </div>
          </div>
        </section>

        <section className="grid min-h-[850px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm lg:grid-cols-[370px_1fr]">
          <aside className="border-b border-slate-100 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-100 p-4">
              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={busca}
                  onChange={(event) =>
                    setBusca(event.target.value)
                  }
                  placeholder="Buscar atendimento..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-[#149C8B] focus:bg-white focus:ring-2 focus:ring-[#149C8B]/10"
                />
              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
                {[
                  ["todos", "Todos"],
                  ["aberto", "Novos"],
                  ["andamento", "Em andamento"],
                  ["aguardando", "Aguardando"],
                  ["encerrado", "Histórico"],
                ].map(([valor, label]) => (
                  <button
                    key={valor}
                    type="button"
                    onClick={() =>
                      setFiltro(
                        valor as
                          | "todos"
                          | StatusAtendimento
                      )
                    }
                    className={`cursor-pointer whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${
                      filtro === valor
                        ? "bg-[#e8f7f3] text-[#149C8B]"
                        : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="max-h-[570px] overflow-y-auto">
              {filtrados.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageCircle
                    size={32}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm font-semibold text-slate-600">
                    Nenhum atendimento encontrado
                  </p>
                </div>
              ) : (
                filtrados.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelecionadoId(item.id);
                      setMostrarMenuSituacao(false);
                    }}
                    className={`w-full cursor-pointer border-b border-slate-100 p-4 text-left transition ${
                      selecionadoId === item.id
                        ? "bg-[#e8f7f3]"
                        : "hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#149C8B] text-sm font-bold text-white">
                        {item.nome
                          .split(" ")
                          .slice(0, 2)
                          .map((nome) => nome[0])
                          .join("")
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="truncate text-sm font-bold text-slate-800">
                            {item.nome}
                          </p>

                          <span className="shrink-0 text-[11px] text-slate-400">
                            {item.horario}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-xs font-medium text-slate-500">
                          {item.assunto}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-400">
                          {item.ultimaMensagem}
                        </p>

                        <span
                          className={`mt-2 inline-flex rounded-full px-2 py-1 text-[10px] font-bold ${statusClass(
                            item.status
                          )}`}
                        >
                          {statusLabel(item.status)}
                        </span>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </aside>

          <div className="flex min-h-[650px] flex-col">
            {selecionado ? (
              <>
                <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#149C8B] text-sm font-bold text-white">
                      {selecionado.nome
                        .split(" ")
                        .slice(0, 2)
                        .map((item) => item[0])
                        .join("")
                        .toUpperCase()}
                    </div>

                    <div>
                      <h2 className="text-sm font-bold text-slate-800">
                        {selecionado.nome}
                      </h2>

                      <div className="mt-0 flex flex-wrap items-center gap-2">
                        <span className="text-xs text-slate-400">
                          {selecionado.protocolo}
                        </span>

                        <span className="text-slate-300">
                          •
                        </span>

                        <span
                          className={`rounded-full px-2 py-1 text-[10px] font-bold ${statusClass(
                            selecionado.status
                          )}`}
                        >
                          {statusLabel(
                            selecionado.status
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setMostrarTransferencia(true)
                      }
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                    >
                      <ArrowRight size={15} />
                      Transferir
                    </button>

                    {selecionado.status !==
                      "encerrado" && (
                      <button
                        type="button"
                        onClick={
                          encerrarAtendimento
                        }
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                      >
                        <CheckCircle2
                          size={15}
                        />
                        Encerrar
                      </button>
                    )}

                    <div
                      className="relative"
                      data-menu-situacao
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setMostrarMenuSituacao(
                            (valor) => !valor
                          )
                        }
                        className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition ${
                          mostrarMenuSituacao
                            ? "border-[#149C8B] bg-[#e8f7f3] text-[#149C8B]"
                            : "border-slate-200 text-slate-500 hover:bg-slate-50"
                        }`}
                      >
                        <MoreVertical
                          size={17}
                        />
                      </button>

                      {mostrarMenuSituacao && (
                        <div className="absolute right-0 top-11 z-50 w-[250px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                          <div className="border-b border-slate-100 px-4 py-3">
                            <p className="text-sm font-semibold text-slate-500">
                              Mudar situação
                            </p>
                          </div>

                          <div className="p-1.5">
                            <button
                              type="button"
                              onClick={
                                recolocarNaFila
                              }
                              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                            >
                              <Inbox
                                size={18}
                                strokeWidth={
                                  1.8
                                }
                                className="text-slate-600"
                              />

                              <span className="flex-1 text-sm font-medium text-slate-700">
                                Recolocar na fila
                              </span>

                              <span className="text-xs text-slate-400">
                                Ctrl+G
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={
                                arquivarConversa
                              }
                              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                            >
                              <Archive
                                size={18}
                                strokeWidth={
                                  1.8
                                }
                                className="text-slate-600"
                              />

                              <span className="flex-1 text-sm font-medium text-slate-700">
                                Arquivar conversa
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={
                                finalizarConversa
                              }
                              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                            >
                              <CheckCircle2
                                size={18}
                                strokeWidth={
                                  1.8
                                }
                                className="text-slate-600"
                              />

                              <span className="flex-1 text-sm font-medium text-slate-700">
                                Finalizar conversa
                              </span>

                              <span className="text-xs text-slate-400">
                                Ctrl+E
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={
                                abrirTransferencia
                              }
                              className="flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left transition hover:bg-slate-50"
                            >
                              <UserRound
                                size={18}
                                strokeWidth={
                                  1.8
                                }
                                className="text-slate-600"
                              />

                              <span className="flex-1 text-sm font-medium text-slate-700">
                                Transferir conversa
                              </span>

                              <span className="text-xs text-slate-400">
                                Ctrl+U
                              </span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/70 px-5 py-3">
                  <Phone
                    size={15}
                    className="text-slate-400"
                  />

                  <span className="text-xs text-slate-500">
                    {selecionado.telefone}
                  </span>

                  <span className="text-slate-300">
                    •
                  </span>

                  <span className="text-xs text-slate-500">
                    {selecionado.assunto}
                  </span>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto bg-[#f8fafc] p-5">
                  {selecionado.mensagens.length ===
                  0 ? (
                    <div className="flex h-full min-h-[350px] items-center justify-center text-center">
                      <div>
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f7f3]">
                          <MessageCircle
                            size={25}
                            className="text-[#149C8B]"
                          />
                        </div>

                        <p className="mt-3 text-sm font-semibold text-slate-600">
                          Inicie o atendimento
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Envie uma mensagem para
                          começar a conversa.
                        </p>
                      </div>
                    </div>
                  ) : (
                    selecionado.mensagens.map(
                      (item) => (
                        <div
                          key={item.id}
                          className={`flex ${
                            item.remetente ===
                            "atendente"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${
                              item.remetente ===
                              "atendente"
                                ? "rounded-br-md bg-[#149C8B] text-white"
                                : "rounded-bl-md bg-white text-slate-700"
                            }`}
                          >
                            <p className="text-sm leading-6">
                              {item.texto}
                            </p>

                            <p
                              className={`mt-1 text-[10px] ${
                                item.remetente ===
                                "atendente"
                                  ? "text-white/70"
                                  : "text-slate-400"
                              }`}
                            >
                              {item.horario}
                            </p>
                          </div>
                        </div>
                      )
                    )
                  )}
                </div>

                {selecionado.status !==
                "encerrado" ? (
                  <div className="border-t border-slate-100 bg-white p-4">
                    <div className="flex items-end gap-3">
                      <textarea
                        value={mensagem}
                        onChange={(event) =>
                          setMensagem(
                            event.target.value
                          )
                        }
                        onKeyDown={(event) => {
                          if (
                            event.key ===
                              "Enter" &&
                            !event.shiftKey
                          ) {
                            event.preventDefault();
                            enviarMensagem();
                          }
                        }}
                        rows={2}
                        placeholder="Digite sua mensagem..."
                        className="min-h-[52px] flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#149C8B] focus:bg-white focus:ring-2 focus:ring-[#149C8B]/10"
                      />

                      <button
                        type="button"
                        onClick={enviarMensagem}
                        className="flex h-[52px] w-[52px] shrink-0 cursor-pointer items-center justify-center rounded-xl bg-[#149C8B] text-white transition hover:bg-[#118777]"
                      >
                        <Send size={18} />
                      </button>
                    </div>

                    <p className="mt-2 text-[11px] text-slate-400">
                      Pressione Enter para enviar •
                      Shift + Enter para nova linha
                    </p>
                  </div>
                ) : (
                  <div className="border-t border-slate-100 bg-white p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-500">
                      <CheckCircle2 size={17} />
                      Atendimento encerrado
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center p-8 text-center">
                <div>
                  <MessageCircle
                    size={40}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-4 font-semibold text-slate-600">
                    Selecione um atendimento
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    Escolha uma conversa para
                    visualizar o atendimento.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      {mostrarNovo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Novo Atendimento
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Inicie um novo atendimento manualmente.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMostrarNovo(false)
                }
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nome
                </label>

                <input
                  value={novoNome}
                  onChange={(event) =>
                    setNovoNome(
                      event.target.value
                    )
                  }
                  placeholder="Nome do cliente"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#149C8B] focus:bg-white focus:ring-2 focus:ring-[#149C8B]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Telefone
                </label>

                <input
                  value={novoTelefone}
                  onChange={(event) =>
                    setNovoTelefone(
                      event.target.value
                    )
                  }
                  placeholder="(00) 00000-0000"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#149C8B] focus:bg-white focus:ring-2 focus:ring-[#149C8B]/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Assunto
                </label>

                <input
                  value={novoAssunto}
                  onChange={(event) =>
                    setNovoAssunto(
                      event.target.value
                    )
                  }
                  placeholder="Motivo do atendimento"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-[#149C8B] focus:bg-white focus:ring-2 focus:ring-[#149C8B]/10"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-100 p-5">
              <button
                type="button"
                onClick={() =>
                  setMostrarNovo(false)
                }
                className="cursor-pointer rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={criarAtendimento}
                disabled={
                  !novoNome.trim() ||
                  !novoAssunto.trim()
                }
                className="cursor-pointer rounded-xl bg-[#149C8B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#118777] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Criar Atendimento
              </button>
            </div>
          </div>
        </div>
      )}

      {mostrarTransferencia && selecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  Transferir Atendimento
                </h2>

                <p className="mt-1 text-xs text-slate-400">
                  Selecione o setor responsável pelo
                  atendimento.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setMostrarTransferencia(false)
                }
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2 p-5">
              {ATENDENTES.map((nome) => (
                <button
                  key={nome}
                  type="button"
                  onClick={() =>
                    transferirAtendimento(nome)
                  }
                  className="flex w-full cursor-pointer items-center justify-between rounded-xl border border-slate-200 p-4 text-left transition hover:border-[#149C8B] hover:bg-[#e8f7f3]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                      <UserRound
                        size={18}
                        className="text-slate-500"
                      />
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        {nome}
                      </p>

                      <p className="mt-0.5 text-xs text-slate-400">
                        Atendimento disponível
                      </p>
                    </div>
                  </div>

                  <ArrowRight
                    size={17}
                    className="text-slate-400"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}