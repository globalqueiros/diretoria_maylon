import { NextResponse } from "next/server";
import { db2 } from "../../lib/db";

export async function GET() {
  try {
    const [rows] = await db2.query(`
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
        fcm_token,
        phone_verified_at,
        email_verified_at,
        loyalty_points,
        ref_code,
        user_type,
        role_id,
        remember_token,
        is_active,
        current_language_key,
        deleted_at,
        created_at
      FROM smartmobility_db.users
      WHERE user_type = 'customer'
      ORDER BY id ASC
    `);

    return NextResponse.json({
      passageiros: rows,
    });
  } catch (error: unknown) {
    console.error("ERRO MYSQL - PASSAGEIROS:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido ao consultar o banco de dados.",
        passageiros: [],
      },
      { status: 500 }
    );
  }
}