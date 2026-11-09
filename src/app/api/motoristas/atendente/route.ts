
import { NextResponse } from "next/server";
import { db2 } from "../../../lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Motorista = {
  id: number | string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  user_type: string | null;
  is_active: number | string | boolean | null;
  document: string | null;
  document_number: string | null;
  cpf: string | null;
  passport: string | null;
  identification_number: string | null;
  identification_type: string | null;
  ref_code: string | null;
  created_at: string | Date | null;
  createdAt: string | Date | null;
  registration_date: string | Date | null;
  photo: string | null;
  avatar: string | null;
  profile_image: string | null;
};

function erroResposta(error: unknown) {
  console.error("ERRO MYSQL - MOTORISTAS ATENDENTE:", error);

  return NextResponse.json(
    {
      error:
        error instanceof Error
          ? error.message
          : "Erro ao consultar os motoristas.",
      total: 0,
      motoristas: [],
    },
    {
      status: 500,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function GET() {
  try {
    const [rows] = await db2.query(
      `
      SELECT *
      FROM smartmobility_db.users
      WHERE LOWER(TRIM(user_type)) = 'driver'
      ORDER BY id DESC
      `
    );

    const motoristas = rows as Motorista[];

    return NextResponse.json(
      {
        total: motoristas.length,
        motoristas,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
      }
    );
  } catch (error: unknown) {
    return erroResposta(error);
  }
}
