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
      `SELECT COUNT(*) AS total
       FROM users
       WHERE user_type = ? AND is_active = ? AND manager_id = ?`,
      ["driver", 1, gerenteId]
    );

    return NextResponse.json({ total: Number(rows[0].total) });
  } catch (error) {
    console.error("Erro em /api/atendente/motoristas/total:", error);
    return NextResponse.json(
      { error: "Erro ao buscar total de motoristas" },
      { status: 500 }
    );
  }
}