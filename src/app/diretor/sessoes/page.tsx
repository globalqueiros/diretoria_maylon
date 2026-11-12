"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowRight,
  Ban,
  CheckCircle2,
  Clock3,
  Globe,
  Laptop,
  Loader2,
  LogOut,
  Monitor,
  RefreshCw,
  ShieldCheck,
  ShieldOff,
  Smartphone,
  UserRound,
  X,
  XCircle,
  AlertTriangle,
} from "lucide-react";

type Session = {
  session_uuid: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  ip_address: string | null;
  device_name: string | null;
  browser_name: string | null;
  operating_system: string | null;
  effective_status: "active" | "inactive" | "revoked";
  created_at: string;
  last_activity_at: string | null;
  expires_at: string;
  ended_at: string | null;
  end_reason: string | null;
  /** true na sessão do aparelho que está abrindo a página. */
  is_current?: boolean;
};

type Counts = {
  total: number;
  active: number;
  inactive: number;
  revoked: number;
};

type ApiResponse = {
  success?: boolean;
  error?: string;
  message?: string;
  sessions?: Session[];
  counts?: Partial<Counts>;
};

const filters = [
  { value: "all", label: "Todas" },
  { value: "active", label: "Ativas" },
  { value: "inactive", label: "Inativas" },
  { value: "revoked", label: "Revogadas" },
];

const emptyCounts: Counts = {
  total: 0,
  active: 0,
  inactive: 0,
  revoked: 0,
};

function formatDate(value: string | null) {
  if (!value) return "—";

  const normalized = value.includes("T")
    ? value
    : `${value.replace(" ", "T")}Z`;

  const date = new Date(normalized);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("pt-BR");
}

function isMobile(session: Session) {
  const device = `${session.device_name || ""} ${session.operating_system || ""}`;

  return /mobile|móvel|android|iphone|ipad|ios/i.test(device);
}

