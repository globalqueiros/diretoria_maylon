"use client";

import {
    ChangeEvent,
    FormEvent,
    useEffect,
    useState,
} from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Eye,
    ImagePlus,
    Loader2,
    Package,
    Save,
    Trash2,
    X,
} from "lucide-react";

interface Produto {
    id: number;
    codigo: string;
    nome: string;
    descricao: string;
    categoria: string;
    estoque: number;
    estoque_minimo: number;
    preco: number;
    promocao?: number;
    imagem_principal?: string | null;
    imagem_2?: string | null;
    imagem_3?: string | null;
    imagem_4?: string | null;
}

type CampoImagem =
    | "imagem_principal"
    | "imagem_2"
    | "imagem_3"
    | "imagem_4";

interface NovaImagem {
    file: File;
    preview: string;
}

const CAMPOS_IMAGEM: CampoImagem[] = [
    "imagem_principal",
    "imagem_2",
    "imagem_3",
    "imagem_4",
];

const NOMES_IMAGEM: Record<CampoImagem, string> = {
    imagem_principal: "Imagem principal",
    imagem_2: "Imagem 2",
    imagem_3: "Imagem 3",
    imagem_4: "Imagem 4",
};

export default function EditarProdutoPage() {
    const params = useParams<{ codigo: string }>();
    const router = useRouter();
    const codigo = decodeURIComponent(params.codigo);

    const [produto, setProduto] = useState<Produto | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [novasImagens, setNovasImagens] = useState<
        Partial<Record<CampoImagem, NovaImagem>>
    >({});
    const [imagensRemover, setImagensRemover] = useState<CampoImagem[]>([]);
    const [imagemVisualizacao, setImagemVisualizacao] = useState<string | null>(null);
    const [nomeImagemVisualizacao, setNomeImagemVisualizacao] = useState("");

    useEffect(() => {
        return () => {
            Object.values(novasImagens).forEach((imagem) => {
                if (imagem?.preview) {
                    URL.revokeObjectURL(imagem.preview);
                }
            });
        };
    }, [novasImagens]);

    useEffect(() => {
        async function carregarProduto() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `/api/store/produtos/${encodeURIComponent(codigo)}`,
                    {
                        cache: "no-store",
                    }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(
                        data?.message || "Produto não encontrado."
                    );
                }

                const produtoRecebido = data.produto;

                setProduto({
                    ...produtoRecebido,
                    estoque: Number(produtoRecebido.estoque ?? 0),
                    estoque_minimo: Number(
                        produtoRecebido.estoque_minimo ?? 0
                    ),
                    preco: Number(produtoRecebido.preco ?? 0),
                    promocao:
                        produtoRecebido.promocao === null ||
                        produtoRecebido.promocao === undefined
                            ? 0
                            : Number(produtoRecebido.promocao),
                });
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Erro ao carregar produto."
                );
            } finally {
                setLoading(false);
            }
        }

        if (codigo) {
            carregarProduto();
        }
    }, [codigo]);

    function handleChange(
        campo: keyof Produto,
        valor: string | number
    ) {
        setProduto((prev) =>
            prev
                ? {
                      ...prev,
                      [campo]: valor,
                  }
                : prev
        );
    }

    function selecionarImagem(
        campo: CampoImagem,
        e: ChangeEvent<HTMLInputElement>
    ) {
        const arquivo = e.target.files?.[0];

        if (!arquivo) {
            return;
        }

        const formatosPermitidos = [
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
        ];

        if (!formatosPermitidos.includes(arquivo.type)) {
            setError(
                "Formato de imagem inválido. Use JPG, PNG, WEBP ou GIF."
            );
            e.target.value = "";
            return;
        }

        const tamanhoMaximo = 10 * 1024 * 1024;

        if (arquivo.size > tamanhoMaximo) {
            setError(
                "A imagem é muito grande. O tamanho máximo permitido é 10 MB."
            );
            e.target.value = "";
            return;
        }

        setError("");

        const preview = URL.createObjectURL(arquivo);

        setNovasImagens((prev) => ({
            ...prev,
            [campo]: {
                file: arquivo,
                preview,
            },
        }));

        setImagensRemover((prev) =>
            prev.filter((item) => item !== campo)
        );

        e.target.value = "";
    }

    function removerImagem(campo: CampoImagem) {
        const novaImagem = novasImagens[campo];

        if (novaImagem) {
            URL.revokeObjectURL(novaImagem.preview);

            setNovasImagens((prev) => {
                const copia = { ...prev };
                delete copia[campo];
                return copia;
            });
        }

        if (produto?.[campo]) {
            setImagensRemover((prev) => {
                if (prev.includes(campo)) {
                    return prev;
                }

                return [...prev, campo];
            });
        }
    }

    function cancelarRemocao(campo: CampoImagem) {
        setImagensRemover((prev) =>
            prev.filter((item) => item !== campo)
        );
    }

    function visualizarImagem(imagem: string, nome: string) {
        setImagemVisualizacao(imagem);
        setNomeImagemVisualizacao(nome);
    }

    function fecharVisualizacao() {
        setImagemVisualizacao(null);
        setNomeImagemVisualizacao("");
    }

    async function handleSubmit(
        e: FormEvent<HTMLFormElement>
    ) {
        e.preventDefault();

        if (!produto) {
            return;
        }

        try {
            setSaving(true);
            setError("");
            setMessage("");

            const formData = new FormData();

            formData.append("nome", produto.nome || "");
            formData.append(
                "descricao",
                produto.descricao || ""
            );
            formData.append(
                "categoria",
                produto.categoria || ""
            );
            formData.append(
                "estoque",
                String(produto.estoque ?? 0)
            );
            formData.append(
                "estoque_minimo",
                String(produto.estoque_minimo ?? 0)
            );
            formData.append(
                "preco",
                String(produto.preco ?? 0)
            );
            formData.append(
                "promocao",
                String(produto.promocao ?? 0)
            );

            Object.entries(novasImagens).forEach(
                ([campo, imagem]) => {
                    if (imagem) {
                        formData.append(campo, imagem.file);
                    }
                }
            );

            formData.append(
                "imagens_remover",
                JSON.stringify(imagensRemover)
            );

            const response = await fetch(
                `/api/store/produtos/${encodeURIComponent(codigo)}`,
                {
                    method: "PUT",
                    body: formData,
                }
            );

            const data = await response
                .json()
                .catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    data?.message ||
                        "Não foi possível salvar as alterações."
                );
            }

            setMessage("Produto atualizado com sucesso!");
            setNovasImagens({});
            setImagensRemover([]);

            setTimeout(() => {
                router.push(
                    `/diretor/maylon_store/${encodeURIComponent(
                        codigo
                    )}`
                );
            }, 1200);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Erro ao atualizar produto."
            );
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#40b99d] px-4">
                <div className="flex flex-col items-center gap-4 rounded-2xl bg-white px-8 py-7 shadow-xl">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#00a99d]/20 border-t-[#00a99d]" />
                    <p className="text-center text-sm font-medium text-[#102a43]">
                        Aguarde, carregando página...
                    </p>
                </div>
            </div>
        );
    }

    if (error && !produto) {
        return (
            <main className="min-h-screen bg-[#f5f8fa] px-4 py-8">
                <div className="mx-auto max-w-[1440px]">
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
                        <p className="font-semibold text-red-700">
                            {error}
                        </p>

                        <Link
                            href="/diretor/maylon_store"
                            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#08a99c] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#078f83]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Voltar para Store
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    if (!produto) {
        return null;
    }

    return (
        <main className="min-h-screen">
            <div className="mx-auto max-w-[1600px]">
                <div className="mb-6 overflow-hidden rounded-[28px] shadow-xl">
                    <div className="flex flex-col gap-5 px-5 py-6 sm:px-8 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-sm">
                                <Package className="h-6 w-6 text-white" />
                            </div>

                            <div>
                                <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                                    Editar produto
                                </h1>
                                <p className="mt-0 text-sm text-white/70">
                                    Atualize as informações e imagens do produto.
                                </p>
                            </div>
                        </div>

                        <Link
                            href={`/diretor/maylon_store/${encodeURIComponent(
                                produto.codigo
                            )}`}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-red-500 px-5 text-sm font-bold text-white transition hover:bg-red-600"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Cancelar
                        </Link>
                    </div>
                </div>

                {message && (
                    <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                        <section className="rounded-[24px] border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-6 py-5">
                                <h2 className="text-lg font-extrabold text-[#073b70]">
                                    Dados do produto
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Atualize as informações cadastradas.
                                </p>
                            </div>

                            <div className="grid gap-5 p-6 sm:grid-cols-2">
                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-[#073b70]">
                                        Código do produto
                                    </label>

                                    <div className="flex h-12 items-center rounded-xl border border-slate-200 bg-slate-50 px-4">
                                        <span className="font-mono text-sm font-bold text-[#078f83]">
                                            {produto.codigo}
                                        </span>
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-[#073b70]">
                                        Nome do produto
                                    </label>

                                    <input
                                        type="text"
                                        value={produto.nome || ""}
                                        onChange={(e) =>
                                            handleChange(
                                                "nome",
                                                e.target.value
                                            )
                                        }
                                        className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none transition focus:border-[#08a99c] focus:ring-4 focus:ring-[#08a99c]/10"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-[#073b70]">
                                        Categoria
                                    </label>

                                    <select
                                        value={produto.categoria || ""}
                                        onChange={(e) =>
                                            handleChange(
                                                "categoria",
                                                e.target.value
                                            )
                                        }
                                        className="h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-[#08a99c] focus:ring-4 focus:ring-[#08a99c]/10"
                                    >
                                        <option value="Coxim">Coxim</option>
                                        <option value="Suspensão e Direção">
                                            Suspensão e Direção
                                        </option>
                                        <option value="Direção">
                                            Direção
                                        </option>
                                        <option value="Câmbio">
                                            Câmbio
                                        </option>
                                        <option value="Filtros">
                                            Filtros
                                        </option>
                                        <option value="Freios">
                                            Freios
                                        </option>
                                        <option value="Cabos">
                                            Cabos
                                        </option>
                                        <option value="Elétrica">
                                            Elétrica
                                        </option>
                                        <option value="Ignição">
                                            Ignição
                                        </option>
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-[#073b70]">
                                        Preço
                                    </label>

                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#073b70]">
                                            R$
                                        </span>

                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={produto.preco}
                                            onChange={(e) =>
                                                handleChange(
                                                    "preco",
                                                    Number(e.target.value)
                                                )
                                            }
                                            className="h-12 w-full rounded-xl border border-slate-200 pl-12 pr-4 text-sm font-bold outline-none focus:border-[#08a99c] focus:ring-4 focus:ring-[#08a99c]/10"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-[#073b70]">
                                        Promoção
                                    </label>

                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-[#073b70]">
                                            R$
                                        </span>

                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={produto.promocao ?? 0}
                                            onChange={(e) =>
                                                handleChange(
                                                    "promocao",
                                                    Number(e.target.value)
                                                )
                                            }
                                            className="h-12 w-full rounded-xl border border-slate-200 pl-12 pr-4 text-sm font-bold outline-none focus:border-[#08a99c] focus:ring-4 focus:ring-[#08a99c]/10"
                                        />
                                    </div>
                                </div>

                                <div className="sm:col-span-2">
                                    <label className="mb-2 block text-sm font-bold text-[#073b70]">
                                        Descrição
                                    </label>

                                    <textarea
                                        rows={7}
                                        value={produto.descricao || ""}
                                        onChange={(e) =>
                                            handleChange(
                                                "descricao",
                                                e.target.value
                                            )
                                        }
                                        className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#08a99c] focus:ring-4 focus:ring-[#08a99c]/10"
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="h-fit rounded-[24px] border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-200 px-6 py-5">
                                <h2 className="text-lg font-extrabold text-[#073b70]">
                                    Estoque
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Controle a disponibilidade.
                                </p>
                            </div>

                            <div className="space-y-5 p-6">
                                <div>
                                    <label className="mb-2 block text-sm font-bold text-[#073b70]">
                                        Estoque atual
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        value={produto.estoque}
                                        onChange={(e) =>
                                            handleChange(
                                                "estoque",
                                                Number(e.target.value)
                                            )
                                        }
                                        className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#08a99c]"
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-bold text-[#073b70]">
                                        Estoque mínimo
                                    </label>

                                    <input
                                        type="number"
                                        min="0"
                                        value={produto.estoque_minimo}
                                        onChange={(e) =>
                                            handleChange(
                                                "estoque_minimo",
                                                Number(e.target.value)
                                            )
                                        }
                                        className="h-12 w-full rounded-xl border border-slate-200 px-4 text-sm outline-none focus:border-[#08a99c]"
                                    />
                                </div>

                                <div className="rounded-2xl bg-[#effbf8] p-4">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-[#078f83]">
                                        Código
                                    </p>
                                    <p className="mt-1 font-mono text-lg font-extrabold text-[#073b70]">
                                        {produto.codigo}
                                    </p>
                                </div>

                                {produto.imagem_principal && (
                                    <div>
                                        <p className="mb-2 text-sm font-bold text-[#073b70]">
                                            Imagem atual
                                        </p>

                                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50">
                                            <img
                                                src={produto.imagem_principal}
                                                alt={produto.nome}
                                                className="h-64 w-full object-cover"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    <section className="mt-6 overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
                        <div className="border-b border-slate-200 px-6 py-5">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <h2 className="text-lg font-extrabold text-[#073b70]">
                                        Imagens do produto
                                    </h2>
                                    <p className="mt-1 text-sm text-slate-500">
                                        A imagem principal permanece na primeira posição.
                                        Você pode substituir, remover ou adicionar imagens.
                                    </p>
                                </div>

                                <div className="rounded-xl bg-[#effbf8] px-4 py-2 text-xs font-bold text-[#078f83]">
                                    4 posições disponíveis
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
                            {CAMPOS_IMAGEM.map((campo) => {
                                const imagemAtual = produto[campo];
                                const novaImagem = novasImagens[campo];
                                const marcadaParaRemover =
                                    imagensRemover.includes(campo);

                                const imagemExibida =
                                    novaImagem?.preview ||
                                    (!marcadaParaRemover
                                        ? imagemAtual
                                        : null);

                                return (
                                    <div
                                        key={campo}
                                        className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                                    >
                                        <div className="flex min-h-[76px] items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                                            <div>
                                                <p className="text-sm font-extrabold text-[#073b70]">
                                                    {NOMES_IMAGEM[campo]}
                                                </p>

                                                {campo ===
                                                "imagem_principal" ? (
                                                    <span className="mt-1 inline-flex rounded-full bg-[#effbf8] px-2 py-1 text-[10px] font-bold uppercase text-[#078f83]">
                                                        Principal
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400">
                                                        Posição fixa
                                                    </span>
                                                )}
                                            </div>

                                            <ImagePlus className="h-5 w-5 text-[#08a99c]" />
                                        </div>

                                        <div className="relative flex h-56 items-center justify-center bg-slate-100">
                                            {imagemExibida ? (
                                                <img
                                                    src={imagemExibida}
                                                    alt={NOMES_IMAGEM[campo]}
                                                    className="h-full w-full object-contain p-3"
                                                />
                                            ) : (
                                                <div className="flex flex-col items-center justify-center px-4 text-center">
                                                    <ImagePlus className="mb-2 h-10 w-10 text-slate-300" />
                                                    <p className="text-sm font-semibold text-slate-400">
                                                        Nenhuma imagem
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        Adicione uma imagem
                                                    </p>
                                                </div>
                                            )}

                                            {novaImagem &&
                                                !marcadaParaRemover && (
                                                    <div className="absolute left-2 top-2 rounded-lg bg-[#08a99c] px-2 py-1 text-[10px] font-bold uppercase text-white shadow">
                                                        Nova imagem
                                                    </div>
                                                )}

                                            {marcadaParaRemover && (
                                                <div className="absolute inset-x-2 top-2 rounded-lg bg-red-500 px-2 py-2 text-center text-xs font-bold text-white shadow">
                                                    Será removida ao salvar
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-2 p-3">
                                            {imagemExibida &&
                                                !marcadaParaRemover && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            visualizarImagem(
                                                                imagemExibida,
                                                                NOMES_IMAGEM[campo]
                                                            )
                                                        }
                                                        className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-[#073b70] transition hover:bg-slate-100"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                        Visualizar
                                                    </button>
                                                )}

                                            <label className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#08a99c] text-sm font-bold text-white transition hover:bg-[#078f83]">
                                                <ImagePlus className="h-4 w-4" />
                                                {imagemExibida
                                                    ? "Escolher outra"
                                                    : "Adicionar imagem"}

                                                <input
                                                    type="file"
                                                    accept="image/jpeg,image/png,image/webp,image/gif"
                                                    className="hidden"
                                                    onChange={(e) =>
                                                        selecionarImagem(
                                                            campo,
                                                            e
                                                        )
                                                    }
                                                />
                                            </label>

                                            {imagemExibida &&
                                                !marcadaParaRemover && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            removerImagem(campo)
                                                        }
                                                        className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 text-sm font-bold text-red-600 transition hover:bg-red-100"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Remover imagem
                                                    </button>
                                                )}

                                            {marcadaParaRemover && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        cancelarRemocao(campo)
                                                    }
                                                    className="flex h-10 w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white text-sm font-bold text-slate-700 transition hover:bg-slate-100"
                                                >
                                                    <ArrowLeft className="h-4 w-4" />
                                                    Desfazer remoção
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mx-6 mb-6 rounded-2xl bg-[#effbf8] p-4">
                            <div className="flex gap-3">
                                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white">
                                    <ImagePlus className="h-4 w-4 text-[#08a99c]" />
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-[#078f83]">
                                        Gerenciamento de imagens
                                    </p>

                                    <p className="mt-1 text-xs leading-5 text-slate-600">
                                        A posição das imagens não será alterada.
                                        A primeira imagem continuará sendo a{" "}
                                        <strong>Imagem principal</strong>.
                                        Você pode substituir, remover ou adicionar
                                        imagens nas posições 2, 3 e 4.
                                        As alterações serão aplicadas somente ao clicar
                                        em <strong>Salvar alterações</strong>.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="mt-6 flex flex-col-reverse gap-3 pb-10 sm:flex-row sm:justify-end">
                        <Link
                            href={`/diretor/maylon_store/${encodeURIComponent(
                                produto.codigo
                            )}`}
                            className="inline-flex h-12 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-7 text-sm font-bold text-[#073b70] transition hover:bg-slate-50"
                        >
                            Cancelar
                        </Link>

                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#08a99c] px-8 text-sm font-bold text-white shadow-lg shadow-[#08a99c]/20 transition hover:bg-[#078f83] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {saving ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Salvando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Salvar alterações
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>

            {imagemVisualizacao && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) {
                            fecharVisualizacao();
                        }
                    }}
                >
                    <div className="relative flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                            <div>
                                <h2 className="font-bold text-[#073b70]">
                                    {nomeImagemVisualizacao}
                                </h2>
                                <p className="text-xs text-slate-500">
                                    Visualização da imagem
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={fecharVisualizacao}
                                className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                aria-label="Fechar"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="flex max-h-[calc(90vh-80px)] min-h-[400px] items-center justify-center overflow-auto bg-slate-100 p-6">
                            <img
                                src={imagemVisualizacao}
                                alt={nomeImagemVisualizacao}
                                className="max-h-[75vh] max-w-full object-contain"
                            />
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}