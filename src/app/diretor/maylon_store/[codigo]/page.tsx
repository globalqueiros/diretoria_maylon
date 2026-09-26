"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft,
    Pencil,
    Package,
    Boxes,
    Tag,
    FileText,
    ShoppingCart,
    Layers3,
    X,
    ZoomIn,
    ChevronDown,
    ChevronUp,
    CircleCheck,
    TriangleAlert,
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

export default function ProdutoPage() {
    const params = useParams<{ codigo: string }>();
    const codigo = decodeURIComponent(params.codigo);

    const [descricaoExpandida, setDescricaoExpandida] = useState(false);
    const [produto, setProduto] = useState<Produto | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [imagemAberta, setImagemAberta] = useState<string | null>(null);
    const [imagemSelecionada, setImagemSelecionada] = useState<string | null>(null);

    useEffect(() => {
        async function carregarProduto() {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(
                    `/api/store/produtos/${encodeURIComponent(codigo)}`,
                    { cache: "no-store" }
                );

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data?.message || "Produto não encontrado.");
                }

                setProduto(data.produto);

                if (data.produto?.imagem_principal) {
                    setImagemSelecionada(data.produto.imagem_principal);
                }
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

    useEffect(() => {
        function fecharComEsc(event: KeyboardEvent) {
            if (event.key === "Escape") {
                setImagemAberta(null);
            }
        }

        if (imagemAberta) {
            document.addEventListener("keydown", fecharComEsc);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", fecharComEsc);
            document.body.style.overflow = "";
        };
    }, [imagemAberta]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-4 rounded-3xl bg-white px-10 py-9 shadow-xl">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8faf7]">
                        <div className="h-7 w-7 animate-spin rounded-full border-4 border-[#08a99c]/20 border-t-[#08a99c]" />
                    </div>

                    <div className="text-center">
                        <p className="text-sm font-extrabold text-[#073b70]">
                            Carregando produto
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-400">
                            Aguarde um momento...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error || !produto) {
        return (
            <main className="min-h-screen">
                <div className="mx-auto max-w-8xl">
                    <div className="overflow-hidden rounded-[30px] border border-red-100 bg-white shadow-sm">
                        <div className="h-2 bg-red-500" />

                        <div className="p-8 sm:p-10">
                            <div className="flex flex-col items-start gap-5 sm:flex-row">
                                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50">
                                    <Package className="h-6 w-6 text-red-500" />
                                </div>

                                <div>
                                    <h2 className="text-xl font-extrabold text-slate-900">
                                        Produto não encontrado
                                    </h2>

                                    <p className="mt-2 text-sm leading-6 text-red-500">
                                        {error ||
                                            "Não foi possível encontrar o produto solicitado."}
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/diretor/maylon_store"
                                className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-[#08a99c] px-5 text-sm font-bold text-white transition hover:bg-[#078f84]"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Voltar para Store
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    const status =
        produto.estoque === 0
            ? "Sem estoque"
            : produto.estoque <= produto.estoque_minimo
              ? "Baixo estoque"
              : "Em estoque";

    const statusConfig =
        status === "Sem estoque"
            ? {
                  bg: "bg-red-50",
                  text: "text-red-600",
                  border: "border-red-100",
                  icon: TriangleAlert,
              }
            : status === "Baixo estoque"
              ? {
                    bg: "bg-amber-50",
                    text: "text-amber-600",
                    border: "border-amber-100",
                    icon: TriangleAlert,
                }
              : {
                    bg: "bg-emerald-50",
                    text: "text-emerald-600",
                    border: "border-emerald-100",
                    icon: CircleCheck,
                };

    const StatusIcon = statusConfig.icon;

    const imagens = [
        produto.imagem_principal,
        produto.imagem_2,
        produto.imagem_3,
        produto.imagem_4,
    ].filter(Boolean) as string[];

    const preco = Number(produto.preco ?? 0);
    const promocao = Number(produto.promocao ?? 0);

    const formatarPreco = (valor: number) =>
        valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });

    return (
        <>
            <main className="min-h-screen">
                <div className="mx-auto w-full max-w-8xl">
                    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <Link
                                href="/diretor/maylon_store"
                                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-900"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </Link>

                            <div>
                                <h1 className="mt-0.5 text-xl font-extrabold tracking-tight text-white">
                                    Detalhes do produto
                                </h1>
                            </div>
                        </div>

                        <Link
                            href={`/diretor/maylon_store/${encodeURIComponent(
                                produto.codigo
                            )}/editar`}
                            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#08a99c] px-5 text-sm font-bold text-white shadow-sm shadow-[#08a99c]/20 transition hover:bg-[#078f84]"
                        >
                            <Pencil className="h-4 w-4" />
                            Editar produto
                        </Link>
                    </div>

                    <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-sm">
                        <div className="grid lg:grid-cols-[55%_45%]">
                            <div className="bg-[#f7faf9] p-4 sm:p-6 lg:p-8">
                                <div className="grid gap-4 sm:grid-cols-[82px_minmax(0,1fr)]">
                                    <div className="order-2 flex gap-3 overflow-x-auto sm:order-1 sm:flex-col">
                                        {Array.from({ length: 4 }).map(
                                            (_, index) => {
                                                const imagem = imagens[index];

                                                return (
                                                    <button
                                                        key={index}
                                                        type="button"
                                                        disabled={!imagem}
                                                        onClick={() => {
                                                            if (imagem) {
                                                                setImagemSelecionada(
                                                                    imagem
                                                                );
                                                            }
                                                        }}
                                                        className={`relative h-[76px] w-[76px] shrink-0 overflow-hidden rounded-2xl border-2 bg-white transition ${
                                                            imagemSelecionada ===
                                                            imagem
                                                                ? "border-[#08a99c] shadow-md"
                                                                : "border-transparent hover:border-slate-200"
                                                        }`}
                                                    >
                                                        {imagem ? (
                                                            <img
                                                                src={imagem}
                                                                alt={`${produto.nome} - imagem ${
                                                                    index + 1
                                                                }`}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <Package className="mx-auto h-6 w-6 text-slate-200" />
                                                        )}
                                                    </button>
                                                );
                                            }
                                        )}
                                    </div>

                                    <div className="order-1">
                                        <button
                                            type="button"
                                            disabled={!imagemSelecionada}
                                            onClick={() =>
                                                imagemSelecionada &&
                                                setImagemAberta(
                                                    imagemSelecionada
                                                )
                                            }
                                            className="group relative block aspect-square w-full overflow-hidden rounded-[28px] bg-white shadow-sm"
                                        >
                                            {imagemSelecionada ? (
                                                <>
                                                    <img
                                                        src={imagemSelecionada}
                                                        alt={produto.nome}
                                                        className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.025]"
                                                    />

                                                    <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition group-hover:bg-black/20">
                                                        <div className="flex h-14 w-14 scale-90 items-center justify-center rounded-full bg-white/95 text-slate-900 opacity-0 shadow-xl transition group-hover:scale-100 group-hover:opacity-100">
                                                            <ZoomIn className="h-5 w-5" />
                                                        </div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="flex h-full items-center justify-center">
                                                    <Package className="h-28 w-28 text-slate-100" />
                                                </div>
                                            )}

                                            <div className="absolute left-5 top-5">
                                                <span
                                                    className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-extrabold shadow-sm ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                                                >
                                                    <StatusIcon className="h-3.5 w-3.5" />
                                                    {status}
                                                </span>
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center p-6 sm:p-8 lg:p-12">
                                <div className="mb-5 flex items-center gap-2">
                                    <span className="rounded-lg bg-[#eafaf7] px-3 py-1.5 text-xs font-extrabold uppercase tracking-wider text-[#08a99c]">
                                        {produto.categoria || "Sem categoria"}
                                    </span>

                                    <span className="font-mono text-xs font-bold text-slate-400">
                                        #{produto.codigo}
                                    </span>
                                </div>

                                <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-tight text-slate-950 sm:text-3xl">
                                    {produto.nome}
                                </h2>

                                <div className="mt-7 flex flex-wrap items-end gap-x-8 gap-y-5">
                                    <div>
                                        <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                                            Preço atual
                                        </p>

                                        <p className="text-3xl font-black tracking-tight text-slate-950">
                                            {formatarPreco(preco)}
                                        </p>
                                    </div>

                                    {promocao > 0 && (
                                        <div className="pb-1">
                                            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                                                Promoção
                                            </p>

                                            <p className="text-xl font-extrabold text-[#08a99c]">
                                                {formatarPreco(promocao)}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="my-8 h-px bg-slate-100" />

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                                                <Boxes className="h-5 w-5 text-[#08a99c]" />
                                            </div>

                                            <div>
                                                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                                    Estoque
                                                </p>

                                                <p className="text-xl font-black text-slate-900">
                                                    {produto.estoque}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm">
                                                <Layers3 className="h-5 w-5 text-[#08a99c]" />
                                            </div>

                                            <div>
                                                <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                                    Mínimo
                                                </p>

                                                <p className="text-xl font-black text-slate-900">
                                                    {produto.estoque_minimo}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 flex items-center gap-3 rounded-2xl border border-slate-100 bg-white">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eafaf7]">
                                        <ShoppingCart className="h-5 w-5 text-[#08a99c]" />
                                    </div>

                                    <div>
                                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                            Identificação
                                        </p>

                                        <p className="font-mono text-sm font-bold text-slate-800">
                                            Código {produto.codigo}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                            <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5 sm:px-7">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eafaf7]">
                                    <FileText className="h-5 w-5 text-[#08a99c]" />
                                </div>

                                <div>
                                    <h3 className="font-extrabold text-slate-900">
                                        Descrição
                                    </h3>

                                    <p className="text-sm text-slate-400">
                                        Informações adicionais do produto
                                    </p>
                                </div>
                            </div>

                            <div className="p-6 sm:p-7">
                                <div className="relative">
                                    <p
                                        className={`whitespace-pre-wrap text-sm leading-7 text-slate-600 transition-all ${
                                            descricaoExpandida
                                                ? ""
                                                : "max-h-[150px] overflow-hidden"
                                        }`}
                                    >
                                        {produto.descricao ||
                                            "Nenhuma descrição cadastrada."}
                                    </p>

                                    {!descricaoExpandida &&
                                        produto.descricao &&
                                        produto.descricao.length > 150 && (
                                            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-white to-transparent" />
                                        )}
                                </div>

                                {produto.descricao &&
                                    produto.descricao.length > 150 && (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setDescricaoExpandida(
                                                    (valor) => !valor
                                                )
                                            }
                                            className="mt-4 inline-flex cursor-pointer items-center gap-2 text-sm font-extrabold text-[#08a99c] transition hover:text-[#067f76]"
                                        >
                                            {descricaoExpandida ? (
                                                <>
                                                    <ChevronUp className="h-4 w-4" />
                                                    Ver menos
                                                </>
                                            ) : (
                                                <>
                                                    <ChevronDown className="h-4 w-4" />
                                                    Ver mais
                                                </>
                                            )}
                                        </button>
                                    )}
                            </div>
                        </section>

                        <section className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
                            <div className="border-b border-slate-100 px-6 py-5">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#eafaf7]">
                                        <Layers3 className="h-5 w-5 text-[#08a99c]" />
                                    </div>

                                    <div>
                                        <h3 className="font-extrabold text-slate-900">
                                            Resumo
                                        </h3>

                                        <p className="text-sm text-slate-400">
                                            Status e valores
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="divide-y divide-slate-100">
                                <div className="flex items-center justify-between px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <Boxes className="h-4 w-4 text-slate-400" />

                                        <span className="text-sm font-semibold text-slate-500">
                                            Estoque atual
                                        </span>
                                    </div>

                                    <span className="text-sm font-black text-slate-900">
                                        {produto.estoque} un.
                                    </span>
                                </div>

                                <div className="flex items-center justify-between px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <Package className="h-4 w-4 text-slate-400" />

                                        <span className="text-sm font-semibold text-slate-500">
                                            Estoque mínimo
                                        </span>
                                    </div>

                                    <span className="text-sm font-black text-slate-900">
                                        {produto.estoque_minimo} un.
                                    </span>
                                </div>

                                <div className="flex items-center justify-between px-6 py-5">
                                    <div className="flex items-center gap-3">
                                        <Tag className="h-4 w-4 text-slate-400" />

                                        <span className="text-sm font-semibold text-slate-500">
                                            Promoção
                                        </span>
                                    </div>

                                    <span className="text-sm font-black text-[#08a99c]">
                                        {promocao > 0
                                            ? formatarPreco(promocao)
                                            : "Sem promoção"}
                                    </span>
                                </div>

                                <div className="px-6 py-5">
                                    <div
                                        className={`flex items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-extrabold ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border}`}
                                    >
                                        <StatusIcon className="h-4 w-4" />
                                        {status}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </main>

            {imagemAberta && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 p-4 backdrop-blur-md sm:p-8"
                    onClick={() => setImagemAberta(null)}
                >
                    <button
                        type="button"
                        onClick={() => setImagemAberta(null)}
                        className="absolute right-4 top-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-7 sm:top-7"
                        aria-label="Fechar imagem"
                    >
                        <X className="h-6 w-6" />
                    </button>

                    <div
                        className="relative flex max-h-[92vh] max-w-[95vw] items-center justify-center"
                        onClick={(event) => event.stopPropagation()}
                    >
                        <img
                            src={imagemAberta}
                            alt={produto.nome}
                            className="max-h-[90vh] max-w-full rounded-2xl object-contain shadow-2xl"
                        />
                    </div>
                </div>
            )}
        </>
    );
}
