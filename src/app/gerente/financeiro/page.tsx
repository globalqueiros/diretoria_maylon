"use client";
import { ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Banknote,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Landmark,
  LayoutDashboard,
  RefreshCw,
  Search,
  Send,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  XCircle,
  type LucideIcon,
} from "lucide-react";

/* ───────────── tipos ───────────── */

type Linha = Record<string, unknown>;
type Tom = "teal" | "emerald" | "rose" | "amber" | "slate";
type TipoColuna = "texto" | "moeda" | "data" | "status" | "pct";

type Coluna = {
  chave: string;
  rotulo: string;
  tipo?: TipoColuna;
  direita?: boolean;
};

type Indicador = {
  rotulo: string;
  valor: string;
  detalhe?: string;
  icone: LucideIcon;
  tom: Tom;
};

type SecaoId =
  | "visao"
  | "contas"
  | "folha"
  | "pagar"
  | "receber"
  | "aprovacoes"
  | "relatorios";

/* ───────────── constantes ───────────── */

const POR_PAGINA = 10;
const API = "/api/gerente/financeiro";

const FOCO =
  "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-500/30";

const TONS: Record<Tom, string> = {
  teal: "bg-teal-50 text-teal-700",
  emerald: "bg-emerald-50 text-emerald-700",
  rose: "bg-rose-50 text-rose-700",
  amber: "bg-amber-50 text-amber-700",
  slate: "bg-slate-100 text-slate-600",
};

const SECOES: { id: SecaoId; rotulo: string; descricao: string; icone: LucideIcon }[] = [
  { id: "visao", rotulo: "Visão geral", descricao: "Recebimentos, comissões e pendências da sua equipe.", icone: LayoutDashboard },
  { id: "folha", rotulo: "Folha da equipe", descricao: "Salários, comissões, benefícios e descontos dos colaboradores vinculados a você.", icone: Users },
  { id: "aprovacoes", rotulo: "Reembolsos", descricao: "Solicitações de reembolso dos motoristas da sua carteira.", icone: CheckCircle2 },
];

const STATUS_CLASSE: Record<string, { rotulo: string; classe: string }> = {
  pago: { rotulo: "Pago", classe: "bg-emerald-50 text-emerald-700" },
  recebido: { rotulo: "Recebido", classe: "bg-emerald-50 text-emerald-700" },
  aprovado: { rotulo: "Aprovado", classe: "bg-emerald-50 text-emerald-700" },
  conciliado: { rotulo: "Conciliado", classe: "bg-emerald-50 text-emerald-700" },
  pendente: { rotulo: "Pendente", classe: "bg-amber-50 text-amber-700" },
  programado: { rotulo: "Programado", classe: "bg-sky-50 text-sky-700" },
  encaminhado: { rotulo: "Encaminhado", classe: "bg-sky-50 text-sky-700" },
  vencido: { rotulo: "Vencido", classe: "bg-red-50 text-red-700" },
  rejeitado: { rotulo: "Rejeitado", classe: "bg-red-50 text-red-700" },
  cancelado: { rotulo: "Cancelado", classe: "bg-slate-100 text-slate-600" },
};

/* ───────────── utilitários ───────────── */

function semAcento(valor: unknown): string {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function paraNumero(valor: unknown): number {
  if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
  let texto = String(valor ?? "").trim();
  if (!texto) return 0;
  if (texto.includes(",")) texto = texto.replace(/\./g, "").replace(",", ".");
  const numero = Number(texto);
  return Number.isFinite(numero) ? numero : 0;
}

function moeda(valor: unknown): string {
  return paraNumero(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function paraData(valor: unknown): Date | null {
  if (!valor) return null;
  const texto = String(valor).trim();
  const data = /^\d{4}-\d{2}-\d{2}$/.test(texto) ? new Date(`${texto}T12:00:00`) : new Date(texto);
  return Number.isNaN(data.getTime()) ? null : data;
}

function dataBR(valor: unknown): string {
  const data = paraData(valor);
  return data ? data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }) : "—";
}

function soma(linhas: Linha[], campo: string, filtro?: (l: Linha) => boolean): number {
  return linhas.reduce((t, l) => (!filtro || filtro(l) ? t + paraNumero(l[campo]) : t), 0);
}

function statusDe(l: Linha, campo = "status"): string {
  return semAcento(l[campo]) || "pendente";
}

function ativo(l: Linha): boolean {
  const s = statusDe(l);
  return s !== "pago" && s !== "recebido" && s !== "conciliado" && s !== "cancelado";
}

function exibirCelula(l: Linha, c: Coluna): ReactNode {
  const v = l[c.chave];
  switch (c.tipo) {
    case "moeda":
      return moeda(v);
    case "data":
      return dataBR(v);
    case "pct":
      return `${paraNumero(v).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
    case "status": {
      const s = semAcento(v) || "pendente";
      const info = STATUS_CLASSE[s] ?? { rotulo: String(v ?? "—"), classe: "bg-slate-100 text-slate-600" };
      return (
        <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-semibold ${info.classe}`}>
          {info.rotulo}
        </span>
      );
    }
    default: {
      const t = String(v ?? "").trim();
      return t || "—";
    }
  }
}

