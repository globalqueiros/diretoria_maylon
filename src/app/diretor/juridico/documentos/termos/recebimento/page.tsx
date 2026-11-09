"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  FileText,
  Loader2,
  Save,
} from "lucide-react";
import Link from "next/link";

export default function TermoRecebimentoPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    marca_modelo: "",
    numero_serie: "",
    numero_patrimonio: "",
    data_entrega: "",
    estado_conservacao: "Perfeito estado de conservação",
    nome_completo: "",
    cpf: "",
    cargo_funcao: "",
    whatsapp: "",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/termos-recebimento", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao salvar termo.");
      }

      setSuccess("Termo criado com sucesso.");

      router.push(`/termos/recebimento/${data.id}`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Erro ao salvar termo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-[#35a989]"
          >
            <ArrowLeft size={18} />
            Voltar
          </Link>
        </div>

        <div className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-[#35a989] to-[#029d6c] px-6 py-8 text-white sm:px-10">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15">
                <FileText size={28} />
              </div>

              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-white/75">
                  Maylon
                </p>

                <h1 className="text-2xl font-extrabold sm:text-3xl">
                  Termo de Recebimento
                </h1>

                <p className="mt-1 text-sm text-white/80">
                  Preencha os dados da maquininha e do responsável.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-10">
            <section>
              <div className="mb-6">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Identificação do equipamento
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Informe os dados da máquina de cartão.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <Input
                  label="Marca / Modelo"
                  name="marca_modelo"
                  value={form.marca_modelo}
                  onChange={handleChange}
                  placeholder="Ex.: NEXGO N86"
                  required
                />

                <Input
                  label="Número de Série"
                  name="numero_serie"
                  value={form.numero_serie}
                  onChange={handleChange}
                  placeholder="Digite o número de série"
                  required
                />

                <Input
                  label="Número de Patrimônio"
                  name="numero_patrimonio"
                  value={form.numero_patrimonio}
                  onChange={handleChange}
                  placeholder="Ex.: PAT-000001"
                  required
                />

                <Input
                  label="Data de Entrega"
                  name="data_entrega"
                  type="date"
                  value={form.data_entrega}
                  onChange={handleChange}
                  required
                />

                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-bold text-slate-700">
                    Estado de Conservação
                  </label>

                  <select
                    name="estado_conservacao"
                    value={form.estado_conservacao}
                    onChange={handleChange}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition focus:border-[#35a989] focus:ring-4 focus:ring-[#35a989]/10"
                    required
                  >
                    <option value="Perfeito estado de conservação">
                      Perfeito estado de conservação
                    </option>

                    <option value="Bom estado de conservação">
                      Bom estado de conservação
                    </option>

                    <option value="Regular estado de conservação">
                      Regular estado de conservação
                    </option>
                  </select>
                </div>
              </div>
            </section>

            <div className="my-10 h-px bg-slate-100" />

            <section>
              <div className="mb-6">
                <h2 className="text-lg font-extrabold text-slate-900">
                  Dados do responsável
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Informe os dados da pessoa que receberá o equipamento.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Input
                    label="Nome Completo"
                    name="nome_completo"
                    value={form.nome_completo}
                    onChange={handleChange}
                    placeholder="Digite o nome completo"
                    required
                  />
                </div>

                <Input
                  label="CPF"
                  name="cpf"
                  value={form.cpf}
                  onChange={handleChange}
                  placeholder="000.000.000-00"
                  required
                />

                <Input
                  label="Cargo / Função"
                  name="cargo_funcao"
                  value={form.cargo_funcao}
                  onChange={handleChange}
                  placeholder="Ex.: Motorista"
                  required
                />

                <div className="md:col-span-2">
                  <Input
                    label="WhatsApp"
                    name="whatsapp"
                    value={form.whatsapp}
                    onChange={handleChange}
                    placeholder="(11) 99999-9999"
                    required
                  />
                </div>
              </div>
            </section>

            {error && (
              <div className="mt-8 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="mt-8 flex items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                <CheckCircle2 size={18} />
                {success}
              </div>
            )}

            <div className="mt-10 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Link
                href="/"
                className="inline-flex h-12 items-center justify-center rounded-2xl border border-slate-200 px-6 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#35a989] px-7 text-sm font-extrabold text-white shadow-lg shadow-[#35a989]/20 transition hover:bg-[#2f997b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Salvar Termo
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

type InputProps = {
  label: string;
  name: string;
  value: string;
  placeholder?: string;
  type?: string;
  required?: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
};

function Input({
  label,
  name,
  value,
  placeholder,
  type = "text",
  required,
  onChange,
}: InputProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        placeholder={placeholder}
        required={required}
        onChange={onChange}
        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#35a989] focus:ring-4 focus:ring-[#35a989]/10"
      />
    </div>
  );
}