import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db2 } from "../../../lib/db";

export const dynamic = "force-dynamic";

const TABELA = "fin_transacoes";

interface ResumoRow extends RowDataPacket {
  total_receitas: number | string;
  total_despesas: number | string;
  qtd_transacoes: number;
}

interface CategoriaRow extends RowDataPacket {
  categoria: string;
  tipo: "receita" | "despesa";
  total: number | string;
}

interface TransacaoRow extends RowDataPacket {
  id: number;
  descricao: string;
  tipo: "receita" | "despesa";
  valor: number | string;
  data: string;
  categoria: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inicio = searchParams.get("inicio");
    const fim = searchParams.get("fim");

    const where: string[] = [];
    const params: string[] = [];

    if (inicio) {
      where.push("`data` >= ?");
      params.push(inicio);
    }
    if (fim) {
      where.push("`data` <= ?");
      params.push(fim);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Totais gerais
    const [resumoRows] = await db2.query<ResumoRow[]>(
      `SELECT
         COALESCE(SUM(CASE WHEN tipo = 'receita' THEN valor END), 0) AS total_receitas,
         COALESCE(SUM(CASE WHEN tipo = 'despesa' THEN valor END), 0) AS total_despesas,
         COUNT(*) AS qtd_transacoes
       FROM ${TABELA}
       ${whereSql}`,
      params
    );

    // Totais por categoria
    const [categoriaRows] = await db2.query<CategoriaRow[]>(
      `SELECT
         COALESCE(categoria, 'Sem categoria') AS categoria,
         tipo,
         SUM(valor) AS total
       FROM ${TABELA}
       ${whereSql}
       GROUP BY categoria, tipo
       ORDER BY total DESC`,
      params
    );

    // Últimas transações
    const [ultimasRows] = await db2.query<TransacaoRow[]>(
      `SELECT id, descricao, tipo, valor,
              DATE_FORMAT(\`data\`, '%Y-%m-%d') AS data,
              categoria
       FROM ${TABELA}
       ${whereSql}
       ORDER BY \`data\` DESC, id DESC
       LIMIT 10`,
      params
    );

    const resumo = resumoRows[0];
    const totalReceitas = Number(resumo.total_receitas);
    const totalDespesas = Number(resumo.total_despesas);

    return NextResponse.json({
      periodo: { inicio, fim },
      totalReceitas,
      totalDespesas,
      saldo: totalReceitas - totalDespesas,
      quantidadeTransacoes: Number(resumo.qtd_transacoes),
      porCategoria: categoriaRows.map((c) => ({
        categoria: c.categoria,
        tipo: c.tipo,
        total: Number(c.total),
      })),
      ultimasTransacoes: ultimasRows.map((t) => ({
        ...t,
        valor: Number(t.valor),
      })),
    });
  } catch (error) {
    console.error("Erro em /api/financeiro/resumo:", error);
    return NextResponse.json(
      { error: "Erro ao buscar resumo financeiro" },
      { status: 500 }
    );
  }
}