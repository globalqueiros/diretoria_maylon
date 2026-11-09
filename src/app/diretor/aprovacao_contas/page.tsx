"use client";

// src/app/atendente/aprovacoes/page.tsx
import { useCallback, useEffect, useState } from "react";
import { BadgeCheck, Check, FileText, IdCard, Loader2, X } from "lucide-react";

type Cadastro = {
  id: number;
  nome: string;
  documento: string | null; // identification_number
  documento_tipo: string | null; // identification_type (cpf | cnh)
  veiculo: string | null;
  placa: string | null;
  enviado_em: string | null; // ISO
  documentos?: { label: string; url: string }[];
};

type Acao = { tipo: "aprovar" | "reprovar"; cadastro: Cadastro } | null;

// Máscaras: ajuste aqui se a sua CNH usar outro formato.
const mascaraCPF = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");

const mascaraCNH = (v: string) =>
  v
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{9})(\d{1,2})$/, "$1-$2");

// Decide a máscara pelo identification_type. Tipo desconhecido: mostra o valor puro.
function formatarDocumento(tipo: string | null, numero: string | null) {
  if (!numero) return { rotulo: null, valor: "—" };
  const t = (tipo ?? "").toLowerCase();
  if (t.includes("cnh") || t.includes("licen") || t.includes("driver"))
    return { rotulo: "CNH", valor: mascaraCNH(numero) };
  if (t.includes("cpf") || t.includes("nid"))
    return { rotulo: "CPF", valor: mascaraCPF(numero) };
  return { rotulo: null, valor: numero };
}

const formatarData = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
    dateStyle: "short",
    timeStyle: "short",
  });

