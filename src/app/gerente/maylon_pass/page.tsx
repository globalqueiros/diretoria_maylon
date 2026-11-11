"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  ShieldCheck,
  Loader2,
  Eye,
  X,
} from "lucide-react";

type Solicitacao = {
  id: number;
  nome: string;
  email: string;
  telefone: string;
  plano: string;
  adicionais: string[];
  valor: number;
  observacao?: string;
  status: "pendente" | "aprovado" | "recusado";
  solicitante?: string;
  criado_em?: string;
};

type Status = Solicitacao["status"];
type Filtro = "todas" | Status;

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const NOMES_PLANO: Record<string, string> = {
  basico: "Básico",
  plus: "Plus",
  premium: "Premium",
};

const NOMES_ADICIONAL: Record<string, string> = {
  home: "Maylon Home",
  van_escolar: "Maylon Van Escolar",
};

const STATUS_ESTILO: Record<Status, { label: string; cls: string }> = {
  pendente: { label: "Pendente", cls: "bg-amber-100 text-amber-700" },
  aprovado: { label: "Aprovado", cls: "bg-green-100 text-green-700" },
  recusado: { label: "Recusado", cls: "bg-red-100 text-red-700" },
};

function formatarTelefone(valor?: string | null) {
  if (!valor) return "—";
  const n = valor.replace(/\D/g, "");
  if (n.length === 11) return n.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (n.length === 10) return n.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
  return valor;
}

