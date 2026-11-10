"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  FileText,
  Headset,
  LifeBuoy,
  Lightbulb,
  ListChecks,
  Search,
  Settings,
  Smartphone,
  User,
} from "lucide-react";

type Categoria = "Todas" | "Protocolos" | "Atendimento" | "Conta e acesso" | "Sistema";

type Artigo = {
  pergunta: string;
  resposta: string;
  categoria: Exclude<Categoria, "Todas">;
};

const categorias: Categoria[] = ["Todas", "Protocolos", "Atendimento", "Conta e acesso", "Sistema"];

const acessosRapidos = [
  {
    titulo: "Protocolos",
    descricao: "Consulte, filtre e responda solicitações.",
    href: "/gerente/central_ajuda",
    icon: FileText,
  },
  {
    titulo: "Meu perfil",
    descricao: "Veja e atualize seus dados.",
    href: "/gerente/perfil",
    icon: User,
  },
  {
    titulo: "Configurações",
    descricao: "Notificações, senha e segurança.",
    href: "/gerente/configuracoes",
    icon: Settings,
  },
  {
    titulo: "Dispositivos",
    descricao: "Veja e encerre sessões ativas.",
    href: "/sessoes",
    icon: Smartphone,
  },
];

const passos = [
  {
    titulo: "Abra a lista de protocolos",
    texto: "Use a busca e os filtros de status, prioridade e tipo de solicitante para localizar o caso.",
  },
  {
    titulo: "Priorize o atendimento",
    texto: "Comece pelas prioridades altas e pelos protocolos mais antigos.",
  },
  {
    titulo: "Leia o histórico completo",
    texto: "Confira a solicitação e as respostas anteriores antes de escrever.",
  },
  {
    titulo: "Responda ao solicitante",
    texto: "Escreva uma resposta clara e envie. Na primeira resposta, o status muda para Pendente.",
  },
  {
    titulo: "Acompanhe e encerre",
    texto: "Quando a solicitação estiver resolvida, use o botão Encerrar atendimento.",
  },
];

const statusProtocolo = [
  { nome: "Aberto", texto: "Solicitação registrada, ainda sem resposta.", cor: "bg-emerald-500" },
  { nome: "Em andamento", texto: "Atendimento em análise pela equipe.", cor: "bg-yellow-500" },
  { nome: "Aguardando resposta", texto: "Depende de um retorno para continuar.", cor: "bg-sky-500" },
  { nome: "Pendente", texto: "Primeira resposta enviada. Acompanhe o retorno.", cor: "bg-amber-500" },
  { nome: "Encerrado", texto: "Atendimento finalizado. Não aceita novas respostas.", cor: "bg-slate-400" },
];

const boasPraticas = [
  "Leia o histórico completo antes de responder.",
  "Responda a cada ponto levantado pelo solicitante.",
  "Use linguagem clara, cordial e objetiva.",
  "Informe os próximos passos e prazos combinados.",
  "Nunca peça senhas ou dados sensíveis pelo protocolo.",
  "Encerre somente quando a solicitação estiver concluída.",
];

