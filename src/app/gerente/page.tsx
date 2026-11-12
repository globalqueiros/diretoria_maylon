"use client";

import Link from "next/link";
import {
  ArrowRight,
  Car,
  CheckCircle2,
  Clock3,
  IdCard,
  PackageOpen,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";

type Usuario = { full_name?: string; first_name?: string };
type Indicadores = {
  pendentes: number;
  enviadosHoje: number;
  aprovadosHoje: number;
  aprovadosMes: number;
};
type Comissao = { valor: number; status: string };
type Solicitacao = { valor: number; status: string };

const moeda = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const numero = new Intl.NumberFormat("pt-BR");

export default function DashboardGerentePage() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [totalMotoristas, setTotalMotoristas] = useState(0);
  const [indicadores, setIndicadores] = useState<Indicadores>({
    pendentes: 0,
    enviadosHoje: 0,
    aprovadosHoje: 0,
    aprovadosMes: 0,
  });
  const [entregas, setEntregas] = useState<unknown[]>([]);
  const [comissoes, setComissoes] = useState<Comissao[]>([]);
  const [solicitacoes, setSolicitacoes] = useState<Solicitacao[]>([]);
  const [meta, setMeta] = useState({ meta: 0, realizado: 0 });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");

    try {
      const meRes = await fetch("/api/me", { cache: "no-store" });
      const me = await meRes.json().catch(() => ({}));
      setUsuario(me?.user ?? me);
      const gerenteId = Number(me?.user?.id ?? me?.id);

      const urls = [
        `/api/motoristas/total?gerenteId=${gerenteId}`,
        `/api/motoristas/indicadores?gerenteId=${gerenteId}`,
        "/api/gerente/entregas",
        `/api/financeiro/comissoes?gerente_id=${gerenteId}`,
        "/api/planos/solicitacoes?escopo=gerente&status=pendente",
        "/api/gerente/meta-mes",
      ];

      const respostas = await Promise.all(
        urls.map((url) => fetch(url, { cache: "no-store" }))
      );

      const [totalJson, indicadoresJson, entregasJson, comissoesJson, planosJson, metaJson] =
        await Promise.all(respostas.map((res) => res.json().catch(() => ({}))));

      setTotalMotoristas(Number(totalJson.total ?? 0));
      setIndicadores({
        pendentes: Number(indicadoresJson.pendentes ?? 0),
        enviadosHoje: Number(indicadoresJson.enviadosHoje ?? 0),
        aprovadosHoje: Number(indicadoresJson.aprovadosHoje ?? 0),
        aprovadosMes: Number(indicadoresJson.aprovadosMes ?? 0),
      });
      setEntregas(Array.isArray(entregasJson.entregas) ? entregasJson.entregas : []);
      setComissoes(Array.isArray(comissoesJson.comissoes) ? comissoesJson.comissoes : []);
      setSolicitacoes(Array.isArray(planosJson.solicitacoes) ? planosJson.solicitacoes : []);
      setMeta({
        meta: Number(metaJson.meta ?? 0),
        realizado: Number(metaJson.realizado ?? 0),
      });
    } catch {
      setErro("Não foi possível carregar todos os indicadores.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void carregar();
    }, 0);

    return () => clearTimeout(timer);
  }, [carregar]);

  const nome = useMemo(
    () => usuario?.full_name || usuario?.first_name || "Gerente",
    [usuario]
  );

  const valorComissoes = comissoes.reduce(
    (soma, item) => soma + Number(item.valor || 0),
    0
  );
  const entregasConcluidas = entregas.filter(
    (item) => (item as { status?: string })?.status === "entregue"
  ).length;
  const percentualMeta =
    meta.meta > 0 ? Math.min(100, Math.round((meta.realizado / meta.meta) * 100)) : 0;

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-8xl space-y-6">
        <header className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold text-white/80">Painel do gerente</p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">
              Olá, {nome}
            </h1>
            <p className="mt-1 text-sm text-white/80">
              Acompanhe sua carteira, entregas e pendências da equipe.
            </p>
          </div>
          <button
            type="button"
            onClick={() => void carregar()}
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-teal-800 shadow-sm hover:bg-teal-50"
          >
            <RefreshCw size={16} className={carregando ? "animate-spin" : ""} />
            Atualizar
          </button>
        </header>

        {erro && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {erro}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Indicador
            titulo="Motoristas da carteira"
            valor={numero.format(totalMotoristas)}
            detalhe={`${indicadores.pendentes} pendente(s)`}
            icone={<Car size={20} />}
          />
          <Indicador
            titulo="Entregas"
            valor={numero.format(entregas.length)}
            detalhe={`${entregasConcluidas} concluída(s)`}
            icone={<PackageOpen size={20} />}
          />
          <Indicador
            titulo="Comissões"
            valor={moeda.format(valorComissoes)}
            detalhe="Da sua equipe"
            icone={<Wallet size={20} />}
          />
          <Indicador
            titulo="Maylon Pass"
            valor={numero.format(solicitacoes.length)}
            detalhe="Solicitações pendentes"
            icone={<IdCard size={20} />}
          />
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Meta do mês</h2>
                <p className="text-sm text-slate-500">
                  Realizado de {moeda.format(meta.realizado)} de{" "}
                  {moeda.format(meta.meta)}
                </p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                <Target size={22} />
              </div>
            </div>
            <div className="mt-5 h-4 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-teal-600 transition-all"
                style={{ width: `${percentualMeta}%` }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-teal-700">{percentualMeta}%</span>
              <span className="text-slate-500">{numero.format(percentualMeta)}% da meta</span>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Resumo titulo="Pendentes" valor={indicadores.pendentes} icone={<Clock3 size={16} />} />
              <Resumo titulo="Aprovados hoje" valor={indicadores.aprovadosHoje} icone={<CheckCircle2 size={16} />} />
              <Resumo titulo="Aprovados no mês" valor={indicadores.aprovadosMes} icone={<TrendingUp size={16} />} />
            </div>
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Atalhos</h2>
            <div className="mt-4 space-y-2">
              <Atalho href="/gerente/motoristas" titulo="Minha carteira" icone={<Users size={17} />} />
              <Atalho href="/gerente/entregas" titulo="Entregas" icone={<PackageOpen size={17} />} />
              <Atalho href="/gerente/maylon_pass" titulo="Aprovar Maylon Pass" icone={<IdCard size={17} />} />
              <Atalho href="/gerente/financeiro" titulo="Financeiro da equipe" icone={<Wallet size={17} />} />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Indicador({
  titulo,
  valor,
  detalhe,
  icone,
}: {
  titulo: string;
  valor: string;
  detalhe: string;
  icone: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{titulo}</p>
          <p className="mt-2 text-2xl font-extrabold text-slate-900">{valor}</p>
          <p className="mt-1 text-xs text-slate-500">{detalhe}</p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
          {icone}
        </div>
      </div>
    </div>
  );
}

function Resumo({
  titulo,
  valor,
  icone,
}: {
  titulo: string;
  valor: number;
  icone: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
      <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        {icone} {titulo}
      </p>
      <p className="mt-1 text-xl font-bold text-slate-900">{numero.format(valor)}</p>
    </div>
  );
}

function Atalho({
  href,
  titulo,
  icone,
}: {
  href: string;
  titulo: string;
  icone: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:bg-teal-50 hover:text-teal-800"
    >
      <span className="flex items-center gap-2">
        {icone} {titulo}
      </span>
      <ArrowRight size={16} />
    </Link>
  );
}
