"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

const BASE_USUARIOS = {
  passageiros: 1000, // usuários ativos por mês
  motoristas: 500,
};

type Espaco = {
  id: string;
  nome: string;
  descricao: string;
  cpm: number; // R$ por 1.000 exibições
  freq: number; // exibições por usuário ativo, por mês
  ctr: number; // % de cliques
  publicos: ("passageiros" | "motoristas")[];
};

const ESPACOS: Espaco[] = [
  {
    id: "banner_home",
    nome: "Banner na tela inicial",
    descricao: "Aparece toda vez que o usuário abre o painel",
    cpm: 18,
    freq: 20,
    ctr: 0.9,
    publicos: ["passageiros", "motoristas"],
  },
  {
    id: "popup",
    nome: "Pop-up ao abrir o app",
    descricao: "Tela cheia, com botão de ação, na abertura",
    cpm: 40,
    freq: 3,
    ctr: 2.5,
    publicos: ["passageiros", "motoristas"],
  },
  {
    id: "viagem",
    nome: "Banner durante a corrida",
    descricao: "Exibido na tela de acompanhamento da viagem",
    cpm: 30,
    freq: 8,
    ctr: 1.2,
    publicos: ["passageiros"],
  },
  {
    id: "pass",
    nome: "Destaque no Maylon Pass",
    descricao: "Oferta junto ao cartão digital do assinante",
    cpm: 25,
    freq: 6,
    ctr: 1.8,
    publicos: ["passageiros"],
  },
  {
    id: "push",
    nome: "Notificação push",
    descricao: "Mensagem direta no celular do usuário",
    cpm: 60,
    freq: 2,
    ctr: 3.5,
    publicos: ["passageiros", "motoristas"],
  },
];

const PUBLICOS = [
  { id: "passageiros", nome: "Passageiros" },
  { id: "motoristas", nome: "Motoristas" },
] as const;

// Desconto progressivo por duração (semanas)
const descontoPorSemanas = (s: number) => (s >= 12 ? 0.15 : s >= 8 ? 0.1 : s >= 4 ? 0.05 : 0);

const SEGMENTACAO = { base: { usuarios: 1, preco: 1 }, regiao: { usuarios: 0.4, preco: 1.25 } };
const CRIACAO_VALOR = 600; // criação do material pela equipe
const VALOR_MINIMO = 200; // investimento mínimo da campanha

const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
const num = (v: number) => Math.round(v).toLocaleString("pt-BR");

/* ------------------------------------------------------------------ */

