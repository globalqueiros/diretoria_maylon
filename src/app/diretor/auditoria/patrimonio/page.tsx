"use client";

import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileUp,
  Loader2,
  MapPin,
  Save,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHandHoldingDollar } from "@fortawesome/free-solid-svg-icons";

const CHAVE_NUMERO_PATRIMONIO = "numero_patrimonio";
const CHAVE_DATA_NUMERO_PATRIMONIO = "data_numero_patrimonio";
const TEMPO_ATUALIZACAO = 90 * 60 * 1000;

function gerarNumeroPatrimonio(): string {
  return Math.floor(
    100000000 + Math.random() * 900000000
  ).toString();
}

function obterNumeroPatrimonio(): string {
  if (typeof window === "undefined") {
    return "000000000";
  }

  const numeroSalvo = localStorage.getItem(
    CHAVE_NUMERO_PATRIMONIO
  );

  const dataSalva = localStorage.getItem(
    CHAVE_DATA_NUMERO_PATRIMONIO
  );

  const agora = Date.now();

  if (
    numeroSalvo &&
    dataSalva &&
    agora - Number(dataSalva) < TEMPO_ATUALIZACAO
  ) {
    return numeroSalvo;
  }

  const novoNumero = gerarNumeroPatrimonio();

  localStorage.setItem(
    CHAVE_NUMERO_PATRIMONIO,
    novoNumero
  );

  localStorage.setItem(
    CHAVE_DATA_NUMERO_PATRIMONIO,
    agora.toString()
  );

  return novoNumero;
}

function formatarNome(valor: string): string {
  return valor
    .toLocaleLowerCase("pt-BR")
    .replace(/(^|\s)\S/g, (letra) =>
      letra.toLocaleUpperCase("pt-BR")
    );
}