function useApi(caminho: string) {
  const [dados, setDados] = useState<Linha | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const [erro, setErro] = useState("");

  const carregar = useCallback(
    async (manual = false) => {
      if (manual) setAtualizando(true);
      else setCarregando(true);
      setErro("");
      try {
        const response = await fetch(`${API}/${caminho}`, {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });
        const json: Linha = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(
            String(json.error ?? json.mensagem ?? "Não foi possível carregar os dados.")
          );
        }
        setDados(json);
      } catch (e) {
        setErro(e instanceof Error ? e.message : "Erro ao carregar os dados.");
      } finally {
        setCarregando(false);
        setAtualizando(false);
      }
    },
    [caminho]
  );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return { dados, carregando, atualizando, erro, carregar };
}

function lista(dados: Linha | null, chave: string): Linha[] {
  const v = dados?.[chave];
  return Array.isArray(v) ? (v as Linha[]) : [];
}

/* ───────────── blocos reutilizáveis ───────────── */

function Indicadores({ itens, carregando }: { itens: Indicador[]; carregando: boolean }) {
  return (
    <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {itens.map(({ rotulo, valor, detalhe, icone: Icone, tom }) => (
        <div
          key={rotulo}
          className="rounded-2xl border border-white/20 bg-white p-5 shadow-lg shadow-teal-950/10"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">{rotulo}</p>
            <div className={`rounded-xl p-2.5 ${TONS[tom]}`}>
              <Icone className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-0 text-2xl font-extrabold text-slate-900 sm:text-3xl">
            {carregando ? "—" : valor}
          </p>
          <p className="mt-1.5 text-xs text-slate-500">{carregando ? " " : detalhe ?? " "}</p>
        </div>
      ))}
    </section>
  );
}