export default function AprovacaoMotoristasPage() {
  const [cadastros, setCadastros] = useState<Cadastro[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [acao, setAcao] = useState<Acao>(null);
  const [motivo, setMotivo] = useState("");
  const [enviando, setEnviando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      const res = await fetch("/api/motoristas/pendentes", { cache: "no-store" });
      if (!res.ok) throw new Error("Não foi possível carregar os cadastros.");
      const data = await res.json();
      setCadastros(data.cadastros ?? []);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const fechar = () => {
    setAcao(null);
    setMotivo("");
  };

  const confirmar = async () => {
    if (!acao) return;
    if (acao.tipo === "reprovar" && motivo.trim().length < 5) return;

    try {
      setEnviando(true);
      const res = await fetch(`/api/motoristas/${acao.cadastro.id}/aprovacao`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: acao.tipo === "aprovar" ? "aprovado" : "reprovado",
          motivo: acao.tipo === "reprovar" ? motivo.trim() : undefined,
        }),
      });
      if (!res.ok) throw new Error("Falha ao salvar a decisão.");
      setCadastros((atual) => atual.filter((c) => c.id !== acao.cadastro.id));
      fechar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado.");
    } finally {
      setEnviando(false);
    }
  };

  return (
    <section className="rounded-2xl bg-white shadow-sm">
      {/* Cabeçalho */}
      <header className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
            <IdCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 md:text-lg">
              Aprovação de Cadastro de Motoristas
            </h2>
            <p className="text-sm text-slate-500">
              Novos motoristas aguardando validação de documentos.
            </p>
          </div>
        </div>
        <span className="w-fit rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
          {cadastros.length} {cadastros.length === 1 ? "pendente" : "pendentes"}
        </span>
      </header>

      {/* Tabela (estilo Bootstrap .table) */}
      <div className="overflow-x-auto px-4 pb-2 sm:px-5">
        <table className="w-full min-w-[720px] text-left align-top text-sm text-slate-900">
          <thead className="align-bottom">
            <tr>
              <th scope="col" className="border-b-2 border-slate-900 px-3 py-2 font-semibold">#</th>
              <th scope="col" className="border-b-2 border-slate-900 px-3 py-2 font-semibold">Nome</th>
              <th scope="col" className="border-b-2 border-slate-900 px-3 py-2 font-semibold">Documento</th>
              <th scope="col" className="border-b-2 border-slate-900 px-3 py-2 font-semibold">Veículo / Placa</th>
              <th scope="col" className="border-b-2 border-slate-900 px-3 py-2 font-semibold">Enviado em</th>
              <th scope="col" className="border-b-2 border-slate-900 px-3 py-2 text-right font-semibold">Ações</th>
            </tr>
          </thead>
          <tbody>
            {!carregando &&
              cadastros.map((c) => {
                const d = formatarDocumento(c.documento_tipo, c.documento);
                return (
                  <tr key={c.id}>
                    <th scope="row" className="border-b border-slate-200 px-3 py-2 font-semibold">
                      {c.id}
                    </th>
                    <td className="border-b border-slate-200 px-3 py-3">{c.nome}</td>
                    <td className="whitespace-nowrap border-b border-slate-200 px-3 py-3">
                      {d.rotulo && <span className="mr-2 font-semibold text-slate-500">{d.rotulo}</span>}
                      {d.valor}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-3">
                      {c.veiculo ?? "—"} · {c.placa ?? "—"}
                    </td>
                    <td className="whitespace-nowrap border-b border-slate-200 px-3 py-3">
                      {c.enviado_em ? formatarData(c.enviado_em) : "—"}
                    </td>
                    <td className="border-b border-slate-200 px-3 py-3">
                      <Botoes cadastro={c} onAcao={setAcao} />
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Estados: carregando / erro / vazio */}
      <div className="p-4 sm:p-5">
        {carregando && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando cadastros...
          </div>
        )}
        {erro && !carregando && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-center text-sm text-red-700">
            {erro}{" "}
            <button onClick={carregar} className="font-semibold underline">
              Tentar de novo
            </button>
          </div>
        )}
        {!carregando && !erro && cadastros.length === 0 && (
          <div className="rounded-xl border border-red-100 bg-red-50/60 px-4 py-5 text-center text-sm text-red-600">
            Nenhum cadastro pendente de aprovação.
          </div>
        )}
      </div>

      {/* Modal de confirmação */}
      {acao && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/50 p-4 sm:items-center"
          onClick={fechar}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <BadgeCheck
                className={`h-5 w-5 ${acao.tipo === "aprovar" ? "text-emerald-600" : "text-red-600"}`}
              />
              <h3 className="text-base font-bold text-slate-900">
                {acao.tipo === "aprovar" ? "Aprovar cadastro" : "Reprovar cadastro"}
              </h3>
            </div>
            <p className="mt-2 text-sm text-slate-600">
              {acao.tipo === "aprovar"
                ? `${acao.cadastro.nome} poderá receber corridas assim que for aprovado.`
                : `Informe o motivo para que ${acao.cadastro.nome} possa corrigir e reenviar.`}
            </p>

            {acao.tipo === "reprovar" && (
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                placeholder="Ex.: CNH ilegível, envie uma foto mais nítida."
                className="mt-3 w-full resize-none rounded-xl border border-slate-300 p-3 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              />
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={fechar}
                className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Cancelar
              </button>
              <button
                onClick={confirmar}
                disabled={enviando || (acao.tipo === "reprovar" && motivo.trim().length < 5)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50 ${
                  acao.tipo === "aprovar"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {enviando && <Loader2 className="h-4 w-4 animate-spin" />}
                {acao.tipo === "aprovar" ? "Aprovar" : "Reprovar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function Botoes({
  cadastro,
  onAcao,
}: {
  cadastro: Cadastro;
  onAcao: (a: Acao) => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <a
        href={`/gerente/motoristas/${cadastro.id}`}
        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        <FileText className="h-3.5 w-3.5" /> Documentos
      </a>
      <button
        onClick={() => onAcao({ tipo: "aprovar", cadastro })}
        className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700"
      >
        <Check className="h-3.5 w-3.5" /> Aprovar
      </button>
      <button
        onClick={() => onAcao({ tipo: "reprovar", cadastro })}
        className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100"
      >
        <X className="h-3.5 w-3.5" /> Reprovar
      </button>
    </div>
  );
}