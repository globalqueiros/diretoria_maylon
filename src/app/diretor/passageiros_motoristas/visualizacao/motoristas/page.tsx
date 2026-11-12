"use client";

import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Edit3,
  FileText,
  IdCard,
  LayoutGrid,
  Lock,
  LockOpen,
  Mail,
  MapPin,
  Phone,
  ScanFace,
  ShieldAlert,
  ShieldCheck,
  Star,
  Trash2,
  TrendingUp,
  UserRound,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

/* =========================================================
   TIPOS
========================================================= */

export type UsuarioMotorista = {
  id: string;

  name?: string | null;
  nome?: string | null;

  email?: string | null;
  email_address?: string | null;
  mail?: string | null;
  email_usuario?: string | null;

  phone?: string | null;
  telefone?: string | null;

  ref_code?: string | null;

  is_active?: number | boolean | null;
  is_temp_blocked?: number | boolean | null;
  bloqueado?: boolean | null;
  blocked_at?: string | null;

  created_at?: string | null;
  updated_at?: string | null;

  foto?: string | null;
  foto_url?: string | null;
  avatar?: string | null;

  cidade?: string | null;
  estado?: string | null;

  servico?: string | null;
  service?: string | null;

  rating?: number | string | null;
  avaliacao?: number | string | null;
};

export type VerificacaoMotorista = {
  documento?: {
    status?: string | null;
    didit_status?: string | null;
    is_verified?: boolean | null;
    identity_match?: unknown;
    documento_tipo?: string | null;
  } | null;
  prova_vida?: {
    devida?: boolean | null;
    last_liveness_at?: string | null;
  } | null;
};

type MotoristaProps = {
  usuario: UsuarioMotorista;
  verificacao?: VerificacaoMotorista | null;
};

type Aba = "geral" | "verificacao" | "desempenho";

/* =========================================================
   HELPERS
========================================================= */

