import { NextResponse } from "next/server";
import { db2 } from "../../../lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "ID do motorista não informado." },
        { status: 400 }
      );
    }

    const [rows] = await db2.query(
      `
        SELECT
          id,
          passsageiro_tea,
          full_name,
          user_level_id,
          first_name,
          last_name,
          email,
          phone,
          identification_number,
          identification_type,
          identification_image,
          old_identification_image,
          other_documents,
          profile_image,
          phone_verified_at,
          email_verified_at,
          loyalty_points,
          ref_code,
          user_type,
          role_id,
          is_active,
          current_language_key,
          deleted_at,
          created_at
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    const passageiros = rows as any[];

    if (passageiros.length === 0) {
      return NextResponse.json(
        { error: "Motorista não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      passageiro: passageiros[0],
    });
  } catch (error) {
    console.error("Erro ao buscar motorista:", error);

    return NextResponse.json(
      { error: "Erro interno ao buscar motorista." },
      { status: 500 }
    );
  }
}