"use client";

import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleDollarSign,
  Hash,
  Image as ImageIcon,
  Info,
  Ticket,
  X,
  RefreshCw,
  Loader2,
} from "lucide-react";

type ImagemPreview = {
  file: File;
  preview: string;
};

type ApiResponse = {
  mensagem?: string;
  error?: string;
  urls?: string[];
};

const NUMERO_RIFA_KEY = "rifa_numero_gerado";
const NUMERO_RIFA_TIME_KEY = "rifa_numero_gerado_em";

const INTERVALO_NUMERO = 90 * 60 * 1000;

/*
 * ============================================================
 * AGORA ACEITA SOMENTE 1 IMAGEM
 * ============================================================
 */
const MAX_IMAGENS = 1;

const MAX_TAMANHO_IMAGEM = 5 * 1024 * 1024;

/**
 * Retorna o datetime-local mínimo no formato:
 * YYYY-MM-DDTHH:mm
 */
function getMinDateTimeLocal() {
  const agora = new Date();

  const offset = agora.getTimezoneOffset();

  const dataLocal = new Date(
    agora.getTime() - offset * 60 * 1000
  );

  return dataLocal.toISOString().slice(0, 16);
}

/**
 * Converte o valor do datetime-local para ISO.
 */
function converterParaISO(dataLocal: string) {
  if (!dataLocal) {
    return null;
  }

  const data = new Date(dataLocal);

  if (Number.isNaN(data.getTime())) {
    return null;
  }

  return data.toISOString();
}