function formatarData(data?: string | null) {
  if (!data) return "—";

  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return data;

  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatarDataHora(data?: string | null) {
  if (!data) return "—";

  const date = new Date(data);
  if (Number.isNaN(date.getTime())) return data;

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatarTelefone(telefone?: string | null) {
  if (!telefone) return "—";

  const numeros = String(telefone).replace(/\D/g, "");
  if (!numeros) return "—";

  const numeroBR =
    numeros.startsWith("55") && numeros.length >= 12
      ? numeros.slice(2)
      : numeros;

  if (numeroBR.length === 11) {
    return numeroBR.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
  }
  if (numeroBR.length === 10) {
    return numeroBR.replace(/^(\d{2})(\d{4})(\d{4})$/, "($1) $2-$3");
  }
  if (numeroBR.length === 9) {
    return numeroBR.replace(/^(\d{5})(\d{4})$/, "$1-$2");
  }
  if (numeroBR.length === 8) {
    return numeroBR.replace(/^(\d{4})(\d{4})$/, "$1-$2");
  }

  return telefone;
}

/* Traduz valores vindos da API (em inglês) para pt-BR */
function normalizar(valor?: string | null) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function traduzirStatus(valor?: string | null) {
  if (!valor) return "—";

  const mapa: Record<string, string> = {
    approved: "Aprovado",
    verified: "Verificado",
    declined: "Recusado",
    rejected: "Recusado",
    failed: "Falhou",
    pending: "Pendente",
    in_review: "Em análise",
    in_progress: "Em andamento",
    not_started: "Não iniciado",
    expired: "Expirado",
    abandoned: "Abandonado",
    resubmitted: "Reenviado",
    awaiting_user: "Aguardando o usuário",
  };

  return mapa[normalizar(valor)] ?? valor;
}

function traduzirDocumento(valor?: string | null) {
  if (!valor) return "—";

  const mapa: Record<string, string> = {
    passport: "Passaporte",
    drivers_license: "CNH",
    driver_license: "CNH",
    driving_license: "CNH",
    cnh: "CNH",
    id_card: "Documento de identidade",
    identity_card: "Documento de identidade",
    national_id: "Documento de identidade",
    rg: "RG",
    residence_permit: "Autorização de residência",
  };

  return mapa[normalizar(valor)] ?? valor;
}

const getNome = (u: UsuarioMotorista) => u.nome || u.name || "Motorista";

const getEmail = (u: UsuarioMotorista) =>
  u.email || u.email_address || u.mail || u.email_usuario || "—";

const getTelefone = (u: UsuarioMotorista) => u.telefone || u.phone || "";

const getFoto = (u: UsuarioMotorista) =>
  u.foto_url || u.foto || u.avatar || "";

function getLocalizacao(u: UsuarioMotorista) {
  const partes = [u.cidade, u.estado].filter(Boolean);
  return partes.length ? partes.join(" - ") : "—";
}

function getAvaliacao(u: UsuarioMotorista) {
  const valor = u.avaliacao ?? u.rating;
  if (valor === null || valor === undefined || valor === "") return null;

  const n = Number(valor);
  return Number.isFinite(n) ? n : null;
}

function estaBloqueado(u: UsuarioMotorista) {
  return (
    u.bloqueado === true ||
    Number(u.is_active) === 0 ||
    Number(u.is_temp_blocked) === 1 ||
    Boolean(u.blocked_at)
  );
}

/* =========================================================
   COMPONENTE PRINCIPAL
========================================================= */

export default function Motorista({ usuario, verificacao }: MotoristaProps) {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("geral");

  if (!usuario) {
    return (
      <main className="min-h-screen p-6 text-sm text-slate-600">
        Selecione um motorista em Passageiros e Motoristas para visualizar os detalhes.
      </main>
    );
  }

  const nome = getNome(usuario);
  const bloqueado = estaBloqueado(usuario);
  const avaliacao = getAvaliacao(usuario);

  const abas: { id: Aba; label: string; icon: ReactNode }[] = [
    { id: "geral", label: "Visão geral", icon: <LayoutGrid size={16} /> },
    {
      id: "verificacao",
      label: "Verificação",
      icon: <ShieldCheck size={16} />,
    },
    { id: "desempenho", label: "Desempenho", icon: <TrendingUp size={16} /> },
  ];

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-6xl">
        {/* BARRA SUPERIOR */}

        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Voltar"
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <ArrowLeft size={18} />
            </button>

            <nav
              aria-label="Navegação"
              className="flex items-center gap-1.5 text-sm text-slate-400"
            >
              <span>Motoristas</span>
              <ChevronRight size={14} />
              <span className="font-semibold text-slate-800">{nome}</span>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <FileText size={16} />
              Histórico
            </button>

            <button
              type="button"
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-red-600 transition hover:border-red-200 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
            >
              <Trash2 size={16} />
              Excluir
            </button>
          </div>
        </div>

        {bloqueado && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
          >
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-red-500" />
            <div className="text-sm">
              <p className="font-semibold text-red-700">
                Este motorista está suspenso
              </p>
              <p className="mt-0.5 text-red-600/90">
                {usuario.blocked_at
                  ? `Suspenso em ${formatarDataHora(usuario.blocked_at)}.`
                  : "Ele não recebe corridas enquanto a suspensão estiver ativa."}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[320px_1fr]">
          {/* =============== BARRA LATERAL =============== */}

          <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm lg:sticky lg:top-6">
            <div className="flex flex-col items-center px-6 pb-6 pt-8 text-center">
              <div className="relative">
                <Avatar nome={nome} foto={getFoto(usuario)} bloqueado={bloqueado} />
              </div>

              <h1 className="mt-4 text-xl font-bold tracking-tight text-slate-900">
                {nome}
              </h1>

              <p className="mt-0.5 text-sm text-slate-500">
                Motorista · ID {usuario.id}
              </p>

              <div className="mt-3">
                <StatusBadge bloqueado={bloqueado} />
              </div>

              <div className="mt-4 flex items-center gap-2">
                <Estrelas valor={avaliacao} />
                <span className="text-sm font-semibold text-slate-700">
                  {avaliacao === null ? "Sem avaliação" : avaliacao.toFixed(1)}
                </span>
              </div>
            </div>

            <div className="space-y-2 border-t border-slate-100 px-6 py-5">
              <button
                type="button"
                className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
              >
                <Edit3 size={16} />
                Editar perfil
              </button>

              <button
                type="button"
                className={`flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                  bloqueado
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:outline-emerald-600"
                    : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 focus-visible:outline-red-500"
                }`}
              >
                {bloqueado ? <LockOpen size={16} /> : <Lock size={16} />}
                {bloqueado ? "Reativar motorista" : "Suspender motorista"}
              </button>
            </div>

            <dl className="space-y-4 border-t border-slate-100 px-6 py-5">
              <ContatoItem
                icon={<Phone size={16} />}
                label="Telefone"
                value={formatarTelefone(getTelefone(usuario))}
              />
              <ContatoItem
                icon={<Mail size={16} />}
                label="E-mail"
                value={getEmail(usuario)}
              />
              <ContatoItem
                icon={<MapPin size={16} />}
                label="Localização"
                value={getLocalizacao(usuario)}
              />
              <ContatoItem
                icon={<Wrench size={16} />}
                label="Serviço"
                value={usuario.servico || usuario.service || "—"}
              />
            </dl>
          </aside>

          {/* =============== CONTEÚDO =============== */}

          <div className="min-w-0">
            <div
              role="tablist"
              aria-label="Seções do perfil"
              className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1 shadow-sm"
            >
              {abas.map((item) => {
                const ativa = aba === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    id={`aba-${item.id}`}
                    aria-selected={ativa}
                    aria-controls={`painel-${item.id}`}
                    onClick={() => setAba(item.id)}
                    className={`flex h-10 flex-1 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${
                      ativa
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                );
              })}
            </div>

            <div
              role="tabpanel"
              id={`painel-${aba}`}
              aria-labelledby={`aba-${aba}`}
            >
              {aba === "geral" && (
                <VisaoGeral
                  usuario={usuario}
                  avaliacao={avaliacao}
                  bloqueado={bloqueado}
                />
              )}

              {aba === "verificacao" && (
                <Verificacao verificacao={verificacao} />
              )}

              {aba === "desempenho" && <Desempenho />}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   ABA: VISÃO GERAL
========================================================= */

function VisaoGeral({
  usuario,
  avaliacao,
  bloqueado,
}: {
  usuario: UsuarioMotorista;
  avaliacao: number | null;
  bloqueado: boolean;
}) {
  const eventos = [
    {
      titulo: "Conta criada",
      data: usuario.created_at,
      tom: "bg-emerald-500",
    },
    {
      titulo: "Última atualização do cadastro",
      data: usuario.updated_at,
      tom: "bg-slate-400",
    },
    ...(usuario.blocked_at
      ? [
          {
            titulo: "Motorista suspenso",
            data: usuario.blocked_at,
            tom: "bg-red-500",
          },
        ]
      : []),
  ]
    .filter((e) => e.data)
    .sort(
      (a, b) =>
        new Date(b.data as string).getTime() -
        new Date(a.data as string).getTime()
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Indicador
          icon={<Star size={18} />}
          label="Avaliação média"
          value={avaliacao === null ? "—" : avaliacao.toFixed(1)}
        />
        <Indicador
          icon={<CalendarDays size={18} />}
          label="Motorista desde"
          value={formatarData(usuario.created_at)}
        />
        <Indicador
          icon={<BadgeCheck size={18} />}
          label="Situação da conta"
          value={bloqueado ? "Suspensa" : "Ativa"}
          destaque={bloqueado ? "red" : "green"}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Painel titulo="Dados da conta" descricao="Identificação do motorista">
          <dl className="divide-y divide-slate-100">
            <Linha label="ID do usuário" value={usuario.id} mono />
            <Linha
              label="Código de indicação"
              value={usuario.ref_code || "—"}
              mono
            />
            <Linha label="Cadastrado em" value={formatarDataHora(usuario.created_at)} />
            <Linha
              label="Atualizado em"
              value={formatarDataHora(usuario.updated_at)}
            />
          </dl>
        </Painel>

        <Painel titulo="Linha do tempo" descricao="Eventos mais recentes da conta">
          {eventos.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-400">
              Nenhum evento registrado.
            </p>
          ) : (
            <ol className="py-5">
              {eventos.map((evento, i) => (
                <li key={evento.titulo} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < eventos.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute left-[5px] top-4 h-full w-px bg-slate-200"
                    />
                  )}

                  <span
                    aria-hidden
                    className={`relative mt-1.5 h-3 w-3 shrink-0 rounded-full ring-4 ring-white ${evento.tom}`}
                  />

                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      {evento.titulo}
                    </p>
                    <p className="text-xs text-slate-500">
                      {formatarDataHora(evento.data)}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Painel>
      </div>
    </div>
  );
}

/* =========================================================
   ABA: VERIFICAÇÃO
========================================================= */

function Verificacao({
  verificacao,
}: {
  verificacao?: VerificacaoMotorista | null;
}) {
  const doc = verificacao?.documento ?? null;
  const vida = verificacao?.prova_vida ?? null;

  if (!doc && !vida) {
    return (
      <Painel titulo="Verificação de identidade" descricao="Documento e prova de vida">
        <div className="flex flex-col items-center gap-2 py-12 text-center">
          <CircleDashed size={32} className="text-slate-300" />
          <p className="text-sm font-medium text-slate-600">
            Nenhuma verificação encontrada
          </p>
          <p className="max-w-xs text-xs text-slate-400">
            O motorista ainda não enviou documento nem fez a prova de vida.
          </p>
        </div>
      </Painel>
    );
  }

  const documentoOk = doc?.is_verified === true;
  const vidaOk = vida?.devida === true;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <EtapaVerificacao
        icon={<IdCard size={20} />}
        titulo="Documento de identidade"
        ok={documentoOk}
        texto={
          doc ? (documentoOk ? "Verificado" : "Não verificado") : "Sem dados"
        }
      >
        <Linha label="Tipo" value={traduzirDocumento(doc?.documento_tipo)} />
        <Linha
          label="Status da análise"
          value={traduzirStatus(doc?.didit_status || doc?.status)}
        />
      </EtapaVerificacao>

      <EtapaVerificacao
        icon={<ScanFace size={20} />}
        titulo="Prova de vida"
        ok={vidaOk}
        texto={vida ? (vidaOk ? "Realizada" : "Pendente") : "Sem dados"}
      >
        <Linha
          label="Última verificação"
          value={formatarDataHora(vida?.last_liveness_at)}
        />
      </EtapaVerificacao>
    </div>
  );
}

function EtapaVerificacao({
  icon,
  titulo,
  ok,
  texto,
  children,
}: {
  icon: ReactNode;
  titulo: string;
  ok: boolean;
  texto: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-6 py-4">
        <div className="flex items-center gap-3">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${
              ok ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-500"
            }`}
          >
            {icon}
          </div>
          <h3 className="text-sm font-semibold text-slate-900">{titulo}</h3>
        </div>

        <Selo ok={ok} texto={texto} />
      </div>

      <dl className="divide-y divide-slate-100 px-6">{children}</dl>
    </section>
  );
}

function Selo({ ok, texto }: { ok: boolean; texto: string }) {
  const semDados = texto === "Sem dados";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${
        ok
          ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
          : semDados
            ? "bg-slate-50 text-slate-500 ring-slate-200"
            : "bg-amber-50 text-amber-700 ring-amber-200"
      }`}
    >
      {ok ? <CheckCircle2 size={12} /> : <CircleDashed size={12} />}
      {texto}
    </span>
  );
}

/* =========================================================
   ABA: DESEMPENHO
========================================================= */

function Desempenho() {
  const metricas = [
    { label: "Ganho médio por corrida", tom: "bg-emerald-500" },
    { label: "Avaliações positivas", tom: "bg-blue-500" },
    { label: "Taxa de sucesso", tom: "bg-emerald-500" },
    { label: "Taxa de cancelamento", tom: "bg-red-500" },
    { label: "Ociosidade hoje", tom: "bg-orange-500" },
    { label: "Atividade média por dia", tom: "bg-slate-400" },
  ];

  return (
    <Painel
      titulo="Indicadores de desempenho"
      descricao="Qualidade e produtividade do motorista"
    >
      <div className="grid grid-cols-1 gap-3 py-5 sm:grid-cols-2 xl:grid-cols-3">
        {metricas.map((m) => (
          <div key={m.label} className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${m.tom}`} />
              <p className="text-xs text-slate-500">{m.label}</p>
            </div>
            <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900">
              —
            </p>
          </div>
        ))}
      </div>

      <p className="pb-5 text-xs text-slate-400">
        Os valores aparecem assim que a API enviar esses indicadores.
      </p>
    </Painel>
  );
}

