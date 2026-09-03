"use client";

import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  BadgeCheck,
  CalendarDays,
  ClipboardCheck,
  FileSearch,
  MapPin,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  UserRound,
  WalletCards,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";

/* =========================================================
   TIPOS
========================================================= */

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
  status: "Auditado" | "Pendente" | "Divergência";
  datacompra: string | null;
  observacao: string | null;
  created_at?: string;
  updated_at?: string;
};

type ApiResponse = {
  success: boolean;
  data: Patrimonio[];
  error?: string;
};

/* =========================================================
   FUNÇÕES AUXILIARES
========================================================= */

function money(
  value: number | string | null | undefined
) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(date: string | null) {
  if (!date) return "-";

  const somenteData = date.substring(0, 10);

  if (/^\d{4}-\d{2}-\d{2}$/.test(somenteData)) {
    const [ano, mes, dia] = somenteData.split("-");

    return `${dia}/${mes}/${ano}`;
  }

  const parsed = new Date(`${somenteData}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return "-";
  }

  return parsed.toLocaleDateString("pt-BR");
}

/* =========================================================
   PÁGINA
========================================================= */

export default function Page() {
  const router = useRouter();

  const [patrimonios, setPatrimonios] = useState<Patrimonio[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");
  const [busca, setBusca] = useState("");
  const [status, setStatus] = useState("Todos");
  const [categoria, setCategoria] = useState("Todas");

  /* =========================================================
     CARREGAR PATRIMÔNIO
  ========================================================= */

  async function carregarPatrimonio() {
    try {
      setLoading(true);
      setErro("");

      const params = new URLSearchParams();

      if (busca.trim()) {
        params.set("busca", busca.trim());
      }

      if (status !== "Todos") {
        params.set("status", status);
      }

      if (categoria !== "Todas") {
        params.set("categoria", categoria);
      }

      const query = params.toString();

      const response = await fetch(
        query
          ? `/api/auditorio?${query}`
          : "/api/auditorio",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const result: ApiResponse = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(
          result.error ||
            "Erro ao carregar patrimônio."
        );
      }

      setPatrimonios(result.data || []);
    } catch (error) {
      console.error(
        "Erro ao carregar patrimônio:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao carregar patrimônio."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     CARREGAMENTO INICIAL
  ========================================================= */

  useEffect(() => {
    carregarPatrimonio();
  }, []);

  /* =========================================================
     CATEGORIAS
  ========================================================= */

  const categorias = useMemo(() => {
    return Array.from(
      new Set(
        patrimonios
          .map((item) => item.categoria)
          .filter(Boolean)
      )
    ).sort();
  }, [patrimonios]);

  /* =========================================================
     TOTAIS
  ========================================================= */

  const totalBens = patrimonios.length;

  const totalValor = patrimonios.reduce(
    (total, item) =>
      total + Number(item.valor_aquisicao || 0),
    0
  );

  const totalAuditados = patrimonios.filter(
    (item) => item.status === "Auditado"
  ).length;

  const totalPendentes = patrimonios.filter(
    (item) => item.status === "Pendente"
  ).length;

  const totalDivergencias = patrimonios.filter(
    (item) => item.status === "Divergência"
  ).length;

  const percentual =
    totalBens > 0
      ? Math.round(
          (totalAuditados / totalBens) * 100
        )
      : 0;

  /* =========================================================
     RENDER
  ========================================================= */

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
                Controle, conferência e
                rastreabilidade dos bens da
                empresa.
              </p>
            </div>

            <button
              type="button"
              onClick={carregarPatrimonio}
              disabled={loading}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#08a89d] px-5 py-3 text-sm font-bold shadow-lg transition hover:bg-[#07978e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw
                size={17}
                className={
                  loading ? "animate-spin" : ""
                }
              />

              Atualizar
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi
              icon={<WalletCards size={22} />}
              title="Valor patrimonial"
              value={money(totalValor)}
              trend="Patrimônio cadastrado"
            />

            <Kpi
              icon={<Package size={22} />}
              title="Bens cadastrados"
              value={String(totalBens)}
              trend={`${totalAuditados} auditados`}
            />

            <Kpi
              icon={<ClipboardCheck size={22} />}
              title="Auditorias pendentes"
              value={String(totalPendentes)}
              trend="Precisam de conferência"
            />

            <Kpi
              icon={<AlertTriangle size={22} />}
              title="Divergências"
              value={String(totalDivergencias)}
              trend="Itens para verificar"
            />
          </div>
        </div>
      </header>

      <section className="mx-auto space-y-5">
        {erro && (
          <div className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 md:flex-row md:items-center">
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

        {/* =====================================================
            INVENTÁRIO
        ===================================================== */}

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
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#08a89d] px-5 py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#07978e]"
              >
                <Plus size={16} />
                Adicionar Patrimônio
              </button>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-2 lg:grid-cols-[1fr_180px_200px_auto]">
              <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 focus-within:border-[#073b70]">
                <Search
                  size={17}
                  className="shrink-0 text-slate-400"
                />

                <input
                  value={busca}
                  onChange={(event) =>
                    setBusca(event.target.value)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      carregarPatrimonio();
                    }
                  }}
                  placeholder="Buscar código, patrimônio, bem, responsável..."
                  className="w-full py-2.5 text-sm outline-none"
                />
              </div>

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#073b70]"
              >
                <option value="Todos">
                  Todos os status
                </option>

                <option value="Auditado">
                  Auditado
                </option>

                <option value="Pendente">
                  Pendente
                </option>

                <option value="Divergência">
                  Divergência
                </option>
              </select>

              <select
                value={categoria}
                onChange={(event) =>
                  setCategoria(event.target.value)
                }
                className="cursor-pointer rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#073b70]"
              >
                <option value="Todas">
                  Todas as categorias
                </option>

                {categorias.map((item) => (
                  <option
                    key={item}
                    value={item}
                  >
                    {item}
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={carregarPatrimonio}
                className="rounded-lg bg-[#073b70] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#052e59]"
              >
                Filtrar
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1250px] text-left text-sm">
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
                    Data da compra
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
                      colSpan={7}
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
                ) : (
                  patrimonios.map((item) => (
                    <tr
                      key={item.id}
                      className="transition hover:bg-slate-50"
                    >
                      <td className="px-5 py-4">
                        <div className="font-bold text-[#073b70]">
                          {item.codigo}
                        </div>

                        <div className="mt-1 text-xs font-semibold text-slate-600">
                          Nº {item.n_patrimonio}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-700">
                          {item.nomeitem}
                        </div>

                        <div className="mt-0.5 max-w-[280px] text-xs text-slate-500">
                          {item.descricao}
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span className="rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {item.categoria}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <MapPin
                            size={14}
                            className="text-slate-400"
                          />

                          {item.localizacao}
                        </div>

                        <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                          <UserRound size={13} />

                          {item.responsavel || "-"}
                        </div>
                      </td>

                      <td className="px-4 py-4 font-semibold text-[#073b70]">
                        {money(
                          item.valor_aquisicao
                        )}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {formatDate(item.datacompra)}
                      </td>

                      <td className="px-4 py-4">
                        <Status
                          status={item.status}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {!loading &&
              patrimonios.length === 0 && (
                <div className="p-14 text-center">
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
                </div>
              )}
          </div>
        </div>

        {/* =====================================================
            STATUS DA AUDITORIA
        ===================================================== */}

        <div className="overflow-hidden rounded-2xl border border-[#dce5ee] bg-white shadow-sm">
          <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 py-5 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-100 p-3 text-blue-600">
                <FileSearch size={22} />
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
              icon={<BadgeCheck size={21} />}
              title="Bens auditados"
              value={totalAuditados}
              caption={`${percentual}% do patrimônio`}
            />

            <AuditCard
              icon={<CalendarDays size={21} />}
              title="Pendentes"
              value={totalPendentes}
              caption="Aguardando conferência física"
            />

            <AuditCard
              icon={<AlertTriangle size={21} />}
              title="Divergências"
              value={totalDivergencias}
              caption="Necessitam tratamento"
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

        {/* =====================================================
            RESUMO
        ===================================================== */}

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <ResumoCard
            title="Patrimônio auditado"
            value={`${percentual}%`}
            description={`${totalAuditados} de ${totalBens} bens`}
          />

          <ResumoCard
            title="Pendente"
            value={String(totalPendentes)}
            description="Aguardando conferência"
          />

          <ResumoCard
            title="Divergências"
            value={String(totalDivergencias)}
            description="Itens que precisam de análise"
          />
        </div>

        {/* =====================================================
            TRILHA DE AUDITORIA
        ===================================================== */}

        <div className="overflow-hidden rounded-2xl border border-[#dce5ee] bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-100 p-3 text-emerald-600">
                <ShieldCheck size={21} />
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
                    <div className="rounded-full bg-slate-100 p-2.5 text-[#073b70]">
                      <Package size={17} />
                    </div>

                    <div>
                      <div className="font-semibold text-[#073b70]">
                        {item.codigo} —{" "}
                        {item.nomeitem}
                      </div>

                      <div className="mt-1 text-xs text-slate-500">
                        Nº {item.n_patrimonio} •{" "}
                        {item.localizacao} •{" "}
                        {item.responsavel || "-"}
                      </div>
                    </div>
                  </div>

                  <Status
                    status={item.status}
                  />
                </div>
              ))}

            {!loading &&
              patrimonios.length === 0 && (
                <div className="p-8 text-center text-sm text-slate-400">
                  Nenhuma movimentação encontrada.
                </div>
              )}
          </div>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   KPI
========================================================= */

function Kpi({
  icon,
  title,
  value,
  trend,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="rounded-xl bg-white p-4 text-[#073b70] shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-500">
          {title}
        </span>

        <span className="rounded-xl bg-emerald-100 p-2 text-emerald-600">
          {icon}
        </span>
      </div>

      <div className="mt-2 text-[25px] font-extrabold">
        {value}
      </div>

      <div className="mt-1 text-xs font-semibold text-emerald-600">
        ↗ {trend}
      </div>
    </div>
  );
}

/* =========================================================
   AUDIT CARD
========================================================= */

function AuditCard({
  icon,
  title,
  value,
  caption,
}: {
  icon: ReactNode;
  title: string;
  value: number;
  caption: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <span className="text-blue-600">
          {icon}
        </span>

        {title}
      </div>

      <div className="mt-2 text-2xl font-extrabold text-[#073b70]">
        {value}
      </div>

      <div className="text-xs text-slate-500">
        {caption}
      </div>
    </div>
  );
}

/* =========================================================
   STATUS
========================================================= */

function Status({
  status,
}: {
  status:
    | "Auditado"
    | "Pendente"
    | "Divergência";
}) {
  const classes =
    status === "Auditado"
      ? "bg-emerald-50 text-emerald-700"
      : status === "Pendente"
        ? "bg-amber-50 text-amber-700"
        : "bg-red-50 text-red-700";

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${classes}`}
    >
      {status}
    </span>
  );
}

/* =========================================================
   RESUMO CARD
========================================================= */

function ResumoCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">
        {title}
      </div>

      <div className="mt-1 text-3xl font-extrabold text-[#073b70]">
        {value}
      </div>

      <div className="mt-1 text-xs text-slate-500">
        {description}
      </div>
    </div>
  );
}