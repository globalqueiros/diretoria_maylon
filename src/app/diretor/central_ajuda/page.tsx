
"use client";

import { useState, type FormEvent } from "react";
import {
  Video,
  CalendarDays,
  FileLock,
  MessagesSquare,
  Headset,
  ShieldCheck,
  Copy,
  CheckCircle2,
  LoaderCircle,
  X,
  Clock,
  ArrowUpRight,
  Building2,
  Users,
  Sparkles,
  ClipboardList,
  BriefcaseBusiness,
} from "lucide-react";

type Meeting = {
  topic: string;
  join_url: string;
  password?: string;
  start_time: string;
};

type MeetingResponse = {
  meeting?: Partial<Meeting>;
  topic?: string;
  join_url?: string;
  password?: string;
  start_time?: string;
  error?: string;
  message?: string;
};

const INITIAL_FORM = {
  topic: "",
  start_time: "",
  duration: "30",
  agenda: "",
};

const MODULOS = [
  {
    titulo: "Agenda Executiva",
    descricao: "Organize compromissos, reuniões e atividades institucionais.",
    icon: CalendarDays,
    cor: "bg-blue-50 text-blue-600",
    status: "Em breve",
  },
  {
    titulo: "Documentos da Diretoria",
    descricao: "Consulte atas, relatórios e documentos administrativos.",
    icon: FileLock,
    cor: "bg-violet-50 text-violet-600",
    status: "Em breve",
  },
  {
    titulo: "Comunicação Interna",
    descricao: "Acesse o Slack da MAYLON para acompanhar comunicados, conversar com equipes e compartilhar informações institucionais.",
    icon: MessagesSquare,
    cor: "bg-amber-50 text-amber-600",
    status: "Acessar Slack",
    link: "https://join.slack.com/t/maylon-grupo/shared_invite/zt-48i0334qf-M_LdsNNL3grr06FMJFpAkA",
  },
  {
    titulo: "Suporte Executivo",
    descricao: "Centralize solicitações e necessidades da diretoria.",
    icon: Headset,
    cor: "bg-emerald-50 text-emerald-700",
    status: "Em breve",
  },
  {
    titulo: "Solicitações Administrativas",
    descricao: "Organize demandas e procedimentos administrativos.",
    icon: ClipboardList,
    cor: "bg-rose-50 text-rose-600",
    status: "Em breve",
  },
];