const artigos: Artigo[] = [
  {
    categoria: "Protocolos",
    pergunta: "Como respondo um protocolo?",
    resposta:
      "Abra o protocolo na lista, escreva no campo Responder solicitação (até 3.000 caracteres) e clique em Enviar resposta. A mensagem aparece na conversa como Equipe de atendimento.",
  },
  {
    categoria: "Protocolos",
    pergunta: "O que acontece quando envio a primeira resposta?",
    resposta:
      "O status do protocolo muda automaticamente para Pendente. Você pode continuar enviando novas respostas normalmente enquanto o protocolo não estiver encerrado.",
  },
  {
    categoria: "Protocolos",
    pergunta: "Como encerro um protocolo?",
    resposta:
      "No fim da página do protocolo, clique em Encerrar atendimento e confirme. Depois de encerrado, o protocolo não aceita novas respostas nem pode ter o status alterado. Encerre apenas após concluir o atendimento.",
  },
  {
    categoria: "Protocolos",
    pergunta: "Como encontro um protocolo na lista?",
    resposta:
      "Use a busca por número, assunto ou nome, e combine com os filtros de status, prioridade e tipo de solicitante. A lista é paginada e você pode escolher ver 10, 25 ou 50 linhas por página. Use Limpar filtros para recomeçar.",
  },
  {
    categoria: "Protocolos",
    pergunta: "Qual é a diferença entre as prioridades?",
    resposta:
      "Os protocolos têm prioridade Alta, Média ou Baixa. Atenda primeiro os de prioridade alta e, dentro de cada prioridade, os mais antigos.",
  },
  {
    categoria: "Atendimento",
    pergunta: "Como devo escrever uma boa resposta?",
    resposta:
      "Seja claro e cordial, responda a cada ponto da solicitação, explique o que foi feito e indique os próximos passos. Evite jargões internos e mensagens muito longas.",
  },
  {
    categoria: "Atendimento",
    pergunta: "Posso pedir dados pessoais ao solicitante?",
    resposta:
      "Peça apenas o que for necessário para resolver o caso. Nunca solicite senhas, códigos de verificação ou dados completos de cartão pelo protocolo.",
  },
  {
    categoria: "Atendimento",
    pergunta: "O que faço com um caso que foge da minha alçada?",
    resposta:
      "Registre no protocolo o que já foi apurado, informe o solicitante de que o caso será encaminhado e acione sua supervisora ou gerente com o número do protocolo.",
  },
  {
    categoria: "Conta e acesso",
    pergunta: "Como altero minha senha?",
    resposta:
      "Acesse Configurações, vá até a seção Segurança e preencha a senha atual, a nova senha e a confirmação. A nova senha precisa ter pelo menos 6 caracteres.",
  },
  {
    categoria: "Conta e acesso",
    pergunta: "Como vejo e encerro sessões em outros dispositivos?",
    resposta:
      "Em Configurações, na seção Dispositivos, clique em Seus dispositivos. Lá você vê as sessões ativas e pode encerrar as que não reconhece.",
  },
  {
    categoria: "Conta e acesso",
    pergunta: "Como funcionam as notificações?",
    resposta:
      "O sino no topo da tela mostra suas notificações. Clique em uma notificação para marcá-la como lida, ou use Marcar todas como lidas. As preferências ficam em Configurações.",
  },
  {
    categoria: "Sistema",
    pergunta: "A página não carregou ou apareceu um erro. O que faço?",
    resposta:
      "Use o botão Atualizar da própria página ou recarregue o navegador. Se o erro continuar, informe sua supervisora com o horário, a tela e o número do protocolo envolvido.",
  },
  {
    categoria: "Sistema",
    pergunta: "Fui desconectado sozinho. Por quê?",
    resposta:
      "A sessão tem validade limitada (7 dias) e também pode ser encerrada na tela de dispositivos. Entre novamente com seu acesso. Se acontecer com frequência, avise sua supervisora.",
  },
];

