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
  Play,
  Plus,
  Search,
  Send,
  Star,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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
};

type Mensagem = {
  id: number;
  remetente: "cliente" | "atendente";
  texto: string;
  horario: string;
};

type HuggyChat = {
  id: number;
  situation?: string | null;
  unread?: string | number | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  attendedAt?: string | null;
  closedAt?: string | null;
  channel?: string | null;
  lastMessage?: { text?: string | null; sendAt?: string | null } | null;
  chatCustomer?: {
    id?: number;
    name?: string | null;
    mobile?: string | null;
    phone?: string | null;
    email?: string | null;
    photo?: string | null;
  } | null;
};

type HuggyMessage = {
  id: number;
  text?: string | null;
  senderType?: string | null;
  sendAt?: string | null;
  type?: string | null;
  file?: string | null;
};

type Departamento = {
  id: number;
  name: string;
};

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

function channelLabel(channel?: string | null) {
  switch (channel) {
    case "whatsapp":
      return "WhatsApp";

    case "widget":
      return "Chat online";

    case "email":
      return "E-mail";

    case "telegram-bot":
      return "Telegram";

    case "messenger":
      return "Messenger";

    default:
      return channel || "Conversa";
  }
}

function tipoMensagemLabel(type: string) {
  switch (type) {
    case "image":
      return "Imagem";

    case "audio":
      return "Áudio";

    case "video":
      return "Vídeo";

    case "document":
      return "Documento";

    case "email":
      return "E-mail";

    case "sms":
      return "SMS";

    default:
      return "Arquivo";
  }
}