export default function CentralAjudaDiretoriaPage() {
  const [modalAberto, setModalAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [reuniao, setReuniao] = useState<Meeting | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);

  function abrirModal() {
    setErro("");
    setReuniao(null);
    setCopiado(false);
    setModalAberto(true);
  }

  function fecharModal() {
    if (carregando) return;

    setModalAberto(false);
    setErro("");
    setReuniao(null);
    setCopiado(false);
  }

  async function agendarReuniao(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setCopiado(false);

    if (!form.topic.trim()) {
      setErro("Informe o assunto da reunião.");
      return;
    }

    const dataSelecionada = new Date(form.start_time);

    if (!form.start_time || Number.isNaN(dataSelecionada.getTime())) {
      setErro("Informe uma data e um horário válidos.");
      return;
    }

    if (dataSelecionada.getTime() <= Date.now()) {
      setErro("Escolha uma data e um horário futuros.");
      return;
    }

    setCarregando(true);

    try {
      const response = await fetch("/api/zoom/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topic: form.topic.trim(),
          start_time: form.start_time,
          duration: Number(form.duration),
          agenda: form.agenda.trim(),
        }),
      });

      const data: MeetingResponse = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
          data.message ||
          "Não foi possível criar a reunião."
        );
      }

      const dadosReuniao = data.meeting ?? data;

      if (!dadosReuniao.join_url) {
        throw new Error("A API não retornou o link de participação.");
      }

      setReuniao({
        topic: dadosReuniao.topic || form.topic.trim(),
        join_url: dadosReuniao.join_url,
        password: dadosReuniao.password || undefined,
        start_time: dadosReuniao.start_time || form.start_time,
      });
    } catch (error: unknown) {
      setErro(
        error instanceof Error
          ? error.message
          : "Ocorreu um erro inesperado."
      );
    } finally {
      setCarregando(false);
    }
  }

  async function copiarLink() {
    if (!reuniao?.join_url) return;

    try {
      await navigator.clipboard.writeText(reuniao.join_url);
      setCopiado(true);
    } catch {
      setErro("Não foi possível copiar o link automaticamente.");
    }
  }

  function formatarData(data?: string) {
    if (!data) return "Horário não informado";

    const convertida = new Date(data);

    if (Number.isNaN(convertida.getTime())) return data;

    return convertida.toLocaleString("pt-BR", {
      dateStyle: "long",
      timeStyle: "short",
    });
  }

  function concluirReuniao() {
    setModalAberto(false);
    setReuniao(null);
    setErro("");
    setCopiado(false);
    setForm({ ...INITIAL_FORM });
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-8xl space-y-8">

        <header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Central de Ajuda da Diretoria
            </h1>
            <p className="mt-1 text-sm text-white sm:text-base">
              Ambiente institucional de apoio à gestão executiva.
            </p>
          </div>
        </header>
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#126c59] via-[#19876d] to-[#35a989] p-7 text-white shadow-lg sm:p-10">
          <div className="relative z-10 max-w-2xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold">
              <Sparkles size={15} />
              AMBIENTE EXECUTIVO MAYLON
            </div>

            <h2 className="text-2xl font-bold leading-tight sm:text-4xl">
              Gestão, comunicação e decisões em um só lugar.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
              Um espaço dedicado à diretoria para facilitar a
              organização institucional, promover reuniões e
              centralizar as atividades executivas.
            </p>

            <button
              type="button"
              onClick={abrirModal}
              className="mt-7 cursor-pointer inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-[#147d65] shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-50"
            >
              <Video size={18} />
              Agendar reunião
              <ArrowUpRight size={16} />
            </button>
          </div>

          <div className="pointer-events-none absolute -right-12 -top-24 hidden h-80 w-80 rounded-full border-[40px] border-white/10 lg:block" />

          <div className="pointer-events-none absolute -bottom-36 right-24 hidden h-80 w-80 rounded-full bg-white/10 lg:block" />

          <BriefcaseBusiness
            size={160}
            className="pointer-events-none absolute bottom-5 right-12 hidden text-white/10 lg:block"
          />
        </section>

        <section>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-white">
              Serviços da Diretoria
            </h2>
            <p className="mt-0 text-sm text-white">
              Ferramentas de apoio à administração e gestão institucional.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            <button
              type="button"
              onClick={abrirModal}
              className="group rounded-2xl border border-[#35a989]/30 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-[#35a989] hover:shadow-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#e9f7f2] text-[#259b78]">
                  <Video size={24} />
                </div>

                <ArrowUpRight
                  size={19}
                  className="text-slate-300 transition group-hover:text-[#259b78]"
                />
              </div>

              <div className="mt-5 flex items-center gap-2">
                <h3 className="font-bold text-slate-900">
                  Reuniões da Diretoria
                </h3>
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700">
                  ATIVO
                </span>
              </div>

              <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                Agende reuniões executivas e videoconferências pelo Zoom.
              </p>

              <div className="mt-5 text-sm font-bold text-[#259b78]">
                Agendar reunião
              </div>
            </button>

            {MODULOS.map((modulo) => {
              const Icon = modulo.icon;

              return (
                <a
                  key={modulo.titulo}
                  href={modulo.link || undefined}
                  target={modulo.link ? "_blank" : undefined}
                  rel={modulo.link ? "noopener noreferrer" : undefined}
                  className="group block rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-[#35a989] hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${modulo.cor}`}>
                      <Icon size={23} />
                    </div>

                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${modulo.link
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                      }`}>
                      {modulo.status}
                    </span>
                  </div>

                  <h3 className="mt-5 font-bold text-slate-900">
                    {modulo.titulo}
                  </h3>

                  <p className="mt-2 min-h-12 text-sm leading-6 text-slate-500">
                    {modulo.descricao}
                  </p>

                  <div className="mt-5 flex items-center justify-between text-xs font-semibold text-[#259b78]">
                    <span>{modulo.link ? "Entrar no Slack" : "Em desenvolvimento"}</span>
                    <ArrowUpRight size={17} />
                  </div>
                </a>
              );
            })}
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#e9f7f2] text-[#259b78]">
                <CalendarDays size={23} />
              </div>

              <div>
                <h2 className="font-bold text-slate-900">
                  Organização executiva
                </h2>

                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Utilize os recursos da Central de Ajuda para
                  organizar reuniões, compartilhar informações
                  e acompanhar as atividades institucionais.
                </p>

                <button
                  type="button"
                  onClick={abrirModal}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#35a989] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#278d72]"
                >
                  <Video size={17} />
                  Criar reunião
                </button>
              </div>
            </div>
          </div>


          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md sm:p-8">
            <div className="flex items-center justify-between">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <Users size={23} />
              </div>

              <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">
                INSTITUCIONAL
              </span>
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-900">
              Integração Institucional
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Fortaleça a comunicação, a colaboração e o alinhamento estratégico
              entre os departamentos e responsáveis pela gestão da MAYLON.
            </p>

            <div className="mt-5 space-y-3 border-t border-slate-100 pt-4">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <MessagesSquare size={17} className="text-[#35a989]" />
                Comunicação entre departamentos
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Building2 size={17} className="text-[#35a989]" />
                Alinhamento institucional
              </div>

              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Users size={17} className="text-[#35a989]" />
                Colaboração entre equipes
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between text-xs font-semibold text-[#259b78]">
              <span>Ambiente corporativo</span>
              <ShieldCheck size={17} />
            </div>
          </div>

        </section>
      </div>

      {modalAberto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              fecharModal();
            }
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-reuniao-titulo"
            className="my-auto w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#e9f7f2] text-[#259b78]">
                  <Video size={22} />
                </div>

                <div>
                  <h2
                    id="modal-reuniao-titulo"
                    className="font-bold text-slate-900"
                  >
                    {reuniao ? "Reunião agendada" : "Agendar reunião"}
                  </h2>

                  <p className="text-xs text-slate-500">
                    Diretoria MAYLON • Zoom
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={fecharModal}
                disabled={carregando}
                aria-label="Fechar modal"
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
              >
                <X size={21} />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-6">
              {reuniao ? (
                <div className="space-y-5">
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                    <div className="flex items-center gap-2 font-bold text-emerald-800">
                      <CheckCircle2 size={21} />
                      Reunião criada com sucesso!
                    </div>

                    <p className="mt-3 font-semibold text-emerald-950">
                      {reuniao.topic}
                    </p>

                    <p className="mt-2 flex items-center gap-2 text-sm text-emerald-800">
                      <Clock size={16} />
                      {formatarData(reuniao.start_time)}
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="link-reuniao"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Link de participação
                    </label>

                    <input
                      id="link-reuniao"
                      readOnly
                      value={reuniao.join_url}
                      onFocus={(event) => event.currentTarget.select()}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm outline-none"
                    />

                    <button
                      type="button"
                      onClick={copiarLink}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#35a989] px-4 py-3 font-bold text-white transition hover:bg-[#278d72]"
                    >
                      {copiado ? (
                        <CheckCircle2 size={17} />
                      ) : (
                        <Copy size={17} />
                      )}
                      {copiado ? "Link copiado!" : "Copiar link"}
                    </button>
                  </div>

                  {reuniao.password && (
                    <div className="rounded-xl border border-slate-200 p-4">
                      <p className="text-sm text-slate-500">
                        Senha da reunião
                      </p>

                      <p className="mt-1 font-bold text-slate-900">
                        {reuniao.password}
                      </p>
                    </div>
                  )}

                  {erro && (
                    <p role="alert" className="text-sm text-red-600">
                      {erro}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={concluirReuniao}
                    className="w-full rounded-xl border border-slate-300 px-4 py-3 font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    Concluir
                  </button>
                </div>
              ) : (
                <form onSubmit={agendarReuniao} className="space-y-5">
                  <div>
                    <label
                      htmlFor="topic"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Assunto da reunião *
                    </label>

                    <input
                      id="topic"
                      name="topic"
                      required
                      maxLength={200}
                      value={form.topic}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          topic: event.target.value,
                        })
                      }
                      placeholder="Ex.: Reunião mensal da diretoria"
                      className="w-full rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-[#35a989] focus:ring-2 focus:ring-[#35a989]/15"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="start_time"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Data e horário *
                      </label>

                      <input
                        id="start_time"
                        name="start_time"
                        type="datetime-local"
                        required
                        value={form.start_time}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            start_time: event.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-[#35a989]"
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="duration"
                        className="mb-2 block text-sm font-semibold text-slate-700"
                      >
                        Duração *
                      </label>

                      <select
                        id="duration"
                        name="duration"
                        value={form.duration}
                        onChange={(event) =>
                          setForm({
                            ...form,
                            duration: event.target.value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-[#35a989]"
                      >
                        <option value="15">15 minutos</option>
                        <option value="30">30 minutos</option>
                        <option value="45">45 minutos</option>
                        <option value="60">1 hora</option>
                        <option value="90">1 hora e 30 minutos</option>
                        <option value="120">2 horas</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="agenda"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Pauta da reunião
                    </label>

                    <textarea
                      id="agenda"
                      name="agenda"
                      rows={4}
                      maxLength={2000}
                      value={form.agenda}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          agenda: event.target.value,
                        })
                      }
                      placeholder="Descreva os assuntos e as decisões que serão discutidos..."
                      className="w-full resize-y rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-[#35a989] focus:ring-2 focus:ring-[#35a989]/15"
                    />
                  </div>

                  {erro && (
                    <div
                      role="alert"
                      className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                    >
                      {erro}
                    </div>
                  )}

                  <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={fecharModal}
                      disabled={carregando}
                      className="rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancelar
                    </button>

                    <button
                      type="submit"
                      disabled={carregando}
                      className="flex items-center justify-center gap-2 rounded-xl bg-[#35a989] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#278d72] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {carregando ? (
                        <>
                          <LoaderCircle size={18} className="animate-spin" />
                          Criando reunião...
                        </>
                      ) : (
                        <>
                          <Video size={18} />
                          Criar reunião Zoom
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}