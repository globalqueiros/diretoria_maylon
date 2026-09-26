"use client";

import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  ClipboardCheck,
  ExternalLink,
  FileSearch,
  FileText,
  MapPin,
  Package,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";

type StatusPatrimonio =
  | "Pendente"
  | "Compra"
  | "Aluguel"
  | "Auditado"
  | "Divergência";

type Cor =
  | "blue"
  | "yellow"
  | "green"
  | "orange"
  | "red";

type Patrimonio = {
  id: number;
  codigo: string;
  n_patrimonio: string;
  nomeitem: string;
  descricao: string;
  categoria: string;
  localizacao: string;
  responsavel: string | null;
  valor_aquisicao: number | string;
  comprovantepagamento: string | null;
  nfe: string | null;
  status: StatusPatrimonio;
  datacompra: string | null;
  observacao: string | null;
  created_at?: string;
  updated_at?: string;
};

type ApiResponse = {
  success: boolean;
  data?: Patrimonio[];
  error?: string;
};

type FormPatrimonio = {
  localizacao: string;
  responsavel: string;
  valor_aquisicao: string;
  datacompra: string;
  descricao: string;
  observacao: string;
  status: StatusPatrimonio;
};

function money(
  value: number | string | null | undefined
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "R$ 0,00";
  }

  let numericValue: number;

  if (typeof value === "string") {
    const texto = value
      .trim()
      .replace(/^R\$\s*/i, "");

    if (texto.includes(",")) {
      numericValue = Number(
        texto
          .replace(/\./g, "")
          .replace(",", ".")
      );
    } else {
      numericValue = Number(texto);
    }
  } else {
    numericValue = Number(value);
  }

  if (!Number.isFinite(numericValue)) {
    numericValue = 0;
  }

  return numericValue.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatMoneyInput(value: string): string {
  const somenteNumeros = value.replace(/\D/g, "");

  if (!somenteNumeros) {
    return "";
  }

  const numero = Number(somenteNumeros) / 100;

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseMoney(value: string): number {
  if (!value) {
    return 0;
  }

  const texto = value
    .trim()
    .replace(/^R\$\s*/i, "");

  let normalized: string;

  if (texto.includes(",")) {
    normalized = texto
      .replace(/\./g, "")
      .replace(",", ".");
  } else {
    normalized = texto;
  }

  const numberValue = Number(normalized);

  return Number.isFinite(numberValue)
    ? numberValue
    : 0;
}

function formatDate(
  date: string | null | undefined
): string {
  if (!date) {
    return "-";
  }

  const somenteData = date.substring(0, 10);

  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      somenteData
    )
  ) {
    const [ano, mes, dia] =
      somenteData.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("pt-BR");
}

function urlArquivoS3(
  caminho: string | null | undefined
): string | null {
  if (!caminho) {
    return null;
  }

  if (
    caminho.startsWith("http://") ||
    caminho.startsWith("https://")
  ) {
    return caminho;
  }

  const bucket =
    process.env.NEXT_PUBLIC_AWS_S3_BUCKET_1 ||
    "documentos-fiscais-prod";

  const region =
    process.env.NEXT_PUBLIC_AWS_REGION_1 ||
    "us-east-1";

  const key = caminho
    .replace(/^\/+/, "")
    .split("/")
    .map((parte) =>
      encodeURIComponent(parte)
    )
    .join("/");

  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
}