function StatusBadge({
  status,
}: {
  status: Session["effective_status"];
}) {
  const styles = {
    active: "bg-emerald-50 text-emerald-700",
    inactive: "bg-amber-50 text-amber-700",
    revoked: "bg-red-50 text-red-700",
  };

  const labels = {
    active: "ATIVA",
    inactive: "INATIVA",
    revoked: "REVOGADA",
  };

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-wide ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

async function readResponse(response: Response): Promise<ApiResponse> {
  const text = await response.text();

  if (!text) return {};

  try {
    return JSON.parse(text) as ApiResponse;
  } catch {
    return {
      error: "O servidor retornou uma resposta inválida.",
    };
  }
}

export default function SessoesPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [counts, setCounts] = useState<Counts>(emptyCounts);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [sessionToRevoke, setSessionToRevoke] = useState<Session | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/motorista/sessoes?status=${encodeURIComponent(filter)}`,
        {
          method: "GET",
          cache: "no-store",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Sua sessão expirou. Entre novamente para consultar seus dispositivos."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "Você não tem permissão para consultar estas sessões."
          );
        }

        throw new Error(
          data.error || "Não foi possível consultar as sessões."
        );
      }

      const lista = Array.isArray(data.sessions) ? data.sessions : [];
      // O aparelho atual aparece sempre primeiro.
      setSessions(
        [...lista].sort(
          (a, b) => Number(Boolean(b.is_current)) - Number(Boolean(a.is_current))
        )
      );

      setCounts({
        total: Number(data.counts?.total ?? 0),
        active: Number(data.counts?.active ?? 0),
        inactive: Number(data.counts?.inactive ?? 0),
        revoked: Number(data.counts?.revoked ?? 0),
      });
    } catch (err) {
      setSessions([]);
      setCounts(emptyCounts);

      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao carregar as sessões."
      );
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  async function revokeSession() {
    if (!sessionToRevoke || revoking) return;

    const session = sessionToRevoke;

    setRevoking(session.session_uuid);
    setError("");
    setMessage("");

    try {
      const response = await fetch(
        `/api/motorista/sessoes/${encodeURIComponent(session.session_uuid)}`,
        {
          method: "DELETE",
          cache: "no-store",
          credentials: "same-origin",
          headers: {
            Accept: "application/json",
          },
        }
      );

      const data = await readResponse(response);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error(
            "Sua sessão expirou. Entre novamente para continuar."
          );
        }

        if (response.status === 403) {
          throw new Error(
            "Você não tem permissão para encerrar esta sessão."
          );
        }

        throw new Error(
          data.error || "Não foi possível encerrar a sessão."
        );
      }

      if (session.is_current) {
        // Encerrou o próprio aparelho: apaga os cookies e volta pro login.
        // (Não dá pra passar pela página "saindo": sem sessão válida o proxy
        // manda direto pro login antes dela limpar os cookies.)
        await fetch("/api/auth/logout", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        }).catch(() => null);
        localStorage.removeItem("token");
        sessionStorage.clear();
        window.location.replace("/?logout=success");
        return;
      }

      setSessionToRevoke(null);
      setMessage(data.message || "Sessão encerrada com sucesso.");
      await loadSessions();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao encerrar a sessão."
      );
    } finally {
      setRevoking(null);
    }
  }

  function closeConfirmation() {
    if (revoking) return;
    setSessionToRevoke(null);
  }

  const cards = [
    {
      label: "TOTAL DE SESSÕES",
      value: counts.total,
      icon: ShieldCheck,
    },
    {
      label: "DISPOSITIVOS ATIVOS",
      value: counts.active,
      icon: Smartphone,
    },
    {
      label: "SESSÕES INATIVAS",
      value: counts.inactive,
      icon: Laptop,
    },
    {
      label: "SESSÕES REVOGADAS",
      value: counts.revoked,
      icon: Globe,
    },
  ];

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-[1800px] space-y-5">
        <header className="relative overflow-hidden rounded-[28px] bg-[#10332f] px-5 py-8 text-white shadow-lg sm:px-8 sm:py-10 lg:px-10">
          <div className="absolute -right-10 -top-20 h-64 w-64 rounded-full bg-[#087c70]/25 blur-3xl" />

          <div className="relative flex items-center gap-5">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#119e8e] shadow-lg sm:h-20 sm:w-20">
              <ShieldCheck size={36} strokeWidth={2.2} />
            </div>

            <div className="min-w-0">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                Dispositivos conectados
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70 sm:text-base">
                Monitore os acessos à sua conta Maylon e encerre sessões
                que você não reconhece.
              </p>
            </div>
          </div>
        </header>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-2xl border border-red-200 bg-white p-4 text-sm text-red-700 shadow-sm"
          >
            <XCircle size={20} className="mt-0.5 shrink-0" />
            <span className="min-w-0 flex-1">{error}</span>
            <button
              type="button"
              onClick={() => setError("")}
              aria-label="Fechar erro"
              className="shrink-0 rounded-lg p-1 hover:bg-red-50"
            >
              <XCircle size={18} />
            </button>
          </div>
        )}

        {message && (
          <div
            role="status"
            className="flex items-center gap-3 rounded-2xl border border-emerald-200 bg-white p-4 text-sm font-medium text-emerald-700 shadow-sm"
          >
            <CheckCircle2 size={20} className="shrink-0" />
            <span className="flex-1">{message}</span>
            <button
              type="button"
              onClick={() => setMessage("")}
              aria-label="Fechar mensagem"
              className="rounded-lg p-1 hover:bg-emerald-50"
            >
              <XCircle size={18} />
            </button>
          </div>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="flex min-h-[106px] items-center gap-4 rounded-[24px] border border-[#e8f0ef] bg-white px-5 py-5 shadow-sm transition hover:shadow-md sm:px-6"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#e9f7f4] text-[#0ba895]">
                  <Icon size={23} strokeWidth={1.9} />
                </div>

                <div className="min-w-0">
                  <p className="text-[11px] font-extrabold tracking-[2px] text-[#8b9bb8]">
                    {card.label}
                  </p>
                  <p className="mt-1 text-2xl font-extrabold leading-none text-[#103d3b]">
                    {loading ? "—" : card.value.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            );
          })}
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#e1ecea] bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-[#123c3a]">
                Seus acessos
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                {counts.total.toLocaleString("pt-BR")} sessões registradas
              </p>
            </div>

            <button
              type="button"
              onClick={() => void loadSessions()}
              disabled={loading}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#119e8e] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#0d897b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={loading ? "animate-spin" : ""}
              />
              Atualizar
            </button>
          </div>

          <div className="flex flex-wrap gap-2 border-t border-slate-100 px-5 py-4 sm:px-6">
            {filters.map((item) => (
              <button
                type="button"
                key={item.value}
                onClick={() => setFilter(item.value)}
                aria-pressed={filter === item.value}
                className={`cursor-pointer rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  filter === item.value
                    ? "bg-[#119e8e] text-white shadow-sm"
                    : "bg-[#f3f7f8] text-slate-600 hover:bg-[#e8f3f1]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </section>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-[24px] bg-white text-[#119e8e] shadow-sm">
            <Loader2 size={34} className="animate-spin" />
            <p className="text-sm font-medium text-slate-500">
              Carregando dispositivos conectados...
            </p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-[24px] border border-white/40 bg-white px-6 text-center shadow-sm">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e9f7f4] text-[#119e8e]">
              <Monitor size={30} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-[#123c3a]">
              Nenhuma sessão encontrada
            </h3>
            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Não há acessos para o filtro selecionado. Tente escolher outra
              categoria ou atualizar a lista.
            </p>
            {filter !== "all" && (
              <button
                type="button"
                onClick={() => setFilter("all")}
                className="mt-5 rounded-xl bg-[#119e8e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d897b]"
              >
                Ver todas as sessões
              </button>
            )}
          </div>
        ) : (
          <section className="grid grid-cols-1 items-stretch gap-5 xl:grid-cols-2 2xl:grid-cols-3">
            {sessions.map((session) => {
              const mobile = isMobile(session);
              const DeviceIcon = mobile ? Smartphone : Monitor;
              const deviceName =
                session.device_name || (mobile ? "Celular" : "Computador");

              return (
                <article
                  key={session.session_uuid}
                  className={`flex min-w-0 flex-col rounded-[25px] border bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg sm:p-6 ${
                    session.is_current
                      ? "border-[#0ba895] ring-2 ring-[#0ba895]/25"
                      : "border-[#e2ecea]"
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-4">
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#e9f7f4] text-[#0ba895]">
                      <DeviceIcon size={27} strokeWidth={1.8} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="break-words text-base font-bold text-[#103d3b]">
                          {deviceName}
                        </h3>
                        <StatusBadge status={session.effective_status} />
                        {session.is_current && (
                          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[#0ba895] px-2.5 py-1 text-[10px] font-extrabold tracking-wide text-white">
                            <CheckCircle2 size={12} />
                            ESTE APARELHO
                          </span>
                        )}
                      </div>

                      <p className="mt-1 break-words text-sm font-semibold text-[#119e8e]">
                        {session.browser_name || "Navegador não identificado"}
                      </p>

                      <p className="mt-1 text-xs text-[#8b9bb8]">
                        {session.operating_system || "Sistema não identificado"}
                      </p>
                    </div>

                    {session.effective_status === "active" && (
                      <div
                        title="Sessão ativa"
                        className="shrink-0 rounded-lg p-1.5 text-[#119e8e]"
                      >
                        <Activity size={19} />
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-[#f5f8fa] p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0ba895]">
                        <Globe size={19} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-extrabold tracking-wide text-[#91a1b9]">
                          ENDEREÇO IP
                        </p>
                        <p
                          title={session.ip_address || "Não identificado"}
                          className="mt-1 truncate text-xs font-semibold text-slate-700"
                        >
                          {session.ip_address || "Não identificado"}
                        </p>
                      </div>
                    </div>

                    <div className="flex min-w-0 items-center gap-3 rounded-2xl bg-[#f5f8fa] p-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#0ba895]">
                        <Clock3 size={19} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-extrabold tracking-wide text-[#91a1b9]">
                          ÚLTIMO ACESSO
                        </p>
                        <p className="mt-1 break-words text-xs font-semibold leading-5 text-slate-700">
                          {formatDate(session.last_activity_at)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-2 rounded-2xl border border-slate-100 px-4 py-3">
                    <div className="flex items-start gap-2">
                      <UserRound
                        size={15}
                        className="mt-0.5 shrink-0 text-[#119e8e]"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold tracking-wide text-[#91a1b9]">
                          USUÁRIO
                        </p>
                        <p className="break-words text-xs font-semibold text-slate-700">
                          {session.user_name || "Usuário"}
                        </p>
                        <p className="break-all text-xs text-slate-500">
                          {session.user_email || session.user_id}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <Clock3
                        size={15}
                        className="mt-0.5 shrink-0 text-[#119e8e]"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold tracking-wide text-[#91a1b9]">
                          INÍCIO DA SESSÃO
                        </p>
                        <p className="text-xs text-slate-600">
                          {formatDate(session.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2">
                      <ShieldCheck
                        size={15}
                        className="mt-0.5 shrink-0 text-[#119e8e]"
                      />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold tracking-wide text-[#91a1b9]">
                          EXPIRAÇÃO
                        </p>
                        <p className="text-xs text-slate-600">
                          {formatDate(session.expires_at)}
                        </p>
                      </div>
                    </div>

                    {session.ended_at && (
                      <div className="flex items-start gap-2">
                        <ShieldOff
                          size={15}
                          className="mt-0.5 shrink-0 text-slate-400"
                        />
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold tracking-wide text-[#91a1b9]">
                            SESSÃO ENCERRADA
                          </p>
                          <p className="text-xs text-slate-600">
                            {formatDate(session.ended_at)}
                          </p>
                        </div>
                      </div>
                    )}

                    {session.end_reason && (
                      <p className="break-words border-t border-slate-100 pt-2 text-xs text-slate-500">
                        Motivo: {session.end_reason}
                      </p>
                    )}
                  </div>

                  <div className="mt-auto pt-5">
                    {session.effective_status === "active" ? (
                      <button
                        type="button"
                        onClick={() => setSessionToRevoke(session)}
                        disabled={revoking === session.session_uuid}
                        className="group flex min-h-12 w-full cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#dce7f3] px-4 py-3 text-left text-sm font-semibold text-[#345273] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <LogOut size={17} className="shrink-0" />
                          <span className="truncate">Encerrar este acesso</span>
                        </span>
                        <ArrowRight
                          size={18}
                          className="shrink-0 transition group-hover:translate-x-1"
                        />
                      </button>
                    ) : (
                      <div className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#f5f8fa] px-4 py-3 text-sm font-medium text-slate-400">
                        <Ban size={16} />
                        Este acesso não está ativo
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        <footer className="rounded-2xl border border-white/40 bg-white/95 px-5 py-4 text-xs leading-5 text-slate-500 shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldCheck
              size={19}
              className="mt-0.5 shrink-0 text-[#119e8e]"
            />
            <p>
              <span className="font-semibold text-[#103d3b]">
                Segurança da conta.
              </span>{" "}
              Os registros históricos são preservados após o encerramento das
              sessões. Encerre qualquer acesso que você não reconheça.
            </p>
          </div>
        </footer>
      </div>

      {sessionToRevoke && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeConfirmation();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-session-title"
            aria-describedby="confirm-session-description"
            className="w-full max-w-md overflow-hidden rounded-[28px] bg-white shadow-2xl"
          >
            <div className="relative bg-[#10332f] px-6 pb-7 pt-6 text-white">
              <button
                type="button"
                onClick={closeConfirmation}
                disabled={Boolean(revoking)}
                aria-label="Fechar confirmação"
                className="absolute right-4 top-4 rounded-xl p-2 text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
              >
                <X size={20} />
              </button>

              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 text-red-200 ring-1 ring-red-200/20">
                <AlertTriangle size={28} />
              </div>

              <h2
                id="confirm-session-title"
                className="mt-5 text-xl font-extrabold"
              >
                Encerrar este acesso?
              </h2>

              <p
                id="confirm-session-description"
                className="mt-2 text-sm leading-6 text-white/75"
              >
                Tem certeza de que deseja encerrar a sessão deste dispositivo?
                Essa ação não pode ser desfeita.
              </p>
            </div>

            <div className="space-y-4 p-6">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e9f7f4] text-[#119e8e]">
                  {isMobile(sessionToRevoke) ? (
                    <Smartphone size={24} />
                  ) : (
                    <Monitor size={24} />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm font-bold text-slate-800">
                    {sessionToRevoke.device_name ||
                      (isMobile(sessionToRevoke)
                        ? "Celular"
                        : "Computador")}
                  </p>
                  <p className="mt-1 break-words text-xs text-slate-500">
                    {sessionToRevoke.browser_name ||
                      "Navegador não identificado"}
                    {" · "}
                    {sessionToRevoke.operating_system ||
                      "Sistema não identificado"}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    IP: {sessionToRevoke.ip_address || "Não identificado"}
                  </p>
                </div>
              </div>

              {sessionToRevoke.is_current ? (
                <p className="rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold leading-5 text-amber-800">
                  Este é o aparelho que você está usando agora. Ao encerrar,
                  você sairá da sua conta e precisará entrar novamente.
                </p>
              ) : (
                <p className="text-xs leading-5 text-slate-500">
                  O acesso será marcado como revogado no histórico de sessões.
                  Talvez seja necessário entrar novamente nesse dispositivo.
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeConfirmation}
                  disabled={Boolean(revoking)}
                  className="inline-flex cursor-pointer min-h-12 items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={() => void revokeSession()}
                  disabled={Boolean(revoking)}
                  className="inline-flex cursor-pointer min-h-12 items-center justify-center gap-2 rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {revoking ? (
                    <>
                      <Loader2 size={17} className="animate-spin" />
                      Encerrando acesso...
                    </>
                  ) : (
                    <>
                      <LogOut size={17} />
                      Sim, encerrar acesso
                    </>
                  )}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