function formatHorario(value?: string | null) {
  if (!value) return "";

  const date = new Date(value.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) return "";

  const agora = new Date();

  if (date.toDateString() === agora.toDateString()) {
    return date.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const ontem = new Date(agora);
  ontem.setDate(agora.getDate() - 1);

  if (date.toDateString() === ontem.toDateString()) {
    return "Ontem";
  }

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
}

function sendAtTs(value?: string | null): number {
  if (!value) return 0;

  const t = new Date(value.replace(" ", "T")).getTime();
  return Number.isNaN(t) ? 0 : t;
}

function mapSituationToStatus(chat: HuggyChat): StatusAtendimento {
  const situation = chat.situation;

  if (situation === "filed" || chat.closedAt) {
    return "encerrado";
  }

  if (situation === "wait_for_chat" || situation === "auto") {
    return "aberto";
  }

  if (situation === "blocked" || situation === "finishing") {
    return "aguardando";
  }

  if (situation === "in_chat") {
    const unread = Number(chat.unread ?? 0);
    return unread > 0 ? "aguardando" : "andamento";
  }

  return "andamento";
}

function mapChat(chat: HuggyChat): Atendimento {
  const nome = chat.chatCustomer?.name?.trim() || "Cliente";
  const telefone =
    chat.chatCustomer?.mobile?.trim() ||
    chat.chatCustomer?.phone?.trim() ||
    "Não informado";
  const ultimaMensagem = chat.lastMessage?.text?.trim() || "";

  return {
    id: chat.id,
    protocolo: `#${chat.id}`,
    nome,
    telefone,
    assunto: channelLabel(chat.channel),
    ultimaMensagem,
    horario: formatHorario(chat.updatedAt ?? chat.lastMessage?.sendAt),
    status: mapSituationToStatus(chat),
  };
}

function mapMessage(msg: HuggyMessage): Mensagem {
  let texto = msg.text ?? "";

  if (!texto && msg.type && msg.type !== "text") {
    texto = tipoMensagemLabel(msg.type);
  }

  return {
    id: msg.id,
    remetente: msg.senderType === "agent" ? "atendente" : "cliente",
    texto,
    horario: formatHorario(msg.sendAt),
  };
}

export default function AtendimentoPage() {
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>(
    []
  );

  const [selecionadoId, setSelecionadoId] = useState<number>(0);

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

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [erroAcao, setErroAcao] = useState("");

  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [carregandoMensagens, setCarregandoMensagens] =
    useState(false);

  const [departamentos, setDepartamentos] = useState<Departamento[]>(
    []
  );
  const [carregandoDepartamentos, setCarregandoDepartamentos] =
    useState(false);

  const selecionadoIdRef = useRef<number>(0);
  const mensagensRef = useRef<HTMLDivElement>(null);

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

  async function carregarAtendimentos() {
    try {
      const res = await fetch("/api/huggy/chats", {
        cache: "no-store",
      });

      if (!res.ok) {
        let detail = "";
        try {
          const body = await res.json();
          detail = body?.error || body?.detail || "";
        } catch {
          detail = "";
        }
        setErro(
          detail ||
          `Não foi possível carregar os atendimentos (HTTP ${res.status}).`
        );
        return;
      }

      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];

      setAtendimentos(
        (lista as HuggyChat[]).map((chat) => mapChat(chat))
      );
      setErro("");
    } catch (error) {
      console.error(error);
      setErro(
        "Falha ao conectar com a central de atendimento. Verifique as credenciais Huggy."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function carregarMensagens(chatId: number) {
    setCarregandoMensagens(true);

    try {
      const res = await fetch(
        `/api/huggy/chats/${chatId}/messages`,
        { cache: "no-store" }
      );

      if (!res.ok) return;

      const data = await res.json();
      const lista = Array.isArray(data) ? data : [];

      const mensagens = (lista as HuggyMessage[])
        .slice()
        .sort((a, b) => sendAtTs(a.sendAt) - sendAtTs(b.sendAt))
        .map((msg) => mapMessage(msg));

      setMensagens(mensagens);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregandoMensagens(false);
    }
  }

  function selecionarAtendimento(item: Atendimento) {
    setSelecionadoId(item.id);
    selecionadoIdRef.current = item.id;
    setMostrarMenuSituacao(false);
    setMensagens([]);

    carregarMensagens(item.id);

    if (
      item.status === "andamento" ||
      item.status === "aguardando"
    ) {
      fetch(`/api/huggy/chats/${item.id}/read`, {
        method: "PUT",
      }).catch(() => { });
    }
  }

  useEffect(() => {
    carregarAtendimentos();

    const interval = setInterval(() => {
      carregarAtendimentos();

      if (selecionadoIdRef.current) {
        carregarMensagens(selecionadoIdRef.current);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    mensagensRef.current?.scrollTo({
      top: mensagensRef.current.scrollHeight,
      behavior: "auto",
    });
  }, [mensagens]);

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

  async function enviarMensagem() {
    if (!mensagem.trim() || !selecionado) return;

    const textoMensagem = mensagem.trim();

    setMensagens((atual) => [
      ...atual,
      {
        id: Date.now(),
        remetente: "atendente",
        texto: textoMensagem,
        horario: "Agora",
      },
    ]);

    setAtendimentos((atual) =>
      atual.map((item) =>
        item.id === selecionado.id
          ? {
            ...item,
            status: "andamento",
            ultimaMensagem: textoMensagem,
            horario: "Agora",
          }
          : item
      )
    );

    setMensagem("");

    try {
      const res = await fetch(
        `/api/huggy/chats/${selecionado.id}/messages`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: textoMensagem }),
        }
      );

      if (!res.ok) {
        setErroAcao("Não foi possível enviar a mensagem.");
      }
    } catch (error) {
      console.error(error);
      setErroAcao("Não foi possível enviar a mensagem.");
    }
  }

  async function encerrarAtendimento() {
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

    try {
      await fetch(`/api/huggy/chats/${selecionado.id}/close`, {
        method: "PUT",
      });

      await carregarAtendimentos();
    } catch (error) {
      console.error(error);
    }
  }

  async function recolocarNaFila() {
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

    try {
      await fetch(`/api/huggy/chats/${selecionado.id}/queue`, {
        method: "PUT",
      });

      await carregarAtendimentos();
    } catch (error) {
      console.error(error);
    }
  }

  async function arquivarConversa() {
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

    try {
      await fetch(`/api/huggy/chats/${selecionado.id}/close`, {
        method: "PUT",
      });

      await carregarAtendimentos();
    } catch (error) {
      console.error(error);
    }
  }

  async function finalizarConversa() {
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

    try {
      await fetch(`/api/huggy/chats/${selecionado.id}/close`, {
        method: "PUT",
      });

      await carregarAtendimentos();
    } catch (error) {
      console.error(error);
    }
  }

  async function iniciarAtendimento() {
    if (!selecionado) return;

    setErroAcao("");

    setAtendimentos((atual) =>
      atual.map((item) =>
        item.id === selecionado.id
          ? {
            ...item,
            status: "andamento",
            horario: "Agora",
          }
          : item
      )
    );

    try {
      const res = await fetch(
        `/api/huggy/chats/${selecionado.id}/assignToMe`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (!res.ok) {
        let detail = "";
        try {
          const body = await res.json();
          detail = body?.error || body?.detail || "";
        } catch {
          detail = "";
        }
        setErroAcao(
          detail ||
          `Não foi possível iniciar o atendimento (HTTP ${res.status}).`
        );
        await carregarAtendimentos();
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 700));
      await carregarAtendimentos();
      await carregarMensagens(selecionado.id);
    } catch (error) {
      console.error(error);
      setErroAcao("Falha ao iniciar o atendimento. Tente novamente.");
      await carregarAtendimentos();
    }
  }

  async function carregarDepartamentos() {
    setCarregandoDepartamentos(true);

    try {
      const res = await fetch("/api/huggy/departments/parents", {
        cache: "no-store",
      });

      if (!res.ok) return;

      const data = await res.json();
      setDepartamentos(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
    } finally {
      setCarregandoDepartamentos(false);
    }
  }

  function abrirTransferencia() {
    setMostrarMenuSituacao(false);
    setMostrarTransferencia(true);
    carregarDepartamentos();
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
    };

    setAtendimentos((atual) => [novo, ...atual]);

    setSelecionadoId(novo.id);
    setMensagens([]);

    setNovoNome("");
    setNovoTelefone("");
    setNovoAssunto("");

    setMostrarNovo(false);
  }

  async function transferirParaDepartamento(dept: Departamento) {
    if (!selecionado) return;

    setErroAcao("");

    setAtendimentos((atual) =>
      atual.map((item) =>
        item.id === selecionado.id
          ? {
            ...item,
            ultimaMensagem: `Atendimento transferido para ${dept.name}.`,
            status: "aguardando",
            horario: "Agora",
          }
          : item
      )
    );

    setMostrarTransferencia(false);

    try {
      const res = await fetch(
        `/api/huggy/chats/${selecionado.id}/department`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ department: dept.id }),
        }
      );

      if (!res.ok) {
        let detail = "";
        try {
          const body = await res.json();
          detail = body?.error || body?.detail || "";
        } catch {
          detail = "";
        }
        setErroAcao(
          detail ||
          "Não foi possível transferir o atendimento."
        );
        await carregarAtendimentos();
        return;
      }

      await carregarAtendimentos();
    } catch (error) {
      console.error(error);
      setErroAcao("Não foi possível transferir o atendimento.");
      await carregarAtendimentos();
    }
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

        {erroAcao && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
            {erroAcao}
          </div>
        )}

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
                  Pesquisa de Satisfação
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-800">
                  {encerrados}
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Pesquisas encerradas
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50">
                <Star
                  size={21}
                  className="text-amber-500"
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
                    className={`cursor-pointer whitespace-nowrap rounded-lg px-3 py-2 text-xs font-semibold transition ${filtro === valor
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
                    {carregando
                      ? "Carregando atendimentos..."
                      : erro
                        ? "Erro ao carregar atendimentos"
                        : "Nenhum atendimento encontrado"}
                  </p>

                  {!carregando && erro && (
                    <p className="mx-auto mt-2 max-w-[280px] text-xs text-slate-400">
                      {erro}
                    </p>
                  )}
                </div>
              ) : (
                filtrados.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      selecionarAtendimento(item);
                    }}
                    className={`w-full cursor-pointer border-b border-slate-100 p-4 text-left transition ${selecionadoId === item.id
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

          <div className="flex h-[850px] flex-col">
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
                    {selecionado.status === "aberto" ? (
                      <button
                        type="button"
                        onClick={iniciarAtendimento}
                        className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#149C8B] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#118777]"
                      >
                        <Play size={15} />
                        Iniciar Atendimento
                      </button>
                    ) : (
                      selecionado.status !== "encerrado" && (
                        <button
                          type="button"
                          onClick={abrirTransferencia}
                          className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50"
                        >
                          <ArrowRight size={15} />
                          Transferir
                        </button>
                      )
                    )}

                    {selecionado.status !==
                      "encerrado" &&
                      selecionado.status !==
                      "aberto" && (
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
                        className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition ${mostrarMenuSituacao
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

                <div
                  ref={mensagensRef}
                  className="flex-1 min-h-0 space-y-5 overflow-y-auto bg-[#f8fafc] p-5"
                >
                  {carregandoMensagens ? (
                    <div className="flex h-full min-h-[350px] items-center justify-center text-center">
                      <p className="text-sm text-slate-400">
                        Carregando conversa...
                      </p>
                    </div>
                  ) : mensagens.length === 0 ? (
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
                    mensagens.map((item) => (
                      <div
                        key={item.id}
                        className={`flex ${item.remetente ===
                            "atendente"
                            ? "justify-end"
                            : "justify-start"
                          }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 shadow-sm ${item.remetente ===
                              "atendente"
                              ? "rounded-br-md bg-[#149C8B] text-white"
                              : "rounded-bl-md bg-white text-slate-700"
                            }`}
                        >
                          <p className="text-sm leading-6">
                            {item.texto}
                          </p>

                          <p
                            className={`mt-1 text-[10px] ${item.remetente ===
                                "atendente"
                                ? "text-white/70"
                                : "text-slate-400"
                              }`}
                          >
                            {item.horario}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {selecionado.status === "encerrado" ? (
                  <div className="border-t border-slate-100 bg-white p-4 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm font-semibold text-slate-500">
                      <CheckCircle2 size={17} />
                      Atendimento encerrado
                    </div>
                  </div>
                ) : selecionado.status === "aberto" ? (
                  <div className="border-t border-slate-100 bg-white p-6 text-center">
                    <button
                      type="button"
                      onClick={iniciarAtendimento}
                      className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#149C8B] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#118777]"
                    >
                      <Play size={18} />
                      Iniciar Atendimento
                    </button>

                    <p className="mt-2 text-[11px] text-slate-400">
                      Pegue a conversa para começar a
                      responder.
                    </p>
                  </div>
                ) : (
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
              {carregandoDepartamentos ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  Carregando departamentos...
                </div>
              ) : departamentos.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  Nenhum departamento disponível.
                </div>
              ) : (
                departamentos.map((dept) => (
                  <button
                    key={dept.id}
                    type="button"
                    onClick={() =>
                      transferirParaDepartamento(dept)
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
                          {dept.name}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-400">
                          Departamento
                        </p>
                      </div>
                    </div>

                    <ArrowRight
                      size={17}
                      className="text-slate-400"
                    />
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
