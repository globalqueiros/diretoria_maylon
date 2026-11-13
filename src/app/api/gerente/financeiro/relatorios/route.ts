import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../../../lib/db";
import { exigirPerfilNaApi } from "../../../../lib/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await exigirPerfilNaApi(["gerente", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [fluxoRows] = await db.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(data, '%Y-%m') AS mes,
              COALESCE(SUM(CASE WHEN LOWER(tipo) = 'receita' THEN valor ELSE 0 END), 0) AS entradas,
              COALESCE(SUM(CASE WHEN LOWER(tipo) <> 'receita' THEN valor ELSE 0 END), 0) AS saidas
         FROM fin_transacoes
        GROUP BY DATE_FORMAT(data, '%Y-%m')
        ORDER BY mes ASC`
    );

    const [setoresRows] = await db.query<RowDataPacket[]>(
      `SELECT COALESCE(NULLIF(categoria, ''), 'Sem setor') AS setor,
              COALESCE(SUM(valor), 0) AS valor
         FROM fin_transacoes
        WHERE LOWER(tipo) <> 'receita'
        GROUP BY COALESCE(NULLIF(categoria, ''), 'Sem setor')
        ORDER BY valor DESC`
    );

    const [folhaRows] = await db.query<RowDataPacket[]>(
      `SELECT competencia AS mes, COALESCE(SUM(total_liquido), 0) AS valor
         FROM folhas_pagamento
        GROUP BY competencia
        ORDER BY competencia ASC`
    );

    const fluxo = fluxoRows.map((row) => ({
      mes: String(row.mes ?? ""),
      entradas: Number(row.entradas ?? 0),
      saidas: Number(row.saidas ?? 0),
    }));

    const setores = setoresRows.map((row) => ({
      setor: String(row.setor ?? "Sem setor"),
      valor: Number(row.valor ?? 0),
    }));

    const folha = folhaRows.map((row) => ({
      mes: String(row.mes ?? ""),
      valor: Number(row.valor ?? 0),
    }));

    const resultado = fluxo.map((item) => ({
      mes: item.mes,
      valor: item.entradas - item.saidas,
    }));

    return NextResponse.json(
      { fluxo, setores, folha, resultado },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro GET /api/gerente/financeiro/relatorios:", error);
    return NextResponse.json(
      {
        error: "Não foi possível carregar os relatórios.",
        fluxo: [],
        setores: [],
        folha: [],
        resultado: [],
      },
      { status: 500 }
    );
  }
}
