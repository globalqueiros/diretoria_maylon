"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  FileText,
  RefreshCw,
  AlertCircle,
  Send,
  MessageCircle,
  ShieldCheck,
  UserRound,
} from "lucide-react";

const ROTA_LISTA = "/atendente/protocolos";

type Evento = {
  id: number;
  texto: string;
  data: string;
};

type HistoricoResponse = {
  id: number;
  status?: string;
  historico: Evento[];
  erro?: string;
};

export default function ProtocoloDetalhePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [historico, setHistorico] = useState<Evento[]>([]);
  const [status, setStatus] = useState("");
  const [resposta, setResposta] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [encerrando, setEncerrando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const encerrado = status.toLowerCase() === "encerrado";

  const carregarHistorico = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const res = await fetch(`/api/protocolos/${id}`, {
        cache: "no-store",
        credentials: "include",
      });

      const dados: HistoricoResponse = await res.json();

      if (!res.ok) {
        throw new Error(dados.erro || "Não foi possível carregar o protocolo.");
      }

      setHistorico(dados.historico ?? []);
      setStatus(dados.status ?? "");
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Erro ao carregar o protocolo."
      );
    } finally {
      setCarregando(false);
    }
  }, [id]);

  useEffect(() => {
    void carregarHistorico();
  }, [carregarHistorico]);

  async function enviarResposta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const texto = resposta.trim();
    if (!texto || enviando || encerrado) return;

    setEnviando(true);
    setErro("");
    setMensagem("");

    try {
      const res = await fetch(`/api/protocolos/${id}/respostas`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto }),
      });

      const dados = await res.json();

      if (!res.ok) {
        throw new Error(
          dados.erro || "Não foi possível enviar a resposta."
        );
      }

      setResposta("");
      setMensagem("Resposta enviada com sucesso.");
      await carregarHistorico();
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Erro ao enviar a resposta."
      );
    } finally {
      setEnviando(false);
    }
  }

  async function encerrarProtocolo() {
    if (encerrado || encerrando) return;

    const confirmado = window.confirm(
      `Deseja realmente encerrar o protocolo #${id}?`
    );

    if (!confirmado) return;

    setEncerrando(true);
    setErro("");
    setMensagem("");

    try {
      const res = await fetch(`/api/protocolos/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "encerrado" }),
      });

      const dados = await res.json();

      if (!res.ok) {
        throw new Error(dados.erro || "Não foi possível encerrar o protocolo.");
      }

      setStatus("encerrado");
      setMensagem("Protocolo encerrado com sucesso.");
      await carregarHistorico();
    } catch (e) {
      setErro(
        e instanceof Error ? e.message : "Erro ao encerrar o protocolo."
      );
    } finally {
      setEncerrando(false);
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-8xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => router.push(ROTA_LISTA)}
              className="rounded-xl cursor-pointer border border-slate-200 bg-white p-3 text-slate-600 shadow-sm transition hover:bg-slate-50"
              aria-label="Voltar para protocolos"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div>
              <p className="text-sm font-medium text-white">
                Central de atendimento
              </p>
              <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Protocolo #{id}
              </h1>
            </div>
          </div>

          <button
            type="button"
            onClick={() => void carregarHistorico()}
            disabled={carregando}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-4 w-4 ${carregando ? "animate-spin" : ""}`}
            />
            Atualizar
          </button>
        </header>

        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className={`rounded-xl p-3 ${encerrado
                  ? "bg-slate-100 text-slate-500"
                  : "bg-emerald-50 text-emerald-600"
                }`}
            >
              {encerrado ? (
                <CheckCircle2 className="h-6 w-6" />
              ) : (
                <MessageCircle className="h-6 w-6" />
              )}
            </div>

            <div>
              <p className="font-semibold text-slate-900">
                {encerrado ? "Atendimento encerrado" : "Atendimento em aberto"}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {encerrado
                  ? "Este protocolo não aceita novas respostas."
                  : "Consulte o histórico e responda à solicitação."}
              </p>
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${encerrado
                ? "bg-slate-100 text-slate-600"
                : "bg-emerald-100 text-emerald-700"
              }`}
          >
            {encerrado ? "ENCERRADO" : "EM ATENDIMENTO"}
          </span>
        </section>

        {/* Alertas */}
        {erro && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{erro}</p>
          </div>
        )}

        {mensagem && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <p>{mensagem}</p>
          </div>
        )}

        {/* Histórico */}
        <section className="flex h-[56vh] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-5 sm:px-7">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-teal-50 p-2.5 text-teal-700">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-bold text-slate-900">
                  Conversa do atendimento
                </h2>
                <p className="text-sm text-slate-500">
                  Protocolo #{id} · {historico.length} registro(s)
                </p>
              </div>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50/70 p-4 sm:p-7">
            {carregando ? (
              <div className="flex flex-col items-center gap-3 py-14 text-slate-500">
                <RefreshCw className="h-6 w-6 animate-spin text-teal-700" />
                <p className="text-sm">Carregando conversa...</p>
              </div>
            ) : historico.length === 0 ? (
              <div className="flex flex-col items-center py-14 text-center">
                <div className="mb-3 rounded-2xl bg-white p-4 text-slate-400 shadow-sm">
                  <MessageCircle className="h-7 w-7" />
                </div>
                <p className="font-semibold text-slate-700">
                  Nenhuma mensagem ainda
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  As movimentações aparecerão aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {historico.map((evento) => {
                  const encerramento = evento.texto
                    .toLowerCase()
                    .includes("protocolo encerrado");

                  const respostaAtendimento = evento.texto
                    .toLowerCase()
                    .startsWith("resposta do atendimento:");

                  const textoExibido = respostaAtendimento
                    ? evento.texto.replace(/^resposta do atendimento:\s*/i, "")
                    : evento.texto;

                  return (
                    <div
                      key={evento.id}
                      className={`flex items-end gap-3 ${respostaAtendimento ? "justify-end" : "justify-start"
                        }`}
                    >
                      {!respostaAtendimento && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 shadow-sm ring-1 ring-slate-200">
                          {encerramento ? (
                            <ShieldCheck className="h-4 w-4" />
                          ) : (
                            <UserRound className="h-4 w-4" />
                          )}
                        </div>
                      )}

                      <div
                        className={`max-w-[88%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-[75%] ${encerramento
                            ? "border border-slate-200 bg-white text-slate-600"
                            : respostaAtendimento
                              ? "rounded-br-md bg-teal-800 text-white"
                              : "rounded-bl-md border border-slate-200 bg-white text-slate-800"
                          }`}
                      >
                        <p className="mb-1 text-[11px] font-bold uppercase tracking-wide opacity-75">
                          {encerramento
                            ? "Sistema"
                            : respostaAtendimento
                              ? "Equipe de atendimento"
                              : "Solicitação"}
                        </p>

                        <p className="whitespace-pre-wrap break-words text-sm leading-6">
                          {textoExibido}
                        </p>

                        <p className="mt-2 flex items-center justify-end gap-1 text-[11px] opacity-70">
                          <Clock3 className="h-3 w-3" />
                          {evento.data}
                        </p>
                      </div>

                      {respostaAtendimento && (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-100 text-teal-800">
                          <ShieldCheck className="h-4 w-4" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Responder */}
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-5 py-5 sm:px-7">
            <h2 className="font-bold text-slate-900">Responder solicitação</h2>
            <p className="mt-1 text-sm text-slate-500">
              Escreva uma mensagem para registrar no atendimento.
            </p>
          </div>

          <form onSubmit={enviarResposta} className="space-y-4 p-5 sm:p-7">
            <label
              htmlFor="resposta"
              className="block text-sm font-semibold text-slate-700"
            >
              Sua resposta
            </label>

            <textarea
              id="resposta"
              value={resposta}
              onChange={(e) => setResposta(e.target.value)}
              disabled={encerrado || enviando}
              maxLength={3000}
              rows={5}
              placeholder={
                encerrado
                  ? "Este protocolo foi encerrado."
                  : "Digite sua resposta ao solicitante..."
              }
              className="w-full resize-y rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:bg-white focus:ring-4 focus:ring-teal-50 disabled:cursor-not-allowed disabled:opacity-60"
            />

            <div className="flex flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-400">
                {resposta.length}/3000 caracteres
              </p>

              <button
                type="submit"
                disabled={encerrado || enviando || !resposta.trim()}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-800 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-900 focus:outline-none focus:ring-4 focus:ring-teal-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {enviando ? "Enviando resposta..." : "Enviar resposta"}
              </button>
            </div>
          </form>
        </section>
        <section className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:p-6">
          <div>
            <h2 className="font-bold text-slate-900">
              Finalização do atendimento
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {encerrado
                ? "O protocolo já foi finalizado."
                : "Encerre somente após concluir o atendimento."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void encerrarProtocolo()}
            disabled={encerrado || encerrando || carregando}
            className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${encerrado
                ? "bg-slate-100 text-slate-500"
                : "bg-red-600 text-white shadow-sm hover:bg-red-700"
              }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            {encerrando
              ? "Encerrando..."
              : encerrado
                ? "Protocolo encerrado"
                : "Encerrar atendimento"}
          </button>
        </section>
      </div>
    </main>
  );
}