export default function CentralAjudaAtendentePage() {
  const [busca, setBusca] = useState("");
  const [categoria, setCategoria] = useState<Categoria>("Todas");
  const [aberto, setAberto] = useState<string | null>(artigos[0].pergunta);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return artigos.filter((artigo) => {
      const daCategoria = categoria === "Todas" || artigo.categoria === categoria;
      const daBusca =
        !termo ||
        artigo.pergunta.toLocaleLowerCase("pt-BR").includes(termo) ||
        artigo.resposta.toLocaleLowerCase("pt-BR").includes(termo);
      return daCategoria && daBusca;
    });
  }, [busca, categoria]);

  return (
    <div className="min-h-screen">
      <main className="w-full">
        <div className="max-w-[1600px] mx-auto space-y-4">
          <section className="bg-white rounded-2xl shadow-sm px-5 md:px-7 py-5">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#d8f7eb] flex items-center justify-center">
                  <LifeBuoy size={21} className="text-[#00a99d]" />
                </div>
                <div>
                  <h1 className="text-lg md:text-xl font-bold text-[#102a43]">
                    Central de ajuda
                  </h1>
                  <p className="text-xs md:text-sm text-[#607d94] mt-0.5">
                    Guias e orientações para o seu dia a dia no atendimento.
                  </p>
                </div>
              </div>
              <div className="relative w-full lg:max-w-md">
                <Search
                  size={16}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7890a4]"
                />
                <input
                  type="text"
                  value={busca}
                  onChange={(event) => {
                    setBusca(event.target.value);
                    setAberto(null);
                  }}
                  placeholder="Buscar por protocolo, senha, status..."
                  aria-label="Buscar na central de ajuda"
                  className="w-full h-11 rounded-xl border border-[#dfe7eb] bg-[#fbfcfd] pl-10 pr-4 text-sm text-[#102a43] outline-none transition placeholder:text-[#a3b1bb] focus:border-[#00a99d] focus:bg-white focus:ring-2 focus:ring-[#00a99d]/10"
                />
              </div>
            </div>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {acessosRapidos.map((item) => {
              const Icone = item.icon;
              return (
                <Link
                  key={item.titulo}
                  href={item.href}
                  className="group flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d8f7eb] text-[#00a99d] transition group-hover:bg-[#00a99d] group-hover:text-white">
                    <Icone size={20} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold text-[#102a43]">{item.titulo}</h2>
                    <p className="mt-0.5 text-xs text-[#607d94]">{item.descricao}</p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="shrink-0 text-[#7890a4] transition group-hover:text-[#00a99d]"
                  />
                </Link>
              );
            })}
          </section>

          <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <div className="px-5 md:px-6 py-4 border-b border-[#edf1f3]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#d8f7eb] flex items-center justify-center text-[#00a99d]">
                  <ListChecks size={18} />
                </div>
                <div>
                  <h2 className="text-sm md:text-base font-bold text-[#102a43]">
                    Como atender um protocolo
                  </h2>
                  <p className="text-[11px] md:text-xs text-[#607d94] mt-0.5">
                    O caminho recomendado, do primeiro contato até o encerramento.
                  </p>
                </div>
              </div>
            </div>
            <ol className="grid gap-4 p-5 md:p-6 sm:grid-cols-2 xl:grid-cols-5">
              {passos.map((passo, indice) => (
                <li
                  key={passo.titulo}
                  className="rounded-xl border border-[#e8eef2] bg-[#fbfcfd] p-4"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00a99d] text-sm font-bold text-white">
                    {indice + 1}
                  </span>
                  <h3 className="mt-3 text-sm font-bold text-[#102a43]">{passo.titulo}</h3>
                  <p className="mt-1.5 text-xs leading-5 text-[#607d94]">{passo.texto}</p>
                </li>
              ))}
            </ol>
          </section>

          <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
            <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-5 md:px-6 py-4 border-b border-[#edf1f3]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#d8f7eb] flex items-center justify-center text-[#00a99d]">
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <h2 className="text-sm md:text-base font-bold text-[#102a43]">
                      Perguntas frequentes
                    </h2>
                    <p className="text-[11px] md:text-xs text-[#607d94] mt-0.5">
                      {filtrados.length}{" "}
                      {filtrados.length === 1 ? "artigo encontrado" : "artigos encontrados"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 px-5 md:px-6 pt-5">
                {categorias.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setCategoria(item);
                      setAberto(null);
                    }}
                    aria-pressed={categoria === item}
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold transition cursor-pointer ${
                      categoria === item
                        ? "bg-[#00a99d] text-white"
                        : "border border-[#dfe7eb] text-[#607d94] hover:border-[#00a99d] hover:text-[#00a99d]"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>

              <div className="space-y-3 p-5 md:p-6">
                {filtrados.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-[#dfe7eb] px-4 py-10 text-center">
                    <Search size={26} className="mx-auto mb-2 text-[#a3b1bb]" />
                    <p className="text-sm font-semibold text-[#102a43]">
                      Nenhum artigo encontrado
                    </p>
                    <p className="mt-1 text-xs text-[#607d94]">
                      Tente outro termo ou escolha outra categoria.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setBusca("");
                        setCategoria("Todas");
                      }}
                      className="mt-3 text-xs font-semibold text-[#00a99d] hover:underline cursor-pointer"
                    >
                      Limpar busca
                    </button>
                  </div>
                ) : (
                  filtrados.map((artigo) => {
                    const expandido = aberto === artigo.pergunta;
                    return (
                      <div
                        key={artigo.pergunta}
                        className={`overflow-hidden rounded-xl border transition ${
                          expandido
                            ? "border-[#b7ece0] bg-[#f5fcf9]"
                            : "border-[#e8eef2] bg-white"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setAberto(expandido ? null : artigo.pergunta)}
                          aria-expanded={expandido}
                          className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left cursor-pointer"
                        >
                          <span className="text-sm font-semibold text-[#102a43]">
                            {artigo.pergunta}
                          </span>
                          <ChevronDown
                            size={17}
                            className={`shrink-0 text-[#7890a4] transition ${
                              expandido ? "rotate-180 text-[#00a99d]" : ""
                            }`}
                          />
                        </button>
                        {expandido && (
                          <div className="px-4 pb-4">
                            <p className="border-t border-[#e8eef2] pt-3 text-sm leading-6 text-[#486581]">
                              {artigo.resposta}
                            </p>
                            <span className="mt-3 inline-flex rounded-full bg-[#d8f7eb] px-3 py-1 text-[11px] font-semibold text-[#00877d]">
                              {artigo.categoria}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </section>

            <div className="space-y-4">
              <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-[#edf1f3]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#d8f7eb] flex items-center justify-center text-[#00a99d]">
                      <ClipboardList size={18} />
                    </div>
                    <h2 className="text-sm font-bold text-[#102a43]">Status dos protocolos</h2>
                  </div>
                </div>
                <ul className="divide-y divide-[#edf1f3]">
                  {statusProtocolo.map((item) => (
                    <li key={item.nome} className="flex items-start gap-3 px-5 py-3.5">
                      <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${item.cor}`} />
                      <div>
                        <p className="text-sm font-semibold text-[#102a43]">{item.nome}</p>
                        <p className="mt-0.5 text-xs leading-5 text-[#607d94]">{item.texto}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-[#edf1f3]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#d8f7eb] flex items-center justify-center text-[#00a99d]">
                      <Lightbulb size={18} />
                    </div>
                    <h2 className="text-sm font-bold text-[#102a43]">Boas práticas</h2>
                  </div>
                </div>
                <ul className="space-y-3 p-5">
                  {boasPraticas.map((item) => (
                    <li key={item} className="flex items-start gap-2.5">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#00a99d]" />
                      <span className="text-xs leading-5 text-[#486581]">{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>
          </div>

          <section className="rounded-2xl bg-white p-5 shadow-sm md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d8f7eb] text-[#00a99d]">
                  <Headset size={20} />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#102a43]">
                    Não encontrou o que procurava?
                  </h2>
                  <p className="mt-1 text-xs leading-5 text-[#607d94]">
                    Procure sua supervisora ou gerente e informe o número do protocolo e o que
                    você já tentou. Assim o retorno é mais rápido.
                  </p>
                </div>
              </div>
              <Link
                href="/gerente/central_ajuda"
                className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#00a99d] px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#008f85]"
              >
                Ir para os protocolos
                <ArrowRight size={15} />
              </Link>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}