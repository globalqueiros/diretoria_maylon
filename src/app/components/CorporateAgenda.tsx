
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  Clock3,
  ExternalLink,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Video,
  X,
  Ban,
} from "lucide-react";

type MeetingStatus =
  | "scheduled"
  | "in_progress"
  | "completed"
  | "cancelled";

type Meeting = {
  id: number;
  zoom_meeting_id: string | null;
  topic: string;
  agenda: string | null;
  organizer_name: string;
  organizer_email: string | null;
  start_time: string;
  duration_minutes: number;
  timezone: string;
  join_url: string | null;
  status: MeetingStatus;
};

const statusInfo: Record<
  MeetingStatus,
  { label: string; className: string }
> = {
  scheduled: {
    label: "Agendada",
    className: "bg-blue-50 text-blue-700 ring-blue-200",
  },
  in_progress: {
    label: "Em andamento",
    className: "bg-amber-50 text-amber-700 ring-amber-200",
  },
  completed: {
    label: "Finalizada",
    className: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  cancelled: {
    label: "Cancelada",
    className: "bg-red-50 text-red-700 ring-red-200",
  },
};

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Data indisponível";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "America/Sao_Paulo",
  }).format(date);
}

function getDefaultDateTime() {
  const date = new Date(Date.now() + 60 * 60 * 1000);
  date.setMinutes(date.getMinutes() - date.getMinutes() % 5, 0, 0);

  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export default function CorporateAgenda({
  onClose,
}: {
  onClose?: () => void;
}) {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [startTime, setStartTime] = useState(getDefaultDateTime);

  const [topic, setTopic] = useState("");
  const [agenda, setAgenda] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [duration, setDuration] = useState("60");

  const loadMeetings = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/zoom/meetings", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Não foi possível carregar as reuniões.");
      }

      setMeetings(Array.isArray(data.meetings) ? data.meetings : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar a agenda."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMeetings();
  }, [loadMeetings, refreshKey]);

  const filteredMeetings = useMemo(() => {
    const term = search.trim().toLowerCase();

    return meetings.filter((meeting) => {
      const matchesStatus =
        filter === "all" || meeting.status === filter;

      const searchable = [
        meeting.topic,
        meeting.agenda ?? "",
        meeting.organizer_name,
        meeting.organizer_email ?? "",
        meeting.zoom_meeting_id ?? "",
      ]
        .join(" ")
        .toLowerCase();

      return matchesStatus && searchable.includes(term);
    });
  }, [meetings, filter, search]);

  const counts = useMemo(() => {
    return meetings.reduce(
      (result, meeting) => {
        result.all += 1;
        result[meeting.status] += 1;
        return result;
      },
      {
        all: 0,
        scheduled: 0,
        in_progress: 0,
        completed: 0,
        cancelled: 0,
      }
    );
  }, [meetings]);

  async function createMeeting(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setNotice("");

    try {
      const response = await fetch("/api/zoom/meetings", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          agenda,
          organizerName,
          organizerEmail,
          startTime: new Date(startTime).toISOString(),
          durationMinutes: Number(duration),
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Não foi possível agendar a reunião.");
      }

      setNotice("Reunião agendada com sucesso.");
      setTopic("");
      setAgenda("");
      setOrganizerName("");
      setOrganizerEmail("");
      setDuration("60");
      setStartTime(getDefaultDateTime());
      setShowForm(false);
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao criar a reunião."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelMeeting(meeting: Meeting) {
    if (
      !window.confirm(
        `Deseja cancelar a reunião "${meeting.topic}"? O cancelamento também será solicitado ao Zoom.`
      )
    ) {
      return;
    }

    setCancellingId(meeting.id);
    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/zoom/meetings/${meeting.id}`,
        {
          method: "PATCH",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "cancelled" }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || "Não foi possível cancelar a reunião.");
      }

      setNotice("Reunião cancelada.");
      setRefreshKey((value) => value + 1);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao cancelar a reunião."
      );
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <section className="flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 text-slate-800">
      <header className="shrink-0 bg-gradient-to-r from-teal-700 via-teal-600 to-cyan-500 p-4 text-white sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <CalendarDays size={23} />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold">
                Agenda Corporativa
              </h2>
              <p className="text-sm text-white/80">
                Reuniões da Maylon
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={() => setRefreshKey((value) => value + 1)}
              aria-label="Atualizar agenda"
              disabled={loading}
              className="rounded-xl p-2 hover:bg-white/15 disabled:opacity-50"
            >
              <RefreshCw
                size={18}
                className={loading ? "animate-spin" : ""}
              />
            </button>

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar agenda"
                className="rounded-xl p-2 hover:bg-white/15"
              >
                <X size={20} />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
        <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl border bg-white p-3">
            <p className="text-xs text-slate-500">Total</p>
            <p className="mt-1 text-2xl font-semibold">{counts.all}</p>
          </div>
          <div className="rounded-xl border bg-white p-3">
            <p className="text-xs text-slate-500">Agendadas</p>
            <p className="mt-1 text-2xl font-semibold text-blue-700">
              {counts.scheduled}
            </p>
          </div>
          <div className="rounded-xl border bg-white p-3">
            <p className="text-xs text-slate-500">Em andamento</p>
            <p className="mt-1 text-2xl font-semibold text-amber-700">
              {counts.in_progress}
            </p>
          </div>
          <div className="rounded-xl border bg-white p-3">
            <p className="text-xs text-slate-500">Finalizadas</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-700">
              {counts.completed}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowForm((value) => !value);
            setError("");
            setNotice("");
          }}
          className="mb-4 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-3 font-semibold text-white hover:bg-teal-700"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Fechar formulário" : "Agendar reunião"}
        </button>

        {showForm && (
          <form
            onSubmit={createMeeting}
            className="mb-5 space-y-3 rounded-2xl border bg-white p-4"
          >
            <h3 className="font-semibold">Nova reunião</h3>

            <label className="block text-sm font-medium">
              Título *
              <input
                required
                maxLength={200}
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                placeholder="Ex.: Reunião da Diretoria"
                className="mt-1 w-full rounded-xl border px-3 py-2.5 outline-none focus:border-teal-500"
              />
            </label>

            <label className="block text-sm font-medium">
              Pauta / descrição
              <textarea
                rows={3}
                value={agenda}
                onChange={(event) => setAgenda(event.target.value)}
                placeholder="Assuntos que serão discutidos..."
                className="mt-1 w-full resize-y rounded-xl border px-3 py-2.5 outline-none focus:border-teal-500"
              />
            </label>

            <label className="block text-sm font-medium">
              Organizador *
              <input
                required
                maxLength={150}
                value={organizerName}
                onChange={(event) => setOrganizerName(event.target.value)}
                placeholder="Nome do responsável"
                className="mt-1 w-full rounded-xl border px-3 py-2.5 outline-none focus:border-teal-500"
              />
            </label>

            <label className="block text-sm font-medium">
              E-mail do organizador
              <input
                type="email"
                value={organizerEmail}
                onChange={(event) => setOrganizerEmail(event.target.value)}
                placeholder="nome@maylon.com.br"
                className="mt-1 w-full rounded-xl border px-3 py-2.5 outline-none focus:border-teal-500"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Data e hora *
                <input
                  required
                  type="datetime-local"
                  min={getDefaultDateTime()}
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                  className="mt-1 w-full min-w-0 rounded-xl border px-3 py-2.5 outline-none focus:border-teal-500"
                />
              </label>

              <label className="block text-sm font-medium">
                Duração
                <select
                  value={duration}
                  onChange={(event) => setDuration(event.target.value)}
                  className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 outline-none focus:border-teal-500"
                >
                  <option value="15">15 minutos</option>
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">1 hora</option>
                  <option value="90">1h30</option>
                  <option value="120">2 horas</option>
                </select>
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <LoaderCircle size={18} className="mr-2 animate-spin" />
                  Agendando no Zoom...
                </>
              ) : (
                <>
                  <Video size={18} className="mr-2" />
                  Criar reunião
                </>
              )}
            </button>
          </form>
        )}

        {notice && (
          <div
            role="status"
            className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800"
          >
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            <span>{notice}</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
          >
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mb-3 relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar reunião, responsável ou ID..."
            className="w-full rounded-xl border bg-white py-3 pl-10 pr-3 text-sm outline-none focus:border-teal-500"
          />
        </div>

        <label className="mb-4 block text-sm">
          Filtrar por status
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            className="mt-1 w-full rounded-xl border bg-white px-3 py-2.5 outline-none focus:border-teal-500"
          >
            <option value="all">Todas as reuniões</option>
            <option value="scheduled">Agendadas</option>
            <option value="in_progress">Em andamento</option>
            <option value="completed">Finalizadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </label>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-slate-500">
            <LoaderCircle size={28} className="animate-spin text-teal-600" />
            <p className="text-sm">Carregando agenda...</p>
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-white px-4 py-10 text-center">
            <CalendarDays
              size={32}
              className="mx-auto mb-3 text-slate-400"
            />
            <p className="font-medium">Nenhuma reunião encontrada</p>
            <p className="mt-1 text-sm text-slate-500">
              Altere os filtros ou agende uma nova reunião.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMeetings.map((meeting) => {
              const info = statusInfo[meeting.status];

              return (
                <article
                  key={meeting.id}
                  className="rounded-2xl border bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                      <Video size={20} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="break-words font-semibold">
                          {meeting.topic}
                        </h3>
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${info.className}`}
                        >
                          {info.label}
                        </span>
                      </div>

                      {meeting.agenda && (
                        <p className="mt-2 whitespace-pre-wrap break-words text-sm text-slate-600">
                          {meeting.agenda}
                        </p>
                      )}

                      <div className="mt-3 space-y-1.5 text-sm text-slate-500">
                        <p className="flex items-center gap-2">
                          <Clock3 size={15} className="shrink-0" />
                          {formatDate(meeting.start_time)}
                          <span>·</span>
                          {meeting.duration_minutes} min
                        </p>
                        <p className="break-words">
                          Organizador: {meeting.organizer_name}
                        </p>
                        {meeting.zoom_meeting_id && (
                          <p className="break-all text-xs">
                            ID Zoom: {meeting.zoom_meeting_id}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {meeting.join_url &&
                          meeting.status !== "cancelled" &&
                          meeting.status !== "completed" && (
                            <a
                              href={meeting.join_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700"
                            >
                              <ExternalLink size={15} />
                              Entrar no Zoom
                            </a>
                          )}

                        {(meeting.status === "scheduled" ||
                          meeting.status === "in_progress") && (
                          <button
                            type="button"
                            onClick={() => void cancelMeeting(meeting)}
                            disabled={cancellingId === meeting.id}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            {cancellingId === meeting.id ? (
                              <LoaderCircle
                                size={15}
                                className="animate-spin"
                              />
                            ) : (
                              <Ban size={15} />
                            )}
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
