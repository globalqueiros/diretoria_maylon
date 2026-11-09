import { NextResponse } from "next/server";
import { db2 } from "../../../lib/db";

type Ctx = { params: Promise<{ id: string }> };

const SELECT_MOTORISTA = `
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
`;

// Campos que o atendente pode editar pela tela
const CAMPOS_EDITAVEIS = [
  "full_name",
  "email",
  "phone",
  "identification_number",
  "identification_type",
] as const;

export async function GET(_request: Request, { params }: Ctx) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "ID do motorista não informado." },
        { status: 400 }
      );
    }

    const [rows] = await db2.query(SELECT_MOTORISTA, [id]);
    const lista = rows as any[];

    if (lista.length === 0) {
      return NextResponse.json(
        { error: "Motorista não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      motorista: lista[0],
      passageiro: lista[0], // compatibilidade com código antigo
    });
  } catch (error) {
    console.error("Erro ao buscar motorista:", error);

    return NextResponse.json(
      { error: "Erro interno ao buscar motorista." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request, { params }: Ctx) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "ID do motorista não informado." },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Corpo da requisição inválido." },
        { status: 400 }
      );
    }

    const sets: string[] = [];
    const values: (string | number)[] = [];

    for (const campo of CAMPOS_EDITAVEIS) {
      if (body[campo] !== undefined && body[campo] !== null) {
        sets.push(`${campo} = ?`);
        values.push(String(body[campo]).trim());
      }
    }

    if (sets.length === 0) {
      return NextResponse.json(
        { error: "Nenhum campo para atualizar." },
        { status: 400 }
      );
    }

    const [result] = await db2.query(
      `UPDATE users SET ${sets.join(", ")} WHERE id = ?`,
      [...values, id]
    );

    if ((result as any).affectedRows === 0) {
      return NextResponse.json(
        { error: "Motorista não encontrado." },
        { status: 404 }
      );
    }

    const [rows] = await db2.query(SELECT_MOTORISTA, [id]);
    const lista = rows as any[];

    return NextResponse.json({
      motorista: lista[0],
      passageiro: lista[0],
    });
  } catch (error: any) {
    console.error("Erro ao atualizar motorista:", error);

    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        {
          error:
            "E-mail, telefone ou documento já cadastrado em outro usuário.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno ao atualizar motorista." },
      { status: 500 }
    );
  }
}