export default function RifaForm() {
  /*
   * ============================================================
   * NÚMERO DA RIFA
   * ============================================================
   */

  const [numeroRifa, setNumeroRifa] = useState("");

  const [numeroBloqueado, setNumeroBloqueado] =
    useState(true);

  const [tempoRestante, setTempoRestante] =
    useState(0);

  /*
   * ============================================================
   * DADOS DA RIFA
   * ============================================================
   */

  const [titulo, setTitulo] = useState("");

  const [descricao, setDescricao] =
    useState("");

  const [valorNumero, setValorNumero] =
    useState("");

  const [totalNumeros, setTotalNumeros] =
    useState("");

  const [dataSorteio, setDataSorteio] =
    useState("");

  const [status, setStatus] =
    useState("aberta");

  /*
   * ============================================================
   * IMAGEM
   * ============================================================
   */

  const [imagens, setImagens] = useState<
    ImagemPreview[]
  >([]);

  /*
   * ============================================================
   * ALERTA
   * ============================================================
   */

  const [alert, setAlert] = useState("");

  const [alertTipo, setAlertTipo] =
    useState<"success" | "error">("success");

  /*
   * ============================================================
   * ESTADOS
   * ============================================================
   */

  const [salvando, setSalvando] =
    useState(false);

  const [minDateTime, setMinDateTime] =
    useState("");

  /*
   * ============================================================
   * GERAR NÚMERO
   * ============================================================
   */

  const gerarNumeroRifa = () => {
    const numero = Math.floor(
      10000000000 +
        Math.random() * 90000000000
    ).toString();

    const agora = Date.now();

    localStorage.setItem(
      NUMERO_RIFA_KEY,
      numero
    );

    localStorage.setItem(
      NUMERO_RIFA_TIME_KEY,
      agora.toString()
    );

    setNumeroRifa(numero);

    setNumeroBloqueado(true);

    setTempoRestante(
      INTERVALO_NUMERO
    );
  };

  /*
   * ============================================================
   * INICIALIZAÇÃO
   * ============================================================
   */

  useEffect(() => {
    setMinDateTime(
      getMinDateTimeLocal()
    );

    const numeroSalvo =
      localStorage.getItem(
        NUMERO_RIFA_KEY
      );

    const dataGeracao =
      localStorage.getItem(
        NUMERO_RIFA_TIME_KEY
      );

    if (
      !numeroSalvo ||
      !dataGeracao
    ) {
      gerarNumeroRifa();
      return;
    }

    const tempoPassado =
      Date.now() -
      Number(dataGeracao);

    if (
      tempoPassado >=
      INTERVALO_NUMERO
    ) {
      setNumeroRifa(
        numeroSalvo
      );

      setNumeroBloqueado(false);

      setTempoRestante(0);

      return;
    }

    setNumeroRifa(
      numeroSalvo
    );

    setNumeroBloqueado(true);

    setTempoRestante(
      INTERVALO_NUMERO -
        tempoPassado
    );
  }, []);

  /*
   * ============================================================
   * CONTADOR DO NÚMERO
   * ============================================================
   */

  useEffect(() => {
    if (!numeroRifa) {
      return;
    }

    const atualizarTempo = () => {
      const dataGeracao =
        localStorage.getItem(
          NUMERO_RIFA_TIME_KEY
        );

      if (!dataGeracao) {
        return;
      }

      const restante =
        INTERVALO_NUMERO -
        (Date.now() -
          Number(dataGeracao));

      if (restante <= 0) {
        setTempoRestante(0);

        setNumeroBloqueado(
          false
        );

        return;
      }

      setTempoRestante(
        restante
      );

      setNumeroBloqueado(
        true
      );
    };

    atualizarTempo();

    const intervalo =
      setInterval(
        atualizarTempo,
        1000
      );

    return () =>
      clearInterval(
        intervalo
      );
  }, [numeroRifa]);

  /*
   * ============================================================
   * ALERTA
   * ============================================================
   */

  useEffect(() => {
    if (!alert) {
      return;
    }

    const timer =
      setTimeout(() => {
        setAlert("");
      }, 4000);

    return () =>
      clearTimeout(timer);
  }, [alert]);

  /*
   * ============================================================
   * FORMATAR TEMPO
   * ============================================================
   */

  const formatarTempo = (
    tempo: number
  ) => {
    const totalSegundos =
      Math.ceil(
        tempo / 1000
      );

    const horas =
      Math.floor(
        totalSegundos / 3600
      );

    const minutos =
      Math.floor(
        (totalSegundos % 3600) /
          60
      );

    const segundos =
      totalSegundos % 60;

    return `${String(
      horas
    ).padStart(
      2,
      "0"
    )}:${String(
      minutos
    ).padStart(
      2,
      "0"
    )}:${String(
      segundos
    ).padStart(
      2,
      "0"
    )}`;
  };

  /*
   * ============================================================
   * SELECIONAR SOMENTE 1 IMAGEM
   * ============================================================
   */

  const selecionarImagens = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(
      event.target.files || []
    );

    /*
     * Limpa o valor do input.
     * Isso permite selecionar novamente
     * o mesmo arquivo depois.
     */
    event.target.value = "";

    if (!files.length) {
      return;
    }

    /*
     * ==========================================================
     * BLOQUEIA MAIS DE UMA IMAGEM
     * ==========================================================
     */

    if (files.length > 1) {
      setAlertTipo("error");

      setAlert(
        "Você pode selecionar somente 1 imagem para a rifa."
      );

      return;
    }

    const file = files[0];

    if (!file) {
      return;
    }

    /*
     * ==========================================================
     * VERIFICA SE É IMAGEM
     * ==========================================================
     */

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setAlertTipo("error");

      setAlert(
        `O arquivo "${file.name}" não é uma imagem válida.`
      );

      return;
    }

    /*
     * ==========================================================
     * VERIFICA TAMANHO
     * ==========================================================
     */

    if (
      file.size >
      MAX_TAMANHO_IMAGEM
    ) {
      setAlertTipo("error");

      setAlert(
        `A imagem "${file.name}" ultrapassa o limite de 5 MB.`
      );

      return;
    }

    /*
     * ==========================================================
     * SE JÁ EXISTE UMA IMAGEM
     * SUBSTITUI PELA NOVA
     * ==========================================================
     */

    imagens.forEach(
      (imagem) => {
        URL.revokeObjectURL(
          imagem.preview
        );
      }
    );

    /*
     * ==========================================================
     * CRIA PREVIEW
     * ==========================================================
     */

    const novaImagem: ImagemPreview = {
      file,
      preview:
        URL.createObjectURL(
          file
        ),
    };

    setImagens([
      novaImagem,
    ]);

    setAlert("");
  };

  /*
   * ============================================================
   * REMOVER IMAGEM
   * ============================================================
   */

  const removerImagem = (
    index: number
  ) => {
    setImagens(
      (atual) => {
        const imagem =
          atual[index];

        if (imagem) {
          URL.revokeObjectURL(
            imagem.preview
          );
        }

        return atual.filter(
          (_, i) =>
            i !== index
        );
      }
    );
  };

  /*
   * ============================================================
   * LIMPAR IMAGEM
   * ============================================================
   */

  const limparImagens = () => {
    imagens.forEach(
      (imagem) => {
        URL.revokeObjectURL(
          imagem.preview
        );
      }
    );

    setImagens([]);
  };

  /*
   * ============================================================
   * ENVIAR IMAGEM PARA AWS
   * ============================================================
   */

  const enviarImagensAWS =
    async (
      dataSorteioAtual: string
    ): Promise<string[]> => {
      if (
        !dataSorteioAtual
      ) {
        throw new Error(
          "A data e hora do sorteio são obrigatórias."
        );
      }

      /*
       * SOMENTE 1 IMAGEM
       */

      if (
        imagens.length !== 1
      ) {
        throw new Error(
          "A rifa precisa ter exatamente 1 imagem."
        );
      }

      /*
       * Converte data
       */

      const dataISO =
        converterParaISO(
          dataSorteioAtual
        );

      if (!dataISO) {
        throw new Error(
          "A data e hora do sorteio são inválidas."
        );
      }

      /*
       * Verifica data futura
       */

      const dataDate =
        new Date(dataISO);

      if (
        dataDate.getTime() <=
        Date.now()
      ) {
        throw new Error(
          "A data do sorteio precisa ser futura."
        );
      }

      /*
       * FormData
       */

      const formData =
        new FormData();

      /*
       * Envia somente 1 arquivo.
       *
       * Mantemos o nome "files"
       * para não quebrar sua API atual.
       */

      const imagem =
        imagens[0];

      if (!imagem) {
        throw new Error(
          "Imagem não encontrada."
        );
      }

      formData.append(
        "files",
        imagem.file,
        imagem.file.name
      );

      /*
       * Data original
       */

      formData.append(
        "data_sorteio",
        dataSorteioAtual
      );

      /*
       * Data ISO
       */

      formData.append(
        "data_sorteio_iso",
        dataISO
      );

      /*
       * Número da rifa
       */

      formData.append(
        "numero_rifa",
        numeroRifa
      );

      /*
       * Título
       */

      formData.append(
        "titulo",
        titulo.trim()
      );

      console.log(
        "Enviando upload:",
        {
          data_sorteio:
            dataSorteioAtual,

          data_sorteio_iso:
            dataISO,

          numero_rifa:
            numeroRifa,

          titulo:
            titulo.trim(),

          quantidade:
            1,

          arquivo:
            imagem.file.name,
        }
      );

      const response =
        await fetch(
          "/api/upload-rifa-images",
          {
            method: "POST",
            body: formData,
          }
        );

      let data: ApiResponse =
        {};

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "A API de upload retornou uma resposta inválida."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.mensagem ||
            data?.error ||
            "Não foi possível enviar a imagem."
        );
      }

      if (
        !Array.isArray(
          data?.urls
        )
      ) {
        throw new Error(
          "A API de upload não retornou a URL da imagem."
        );
      }

      /*
       * A API também precisa retornar
       * exatamente 1 URL.
       */

      if (
        data.urls.length !== 1
      ) {
        throw new Error(
          "O upload deveria retornar exatamente 1 imagem."
        );
      }

      return data.urls;
    };

  /*
   * ============================================================
   * CADASTRAR RIFA
   * ============================================================
   */

  const cadastrarRifa =
    async (
      e: FormEvent<HTMLFormElement>
    ) => {
      e.preventDefault();

      if (salvando) {
        return;
      }

      /*
       * ========================================================
       * NÚMERO
       * ========================================================
       */

      if (
        !numeroRifa.trim()
      ) {
        setAlertTipo("error");

        setAlert(
          "Informe o número da rifa."
        );

        return;
      }

      /*
       * ========================================================
       * TÍTULO
       * ========================================================
       */

      if (!titulo.trim()) {
        setAlertTipo("error");

        setAlert(
          "Informe o título da rifa."
        );

        return;
      }

      /*
       * ========================================================
       * VALOR
       * ========================================================
       */

      const valor =
        Number(valorNumero);

      if (
        !valorNumero ||
        !Number.isFinite(
          valor
        ) ||
        valor <= 0
      ) {
        setAlertTipo("error");

        setAlert(
          "Informe um valor válido para o número."
        );

        return;
      }

      /*
       * ========================================================
       * QUANTIDADE
       * ========================================================
       */

      const quantidade =
        Number(totalNumeros);

      if (
        !totalNumeros ||
        !Number.isInteger(
          quantidade
        ) ||
        quantidade <= 0
      ) {
        setAlertTipo("error");

        setAlert(
          "Informe uma quantidade válida de números."
        );

        return;
      }

      /*
       * ========================================================
       * DATA
       * ========================================================
       */

      if (
        !dataSorteio
      ) {
        setAlertTipo("error");

        setAlert(
          "Informe a data e hora do sorteio."
        );

        return;
      }

      /*
       * ========================================================
       * CONVERTE DATA
       * ========================================================
       */

      const dataISO =
        converterParaISO(
          dataSorteio
        );

      if (!dataISO) {
        setAlertTipo("error");

        setAlert(
          "Informe uma data de sorteio válida."
        );

        return;
      }

      /*
       * ========================================================
       * VERIFICA DATA FUTURA
       * ========================================================
       */

      const dataSorteioDate =
        new Date(dataISO);

      if (
        dataSorteioDate.getTime() <=
        Date.now()
      ) {
        setAlertTipo("error");

        setAlert(
          "A data do sorteio precisa ser futura."
        );

        return;
      }

      /*
       * ========================================================
       * IMAGEM
       * ========================================================
       */

      if (
        imagens.length !== 1
      ) {
        setAlertTipo("error");

        setAlert(
          "Selecione exatamente 1 imagem da rifa."
        );

        return;
      }

      try {
        setSalvando(true);

        setAlert("");

        /*
         * ======================================================
         * PRIMEIRO:
         * envia imagem para AWS
         * ======================================================
         */

        const urlsImagens =
          await enviarImagensAWS(
            dataSorteio
          );

        /*
         * Garante exatamente 1 URL
         */

        if (
          urlsImagens.length !== 1
        ) {
          throw new Error(
            "O upload deve retornar exatamente 1 imagem."
          );
        }

        /*
         * ======================================================
         * SEGUNDO:
         * cadastra a rifa
         * ======================================================
         */

        const response =
          await fetch(
            "/api/rifas",
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                numero_rifa:
                  numeroRifa.trim(),

                titulo:
                  titulo.trim(),

                descricao:
                  descricao.trim(),

                /*
                 * Mantém como array
                 * com apenas 1 imagem.
                 */

                imagens:
                  urlsImagens,

                /*
                 * Imagem principal
                 */

                imagem:
                  urlsImagens[0] ||
                  null,

                valor_numero:
                  valor,

                total_numeros:
                  quantidade,

                data_sorteio:
                  dataISO,

                data_sorteio_local:
                  dataSorteio,

                status,
              }),
            }
          );

        let data: ApiResponse =
          {};

        try {
          data =
            await response.json();
        } catch {
          data = {};
        }

        if (
          !response.ok
        ) {
          throw new Error(
            data?.mensagem ||
              data?.error ||
              "Não foi possível cadastrar a rifa."
          );
        }

        /*
         * ======================================================
         * SUCESSO
         * ======================================================
         */

        setAlertTipo(
          "success"
        );

        setAlert(
          data?.mensagem ||
            "Rifa cadastrada com sucesso!"
        );

        /*
         * Limpa formulário
         */

        limparImagens();

        setTitulo("");

        setDescricao("");

        setValorNumero("");

        setTotalNumeros("");

        setDataSorteio("");

        setStatus("aberta");
      } catch (error) {
        console.error(
          "Erro ao cadastrar rifa:",
          error
        );

        setAlertTipo("error");

        setAlert(
          error instanceof Error
            ? error.message
            : "Não foi possível conectar ao servidor."
        );
      } finally {
        setSalvando(false);
      }
    };

  /*
   * ============================================================
   * DATA FORMATADA
   * ============================================================
   */

  const dataSorteioFormatada =
    dataSorteio
      ? new Date(
          dataSorteio
        ).toLocaleString(
          "pt-BR",
          {
            dateStyle:
              "short",

            timeStyle:
              "short",
          }
        )
      : "";

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="min-h-screen">
      {/* ========================================================
          ALERTA
      ========================================================= */}

      {alert && (
        <div
          className={`fixed right-5 top-5 z-[200] flex max-w-[calc(100%-40px)] items-center gap-3 rounded-xl px-5 py-3 text-sm font-semibold text-white shadow-xl ${
            alertTipo ===
            "success"
              ? "bg-emerald-500"
              : "bg-red-500"
          }`}
        >
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/20">
            {alertTipo ===
            "success" ? (
              <Check className="h-4 w-4" />
            ) : (
              <span>!</span>
            )}
          </div>

          <span>
            {alert}
          </span>
        </div>
      )}

      <div className="mx-auto w-full max-w-8xl space-y-4">
        {/* ======================================================
            CABEÇALHO
        ======================================================= */}

        <div className="mb-5 rounded-2xl bg-white px-5 py-5 shadow-sm md:px-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d8f7eb]">
                <Ticket className="h-5 w-5 text-[#00a99d]" />
              </div>

              <div>
                <h1 className="text-lg font-bold text-[#102a43] md:text-xl">
                  Registrar nova rifa
                </h1>

                <p className="mt-0.5 text-xs text-[#607d94] md:text-sm">
                  Preencha os dados abaixo para criar uma nova rifa.
                </p>
              </div>
            </div>

            <Link
              href="/diretor/rifa"
              className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#dfe7eb] bg-white px-4 py-2.5 text-xs font-semibold text-[#607d94] transition hover:bg-[#f6faf8] hover:text-[#00a99d]"
            >
              <ArrowLeft className="h-4 w-4" />

              Voltar
            </Link>
          </div>
        </div>

        {/* ======================================================
            FORMULÁRIO
        ======================================================= */}

        <form
          onSubmit={
            cadastrarRifa
          }
          className="space-y-4"
        >
          {/* ====================================================
              INFORMAÇÕES
          ===================================================== */}

          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-[#edf1f3] px-5 py-5 md:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8f7eb]">
                  <Info className="h-5 w-5 text-[#00a99d]" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-[#102a43]">
                    Informações da rifa
                  </h2>

                  <p className="mt-0.5 text-xs text-[#607d94]">
                    Informações básicas para identificação da rifa.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 md:p-6">
              {/* Número */}

              <div>
                <label
                  htmlFor="numero_rifa"
                  className="mb-2 block text-xs font-semibold text-[#314e68]"
                >
                  Número da Rifa
                </label>

                <div className="relative">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91a4b2]" />

                  <input
                    id="numero_rifa"
                    type="text"
                    value={
                      numeroRifa
                    }
                    readOnly
                    className="w-full rounded-xl border border-[#dfe7eb] bg-[#f8fbfa] py-2.5 pl-10 pr-12 text-sm font-semibold text-[#102a43] outline-none"
                  />

                  {!numeroBloqueado && (
                    <button
                      type="button"
                      onClick={
                        gerarNumeroRifa
                      }
                      className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 cursor-pointer items-center justify-center rounded-lg bg-[#d8f7eb] text-[#00a99d] transition hover:bg-[#b9eadb]"
                      title="Gerar novo número"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Título */}

              <div>
                <label
                  htmlFor="titulo"
                  className="mb-2 block text-xs font-semibold text-[#314e68]"
                >
                  Título da Rifa
                </label>

                <input
                  id="titulo"
                  type="text"
                  value={
                    titulo
                  }
                  onChange={(
                    e
                  ) =>
                    setTitulo(
                      e.target
                        .value
                    )
                  }
                  placeholder="Ex: Rifa iPhone 17 Pro Max"
                  className="w-full rounded-xl border border-[#dfe7eb] px-3 py-2.5 text-sm text-[#102a43] outline-none transition placeholder:text-[#9aaab5] focus:border-[#00a99d] focus:ring-2 focus:ring-[#00a99d]/10"
                />
              </div>

              {/* Descrição */}

              <div className="md:col-span-2">
                <label
                  htmlFor="descricao"
                  className="mb-2 block text-xs font-semibold text-[#314e68]"
                >
                  Descrição
                </label>

                <textarea
                  id="descricao"
                  rows={4}
                  value={
                    descricao
                  }
                  onChange={(
                    e
                  ) =>
                    setDescricao(
                      e.target
                        .value
                    )
                  }
                  placeholder="Descreva a premiação, regras e demais informações da rifa..."
                  className="w-full resize-none rounded-xl border border-[#dfe7eb] px-3 py-2.5 text-sm text-[#102a43] outline-none transition placeholder:text-[#9aaab5] focus:border-[#00a99d] focus:ring-2 focus:ring-[#00a99d]/10"
                />
              </div>
            </div>
          </section>

          {/* ====================================================
              CONFIGURAÇÃO
          ===================================================== */}

          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-[#edf1f3] px-5 py-5 md:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8f7eb]">
                  <CircleDollarSign className="h-5 w-5 text-[#00a99d]" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-[#102a43]">
                    Configuração da rifa
                  </h2>

                  <p className="mt-0.5 text-xs text-[#607d94]">
                    Defina o valor e a quantidade de números.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 md:p-6">
              {/* Valor */}

              <div>
                <label
                  htmlFor="valor_numero"
                  className="mb-2 block text-xs font-semibold text-[#314e68]"
                >
                  Valor por número
                </label>

                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#91a4b2]">
                    R$
                  </span>

                  <input
                    id="valor_numero"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={
                      valorNumero
                    }
                    onChange={(
                      e
                    ) =>
                      setValorNumero(
                        e.target
                          .value
                      )
                    }
                    placeholder="10,00"
                    className="w-full rounded-xl border border-[#dfe7eb] py-2.5 pl-10 pr-3 text-sm text-[#102a43] outline-none transition placeholder:text-[#9aaab5] focus:border-[#00a99d] focus:ring-2 focus:ring-[#00a99d]/10"
                  />
                </div>
              </div>

              {/* Quantidade */}

              <div>
                <label
                  htmlFor="total_numeros"
                  className="mb-2 block text-xs font-semibold text-[#314e68]"
                >
                  Quantidade de números
                </label>

                <input
                  id="total_numeros"
                  type="number"
                  min="1"
                  step="1"
                  value={
                    totalNumeros
                  }
                  onChange={(
                    e
                  ) =>
                    setTotalNumeros(
                      e.target
                        .value
                    )
                  }
                  placeholder="Ex: 100"
                  className="w-full rounded-xl border border-[#dfe7eb] px-3 py-2.5 text-sm text-[#102a43] outline-none transition placeholder:text-[#9aaab5] focus:border-[#00a99d] focus:ring-2 focus:ring-[#00a99d]/10"
                />
              </div>
            </div>
          </section>

          {/* ====================================================
              SORTEIO E IMAGEM
          ===================================================== */}

          <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
            <div className="border-b border-[#edf1f3] px-5 py-5 md:px-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d8f7eb]">
                  <CalendarDays className="h-5 w-5 text-[#00a99d]" />
                </div>

                <div>
                  <h2 className="text-base font-bold text-[#102a43]">
                    Sorteio e imagem
                  </h2>

                  <p className="mt-0.5 text-xs text-[#607d94]">
                    Escolha a data do sorteio e 1 imagem.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2 md:p-6">
              {/* ==================================================
                  DATA
              =================================================== */}

              <div>
                <label
                  htmlFor="data_sorteio"
                  className="mb-2 block text-xs font-semibold text-[#314e68]"
                >
                  Data e hora do sorteio
                </label>

                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#91a4b2]" />

                  <input
                    id="data_sorteio"
                    name="data_sorteio"
                    type="datetime-local"
                    value={
                      dataSorteio
                    }
                    onChange={(
                      e
                    ) =>
                      setDataSorteio(
                        e.target
                          .value
                      )
                    }
                    min={
                      minDateTime
                    }
                    required
                    className="w-full rounded-xl border border-[#dfe7eb] py-2.5 pl-10 pr-3 text-sm text-[#102a43] outline-none transition focus:border-[#00a99d] focus:ring-2 focus:ring-[#00a99d]/10"
                  />
                </div>

                {dataSorteio && (
                  <div className="mt-3 rounded-xl border border-[#b9eadb] bg-[#eaf8f4] px-3 py-2.5">
                    <p className="text-xs text-[#607d94]">
                      Sorteio programado para:
                    </p>

                    <p className="mt-1 text-sm font-bold text-[#00a99d]">
                      {
                        dataSorteioFormatada
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* ==================================================
                  UPLOAD
              =================================================== */}

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#314e68]">
                  Imagem da rifa
                </label>

                <label
                  htmlFor="imagens"
                  className={`flex min-h-[46px] items-center gap-3 rounded-xl border border-dashed border-[#b9cbd3] bg-[#f8fbfa] px-4 py-2.5 transition ${
                    imagens.length >=
                    MAX_IMAGENS
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer hover:border-[#00a99d] hover:bg-[#f1faf7]"
                  }`}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#d8f7eb]">
                    <ImageIcon className="h-4 w-4 text-[#00a99d]" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#314e68]">
                      {imagens.length ===
                      1
                        ? "Imagem selecionada"
                        : "Selecionar imagem"}
                    </p>

                    <p className="text-xs text-[#91a4b2]">
                      {imagens.length}/1
                      {" "}
                      imagem selecionada · máximo 5 MB
                    </p>
                  </div>

                  <input
                    id="imagens"
                    type="file"
                    accept="image/*"
                    disabled={
                      imagens.length >=
                      MAX_IMAGENS
                    }
                    onChange={
                      selecionarImagens
                    }
                    className="hidden"
                  />
                </label>

                {imagens.length ===
                  1 && (
                  <p className="mt-2 text-[11px] text-[#607d94]">
                    Para trocar a imagem, remova a atual e selecione outra.
                  </p>
                )}
              </div>

              {/* ==================================================
                  PREVIEW
              =================================================== */}

              {imagens.length >
                0 && (
                <div className="md:col-span-2">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {imagens.map(
                      (
                        imagem,
                        index
                      ) => (
                        <div
                          key={
                            imagem.preview
                          }
                          className="group relative max-w-md overflow-hidden rounded-2xl border border-[#dfe7eb] bg-[#f8fbfa]"
                        >
                          <img
                            src={
                              imagem.preview
                            }
                            alt="Imagem da rifa"
                            className="h-56 w-full object-cover"
                          />

                          <div className="absolute left-2 top-2 rounded-lg bg-black/60 px-2 py-1 text-[10px] font-bold text-white">
                            Imagem da rifa
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              removerImagem(
                                index
                              )
                            }
                            disabled={
                              salvando
                            }
                            className="absolute right-2 top-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-red-500 text-white shadow-md transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            title="Remover imagem"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* ====================================================
              AVISO
          ===================================================== */}

          <div className="rounded-2xl border border-[#b9eadb] bg-[#eaf8f4] p-5">
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#d8f7eb]">
                <Ticket className="h-4 w-4 text-[#00a99d]" />
              </div>

              <div>
                <h3 className="text-sm font-bold text-[#102a43]">
                  Antes de cadastrar
                </h3>

                <p className="mt-1 text-xs leading-5 text-[#607d94]">
                  A rifa aceita somente 1 imagem. A imagem será enviada para a AWS junto com a data e hora do sorteio.
                </p>

                {dataSorteio && (
                  <p className="mt-2 text-xs font-semibold text-[#00a99d]">
                    Sorteio:
                    {" "}
                    {
                      dataSorteioFormatada
                    }
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ====================================================
              BOTÕES
          ===================================================== */}

          <div className="flex flex-col-reverse gap-3 pb-6 sm:flex-row sm:justify-start">
            <Link
              href="/diretor/rifa"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#dfe7eb] bg-white px-6 py-2.5 text-sm font-semibold text-[#607d94] shadow-sm transition hover:bg-[#f6faf8] hover:text-[#00a99d]"
            >
              <ArrowLeft className="h-4 w-4" />

              Cancelar
            </Link>

            <button
              type="submit"
              disabled={
                salvando
              }
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#00a99d] px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#008f85] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {salvando ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}

              {salvando
                ? "Enviando e cadastrando..."
                : "Cadastrar Rifa"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