export default function Page() {
  const router = useRouter();

  const [patrimonios, setPatrimonios] =
    useState<Patrimonio[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [erro, setErro] = useState("");

  const [busca, setBusca] = useState("");

  const [status, setStatus] =
    useState("Todos");

  const [categoria, setCategoria] =
    useState("Todas");

  const [
    patrimonioEditando,
    setPatrimonioEditando,
  ] = useState<Patrimonio | null>(null);

  const [
    modalAberto,
    setModalAberto,
  ] = useState(false);

  const [salvando, setSalvando] =
    useState(false);

  const [erroModal, setErroModal] =
    useState("");

  const [
    sucessoModal,
    setSucessoModal,
  ] = useState("");

  const [form, setForm] =
    useState<FormPatrimonio>({
      localizacao: "",
      responsavel: "",
      valor_aquisicao: "",
      datacompra: "",
      descricao: "",
      observacao: "",
      status: "Pendente",
    });

  const [novoNfe, setNovoNfe] =
    useState<File | null>(null);

  const [
    novoComprovante,
    setNovoComprovante,
  ] = useState<File | null>(null);

  const [
    removerNfe,
    setRemoverNfe,
  ] = useState(false);

  const [
    removerComprovante,
    setRemoverComprovante,
  ] = useState(false);

  const carregarPatrimonio =
    useCallback(async () => {
      try {
        setLoading(true);
        setErro("");

        const params =
          new URLSearchParams();

        const buscaLimpa =
          busca.trim();

        if (buscaLimpa) {
          params.set(
            "busca",
            buscaLimpa
          );
        }

        if (status !== "Todos") {
          params.set(
            "status",
            status
          );
        }

        if (categoria !== "Todas") {
          params.set(
            "categoria",
            categoria
          );
        }

        const query = params.toString();

        const url = query
          ? `/api/auditorio?${query}`
          : "/api/auditorio";

        const response = await fetch(url, {
          method: "GET",
          cache: "no-store",
        });

        let result: ApiResponse;

        try {
          result = await response.json();
        } catch {
          throw new Error(
            "A API retornou uma resposta inválida."
          );
        }

        if (
          !response.ok ||
          !result.success
        ) {
          throw new Error(
            result.error ||
              "Erro ao carregar patrimônio."
          );
        }

        setPatrimonios(
          Array.isArray(result.data)
            ? result.data
            : []
        );
      } catch (error) {
        console.error(
          "Erro ao carregar patrimônio:",
          error
        );

        setPatrimonios([]);

        setErro(
          error instanceof Error
            ? error.message
            : "Erro ao carregar patrimônio."
        );
      } finally {
        setLoading(false);
      }
    }, [
      busca,
      status,
      categoria,
    ]);

  useEffect(() => {
    carregarPatrimonio();
  }, [carregarPatrimonio]);

  const categorias = useMemo(() => {
    return Array.from(
      new Set(
        patrimonios
          .map((item) =>
            item.categoria?.trim()
          )
          .filter(
            (
              categoria
            ): categoria is string =>
              Boolean(categoria)
          )
      )
    ).sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    );
  }, [patrimonios]);

  const alugueis = useMemo(() => {
    return patrimonios.filter((item) => {
      const categoria =
        item.categoria
          ?.trim()
          .toLowerCase();

      const status =
        item.status
          ?.trim()
          .toLowerCase();

      return (
        categoria === "aluguel" ||
        status === "aluguel"
      );
    });
  }, [patrimonios]);

  const totalBens = patrimonios.length;

  const totalValor = patrimonios.reduce(
    (total, item) => {
      const valor =
        typeof item.valor_aquisicao ===
        "string"
          ? parseMoney(
              item.valor_aquisicao
            )
          : Number(
              item.valor_aquisicao
            );

      return (
        total +
        (Number.isFinite(valor)
          ? valor
          : 0)
      );
    },
    0
  );

  const totalAuditados =
    patrimonios.filter(
      (item) =>
        item.status === "Auditado"
    ).length;

  const totalPendentes =
    patrimonios.filter(
      (item) =>
        item.status === "Pendente"
    ).length;

  const totalDivergencias =
    patrimonios.filter(
      (item) =>
        item.status === "Divergência"
    ).length;

  const totalCompras =
    patrimonios.filter(
      (item) =>
        item.categoria
          ?.trim()
          .toLowerCase() === "compra"
    ).length;

  const totalAlugueis =
    alugueis.length;

  const valorTotalAlugueis =
    alugueis.reduce(
      (total, item) => {
        const valor =
          typeof item.valor_aquisicao ===
          "string"
            ? parseMoney(
                item.valor_aquisicao
              )
            : Number(
                item.valor_aquisicao
              );

        return (
          total +
          (Number.isFinite(valor)
            ? valor
            : 0)
        );
      },
      0
    );

  const percentual =
    totalBens > 0
      ? Math.round(
          (totalAuditados /
            totalBens) *
            100
        )
      : 0;

  const abrirEdicao = (
    item: Patrimonio
  ) => {
    if (item.status !== "Pendente") {
      return;
    }

    setPatrimonioEditando(item);

    const valor =
      typeof item.valor_aquisicao ===
      "string"
        ? parseMoney(
            item.valor_aquisicao
          )
        : Number(
            item.valor_aquisicao
          );

    setForm({
      localizacao:
        item.localizacao || "",
      responsavel:
        item.responsavel || "",
      valor_aquisicao:
        Number.isFinite(valor)
          ? valor.toLocaleString(
              "pt-BR",
              {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }
            )
          : "",
      datacompra:
        item.datacompra
          ? item.datacompra.substring(
              0,
              10
            )
          : "",
      descricao:
        item.descricao || "",
      observacao:
        item.observacao || "",
      status:
        item.status || "Pendente",
    });

    setNovoNfe(null);
    setNovoComprovante(null);
    setRemoverNfe(false);
    setRemoverComprovante(false);
    setErroModal("");
    setSucessoModal("");
    setModalAberto(true);
  };

  const fecharModal = () => {
    if (salvando) {
      return;
    }

    setModalAberto(false);
    setPatrimonioEditando(null);
    setNovoNfe(null);
    setNovoComprovante(null);
    setRemoverNfe(false);
    setRemoverComprovante(false);
    setErroModal("");
    setSucessoModal("");
  };

  const alterarCampo = <
    K extends keyof FormPatrimonio
  >(
    campo: K,
    valor: FormPatrimonio[K]
  ) => {
    setForm((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const salvarEdicao = async () => {
    if (!patrimonioEditando) {
      return;
    }

    if (
      patrimonioEditando.status !==
      "Pendente"
    ) {
      setErroModal(
        "Somente patrimônios com status Pendente podem ser editados."
      );

      return;
    }

    try {
      setSalvando(true);
      setErroModal("");
      setSucessoModal("");

      if (!form.localizacao.trim()) {
        throw new Error(
          "Informe a localização."
        );
      }

      if (!form.responsavel.trim()) {
        throw new Error(
          "Informe o responsável."
        );
      }

      if (
        !form.valor_aquisicao.trim()
      ) {
        throw new Error(
          "Informe o valor de aquisição."
        );
      }

      if (!form.datacompra) {
        throw new Error(
          "Informe a data da compra."
        );
      }

      if (!form.status) {
        throw new Error(
          "Informe o status."
        );
      }

      const valorNumerico =
        parseMoney(
          form.valor_aquisicao
        );

      if (
        !Number.isFinite(
          valorNumerico
        ) ||
        valorNumerico < 0
      ) {
        throw new Error(
          "Informe um valor de aquisição válido."
        );
      }

      const formData = new FormData();

      formData.append(
        "id",
        String(
          patrimonioEditando.id
        )
      );

      formData.append(
        "localizacao",
        form.localizacao.trim()
      );

      formData.append(
        "responsavel",
        form.responsavel.trim()
      );

      formData.append(
        "valor_aquisicao",
        String(valorNumerico)
      );

      formData.append(
        "datacompra",
        form.datacompra
      );

      formData.append(
        "descricao",
        form.descricao.trim()
      );

      formData.append(
        "observacao",
        form.observacao.trim()
      );

      formData.append(
        "codigo",
        patrimonioEditando.codigo || ""
      );

      formData.append(
        "n_patrimonio",
        patrimonioEditando.n_patrimonio ||
          ""
      );

      formData.append(
        "nomeitem",
        patrimonioEditando.nomeitem ||
          ""
      );

      formData.append(
        "categoria",
        patrimonioEditando.categoria ||
          ""
      );

      formData.append(
        "status",
        form.status
      );

      formData.append(
        "removerNfe",
        removerNfe ? "true" : "false"
      );

      if (novoNfe) {
        formData.append(
          "nfe",
          novoNfe,
          novoNfe.name
        );
      }

      formData.append(
        "removerComprovante",
        removerComprovante
          ? "true"
          : "false"
      );

      if (novoComprovante) {
        formData.append(
          "comprovantepagamento",
          novoComprovante,
          novoComprovante.name
        );
      }

      const response = await fetch(
        "/api/auditorio/editar",
        {
          method: "PUT",
          body: formData,
        }
      );

      let result: {
        success?: boolean;
        error?: string;
        message?: string;
        data?: Patrimonio;
      };

      try {
        result =
          await response.json();
      } catch {
        throw new Error(
          "A API retornou uma resposta inválida."
        );
      }

      if (
        !response.ok ||
        !result.success
      ) {
        throw new Error(
          result.error ||
            result.message ||
            "Não foi possível atualizar o patrimônio."
        );
      }

      setSucessoModal(
        "Patrimônio atualizado com sucesso."
      );

      await carregarPatrimonio();

      setTimeout(() => {
        setModalAberto(false);
        setPatrimonioEditando(null);
        setNovoNfe(null);
        setNovoComprovante(null);
        setRemoverNfe(false);
        setRemoverComprovante(false);
        setSucessoModal("");
      }, 700);
    } catch (error) {
      console.error(
        "Erro ao atualizar patrimônio:",
        error
      );

      setErroModal(
        error instanceof Error
          ? error.message
          : "Erro ao atualizar patrimônio."
      );
    } finally {
      setSalvando(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#40b99d] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl px-8 py-7 flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-[#00a99d]/20 border-t-[#00a99d] animate-spin" />

          <p className="text-sm font-medium text-[#102a43] text-center">
            Aguarde, carregando página...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen">
      <header className="py-6 pt-1 text-white">
        <div className="mx-auto">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight md:text-[28px]">
                Auditoria de Patrimônio
              </h1>

              <p className="mt-1 text-sm text-blue-100">
                Controle, conferência e rastreabilidade dos bens da empresa.
              </p>
            </div>

            <button
              type="button"
              onClick={
                carregarPatrimonio
              }
              disabled={loading}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#08a89d] px-5 py-3 text-sm font-bold shadow-lg transition hover:bg-[#07978e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  loading
                    ? "animate-spin"
                    : ""
                }
              />

              Atualizar
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Kpi
              icon={
                <WalletCards
                  size={22}
                />
              }
              title="Valor patrimonial"
              value={money(totalValor)}
              trend="Patrimônio cadastrado"
              color="green"
            />

            <Kpi
              icon={
                <Package size={22} />
              }
              title="Bens cadastrados"
              value={String(
                totalBens
              )}
              trend={`${totalAuditados} auditados`}
              color="blue"
            />

            <Kpi
              icon={
                <ClipboardCheck
                  size={22}
                />
              }
              title="Auditorias pendentes"
              value={String(
                totalPendentes
              )}
              trend="Precisam de conferência"
              color="yellow"
            />

            <Kpi
              icon={
                <AlertTriangle
                  size={22}
                />
              }
              title="Divergências"
              value={String(
                totalDivergencias
              )}
              trend="Itens para verificar"
              color="red"
            />

            <Kpi
              icon={
                <CalendarDays
                  size={22}
                />
              }
              title="Aluguéis"
              value={String(
                totalAlugueis
              )}
              trend={money(
                valorTotalAlugueis
              )}
              color="orange"
            />
          </div>
        </div>
      </header>

      <section className="mx-auto space-y-5">
        {erro && (
          <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 md:flex-row md:items-center">
            <AlertTriangle
              size={20}
              className="shrink-0"
            />

            <div>
              <strong>Erro:</strong>{" "}
              {erro}
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-[#dce5ee] bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="font-bold text-[#073b70]">
                  Inventário patrimonial
                </h2>

                <p className="text-sm text-slate-500">
                  Patrimônios registrados no MySQL.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/diretor/auditoria/patrimonio"
                  )
                }
                className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#08a89d] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#07978e]"
              >
                <Plus size={16} />
                Adicionar Patrimônio
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2 lg:grid-cols-[1fr_180px_200px_auto]">
              <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 focus-within:border-[#073b70]">
                <Search
                  size={17}
                  className="shrink-0 text-slate-400"
                />

                <input
                  type="search"
                  value={busca}
                  onChange={(event) =>
                    setBusca(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {
                    if (
                      event.key === "Enter"
                    ) {
                      carregarPatrimonio();
                    }
                  }}
                  placeholder="Buscar código, patrimônio, bem, responsável..."
                  className="w-full bg-transparent py-2.5 text-sm outline-none"
                />
              </div>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value
                  )
                }
                className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
              >
                <option value="Todos">
                  Todos os status
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

                <option value="Auditado">
                  Auditado
                </option>

                <option value="Divergência">
                  Divergência
                </option>
              </select>

              <select
                value={categoria}
                onChange={(event) =>
                  setCategoria(
                    event.target.value
                  )
                }
                className="cursor-pointer rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none"
              >
                <option value="Todas">
                  Todas as categorias
                </option>

                {categorias.map(
                  (item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  )
                )}
              </select>

              <button
                type="button"
                onClick={
                  carregarPatrimonio
                }
                disabled={loading}
                className="rounded-2xl bg-[#073b70] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#052e59] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Filtrar
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold">
              <span className="text-slate-500">
                Legenda:
              </span>

              <Legenda
                label="Pendente"
                color="yellow"
              />

              <Legenda
                label="Compra"
                color="green"
              />

              <Legenda
                label="Aluguel"
                color="orange"
              />

              <Legenda
                label="Auditado"
                color="blue"
              />

              <Legenda
                label="Divergência"
                color="red"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1400px] text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">
                    Patrimônio
                  </th>

                  <th className="px-4 py-3">
                    Item
                  </th>

                  <th className="px-4 py-3">
                    Categoria
                  </th>

                  <th className="px-4 py-3">
                    Local / responsável
                  </th>

                  <th className="px-4 py-3">
                    Valor
                  </th>

                  <th className="px-4 py-3">
                    Data
                  </th>

                  <th className="px-4 py-3">
                    Status
                  </th>

                  <th className="px-4 py-3 text-right">
                    Ações
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-14 text-center"
                    >
                      <RefreshCw
                        size={30}
                        className="mx-auto animate-spin text-[#16b989]"
                      />

                      <p className="mt-3 text-sm text-slate-500">
                        Carregando patrimônio...
                      </p>
                    </td>
                  </tr>
                ) : patrimonios.length >
                  0 ? (
                  patrimonios.map(
                    (item) => (
                      <tr
                        key={item.id}
                        className="transition hover:bg-slate-50"
                      >
                        <td className="px-5 py-4">
                          <div className="font-bold text-[#073b70]">
                            {item.codigo ||
                              "-"}
                          </div>

                          <div className="mt-1 text-xs font-semibold text-slate-600">
                            Nº{" "}
                            {item.n_patrimonio ||
                              "-"}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="font-semibold text-slate-700">
                            {item.nomeitem ||
                              "-"}
                          </div>

                          <div className="mt-0.5 max-w-[280px] text-xs text-slate-500">
                            {item.descricao ||
                              "-"}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <CategoriaBadge
                            categoria={
                              item.categoria
                            }
                          />
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <MapPin
                              size={14}
                              className="shrink-0 text-slate-400"
                            />

                            <span>
                              {item.localizacao ||
                                "-"}
                            </span>
                          </div>

                          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <UserRound
                              size={13}
                            />

                            <span>
                              {item.responsavel ||
                                "-"}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 font-semibold text-[#073b70]">
                          {money(
                            item.valor_aquisicao
                          )}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {formatDate(
                            item.datacompra
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <Status
                            status={
                              item.status
                            }
                          />
                        </td>

                        <td className="px-4 py-4 text-right">
                          {item.status ===
                          "Pendente" ? (
                            <button
                              type="button"
                              onClick={() =>
                                abrirEdicao(
                                  item
                                )
                              }
                              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#073b70] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#052e59]"
                            >
                              <Pencil
                                size={14}
                              />
                              Editar
                            </button>
                          ) : (
                            <span className="inline-flex items-center rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-400">
                              Somente leitura
                            </span>
                          )}
                        </td>
                      </tr>
                    )
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-14 text-center"
                    >
                      <Package
                        size={40}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-3 font-semibold text-slate-600">
                        Nenhum patrimônio encontrado
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Tente alterar os filtros de pesquisa.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-orange-200 bg-white shadow-sm">
          <div className="border-b border-orange-100 bg-orange-50/60 p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-orange-100 p-3 text-orange-600">
                  <CalendarDays
                    size={22}
                  />
                </div>

                <div>
                  <h2 className="font-bold text-[#073b70]">
                    Controle de Aluguéis
                  </h2>

                  <p className="text-sm text-slate-500">
                    Relação exclusiva dos patrimônios e equipamentos alugados.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-orange-700 shadow-sm ring-1 ring-orange-200">
                  {totalAlugueis}{" "}
                  {totalAlugueis === 1
                    ? "aluguel"
                    : "aluguéis"}
                </span>

                <span className="rounded-xl bg-white px-3 py-2 text-xs font-bold text-[#073b70] shadow-sm ring-1 ring-slate-200">
                  Total:{" "}
                  {money(
                    valorTotalAlugueis
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1450px] text-left text-sm">
              <thead className="bg-orange-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-5 py-3">
                    Patrimônio
                  </th>

                  <th className="px-4 py-3">
                    Equipamento
                  </th>

                  <th className="px-4 py-3">
                    Categoria
                  </th>

                  <th className="px-4 py-3">
                    Localização
                  </th>

                  <th className="px-4 py-3">
                    Responsável
                  </th>

                  <th className="px-4 py-3">
                    Valor
                  </th>

                  <th className="px-4 py-3">
                    Data
                  </th>

                  <th className="px-4 py-3">
                    Documentos
                  </th>

                  <th className="px-4 py-3">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-14 text-center"
                    >
                      <RefreshCw
                        size={30}
                        className="mx-auto animate-spin text-orange-500"
                      />

                      <p className="mt-3 text-sm text-slate-500">
                        Carregando aluguéis...
                      </p>
                    </td>
                  </tr>
                ) : alugueis.length >
                  0 ? (
                  alugueis.map(
                    (item) => {
                      const nfeUrl =
                        urlArquivoS3(
                          item.nfe
                        );

                      const comprovanteUrl =
                        urlArquivoS3(
                          item.comprovantepagamento
                        );

                      return (
                        <tr
                          key={`aluguel-${item.id}`}
                          className="transition hover:bg-orange-50/40"
                        >
                          <td className="px-5 py-4">
                            <div className="font-bold text-[#073b70]">
                              {item.codigo ||
                                "-"}
                            </div>

                            <div className="mt-1 text-xs font-semibold text-slate-500">
                              Nº{" "}
                              {item.n_patrimonio ||
                                "-"}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="font-bold text-slate-700">
                              {item.nomeitem ||
                                "-"}
                            </div>

                            {item.descricao && (
                              <div className="mt-1 max-w-[260px] text-xs text-slate-500">
                                {item.descricao}
                              </div>
                            )}
                          </td>

                          <td className="px-4 py-4">
                            <span className="inline-flex items-center rounded-xl border border-orange-200 bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-700">
                              Aluguel
                            </span>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <MapPin
                                size={14}
                                className="text-orange-500"
                              />

                              <span>
                                {item.localizacao ||
                                  "-"}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <UserRound
                                size={14}
                                className="text-slate-400"
                              />

                              <span>
                                {item.responsavel ||
                                  "-"}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <span className="font-extrabold text-orange-700">
                              {money(
                                item.valor_aquisicao
                              )}
                            </span>
                          </td>

                          <td className="px-4 py-4 text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <CalendarDays
                                size={14}
                                className="text-orange-500"
                              />

                              {formatDate(
                                item.datacompra
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <div className="flex flex-wrap gap-2">
                              {nfeUrl && (
                                <a
                                  href={
                                    nfeUrl
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 px-3 py-2 text-xs font-bold text-blue-700 transition hover:bg-blue-100"
                                >
                                  <FileText
                                    size={14}
                                  />

                                  NFe

                                  <ExternalLink
                                    size={12}
                                  />
                                </a>
                              )}

                              {comprovanteUrl && (
                                <a
                                  href={
                                    comprovanteUrl
                                  }
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100"
                                >
                                  <FileSearch
                                    size={14}
                                  />

                                  Comprovante

                                  <ExternalLink
                                    size={12}
                                  />
                                </a>
                              )}

                              {!nfeUrl &&
                                !comprovanteUrl && (
                                  <span className="inline-flex items-center rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-400">
                                    Sem documentos
                                  </span>
                                )}
                            </div>
                          </td>

                          <td className="px-4 py-4">
                            <Status
                              status={
                                item.status
                              }
                            />
                          </td>
                        </tr>
                      );
                    }
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-16 text-center"
                    >
                      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-300">
                        <CalendarDays
                          size={32}
                        />
                      </div>

                      <p className="mt-4 font-bold text-slate-600">
                        Nenhum aluguel encontrado
                      </p>

                      <p className="mx-auto mt-1 max-w-md text-sm text-slate-400">
                        Os patrimônios cuja categoria ou status seja "Aluguel" aparecerão automaticamente nesta tabela.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#dce5ee] bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 py-5 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-blue-100 p-3 text-blue-600">
                <FileSearch
                  size={22}
                />
              </div>

              <div>
                <h2 className="font-bold text-[#073b70]">
                  Status da auditoria
                </h2>

                <p className="text-sm text-slate-500">
                  Visão geral da conferência patrimonial.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
            <AuditCard
              icon={
                <BadgeCheck
                  size={21}
                />
              }
              title="Bens auditados"
              value={totalAuditados}
              caption={`${percentual}% do patrimônio`}
              color="blue"
            />

            <AuditCard
              icon={
                <CalendarDays
                  size={21}
                />
              }
              title="Pendentes"
              value={totalPendentes}
              caption="Aguardando conferência física"
              color="yellow"
            />

            <AuditCard
              icon={
                <AlertTriangle
                  size={21}
                />
              }
              title="Divergências"
              value={totalDivergencias}
              caption="Necessitam tratamento"
              color="red"
            />
          </div>

          <div className="px-5 pb-5">
            <div className="mb-2 flex justify-between text-sm">
              <span className="font-semibold text-[#073b70]">
                Progresso da auditoria
              </span>

              <b className="text-[#073b70]">
                {percentual}%
              </b>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
              <div
                className="h-full rounded-full bg-[#16b989] transition-all duration-500"
                style={{
                  width: `${percentual}%`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          <ResumoCard
            title="Patrimônio auditado"
            value={`${percentual}%`}
            description={`${totalAuditados} de ${totalBens} bens`}
            color="blue"
          />

          <ResumoCard
            title="Pendente"
            value={String(
              totalPendentes
            )}
            description="Aguardando conferência"
            color="yellow"
          />

          <ResumoCard
            title="Compra"
            value={String(
              totalCompras
            )}
            description="Bens adquiridos"
            color="green"
          />

          <ResumoCard
            title="Aluguel"
            value={String(
              totalAlugueis
            )}
            description={money(
              valorTotalAlugueis
            )}
            color="orange"
          />

          <ResumoCard
            title="Divergências"
            value={String(
              totalDivergencias
            )}
            description="Itens que precisam de análise"
            color="red"
          />
        </div>

        <div className="overflow-hidden rounded-2xl border border-[#dce5ee] bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600">
                <ShieldCheck
                  size={21}
                />
              </div>

              <div>
                <h2 className="font-bold text-[#073b70]">
                  Trilha de auditoria
                </h2>

                <p className="text-xs text-slate-500">
                  Informações recentes do patrimônio
                </p>
              </div>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {patrimonios
              .slice(0, 5)
              .map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-slate-100 p-2.5 text-[#073b70]">
                      <Package
                        size={17}
                      />
                    </div>

                    <div>
                      <div className="font-semibold text-[#073b70]">
                        {item.codigo} —{" "}
                        {item.nomeitem}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        Nº{" "}
                        {item.n_patrimonio} •{" "}
                        {item.localizacao} •{" "}
                        {item.responsavel ||
                          "-"}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <CategoriaBadge
                      categoria={
                        item.categoria
                      }
                    />

                    <Status
                      status={
                        item.status
                      }
                    />

                    {item.status ===
                      "Pendente" && (
                      <button
                        type="button"
                        onClick={() =>
                          abrirEdicao(
                            item
                          )
                        }
                        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#073b70] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#052e59]"
                      >
                        <Pencil
                          size={13}
                        />
                        Editar
                      </button>
                    )}
                  </div>
                </div>
              ))}

            {!loading &&
              patrimonios.length ===
                0 && (
                <div className="p-8 text-center text-sm text-slate-400">
                  Nenhuma movimentação encontrada.
                </div>
              )}
          </div>
        </div>
      </section>

      {modalAberto &&
        patrimonioEditando &&
        patrimonioEditando.status ===
          "Pendente" && (
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
            onMouseDown={(event) => {
              if (
                event.target ===
                event.currentTarget
              ) {
                fecharModal();
              }
            }}
          >
            <div
              className="my-auto flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
              onMouseDown={(event) =>
                event.stopPropagation()
              }
            >
              <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6 sm:py-5">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="hidden shrink-0 rounded-2xl bg-blue-100 p-3 text-[#073b70] sm:block">
                    <Pencil
                      size={21}
                    />
                  </div>

                  <div className="min-w-0">
                    <h2 className="text-base font-extrabold text-[#073b70] sm:text-lg">
                      Editar patrimônio
                    </h2>

                    <p className="truncate text-xs text-slate-500 sm:text-sm">
                      Patrimônio Nº{" "}
                      <strong>
                        {
                          patrimonioEditando.n_patrimonio
                        }
                      </strong>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={
                    fecharModal
                  }
                  disabled={salvando}
                  className="shrink-0 cursor-pointer rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <X size={21} />
                </button>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6">
                {erroModal && (
                  <div className="mb-5 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    <AlertTriangle
                      size={19}
                      className="mt-0.5 shrink-0"
                    />

                    <div>
                      <strong>
                        Erro:
                      </strong>{" "}
                      {erroModal}
                    </div>
                  </div>
                )}

                {sucessoModal && (
                  <div className="mb-5 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
                    <BadgeCheck
                      size={19}
                    />

                    {sucessoModal}
                  </div>
                )}

                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Status
                    </label>

                    <select
                      value={
                        form.status
                      }
                      onChange={(event) =>
                        alterarCampo(
                          "status",
                          event.target
                            .value as StatusPatrimonio
                        )
                      }
                      disabled={salvando}
                      className="w-full cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#073b70] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    >
                      <option value="Pendente">
                        Pendente
                      </option>

                      <option value="Compra">
                        Compra
                      </option>

                      <option value="Aluguel">
                        Aluguel
                      </option>

                      <option value="Auditado">
                        Auditado
                      </option>

                      <option value="Divergência">
                        Divergência
                      </option>
                    </select>
                  </div>

                  <Campo
                    label="Localização"
                    value={
                      form.localizacao
                    }
                    onChange={(value) =>
                      alterarCampo(
                        "localizacao",
                        value
                      )
                    }
                    disabled={salvando}
                  />

                  <Campo
                    label="Responsável"
                    value={
                      form.responsavel
                    }
                    onChange={(value) =>
                      alterarCampo(
                        "responsavel",
                        value
                      )
                    }
                    disabled={salvando}
                  />

                  <Campo
                    label="Valor de aquisição"
                    value={
                      form.valor_aquisicao
                        ? `R$ ${form.valor_aquisicao}`
                        : ""
                    }
                    inputMode="decimal"
                    onChange={(value) => {
                      const valor =
                        value.replace(
                          /^R\$\s?/i,
                          ""
                        );

                      alterarCampo(
                        "valor_aquisicao",
                        formatMoneyInput(
                          valor
                        )
                      );
                    }}
                    disabled={salvando}
                  />

                  <Campo
                    label="Data da compra"
                    type="date"
                    value={
                      form.datacompra
                    }
                    onChange={(value) =>
                      alterarCampo(
                        "datacompra",
                        value
                      )
                    }
                    disabled={salvando}
                  />

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-700">
                      Descrição
                    </label>

                    <textarea
                      value={
                        form.descricao
                      }
                      onChange={(event) =>
                        alterarCampo(
                          "descricao",
                          event.target.value
                        )
                      }
                      rows={3}
                      disabled={salvando}
                      className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#073b70] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                      placeholder="Descrição do patrimônio..."
                    />
                  </div>

                  <ArquivoCampo
                    label="NFe"
                    arquivoAtual={
                      patrimonioEditando.nfe
                    }
                    novoArquivo={
                      novoNfe
                    }
                    removido={
                      removerNfe
                    }
                    disabled={
                      salvando
                    }
                    onArquivo={(file) => {
                      setNovoNfe(file);
                      setRemoverNfe(
                        false
                      );
                    }}
                    onRemover={() => {
                      setNovoNfe(null);
                      setRemoverNfe(
                        true
                      );
                    }}
                  />

                  <ArquivoCampo
                    label="Comprovante de pagamento"
                    arquivoAtual={
                      patrimonioEditando.comprovantepagamento
                    }
                    novoArquivo={
                      novoComprovante
                    }
                    removido={
                      removerComprovante
                    }
                    disabled={
                      salvando
                    }
                    onArquivo={(file) => {
                      setNovoComprovante(
                        file
                      );
                      setRemoverComprovante(
                        false
                      );
                    }}
                    onRemover={() => {
                      setNovoComprovante(
                        null
                      );
                      setRemoverComprovante(
                        true
                      );
                    }}
                  />

                  <div className="md:col-span-2">
                    <label className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-700">
                      <AlertTriangle
                        size={16}
                        className="text-slate-400"
                      />

                      Observação / motivo da divergência
                    </label>

                    <textarea
                      value={
                        form.observacao
                      }
                      onChange={(event) =>
                        alterarCampo(
                          "observacao",
                          event.target.value
                        )
                      }
                      rows={4}
                      disabled={salvando}
                      className="w-full resize-none rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-[#073b70] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                      placeholder="Informe o que foi encontrado na conferência física..."
                    />
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                <button
                  type="button"
                  onClick={
                    fecharModal
                  }
                  disabled={salvando}
                  className="cursor-pointer rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  onClick={
                    salvarEdicao
                  }
                  disabled={salvando}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-[#08a89d] px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#07978e] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {salvando ? (
                    <>
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />

                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save size={17} />
                      Salvar alterações
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
    </main>
  );
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  inputMode,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
  type?: string;
  inputMode?:
    | "none"
    | "text"
    | "decimal"
    | "numeric"
    | "tel"
    | "search"
    | "email"
    | "url";
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <input
        type={type}
        value={value}
        inputMode={inputMode}
        disabled={disabled}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-[#073b70] focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
      />
    </div>
  );
}

function ArquivoCampo({
  label,
  arquivoAtual,
  novoArquivo,
  removido,
  disabled = false,
  onArquivo,
  onRemover,
}: {
  label: string;
  arquivoAtual?:
    | string
    | null;
  novoArquivo: File | null;
  removido: boolean;
  disabled?: boolean;
  onArquivo: (
    file: File
  ) => void;
  onRemover: () => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-bold text-slate-700">
        {label}
      </label>

      <div className="rounded-2xl border border-slate-200 bg-white p-3">
        {arquivoAtual &&
          !removido &&
          !novoArquivo && (
            <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-700">
                  {arquivoAtual}
                </p>

                <p className="text-xs text-slate-400">
                  Arquivo atual
                </p>
              </div>

              <button
                type="button"
                onClick={
                  onRemover
                }
                disabled={disabled}
                className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Excluir
              </button>
            </div>
          )}

        {novoArquivo && (
          <div className="mb-3 flex items-center justify-between gap-3 rounded-xl bg-emerald-50 px-3 py-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-emerald-700">
                {novoArquivo.name}
              </p>

              <p className="text-xs text-emerald-600">
                Novo arquivo selecionado
              </p>
            </div>

            <button
              type="button"
              onClick={
                onRemover
              }
              disabled={disabled}
              className="shrink-0 rounded-lg bg-red-50 px-3 py-2 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Remover
            </button>
          </div>
        )}

        {removido &&
          !novoArquivo && (
            <div className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
              Arquivo será excluído ao salvar.
            </div>
          )}

        <label
          className={`flex items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 transition ${
            disabled
              ? "cursor-not-allowed opacity-50"
              : "cursor-pointer hover:border-[#073b70] hover:bg-blue-50 hover:text-[#073b70]"
          }`}
        >
          <span>
            {novoArquivo
              ? "Trocar arquivo"
              : arquivoAtual &&
                  !removido
                ? "Substituir arquivo"
                : "Selecionar arquivo"}
          </span>

          <input
            type="file"
            accept=".pdf,application/pdf"
            disabled={disabled}
            className="hidden"
            onChange={(event) => {
              const file =
                event.target.files?.[0];

              if (!file) {
                return;
              }

              const ehPdf =
                file.type ===
                  "application/pdf" ||
                file.name
                  .toLowerCase()
                  .endsWith(".pdf");

              if (!ehPdf) {
                alert(
                  "Selecione somente um arquivo PDF."
                );

                event.target.value = "";
                return;
              }

              onArquivo(file);
              event.target.value = "";
            }}
          />
        </label>

        <p className="mt-2 text-xs text-slate-400">
          PDF. O arquivo atual será substituído somente ao salvar.
        </p>
      </div>
    </div>
  );
}

function Kpi({
  icon,
  title,
  value,
  trend,
  color,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  trend: string;
  color: Cor;
}) {
  const colors: Record<
    Cor,
    {
      bg: string;
      icon: string;
      trend: string;
    }
  > = {
    blue: {
      bg: "bg-blue-100",
      icon: "text-blue-600",
      trend: "text-blue-600",
    },
    yellow: {
      bg: "bg-yellow-100",
      icon: "text-yellow-600",
      trend: "text-yellow-600",
    },
    green: {
      bg: "bg-green-100",
      icon: "text-green-600",
      trend: "text-green-600",
    },
    orange: {
      bg: "bg-orange-100",
      icon: "text-orange-600",
      trend: "text-orange-600",
    },
    red: {
      bg: "bg-red-100",
      icon: "text-red-600",
      trend: "text-red-600",
    },
  };

  return (
    <div className="rounded-2xl bg-white p-4 text-[#073b70] shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">
          {title}
        </span>

        <span
          className={`rounded-2xl p-2 ${colors[color].bg} ${colors[color].icon}`}
        >
          {icon}
        </span>
      </div>

      <div className="mt-2 text-[25px] font-extrabold">
        {value}
      </div>

      <div
        className={`mt-1 text-xs font-semibold ${colors[color].trend}`}
      >
        ↗ {trend}
      </div>
    </div>
  );
}

function AuditCard({
  icon,
  title,
  value,
  caption,
  color,
}: {
  icon: ReactNode;
  title: string;
  value: number;
  caption: string;
  color: Cor;
}) {
  const colors: Record<
    Cor,
    {
      icon: string;
      value: string;
    }
  > = {
    blue: {
      icon: "text-blue-600",
      value: "text-blue-700",
    },
    yellow: {
      icon: "text-yellow-600",
      value: "text-yellow-700",
    },
    green: {
      icon: "text-green-600",
      value: "text-green-700",
    },
    orange: {
      icon: "text-orange-600",
      value: "text-orange-700",
    },
    red: {
      icon: "text-red-600",
      value: "text-red-700",
    },
  };

  return (
    <div className="rounded-2xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span
          className={
            colors[color].icon
          }
        >
          {icon}
        </span>

        {title}
      </div>

      <div
        className={`mt-2 text-2xl font-extrabold ${colors[color].value}`}
      >
        {value}
      </div>

      <div className="text-xs text-slate-500">
        {caption}
      </div>
    </div>
  );
}

function Status({
  status,
}: {
  status: StatusPatrimonio;
}) {
  const styles: Record<
    StatusPatrimonio,
    string
  > = {
    Pendente:
      "bg-yellow-50 text-yellow-700 border-yellow-200",
    Compra:
      "bg-green-50 text-green-700 border-green-200",
    Aluguel:
      "bg-orange-50 text-orange-700 border-orange-200",
    Auditado:
      "bg-blue-50 text-blue-700 border-blue-200",
    Divergência:
      "bg-red-50 text-red-700 border-red-200",
  };

  return (
    <span
      className={`inline-flex rounded-2xl border px-2.5 py-1 text-xs font-bold ${
        styles[status] ||
        styles.Pendente
      }`}
    >
      {status || "Pendente"}
    </span>
  );
}

function CategoriaBadge({
  categoria,
}: {
  categoria:
    | string
    | null
    | undefined;
}) {
  const categoriaNormalizada =
    categoria
      ?.trim()
      .toLowerCase();

  let classes =
    "bg-slate-100 text-slate-600 border-slate-200";

  if (
    categoriaNormalizada ===
    "compra"
  ) {
    classes =
      "bg-green-50 text-green-700 border-green-200";
  }

  if (
    categoriaNormalizada ===
    "aluguel"
  ) {
    classes =
      "bg-orange-50 text-orange-700 border-orange-200";
  }

  return (
    <span
      className={`inline-flex rounded-2xl border px-2.5 py-1 text-xs font-bold ${classes}`}
    >
      {categoria || "-"}
    </span>
  );
}

function Legenda({
  label,
  color,
}: {
  label: string;
  color: Cor;
}) {
  const colors: Record<
    Cor,
    string
  > = {
    yellow: "bg-yellow-400",
    green: "bg-green-500",
    orange: "bg-orange-500",
    blue: "bg-blue-500",
    red: "bg-red-500",
  };

  return (
    <span className="flex items-center gap-1.5 text-slate-600">
      <span
        className={`h-2.5 w-2.5 rounded-full ${colors[color]}`}
      />

      {label}
    </span>
  );
}

function ResumoCard({
  title,
  value,
  description,
  color,
}: {
  title: string;
  value: string;
  description: string;
  color: Cor;
}) {
  const colors: Record<
    Cor,
    {
      value: string;
      line: string;
    }
  > = {
    blue: {
      value: "text-blue-700",
      line: "bg-blue-500",
    },
    yellow: {
      value: "text-yellow-700",
      line: "bg-yellow-400",
    },
    green: {
      value: "text-green-700",
      line: "bg-green-500",
    },
    orange: {
      value: "text-orange-700",
      line: "bg-orange-500",
    },
    red: {
      value: "text-red-700",
      line: "bg-red-500",
    },
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">
        {title}
      </div>

      <div
        className={`mt-1 text-3xl font-extrabold ${colors[color].value}`}
      >
        {value}
      </div>

      <div className="mt-1 text-xs text-slate-500">
        {description}
      </div>

      <div
        className={`mt-4 h-1 w-12 rounded-full ${colors[color].line}`}
      />
    </div>
  );
}