function formatarMoeda(valor: string): string {
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

function converterMoeda(valor: string): number {
  if (!valor) {
    return 0;
  }

  const numero = valor
    .replace("R$", "")
    .replace(/\s/g, "")
    .replace(/\./g, "")
    .replace(",", ".");

  const resultado = Number(numero);

  return Number.isNaN(resultado) ? 0 : resultado;
}

type TipoPdf = "comprovante" | "nfe";

type ResultadoApi = {
  success?: boolean;
  error?: string;
  message?: string;
  id?: number;
  comprovantepagamento?: string | null;
  nfe?: string | null;
};

export default function NovoPatrimonioPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [comprovante, setComprovante] =
    useState<File | null>(null);

  const [nfe, setNfe] = useState<File | null>(null);

  const [pdfModalAberto, setPdfModalAberto] =
    useState(false);

  const [pdfUrl, setPdfUrl] =
    useState<string | null>(null);

  const [pdfNome, setPdfNome] = useState("");

  const [pdfTipo, setPdfTipo] =
    useState<TipoPdf | null>(null);

  const [buscandoLocalizacao, setBuscandoLocalizacao] =
    useState(false);

  const [salvando, setSalvando] = useState(false);

  const [erro, setErro] = useState("");

  const [sucesso, setSucesso] = useState("");

  const [form, setForm] = useState({
    codigo: "000000000",
    n_patrimonio: "",
    nomeitem: "",
    descricao: "",
    categoria: "",
    localizacao: "",
    responsavel: "",
    valor_aquisicao: "",
    status: "",
    datacompra: "",
    observacao: "",
  });

  useEffect(() => {
    const atualizarNumero = () => {
      const numero = obterNumeroPatrimonio();

      setForm((atual) => ({
        ...atual,
        codigo: numero,
      }));

      setLoading(false);
    };

    atualizarNumero();

    const intervalo = window.setInterval(
      atualizarNumero,
      TEMPO_ATUALIZACAO
    );

    return () => {
      window.clearInterval(intervalo);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  function alterarCampo(
    campo: keyof typeof form,
    valor: string
  ) {
    setForm((atual) => ({
      ...atual,
      [campo]: valor,
    }));
  }

  function fecharAlertas() {
    setErro("");
    setSucesso("");
  }

  function mostrarErro(mensagem: string) {
    setErro(mensagem);
    setSucesso("");
  }

  function mostrarSucesso(mensagem: string) {
    setSucesso(mensagem);
    setErro("");
  }

  function abrirArquivo(
    arquivo: File | null,
    tipo: TipoPdf
  ) {
    if (!arquivo) {
      return;
    }

    const ehPdf =
      arquivo.type === "application/pdf" ||
      arquivo.name.toLowerCase().endsWith(".pdf");

    if (!ehPdf) {
      mostrarErro(
        "Somente arquivos PDF podem ser visualizados."
      );
      return;
    }

    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }

    const url = URL.createObjectURL(arquivo);

    setPdfUrl(url);
    setPdfNome(arquivo.name);
    setPdfTipo(tipo);
    setPdfModalAberto(true);
  }

  function fecharPdfModal() {
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
    }

    setPdfUrl(null);
    setPdfNome("");
    setPdfTipo(null);
    setPdfModalAberto(false);
  }

  function selecionarPdf(
    arquivo: File | undefined,
    tipo: TipoPdf
  ) {
    if (!arquivo) {
      return;
    }

    const ehPdf =
      arquivo.type === "application/pdf" ||
      arquivo.name.toLowerCase().endsWith(".pdf");

    if (!ehPdf) {
      mostrarErro("Selecione somente arquivos PDF.");
      return;
    }

    if (arquivo.size === 0) {
      mostrarErro("O arquivo selecionado está vazio.");
      return;
    }

    if (arquivo.size > 10 * 1024 * 1024) {
      mostrarErro(
        "O arquivo deve ter no máximo 10 MB."
      );
      return;
    }

    if (tipo === "comprovante") {
      setComprovante(arquivo);
    } else {
      setNfe(arquivo);
    }

    fecharAlertas();
  }

  async function salvarPatrimonio() {
    try {
      setSalvando(true);
      fecharAlertas();

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

      if (!form.status.trim()) {
        throw new Error(
          "Selecione o status do patrimônio."
        );
      }

      const valor = converterMoeda(
        form.valor_aquisicao
      );

      const dados = new FormData();

      dados.append(
        "codigo",
        form.codigo.trim()
      );

      dados.append(
        "n_patrimonio",
        form.n_patrimonio.trim()
      );

      dados.append(
        "nomeitem",
        form.nomeitem.trim()
      );

      dados.append(
        "descricao",
        form.descricao.trim()
      );

      dados.append(
        "categoria",
        form.categoria.trim()
      );

      dados.append(
        "localizacao",
        form.localizacao.trim()
      );

      dados.append(
        "responsavel",
        form.responsavel.trim()
      );

      dados.append(
        "valor_aquisicao",
        valor.toString()
      );

      dados.append(
        "status",
        form.status.trim()
      );

      dados.append(
        "datacompra",
        form.datacompra || ""
      );

      dados.append(
        "observacao",
        form.observacao.trim()
      );

      if (comprovante) {
        dados.append(
          "comprovantepagamento",
          comprovante,
          comprovante.name
        );
      }

      if (nfe) {
        dados.append(
          "nfe",
          nfe,
          nfe.name
        );
      }

      const response = await fetch(
        "/api/auditorio",
        {
          method: "POST",
          body: dados,
        }
      );

      const texto = await response.text();

      let result: ResultadoApi = {};

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

      mostrarSucesso(
        result.message ||
          "Patrimônio cadastrado e documentos enviados com sucesso!"
      );

      window.setTimeout(() => {
        router.push("/diretor/auditoria");
      }, 1500);
    } catch (error) {
      console.error(
        "Erro ao salvar patrimônio:",
        error
      );

      mostrarErro(
        error instanceof Error
          ? error.message
          : "Erro ao cadastrar patrimônio."
      );
    } finally {
      setSalvando(false);
    }
  }

  async function buscarLocalizacao() {
    if (!navigator.geolocation) {
      mostrarErro(
        "A localização não é compatível com este navegador."
      );
      return;
    }

    setBuscandoLocalizacao(true);
    fecharAlertas();

    navigator.geolocation.getCurrentPosition(
      async (posicao) => {
        try {
          const {
            latitude,
            longitude,
          } = posicao.coords;

          const url = new URL(
            "https://nominatim.openstreetmap.org/reverse"
          );

          url.searchParams.set(
            "format",
            "jsonv2"
          );

          url.searchParams.set(
            "lat",
            latitude.toString()
          );

          url.searchParams.set(
            "lon",
            longitude.toString()
          );

          url.searchParams.set(
            "zoom",
            "10"
          );

          url.searchParams.set(
            "addressdetails",
            "1"
          );

          url.searchParams.set(
            "accept-language",
            "pt-BR"
          );

          const resposta = await fetch(
            url.toString(),
            {
              headers: {
                Accept:
                  "application/json",
              },
            }
          );

          if (!resposta.ok) {
            throw new Error(
              "Não foi possível consultar a localização."
            );
          }

          const dados =
            await resposta.json();

          const endereco =
            dados.address || {};

          const cidade =
            endereco.city ||
            endereco.town ||
            endereco.municipality ||
            endereco.village ||
            endereco.county ||
            "";

          const estados: Record<
            string,
            string
          > = {
            Acre: "AC",
            Alagoas: "AL",
            Amapá: "AP",
            Amazonas: "AM",
            Bahia: "BA",
            Ceará: "CE",
            "Distrito Federal": "DF",
            "Espírito Santo": "ES",
            Goiás: "GO",
            Maranhão: "MA",
            "Mato Grosso": "MT",
            "Mato Grosso do Sul": "MS",
            "Minas Gerais": "MG",
            Pará: "PA",
            Paraíba: "PB",
            Paraná: "PR",
            Pernambuco: "PE",
            Piauí: "PI",
            "Rio de Janeiro": "RJ",
            "Rio Grande do Norte": "RN",
            "Rio Grande do Sul": "RS",
            Rondônia: "RO",
            Roraima: "RR",
            "Santa Catarina": "SC",
            "São Paulo": "SP",
            Sergipe: "SE",
            Tocantins: "TO",
          };

          const estado =
            endereco[
              "ISO3166-2-lvl4"
            ]?.replace("BR-", "") ||
            estados[endereco.state] ||
            "";

          if (!cidade || !estado) {
            throw new Error(
              "Não foi possível identificar a cidade e o estado."
            );
          }

          alterarCampo(
            "localizacao",
            `${cidade} - ${estado}`
          );

          mostrarSucesso(
            "Localização preenchida com sucesso!"
          );
        } catch (error) {
          mostrarErro(
            error instanceof Error
              ? error.message
              : "Erro ao buscar localização."
          );
        } finally {
          setBuscandoLocalizacao(false);
        }
      },
      (error) => {
        setBuscandoLocalizacao(false);

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          mostrarErro(
            "Permita o acesso à localização no navegador."
          );
        } else if (
          error.code ===
          error.TIMEOUT
        ) {
          mostrarErro(
            "A localização demorou para responder. Tente novamente."
          );
        } else {
          mostrarErro(
            "Não foi possível obter sua localização."
          );
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#40b99d] px-4">
        <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-8 py-7 shadow-xl">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#00a99d]/20 border-t-[#00a99d]" />

          <p className="text-center text-sm font-medium text-[#102a43]">
            Aguarde, carregando página...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-900/20">
              <FontAwesomeIcon
                icon={faHandHoldingDollar}
                className="text-lg"
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Adicionar Patrimônio
              </h1>

              <p className="mt-1 text-sm text-white/80">
                Cadastre um novo patrimônio no sistema.
              </p>
            </div>
          </div>

          <Link
            href="/diretor/auditoria"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Auditoria
          </Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#dce5ee] bg-white shadow-sm">
          <form
            onSubmit={(event) => {
              event.preventDefault();
              salvarPatrimonio();
            }}
            onKeyDown={(event) => {
              const campo =
                event.target as HTMLElement;

              if (
                event.key === "Enter" &&
                campo.tagName === "INPUT"
              ) {
                event.preventDefault();
                event.stopPropagation();
              }
            }}
            className="p-5 sm:p-6"
          >
            {erro && (
              <div className="mb-5 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <AlertTriangle
                  size={20}
                  className="mt-0.5 shrink-0"
                />

                <div className="flex-1">
                  <strong className="font-bold">
                    Erro
                  </strong>

                  <p>{erro}</p>
                </div>

                <button
                  type="button"
                  onClick={() => setErro("")}
                  className="cursor-pointer"
                  title="Fechar alerta"
                  aria-label="Fechar alerta"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            {sucesso && (
              <div className="mb-5 flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2
                  size={20}
                  className="mt-0.5 shrink-0"
                />

                <div className="flex-1">
                  <strong className="font-bold">
                    Sucesso
                  </strong>

                  <p>{sucesso}</p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setSucesso("")
                  }
                  className="cursor-pointer"
                  title="Fechar alerta"
                  aria-label="Fechar alerta"
                >
                  <X size={18} />
                </button>
              </div>
            )}

            <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
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

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nº Patrimônio
                </label>

                <input
                  type="text"
                  value={form.n_patrimonio}
                  onChange={(event) =>
                    alterarCampo(
                      "n_patrimonio",
                      event.target.value
                    )
                  }
                  autoFocus
                  placeholder="Digite ou escaneie o número"
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-[#073b70] outline-none transition focus:border-[#08a89d] focus:ring-2 focus:ring-[#08a89d]/10"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Digite manualmente ou utilize um leitor de código de barras.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nome do Item
                </label>

                <input
                  type="text"
                  value={form.nomeitem}
                  onChange={(event) =>
                    alterarCampo(
                      "nomeitem",
                      formatarNome(
                        event.target.value
                      )
                    )
                  }
                  placeholder="Ex.: Notebook Dell"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#08a89d]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Categoria
                </label>

                <select
                  value={form.categoria}
                  onChange={(event) =>
                    alterarCampo(
                      "categoria",
                      event.target.value
                    )
                  }
                  className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#08a89d]"
                >
                  <option
                    value=""
                    disabled
                  >
                    Selecione a categoria
                  </option>

                  <option value="Eletrônicos">
                    Eletrônicos
                  </option>

                  <option value="Informática">
                    Informática
                  </option>

                  <option value="Móveis">
                    Móveis
                  </option>

                  <option value="Veículos">
                    Veículos
                  </option>

                  <option value="Equipamentos">
                    Equipamentos
                  </option>

                  <option value="Máquinas">
                    Máquinas
                  </option>

                  <option value="Ferramentas">
                    Ferramentas
                  </option>

                  <option value="Imóveis">
                    Imóveis
                  </option>

                  <option value="Materiais de escritório">
                    Materiais de escritório
                  </option>

                  <option value="Outros">
                    Outros
                  </option>
                </select>
              </div>
            </div>

            <div className="mt-5 grid w-full grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Descrição
                </label>

                <input
                  type="text"
                  value={form.descricao}
                  onChange={(event) =>
                    alterarCampo(
                      "descricao",
                      event.target.value
                    )
                  }
                  placeholder="Descrição do patrimônio"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#08a89d]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Valor do Patrimônio
                </label>

                <input
                  type="text"
                  value={form.valor_aquisicao}
                  onChange={(event) =>
                    alterarCampo(
                      "valor_aquisicao",
                      formatarMoeda(
                        event.target.value
                      )
                    )
                  }
                  placeholder="R$ 0,00"
                  inputMode="numeric"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#08a89d]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Localização
                </label>

                <div className="relative">
                  <input
                    type="text"
                    value={form.localizacao}
                    onChange={(event) =>
                      alterarCampo(
                        "localizacao",
                        event.target.value
                      )
                    }
                    placeholder="Ex.: São Paulo - SP"
                    className="w-full rounded-lg border border-slate-200 px-4 py-3 pr-12 text-sm outline-none focus:border-[#08a89d]"
                  />

                  <button
                    type="button"
                    onClick={
                      buscarLocalizacao
                    }
                    disabled={
                      buscandoLocalizacao
                    }
                    title="Usar minha localização"
                    aria-label="Usar minha localização"
                    className="absolute right-2 top-1/2 flex -translate-y-1/2 cursor-pointer items-center justify-center rounded-md p-2 text-[#08a89d] transition hover:bg-[#08a89d]/10 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {buscandoLocalizacao ? (
                      <Loader2
                        size={20}
                        className="animate-spin"
                      />
                    ) : (
                      <MapPin size={20} />
                    )}
                  </button>
                </div>

                <p className="mt-1 text-xs text-slate-400">
                  Clique no ícone para preencher cidade e estado.
                </p>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Data da Compra
                </label>

                <input
                  type="date"
                  value={form.datacompra}
                  onChange={(event) =>
                    alterarCampo(
                      "datacompra",
                      event.target.value
                    )
                  }
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#08a89d]"
                />
              </div>
            </div>

            <div className="mt-5 grid w-full grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Nome do Responsável
                </label>

                <input
                  type="text"
                  value={form.responsavel}
                  onChange={(event) =>
                    alterarCampo(
                      "responsavel",
                      formatarNome(
                        event.target.value
                      )
                    )
                  }
                  placeholder="Ex.: João da Silva"
                  className="w-full rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#08a89d]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(event) =>
                    alterarCampo(
                      "status",
                      event.target.value
                    )
                  }
                  className="w-full cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-[#08a89d]"
                >
                  <option
                    value=""
                    disabled
                  >
                    Selecione o status
                  </option>

                  <option value="Pendente">
                    Pendente
                  </option>

                  <option value="Compra">
                    Compra
                  </option>

                  <option value="Aluguel">
                    Aluguel
                  </option>

                  <option value="Vendido">
                    Vendido
                  </option>
                </select>
              </div>

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
                        : "Selecionar PDF"}
                    </span>

                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={(event) => {
                        selecionarPdf(
                          event.target.files?.[0],
                          "comprovante"
                        );

                        event.target.value = "";
                      }}
                    />
                  </label>

                  {comprovante && (
                    <button
                      type="button"
                      onClick={() =>
                        abrirArquivo(
                          comprovante,
                          "comprovante"
                        )
                      }
                      className="cursor-pointer rounded-lg border border-slate-200 p-3 text-[#08a89d] hover:bg-slate-50"
                      title="Visualizar comprovante"
                      aria-label="Visualizar comprovante"
                    >
                      <Eye size={20} />
                    </button>
                  )}
                </div>
              </div>

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
                        : "Selecionar PDF"}
                    </span>

                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={(event) => {
                        selecionarPdf(
                          event.target.files?.[0],
                          "nfe"
                        );

                        event.target.value = "";
                      }}
                    />
                  </label>

                  {nfe && (
                    <button
                      type="button"
                      onClick={() =>
                        abrirArquivo(
                          nfe,
                          "nfe"
                        )
                      }
                      className="cursor-pointer rounded-lg border border-slate-200 p-3 text-[#08a89d] hover:bg-slate-50"
                      title="Visualizar NFE"
                      aria-label="Visualizar NFE"
                    >
                      <Eye size={20} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Observação
              </label>

              <textarea
                value={form.observacao}
                onChange={(event) =>
                  alterarCampo(
                    "observacao",
                    event.target.value
                  )
                }
                rows={4}
                placeholder="Observações sobre o patrimônio..."
                className="w-full resize-none rounded-lg border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#08a89d]"
              />
            </div>

            <div className="mt-6 flex justify-end border-t border-slate-200 pt-6">
              <button
                type="submit"
                disabled={salvando}
                className="flex cursor-pointer items-center gap-2 rounded-lg bg-[#08a89d] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#07978e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={16} />
                )}

                {salvando
                  ? "Salvando..."
                  : "Salvar Patrimônio"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {pdfModalAberto && pdfUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-modal-pdf"
        >
          <div className="flex h-[95vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl sm:h-[90vh]">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 sm:px-5 sm:py-4">
              <div className="min-w-0">
                <h2
                  id="titulo-modal-pdf"
                  className="text-base font-semibold text-slate-800 sm:text-lg"
                >
                  Visualização do PDF

                  <span className="ml-1 hidden text-xs font-normal text-slate-500 sm:inline">
                    {pdfTipo === "nfe"
                      ? "Nota Fiscal Eletrônica"
                      : "Comprovante de Pagamento"}
                  </span>
                </h2>

                <p className="truncate text-sm text-slate-500">
                  {pdfNome}
                </p>
              </div>

              <button
                type="button"
                onClick={fecharPdfModal}
                className="cursor-pointer rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Fechar visualização do PDF"
              >
                <X size={22} />
              </button>
            </div>

            <div className="min-h-0 flex-1 bg-slate-100 p-0">
              <iframe
                src={`${pdfUrl}#toolbar=0`}
                title={`Visualização de ${pdfNome}`}
                className="block h-full w-full border-0 bg-white"
              />
            </div>

            <div className="flex justify-end border-t border-slate-200 px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={fecharPdfModal}
                className="cursor-pointer rounded-lg bg-[#08a89d] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#07978e]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}