/* =========================================================
   COMPONENTES DE UI
========================================================= */

function Avatar({
  nome,
  foto,
  bloqueado,
}: {
  nome: string;
  foto: string;
  bloqueado: boolean;
}) {
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className={`rounded-full p-1 ring-2 ${
        bloqueado ? "ring-red-300" : "ring-emerald-400"
      }`}
    >
      {foto ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={foto}
          alt={nome}
          className="h-28 w-28 rounded-full object-cover"
        />
      ) : (
        <div className="flex h-28 w-28 items-center justify-center rounded-full bg-slate-100 text-3xl font-bold text-slate-400">
          {iniciais || <UserRound size={40} />}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ bloqueado }: { bloqueado: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
        bloqueado
          ? "bg-red-50 text-red-600 ring-red-100"
          : "bg-emerald-50 text-emerald-700 ring-emerald-100"
      }`}
    >
      {bloqueado ? <Lock size={12} /> : <CheckCircle2 size={12} />}
      {bloqueado ? "Suspenso" : "Ativo"}
    </span>
  );
}

function Estrelas({ valor }: { valor: number | null }) {
  const cheias = valor === null ? 0 : Math.round(valor);

  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={
        valor === null ? "Sem avaliação" : `Avaliação ${valor.toFixed(1)} de 5`
      }
    >
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={16}
          className={
            i < cheias
              ? "fill-amber-400 text-amber-400"
              : "fill-slate-100 text-slate-300"
          }
        />
      ))}
    </div>
  );
}

function ContatoItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 text-slate-400">{icon}</span>

      <div className="min-w-0">
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="break-words text-sm font-medium text-slate-900">
          {value}
        </dd>
      </div>
    </div>
  );
}

function Indicador({
  icon,
  label,
  value,
  destaque = "green",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  destaque?: "green" | "red";
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{label}</p>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
            destaque === "red"
              ? "bg-red-50 text-red-500"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

function Painel({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="text-sm font-semibold text-slate-900">{titulo}</h3>
        <p className="text-xs text-slate-500">{descricao}</p>
      </div>

      <div className="px-6">{children}</div>
    </section>
  );
}

function Linha({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <dt className="text-sm text-slate-500">{label}</dt>

      <dd
        className={`break-words text-sm font-medium text-slate-900 sm:text-right ${
          mono ? "font-mono text-[13px]" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}