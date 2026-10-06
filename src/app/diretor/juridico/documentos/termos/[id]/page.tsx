"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Download,
  FileText,
  Loader2,
  Printer,
} from "lucide-react";

type Termo = {
  id: number;
  oficio_numero: string;
  contrato_numero: string;
  marca_modelo: string;
  numero_serie: string;
  numero_patrimonio: string;
  data_entrega: string;
  estado_conservacao: string;
  nome_completo: string;
  cpf: string;
  cargo_funcao: string;
  whatsapp: string;
  pdf_url: string | null;
};

export default function TermoDetalhesPage() {
  const params = useParams();

  const id = Array.isArray(params?.id)
    ? params.id[0]
    : String(params?.id ?? "");

  const [termo, setTermo] = useState<Termo | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;

    async function load() {
      try {
        const response = await fetch(
          `/api/termos-recebimento/${id}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error);
        }

        setTermo(data.data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : "Erro ao carregar termo."
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [id]);

  async function gerarPdf() {
    setGenerating(true);

    try {
      const response = await fetch(
        `/api/termos-recebimento/${id}/pdf`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error);
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");

      a.href = url;
      a.download = `termo-recebimento-${id}.pdf`;

      document.body.appendChild(a);

      a.click();

      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Erro ao gerar PDF."
      );
    } finally {
      setGenerating(false);
    }
  }

  function visualizarPdf() {
    window.open(
      `/api/termos-recebimento/${id}/pdf`,
      "_blank"
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2
          className="animate-spin text-[#35a989]"
          size={32}
        />
      </main>
    );
  }

  if (error || !termo) {
    return (
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 text-center shadow-sm">
          <p className="font-bold text-red-500">
            {error || "Termo não encontrado."}
          </p>

          <Link
            href="/termos/recebimento"
            className="mt-6 inline-flex rounded-2xl bg-[#35a989] px-6 py-3 text-sm font-bold text-white"
          >
            Novo termo
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/termos/recebimento"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#35a989]"
        >
          <ArrowLeft size={18} />
          Novo termo
        </Link>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#35a989]/10 text-[#35a989]">
                <FileText size={28} />
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Termo criado
                </p>

                <h1 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                  {termo.contrato_numero}
                </h1>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                onClick={visualizarPdf}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-slate-200 px-5 text-sm font-bold text-slate-700 hover:bg-slate-50"
              >
                <Printer size={17} />
                Visualizar
              </button>

              <button
                onClick={gerarPdf}
                disabled={generating}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-[#35a989] px-5 text-sm font-bold text-white hover:bg-[#2f997b] disabled:opacity-60"
              >
                {generating ? (
                  <Loader2
                    className="animate-spin"
                    size={17}
                  />
                ) : (
                  <Download size={17} />
                )}

                {generating ? "Gerando..." : "Baixar PDF"}
              </button>
            </div>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Info
              label="Marca / Modelo"
              value={termo.marca_modelo}
            />

            <Info
              label="Número de Série"
              value={termo.numero_serie}
            />

            <Info
              label="Patrimônio"
              value={termo.numero_patrimonio}
            />

            <Info
              label="Data de Entrega"
              value={formatDate(termo.data_entrega)}
            />

            <Info
              label="Estado de Conservação"
              value={termo.estado_conservacao}
            />

            <Info
              label="Nome Completo"
              value={termo.nome_completo}
            />

            <Info
              label="CPF"
              value={termo.cpf}
            />

            <Info
              label="Cargo / Função"
              value={termo.cargo_funcao}
            />

            <Info
              label="WhatsApp"
              value={termo.whatsapp}
            />
          </div>

          <div className="mt-8 rounded-2xl bg-emerald-50 p-5">
            <p className="text-sm font-bold text-emerald-800">
              Termo salvo com sucesso
            </p>

            <p className="mt-1 text-sm text-emerald-700">
              O documento pode ser gerado novamente sempre que necessário.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("pt-BR", {
    timeZone: "UTC",
  });
}