function Cartao({
  titulo,
  subtitulo,
  icone: Icone,
  children,
}: {
  titulo: string;
  subtitulo?: string;
  icone: LucideIcon;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-teal-950/10">
      <div className="flex items-center gap-3 border-b border-slate-100 p-5 sm:p-6">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-700">
          <Icone className="h-6 w-6" />
        </div>
        <div>
          <h2 className="font-bold text-slate-900">{titulo}</h2>
          {subtitulo && <p className="text-xs text-slate-500">{subtitulo}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

function Carregando() {
  return (
    <div className="space-y-5 p-6" aria-busy="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex animate-pulse items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-48 rounded bg-slate-100" />
            <div className="h-3 w-32 rounded bg-slate-100" />
          </div>
          <div className="h-3 w-20 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function Erro({ mensagem, aoRepetir }: { mensagem: string; aoRepetir: () => void }) {
  return (
    <div role="alert" className="m-5 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
      <AlertCircle className="mx-auto mb-3 h-8 w-8 text-red-600" />
      <p className="text-sm font-medium text-red-700">{mensagem}</p>
      <button
        type="button"
        onClick={aoRepetir}
        className={`mt-3 cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-red-700 underline ${FOCO}`}
      >
        Tentar novamente
      </button>
    </div>
  );
}

function Vazio({ texto, detalhe }: { texto: string; detalhe: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center sm:py-20">
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl bg-teal-50 text-teal-700">
        <FileText className="h-9 w-9" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{texto}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{detalhe}</p>
    </div>
  );
}

const CAMPO =
  "rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10";

function Tabela({
  linhas,
  colunas,
  rotuloVazio,
  filtroStatus = false,
  centralizada = false,
  acoes,
}: {
  linhas: Linha[];
  colunas: Coluna[];
  rotuloVazio: string;
  filtroStatus?: boolean;
  centralizada?: boolean;
  acoes?: (l: Linha) => ReactNode;
}) {
  const [busca] = useState("");
  const [status, setStatus] = useState("todos");
  const [pagina, setPagina] = useState(1);

  const statusDisponiveis = useMemo(
    () => Array.from(new Set(linhas.map((l) => statusDe(l)))),
    [linhas]
  );

  const filtradas = useMemo(() => {
    const termo = semAcento(busca);
    return linhas.filter((l) => {
      if (status !== "todos" && statusDe(l) !== status) return false;
      if (!termo) return true;
      return colunas.some((c) => c.tipo !== "moeda" && semAcento(l[c.chave]).includes(termo));
    });
  }, [linhas, colunas, busca, status]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const inicio = (paginaAtual - 1) * POR_PAGINA;
  const visiveis = filtradas.slice(inicio, inicio + POR_PAGINA);

  return (
    <>
      {filtroStatus && (
        <div className="grid gap-3 border-b border-slate-100 p-5 md:grid-cols-[1fr_auto]">
          <label>
            <span className="sr-only">Situação</span>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPagina(1);
              }}
              className={`${CAMPO} w-full cursor-pointer`}
            >
              <option value="todos">Todas as situações</option>
              {statusDisponiveis.map((s) => (
                <option key={s} value={s}>
                  {STATUS_CLASSE[s]?.rotulo ?? s}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {filtradas.length === 0 ? (
        <Vazio
          texto={status !== "todos" ? "Nada encontrado" : rotuloVazio}
          detalhe={
            status !== "todos"
              ? "Altere o filtro para ver outros registros."
              : "Quando houver registros, eles aparecem aqui."
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  {colunas.map((c) => (
                    <th
                      key={c.chave}
                      scope="col"
                      className={`px-5 py-4 ${
                        centralizada ? "text-center" : c.direita ? "text-right" : ""
                      }`}
                    >
                      {c.rotulo}
                    </th>
                  ))}
                  {acoes && (
                    <th
                      scope="col"
                      className={`px-5 py-4 ${centralizada ? "text-center" : "text-right"}`}
                    >
                      Ações
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visiveis.map((l, i) => (
                  <tr key={String(l.id ?? i)} className="transition-colors hover:bg-slate-50/70">
                    {colunas.map((c, idx) => (
                      <td
                        key={c.chave}
                        className={`px-5 py-4 ${
                          idx === 0 ? "font-semibold text-slate-900" : "text-slate-700"
                        } ${c.direita ? "whitespace-nowrap font-semibold" : ""} ${
                          centralizada ? "text-center" : c.direita ? "text-right" : ""
                        }`}
                      >
                        {exibirCelula(l, c)}
                      </td>
                    ))}
                    {acoes && (
                      <td
                        className={`px-5 py-4 ${centralizada ? "text-center" : "text-right"}`}
                      >
                        {acoes(l)}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Mostrando <b className="text-slate-800">{inicio + 1}</b> até{" "}
              <b className="text-slate-800">{Math.min(inicio + POR_PAGINA, filtradas.length)}</b> de{" "}
              <b className="text-slate-800">{filtradas.length}</b> registros
            </p>
            <nav aria-label="Paginação" className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPagina(paginaAtual - 1)}
                disabled={paginaAtual <= 1}
                className={`inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${FOCO}`}
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <span className="whitespace-nowrap text-sm text-slate-600">
                Página <b className="text-slate-900">{paginaAtual}</b> de{" "}
                <b className="text-slate-900">{totalPaginas}</b>
              </span>
              <button
                type="button"
                onClick={() => setPagina(paginaAtual + 1)}
                disabled={paginaAtual >= totalPaginas}
                className={`inline-flex cursor-pointer items-center gap-1 rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 ${FOCO}`}
              >
                Próxima
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          </footer>
        </>
      )}
    </>
  );
}

/* Seção genérica: indicadores + tabela, alimentada por /api/financeiro/<caminho> */
function SecaoLista({
  caminho,
  chave,
  titulo,
  subtitulo,
  icone,
  colunas,
  indicadores,
  rotuloVazio,
  filtroStatus,
  centralizada,
  preparar,
  topo,
  acoes,
}: {
  caminho: string;
  chave: string;
  titulo: string;
  subtitulo: string;
  icone: LucideIcon;
  colunas: Coluna[];
  indicadores: (l: Linha[]) => Indicador[];
  rotuloVazio: string;
  filtroStatus?: boolean;
  centralizada?: boolean;
  preparar?: (l: Linha) => Linha;
  topo?: (l: Linha[]) => ReactNode;
  acoes?: (l: Linha, recarregar: () => void) => ReactNode;
}) {
  const { dados, carregando, atualizando, erro, carregar } = useApi(caminho);
  const linhas = useMemo(() => {
    const base = lista(dados, chave);
    return preparar ? base.map(preparar) : base;
  }, [dados, chave, preparar]);

  return (
    <div className="space-y-6">
      <Indicadores itens={indicadores(linhas)} carregando={carregando} />
      {!carregando && !erro && topo?.(linhas)}
      <Cartao titulo={titulo} subtitulo={subtitulo} icone={icone}>
        {carregando ? (
          <Carregando />
        ) : erro ? (
          <Erro mensagem={erro} aoRepetir={() => void carregar()} />
        ) : (
          <>
            <div className="flex justify-end px-5 pt-4">
              <button
                type="button"
                onClick={() => void carregar(true)}
                disabled={atualizando}
                className={`inline-flex mb-3 cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 ${FOCO}`}
              >
                <RefreshCw className={`h-3.5 w-3.5 ${atualizando ? "animate-spin" : ""}`} />
                Atualizar lista
              </button>
            </div>
            <Tabela
              linhas={linhas}
              colunas={colunas}
              rotuloVazio={rotuloVazio}
              filtroStatus={filtroStatus}
              centralizada={centralizada}
              acoes={acoes ? (l) => acoes(l, () => void carregar(true)) : undefined}
            />
          </>
        )}
      </Cartao>
    </div>
  );
}

/* ───────────── seções ───────────── */

/* Visão geral: cartões escuros */

type TomResumo = "teal" | "emerald" | "rose" | "amber";

const COR_ICONE_RESUMO: Record<TomResumo, string> = {
  teal: "text-teal-400",
  emerald: "text-emerald-400",
  rose: "text-rose-500",
  amber: "text-amber-500",
};

function CartaoResumo({
  icone: Icone,
  tom,
  rotulo,
  valor,
  detalhe,
  selo,
  carregando,
}: {
  icone: LucideIcon;
  tom: TomResumo;
  rotulo: string;
  valor: string;
  detalhe: string;
  selo?: { texto: string; classe: string };
  carregando: boolean;
}) {
  return (
    <div className="h-full rounded-2xl border border-white/10 bg-white p-5 text-white shadow-lg shadow-black/20">
      <div className="flex items-start justify-between gap-3">
        <Icone className={`h-6 w-6 ${COR_ICONE_RESUMO[tom]}`} aria-hidden="true" />
        {selo && !carregando && (
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${selo.classe}`}
          >
            {selo.texto}
          </span>
        )}
      </div>

      <p className="mt-4 text-base text-black/90">{rotulo}</p>

      <p className="mt-2 text-2xl text-black font-extrabold tracking-tight sm:text-3xl">
        {carregando ? "—" : valor}
      </p>

      <p className="mt-3 text-xs text-black/70">{detalhe}</p>
    </div>
  );
}

function VisaoGeral() {
  const { dados, carregando, erro, carregar } = useApi("resumo");
  const mes = (dados?.mes ?? {}) as Linha;
  const proximos = lista(dados, "proximos");

  const saldo = paraNumero(dados?.saldo);
  const receitasMes = paraNumero(mes.receitas ?? dados?.receitas);
  const despesasMes = paraNumero(mes.despesas ?? dados?.despesas);

  // Quantidade de pagamentos pendentes. Se a API não mandar o número,
  // usa a quantidade de vencimentos próximos.
  const pendencias = paraNumero(
    dados?.pendencias ?? dados?.qtd_pendentes ?? proximos.length
  );

  const resultado = receitasMes - despesasMes;
  const base = Math.max(receitasMes, despesasMes, 1);

  const seloSaldo =
    saldo < 0
      ? { texto: "Negativo", classe: "bg-red-500/15 text-red-400" }
      : { texto: "Disponível", classe: "bg-emerald-500/15 text-emerald-400" };

  return (
    <div className="space-y-6">
      <section
        aria-label="Resumo financeiro"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <CartaoResumo
          icone={Wallet}
          tom="teal"
          rotulo="Saldo disponível"
          valor={moeda(saldo)}
          detalhe="Recursos disponíveis em caixa"
          selo={seloSaldo}
          carregando={carregando}
        />
        <CartaoResumo
          icone={TrendingUp}
          tom="emerald"
          rotulo="Entradas do mês"
          valor={moeda(receitasMes)}
          detalhe="Receitas e recebimentos"
          carregando={carregando}
        />
        <CartaoResumo
          icone={TrendingDown}
          tom="rose"
          rotulo="Saídas do mês"
          valor={moeda(despesasMes)}
          detalhe="Despesas e pagamentos"
          carregando={carregando}
        />
        <CartaoResumo
          icone={Clock}
          tom="amber"
          rotulo="Pendências"
          valor={String(pendencias)}
          detalhe="Pagamentos a analisar"
          carregando={carregando}
        />
      </section>

      {erro ? (
        <Cartao titulo="Resumo do mês" icone={LayoutDashboard}>
          <Erro mensagem={erro} aoRepetir={() => void carregar()} />
        </Cartao>
      ) : (
        <div className="grid gap-6 xl:grid-cols-2">
          <Cartao
            titulo="Resumo do mês"
            subtitulo="Receitas contra despesas"
            icone={LayoutDashboard}
          >
            {carregando ? (
              <Carregando />
            ) : (
              <div className="space-y-5 p-6">
                {[
                  { rotulo: "Receitas", valor: receitasMes, cor: "bg-emerald-500" },
                  { rotulo: "Despesas", valor: despesasMes, cor: "bg-rose-500" },
                ].map((b) => (
                  <div key={b.rotulo}>
                    <div className="mb-1.5 flex justify-between text-sm">
                      <span className="font-medium text-slate-700">{b.rotulo}</span>
                      <span className="font-semibold text-slate-900">
                        {moeda(b.valor)}
                      </span>
                    </div>
                    <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${b.cor}`}
                        style={{ width: `${(b.valor / base) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
                <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                  <span className="text-sm font-medium text-slate-600">
                    Resultado do mês
                  </span>
                  <span
                    className={`text-lg font-extrabold ${
                      resultado < 0 ? "text-red-600" : "text-emerald-700"
                    }`}
                  >
                    {moeda(resultado)}
                  </span>
                </div>
              </div>
            )}
          </Cartao>

          <Cartao
            titulo="Próximos vencimentos"
            subtitulo="O que precisa ser pago em breve"
            icone={Clock}
          >
            {carregando ? (
              <Carregando />
            ) : proximos.length === 0 ? (
              <Vazio
                texto="Nenhum vencimento próximo"
                detalhe="Quando houver contas a pagar com vencimento, elas aparecem aqui."
              />
            ) : (
              <ul className="divide-y divide-slate-100">
                {proximos.slice(0, 6).map((p, i) => (
                  <li
                    key={String(p.id ?? i)}
                    className="flex items-center justify-between gap-3 px-6 py-4"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {String(p.descricao ?? p.fornecedor ?? "Sem descrição")}
                      </p>
                      <p className="text-xs text-slate-500">
                        Vence em {dataBR(p.vencimento)}
                      </p>
                    </div>
                    <span className="whitespace-nowrap text-sm font-semibold text-rose-700">
                      {moeda(p.valor)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Cartao>
        </div>
      )}
    </div>
  );
}

function ContasSaldos() {
  const { dados, carregando, erro, carregar } = useApi("contas");
  const contas = lista(dados, "contas");
  const movimentos = lista(dados, "movimentos");

  const itens: Indicador[] = [
    { rotulo: "Saldo total", valor: moeda(soma(contas, "saldo")), detalhe: `${contas.length} conta(s) e caixa`, icone: Wallet, tom: "teal" },
    { rotulo: "Entradas", valor: moeda(soma(movimentos, "valor", (m) => semAcento(m.tipo) === "entrada")), detalhe: "No extrato carregado", icone: ArrowUpCircle, tom: "emerald" },
    { rotulo: "Saídas", valor: moeda(soma(movimentos, "valor", (m) => semAcento(m.tipo) === "saida")), detalhe: "No extrato carregado", icone: ArrowDownCircle, tom: "rose" },
    { rotulo: "Movimentações", valor: String(movimentos.length), detalhe: "Lançamentos no extrato", icone: Banknote, tom: "slate" },
  ];

  return (
    <div className="space-y-6">
      <Indicadores itens={itens} carregando={carregando} />
      {erro ? (
        <Cartao titulo="Contas" icone={Landmark}>
          <Erro mensagem={erro} aoRepetir={() => void carregar()} />
        </Cartao>
      ) : (
        <>
          <Cartao titulo="Contas bancárias e caixa" subtitulo="Saldo atual de cada conta" icone={Landmark}>
            {carregando ? (
              <Carregando />
            ) : contas.length === 0 ? (
              <Vazio texto="Nenhuma conta cadastrada" detalhe="Cadastre uma conta bancária ou o caixa para acompanhar o saldo." />
            ) : (
              <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
                {contas.map((c, i) => (
                  <div key={String(c.id ?? i)} className="rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-semibold text-slate-900">{String(c.nome ?? "Conta")}</p>
                    <p className="text-xs text-slate-500">
                      {String(c.banco ?? c.tipo ?? "Caixa")}
                    </p>
                    <p className={`mt-3 text-2xl font-extrabold ${paraNumero(c.saldo) < 0 ? "text-red-600" : "text-slate-900"}`}>
                      {moeda(c.saldo)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Cartao>

          <Cartao titulo="Extrato" subtitulo="Entradas e saídas de dinheiro" icone={Banknote}>
            {carregando ? (
              <Carregando />
            ) : (
              <Tabela
                linhas={movimentos}
                rotuloVazio="Nenhuma movimentação"
                colunas={[
                  { chave: "descricao", rotulo: "Descrição" },
                  { chave: "conta", rotulo: "Conta" },
                  { chave: "data", rotulo: "Data", tipo: "data" },
                  { chave: "tipo", rotulo: "Tipo" },
                  { chave: "valor", rotulo: "Valor", tipo: "moeda", direita: true },
                ]}
              />
            )}
          </Cartao>
        </>
      )}
    </div>
  );
}

function preparaFolha(l: Linha): Linha {
  const liquido =
    l.liquido !== undefined && l.liquido !== null
      ? paraNumero(l.liquido)
      : paraNumero(l.salario_base) +
        paraNumero(l.comissao) +
        paraNumero(l.beneficios) -
        paraNumero(l.descontos) -
        paraNumero(l.adiantamentos);

  return {
    ...l,
    liquido,
    // Aceita alguns nomes comuns vindos da API
    agencia: l.agencia ?? l.agencia_bancaria ?? l.agency ?? "",
    conta: l.conta ?? l.conta_bancaria ?? l.numero_conta ?? l.account ?? "",
  };
}

function FolhaPagamento() {
  return (
    <SecaoLista
      caminho="folha"
      chave="funcionarios"
      titulo="Folha de pagamento"
      subtitulo="Salários, comissões, benefícios, descontos e adiantamentos"
      icone={Users}
      rotuloVazio="Nenhum funcionário na folha"
      centralizada
      preparar={preparaFolha}
      topo={(l) => {
        const f = l[0];
        if (!f) return null;

        const dados = [
          { rotulo: "Agência", valor: String(f.agencia ?? "").trim() || "—" },
          { rotulo: "Conta", valor: String(f.conta ?? "").trim() || "—" },
        ];

        return (
          <Cartao
            titulo="Dados bancários"
            subtitulo="Agência e conta para recebimento"
            icone={Landmark}
          >
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {dados.map((d) => (
                <div
                  key={d.rotulo}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    {d.rotulo}
                  </p>
                  <p className="mt-2 break-words text-lg font-extrabold text-slate-900">
                    {d.valor}
                  </p>
                </div>
              ))}
            </div>
          </Cartao>
        );
      }}
      colunas={[
        { chave: "salario_base", rotulo: "Salário", tipo: "moeda", direita: true },
        { chave: "comissao", rotulo: "Comissão", tipo: "moeda", direita: true },
        { chave: "beneficios", rotulo: "Benefícios", tipo: "moeda", direita: true },
        { chave: "descontos", rotulo: "Descontos", tipo: "moeda", direita: true },
        { chave: "adiantamentos", rotulo: "Adiantamentos", tipo: "moeda", direita: true },
        { chave: "liquido", rotulo: "Líquido", tipo: "moeda", direita: true },
      ]}
      indicadores={(l) => [
        { rotulo: "Total bruto", valor: moeda(soma(l, "salario_base") + soma(l, "comissao") + soma(l, "beneficios")), detalhe: "Comissões e benefícios", icone: Wallet, tom: "emerald" },
        { rotulo: "Descontos e adiantamentos", valor: moeda(soma(l, "descontos") + soma(l, "adiantamentos")), detalhe: "Abatidos do pagamento", icone: ArrowDownCircle, tom: "rose" },
        { rotulo: "Total líquido", valor: moeda(soma(l, "liquido")), detalhe: "A pagar aos funcionários", icone: Banknote, tom: "slate" },
      ]}
    />
  );
}

function marcarVencidos(l: Linha): Linha {
  const venc = paraData(l.vencimento);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  if (ativo(l) && venc && venc < hoje) return { ...l, status: "vencido" };
  return l;
}

function ContasPagar() {
  return (
    <SecaoLista
      caminho="pagar"
      chave="contas"
      titulo="Contas a pagar"
      subtitulo="Fornecedores, vencimentos, despesas fixas e boletos"
      icone={ArrowDownCircle}
      rotuloVazio="Nenhuma conta a pagar"
      filtroStatus
      preparar={marcarVencidos}
      colunas={[
        { chave: "fornecedor", rotulo: "Fornecedor" },
        { chave: "descricao", rotulo: "Descrição" },
        { chave: "categoria", rotulo: "Categoria" },
        { chave: "vencimento", rotulo: "Vencimento", tipo: "data" },
        { chave: "status", rotulo: "Situação", tipo: "status" },
        { chave: "valor", rotulo: "Valor", tipo: "moeda", direita: true },
      ]}
      indicadores={(l) => {
        const venc = l.filter((x) => statusDe(x) === "vencido");
        const em7 = Date.now() + 7 * 86400000;
        const proximos = l.filter((x) => {
          const d = paraData(x.vencimento);
          return ativo(x) && statusDe(x) !== "vencido" && d && d.getTime() <= em7;
        });
        return [
          { rotulo: "Em aberto", valor: moeda(soma(l, "valor", ativo)), detalhe: "Ainda não pago", icone: Wallet, tom: "teal" },
          { rotulo: "Vencidas", valor: moeda(soma(venc, "valor")), detalhe: `${venc.length} conta(s) em atraso`, icone: AlertCircle, tom: "rose" },
          { rotulo: "Vencem em 7 dias", valor: moeda(soma(proximos, "valor")), detalhe: `${proximos.length} conta(s)`, icone: Clock, tom: "amber" },
          { rotulo: "Pagas", valor: moeda(soma(l, "valor", (x) => statusDe(x) === "pago")), detalhe: "No período carregado", icone: CheckCircle2, tom: "emerald" },
        ];
      }}
    />
  );
}

function ContasReceber() {
  return (
    <SecaoLista
      caminho="receber"
      chave="contas"
      titulo="Contas a receber"
      subtitulo="Cobranças, recebimentos pendentes e conciliação"
      icone={ArrowUpCircle}
      rotuloVazio="Nenhuma conta a receber"
      filtroStatus
      preparar={marcarVencidos}
      colunas={[
        { chave: "cliente", rotulo: "Cliente" },
        { chave: "descricao", rotulo: "Descrição" },
        { chave: "vencimento", rotulo: "Vencimento", tipo: "data" },
        { chave: "recebido_em", rotulo: "Recebido em", tipo: "data" },
        { chave: "status", rotulo: "Situação", tipo: "status" },
        { chave: "valor", rotulo: "Valor", tipo: "moeda", direita: true },
      ]}
      indicadores={(l) => {
        const venc = l.filter((x) => statusDe(x) === "vencido");
        const recebidos = l.filter((x) => ["recebido", "pago", "conciliado"].includes(statusDe(x)));
        const conciliados = l.filter((x) => statusDe(x) === "conciliado" || x.conciliado === true || x.conciliado === 1);
        return [
          { rotulo: "A receber", valor: moeda(soma(l, "valor", ativo)), detalhe: "Cobranças em aberto", icone: Wallet, tom: "teal" },
          { rotulo: "Em atraso", valor: moeda(soma(venc, "valor")), detalhe: `${venc.length} cobrança(s)`, icone: AlertCircle, tom: "rose" },
          { rotulo: "Recebido", valor: moeda(soma(recebidos, "valor")), detalhe: "No período carregado", icone: CheckCircle2, tom: "emerald" },
          { rotulo: "Conciliado", valor: `${conciliados.length} de ${recebidos.length}`, detalhe: "Recebimentos conferidos", icone: Landmark, tom: "slate" },
        ];
      }}
    />
  );
}

function Aprovacoes() {
  const [processando, setProcessando] = useState<string | null>(null);
  const [mensagem, setMensagem] = useState("");

  async function decidir(id: unknown, acao: "aprovar" | "rejeitar" | "encaminhar", recarregar: () => void) {
    const chave = `${id}-${acao}`;
    setProcessando(chave);
    setMensagem("");
    try {
      const response = await fetch(`${API}/aprovacoes/${encodeURIComponent(String(id))}`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acao }),
      });
      if (!response.ok) {
        const json: Linha = await response.json().catch(() => ({}));
        throw new Error(String(json.error ?? json.mensagem ?? "Não foi possível registrar a decisão."));
      }
      recarregar();
    } catch (e) {
      setMensagem(e instanceof Error ? e.message : "Erro ao registrar a decisão.");
    } finally {
      setProcessando(null);
    }
  }

  const botao = "inline-flex cursor-pointer items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-4">
      {mensagem && (
        <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
          {mensagem}
        </div>
      )}
      <SecaoLista
        caminho="aprovacoes"
        chave="solicitacoes"
        titulo="Aprovações financeiras"
        subtitulo="Pagamentos, despesas, reembolsos e adiantamentos"
        icone={CheckCircle2}
        rotuloVazio="Nenhuma solicitação"
        filtroStatus
        colunas={[
          { chave: "solicitante", rotulo: "Solicitante" },
          { chave: "tipo", rotulo: "Tipo" },
          { chave: "descricao", rotulo: "Descrição" },
          { chave: "data", rotulo: "Data", tipo: "data" },
          { chave: "status", rotulo: "Situação", tipo: "status" },
          { chave: "valor", rotulo: "Valor", tipo: "moeda", direita: true },
        ]}
        indicadores={(l) => {
          const pend = l.filter((x) => statusDe(x) === "pendente");
          return [
            { rotulo: "Aguardando decisão", valor: String(pend.length), detalhe: "Solicitações pendentes", icone: Clock, tom: "amber" },
            { rotulo: "Valor pendente", valor: moeda(soma(pend, "valor")), detalhe: "Soma das solicitações", icone: Wallet, tom: "teal" },
            { rotulo: "Aprovadas", valor: String(l.filter((x) => statusDe(x) === "aprovado").length), detalhe: "No período carregado", icone: CheckCircle2, tom: "emerald" },
            { rotulo: "Rejeitadas", valor: String(l.filter((x) => statusDe(x) === "rejeitado").length), detalhe: "No período carregado", icone: XCircle, tom: "rose" },
          ];
        }}
        acoes={(l, recarregar) =>
          statusDe(l) === "pendente" ? (
            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={processando !== null}
                onClick={() => void decidir(l.id, "aprovar", recarregar)}
                className={`${botao} bg-emerald-600 text-white hover:bg-emerald-700 ${FOCO}`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Aprovar
              </button>
              <button
                type="button"
                disabled={processando !== null}
                onClick={() => void decidir(l.id, "encaminhar", recarregar)}
                className={`${botao} border border-slate-200 text-slate-700 hover:bg-slate-50 ${FOCO}`}
              >
                <Send className="h-3.5 w-3.5" />
                Encaminhar
              </button>
              <button
                type="button"
                disabled={processando !== null}
                onClick={() => void decidir(l.id, "rejeitar", recarregar)}
                className={`${botao} border border-red-200 text-red-700 hover:bg-red-50 ${FOCO}`}
              >
                <XCircle className="h-3.5 w-3.5" />
                Rejeitar
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )
        }
      />
    </div>
  );
}

function Relatorios() {
  const { dados, carregando, erro, carregar } = useApi("relatorios");
  const fluxo = lista(dados, "fluxo");
  const setores = lista(dados, "setores");
  const folha = lista(dados, "folha");
  const resultado = lista(dados, "resultado");

  const maxFluxo = Math.max(1, ...fluxo.map((f) => Math.max(paraNumero(f.entradas), paraNumero(f.saidas))));
  const maxSetor = Math.max(1, ...setores.map((s) => paraNumero(s.valor)));
  const maxFolha = Math.max(1, ...folha.map((f) => paraNumero(f.valor)));

  if (erro) {
    return (
      <Cartao titulo="Relatórios financeiros" icone={BarChart3}>
        <Erro mensagem={erro} aoRepetir={() => void carregar()} />
      </Cartao>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Cartao titulo="Fluxo de caixa" subtitulo="Entradas e saídas por mês" icone={BarChart3}>
        {carregando ? (
          <Carregando />
        ) : fluxo.length === 0 ? (
          <Vazio texto="Sem dados de fluxo de caixa" detalhe="Os meses aparecem aqui quando houver movimentações." />
        ) : (
          <div className="p-6">
            <div className="flex h-48 items-end gap-3 overflow-x-auto">
              {fluxo.map((f, i) => (
                <div key={String(f.mes ?? i)} className="flex min-w-[48px] flex-1 flex-col items-center gap-2">
                  <div className="flex h-40 w-full items-end justify-center gap-1">
                    <div
                      className="w-3 rounded-t bg-emerald-500"
                      style={{ height: `${(paraNumero(f.entradas) / maxFluxo) * 100}%` }}
                      title={`Entradas: ${moeda(f.entradas)}`}
                    />
                    <div
                      className="w-3 rounded-t bg-rose-500"
                      style={{ height: `${(paraNumero(f.saidas) / maxFluxo) * 100}%` }}
                      title={`Saídas: ${moeda(f.saidas)}`}
                    />
                  </div>
                  <span className="text-xs text-slate-500">{String(f.mes ?? "")}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-5 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />Entradas</span>
              <span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-rose-500" />Saídas</span>
            </div>
          </div>
        )}
      </Cartao>

      <Cartao titulo="Despesas por setor" subtitulo="Onde o dinheiro está sendo gasto" icone={Landmark}>
        {carregando ? (
          <Carregando />
        ) : setores.length === 0 ? (
          <Vazio texto="Sem despesas por setor" detalhe="Classifique as despesas por setor para ver a divisão aqui." />
        ) : (
          <ul className="space-y-4 p-6">
            {setores.map((s, i) => (
              <li key={String(s.setor ?? i)}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{String(s.setor ?? "Sem setor")}</span>
                  <span className="font-semibold text-slate-900">{moeda(s.valor)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-teal-600" style={{ width: `${(paraNumero(s.valor) / maxSetor) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Cartao>

      <Cartao titulo="Custos da folha" subtitulo="Total da folha de pagamento por mês" icone={Users}>
        {carregando ? (
          <Carregando />
        ) : folha.length === 0 ? (
          <Vazio texto="Sem custos de folha" detalhe="Os custos aparecem aqui depois do primeiro fechamento da folha." />
        ) : (
          <ul className="space-y-4 p-6">
            {folha.map((f, i) => (
              <li key={String(f.mes ?? i)}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium text-slate-700">{String(f.mes ?? "")}</span>
                  <span className="font-semibold text-slate-900">{moeda(f.valor)}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-amber-500" style={{ width: `${(paraNumero(f.valor) / maxFolha) * 100}%` }} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Cartao>

      <Cartao titulo="Resultado mensal" subtitulo="Receitas menos despesas" icone={Wallet}>
        {carregando ? (
          <Carregando />
        ) : resultado.length === 0 ? (
          <Vazio texto="Sem resultado mensal" detalhe="O resultado é calculado quando houver receitas e despesas no mês." />
        ) : (
          <ul className="divide-y divide-slate-100">
            {resultado.map((r, i) => {
              const v = paraNumero(r.valor);
              return (
                <li key={String(r.mes ?? i)} className="flex items-center justify-between px-6 py-4">
                  <span className="text-sm font-medium text-slate-700">{String(r.mes ?? "")}</span>
                  <span className={`text-sm font-bold ${v < 0 ? "text-red-600" : "text-emerald-700"}`}>
                    {moeda(v)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Cartao>
    </div>
  );
}

/* ───────────── página ───────────── */

export default function FinanceiroPage() {
  const [secao, setSecao] = useState<SecaoId>("visao");
  const atual = SECOES.find((s) => s.id === secao) ?? SECOES[0];

  return (
    <main className="min-h-screen space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">Financeiro</h1>
        <p className="mt-2 text-sm text-white/90">{atual.descricao}</p>
      </header>

      <div
        role="tablist"
        aria-label="Seções do financeiro"
        className="flex gap-2 overflow-x-auto rounded-2xl bg-white/10 p-1.5"
      >
        {SECOES.map(({ id, rotulo, icone: Icone }) => {
          const ativa = id === secao;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              id={`aba-${id}`}
              aria-selected={ativa}
              aria-controls={`painel-${id}`}
              onClick={() => setSecao(id)}
              className={`inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${FOCO} ${
                ativa ? "bg-white text-teal-800 shadow-lg" : "text-white hover:bg-white/10"
              }`}
            >
              <Icone className="h-4 w-4" />
              {rotulo}
            </button>
          );
        })}
      </div>

      <div role="tabpanel" id={`painel-${secao}`} aria-labelledby={`aba-${secao}`}>
        {secao === "visao" && <VisaoGeral />}
        {secao === "folha" && <FolhaPagamento />}
        {secao === "aprovacoes" && <Aprovacoes />}
      </div>
    </main>
  );
}