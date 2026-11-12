"use client";

import { useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    BriefcaseBusiness,
    Building2,
    CalendarDays,
    CheckCircle2,
    Circle,
    CircleAlert,
    Eye,
    FileText,
    Globe,
    LoaderCircle,
    MapPin,
    Send,
    Wallet,
} from "lucide-react";

type CanalId = "portal" | "indeed" | "catho";

const CANAIS: {
    id: CanalId;
    nome: string;
    detalhe: string;
    tag: string;
}[] = [
    {
        id: "portal",
        nome: "Portal de carreiras",
        detalhe: "carrer.groupqueiros.com",
        tag: "Automático",
    },
    {
        id: "indeed",
        nome: "Indeed",
        detalhe: "Enviada pelo feed de vagas",
        tag: "Feed XML",
    },
    {
        id: "catho",
        nome: "Catho",
        detalhe: "Enviada pela API de vagas da Catho",
        tag: "Requer credenciais",
    },
];

const STATUS_CANAL: Record<string, string> = {
    publicada: "Publicada",
    feed: "Incluída no feed",
    pendente: "Aguardando integração",
    erro: "Falhou",
    ignorado: "Não selecionado",
};

const UFS = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS",
    "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
    "SP", "SE", "TO",
];

const CONTRATOS = ["Contrato de Trabalho Intermitente", "PJ", "Estágio", "Temporário", "Aprendiz"];
const MODALIDADES = ["Presencial", "Híbrido", "Remoto"];
const NIVEIS = ["Estágio", "Júnior", "Pleno", "Sênior", "Coordenação", "Gerência"];

const DESCRICAO_MIN = 100;

const moeda = (valor: number) =>
    valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const paraNumero = (valor: string) => {
    const n = Number(valor.replace(",", "."));
    return valor.trim() !== "" && Number.isFinite(n) ? n : null;
};


