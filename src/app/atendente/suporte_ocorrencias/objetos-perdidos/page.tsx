"use client";

import {
    ArrowLeft,
    CheckCircle2,
    FileText,
    Info,
    MapPin,
    PackageSearch,
    Paperclip,
    Send,
    ShieldCheck,
    X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
    ChangeEvent,
    FormEvent,
    useEffect,
    useRef,
    useState,
} from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";

const PROTOCOLO_STORAGE_KEY = "objetoPerdido_protocolo";
const PROTOCOLO_TTL_MS = 90 * 60 * 1000;

type ProtocoloSalvo = {
    protocolo: string;
    geradoEm: number;
};

type AnexoPreview = {
    file: File;
    url: string | null;
};

function gerarNumeroProtocolo() {
    const numero = Math.floor(100000 + Math.random() * 900000);
    const ano = new Date().getFullYear();

    return `OP-${ano}${numero}`;
}

function obterProtocolo(): string {
    if (typeof window === "undefined") {
        return "";
    }

    try {
        const raw = window.localStorage.getItem(
            PROTOCOLO_STORAGE_KEY
        );

        if (raw) {
            const salvo: ProtocoloSalvo = JSON.parse(raw);

            const agora = Date.now();
            const tempoDecorrido = agora - salvo.geradoEm;

            if (
                salvo.protocolo &&
                salvo.geradoEm &&
                tempoDecorrido < PROTOCOLO_TTL_MS
            ) {
                const protocoloLimpo = salvo.protocolo
                    .replace(/^OP-/, "")
                    .replace(/-/g, "");

                if (protocoloLimpo.length >= 10) {
                    return `OP-${protocoloLimpo}`;
                }
            }
        }
    } catch {
        // Ignora erro e gera novo protocolo.
    }

    const novoProtocolo = gerarNumeroProtocolo();

    const dados: ProtocoloSalvo = {
        protocolo: novoProtocolo,
        geradoEm: Date.now(),
    };

    window.localStorage.setItem(
        PROTOCOLO_STORAGE_KEY,
        JSON.stringify(dados)
    );

    return novoProtocolo;
}

function limparProtocoloSalvo() {
    if (typeof window === "undefined") {
        return;
    }

    try {
        window.localStorage.removeItem(
            PROTOCOLO_STORAGE_KEY
        );
    } catch {
        // Ignora erro ao limpar.
    }
}

function mascararTelefone(valor: string) {
    const numeros = valor.replace(/\D/g, "").slice(0, 11);

    if (numeros.length === 0) {
        return "";
    }

    if (numeros.length <= 2) {
        return `(${numeros}`;
    }

    if (numeros.length <= 7) {
        return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    }

    return `(${numeros.slice(0, 2)}) ${numeros.slice(
        2,
        7
    )}-${numeros.slice(7)}`;
}

