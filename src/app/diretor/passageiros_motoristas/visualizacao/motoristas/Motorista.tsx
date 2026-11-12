"use client";

import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  Clock3,
  Edit3,
  FileText,
  Hash,
  IdCard,
  Lock,
  LockOpen,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  ScanFace,
  ShieldAlert,
  ShieldCheck,
  Star,
  Trash2,
  UserRound,
  Wrench,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

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

function getNome(u: UsuarioMotorista) {
  return u.nome || u.name || "Motorista";
}

function getEmail(u: UsuarioMotorista) {
  return u.email || u.email_address || u.mail || u.email_usuario || "—";
}

function getTelefone(u: UsuarioMotorista) {
  return u.telefone || u.phone || "";
}

function getFoto(u: UsuarioMotorista) {
  return u.foto_url || u.foto || u.avatar || "";
}

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
   COMPONENTE MOTORISTA
========================================================= */

export default function Motorista({ usuario, verificacao }: MotoristaProps) {
  const router = useRouter();

  const nome = getNome(usuario);
  const telefone = getTelefone(usuario);
  const email = getEmail(usuario);
  const foto = getFoto(usuario);
  const bloqueado = estaBloqueado(usuario);
  const localizacao = getLocalizacao(usuario);
  const avaliacao = getAvaliacao(usuario);
  const servico = usuario.servico || usuario.service || "—";

  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-8xl space-y-6">
        {/* CABEÇALHO */}

        <header className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-white">
              Detalhes do motorista
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <ArrowLeft size={16} />
              Voltar
            </button>

            <button
              type="button"
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <FileText size={16} />
              Histórico de atividades
            </button>

            <button
              type="button"
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium text-red-600 transition hover:border-red-200 hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-500"
            >
              <Trash2 size={16} />
              Excluir
            </button>

            <button
              type="button"
              className={`inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 ${
                bloqueado
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus-visible:outline-emerald-600"
                  : "border-red-200 bg-red-50 text-red-600 hover:bg-red-100 focus-visible:outline-red-500"
              }`}
            >
              {bloqueado ? <LockOpen size={16} /> : <Lock size={16} />}
              {bloqueado ? "Reativar motorista" : "Suspender motorista"}
            </button>

            <button
              type="button"
              className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
            >
              <Edit3 size={16} />
              Editar
            </button>
          </div>
        </header>

        {/* AVISO DE SUSPENSÃO */}

        {bloqueado && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3"
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

        {/* PERFIL */}

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="h-24 bg-gradient-to-r from-emerald-600 to-teal-500 md:h-28" />

          <div className="px-6 pb-6 md:px-8">
            <div className="-mt-14 flex flex-col gap-5 sm:flex-row sm:items-end">
              <div className="relative w-fit">
                <Avatar nome={nome} foto={foto} />

                <span
                  title={bloqueado ? "Suspenso" : "Ativo"}
                  className={`absolute bottom-1.5 right-1.5 h-4 w-4 rounded-full border-2 border-white ${
                    bloqueado ? "bg-red-500" : "bg-emerald-500"
                  }`}
                />
              </div>

              <div className="min-w-0 flex-1 sm:pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="truncate text-2xl font-bold tracking-tight text-slate-900">
                    {nome}
                  </h2>

                  <StatusBadge bloqueado={bloqueado} />
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  Motorista · ID {usuario.id}
                </p>
              </div>
            </div>

            <dl className="mt-6 grid grid-cols-1 divide-y divide-slate-100 rounded-xl border border-slate-200 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
              <Resumo
                icon={<Star size={16} />}
                label="Avaliação"
                value={avaliacao === null ? "—" : avaliacao.toFixed(1)}
              />

              <Resumo
                icon={<Wrench size={16} />}
                label="Serviço"
                value={servico}
              />

              <Resumo
                icon={<CalendarDays size={16} />}
                label="Motorista desde"
                value={formatarData(usuario.created_at)}
              />

              <Resumo
                icon={<BadgeCheck size={16} />}
                label="Situação da conta"
                value={bloqueado ? "Suspensa" : "Ativa"}
              />
            </dl>
          </div>
        </section>

        {/* DESEMPENHO + VERIFICAÇÃO */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Painel
            className="lg:col-span-2"
            icon={<Star size={18} />}
            titulo="Desempenho"
            descricao="Indicadores de qualidade e produtividade"
          >
            <div className="py-5">
              <div className="mb-6 flex items-center gap-3">
                <span className="whitespace-nowrap text-sm font-medium text-slate-700">
                  Taxa média de atividade por dia
                </span>

                <div
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={0}
                  className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"
                >
                  <div
                    className="h-full rounded-full bg-emerald-500"
                    style={{ width: "0%" }}
                  />
                </div>

                <span className="text-xs font-semibold text-slate-500">—</span>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                <Metrica
                  label="Ganho médio"
                  value="—"
                  tom="bg-emerald-500"
                />
                <Metrica
                  label="Avaliações positivas"
                  value="—"
                  tom="bg-blue-500"
                />
                <Metrica
                  label="Corridas concluídas"
                  value="—"
                  tom="bg-emerald-500"
                />
                <Metrica
                  label="Cancelamentos"
                  value="—"
                  tom="bg-red-500"
                />
                <Metrica
                  label="Ociosidade hoje"
                  value="—"
                  tom="bg-orange-500"
                />
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Os indicadores serão exibidos assim que a API enviar esses dados.
              </p>
            </div>
          </Painel>

          <VerificacaoPainel verificacao={verificacao} />
        </div>

        {/* CONTATO + CONTA */}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Painel
            className="lg:col-span-2"
            icon={<UserRound size={18} />}
            titulo="Informações de contato"
            descricao="Dados usados para comunicação com o motorista"
          >
            <dl className="divide-y divide-slate-100">
              <Linha
                icon={<Phone size={16} />}
                label="Telefone"
                value={formatarTelefone(telefone)}
              />
              <Linha icon={<Mail size={16} />} label="E-mail" value={email} />
              <Linha
                icon={<MapPin size={16} />}
                label="Localização"
                value={localizacao}
              />
              <Linha
                icon={<Wrench size={16} />}
                label="Serviços"
                value={servico}
              />
            </dl>
          </Painel>

          <Painel
            icon={<Hash size={18} />}
            titulo="Dados da conta"
            descricao="Identificação e histórico de cadastro"
          >
            <dl className="divide-y divide-slate-100">
              <Linha label="ID do usuário" value={usuario.id} mono />
              <Linha
                label="Código de indicação"
                value={usuario.ref_code || "—"}
                mono
              />
              <Linha
                icon={<Clock3 size={16} />}
                label="Cadastrado em"
                value={formatarDataHora(usuario.created_at)}
              />
              <Linha
                icon={<RefreshCw size={16} />}
                label="Última atualização"
                value={formatarDataHora(usuario.updated_at)}
              />
            </dl>
          </Painel>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   VERIFICAÇÃO
========================================================= */

function VerificacaoPainel({
  verificacao,
}: {
  verificacao?: VerificacaoMotorista | null;
}) {
  const doc = verificacao?.documento ?? null;
  const vida = verificacao?.prova_vida ?? null;

  const semDados = !doc && !vida;

  const documentoVerificado = doc?.is_verified === true;
  const provaFeita = vida?.devida === true;

  return (
    <Painel
      icon={<ShieldCheck size={18} />}
      titulo="Verificação de identidade"
      descricao="Documento e prova de vida"
    >
      {semDados ? (
        <div className="flex flex-col items-center gap-2 py-8 text-center">
          <CircleDashed size={28} className="text-slate-300" />
          <p className="text-sm font-medium text-slate-600">
            Nenhuma verificação encontrada
          </p>
          <p className="text-xs text-slate-400">
            O motorista ainda não enviou documento ou prova de vida.
          </p>
        </div>
      ) : (
        <dl className="divide-y divide-slate-100">
          <div className="flex items-center justify-between gap-4 py-4">
            <dt className="flex items-center gap-2 text-sm text-slate-500">
              <IdCard size={16} className="text-slate-400" />
              Documento
            </dt>
            <dd>
              <Selo
                ok={documentoVerificado}
                texto={
                  doc
                    ? documentoVerificado
                      ? "Verificado"
                      : "Não verificado"
                    : "Sem dados"
                }
              />
            </dd>
          </div>

          {doc?.documento_tipo && (
            <Linha label="Tipo de documento" value={traduzirDocumento(doc.documento_tipo)} />
          )}

          {(doc?.status || doc?.didit_status) && (
            <Linha
              label="Status da análise"
              value={traduzirStatus(doc?.didit_status || doc?.status)}
            />
          )}

          <div className="flex items-center justify-between gap-4 py-4">
            <dt className="flex items-center gap-2 text-sm text-slate-500">
              <ScanFace size={16} className="text-slate-400" />
              Prova de vida
            </dt>
            <dd>
              <Selo
                ok={provaFeita}
                texto={
                  vida ? (provaFeita ? "Realizada" : "Pendente") : "Sem dados"
                }
              />
            </dd>
          </div>

          {vida?.last_liveness_at && (
            <Linha
              label="Última verificação"
              value={formatarDataHora(vida.last_liveness_at)}
            />
          )}
        </dl>
      )}
    </Painel>
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
   COMPONENTES DE UI
========================================================= */

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

function Avatar({ nome, foto }: { nome: string; foto: string }) {
  const iniciais = nome
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((item) => item[0])
    .join("")
    .toUpperCase();

  if (foto) {
    return (
      <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-md md:h-32 md:w-32">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={foto} alt={nome} className="h-full w-full object-cover" />
      </div>
    );
  }

  return (
    <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-2xl border-4 border-white bg-slate-100 shadow-md md:h-32 md:w-32">
      <span className="text-3xl font-bold text-slate-400">
        {iniciais || <UserRound size={40} />}
      </span>
    </div>
  );
}

function Resumo({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        {icon}
      </div>

      <div className="min-w-0">
        <dt className="text-xs text-slate-500">{label}</dt>
        <dd className="truncate text-sm font-semibold text-slate-900">
          {value}
        </dd>
      </div>
    </div>
  );
}

function Painel({
  icon,
  titulo,
  descricao,
  children,
  className = "",
}: {
  icon: ReactNode;
  titulo: string;
  descricao: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}
    >
      <div className="flex items-center gap-3 border-b border-slate-100 px-6 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
          {icon}
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">{titulo}</h3>
          <p className="text-xs text-slate-500">{descricao}</p>
        </div>
      </div>

      <div className="px-6">{children}</div>
    </section>
  );
}

function Linha({
  icon,
  label,
  value,
  mono = false,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <dt className="flex items-center gap-2 text-sm text-slate-500">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
      </dt>

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

function Metrica({
  label,
  value,
  tom,
}: {
  label: string;
  value: string;
  tom: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${tom}`} />
        <p className="text-xs text-slate-500">{label}</p>
      </div>

      <p className="mt-2 text-xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}