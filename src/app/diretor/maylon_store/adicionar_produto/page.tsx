"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  AlertCircle,
  ArrowLeft,
  Barcode,
  Boxes,
  Check,
  CircleDollarSign,
  FileText,
  ImagePlus,
  Package,
  Save,
  Tag,
  Trash2,
  Upload,
  X,
} from "lucide-react";

interface FormProduto {
  codigo: string;
  nome: string;
  descricao: string;
  categoria: string;
  estoque: string;
  estoqueMinimo: string;
  preco: string;
}

const FORM_INICIAL: FormProduto = {
  codigo: "",
  nome: "",
  descricao: "",
  categoria: "",
  estoque: "0",
  estoqueMinimo: "0",
  preco: "",
};

const IMAGENS_VAZIAS: (File | null)[] = [null, null, null];
const PREVIEWS_VAZIOS: (string | null)[] = [null, null, null];

export default function AdicionarProdutoPage() {
  const [form, setForm] = useState<FormProduto>(FORM_INICIAL);
  const [imagemPrincipal, setImagemPrincipal] = useState<File | null>(null);
  const [imagensSecundarias, setImagensSecundarias] =
    useState<(File | null)[]>(IMAGENS_VAZIAS);
  const [previewPrincipal, setPreviewPrincipal] = useState<string | null>(null);
  const [previewsSecundarias, setPreviewsSecundarias] =
    useState<(string | null)[]>(PREVIEWS_VAZIOS);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    gerarCodigoProduto();
    setLoading(false);

    return () => {
      if (previewPrincipal) {
        URL.revokeObjectURL(previewPrincipal);
      }

      previewsSecundarias.forEach((preview) => {
        if (preview) {
          URL.revokeObjectURL(preview);
        }
      });
    };
  }, []);

  function gerarCodigoProduto() {
    const numero = Math.floor(100000 + Math.random() * 900000);

    setForm((prev) => ({
      ...prev,
      codigo: `MAY-${numero}`,
    }));
  }

  function handleChange(
    e: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  function formatarPreco(valor: string): string {
    const somenteNumeros = valor.replace(/\D/g, "");

    if (!somenteNumeros) {
      return "";
    }

    const numero = Number(somenteNumeros) / 100;

    return numero.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  function handlePrecoChange(e: ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({
      ...prev,
      preco: formatarPreco(e.target.value),
    }));

    if (error) {
      setError("");
    }
  }

  function precoParaNumero(valor: string): string {
    if (!valor) {
      return "0.00";
    }

    return valor.replace(/\./g, "").replace(",", ".");
  }

  function validarImagem(file: File): boolean {
    const tiposPermitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!tiposPermitidos.includes(file.type)) {
      setError("Formato inválido. Utilize apenas JPG, PNG ou WEBP.");
      return false;
    }

    const tamanhoMaximo = 8 * 1024 * 1024;

    if (file.size > tamanhoMaximo) {
      setError(`A imagem "${file.name}" não pode ultrapassar 8 MB.`);
      return false;
    }

    return true;
  }

  function handleImagemPrincipal(
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!validarImagem(file)) {
      e.target.value = "";
      return;
    }

    setError("");

    if (previewPrincipal) {
      URL.revokeObjectURL(previewPrincipal);
    }

    const url = URL.createObjectURL(file);

    setImagemPrincipal(file);
    setPreviewPrincipal(url);

    e.target.value = "";
  }

  function removerImagemPrincipal() {
    if (previewPrincipal) {
      URL.revokeObjectURL(previewPrincipal);
    }

    setImagemPrincipal(null);
    setPreviewPrincipal(null);
  }

  function handleImagemSecundaria(
    index: number,
    e: ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (!validarImagem(file)) {
      e.target.value = "";
      return;
    }

    setError("");

    const novasImagens = [...imagensSecundarias];
    novasImagens[index] = file;
    setImagensSecundarias(novasImagens);

    const novasPreviews = [...previewsSecundarias];

    if (novasPreviews[index]) {
      URL.revokeObjectURL(novasPreviews[index] as string);
    }

    novasPreviews[index] = URL.createObjectURL(file);
    setPreviewsSecundarias(novasPreviews);

    e.target.value = "";
    99112303
  }

  function removerImagemSecundaria(index: number) {
    const novasImagens = [...imagensSecundarias];

    novasImagens[index] = null;

    setImagensSecundarias(novasImagens);

    const novasPreviews = [...previewsSecundarias];

    if (novasPreviews[index]) {
      URL.revokeObjectURL(novasPreviews[index] as string);
    }

    novasPreviews[index] = null;

    setPreviewsSecundarias(novasPreviews);
  }

  function limparImagens() {
    if (previewPrincipal) {
      URL.revokeObjectURL(previewPrincipal);
    }

    previewsSecundarias.forEach((preview) => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    });

    setImagemPrincipal(null);
    setPreviewPrincipal(null);
    setImagensSecundarias([null, null, null]);
    setPreviewsSecundarias([null, null, null]);
  }

  async function handleSubmit(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (saving) {
      return;
    }

    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (!form.nome.trim()) {
        throw new Error("Informe o nome do produto.");
      }

      if (!form.categoria) {
        throw new Error("Selecione uma categoria.");
      }

      if (!form.preco) {
        throw new Error("Informe o preço do produto.");
      }

      const precoNumerico = Number(
        precoParaNumero(form.preco)
      );

      if (
        Number.isNaN(precoNumerico) ||
        precoNumerico <= 0
      ) {
        throw new Error("Informe um preço válido.");
      }

      if (!imagemPrincipal) {
        throw new Error(
          "Adicione a imagem principal do produto."
        );
      }

      const estoque = Number(form.estoque);

      if (Number.isNaN(estoque) || estoque < 0) {
        throw new Error(
          "Informe um estoque inicial válido."
        );
      }

      const estoqueMinimo = Number(form.estoqueMinimo);

      if (
        Number.isNaN(estoqueMinimo) ||
        estoqueMinimo < 0
      ) {
        throw new Error(
          "Informe um estoque mínimo válido."
        );
      }

      const formData = new FormData();

      formData.append("codigo", form.codigo);
      formData.append("nome", form.nome.trim());
      formData.append("descricao", form.descricao.trim());
      formData.append("categoria", form.categoria);
      formData.append("estoque", String(estoque));
      formData.append(
        "estoqueMinimo",
        String(estoqueMinimo)
      );
      formData.append(
        "preco",
        precoParaNumero(form.preco)
      );
      formData.append(
        "imagemPrincipal",
        imagemPrincipal
      );

      imagensSecundarias.forEach((imagem) => {
        if (imagem) {
          formData.append(
            "imagensSecundarias",
            imagem
          );
        }
      });

      const response = await fetch(
        "/api/store/produtos",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.error ||
            `Não foi possível cadastrar o produto. Status: ${response.status}`
        );
      }

      setMessage(
        "Produto cadastrado com sucesso!"
      );

      limparImagens();

      setForm({
        ...FORM_INICIAL,
        codigo: "",
      });

      gerarCodigoProduto();

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      setTimeout(() => {
        setMessage("");
      }, 5000);
    } catch (err) {
      console.error(
        "ERRO AO CADASTRAR PRODUTO:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Ocorreu um erro ao cadastrar o produto."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4 rounded-3xl bg-white px-10 py-9 shadow-xl">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8faf7]">
            <div className="h-7 w-7 animate-spin rounded-full border-4 border-[#08a99c]/20 border-t-[#08a99c]" />
          </div>

          <div className="text-center">
            <p className="text-sm font-extrabold text-[#073b70]">
              Carregando página
            </p>

            <p className="mt-1 text-xs font-medium text-slate-400">
              Aguarde um momento...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-8xl">
        <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#073b70] shadow-lg shadow-[#073b70]/10">
              <Package className="h-6 w-6 text-white" />
            </div>

            <div>
              <h1 className="mt-0.5 text-2xl font-extrabold tracking-tight text-white">
                Novo produto
              </h1>

              <p className="text-sm text-white/80">
                Cadastre um produto no catálogo da loja.
              </p>
            </div>
          </div>

          <Link
            href="/diretor/maylon_store"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-bold text-[#073b70] shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </header>

        {message && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-4 w-4" />
            </div>

            <div>
              <p className="font-bold">
                Cadastro realizado
              </p>

              <p className="font-medium text-emerald-600">
                {message}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-5 flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700 shadow-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-4 w-4" />
            </div>

            <div>
              <p className="font-bold">
                Não foi possível cadastrar
              </p>

              <p className="font-medium text-red-600">
                {error}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8faf7]">
                  <Barcode className="h-5 w-5 text-[#08a99c]" />
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Código automático
                  </p>

                  <p className="font-mono text-xl font-extrabold tracking-wider text-[#073b70]">
                    {form.codigo}
                  </p>
                </div>
              </div>

              <div className="inline-flex w-fit items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600">
                <Check className="h-3.5 w-3.5" />
                Código gerado
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_480px]">
            <div className="space-y-5">
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8faf7]">
                      <Tag className="h-5 w-5 text-[#08a99c]" />
                    </div>

                    <div>
                      <h2 className="font-bold text-[#073b70]">
                        Informações do produto
                      </h2>

                      <p className="text-xs text-slate-400">
                        Dados principais do produto.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                  <div>
                    <label
                      htmlFor="nome"
                      className="mb-2 block text-sm font-bold text-[#073b70]"
                    >
                      Nome do produto
                      <span className="ml-1 text-red-500">
                        *
                      </span>
                    </label>

                    <input
                      id="nome"
                      type="text"
                      name="nome"
                      value={form.nome}
                      onChange={handleChange}
                      placeholder="Ex.: Coxim do motor dianteiro"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#08a99c] focus:bg-white focus:ring-4 focus:ring-[#08a99c]/10"
                      required
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label
                        htmlFor="categoria"
                        className="mb-2 block text-sm font-bold text-[#073b70]"
                      >
                        Categoria
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <select
                        id="categoria"
                        name="categoria"
                        value={form.categoria}
                        onChange={handleChange}
                        className="h-12 w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-medium text-slate-700 outline-none transition focus:border-[#08a99c] focus:bg-white focus:ring-4 focus:ring-[#08a99c]/10"
                        required
                      >
                        <option value="">
                          Selecione uma categoria
                        </option>
                        <option value="Coxim">
                          Coxim
                        </option>
                        <option value="Suspensão e Direção">
                          Suspensão e Direção
                        </option>
                        <option value="Direção">
                          Direção
                        </option>
                        <option value="Câmbio">
                          Câmbio
                        </option>
                        <option value="Filtros">
                          Filtros
                        </option>
                        <option value="Freios">
                          Freios
                        </option>
                        <option value="Cabos">
                          Cabos
                        </option>
                        <option value="Elétrica">
                          Elétrica
                        </option>
                        <option value="Ignição">
                          Ignição
                        </option>
                        <option value="Reservatório">
                          Reservatório
                        </option>
                      </select>
                    </div>

                    <div>
                      <label
                        htmlFor="preco"
                        className="mb-2 block text-sm font-bold text-[#073b70]"
                      >
                        Preço
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>

                      <div className="relative">
                        <CircleDollarSign className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#08a99c]" />

                        <span className="absolute left-10 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                          R$
                        </span>

                        <input
                          id="preco"
                          type="text"
                          inputMode="decimal"
                          name="preco"
                          value={form.preco}
                          onChange={handlePrecoChange}
                          placeholder="0,00"
                          className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pl-[68px] pr-4 text-sm font-bold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#08a99c] focus:bg-white focus:ring-4 focus:ring-[#08a99c]/10"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="descricao"
                      className="mb-2 block text-sm font-bold text-[#073b70]"
                    >
                      Descrição
                    </label>

                    <div className="relative">
                      <FileText className="absolute left-4 top-4 h-4 w-4 text-slate-400" />

                      <textarea
                        id="descricao"
                        name="descricao"
                        value={form.descricao}
                        onChange={handleChange}
                        rows={6}
                        placeholder="Descreva detalhes, aplicação, compatibilidade e outras informações..."
                        className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-medium text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#08a99c] focus:bg-white focus:ring-4 focus:ring-[#08a99c]/10"
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-5 sm:px-6">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8faf7]">
                      <Boxes className="h-5 w-5 text-[#08a99c]" />
                    </div>

                    <div>
                      <h2 className="font-bold text-[#073b70]">
                        Controle de estoque
                      </h2>

                      <p className="text-xs text-slate-400">
                        Defina os níveis de estoque.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-5 sm:grid-cols-2 sm:p-6">
                  <div>
                    <label
                      htmlFor="estoque"
                      className="mb-2 block text-sm font-bold text-[#073b70]"
                    >
                      Estoque inicial
                    </label>

                    <input
                      id="estoque"
                      type="number"
                      name="estoque"
                      value={form.estoque}
                      onChange={handleChange}
                      min="0"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-[#08a99c] focus:bg-white focus:ring-4 focus:ring-[#08a99c]/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="estoqueMinimo"
                      className="mb-2 block text-sm font-bold text-[#073b70]"
                    >
                      Estoque mínimo
                    </label>

                    <input
                      id="estoqueMinimo"
                      type="number"
                      name="estoqueMinimo"
                      value={form.estoqueMinimo}
                      onChange={handleChange}
                      min="0"
                      className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold text-slate-800 outline-none transition focus:border-[#08a99c] focus:bg-white focus:ring-4 focus:ring-[#08a99c]/10"
                    />
                  </div>
                </div>
              </section>
            </div>

            <div>
              <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:sticky xl:top-5">
                <div className="border-b border-slate-100 px-5 py-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e8faf7]">
                        <ImagePlus className="h-5 w-5 text-[#08a99c]" />
                      </div>

                      <div>
                        <h2 className="font-bold text-[#073b70]">
                          Fotos
                        </h2>

                        <p className="text-xs text-slate-400">
                          Até 4 imagens
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-[#e8faf7] px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-[#08a99c]">
                      Obrigatória
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-sm font-bold text-[#073b70]">
                        Imagem principal
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      </label>
                    </div>

                    {previewPrincipal ? (
                      <div className="group relative aspect-square overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                        <img
                          src={previewPrincipal}
                          alt="Imagem principal do produto"
                          className="h-full w-full object-contain p-3"
                        />

                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 pt-12">
                          <p className="truncate text-xs font-semibold text-white">
                            {imagemPrincipal?.name}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={removerImagemPrincipal}
                          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-xl bg-white text-red-500 shadow-lg transition hover:bg-red-50"
                          title="Remover imagem"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <label
                        htmlFor="imagem-principal"
                        className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 px-5 text-center transition hover:border-[#08a99c] hover:bg-[#f0fffc]"
                      >
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#e8faf7]">
                          <ImagePlus className="h-8 w-8 text-[#08a99c]" />
                        </div>

                        <p className="mt-4 text-sm font-bold text-[#073b70]">
                          Adicione a imagem principal
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          JPG, PNG ou WEBP
                        </p>

                        <span className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#08a99c] px-5 py-2.5 text-xs font-bold text-white shadow-sm">
                          <Upload className="h-4 w-4" />
                          Escolher imagem
                        </span>

                        <input
                          id="imagem-principal"
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          onChange={handleImagemPrincipal}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-bold text-[#073b70]">
                        Outras fotos
                      </p>

                      <span className="text-xs font-medium text-slate-400">
                        Opcional
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      {previewsSecundarias.map(
                        (preview, index) => (
                          <div key={index}>
                            {preview ? (
                              <div className="group relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                                <img
                                  src={preview}
                                  alt={`Imagem secundária ${
                                    index + 1
                                  }`}
                                  className="h-full w-full object-contain p-1"
                                />

                                <button
                                  type="button"
                                  onClick={() =>
                                    removerImagemSecundaria(
                                      index
                                    )
                                  }
                                  className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-lg bg-white text-red-500 shadow-md transition hover:bg-red-50"
                                  title="Remover"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <label
                                htmlFor={`imagem-secundaria-${index}`}
                                className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-[#08a99c] hover:bg-[#f0fffc]"
                              >
                                <ImagePlus className="h-5 w-5 text-slate-300" />

                                <span className="mt-1 text-[10px] font-bold text-slate-500">
                                  Foto {index + 1}
                                </span>

                                <input
                                  id={`imagem-secundaria-${index}`}
                                  type="file"
                                  accept="image/png,image/jpeg,image/webp"
                                  onChange={(e) =>
                                    handleImagemSecundaria(
                                      index,
                                      e
                                    )
                                  }
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl bg-slate-50 p-3">
                    <div className="flex gap-2.5">
                      <ImagePlus className="mt-0.5 h-4 w-4 shrink-0 text-[#08a99c]" />

                      <p className="text-[11px] leading-5 text-slate-500">
                        Use imagens nítidas e bem iluminadas.
                        A imagem principal será usada como
                        capa do produto. Limite de 8 MB por
                        imagem.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>

          <div className="mt-5 flex flex-col-reverse gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="hidden text-xs text-slate-400 sm:block">
              <span className="font-bold text-red-500">
                *
              </span>{" "}
              Campos obrigatórios
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/diretor/maylon_store"
                className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-7 text-sm font-bold text-[#073b70] transition hover:bg-slate-50"
              >
                Cancelar
              </Link>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#08a99c] px-8 text-sm font-bold text-white shadow-lg shadow-[#08a99c]/20 transition hover:bg-[#07998e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Cadastrar produto
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}