import { ArrowLeft, CircleAlert } from "lucide-react";
import { db } from "../../../../lib/db";
import RifaClient from "../RifaClient";
import Link from "next/link";

type Rifa = {
  id: number;
  numero_rifa: number;
  titulo: string;
  descricao: string | null;
  imagem: string | null;
  valor_numero: number;
  total_numeros: number;
  data_sorteio: string | null;
  status: "aberta" | "encerrada" | "sorteada";
};

type RifaNumero = {
  id: number;
  numero: number;
  nome_cliente: string | null;
  telefone: string | null;
  status: "disponivel" | "reservado" | "pago";
};

async function buscarRifa(id: number) {
  try {
    const [rifaRows] = await db.execute(
      `
        SELECT
          id,
          numero_rifa,
          titulo,
          descricao,
          imagem,
          valor_numero,
          total_numeros,
          data_sorteio,
          status
        FROM rifas
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    const rifas = rifaRows as Rifa[];

    const rifa = rifas[0] ?? null;

    if (!rifa) {
      return null;
    }

    const [numeroRows] = await db.execute(
      `
        SELECT
          id,
          numero,
          nome_cliente,
          status
        FROM rifa_numeros
        WHERE rifa_id = ?
        ORDER BY numero ASC
      `,
      [rifa.id]
    );

    const numeros = numeroRows as RifaNumero[];

    const reservados = numeros.filter(
      (item) => item.status === "reservado"
    ).length;

    const pagos = numeros.filter(
      (item) => item.status === "pago"
    ).length;

    const total = Number(rifa.total_numeros);

    const disponiveis = Math.max(
      total - reservados - pagos,
      0
    );

    const percentual =
      total > 0
        ? Math.round((pagos / total) * 100)
        : 0;

    let numerosFinais = numeros;

    if (numeros.length === 0 && total > 0) {
      numerosFinais = Array.from(
        { length: total },
        (_, index): RifaNumero => ({
          id: index + 1,
          numero: index + 1,
          nome_cliente: null,
          telefone: null,
          status: "disponivel",
        })
      );
    }

    return {
      rifa,
      numeros: numerosFinais,
      estatisticas: {
        disponiveis,
        reservados,
        pagos,
        total,
        percentual,
      },
    };
  } catch (error) {
    console.error("Erro ao buscar rifa:", error);

    return null;
  }
}

type RifaPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function RifaPage({
  params,
}: RifaPageProps) {

  const { id } = await params;

  const rifaId = Number(id);

  if (!Number.isInteger(rifaId) || rifaId <= 0) {
    return (
      <div className="flex w-full items-center justify-center px-4 py-20">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <CircleAlert className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="mt-5 mb-0 text-xl font-bold tracking-tight text-slate-900">
            Número da Rifa Inválido
          </h2>
          <p className="mx-auto my-3 mb-4 max-w-sm text-sm leading-5 text-slate-500">
            O número da rifa informado não é válido.
            Verifique o número e tente novamente.
          </p>
          <Link
            href="/diretor/rifa"
            className="mt-8 inline-flex items-center justify-center rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Link>
        </div>
      </div>
    );
  }

  const data = await buscarRifa(rifaId);

  if (!data) {
    return (
      <div className="flex w-full items-center justify-center px-4 py-20">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
            <CircleAlert className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="mt-5 mb-0 text-xl font-bold tracking-tight text-slate-900">
            Rifa Não Encontrada
          </h2>
          <p className="mx-auto my-3 mb-4 max-w-sm text-sm leading-5 text-slate-500">
            A rifa que você está tentando acessar não existe
            ou foi removida.
          </p>
          <Link href="/diretor/rifa"
            className="mt-8 cursor-pointer rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            <ArrowLeft className="mr-2 inline-block" /> Voltar
          </Link>
        </div>
      </div>
    );
  }

  return (
    <RifaClient
      rifa={data.rifa}
      numeros={data.numeros}
      estatisticas={data.estatisticas}
    />
  );
}
