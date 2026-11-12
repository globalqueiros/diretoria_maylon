import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db2 } from "../../../lib/db";
import { exigirPerfilNaApi } from "../../../lib/roles";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await exigirPerfilNaApi(["gerente", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [rows] = await db2.query<RowDataPacket[]>(
      `SELECT id, full_name, first_name, last_name, email, phone, user_type,
              is_active, profile_image, gerente, created_at
         FROM users
        WHERE user_type = 'driver' AND gerente = ?
        ORDER BY full_name ASC`,
      [auth.usuario.id]
    );

    return NextResponse.json(
      {
        total: rows.length,
        motoristas: rows.map((row) => ({
          id: row.id,
          full_name:
            row.full_name ||
            [row.first_name, row.last_name].filter(Boolean).join(" ") ||
            "Motorista",
          email: row.email || "",
          phone: row.phone || "",
          user_type: row.user_type,
          is_active: row.is_active,
          profile_image: row.profile_image,
          created_at: row.created_at,
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro GET /api/gerente/motoristas:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os motoristas da carteira.", motoristas: [], total: 0 },
      { status: 500 }
    );
  }
}