export default function NovaVagaPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(false);
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [resultado, setResultado] = useState<Record<string, string> | null>(null);
    const [erros, setErros] = useState<Record<string, string>>({});

    const [form, setForm] = useState({
        titulo: "",
        plataformas: "",
        tipo_contrato: "CLT",
        modalidade: "Presencial",
        nivel: "Pleno",
        cidade: "",
        uf: "SP",
        salario_min: "",
        salario_max: "",
        exibir_salario: false,
        descricao: "",
        requisitos: "",
        beneficios: "",
        data_inicio: "",
        data_fim: "",
        status: "aberta",
    });

    const [canais, setCanais] = useState<CanalId[]>(["portal"]);

    function atualizarCampo<K extends keyof typeof form>(
        campo: K,
        valor: (typeof form)[K]
    ) {
        setForm((anterior) => ({ ...anterior, [campo]: valor }));
        setErros((anterior) => {
            if (!anterior[campo as string]) return anterior;
            const { [campo as string]: _removido, ...resto } = anterior;
            return resto;
        });
    }

    function alternarCanal(id: CanalId) {
        setCanais((atual) =>
            atual.includes(id) ? atual.filter((c) => c !== id) : [...atual, id]
        );
        setErros((anterior) => {
            const { canais: _removido, ...resto } = anterior;
            return resto;
        });
    }

    const salarioMin = paraNumero(form.salario_min);
    const salarioMax = paraNumero(form.salario_max);

    const checklist = useMemo(
        () => [
            { label: "Nome da vaga", ok: form.titulo.trim().length >= 3 },
            { label: "Cidade e estado", ok: form.cidade.trim().length >= 2 },
            {
                label: `Descrição (mín. ${DESCRICAO_MIN} caracteres)`,
                ok: form.descricao.trim().length >= DESCRICAO_MIN,
            },
            { label: "Requisitos", ok: form.requisitos.trim().length > 0 },
            { label: "Canal de publicação", ok: canais.length > 0 },
        ],
        [form, canais]
    );

    const concluidos = checklist.filter((i) => i.ok).length;
    const progresso = Math.round((concluidos / checklist.length) * 100);

    function validar() {
        const e: Record<string, string> = {};

        if (form.titulo.trim().length < 3) {
            e.titulo = "Informe o nome da vaga (mínimo 3 caracteres).";
        }

        if (form.cidade.trim().length < 2) {
            e.cidade = "Informe a cidade. Indeed e Catho exigem a localização.";
        }

        if (form.descricao.trim().length < DESCRICAO_MIN) {
            e.descricao = `Descreva a vaga com pelo menos ${DESCRICAO_MIN} caracteres.`;
        }

        if (
            salarioMin !== null &&
            salarioMax !== null &&
            salarioMax < salarioMin
        ) {
            e.salario_max = "O salário máximo não pode ser menor que o mínimo.";
        }

        if (
            form.data_inicio &&
            form.data_fim &&
            form.data_fim < form.data_inicio
        ) {
            e.data_fim = "A data de encerramento não pode ser anterior à abertura.";
        }

        if (canais.length === 0) {
            e.canais = "Selecione pelo menos um canal de publicação.";
        }

        return e;
    }

    async function cadastrarVaga(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setErro("");
        setSucesso("");
        setResultado(null);

        const e = validar();
        setErros(e);

        if (Object.keys(e).length > 0) {
            setErro("Corrija os campos destacados para publicar a vaga.");
            return;
        }
        try {
            setLoading(true);

            const response = await fetch("/api/vagas", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Accept: "application/json",
                },
                body: JSON.stringify({
                    ...form,
                    salario_min: salarioMin,
                    salario_max: salarioMax,
                    canais,
                }),
            });

            let data: {
                message?: string;
                canais?: Record<string, string>;
            } = {};

            try {
                data = await response.json();
            } catch {
            }

            if (!response.ok) {
                throw new Error(
                    data.message || "Não foi possível cadastrar a vaga."
                );
            }

            setSucesso("Vaga cadastrada com sucesso!");
            setResultado(data.canais ?? null);
            setTimeout(() => {
                router.push("/diretor/rh");
                router.refresh();
            }, 2800);
        } catch (error) {
            setErro(
                error instanceof Error
                    ? error.message
                    : "Erro ao cadastrar a vaga."
            );
        } finally {
            setLoading(false);
        }
    }

    const inputClass = (campo?: string) =>
        `h-11 w-full rounded-xl border bg-white px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
            campo && erros[campo]
                ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
                : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/10"
        }`;

    const areaClass = (campo?: string) =>
        `w-full rounded-xl border bg-white px-4 py-3 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:ring-4 ${
            campo && erros[campo]
                ? "border-red-300 focus:border-red-400 focus:ring-red-500/10"
                : "border-slate-200 focus:border-teal-500 focus:ring-teal-500/10"
        }`;

    const bloqueado = loading || !!sucesso;

    return (
        <main className="min-h-screen pb-10 text-slate-800">
            <div className="mx-auto max-w-8xl">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
                            aria-label="Voltar"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div>
                            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                Abrir nova vaga
                            </h1>
                            <p className="mt-1 text-sm text-white">
                                Cadastre uma vez e publique no portal de carreiras, no
                                Indeed e na Catho.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={cadastrarVaga} noValidate>
                    <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_360px]">
                        <div className="space-y-6">
                            {erro && (
                                <div
                                    role="alert"
                                    className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                                >
                                    <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                                    {erro}
                                </div>
                            )}
                            {sucesso && (
                                <div
                                    role="status"
                                    className="rounded-xl border border-emerald-200 bg-emerald-50 p-4"
                                >
                                    <div className="flex items-center gap-3 text-sm font-semibold text-emerald-700">
                                        <CheckCircle2 className="h-5 w-5" />
                                        {sucesso}
                                    </div>

                                    {resultado && (
                                        <ul className="mt-3 space-y-1.5 border-t border-emerald-200 pt-3">
                                            {CANAIS.filter(
                                                (c) => resultado[c.id] && resultado[c.id] !== "ignorado"
                                            ).map((c) => (
                                                <li
                                                    key={c.id}
                                                    className="flex items-center justify-between text-xs text-emerald-800"
                                                >
                                                    <span className="font-medium">{c.nome}</span>
                                                    <span>
                                                        {STATUS_CANAL[resultado[c.id]] ?? resultado[c.id]}
                                                    </span>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            )}
                            <Secao
                                numero={1}
                                icon={<BriefcaseBusiness className="h-5 w-5" />}
                                titulo="Dados da vaga"
                                descricao="Como a oportunidade será identificada pelos candidatos"
                            >
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-6">
                                    <Campo
                                        id="titulo"
                                        label="Nome da vaga"
                                        obrigatorio
                                        erro={erros.titulo}
                                        className="md:col-span-6"
                                    >
                                        <input
                                            id="titulo"
                                            type="text"
                                            value={form.titulo}
                                            onChange={(e) => atualizarCampo("titulo", e.target.value)}
                                            placeholder="Ex.: Analista Administrativo"
                                            className={inputClass("titulo")}
                                            maxLength={255}
                                            aria-invalid={!!erros.titulo}
                                        />
                                    </Campo>

                                    <Campo
                                        id="plataformas"
                                        label="Departamento / Plataforma"
                                        className="md:col-span-3"
                                    >
                                        <div className="relative">
                                            <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <input
                                                id="plataformas"
                                                type="text"
                                                value={form.plataformas}
                                                onChange={(e) =>
                                                    atualizarCampo("plataformas", e.target.value)
                                                }
                                                placeholder="Ex.: Administrativo"
                                                className={`${inputClass()} pl-11`}
                                                maxLength={255}
                                            />
                                        </div>
                                    </Campo>

                                    <Campo id="nivel" label="Nível" className="md:col-span-3">
                                        <select
                                            id="nivel"
                                            value={form.nivel}
                                            onChange={(e) => atualizarCampo("nivel", e.target.value)}
                                            className={inputClass()}
                                        >
                                            {NIVEIS.map((n) => (
                                                <option key={n}>{n}</option>
                                            ))}
                                        </select>
                                    </Campo>

                                    <Campo
                                        id="tipo_contrato"
                                        label="Tipo de contrato"
                                        className="md:col-span-3"
                                    >
                                        <select
                                            id="tipo_contrato"
                                            value={form.tipo_contrato}
                                            onChange={(e) =>
                                                atualizarCampo("tipo_contrato", e.target.value)
                                            }
                                            className={inputClass()}
                                        >
                                            {CONTRATOS.map((c) => (
                                                <option key={c}>{c}</option>
                                            ))}
                                        </select>
                                    </Campo>

                                    <Campo
                                        id="modalidade"
                                        label="Modalidade"
                                        className="md:col-span-3"
                                    >
                                        <select
                                            id="modalidade"
                                            value={form.modalidade}
                                            onChange={(e) =>
                                                atualizarCampo("modalidade", e.target.value)
                                            }
                                            className={inputClass()}
                                        >
                                            {MODALIDADES.map((m) => (
                                                <option key={m}>{m}</option>
                                            ))}
                                        </select>
                                    </Campo>

                                    <Campo
                                        id="cidade"
                                        label="Cidade"
                                        obrigatorio
                                        erro={erros.cidade}
                                        className="md:col-span-4"
                                    >
                                        <div className="relative">
                                            <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                            <input
                                                id="cidade"
                                                type="text"
                                                value={form.cidade}
                                                onChange={(e) => atualizarCampo("cidade", e.target.value)}
                                                placeholder="Ex.: São Vicente"
                                                className={`${inputClass("cidade")} pl-11`}
                                                maxLength={100}
                                                aria-invalid={!!erros.cidade}
                                            />
                                        </div>
                                    </Campo>

                                    <Campo id="uf" label="Estado" className="md:col-span-2">
                                        <select
                                            id="uf"
                                            value={form.uf}
                                            onChange={(e) => atualizarCampo("uf", e.target.value)}
                                            className={inputClass()}
                                        >
                                            {UFS.map((uf) => (
                                                <option key={uf}>{uf}</option>
                                            ))}
                                        </select>
                                    </Campo>
                                </div>
                            </Secao>
                            <Secao
                                numero={2}
                                icon={<Wallet className="h-5 w-5" />}
                                titulo="Remuneração"
                                descricao="Opcional. Informar a faixa ajuda a atrair mais candidatos"
                            >
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                                    <Campo id="salario_min" label="Salário mínimo (R$)">
                                        <input
                                            id="salario_min"
                                            type="number"
                                            min="0"
                                            step="50"
                                            value={form.salario_min}
                                            onChange={(e) =>
                                                atualizarCampo("salario_min", e.target.value)
                                            }
                                            placeholder="0,00"
                                            className={inputClass()}
                                        />
                                    </Campo>

                                    <Campo
                                        id="salario_max"
                                        label="Salário máximo (R$)"
                                        erro={erros.salario_max}
                                    >
                                        <input
                                            id="salario_max"
                                            type="number"
                                            min="0"
                                            step="50"
                                            value={form.salario_max}
                                            onChange={(e) =>
                                                atualizarCampo("salario_max", e.target.value)
                                            }
                                            placeholder="0,00"
                                            className={inputClass("salario_max")}
                                            aria-invalid={!!erros.salario_max}
                                        />
                                    </Campo>

                                    <label className="flex cursor-pointer items-center gap-3 md:col-span-2">
                                        <input
                                            type="checkbox"
                                            checked={form.exibir_salario}
                                            onChange={(e) =>
                                                atualizarCampo("exibir_salario", e.target.checked)
                                            }
                                            className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-teal-600"
                                        />
                                        <span className="text-sm text-slate-700">
                                            Exibir a faixa salarial no anúncio
                                        </span>
                                    </label>
                                </div>
                            </Secao>
                            <Secao
                                numero={3}
                                icon={<FileText className="h-5 w-5" />}
                                titulo="Descrição do anúncio"
                                descricao="Este texto é publicado nos três canais"
                            >
                                <div className="space-y-5">
                                    <Campo
                                        id="descricao"
                                        label="Sobre a vaga"
                                        obrigatorio
                                        erro={erros.descricao}
                                        dica={`${form.descricao.trim().length} / mínimo de ${DESCRICAO_MIN} caracteres`}
                                    >
                                        <textarea
                                            id="descricao"
                                            rows={6}
                                            value={form.descricao}
                                            onChange={(e) =>
                                                atualizarCampo("descricao", e.target.value)
                                            }
                                            placeholder="Descreva as responsabilidades, o time e o dia a dia da função."
                                            className={areaClass("descricao")}
                                            aria-invalid={!!erros.descricao}
                                        />
                                    </Campo>
                                    <Campo
                                        id="requisitos"
                                        label="Requisitos"
                                        dica="Um requisito por linha."
                                    >
                                        <textarea
                                            id="requisitos"
                                            rows={4}
                                            value={form.requisitos}
                                            onChange={(e) =>
                                                atualizarCampo("requisitos", e.target.value)
                                            }
                                            placeholder={"Ensino médio completo\nExperiência com rotinas administrativas"}
                                            className={areaClass()}
                                        />
                                    </Campo>

                                    <Campo
                                        id="beneficios"
                                        label="Benefícios"
                                        dica="Um benefício por linha."
                                    >
                                        <textarea
                                            id="beneficios"
                                            rows={3}
                                            value={form.beneficios}
                                            onChange={(e) =>
                                                atualizarCampo("beneficios", e.target.value)
                                            }
                                            placeholder={"Vale-refeição\nPlano de saúde"}
                                            className={areaClass()}
                                        />
                                    </Campo>
                                </div>
                            </Secao>
                            <Secao
                                numero={4}
                                icon={<CalendarDays className="h-5 w-5" />}
                                titulo="Período de recrutamento"
                                descricao="A vaga deixa de aparecer nos canais após o encerramento"
                            >
                                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                                    <Campo id="data_inicio" label="Data de abertura">
                                        <input
                                            id="data_inicio"
                                            type="date"
                                            value={form.data_inicio}
                                            onChange={(e) =>
                                                atualizarCampo("data_inicio", e.target.value)
                                            }
                                            className={inputClass()}
                                        />
                                    </Campo>
                                    <Campo
                                        id="data_fim"
                                        label="Data de encerramento"
                                        erro={erros.data_fim}
                                    >
                                        <input
                                            id="data_fim"
                                            type="date"
                                            value={form.data_fim}
                                            min={form.data_inicio || undefined}
                                            onChange={(e) =>
                                                atualizarCampo("data_fim", e.target.value)
                                            }
                                            className={inputClass("data_fim")}
                                            aria-invalid={!!erros.data_fim}
                                        />
                                    </Campo>

                                    <Campo id="status" label="Status">
                                        <select
                                            id="status"
                                            value={form.status}
                                            onChange={(e) => atualizarCampo("status", e.target.value)}
                                            className={inputClass()}
                                        >
                                            <option value="aberta">Aberta</option>
                                            <option value="pausada">Pausada</option>
                                            <option value="encerrada">Encerrada</option>
                                        </select>
                                    </Campo>
                                </div>
                            </Secao>
                        </div>
                        <aside className="space-y-6 lg:sticky lg:top-6">
                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-black/10">
                                <div className="flex items-center gap-2">
                                    <Globe className="h-4 w-4 text-teal-600" />
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Canais de publicação
                                    </h2>
                                </div>
                                <fieldset className="mt-4 space-y-2">
                                    <legend className="sr-only">Onde publicar</legend>
                                    {CANAIS.map((canal) => {
                                        const ativo = canais.includes(canal.id);
                                        return (
                                            <label
                                                key={canal.id}
                                                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${
                                                    ativo
                                                        ? "border-teal-500 bg-teal-50/60"
                                                        : "border-slate-200 hover:bg-slate-50"
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={ativo}
                                                    onChange={() => alternarCanal(canal.id)}
                                                    className="mt-1 h-4 w-4 cursor-pointer rounded border-slate-300 accent-teal-600"
                                                />

                                                <span className="min-w-0 flex-1">
                                                    <span className="flex items-center justify-between gap-2">
                                                        <span className="text-sm font-semibold text-slate-900">
                                                            {canal.nome}
                                                        </span>
                                                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                                                            {canal.tag}
                                                        </span>
                                                    </span>
                                                    <span className="mt-0.5 block text-xs text-slate-500">
                                                        {canal.detalhe}
                                                    </span>
                                                </span>
                                            </label>
                                        );
                                    })}
                                </fieldset>
                                {erros.canais && (
                                    <p role="alert" className="mt-2 text-xs text-red-600">
                                        {erros.canais}
                                    </p>
                                )}
                            </section>
                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-black/10">
                                <div className="flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-teal-600" />
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Pré-visualização
                                    </h2>
                                </div>
                                <div className="mt-4 rounded-xl border border-slate-200 p-4">
                                    <p className="text-base font-bold leading-snug text-slate-900">
                                        {form.titulo.trim() || "Nome da vaga"}
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {form.plataformas.trim() || "Departamento"}
                                        {" · "}
                                        {form.cidade.trim()
                                            ? `${form.cidade.trim()} - ${form.uf}`
                                            : "Localização"}
                                    </p>
                                    <div className="mt-3 flex flex-wrap gap-1.5">
                                        <Chip>{form.tipo_contrato}</Chip>
                                        <Chip>{form.modalidade}</Chip>
                                        <Chip>{form.nivel}</Chip>
                                    </div>
                                    {form.exibir_salario &&
                                        (salarioMin !== null || salarioMax !== null) && (
                                            <p className="mt-3 text-sm font-semibold text-slate-800">
                                                {salarioMin !== null && salarioMax !== null
                                                    ? `${moeda(salarioMin)} a ${moeda(salarioMax)}`
                                                    : salarioMin !== null
                                                      ? `A partir de ${moeda(salarioMin)}`
                                                      : `Até ${moeda(salarioMax as number)}`}
                                            </p>
                                        )}
                                    <p className="mt-3 line-clamp-4 text-xs leading-5 text-slate-600">
                                        {form.descricao.trim() ||
                                            "A descrição da vaga aparece aqui."}
                                    </p>
                                </div>
                            </section>

                            {/* CHECKLIST + AÇÕES */}

                            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xl shadow-black/10">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-sm font-bold text-slate-900">
                                        Antes de publicar
                                    </h2>
                                    <span className="text-xs font-semibold text-slate-500">
                                        {concluidos}/{checklist.length}
                                    </span>
                                </div>

                                <div
                                    role="progressbar"
                                    aria-valuemin={0}
                                    aria-valuemax={100}
                                    aria-valuenow={progresso}
                                    aria-label="Preenchimento da vaga"
                                    className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100"
                                >
                                    <div
                                        className="h-full rounded-full bg-teal-500 transition-all"
                                        style={{ width: `${progresso}%` }}
                                    />
                                </div>

                                <ul className="mt-4 space-y-2">
                                    {checklist.map((item) => (
                                        <li
                                            key={item.label}
                                            className="flex items-center gap-2 text-xs"
                                        >
                                            {item.ok ? (
                                                <CheckCircle2 className="h-4 w-4 text-teal-600" />
                                            ) : (
                                                <Circle className="h-4 w-4 text-slate-300" />
                                            )}
                                            <span
                                                className={
                                                    item.ok ? "text-slate-700" : "text-slate-400"
                                                }
                                            >
                                                {item.label}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                <div className="mt-5 flex flex-col gap-2">
                                    <button
                                        type="submit"
                                        disabled={bloqueado}
                                        className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 px-6 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {loading ? (
                                            <LoaderCircle className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Send className="h-4 w-4" />
                                        )}
                                        {loading ? "Publicando..." : "Publicar vaga"}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => router.push("/diretor/colaboradores")}
                                        disabled={loading}
                                        className="inline-flex h-11 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </section>
                        </aside>
                    </div>
                </form>

                <p className="mt-6 text-center text-[10px] text-white/50">
                    MAYLON · Gestão de Pessoas · Painel Administrativo
                </p>
            </div>
        </main>
    );
}

/* =========================================================
   COMPONENTES
========================================================= */

function Secao({
    numero,
    icon,
    titulo,
    descricao,
    children,
}: {
    numero: number;
    icon: ReactNode;
    titulo: string;
    descricao: string;
    children: ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-black/10">
            <div className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 sm:px-7">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
                    {icon}
                </div>

                <div className="min-w-0 flex-1">
                    <h2 className="text-sm font-bold text-slate-900">{titulo}</h2>
                    <p className="mt-0.5 text-xs text-slate-500">{descricao}</p>
                </div>

                <span
                    aria-hidden
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500"
                >
                    {numero}
                </span>
            </div>

            <div className="p-5 sm:p-7">{children}</div>
        </section>
    );
}

function Campo({
    id,
    label,
    obrigatorio,
    erro,
    dica,
    className = "",
    children,
}: {
    id: string;
    label: string;
    obrigatorio?: boolean;
    erro?: string;
    dica?: string;
    className?: string;
    children: ReactNode;
}) {
    return (
        <div className={className}>
            <label htmlFor={id} className="mb-2 block text-xs font-bold text-slate-700">
                {label}
                {obrigatorio && <span className="ml-0.5 text-red-500">*</span>}
            </label>

            {children}

            {erro ? (
                <p role="alert" className="mt-1.5 text-xs text-red-600">
                    {erro}
                </p>
            ) : (
                dica && <p className="mt-1.5 text-[11px] text-slate-400">{dica}</p>
            )}
        </div>
    );
}

function Chip({ children }: { children: ReactNode }) {
    return (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
            {children}
        </span>
    );
}