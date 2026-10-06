"use client";

<<<<<<< HEAD
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
=======
import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Upload,
  X,
} from "lucide-react";

export default function EnviarDocumentoPage() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [descricao, setDescricao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  const formatarTamanho = (bytes: number) => {
    if (!bytes) return "0 KB";
    const kb = bytes / 1024;
    const mb = kb / 1024;
    return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
  };

  const selecionarArquivo = (file: File | null) => {
    if (!file) return;

    const tiposPermitidos = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!tiposPermitidos.includes(file.type)) {
      setErro("Formato não permitido. Envie PDF, DOC ou DOCX.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErro("O arquivo deve ter no máximo 10MB.");
      return;
    }

    setErro("");
    setArquivo(file);

    if (!nome) {
      setNome(file.name.replace(/\.[^/.]+$/, ""));
    }
  };

  const removerArquivo = () => {
    setArquivo(null);
    setErro("");

    if (inputFileRef.current) {
      inputFileRef.current.value = "";
    }
  };

  const limparFormulario = () => {
    setArquivo(null);
    setNome("");
    setCategoria("");
    setDescricao("");
    setErro("");

    if (inputFileRef.current) {
      inputFileRef.current.value = "";
    }
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    setErro("");

    if (!nome.trim()) {
      setErro("Informe o nome do documento.");
      return;
    }

    if (!categoria) {
      setErro("Selecione uma categoria.");
      return;
    }

    if (!arquivo) {
      setErro("Selecione um arquivo.");
      return;
    }

    try {
      setEnviando(true);

      const formData = new FormData();
      formData.append("nome", nome.trim());
      formData.append("categoria", categoria);
      formData.append("descricao", descricao.trim());
      formData.append("arquivo", arquivo);

      await new Promise((resolve) => setTimeout(resolve, 1500));

      console.log("Documento enviado:", {
        nome,
        categoria,
        descricao,
        arquivo,
        formData,
      });

      setSucesso(true);
    } catch {
      setErro("Não foi possível enviar o documento.");
    } finally {
      setEnviando(false);
    }
  };

  if (sucesso) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-[#35ae95] via-[#43bfa5] to-[#38a991] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto flex min-h-[85vh] max-w-[1400px] items-center justify-center">
          <div className="w-full max-w-2xl rounded-[18px] bg-white p-8 text-center shadow-xl sm:p-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 size={42} />
            </div>

            <h1 className="mt-6 text-2xl font-bold text-[#172b3a] sm:text-3xl">
              Documento enviado com sucesso!
            </h1>

            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500">
              O documento foi cadastrado e já está disponível na central jurídica.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => {
                  setSucesso(false);
                  limparFormulario();
                }}
                className="h-12 rounded-xl border border-slate-200 px-6 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
              >
                Enviar outro
              </button>

              <Link
                href="/diretor/juridico"
                className="flex h-12 items-center justify-center rounded-xl bg-[#087f78] px-6 text-sm font-bold text-white transition hover:bg-[#066b65]"
              >
                Voltar para Jurídico
              </Link>
            </div>
          </div>
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
        </div>
      </main>
    );
  }

  return (
<<<<<<< HEAD
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
=======
    <main className="min-h-screen px-0 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px]">
        <header className="mb-7 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#009b8f] text-white shadow-md">
              <Upload size={23} />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Enviar Documento
              </h1>

              <p className="mt-1 text-sm text-white/80">
                Adicione um novo documento à central jurídica.
              </p>
            </div>
          </div>

          <Link
            href="/juridico"
            className="flex h-11 items-center justify-center gap-2 self-start rounded-xl bg-white px-5 text-sm font-bold text-[#243746] shadow-sm transition hover:bg-slate-50 sm:self-auto"
          >
            <ArrowLeft size={17} />
            Voltar para Jurídico
          </Link>
        </header>

        <section className="overflow-hidden rounded-[18px] bg-white shadow-xl">
          <div className="border-b border-slate-200 px-5 py-5 sm:px-6 lg:px-7">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#c9f5ee] text-[#008f85]">
                <FileText size={23} />
              </div>

              <div>
                <h2 className="text-lg font-bold text-[#172b3a]">
                  Informações do Documento
                </h2>

                <p className="mt-0.5 text-xs text-[#557080] sm:text-sm">
                  Preencha os dados para cadastrar o documento.
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 lg:p-7">
            <div className="grid gap-x-5 gap-y-6 lg:grid-cols-2">
              <div className="lg:col-span-2">
                <label
                  htmlFor="nome"
                  className="mb-2 block text-sm font-bold text-[#172b3a]"
                >
                  Nome do Documento <span className="text-red-500">*</span>
                </label>

                <input
                  id="nome"
                  type="text"
                  value={nome}
                  onChange={(event) => setNome(event.target.value)}
                  placeholder="Ex: Contrato Social da Empresa"
                  className="h-12 w-full rounded-xl border border-[#c7d7e5] bg-white px-4 text-sm text-[#172b3a] outline-none transition placeholder:text-[#7890a8] focus:border-[#159b91] focus:ring-2 focus:ring-[#159b91]/10"
                />
              </div>

              <div>
                <label
                  htmlFor="categoria"
                  className="mb-2 block text-sm font-bold text-[#172b3a]"
                >
                  Categoria <span className="text-red-500">*</span>
                </label>

                <select
                  id="categoria"
                  value={categoria}
                  onChange={(event) => setCategoria(event.target.value)}
                  className="h-12 w-full cursor-pointer rounded-xl border border-[#c7d7e5] bg-white px-4 text-sm text-[#172b3a] outline-none transition focus:border-[#159b91] focus:ring-2 focus:ring-[#159b91]/10"
                >
                  <option value="">Selecione uma categoria...</option>
                  <option value="empresa">Empresa</option>
                  <option value="contrato">Contrato</option>
                  <option value="juridico">Jurídico</option>
                  <option value="compliance">Compliance</option>
                  <option value="financeiro">Financeiro</option>
                  <option value="outros">Outros</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="descricao"
                  className="mb-2 block text-sm font-bold text-[#172b3a]"
                >
                  Descrição
                </label>

                <input
                  id="descricao"
                  type="text"
                  value={descricao}
                  onChange={(event) => setDescricao(event.target.value)}
                  placeholder="Descrição ou observação"
                  className="h-12 w-full rounded-xl border border-[#c7d7e5] bg-white px-4 text-sm text-[#172b3a] outline-none transition placeholder:text-[#7890a8] focus:border-[#159b91] focus:ring-2 focus:ring-[#159b91]/10"
                />
              </div>

              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-bold text-[#172b3a]">
                  Arquivo <span className="text-red-500">*</span>
                </label>

                {!arquivo ? (
                  <button
                    type="button"
                    onClick={() => inputFileRef.current?.click()}
                    className="group flex min-h-[230px] w-full flex-col items-center justify-center rounded-xl border border-dashed border-[#b9cddd] bg-[#f8fafc] px-5 py-8 transition hover:border-[#159b91] hover:bg-[#effaf8]"
                  >
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#c9f5ee] text-[#008f85] transition group-hover:bg-[#b9eee6]">
                      <Upload size={28} />
                    </div>

                    <p className="mt-4 text-sm font-bold text-[#172b3a]">
                      Clique para selecionar um arquivo
                    </p>

                    <p className="mt-2 text-center text-xs text-[#7890a8] sm:text-sm">
                      PDF, DOC ou DOCX • Tamanho máximo de 10MB
                    </p>
                  </button>
                ) : (
                  <div className="flex min-h-[110px] items-center justify-between gap-4 rounded-xl border border-[#bce5dd] bg-[#effaf7] px-5 py-4">
                    <div className="flex min-w-0 items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-[#008f85] shadow-sm">
                        <FileText size={25} />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-[#172b3a] sm:text-base">
                          {arquivo.name}
                        </p>

                        <p className="mt-1 text-xs text-[#718494] sm:text-sm">
                          {formatarTamanho(arquivo.size)}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={removerArquivo}
                      aria-label="Remover arquivo"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-red-500 transition hover:bg-red-100"
                    >
                      <X size={19} />
                    </button>
                  </div>
                )}

                <input
                  ref={inputFileRef}
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="hidden"
                  onChange={(event) =>
                    selecionarArquivo(event.target.files?.[0] || null)
                  }
                />
              </div>

              {erro && (
                <div className="lg:col-span-2">
                  <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600"
                  >
                    {erro}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-7 flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end">
              <Link
                href="/juridico"
                className="flex h-12 cursor-pointer items-center justify-center rounded-xl border border-[#c7d7e5] bg-white px-7 text-sm font-bold text-[#536a7a] transition hover:bg-[#f7fafc]"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={enviando}
                className="flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#07877f] px-8 text-sm font-bold text-white shadow-md transition hover:bg-[#06736c] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {enviando ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
                    Enviando...
                  </>
                ) : (
                  <>
<<<<<<< HEAD
                    <Save size={18} />
=======
                    <Upload size={18} />
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
                    Enviar Documento
                  </>
                )}
              </button>
            </div>
          </form>
<<<<<<< HEAD
=======
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-[18px] bg-white p-5 shadow-lg sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d8f7f2] text-[#008f85]">
                <CheckCircle2 size={22} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#172b3a]">
                  Formatos Aceitos
                </h3>

                <p className="text-xs text-[#718494]">
                  Arquivos permitidos para envio
                </p>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {["PDF", "DOC", "DOCX"].map((formato) => (
                <div
                  key={formato}
                  className="flex items-center justify-between rounded-xl border border-[#dce7ef] bg-[#f8fafc] px-4 py-4"
                >
                  <span className="text-sm font-bold text-[#243746]">
                    {formato}
                  </span>

                  <CheckCircle2 size={18} className="text-[#159b91]" />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[18px] bg-white p-5 shadow-lg sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d8f7f2] text-[#008f85]">
                <FileText size={22} />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#172b3a]">
                  Central Jurídica
                </h3>

                <p className="text-xs text-[#718494]">
                  Organização e segurança
                </p>
              </div>
            </div>

            <p className="my-4 text-xs leading-5 text-[#607484]">
              Mantemos todos os documentos em sigilo, com proteção especializada, segurança e armazenamento centralizado em um único lugar.
            </p>

            <div className="mt-5 flex items-center gap-2 rounded-xl bg-[#effaf7] px-4 py-3">
              <CheckCircle2 size={18} className="text-[#159b91]" />

              <span className="text-sm font-semibold text-[#365465]">
                Documentos protegidos e criptografados.
              </span>
            </div>
          </section>
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
        </div>
      </div>
    </main>
  );
<<<<<<< HEAD
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
=======
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
}