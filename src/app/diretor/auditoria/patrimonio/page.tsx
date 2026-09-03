"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Eye,
  FileUp,
  Save,
} from "lucide-react";
import { useRouter } from "next/navigation";

function gerarNumeroPatrimonio() {
  return Math.floor(
    100000000 + Math.random() * 900000000
  ).toString();
}

export default function NovoPatrimonioPage() {
  const router = useRouter();

  const [comprovante, setComprovante] = useState<File | null>(null);
  const [nfe, setNfe] = useState<File | null>(null);

  const [form, setForm] = useState({
    codigo: gerarNumeroPatrimonio(),
    n_patrimonio: "",
    nomeitem: "",
    descricao: "",
    categoria: "",
    localizacao: "",
    responsavel: "",
    valor_aquisicao: "",
    status: "Pendente",
    datacompra: "",
    observacao: "",
  });

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  // =========================================================
  // ALTERAR CAMPO
  // =========================================================

  function alterarCampo(
    campo: keyof typeof form,
    valor: string
  ) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  // =========================================================
  // ABRIR ARQUIVO
  // =========================================================

  function abrirArquivo(arquivo: File | null) {
    if (!arquivo) return;

    const url = URL.createObjectURL(arquivo);

    window.open(url, "_blank");

    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  // =========================================================
  // LEITOR DE CÓDIGO DE BARRAS
  // =========================================================

  useEffect(() => {
    let codigo = "";
    let timeout: ReturnType<typeof setTimeout> | undefined;
    let ultimoTecla = 0;

    function capturarCodigo(e: KeyboardEvent) {
      const elemento = e.target as HTMLElement | null;

      // Não captura quando estiver digitando
      // em campos normais do formulário.
      if (
        elemento &&
        (
          elemento.tagName === "TEXTAREA" ||
          elemento.tagName === "SELECT" ||
          (
            elemento.tagName === "INPUT" &&
            (elemento as HTMLInputElement).type !== "text"
          )
        )
      ) {
        return;
      }

      const agora = Date.now();
      const intervalo = agora - ultimoTecla;

      // Leitor envia os caracteres rapidamente.
      if (intervalo > 100) {
        codigo = "";
      }

      ultimoTecla = agora;

      // Final do código enviado pelo leitor.
      if (e.key === "Enter") {
        if (codigo.trim()) {
          alterarCampo(
            "n_patrimonio",
            codigo.trim()
          );

          codigo = "";
        }

        return;
      }

      // Captura caracteres.
      if (e.key.length === 1) {
        codigo += e.key;

        if (timeout) {
          clearTimeout(timeout);
        }

        timeout = setTimeout(() => {
          codigo = "";
        }, 150);
      }
    }

    window.addEventListener(
      "keydown",
      capturarCodigo
    );

    return () => {
      window.removeEventListener(
        "keydown",
        capturarCodigo
      );

      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, []);

  // =========================================================
  // MÁSCARA DE DINHEIRO
  // =========================================================

  function formatarMoeda(valor: string) {
    const numero = valor.replace(/\D/g, "");

    if (!numero) {
      return "";
    }

    const valorNumerico = Number(numero) / 100;

    return valorNumerico.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  // =========================================================
  // CONVERTER MOEDA PARA NÚMERO
  // =========================================================

  function converterMoeda(valor: string) {
    if (!valor) {
      return 0;
    }

    const numero = valor
      .replace("R$", "")
      .replace(/\s/g, "")
      .replace(/\./g, "")
      .replace(",", ".");

    const resultado = Number(numero);

    return Number.isNaN(resultado)
      ? 0
      : resultado;
  }

  // =========================================================
  // SALVAR PATRIMÔNIO
  // =========================================================

  async function salvarPatrimonio() {
    try {
      setSalvando(true);
      setErro("");

      // =====================================================
      // VALIDAÇÕES
      // =====================================================

      if (!form.n_patrimonio.trim()) {
        throw new Error(
          "Faça a leitura do número do patrimônio."
        );
      }

      if (!form.nomeitem.trim()) {
        throw new Error(
          "Informe o nome do item do patrimônio."
        );
      }

      if (!form.descricao.trim()) {
        throw new Error(
          "Informe a descrição do patrimônio."
        );
      }

      if (!form.categoria.trim()) {
        throw new Error(
          "Informe a categoria do patrimônio."
        );
      }

      if (!form.localizacao.trim()) {
        throw new Error(
          "Informe a localização do patrimônio."
        );
      }

      // =====================================================
      // VALOR
      // =====================================================

      const valor = converterMoeda(
        form.valor_aquisicao
      );

      // =====================================================
      // DADOS
      // =====================================================

      const dados = {
        codigo: form.codigo,
        n_patrimonio: form.n_patrimonio,
        nomeitem: form.nomeitem,
        descricao: form.descricao,
        categoria: form.categoria,
        localizacao: form.localizacao,
        responsavel: form.responsavel || null,
        valor_aquisicao: valor,
        status: form.status,
        datacompra: form.datacompra || null,
        observacao: form.observacao || null,

        // Por enquanto enviamos o nome dos arquivos.
        comprovantepagamento:
          comprovante?.name || null,

        nfe:
          nfe?.name || null,
      };

      // =====================================================
      // POST
      // =====================================================

      const response = await fetch(
        "/api/auditorio",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(dados),
        }
      );

      // =====================================================
      // RESPOSTA DA API
      // =====================================================

      const texto = await response.text();

      let result: {
        success?: boolean;
        error?: string;
        message?: string;
      } = {};

      try {
        result = texto
          ? JSON.parse(texto)
          : {};
      } catch {
        result = {};
      }

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            `Erro ao cadastrar patrimônio. Status: ${response.status}`
        );
      }

      // =====================================================
      // SUCESSO
      // =====================================================

      router.push("/auditoria");
    } catch (error) {
      console.error(
        "Erro ao salvar patrimônio:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao cadastrar patrimônio."
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto">

        {/* VOLTAR */}

        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#073b70] hover:underline"
        >
          <ArrowLeft size={18} />
          Voltar
        </button>

        <div className="overflow-hidden rounded-2xl border border-[#dce5ee] bg-white shadow-sm">

          {/* CABEÇALHO */}

          <div className="border-b border-slate-200 p-6">
            <h1 className="text-2xl font-bold text-[#073b70]">
              Adicionar Patrimônio
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Cadastre um novo patrimônio no sistema.
            </p>
          </div>

          {/* FORMULÁRIO */}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              salvarPatrimonio();
            }}
            className="p-6"
          >

            {/* =====================================================
                PRIMEIRA LINHA
            ====================================================== */}

            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-4">

              {/* CÓDIGO */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Código
                </label>

                <input
                  type="text"
                  value={form.codigo}
                  readOnly
                  className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-bold tracking-wider text-[#073b70] outline-none"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Número automático com 9 dígitos.
                </p>
              </div>

              {/* Nº PATRIMÔNIO */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nº Patrimônio
                </label>

                <input
                  type="text"
                  value={form.n_patrimonio}
                  readOnly
                  autoFocus
                  placeholder="Aguardando leitura..."
                  className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-100 px-4 py-3 text-sm font-semibold text-[#073b70] outline-none"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Utilize o leitor de código de barras.
                </p>
              </div>

              {/* NOME ITEM */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nome Item
                </label>

                <input
                  type="text"
                  value={form.nomeitem}
                  onChange={(e) =>
                    alterarCampo(
                      "nomeitem",
                      e.target.value
                    )
                  }
                  placeholder="Ex.: Notebook Dell"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#08a89d]"
                />
              </div>

              {/* CATEGORIA */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Categoria
                </label>

                <input
                  type="text"
                  value={form.categoria}
                  onChange={(e) =>
                    alterarCampo(
                      "categoria",
                      e.target.value
                    )
                  }
                  placeholder="Ex.: Eletrônicos"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#08a89d]"
                />
              </div>
            </div>

            {/* =====================================================
                SEGUNDA LINHA
            ====================================================== */}

            <div className="mt-5 grid w-full grid-cols-1 gap-5 md:grid-cols-4">

              {/* DESCRIÇÃO */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Descrição
                </label>

                <input
                  type="text"
                  value={form.descricao}
                  onChange={(e) =>
                    alterarCampo(
                      "descricao",
                      e.target.value
                    )
                  }
                  placeholder="Descrição do patrimônio"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#08a89d]"
                />
              </div>

              {/* VALOR */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Valor do Patrimônio
                </label>

                <input
                  type="text"
                  value={form.valor_aquisicao}
                  onChange={(e) =>
                    alterarCampo(
                      "valor_aquisicao",
                      formatarMoeda(
                        e.target.value
                      )
                    )
                  }
                  placeholder="R$ 0,00"
                  inputMode="numeric"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#08a89d]"
                />
              </div>

              {/* LOCALIZAÇÃO */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Localização
                </label>

                <input
                  type="text"
                  value={form.localizacao}
                  onChange={(e) =>
                    alterarCampo(
                      "localizacao",
                      e.target.value
                    )
                  }
                  placeholder="Ex.: São Paulo - SP"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#08a89d]"
                />
              </div>

              {/* DATA DA COMPRA */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Data da Compra
                </label>

                <input
                  type="date"
                  value={form.datacompra}
                  onChange={(e) =>
                    alterarCampo(
                      "datacompra",
                      e.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#08a89d]"
                />
              </div>
            </div>

            {/* =====================================================
                TERCEIRA LINHA
            ====================================================== */}

            <div className="mt-5 grid w-full grid-cols-1 gap-5 md:grid-cols-4">

              {/* STATUS */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(e) =>
                    alterarCampo(
                      "status",
                      e.target.value
                    )
                  }
                  className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#08a89d]"
                >
                  <option value="Pendente">
                    Pendente
                  </option>

                  <option value="Auditado">
                    Auditado
                  </option>

                  <option value="Divergência">
                    Divergência
                  </option>
                </select>
              </div>

              {/* RESPONSÁVEL */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nome do Responsável
                </label>

                <input
                  type="text"
                  value={form.responsavel}
                  onChange={(e) =>
                    alterarCampo(
                      "responsavel",
                      e.target.value
                    )
                  }
                  placeholder="Ex.: João da Silva"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#08a89d]"
                />
              </div>

              {/* COMPROVANTE */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Comprovante de Pagamento
                </label>

                <div className="flex items-center gap-3">

                  <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm hover:bg-slate-50">

                    <FileUp
                      size={18}
                      className="text-[#08a89d]"
                    />

                    <span className="truncate">
                      {comprovante
                        ? comprovante.name
                        : "Selecionar arquivo"}
                    </span>

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) =>
                        setComprovante(
                          e.target.files?.[0] || null
                        )
                      }
                    />
                  </label>

                  {comprovante && (
                    <button
                      type="button"
                      onClick={() =>
                        abrirArquivo(comprovante)
                      }
                      className="rounded-lg border border-slate-200 p-3 text-[#08a89d] hover:bg-slate-50"
                      title="Visualizar arquivo"
                    >
                      <Eye size={20} />
                    </button>
                  )}
                </div>
              </div>

              {/* NFE */}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  NFE
                </label>

                <div className="flex items-center gap-3">

                  <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm hover:bg-slate-50">

                    <FileUp
                      size={18}
                      className="text-[#08a89d]"
                    />

                    <span className="truncate">
                      {nfe
                        ? nfe.name
                        : "Selecionar arquivo"}
                    </span>

                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) =>
                        setNfe(
                          e.target.files?.[0] || null
                        )
                      }
                    />
                  </label>

                  {nfe && (
                    <button
                      type="button"
                      onClick={() =>
                        abrirArquivo(nfe)
                      }
                      className="rounded-lg border border-slate-200 p-3 text-[#08a89d] hover:bg-slate-50"
                      title="Visualizar arquivo"
                    >
                      <Eye size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* =====================================================
                OBSERVAÇÃO
            ====================================================== */}

            <div className="mt-5">

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Observação
              </label>

              <textarea
                value={form.observacao}
                onChange={(e) =>
                  alterarCampo(
                    "observacao",
                    e.target.value
                  )
                }
                rows={4}
                placeholder="Observações sobre o patrimônio..."
                className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#08a89d]"
              />
            </div>

            {/* =====================================================
                ERRO
            ====================================================== */}

            {erro && (
              <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </div>
            )}

            {/* =====================================================
                BOTÃO
            ====================================================== */}

            <div className="mt-6 flex justify-end border-t border-slate-200 pt-6">

              <button
                type="submit"
                disabled={salvando}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#08a89d] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#07978e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Save size={16} />

                {salvando
                  ? "Salvando..."
                  : "Salvar Patrimônio"}
              </button>

            </div>

          </form>
        </div>
      </div>
    </main>
  );
}