"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type TipoSolicitante = "passageiro" | "motorista";
type Solicitante = { id: string; full_name: string; email: string | null; phone: string | null };

const CATEGORIAS = [
  { v: "beneficio", l: "Benefício" },
  { v: "corrida", l: "Corrida" },
  { v: "pagamento", l: "Pagamento / carteira" },
  { v: "cadastro", l: "Cadastro" },
  { v: "entrega", l: "Entrega" },
  { v: "outro", l: "Outro" },
];

const PRIORIDADES = [
  { v: "baixa", l: "Baixa" },
  { v: "media", l: "Média" },
  { v: "alta", l: "Alta" },
];

const campo =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-[15px] text-slate-900 placeholder:text-slate-400 focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20";

function Rotulo({ children, erro }: { children: React.ReactNode; erro?: string }) {
  return (
    <div className="mb-1.5 flex items-baseline justify-between gap-2">
      <span className="text-sm font-medium text-slate-700">{children}</span>
      {erro && (
        <span role="alert" className="text-xs font-medium text-red-600">
          {erro}
        </span>
      )}
    </div>
  );
}

export default function NovoProtocoloPage() {
  const router = useRouter();

  const [tipo, setTipo] = useState<TipoSolicitante>("passageiro");
  const [busca, setBusca] = useState("");
  const [opcoes, setOpcoes] = useState<Solicitante[]>([]);
  const [aberto, setAberto] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [solicitante, setSolicitante] = useState<Solicitante | null>(null);

  const [assunto, setAssunto] = useState("");
  const [categoria, setCategoria] = useState("");
  const [prioridade, setPrioridade] = useState("media");
  const [descricao, setDescricao] = useState("");

  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState("");
  const [salvando, setSalvando] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (solicitante || busca.trim().length < 2) {
      setOpcoes([]);
      return;
    }
    setBuscando(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(
          `/api/protocolo/solicitantes?tipo=${tipo}&q=${encodeURIComponent(busca.trim())}`
        );
        const j = await r.json();
        setOpcoes(r.ok ? j.solicitantes ?? [] : []);
        setAberto(true);
      } catch {
        setOpcoes([]);
      } finally {
        setBuscando(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [busca, tipo, solicitante]);

  // Fecha a lista ao clicar fora
  useEffect(() => {
    const fora = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setAberto(false);
    };
    document.addEventListener("mousedown", fora);
    return () => document.removeEventListener("mousedown", fora);
  }, []);

  function trocarTipo(t: TipoSolicitante) {
    setTipo(t);
    setSolicitante(null);
    setBusca("");
    setOpcoes([]);
  }

  function validar() {
    const e: Record<string, string> = {};
    if (!solicitante) e.solicitante = "Selecione o solicitante";
    if (assunto.trim().length < 5) e.assunto = "Mínimo de 5 caracteres";
    if (!categoria) e.categoria = "Escolha uma categoria";
    if (descricao.trim().length < 10) e.descricao = "Descreva com mais detalhes";
    setErros(e);
    return Object.keys(e).length === 0;
  }

  async function salvar(ev: React.FormEvent) {
    ev.preventDefault();
    setErroGeral("");
    if (!validar()) return;
    setSalvando(true);
    try {
      const r = await fetch("/api/protocolo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          solicitante_id: solicitante!.id,
          solicitante_tipo: tipo,
          assunto: assunto.trim(),
          categoria,
          prioridade,
          descricao: descricao.trim(),
        }),
      });
      const j = await r.json();
      if (!r.ok) {
        setErroGeral(j.erro ?? "Não foi possível criar o protocolo.");
        return;
      }
      router.push(`/protocolo/${j.id}`);
    } catch {
      setErroGeral("Sem conexão. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-8xl">
        <header className="mb-6 text-white">
          <Link
            href="/protocolos"
            className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-white/90 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Voltar para protocolos
          </Link>
          <p className="mt-4 text-sm text-white/90">Central de Atendimento</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Novo protocolo</h1>
          <p className="mt-1 text-sm text-white/90">
            Registre a solicitação de um passageiro ou motorista.
          </p>
        </header>
        <form onSubmit={salvar} noValidate className="grid gap-5 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6 rounded-2xl bg-white p-5 shadow-sm sm:p-8">
            <section aria-labelledby="sec-solicitante">
              <h2 id="sec-solicitante" className="text-base font-semibold text-slate-900">
                Solicitante
              </h2>
              <div
                role="radiogroup"
                aria-label="Tipo de solicitante"
                className="mt-3 cursor-pointer inline-flex rounded-xl bg-slate-100 p-1"
              >
                {(["passageiro", "motorista"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={tipo === t}
                    onClick={() => trocarTipo(t)}
                    className={`rounded-lg cursor-pointer px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 ${
                      tipo === t
                        ? "bg-white text-emerald-800 shadow-sm"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {t === "passageiro" ? "Passageiro" : "Motorista"}
                  </button>
                ))}
              </div>
              <div className="relative mt-4" ref={caixa}>
                <Rotulo erro={erros.solicitante}>Buscar por nome, e-mail ou telefone</Rotulo>
                {solicitante ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{solicitante.full_name}</p>
                      <p className="truncate text-sm text-slate-600">
                        {[solicitante.email, solicitante.phone].filter(Boolean).join(" · ") ||
                          "Sem contato cadastrado"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSolicitante(null);
                        setBusca("");
                      }}
                      className="ml-3 shrink-0 rounded-md text-sm font-medium text-emerald-800 underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                    >
                      Trocar
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      value={busca}
                      onChange={(e) => setBusca(e.target.value)}
                      onFocus={() => opcoes.length && setAberto(true)}
                      placeholder={`Digite para buscar ${
                        tipo === "passageiro" ? "um passageiro" : "um motorista"
                      }...`}
                      className={campo}
                      autoComplete="off"
                      role="combobox"
                      aria-expanded={aberto}
                      aria-controls="lista-solicitantes"
                    />
                    {aberto && busca.trim().length >= 2 && (
                      <ul
                        id="lista-solicitantes"
                        role="listbox"
                        className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg"
                      >
                        {buscando && <li className="px-4 py-3 text-sm text-slate-500">Buscando...</li>}
                        {!buscando && opcoes.length === 0 && (
                          <li className="px-4 py-3 text-sm text-slate-500">
                            Nenhum resultado para essa busca.
                          </li>
                        )}
                        {opcoes.map((o) => (
                          <li key={o.id} role="option" aria-selected={false}>
                            <button
                              type="button"
                              onClick={() => {
                                setSolicitante(o);
                                setAberto(false);
                              }}
                              className="block w-full px-4 py-2.5 text-left hover:bg-emerald-50 focus:bg-emerald-50 focus:outline-none"
                            >
                              <span className="block text-[15px] font-medium text-slate-900">
                                {o.full_name}
                              </span>
                              <span className="block text-sm text-slate-500">
                                {[o.email, o.phone].filter(Boolean).join(" · ")}
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                )}
              </div>
            </section>
            <hr className="border-slate-100" />
            <section aria-labelledby="sec-solicitacao" className="space-y-5">
              <h2 id="sec-solicitacao" className="text-base font-semibold text-slate-900">
                Solicitação
              </h2>
              <label className="block">
                <Rotulo erro={erros.assunto}>Assunto</Rotulo>
                <input
                  value={assunto}
                  onChange={(e) => setAssunto(e.target.value)}
                  maxLength={150}
                  placeholder="Ex.: Solicitação Seguro de Vida"
                  className={campo}
                />
              </label>
              <label className="block">
                <Rotulo erro={erros.descricao}>Descrição</Rotulo>
                <textarea
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                  rows={6}
                  maxLength={5000}
                  placeholder="O que o solicitante pediu e o que já foi verificado."
                  className={`${campo} resize-y`}
                />
              </label>
            </section>
          </div>
          <aside className="h-fit space-y-5 rounded-2xl bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-6">
            <h2 className="text-base font-semibold text-slate-900">Classificação</h2>
            <label className="block">
              <Rotulo erro={erros.categoria}>Categoria</Rotulo>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={campo}>
                <option value="">Selecione</option>
                {CATEGORIAS.map((c) => (
                  <option key={c.v} value={c.v}>
                    {c.l}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <Rotulo>Prioridade</Rotulo>
              <select value={prioridade} onChange={(e) => setPrioridade(e.target.value)} className={campo}>
                {PRIORIDADES.map((p) => (
                  <option key={p.v} value={p.v}>
                    {p.l}
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" aria-hidden="true" />
              <span>
                O protocolo será criado como <strong className="font-semibold">Aberto</strong>.
              </span>
            </div>
            {erroGeral && (
              <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                {erroGeral}
              </p>
            )}
            <div className="flex flex-col gap-2 pt-1">
              <button
                type="submit"
                disabled={salvando}
                className="rounded-xl bg-[#0B4A45] px-5 py-3 text-[15px] font-semibold text-white transition-colors hover:bg-[#083A36] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0B4A45] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {salvando ? "Criando..." : "Criar protocolo"}
              </button>
              <Link
                href="/protocolos"
                className="rounded-xl border border-slate-200 px-5 py-3 text-center text-[15px] font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
              >
                Cancelar
              </Link>
            </div>
          </aside>
        </form>
      </div>
    </main>
  );
}