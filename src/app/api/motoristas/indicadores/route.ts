import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db2 } from "../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const gerenteId = Number(new URL(request.url).searchParams.get("gerenteId"));

    if (!gerenteId) {
      return NextResponse.json({ error: "gerenteId obrigatório" }, { status: 400 });
    }

    const [rows] = await db2.query<RowDataPacket[]>(
      `SELECT
         SUM(is_active = 0) AS pendentes,
         SUM(DATE(created_at) = CURDATE()) AS enviados_hoje,
         SUM(is_active = 1 AND DATE(updated_at) = CURDATE()) AS aprovados_hoje,
         SUM(is_active = 1
             AND YEAR(updated_at) = YEAR(CURDATE())
             AND MONTH(updated_at) = MONTH(CURDATE())) AS aprovados_mes
       FROM users
       WHERE user_type = ? AND gerente = ?`,
      ["driver", gerenteId]
    );

    const r = rows[0];

    return NextResponse.json({
      pendentes: Number(r.pendentes) || 0,
      enviadosHoje: Number(r.enviados_hoje) || 0,
      aprovadosHoje: Number(r.aprovados_hoje) || 0,
      aprovadosMes: Number(r.aprovados_mes) || 0,
    });
  } catch (error) {
    console.error("Erro em /api/motoristas/indicadores:", error);
    return NextResponse.json(
      { error: "Erro ao buscar indicadores" },
      { status: 500 }
    );
  }
}
