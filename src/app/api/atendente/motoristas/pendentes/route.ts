import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db2 } from "../../../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rows] = await db2.query<RowDataPacket[]>(
      `SELECT *
       FROM users
       WHERE user_type = ? AND is_active = ?
       ORDER BY id DESC`,
      ["driver", 0]
    );

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erro em /api/atendente/motoristas/pendentes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar motoristas pendentes" },
      { status: 500 }
    );
  }
}