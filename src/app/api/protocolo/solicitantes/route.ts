import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db2 } from "../../.../../../lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const tipo = searchParams.get("tipo") === "motorista" ? "driver" : "customer";
  const q = (searchParams.get("q") ?? "").trim();
  if (q.length < 2) return NextResponse.json({ solicitantes: [] });

  const like = `%${q}%`;
  try {
    const [rows] = await db2.execute<RowDataPacket[]>(
      `SELECT u.id, u.full_name, u.email, u.phone
         FROM users u
         JOIN user_levels l ON l.id = u.user_level_id
        WHERE l.user_type = ?
          AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)
        ORDER BY u.full_name
        LIMIT 8`,
      [tipo, like, like, like]
    );
    return NextResponse.json({ solicitantes: rows });
  } catch (e) {
    console.error("Erro ao buscar solicitantes:", e);
    return NextResponse.json({ erro: "Erro ao buscar." }, { status: 500 });
  }
}