function formatarTamanho(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Page() {
    const router = useRouter();

    const [enviando, setEnviando] = useState(false);
    const [enviado, setEnviado] = useState(false);
    const [protocolo, setProtocolo] = useState("");
    const [erroMaps, setErroMaps] = useState("");
    const [anexos, setAnexos] = useState<AnexoPreview[]>([]);

    const localInputRef = useRef<HTMLInputElement>(null);
    const anexosInputRef = useRef<HTMLInputElement>(null);

    const latitudeRef = useRef<HTMLInputElement>(null);
    const longitudeRef = useRef<HTMLInputElement>(null);

    // ============================================================
    // PROTOCOLO
    // ============================================================

    useEffect(() => {
        setProtocolo(obterProtocolo());
    }, []);

    // ============================================================
    // GOOGLE MAPS AUTOCOMPLETE
    // ============================================================

    useEffect(() => {
        let ativo = true;

        async function carregarGoogleMaps() {
            try {
                const apiKey =
                    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

                if (!apiKey) {
                    console.warn(
                        "NEXT_PUBLIC_GOOGLE_MAPS_API_KEY não configurada."
                    );

                    return;
                }

                if (!localInputRef.current) {
                    return;
                }

                setOptions({
                    key: apiKey,
                    v: "weekly",
                });

                const { Autocomplete } = await importLibrary(
                    "places"
                );

                if (!ativo || !localInputRef.current) {
                    return;
                }

                const autocomplete = new Autocomplete(
                    localInputRef.current,
                    {
                        componentRestrictions: {
                            country: "br",
                        },

                        fields: [
                            "formatted_address",
                            "geometry",
                            "name",
                        ],

                        types: [
                            "geocode",
                            "establishment",
                        ],
                    }
                );

                autocomplete.addListener(
                    "place_changed",
                    () => {
                        const place =
                            autocomplete.getPlace();

                        if (!localInputRef.current) {
                            return;
                        }

                        // Endereço
                        if (place.formatted_address) {
                            localInputRef.current.value =
                                place.formatted_address;
                        } else if (place.name) {
                            localInputRef.current.value =
                                place.name;
                        }

                        // Latitude
                        const latitude =
                            place.geometry?.location?.lat();

                        // Longitude
                        const longitude =
                            place.geometry?.location?.lng();

                        if (
                            latitude !== undefined &&
                            longitude !== undefined
                        ) {
                            if (latitudeRef.current) {
                                latitudeRef.current.value =
                                    String(latitude);
                            }

                            if (longitudeRef.current) {
                                longitudeRef.current.value =
                                    String(longitude);
                            }
                        }
                    }
                );
            } catch (error) {
                console.error(
                    "Erro ao carregar Google Maps:",
                    error
                );

                if (ativo) {
                    setErroMaps(
                        "Não foi possível carregar o preenchimento automático do endereço."
                    );
                }
            }
        }

        carregarGoogleMaps();

        return () => {
            ativo = false;
        };
    }, []);

    // ============================================================
    // ANEXOS (PRÉVIA)
    // ============================================================

    // Libera as URLs de objeto criadas para os previews sempre que
    // a lista de anexos mudar, evitando vazamento de memória.
    useEffect(() => {
        return () => {
            anexos.forEach((anexo) => {
                if (anexo.url) {
                    URL.revokeObjectURL(anexo.url);
                }
            });
        };
    }, [anexos]);

    function sincronizarInputAnexos(arquivos: File[]) {
        if (!anexosInputRef.current) {
            return;
        }

        const dataTransfer = new DataTransfer();

        arquivos.forEach((arquivo) => {
            dataTransfer.items.add(arquivo);
        });

        anexosInputRef.current.files = dataTransfer.files;
    }

    function handleAnexosChange(
        event: ChangeEvent<HTMLInputElement>
    ) {
        const arquivosSelecionados = Array.from(
            event.target.files ?? []
        );

        if (arquivosSelecionados.length === 0) {
            return;
        }

        // Libera previews antigos antes de gerar os novos.
        anexos.forEach((anexo) => {
            if (anexo.url) {
                URL.revokeObjectURL(anexo.url);
            }
        });

        const novosAnexos: AnexoPreview[] = arquivosSelecionados.map(
            (file) => ({
                file,
                url: file.type.startsWith("image/")
                    ? URL.createObjectURL(file)
                    : null,
            })
        );

        setAnexos(novosAnexos);
    }

    function removerAnexo(indice: number) {
        const anexoRemovido = anexos[indice];

        if (anexoRemovido?.url) {
            URL.revokeObjectURL(anexoRemovido.url);
        }

        const novosAnexos = anexos.filter(
            (_, i) => i !== indice
        );

        setAnexos(novosAnexos);

        sincronizarInputAnexos(
            novosAnexos.map((anexo) => anexo.file)
        );
    }

    // ============================================================
    // ENVIO
    // ============================================================

    async function enviarObjeto(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!protocolo) {
            alert(
                "Aguarde o protocolo ser gerado."
            );

            return;
        }

        setEnviando(true);

        try {
            const form = event.currentTarget;

            const formData = new FormData(form);

            formData.set(
                "protocolo",
                protocolo
            );

            const resposta = await fetch(
                "/api/objetos-perdidos",
                {
                    method: "POST",
                    body: formData,
                }
            );

            let resultado: {
                sucesso?: boolean;
                mensagem?: string;
            };

            try {
                resultado = await resposta.json();
            } catch {
                throw new Error(
                    "O servidor retornou uma resposta inválida."
                );
            }

            if (
                !resposta.ok ||
                !resultado.sucesso
            ) {
                throw new Error(
                    resultado.mensagem ||
                    "Não foi possível registrar a ocorrência."
                );
            }

            console.log(
                "Ocorrência registrada:",
                resultado
            );

            // Remove o protocolo salvo para que, ao registrar
            // uma nova ocorrência, um protocolo diferente seja gerado.
            limparProtocoloSalvo();

            anexos.forEach((anexo) => {
                if (anexo.url) {
                    URL.revokeObjectURL(anexo.url);
                }
            });

            setAnexos([]);

            setEnviado(true);
        } catch (error) {
            console.error(error);

            alert(
                error instanceof Error
                    ? error.message
                    : "Erro ao registrar a ocorrência."
            );
        } finally {
            setEnviando(false);
        }
    }

    // ============================================================
    // CONFIRMAÇÃO
    // ============================================================

    if (enviado) {
        return (
            <main className="min-h-screen">
                <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center px-4">
                    <div className="w-full overflow-hidden rounded-3xl bg-white shadow-xl shadow-slate-200/60">

                        <div className="h-2 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500" />

                        <div className="p-8 text-center sm:p-12">

                            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
                                <CheckCircle2
                                    size={42}
                                    strokeWidth={2}
                                    className="text-emerald-500"
                                />
                            </div>

                            <span className="mt-6 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-emerald-600">
                                Registro realizado
                            </span>

                            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
                                Objeto registrado com sucesso
                            </h1>

                            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">
                                Sua ocorrência foi registrada
                                e será analisada pela nossa
                                equipe de suporte. Caso tenhamos
                                novidades, entraremos em contato.
                            </p>

                            <div className="mx-auto mt-8 max-w-sm rounded-2xl border border-blue-100 bg-blue-50 p-6">

                                <p className="text-xs font-bold uppercase tracking-[0.15em] text-blue-600">
                                    Protocolo da ocorrência
                                </p>

                                <p className="mt-3 text-3xl font-black tracking-wider text-slate-900">
                                    {protocolo || "Gerando..."}
                                </p>

                                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                                    <ShieldCheck size={14} />
                                    Guarde este número para futuras consultas.
                                </div>

                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    router.push(
                                        "/atendente/suporte_ocorrencias"
                                    )
                                }
                                className="mt-8 inline-flex cursor-pointer items-center justify-center rounded-xl bg-[#00a99d] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#00a99d]/20 transition hover:bg-[#00958b]"
                            >
                                Voltar para Suporte e Ocorrências
                            </button>

                        </div>
                    </div>
                </div>
            </main>
        );
    }

    // ============================================================
    // FORMULÁRIO
    // ============================================================

    return (
        <main className="min-h-screen">

            {/* Estilo global para o dropdown de sugestões do Google Places
                (.pac-container é injetado pelo Google direto no <body>,
                por isso precisa de z-index alto para não ficar escondido
                atrás de outros elementos da página) */}
            <style jsx global>{`
                .pac-container {
                    z-index: 9999 !important;
                    margin-top: 4px;
                    border-radius: 0.75rem;
                    border: 1px solid #e2e8f0;
                    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
                    font-family: inherit;
                    overflow: hidden;
                }

                .pac-item {
                    padding: 10px 14px;
                    font-size: 0.875rem;
                    line-height: 1.4;
                    cursor: pointer;
                    border-top: 1px solid #f1f5f9;
                }

                .pac-item:first-child {
                    border-top: none;
                }

                .pac-item:hover {
                    background-color: #f8fafc;
                }

                .pac-item-query {
                    font-size: 0.875rem;
                    color: #0f172a;
                }

                .pac-matched {
                    font-weight: 600;
                }

                .pac-icon {
                    margin-top: 2px;
                }
            `}</style>

            {/* HEADER */}

            <div>
                <div className="mx-auto max-w-8xl">

                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="mb-5 inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-white transition hover:text-slate-900"
                    >
                        <ArrowLeft size={17} />
                        Voltar
                    </button>

                    <div className="flex items-start justify-between gap-6">

                        <div className="flex items-start gap-4">

                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-teal-600 shadow-lg shadow-blue-600/20">
                                <PackageSearch
                                    size={24}
                                    className="text-white"
                                />
                            </div>

                            <div>
                                <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                                    Objetos perdidos
                                </h1>

                                <p className="mt-0 max-w-2xl text-sm leading-6 text-white/80">
                                    Informe os detalhes do objeto perdido
                                    para facilitar sua localização e devolução.
                                </p>
                            </div>

                        </div>

                    </div>

                </div>
            </div>

            {/* CONTEÚDO */}

            <div className="mx-auto mt-5 max-w-8xl">

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

                    {/* FORMULÁRIO */}

                    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">

                        <div className="border-b border-slate-100 px-6 py-5 sm:px-8">

                            <div className="flex items-center justify-between gap-4">

                                <div>
                                    <h2 className="text-lg font-bold text-slate-900">
                                        Registrar ocorrência
                                    </h2>

                                    <p className="mt-0 text-sm text-slate-500">
                                        Preencha as informações abaixo.
                                    </p>
                                </div>
                            </div>

                        </div>

                        <form
                            onSubmit={enviarObjeto}
                            encType="multipart/form-data"
                            className="px-6 py-7 sm:px-8"
                        >

                            {/* ======================================================
                                1 - CONTATO
                            ======================================================= */}

                            <div>

                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600">
                                        1
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Dados de contato
                                        </h3>

                                        <p className="text-xs text-slate-400">
                                            Como podemos entrar em contato?
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                                    {/* NOME */}

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Nome
                                            <span className="ml-1 text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <input
                                            name="nome"
                                            type="text"
                                            required
                                            autoComplete="name"
                                            placeholder="Digite seu nome completo"
                                            className="w-full capitalize rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>

                                    {/* TELEFONE */}

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Telefone / WhatsApp
                                            <span className="ml-1 text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <input
                                            name="telefone"
                                            type="tel"
                                            required
                                            maxLength={15}
                                            autoComplete="tel"
                                            inputMode="numeric"
                                            placeholder="(00) 00000-0000"
                                            onChange={(event) => {
                                                event.currentTarget.value =
                                                    mascararTelefone(
                                                        event.currentTarget.value
                                                    );
                                            }}
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>

                                </div>

                            </div>

                            <div className="my-8 border-t border-slate-100" />

                            {/* ======================================================
                                2 - VIAGEM
                            ======================================================= */}

                            <div>

                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600">
                                        2
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Detalhes da viagem
                                        </h3>

                                        <p className="text-xs text-slate-400">
                                            Informe quando e onde o item foi perdido.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">

                                    {/* VIAGEM */}

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Número da viagem
                                        </label>

                                        <input
                                            name="viagem"
                                            type="text"
                                            placeholder="Se souber, informe"
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>

                                    {/* DATA */}

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Data da perda
                                            <span className="ml-1 text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <input
                                            name="data"
                                            type="date"
                                            required
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>

                                </div>

                                {/* LOCAL */}

                                <div className="mt-5">

                                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                                        <MapPin
                                            size={15}
                                            className="mr-1 inline text-slate-400"
                                        />

                                        Local provável da perda
                                    </label>

                                    <div className="relative">

                                        <input
                                            ref={localInputRef}
                                            name="local"
                                            type="text"
                                            autoComplete="off"
                                            placeholder="Digite o endereço ou local da perda..."
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 pr-12 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />

                                        <MapPin
                                            size={19}
                                            className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                                        />

                                    </div>

                                    {erroMaps && (
                                        <p className="mt-2 text-xs text-amber-600">
                                            {erroMaps}
                                        </p>
                                    )}

                                    {/* COORDENADAS */}

                                    <input
                                        ref={latitudeRef}
                                        type="hidden"
                                        name="latitude"
                                    />

                                    <input
                                        ref={longitudeRef}
                                        type="hidden"
                                        name="longitude"
                                    />

                                    <p className="mt-2 text-xs text-slate-400">
                                        Comece a digitar o local e selecione
                                        uma sugestão do Google Maps.
                                    </p>

                                </div>

                            </div>

                            <div className="my-8 border-t border-slate-100" />

                            {/* ======================================================
                                3 - OBJETO
                            ======================================================= */}

                            <div>

                                <div className="mb-5 flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600">
                                        3
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">
                                            Informações do objeto
                                        </h3>

                                        <p className="text-xs text-slate-400">
                                            Quanto mais detalhes, melhor.
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-5">

                                    {/* TIPO */}

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Tipo de objeto
                                            <span className="ml-1 text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <select
                                            name="tipo_objeto"
                                            required
                                            defaultValue=""
                                            className="w-full cursor-pointer rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        >
                                            <option value="" disabled>
                                                Selecione uma opção
                                            </option>

                                            <option value="celular">
                                                Celular
                                            </option>

                                            <option value="carteira">
                                                Carteira
                                            </option>

                                            <option value="documento">
                                                Documento
                                            </option>

                                            <option value="chaves">
                                                Chaves
                                            </option>

                                            <option value="bolsa">
                                                Bolsa / Mochila
                                            </option>

                                            <option value="eletronico">
                                                Eletrônico
                                            </option>

                                            <option value="vestuario">
                                                Roupa / Acessório
                                            </option>

                                            <option value="outros">
                                                Outro
                                            </option>
                                        </select>
                                    </div>

                                    {/* OBJETO */}

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Nome ou identificação do objeto
                                            <span className="ml-1 text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <input
                                            name="objeto"
                                            type="text"
                                            required
                                            placeholder="Ex.: iPhone preto, carteira marrom..."
                                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>

                                    {/* CARACTERÍSTICAS */}

                                    <div>
                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            Características do objeto
                                            <span className="ml-1 text-red-500">
                                                *
                                            </span>
                                        </label>

                                        <textarea
                                            name="caracteristicas"
                                            required
                                            rows={5}
                                            placeholder="Informe cor, marca, modelo, número de série, detalhes visuais e outras características."
                                            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                                        />
                                    </div>

                                    {/* ANEXOS */}

                                    <div>

                                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                                            <Paperclip
                                                size={15}
                                                className="mr-1 inline text-slate-400"
                                            />

                                            Foto ou documento
                                        </label>

                                        <div className="rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-5 transition hover:border-blue-300 hover:bg-blue-50/30">

                                            <input
                                                ref={anexosInputRef}
                                                name="anexos"
                                                type="file"
                                                multiple
                                                accept="image/*,.pdf"
                                                onChange={handleAnexosChange}
                                                className="block w-full cursor-pointer text-sm text-slate-500 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-white file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-slate-700 file:shadow-sm hover:file:bg-slate-100"
                                            />

                                            <p className="mt-3 text-xs text-slate-400">
                                                JPG, PNG ou PDF. Envie uma foto
                                                para facilitar a identificação.
                                            </p>

                                        </div>

                                        {/* PRÉVIA DOS ANEXOS */}

                                        {anexos.length > 0 && (
                                            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">

                                                {anexos.map((anexo, indice) => (
                                                    <div
                                                        key={`${anexo.file.name}-${anexo.file.lastModified}-${indice}`}
                                                        className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white"
                                                    >

                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removerAnexo(indice)
                                                            }
                                                            aria-label={`Remover ${anexo.file.name}`}
                                                            className="absolute right-1.5 top-1.5 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full bg-slate-900/70 text-white transition hover:bg-slate-900"
                                                        >
                                                            <X size={13} />
                                                        </button>

                                                        {anexo.url ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={anexo.url}
                                                                alt={anexo.file.name}
                                                                className="h-24 w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-24 w-full items-center justify-center bg-slate-50">
                                                                <FileText
                                                                    size={28}
                                                                    className="text-slate-400"
                                                                />
                                                            </div>
                                                        )}

                                                        <div className="px-2 py-1.5">
                                                            <p className="truncate text-xs font-medium text-slate-700">
                                                                {anexo.file.name}
                                                            </p>

                                                            <p className="text-[11px] text-slate-400">
                                                                {formatarTamanho(
                                                                    anexo.file.size
                                                                )}
                                                            </p>
                                                        </div>

                                                    </div>
                                                ))}

                                            </div>
                                        )}

                                    </div>

                                </div>

                            </div>

                            {/* ======================================================
                                BOTÕES
                            ======================================================= */}

                            <div className="mt-8 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">

                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="cursor-pointer rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                                >
                                    Cancelar
                                </button>

                                <button
                                    type="submit"
                                    disabled={enviando}
                                    className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#00a99d] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#00a99d]/20 transition hover:bg-[#00958b] disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <Send size={17} />

                                    {enviando
                                        ? "Registrando..."
                                        : "Registrar ocorrência"}
                                </button>

                            </div>

                        </form>

                    </section>

                    {/* ======================================================
                        LATERAL
                    ======================================================= */}

                    <aside className="space-y-5">

                        {/* PROTOCOLO */}

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                            <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                                    <ShieldCheck
                                        size={19}
                                        className="text-blue-600"
                                    />
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Seu protocolo
                                    </h3>

                                    <p className="text-xs text-slate-400">
                                        Guarde este número
                                    </p>
                                </div>

                            </div>

                            <div className="mt-5 rounded-xl bg-slate-50 px-4 py-4 text-center">
                                <p className="text-lg font-black tracking-wider text-slate-900">
                                    {protocolo || "Gerando..."}
                                </p>
                            </div>

                        </div>

                        {/* DICAS */}

                        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">

                            <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                                    <Info
                                        size={19}
                                        className="text-amber-600"
                                    />
                                </div>

                                <div>
                                    <h3 className="text-sm font-bold text-slate-900">
                                        Dicas para agilizar
                                    </h3>

                                    <p className="text-xs text-slate-400">
                                        Informações importantes
                                    </p>
                                </div>

                            </div>

                            <ul className="mt-5 space-y-2">

                                <li className="flex gap-3 text-sm leading-6 text-slate-500">
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />

                                    Informe cor, marca e características
                                    específicas do objeto.
                                </li>

                                <li className="flex gap-3 text-sm leading-6 text-slate-500">
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />

                                    Informe o número da viagem, se souber.
                                </li>

                                <li className="flex gap-3 text-sm leading-6 text-slate-500">
                                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />

                                    Uma foto pode ajudar nossa equipe a
                                    reconhecer o item.
                                </li>

                            </ul>

                        </div>

                        {/* DEPOIS DO REGISTRO */}

                        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6">

                            <div className="flex items-center gap-3">

                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                                    <ShieldCheck
                                        size={19}
                                        className="text-emerald-600"
                                    />
                                </div>

                                <h3 className="text-sm font-bold text-slate-900">
                                    Depois do registro
                                </h3>

                            </div>

                            <p className="mt-4 text-sm leading-6 text-slate-600">
                                Nossa equipe analisa a ocorrência e entra em
                                contato pelo telefone informado caso haja
                                novidades sobre o objeto.
                            </p>

                        </div>

                    </aside>

                </div>

            </div>
        </main>
    );
}