export default function CotacaoPage() {
  const [publicos, setPublicos] = useState<string[]>(["passageiros"]);
  const [espacos, setEspacos] = useState<string[]>(["banner_home", "popup"]);
  const [semanas, setSemanas] = useState(4);
  const [segmentado, setSegmentado] = useState(false);
  const [criacao, setCriacao] = useState(false);

  const [form, setForm] = useState({ nome: "", empresa: "", email: "", whatsapp: "", mensagem: "" });
  const [status, setStatus] = useState<"idle" | "enviando" | "ok" | "erro">("idle");
  const [protocolo, setProtocolo] = useState("");

  const calculo = useMemo(() => {
    const seg = segmentado ? SEGMENTACAO.regiao : SEGMENTACAO.base;
    const meses = semanas / 4.345;

    const linhas = ESPACOS.filter((e) => espacos.includes(e.id)).map((e) => {
      const usuarios =
        publicos
          .filter((p) => e.publicos.includes(p as "passageiros" | "motoristas"))
          .reduce((s, p) => s + BASE_USUARIOS[p as keyof typeof BASE_USUARIOS], 0) * seg.usuarios;
      const exibicoes = usuarios * e.freq * meses;
      const valor = (exibicoes / 1000) * e.cpm * seg.preco;
      const cliques = exibicoes * (e.ctr / 100);
      return { espaco: e, usuarios, exibicoes, valor, cliques };
    });

    const bruto = linhas.reduce((s, l) => s + l.valor, 0);
    const descPct = descontoPorSemanas(semanas);
    const desconto = bruto * descPct;
    // O mínimo vale depois do desconto: nenhuma campanha fica abaixo de VALOR_MINIMO
    const minimoAplicado = linhas.length > 0 && bruto - desconto < VALOR_MINIMO;
    const liquido = linhas.length > 0 ? Math.max(bruto - desconto, VALOR_MINIMO) : 0;
    const extras = criacao ? CRIACAO_VALOR : 0;
    const total = liquido + extras;

    const exibicoes = linhas.reduce((s, l) => s + l.exibicoes, 0);
    const cliques = linhas.reduce((s, l) => s + l.cliques, 0);
    const alcance = Math.max(0, ...linhas.map((l) => l.usuarios)) * Math.min(1, semanas / 4) * 0.75;

    return {
      linhas,
      bruto,
      descPct,
      desconto,
      minimoAplicado,
      extras,
      total,
      exibicoes,
      cliques,
      alcance,
      cpc: cliques > 0 ? total / cliques : 0,
    };
  }, [publicos, espacos, semanas, segmentado, criacao]);

  const alternar = (lista: string[], set: (v: string[]) => void, id: string) =>
    set(lista.includes(id) ? lista.filter((x) => x !== id) : [...lista, id]);

  const semDados = calculo.linhas.length === 0 || publicos.length === 0;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setStatus("enviando");
    try {
      const res = await fetch("/api/comercial/cotacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          publicos,
          espacos,
          semanas,
          segmentadoPorRegiao: segmentado,
          criacaoDoMaterial: criacao,
          total: Math.round(calculo.total),
        }),
      });
      if (!res.ok) throw new Error("falha");
      const data = await res.json();
      setProtocolo(data.protocolo ?? "");
      setStatus("ok");
    } catch {
      setStatus("erro");
    }
  }

  const campo =
    "w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#35aa8a] focus:outline-none focus:ring-2 focus:ring-[#35aa8a]/30";

  const chip = (ativo: boolean) =>
    `rounded-xl border px-4 py-3 text-left text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35aa8a] ${
      ativo
        ? "border-[#35aa8a] bg-[#35aa8a]/10 text-[#14654f]"
        : "border-slate-200 text-slate-700 hover:border-slate-300"
    }`;

  return (
    <main className="min-h-screen text-slate-900">
      <header className="text-white">
        <div className="mx-auto max-w-8xl px-5 py-4 sm:py-4">
          <p className="mb-1 text-sm font-medium text-[#6fd3b5]">Anuncie no Maylon</p>
          <h1 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight sm:text-3xl">
            Coloque sua marca na tela de quem usa o app todos os dias
          </h1>
          <p className="mt-1 max-w-2xl text-base leading-relaxed text-slate-300 sm:text-sm">
            Campanhas a partir de {brl(VALOR_MINIMO)}. Escolha o público, os espaços e o período e
            veja na hora quantas pessoas você alcança.
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-8xl gap-8 px-5 py-10 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">1. Quem você quer alcançar</h2>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {PUBLICOS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={publicos.includes(p.id)}
                  onClick={() => alternar(publicos, setPublicos, p.id)}
                  className={chip(publicos.includes(p.id))}
                >
                  <span className="block">{p.nome}</span>
                  <span className="mt-0.5 block text-xs font-normal text-slate-500">
                    {num(BASE_USUARIOS[p.id])} usuários ativos por mês
                  </span>
                </button>
              ))}
            </div>

            <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={segmentado}
                onChange={(e) => setSegmentado(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#35aa8a]"
              />
              <span>
                <span className="font-medium">Segmentar por região</span>
                <span className="block text-xs text-slate-500">
                  Mostra o anúncio só na área do seu negócio (alcance menor, preço por exibição 25% maior).
                </span>
              </span>
            </label>
          </section>

          {/* Espaços */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">2. Onde seu anúncio aparece</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {ESPACOS.map((e) => {
                const ativo = espacos.includes(e.id);
                const disponivel = publicos.some((p) => e.publicos.includes(p as "passageiros" | "motoristas"));
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      aria-pressed={ativo}
                      disabled={!disponivel}
                      onClick={() => alternar(espacos, setEspacos, e.id)}
                      className={`h-full w-full ${chip(ativo)} disabled:cursor-not-allowed disabled:opacity-50`}
                    >
                      <span className="block">{e.nome}</span>
                      <span className="mt-0.5 block text-xs font-normal text-slate-500">{e.descricao}</span>
                      {!disponivel && (
                        <span className="mt-1 block text-xs font-normal text-amber-700">
                          Disponível só para{" "}
                          {e.publicos.join(" e ")}
                        </span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Período */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold">3. Por quanto tempo</h2>
            <label htmlFor="semanas" className="mt-5 mb-2 flex justify-between text-sm font-medium">
              <span>Duração da campanha</span>
              <span className="text-[#1f8a6c]">
                {semanas} {semanas === 1 ? "semana" : "semanas"}
              </span>
            </label>
            <input
              id="semanas"
              type="range"
              min={1}
              max={24}
              value={semanas}
              onChange={(e) => setSemanas(Number(e.target.value))}
              className="w-full accent-[#35aa8a]"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-500">
              <span>1 semana</span>
              <span>24 semanas</span>
            </div>
            <p className="mt-3 text-sm text-slate-600">
              Desconto automático: 5% a partir de 4 semanas, 10% a partir de 8 e 15% a partir de 12.
              {calculo.descPct > 0 && (
                <strong className="text-[#14654f]"> Você está ganhando {calculo.descPct * 100}%.</strong>
              )}
            </p>

            <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm">
              <input
                type="checkbox"
                checked={criacao}
                onChange={(e) => setCriacao(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-[#35aa8a]"
              />
              <span>
                <span className="font-medium">Quero que vocês criem o material</span>
                <span className="block text-xs text-slate-500">
                  Arte e texto do anúncio por {brl(CRIACAO_VALOR)}. Sem isso, você envia a arte pronta.
                </span>
              </span>
            </label>
          </section>

          {/* Detalhe */}
          {!semDados && (
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold">Detalhe por espaço</h2>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-slate-500">
                      <th className="py-2 pr-3 font-medium">Espaço</th>
                      <th className="py-2 pr-3 text-right font-medium">Exibições</th>
                      <th className="py-2 pr-3 text-right font-medium">Cliques</th>
                      <th className="py-2 text-right font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="tabular-nums">
                    {calculo.linhas.map((l) => (
                      <tr key={l.espaco.id} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 pr-3 font-medium">{l.espaco.nome}</td>
                        <td className="py-3 pr-3 text-right">{num(l.exibicoes)}</td>
                        <td className="py-3 pr-3 text-right">{num(l.cliques)}</td>
                        <td className="py-3 text-right">{brl(l.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {calculo.minimoAplicado && (
                <p className="mt-3 text-xs text-slate-500">
                  A soma dos espaços ficou abaixo do investimento mínimo, então a campanha é cobrada a
                  partir de {brl(VALOR_MINIMO)}.
                </p>
              )}
            </section>
          )}

          <p className="text-xs leading-relaxed text-slate-500">
            Estimativas calculadas com base no número médio de usuários ativos e na frequência de uso
            do app. O resultado real pode variar com a época do ano e com a qualidade do anúncio. O
            valor final é confirmado na proposta.
          </p>
        </div>

        {/* Resumo */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-teal-500 px-6 py-5 text-white">
              <p className="text-sm text-white">Investimento estimado</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums">{semDados ? "R$ 0" : brl(calculo.total)}</p>
              {!semDados && calculo.minimoAplicado && (
                <p className="mt-1 text-xs text-slate-100">
                  Investimento mínimo de {brl(VALOR_MINIMO)} aplicado
                  {calculo.extras > 0 && ` + ${brl(calculo.extras)} de criação`}
                </p>
              )}
              {!semDados && !calculo.minimoAplicado && (calculo.desconto > 0 || calculo.extras > 0) && (
                <p className="mt-1 text-xs text-slate-100">
                  {brl(calculo.bruto)}
                  {calculo.desconto > 0 && ` − ${brl(calculo.desconto)} de desconto`}
                  {calculo.extras > 0 && ` + ${brl(calculo.extras)} de criação`}
                </p>
              )}
            </div>

            <dl className="grid grid-cols-2 gap-px bg-slate-100 text-sm">
              {[
                ["Pessoas alcançadas", semDados ? "–" : num(calculo.alcance)],
                ["Exibições", semDados ? "–" : num(calculo.exibicoes)],
                ["Cliques estimados", semDados ? "–" : num(calculo.cliques)],
                ["Custo por clique", calculo.cpc ? `R$ ${calculo.cpc.toFixed(2).replace(".", ",")}` : "–"],
              ].map(([k, v]) => (
                <div key={k} className="bg-white px-5 py-4">
                  <dt className="text-xs text-slate-500">{k}</dt>
                  <dd className="mt-1 text-base font-semibold tabular-nums">{v}</dd>
                </div>
              ))}
            </dl>

            <div className="border-t border-slate-200 p-6">
              {status === "ok" ? (
                <div role="status" className="rounded-xl bg-[#35aa8a]/10 p-4 text-sm text-[#14654f]">
                  <p className="font-semibold">Proposta solicitada.</p>
                  <p className="mt-1">
                    Nossa equipe comercial entra em contato em até 1 dia útil.
                    {protocolo && (
                      <>
                        {" "}Protocolo: <strong>{protocolo}</strong>.
                      </>
                    )}
                  </p>
                  <Link
                    href="/comercial/comercial"
                    className="mt-3 inline-flex rounded-lg bg-[#35aa8a] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2c937a]"
                  >
                    Ver minhas cotações
                  </Link>
                </div>
              ) : (
                <form onSubmit={enviar} className="space-y-3">
                  <h3 className="text-base font-semibold">Receba a proposta</h3>
                  <input
                    required
                    aria-label="Nome"
                    placeholder="Seu nome"
                    value={form.nome}
                    onChange={(e) => setForm({ ...form, nome: e.target.value })}
                    className={campo}
                  />
                  <input
                    required
                    aria-label="Empresa"
                    placeholder="Empresa"
                    value={form.empresa}
                    onChange={(e) => setForm({ ...form, empresa: e.target.value })}
                    className={campo}
                  />
                  <input
                    required
                    type="email"
                    aria-label="E-mail"
                    placeholder="E-mail"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={campo}
                  />
                  <input
                    required
                    type="tel"
                    aria-label="WhatsApp"
                    placeholder="WhatsApp com DDD"
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    className={campo}
                  />
                  <textarea
                    aria-label="O que você quer divulgar"
                    placeholder="O que você quer divulgar? (opcional)"
                    rows={3}
                    value={form.mensagem}
                    onChange={(e) => setForm({ ...form, mensagem: e.target.value })}
                    className={campo}
                  />
                  <button
                    type="submit"
                    disabled={status === "enviando" || semDados}
                    className="w-full rounded-lg bg-[#35aa8a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#2c937a] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#35aa8a] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {status === "enviando" ? "Enviando..." : "Solicitar proposta"}
                  </button>
                  {semDados && (
                    <p className="text-xs text-amber-700">Escolha um público e pelo menos um espaço.</p>
                  )}
                  {status === "erro" && (
                    <p role="alert" className="text-sm text-red-600">
                      Não foi possível enviar. Verifique os dados e tente de novo.
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}