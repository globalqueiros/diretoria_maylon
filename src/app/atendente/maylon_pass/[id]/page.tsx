"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CreditCard,
  Mail,
  Phone,
  Receipt,
  RefreshCw,
  ShieldCheck,
  AlertCircle,
  Hash,
  Pencil,
  X,
  Check,
} from "lucide-react";

type UsuarioMaylonPass = {
  id: number | string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string | number | boolean | null;
  plano?: string | null;
  valor?: number | string | null;
  created_at?: string | null;
  profile_image?: string | null;
};

type Fatura = {
  id: number | string;
  numero: string | null;
  descricao: string | null;
  valor: number | string | null;
  status: string | null;
  vencimento: string | null;
  pago_em: string | null;
  metodo: string | null;
  created_at: string | null;
};

type RespostaAPI = {
  usuarios?: Record<string, unknown>[];
  error?: string;
  mensagem?: string;
};

type RespostaFaturas = {
  faturas?: Record<string, unknown>[];
  data?: Record<string, unknown>[];
  error?: string;
  mensagem?: string;
};

function paraTexto(valor: unknown): string | null {
  if (valor === null || valor === undefined) return null;
  const resultado = String(valor).trim();
  return resultado || null;
}

function normalizarStatus(status: unknown): string {
  return String(status ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

// Compara textos ignorando acentos, maiúsculas e espaços repetidos
function normalizarNome(valor: unknown): string {
  return normalizarStatus(valor).replace(/\s+/g, " ");
}

type Pergunta = {
  id: "nome" | "email" | "telefone" | "id";
  rotulo: string;
  placeholder: string;
  esperado: string;
};

function somenteDigitos(valor?: string | null): string {
  return (valor ?? "").replace(/\D/g, "");
}

// Monta as perguntas possíveis com base nos dados que o usuário realmente tem
function montarPerguntas(usuario: UsuarioMaylonPass): Pergunta[] {
  const lista: Pergunta[] = [];

  const telefone = somenteDigitos(usuario.phone);
  if (telefone.length >= 4) {
    lista.push({
      id: "telefone",
      rotulo: "Quais são os 4 últimos dígitos do telefone atual?",
      placeholder: "Ex.: 9999",
      esperado: telefone.slice(-4),
    });
  }

  if (usuario.full_name?.trim()) {
    lista.push({
      id: "nome",
      rotulo: "Qual é o nome completo?",
      placeholder: "Ex.: Maria da Silva",
      esperado: normalizarNome(usuario.full_name),
    });
  }

  if (usuario.email?.trim()) {
    lista.push({
      id: "email",
      rotulo: "Qual é o e-mail atual do usuário?",
      placeholder: "Ex.: usuario@exemplo.com",
      esperado: normalizarNome(usuario.email),
    });
  }

  // Só entra se o usuário não tiver nenhum dos dados acima
  if (lista.length === 0) {
    lista.push({
      id: "id",
      rotulo: "Qual é o ID do usuário?",
      placeholder: "Ex.: 123",
      esperado: normalizarNome(usuario.id),
    });
  }

  return lista;
}

function respostaConfere(pergunta: Pergunta, resposta: string): boolean {
  if (pergunta.id === "telefone") {
    const digitos = somenteDigitos(resposta);
    return digitos.length === 4 && digitos === pergunta.esperado;
  }
  if (pergunta.id === "id") {
    return normalizarNome(resposta).replace(/^#/, "") === pergunta.esperado;
  }
  return normalizarNome(resposta) === pergunta.esperado;
}

function usuarioAtivo(usuario: UsuarioMaylonPass): boolean {
  return [
    "ativo", "active", "1", "true", "approved", "aprovado",
  ].includes(normalizarStatus(usuario.status));
}

function formatarMoeda(
  valor?: number | string | null
): string {
  if (valor === null || valor === undefined || valor === "") {
    return "—";
  }

  let numero: number;

  if (typeof valor === "number") {
    numero = valor;
  } else {
    let normalizado = valor.trim();

    if (normalizado.includes(",")) {
      normalizado = normalizado
        .replace(/\./g, "")
        .replace(",", ".");
    }

    numero = Number(normalizado);
  }

  if (!Number.isFinite(numero)) return "—";

  return numero.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarTelefone(valor?: string | null): string {
  if (!valor) return "Não informado";

  let digitos = valor.replace(/\D/g, "").replace(/^0+/, "");

  if (
    digitos.startsWith("55") &&
    (digitos.length === 12 || digitos.length === 13)
  ) {
    digitos = digitos.slice(2);
  }

  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(
      2, 7
    )}-${digitos.slice(7)}`;
  }

  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(
      2, 6
    )}-${digitos.slice(6)}`;
  }

  return valor.trim();
}

function telefoneCompleto(valor?: string | null): boolean {
  if (!valor) return false;

  let digitos = valor.replace(/\D/g, "").replace(/^0+/, "");

  if (
    digitos.startsWith("55") &&
    (digitos.length === 12 || digitos.length === 13)
  ) {
    digitos = digitos.slice(2);
  }

  return digitos.length === 10 || digitos.length === 11;
}

function camposIncompletos(
  usuario: UsuarioMaylonPass
): string[] {
  const faltando: string[] = [];

  if (!usuario.full_name?.trim()) faltando.push("Nome completo");
  if (!usuario.email?.trim()) faltando.push("E-mail");

  if (!usuario.phone?.trim()) {
    faltando.push("Telefone");
  } else if (!telefoneCompleto(usuario.phone)) {
    faltando.push("Telefone (incompleto)");
  }

  if (!usuario.plano?.trim()) faltando.push("Plano contratado");

  if (
    usuario.valor === null ||
    usuario.valor === undefined ||
    String(usuario.valor).trim() === ""
  ) {
    faltando.push("Valor do plano");
  }

  if (!usuario.created_at?.trim()) {
    faltando.push("Data de cadastro");
  }

  return faltando;
}

function formatarData(valor?: string | null): string {
  if (!valor) return "—";

  if (/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    const [ano, mes, dia] = valor.split("-");
    return `${dia}/${mes}/${ano}`;
  }

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";

  return data.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

function iniciais(nome?: string | null): string {
  const resultado = (nome ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join("");

  return resultado || "?";
}

function texto(valor?: string | null): string {
  return valor?.trim() || "Não informado";
}

function normalizarUsuario(
  r: Record<string, unknown>
): UsuarioMaylonPass {
  return {
    id: (r.id ?? r.user_id ?? "") as number | string,
    full_name: paraTexto(r.full_name ?? r.nome ?? r.name),
    email: paraTexto(r.email),
    phone: paraTexto(r.phone ?? r.telefone ?? r.celular),
    status: (r.status ?? null) as UsuarioMaylonPass["status"],
    plano: paraTexto(r.plano ?? r.plan ?? r.plan_name),
    valor: (r.valor ?? r.price ?? r.amount ?? null) as
      | number | string | null,
    created_at: paraTexto(r.created_at ?? r.criado_em),
    profile_image: paraTexto(
      r.profile_image ?? r.avatar ?? r.foto
    ),
  };
}

function normalizarFatura(
  r: Record<string, unknown>,
  index: number
): Fatura {
  return {
    id: (r.id ?? r.fatura_id ?? r.invoice_id ?? index) as
      | number | string,
    numero: paraTexto(
      r.numero ?? r.codigo ?? r.invoice_number ?? r.id
    ),
    descricao: paraTexto(
      r.descricao ?? r.description ?? r.plano ?? r.plan
    ),
    valor: (r.valor ?? r.amount ?? r.price ?? r.total ?? null) as
      | number | string | null,
    status: paraTexto(r.status),
    vencimento: paraTexto(
      r.vencimento ?? r.due_date ?? r.data_vencimento
    ),
    pago_em: paraTexto(
      r.pago_em ?? r.paid_at ?? r.data_pagamento
    ),
    metodo: paraTexto(
      r.metodo ?? r.metodo_pagamento ?? r.payment_method
    ),
    created_at: paraTexto(r.created_at ?? r.criado_em),
  };
}

function statusFatura(status?: string | null) {
  const s = normalizarStatus(status);

  if (
    ["pago", "paga", "paid", "approved", "aprovado"].includes(s)
  ) {
    return {
      rotulo: "Pago",
      classe: "bg-emerald-50 text-emerald-700",
      ponto: "bg-emerald-500",
    };
  }

  if (
    ["pendente", "pending", "aberto", "aberta", "open"].includes(s)
  ) {
    return {
      rotulo: "Pendente",
      classe: "bg-amber-50 text-amber-700",
      ponto: "bg-amber-500",
    };
  }

  if (
    ["vencido", "vencida", "atrasado", "atrasada", "overdue"].includes(s)
  ) {
    return {
      rotulo: "Vencida",
      classe: "bg-red-50 text-red-700",
      ponto: "bg-red-500",
    };
  }

  if (
    ["cancelado", "cancelada", "canceled", "cancelled"].includes(s)
  ) {
    return {
      rotulo: "Cancelada",
      classe: "bg-slate-100 text-slate-600",
      ponto: "bg-slate-400",
    };
  }

  return {
    rotulo: status?.trim() || "Não informado",
    classe: "bg-slate-100 text-slate-600",
    ponto: "bg-slate-400",
  };
}

export default function MaylonPassDetalhesPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;

  const [usuario, setUsuario] =
    useState<UsuarioMaylonPass | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");

  const [faturas, setFaturas] = useState<Fatura[]>([]);
  const [carregandoFaturas, setCarregandoFaturas] =
    useState(true);
  const [erroFaturas, setErroFaturas] = useState("");

  const [editandoTelefone, setEditandoTelefone] = useState(false);
  const [editandoEmail, setEditandoEmail] = useState(false);
  const [telefoneEditado, setTelefoneEditado] = useState("");
  const [emailEditado, setEmailEditado] = useState("");
  const [salvandoContato, setSalvandoContato] = useState(false);
  const [erroContato, setErroContato] = useState("");
  const [sucessoContato, setSucessoContato] = useState("");

  // Pergunta de segurança
  const [modalConfirmacao, setModalConfirmacao] = useState(false);
  const [respostaSeguranca, setRespostaSeguranca] = useState("");
  const [perguntaAtual, setPerguntaAtual] = useState<Pergunta | null>(null);
  const [erroModal, setErroModal] = useState("");

  const carregarUsuario = useCallback(
    async (manual = false) => {
      if (manual) {
        setAtualizando(true);
      } else {
        setCarregando(true);
      }

      setErro("");

      try {
        const response = await fetch("/api/maylon-pass", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        const dados: RespostaAPI = await response
          .json()
          .catch(() => ({}));

        if (!response.ok) {
          throw new Error(
            dados.error ||
              dados.mensagem ||
              "Não foi possível consultar os usuários."
          );
        }

        if (!Array.isArray(dados.usuarios)) {
          throw new Error(
            "A API não retornou uma lista válida de usuários."
          );
        }

        const encontrado = dados.usuarios
          .map(normalizarUsuario)
          .find((item) => String(item.id) === String(id));

        if (!encontrado) {
          setUsuario(null);
          throw new Error(
            `Nenhum usuário foi encontrado com o ID ${id}.`
          );
        }

        setUsuario(encontrado);
      } catch (e) {
        setErro(
          e instanceof Error
            ? e.message
            : "Ocorreu um erro ao carregar o usuário."
        );
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [id]
  );

  const carregarFaturas = useCallback(async () => {
    setCarregandoFaturas(true);
    setErroFaturas("");

    try {
      const response = await fetch(
        `/api/maylon-pass/faturas?usuario_id=${encodeURIComponent(id)}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        }
      );

      const dados = (await response
        .json()
        .catch(() => ({}))) as
        | RespostaFaturas
        | Record<string, unknown>[];

      if (!response.ok) {
        const resposta = dados as RespostaFaturas;
        throw new Error(
          resposta.error ||
            resposta.mensagem ||
            "Não foi possível consultar as faturas."
        );
      }

      let lista: Record<string, unknown>[] = [];

      if (Array.isArray(dados)) {
        lista = dados;
      } else {
        const resposta = dados as RespostaFaturas;

        if (Array.isArray(resposta.faturas)) {
          lista = resposta.faturas;
        } else if (Array.isArray(resposta.data)) {
          lista = resposta.data;
        }
      }

      setFaturas(lista.map(normalizarFatura));
    } catch (e) {
      setFaturas([]);
      setErroFaturas(
        e instanceof Error
          ? e.message
          : "Ocorreu um erro ao carregar as faturas."
      );
    } finally {
      setCarregandoFaturas(false);
    }
  }, [id]);

  useEffect(() => {
    void carregarUsuario();
    void carregarFaturas();
  }, [carregarUsuario, carregarFaturas]);

  const atualizarTudo = useCallback(() => {
    void carregarUsuario(true);
    void carregarFaturas();
  }, [carregarUsuario, carregarFaturas]);

  const cancelarEdicao = useCallback(() => {
    setEditandoTelefone(false);
    setEditandoEmail(false);
    setTelefoneEditado(usuario?.phone ?? "");
    setEmailEditado(usuario?.email ?? "");
    setErroContato("");
  }, [usuario]);

  // Passo 1: valida os campos e abre a pergunta de segurança
  const solicitarConfirmacao = useCallback(() => {
    if (!usuario || salvandoContato) return;

    const telefone = telefoneEditado.trim();
    const email = emailEditado.trim();

    if (editandoTelefone && !telefoneCompleto(telefone)) {
      setErroContato("Informe um telefone válido com DDD.");
      setSucessoContato("");
      return;
    }

    if (
      editandoEmail &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      setErroContato("Informe um e-mail válido.");
      setSucessoContato("");
      return;
    }

    setErroContato("");
    setSucessoContato("");
    const perguntas = montarPerguntas(usuario);
    const sorteada =
      perguntas[Math.floor(Math.random() * perguntas.length)];

    setPerguntaAtual(sorteada);
    setRespostaSeguranca("");
    setErroModal("");
    setModalConfirmacao(true);
  }, [
    usuario,
    salvandoContato,
    telefoneEditado,
    emailEditado,
    editandoTelefone,
    editandoEmail,
  ]);

  const fecharModal = useCallback(() => {
    if (salvandoContato) return;
    setModalConfirmacao(false);
    setRespostaSeguranca("");
    setPerguntaAtual(null);
    setErroModal("");
  }, [salvandoContato]);

  // Passo 2: confere a resposta e salva
  const confirmarSalvar = useCallback(async () => {
    if (!usuario || !perguntaAtual || salvandoContato) return;

    if (!respostaSeguranca.trim()) {
      setErroModal("Responda à pergunta de segurança para confirmar.");
      return;
    }

    if (!respostaConfere(perguntaAtual, respostaSeguranca)) {
      setErroModal("Resposta incorreta. Tente novamente.");
      return;
    }

    const telefone = telefoneEditado.trim();
    const email = emailEditado.trim();

    setSalvandoContato(true);
    setErroModal("");

    try {
      const body: Record<string, string> = {
        pergunta: perguntaAtual.id,
        confirmacao: respostaSeguranca.trim(),
      };

      if (editandoTelefone) body.phone = telefone;
      if (editandoEmail) body.email = email;

      const response = await fetch(
        `/api/maylon-pass/${encodeURIComponent(String(usuario.id))}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify(body),
        }
      );

      const dados = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          dados.error ||
            dados.mensagem ||
            "Não foi possível salvar as alterações."
        );
      }

      setUsuario((atual) =>
        atual
          ? {
              ...atual,
              ...(editandoTelefone ? { phone: telefone } : {}),
              ...(editandoEmail ? { email } : {}),
            }
          : atual
      );

      setEditandoTelefone(false);
      setEditandoEmail(false);
      setModalConfirmacao(false);
      setRespostaSeguranca("");
      setPerguntaAtual(null);
      setSucessoContato("Dados de contato atualizados com sucesso.");
    } catch (e) {
      // mantém o modal aberto para tentar de novo
      setErroModal(
        e instanceof Error
          ? e.message
          : "Erro ao salvar os dados de contato."
      );
    } finally {
      setSalvandoContato(false);
    }
  }, [
    usuario,
    salvandoContato,
    perguntaAtual,
    respostaSeguranca,
    telefoneEditado,
    emailEditado,
    editandoTelefone,
    editandoEmail,
  ]);

  const pendencias = usuario
    ? camposIncompletos(usuario)
    : [];

  return (
    <main className="min-h-screen space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/gerente/maylon_pass"
            aria-label="Voltar para Maylon Pass"
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>

          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            Detalhes do usuário
          </h1>
        </div>

        <button
          type="button"
          onClick={atualizarTudo}
          disabled={atualizando || salvandoContato}
          className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-60"
        >
          <RefreshCw
            className={`h-4 w-4 ${atualizando ? "animate-spin" : ""}`}
          />
          Atualizar
        </button>
      </header>

      {carregando ? (
        <section
          aria-busy="true"
          className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
        >
          <div className="flex animate-pulse items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-slate-100" />
            <div className="flex-1 space-y-3">
              <div className="h-4 w-48 rounded bg-slate-100" />
              <div className="h-3 w-64 max-w-full rounded bg-slate-100" />
            </div>
          </div>
        </section>
      ) : erro ? (
        <section
          role="alert"
          className="rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm"
        >
          <AlertCircle className="mx-auto h-8 w-8 text-red-600" />
          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Não foi possível carregar o usuário
          </h2>
          <p className="mt-2 text-sm text-red-700">{erro}</p>
          <button
            type="button"
            onClick={() => void carregarUsuario()}
            className="mt-5 rounded-xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white"
          >
            Tentar novamente
          </button>
        </section>
      ) : usuario ? (
        <>
          {/* Perfil do usuário */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="h-28 bg-gradient-to-r from-teal-800 via-teal-600 to-emerald-500" />

            <div className="px-5 pb-6 sm:px-8">
              <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end">
                  {usuario.profile_image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={usuario.profile_image}
                      alt={`Foto de ${texto(usuario.full_name)}`}
                      className="h-20 w-20 rounded-2xl border-4 border-white bg-white object-cover shadow-sm"
                    />
                  ) : (
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-white bg-teal-50 text-2xl font-extrabold text-teal-700 shadow-sm">
                      {iniciais(usuario.full_name)}
                    </div>
                  )}

                  <div className="min-w-0 pb-1">
                    <h2 className="break-words text-2xl font-extrabold text-slate-900">
                      {texto(usuario.full_name)}
                    </h2>
                    <p className="mt-1 break-all text-sm text-slate-500">
                      {texto(usuario.email)}
                    </p>
                  </div>
                </div>

                <span
                  className={`inline-flex w-fit items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                    usuarioAtivo(usuario)
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${
                      usuarioAtivo(usuario)
                        ? "bg-emerald-500"
                        : "bg-red-500"
                    }`}
                  />
                  {usuarioAtivo(usuario) ? "Ativo" : "Inativo"}
                </span>
              </div>
            </div>
          </section>

          {/* Mensagens de edição */}
          {erroContato && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
            >
              {erroContato}
            </div>
          )}

          {sucessoContato && (
            <div
              role="status"
              className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"
            >
              {sucessoContato}
            </div>
          )}

          {/* Cadastro incompleto */}
          {pendencias.length > 0 && (
            <section
              role="alert"
              className="rounded-2xl border border-amber-200 bg-amber-50 p-4 sm:p-5"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 shrink-0 text-amber-700" />
                <div>
                  <p className="text-sm font-bold text-amber-900">
                    Cadastro incompleto
                  </p>
                  <p className="mt-1 text-sm text-amber-800">
                    Complete os dados deste usuário:
                  </p>

                  <ul className="mt-3 flex flex-wrap gap-2">
                    {pendencias.map((item) => (
                      <li
                        key={item}
                        className="rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-800"
                      >
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          )}

          {/* Informações cadastrais */}
          <section>
            <h2 className="mb-4 text-lg font-bold text-white">
              Informações cadastrais
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {/* ID */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
                    <Hash className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    ID do usuário
                  </p>
                </div>
                <p className="mt-4 break-all text-xl font-bold text-slate-900">
                  #{usuario.id}
                </p>
              </div>

              {/* TELEFONE EDITÁVEL */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-blue-50 p-2.5 text-blue-700">
                      <Phone className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                      Telefone
                    </p>
                  </div>

                  {!editandoTelefone && (
                    <button
                      type="button"
                      onClick={() => {
                        setTelefoneEditado(usuario.phone ?? "");
                        setEditandoTelefone(true);
                        setEditandoEmail(false);
                        setErroContato("");
                        setSucessoContato("");
                      }}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-teal-700 hover:bg-teal-50"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </button>
                  )}
                </div>

                {editandoTelefone ? (
                  <div className="mt-4 space-y-3">
                    <input
                      type="tel"
                      value={telefoneEditado}
                      onChange={(e) =>
                        setTelefoneEditado(e.target.value)
                      }
                      placeholder="(11) 99999-9999"
                      autoComplete="tel"
                      disabled={salvandoContato}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={solicitarConfirmacao}
                        disabled={salvandoContato}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        Salvar
                      </button>

                      <button
                        type="button"
                        onClick={cancelarEdicao}
                        disabled={salvandoContato}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 break-words text-lg font-bold text-slate-900">
                    {formatarTelefone(usuario.phone)}
                  </p>
                )}
              </div>

              {/* E-MAIL EDITÁVEL */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-violet-50 p-2.5 text-violet-700">
                      <Mail className="h-5 w-5" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                      E-mail
                    </p>
                  </div>

                  {!editandoEmail && (
                    <button
                      type="button"
                      onClick={() => {
                        setEmailEditado(usuario.email ?? "");
                        setEditandoEmail(true);
                        setEditandoTelefone(false);
                        setErroContato("");
                        setSucessoContato("");
                      }}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-sm font-semibold text-teal-700 hover:bg-teal-50"
                    >
                      <Pencil className="h-4 w-4" />
                      Editar
                    </button>
                  )}
                </div>

                {editandoEmail ? (
                  <div className="mt-4 space-y-3">
                    <input
                      type="email"
                      value={emailEditado}
                      onChange={(e) =>
                        setEmailEditado(e.target.value)
                      }
                      placeholder="usuario@exemplo.com"
                      autoComplete="email"
                      disabled={salvandoContato}
                      className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    />

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={solicitarConfirmacao}
                        disabled={salvandoContato}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg bg-teal-700 px-3 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                        Salvar
                      </button>

                      <button
                        type="button"
                        onClick={cancelarEdicao}
                        disabled={salvandoContato}
                        className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                      >
                        <X className="h-4 w-4" />
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-4 break-all text-sm font-bold text-slate-900">
                    {texto(usuario.email)}
                  </p>
                )}
              </div>

              {/* PLANO CONTRATADO */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    Plano contratado
                  </p>
                </div>
                <p className="mt-4 break-words text-lg font-bold text-slate-900">
                  {texto(usuario.plano)}
                </p>
              </div>

              {/* VALOR DO PLANO */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-700">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    Valor do plano
                  </p>
                </div>
                <p className="mt-4 text-2xl font-extrabold text-slate-900">
                  {formatarMoeda(usuario.valor)}
                </p>
              </div>

              {/* DATA DE CADASTRO */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-indigo-50 p-2.5 text-indigo-700">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-500">
                    Data de cadastro
                  </p>
                </div>
                <p className="mt-4 text-lg font-bold text-slate-900">
                  {formatarData(usuario.created_at)}
                </p>
              </div>
            </div>
          </section>

          {/* HISTÓRICO DE FATURAS */}
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
                  <Receipt className="h-5 w-5" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Faturas
                  </h2>
                  <p className="text-sm text-slate-500">
                    Histórico de cobranças deste usuário.
                  </p>
                </div>
              </div>

              {!carregandoFaturas && !erroFaturas && (
                <span className="inline-flex w-fit items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600">
                  {faturas.length}{" "}
                  {faturas.length === 1 ? "fatura" : "faturas"}
                </span>
              )}
            </div>

            {/* CARREGANDO FATURAS */}
            {carregandoFaturas ? (
              <div
                aria-busy="true"
                className="space-y-3 p-5 sm:p-6"
              >
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-12 animate-pulse rounded-xl bg-slate-100"
                  />
                ))}
              </div>
            ) : erroFaturas ? (
              /* ERRO NAS FATURAS */
              <div role="alert" className="p-8 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
                  <AlertCircle className="h-6 w-6" />
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-900">
                  Não foi possível carregar as faturas
                </p>

                <p className="mt-1 text-sm text-red-700">
                  {erroFaturas}
                </p>

                <button
                  type="button"
                  onClick={() => void carregarFaturas()}
                  className="mt-4 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800"
                >
                  Tentar novamente
                </button>
              </div>
            ) : faturas.length === 0 ? (
              /* NENHUMA FATURA */
              <div className="p-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                  <Receipt className="h-6 w-6" />
                </div>

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Nenhuma fatura encontrada
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Este usuário ainda não possui cobranças registradas.
                </p>
              </div>
            ) : (
              /* TABELA DE FATURAS */
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px]">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-100">
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Fatura
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Descrição
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Valor
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Vencimento
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Pagamento
                      </th>
                      <th className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {faturas.map((fatura) => {
                      const status = statusFatura(fatura.status);

                      return (
                        <tr
                          key={fatura.id}
                          className="transition hover:bg-slate-50"
                        >
                          <td className="whitespace-nowrap px-5 py-4">
                            <span className="rounded-lg border border-teal-100 bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700">
                              #{fatura.numero ?? fatura.id}
                            </span>
                          </td>

                          <td className="max-w-[260px] px-5 py-4">
                            <p className="truncate text-sm font-medium text-slate-700">
                              {fatura.descricao ?? "—"}
                            </p>

                            {fatura.metodo && (
                              <p className="mt-0.5 truncate text-xs text-slate-400">
                                {fatura.metodo}
                              </p>
                            )}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-slate-900">
                            {formatarMoeda(fatura.valor)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                            {formatarData(fatura.vencimento)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-600">
                            {formatarData(fatura.pago_em)}
                          </td>

                          <td className="whitespace-nowrap px-5 py-4">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${status.classe}`}
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${status.ponto}`}
                              />
                              {status.rotulo}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}

      {/* MODAL: PERGUNTA DE SEGURANÇA */}
      {modalConfirmacao && usuario && perguntaAtual && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
          onClick={fecharModal}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-confirmacao"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-xl"
          >
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-700">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3
                id="titulo-confirmacao"
                className="text-lg font-bold text-slate-900"
              >
                Pergunta de segurança
              </h3>
            </div>

            <p className="mt-3 text-sm text-slate-600">
              Revise a alteração abaixo e responda à pergunta para
              confirmar.
            </p>

            <div className="mt-4 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
              {editandoTelefone && (
                <div>
                  <p className="font-semibold text-slate-500">
                    Telefone
                  </p>
                  <p className="text-slate-500 line-through">
                    {formatarTelefone(usuario.phone)}
                  </p>
                  <p className="font-bold text-slate-900">
                    {formatarTelefone(telefoneEditado)}
                  </p>
                </div>
              )}

              {editandoEmail && (
                <div>
                  <p className="font-semibold text-slate-500">
                    E-mail
                  </p>
                  <p className="break-all text-slate-500 line-through">
                    {texto(usuario.email)}
                  </p>
                  <p className="break-all font-bold text-slate-900">
                    {emailEditado.trim()}
                  </p>
                </div>
              )}
            </div>

            <label
              htmlFor="resposta-seguranca"
              className="mt-4 block text-sm font-medium text-slate-700"
            >
              {perguntaAtual.rotulo}
            </label>
            <input
              id="resposta-seguranca"
              type="text"
              autoFocus
              autoComplete="off"
              value={respostaSeguranca}
              onChange={(e) => setRespostaSeguranca(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void confirmarSalvar();
                if (e.key === "Escape") fecharModal();
              }}
              placeholder={perguntaAtual.placeholder}
              disabled={salvandoContato}
              className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />

            {erroModal && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                {erroModal}
              </p>
            )}

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={fecharModal}
                disabled={salvandoContato}
                className="cursor-pointer rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void confirmarSalvar()}
                disabled={salvandoContato}
                className="inline-flex cursor-pointer items-center gap-1 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-800 disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                {salvandoContato ? "Salvando..." : "Confirmar e salvar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}