"use client";

import {
  ArrowLeft,
  FileText,
  Loader2,
  Save,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import {
  MODELOS_DOCUMENTOS,
  CampoDocumento,
} from "../../../../config/documentos";

export default function EnviarDocumentoPage() {
  const searchParams = useSearchParams();

  const codigoModelo =
    searchParams.get("modelo")?.toUpperCase() || "";

  const modelo = useMemo(
    () => MODELOS_DOCUMENTOS[codigoModelo],
    [codigoModelo]
  );

  const [form, setForm] = useState<
    Record<string, string>
  >({});

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handleChange(
    name: string,
    value: string
  ) {
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!modelo) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/documentos",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            modelo: modelo.codigo,
            dados: form,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Erro ao enviar documento."
        );
      }

      window.location.href =
        `/documentos/${data.id}`;
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao enviar documento."
      );
    } finally {
      setLoading(false);
    }
  }

  if (!modelo) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-lg rounded-[32px] bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
            <FileText size={30} />
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-slate-900">
            Modelo não encontrado
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            O modelo{" "}
            <strong>{codigoModelo || "não informado"}</strong>{" "}
            não está cadastrado.
          </p>

          <Link
            href="/"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-[#35a989] px-6 text-sm font-bold text-white"
          >
            Voltar
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#35a989]"
        >
          <ArrowLeft size={18} />
          Voltar
        </Link>

        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <header className="bg-gradient-to-r from-[#35a989] to-[#029d6c] px-6 py-8 text-white sm:px-10">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <FileText size={28} />
              </div>

              <div>
                <p className="text-xs font-extrabold uppercase tracking-widest text-white/70">
                  {modelo.codigo}
                </p>

                <h1 className="mt-1 text-2xl font-extrabold sm:text-3xl">
                  {modelo.titulo}
                </h1>

                <p className="mt-1 text-sm text-white/80">
                  {modelo.descricao}
                </p>
              </div>
            </div>
          </header>

          <form
            onSubmit={handleSubmit}
            className="p-6 sm:p-10"
          >
            <div className="grid gap-5 md:grid-cols-2">
              {modelo.campos.map((campo) => (
                <Campo
                  key={campo.name}
                  campo={campo}
                  value={form[campo.name] || ""}
                  onChange={(value) =>
                    handleChange(
                      campo.name,
                      value
                    )
                  }
                />
              ))}
            </div>

            {error && (
              <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            <div className="mt-10 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#35a989] px-7 text-sm font-extrabold text-white shadow-lg shadow-[#35a989]/20 transition hover:bg-[#2f997b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Enviar Documento
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}

function Campo({
  campo,
  value,
  onChange,
}: {
  campo: CampoDocumento;
  value: string;
  onChange: (value: string) => void;
}) {
  if (campo.type === "textarea") {
    return (
      <div className="md:col-span-2">
        <label className="mb-2 block text-sm font-bold text-slate-700">
          {campo.label}
        </label>

        <textarea
          value={value}
          required={campo.required}
          placeholder={campo.placeholder}
          onChange={(e) =>
            onChange(e.target.value)
          }
          rows={5}
          className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#35a989] focus:ring-4 focus:ring-[#35a989]/10"
        />
      </div>
    );
  }

  if (campo.type === "select") {
    return (
      <div>
        <label className="mb-2 block text-sm font-bold text-slate-700">
          {campo.label}
        </label>

        <select
          value={value}
          required={campo.required}
          onChange={(e) =>
            onChange(e.target.value)
          }
          className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm outline-none transition focus:border-[#35a989] focus:ring-4 focus:ring-[#35a989]/10"
        >
          <option value="">
            Selecione...
          </option>

          {campo.options?.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {campo.label}
      </label>

      <input
        type={campo.type || "text"}
        value={value}
        required={campo.required}
        placeholder={campo.placeholder}
        onChange={(e) =>
          onChange(e.target.value)
        }
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#35a989] focus:ring-4 focus:ring-[#35a989]/10"
      />
    </div>
  );
}