// Datas sempre no horário de Brasília
function formatarData(valor?: string) {
  if (!valor) return "—";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function PainelAprovacaoMaylonPass() {
  const [lista, setLista] = useState<Solicitacao[]>([]);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState<number | null>(null);
  const [erro, setErro] = useState("");
  const [selecionada, setSelecionada] = useState<Solicitacao | null>(null);
  const [confirmando, setConfirmando] = useState<"aprovar" | "recusar" | null>(
    null
  );
  const [erroModal, setErroModal] = useState("");

  async function carregar() {
    try {
      setCarregando(true);
      setErro("");

      const res = await fetch("/api/planos/solicitacoes?escopo=gerente", {
        cache: "no-store",
      });

      if (!res.ok) throw new Error("Erro ao carregar solicitações.");

      const data = await res.json();
      setLista(data.solicitacoes || []);
    } catch (e: unknown) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar solicitações.");
    } finally {
      setCarregando(false);
    }
  }

  function fecharModal() {
    if (processando !== null) return;
    setSelecionada(null);
    setConfirmando(null);
    setErroModal("");
  }

  async function decidir(id: number, decisao: "aprovar" | "recusar") {
    try {
      setProcessando(id);
      setErroModal("");

      const res = await fetch(`/api/planos/solicitacoes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decisao }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        throw new Error(data?.error || "Não foi possível processar.");
      }

      setSelecionada(null);
      setConfirmando(null);
      await carregar();
    } catch (e: unknown) {
      setErroModal(e instanceof Error ? e.message : "Não foi possível processar.");
    } finally {
      setProcessando(null);
    }
  }

  // Modal: Esc fecha e a página de trás não rola
  useEffect(() => {
    if (!selecionada) return;

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape" && processando === null) {
        setSelecionada(null);
        setConfirmando(null);
        setErroModal("");
      }
    };

    document.addEventListener("keydown", aoTeclar);
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.body.style.overflow = overflowAnterior;
    };
  }, [selecionada, processando]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void carregar();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const contagem: Record<Filtro, number> = {
    todas: lista.length,
    pendente: lista.filter((x) => x.status === "pendente").length,
    aprovado: lista.filter((x) => x.status === "aprovado").length,
    recusado: lista.filter((x) => x.status === "recusado").length,
  };

  const filtradas =
    filtro === "todas"
      ? lista
      : lista.filter((item) => item.status === filtro);

  const resumo: { titulo: string; status: Filtro }[] = [
    { titulo: "Todas", status: "todas" },
    { titulo: "Pendentes", status: "pendente" },
    { titulo: "Aprovados", status: "aprovado" },
    { titulo: "Recusados", status: "recusado" },
  ];

  const tituloLista =
    filtro === "todas"
      ? "Todas as solicitações"
      : `Solicitações ${STATUS_ESTILO[filtro].label.toLowerCase()}s`;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-8xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="text-white" size={28} />
              <h1 className="text-2xl font-extrabold text-white">
                Aprovação Maylon Pass
              </h1>
            </div>
            <p className="mt-1 text-sm text-white">
              Gerencie as solicitações de novos planos.
            </p>
          </div>
          <button
            onClick={carregar}
            disabled={carregando}
            className="flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <RefreshCw size={16} className={carregando ? "animate-spin" : ""} />
            Atualizar
          </button>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {resumo.map(({ titulo, status }) => (
            <button
              key={status}
              onClick={() => setFiltro(status)}
              aria-pressed={filtro === status}
              className={`cursor-pointer rounded-2xl border bg-white p-5 text-left shadow-sm transition ${
                filtro === status
                  ? "border-teal-500 ring-2 ring-teal-500/10"
                  : "border-slate-200 hover:border-teal-300"
              }`}
            >
              <p className="text-sm font-semibold text-slate-500">{titulo}</p>
              <p className="mt-2 text-3xl font-extrabold text-slate-900">
                {contagem[status]}
              </p>
            </button>
          ))}
        </section>

        {erro && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
          >
            {erro}
          </div>
        )}

        <section className="overflow-hidden rounded-3xl bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <h2 className="text-base font-extrabold text-slate-900">
              {tituloLista}
            </h2>
            <span className="text-xs font-semibold text-slate-500">
              {filtradas.length}{" "}
              {filtradas.length === 1 ? "registro" : "registros"}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="bg-slate-50 text-xs font-bold text-slate-500">
                <tr>
                  <th className="px-5 py-3">Nº</th>
                  <th className="px-5 py-3">Usuário</th>
                  <th className="px-5 py-3">Telefone</th>
                  <th className="px-5 py-3">Plano</th>
                  <th className="px-5 py-3">Adicionais</th>
                  <th className="px-5 py-3 text-right">Valor / mês</th>
                  <th className="px-5 py-3">Solicitante</th>
                  <th className="px-5 py-3">Solicitado em</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {carregando ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-5 py-16 text-center"
                    >
                      <Loader2
                        className="mx-auto animate-spin text-teal-600"
                        size={30}
                      />
                    </td>
                  </tr>
                ) : filtradas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-5 py-14 text-center"
                    >
                      <Clock className="mx-auto text-slate-300" size={36} />
                      <p className="mt-3 font-bold text-slate-700">
                        {filtro === "todas"
                          ? "Nenhuma solicitação encontrada."
                          : `Nenhuma solicitação ${STATUS_ESTILO[filtro].label.toLowerCase()}.`}
                      </p>
                      {filtro !== "todas" && (
                        <button
                          onClick={() => setFiltro("todas")}
                          className="mt-4 cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-teal-700 transition hover:bg-teal-50"
                        >
                          Ver todas
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filtradas.map((item) => {
                    const estilo = STATUS_ESTILO[item.status];

                    return (
                      <tr key={item.id} className="align-top hover:bg-slate-50/60">
                        <td className="whitespace-nowrap px-5 py-4 font-bold text-slate-500">
                          #{item.id}
                        </td>

                        <td className="px-5 py-4">
                          <p className="font-bold text-slate-900">{item.nome}</p>
                          <p className="text-xs text-slate-500">{item.email}</p>
                          {item.observacao && (
                            <p
                              className="mt-1 max-w-xs truncate text-xs italic text-slate-400"
                              title={item.observacao}
                            >
                              Obs.: {item.observacao}
                            </p>
                          )}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatarTelefone(item.telefone)}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 font-semibold text-slate-800">
                          {NOMES_PLANO[item.plano] ?? item.plano}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {item.adicionais?.length
                            ? item.adicionais
                                .map((a) => NOMES_ADICIONAL[a] ?? a)
                                .join(", ")
                            : "Nenhum"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-right font-extrabold text-teal-700">
                          {moeda.format(item.valor)}
                        </td>

                        <td className="px-5 py-4 text-slate-600">
                          {item.solicitante || "Não informado"}
                        </td>

                        <td className="whitespace-nowrap px-5 py-4 text-slate-600">
                          {formatarData(item.criado_em)}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${estilo.cls}`}
                          >
                            {estilo.label}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => setSelecionada(item)}
                            className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-teal-700 transition hover:bg-teal-50"
                          >
                            <Eye size={15} />
                            {item.status === "pendente" ? "Analisar" : "Detalhes"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {selecionada && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 sm:items-center sm:p-4"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) fecharModal();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-titulo"
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-xl sm:max-w-lg sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">
                  Solicitação #{selecionada.id}
                </p>
                <h2
                  id="modal-titulo"
                  className="mt-0.5 truncate text-lg font-extrabold text-slate-900"
                >
                  {selecionada.nome}
                </h2>
                <span
                  className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold ${STATUS_ESTILO[selecionada.status].cls}`}
                >
                  {STATUS_ESTILO[selecionada.status].label}
                </span>
              </div>
              <button
                onClick={fecharModal}
                disabled={processando !== null}
                aria-label="Fechar"
                className="shrink-0 cursor-pointer rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <dl className="space-y-3 p-5 text-sm">
              {[
                ["E-mail", selecionada.email],
                ["Telefone", formatarTelefone(selecionada.telefone)],
                [
                  "Plano",
                  NOMES_PLANO[selecionada.plano] ?? selecionada.plano,
                ],
                [
                  "Adicionais",
                  selecionada.adicionais?.length
                    ? selecionada.adicionais
                        .map((a) => NOMES_ADICIONAL[a] ?? a)
                        .join(", ")
                    : "Nenhum",
                ],
                ["Solicitante", selecionada.solicitante || "Não informado"],
                ["Solicitado em", formatarData(selecionada.criado_em)],
              ].map(([rotulo, valor]) => (
                <div key={rotulo} className="flex justify-between gap-4">
                  <dt className="shrink-0 text-slate-500">{rotulo}</dt>
                  <dd className="text-right font-semibold text-slate-900">
                    {valor}
                  </dd>
                </div>
              ))}

              {selecionada.observacao && (
                <div className="rounded-xl bg-slate-50 p-3">
                  <dt className="text-xs font-semibold text-slate-500">
                    Observação
                  </dt>
                  <dd className="mt-1 text-slate-800">
                    {selecionada.observacao}
                  </dd>
                </div>
              )}

              <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-4">
                <dt className="font-semibold text-slate-600">Total por mês</dt>
                <dd className="text-2xl font-extrabold text-teal-700">
                  {moeda.format(selecionada.valor)}
                </dd>
              </div>
            </dl>

            {erroModal && (
              <div
                role="alert"
                className="mx-5 mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700"
              >
                {erroModal}
              </div>
            )}

            <div className="border-t border-slate-100 bg-slate-50 p-5">
              {selecionada.status !== "pendente" ? (
                <button
                  onClick={fecharModal}
                  className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100"
                >
                  Fechar
                </button>
              ) : confirmando ? (
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-800">
                    {confirmando === "aprovar"
                      ? "Aprovar esta solicitação e ativar o plano?"
                      : "Recusar esta solicitação?"}
                  </p>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <button
                      disabled={processando !== null}
                      onClick={() => {
                        setConfirmando(null);
                        setErroModal("");
                      }}
                      className="cursor-pointer rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                    >
                      Voltar
                    </button>
                    <button
                      disabled={processando !== null}
                      onClick={() => decidir(selecionada.id, confirmando)}
                      className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                        confirmando === "aprovar"
                          ? "bg-teal-600 hover:bg-teal-700"
                          : "bg-red-600 hover:bg-red-700"
                      }`}
                    >
                      {processando !== null && (
                        <Loader2 className="animate-spin" size={16} />
                      )}
                      {confirmando === "aprovar"
                        ? "Sim, aprovar"
                        : "Sim, recusar"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    onClick={() => setConfirmando("recusar")}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50"
                  >
                    <XCircle size={17} />
                    Recusar
                  </button>
                  <button
                    onClick={() => setConfirmando("aprovar")}
                    className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-teal-700"
                  >
                    <CheckCircle size={17} />
                    Aprovar e ativar plano
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}