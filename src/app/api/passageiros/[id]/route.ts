
import { NextResponse } from "next/server";
import { db2 } from "../../../lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const CAMPOS_EDITAVEIS = [
  "full_name",
  "first_name",
  "last_name",
  "email",
  "phone",
  "identification_number",
  "identification_type",
] as const;

type CampoEditavel = (typeof CAMPOS_EDITAVEIS)[number];

export async function GET(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID do passageiro não informado." },
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
        { error: "Passageiro não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      passageiro: passageiros[0],
    });
  } catch (error) {
    console.error("Erro ao buscar passageiro:", error);

    return NextResponse.json(
      { error: "Erro interno ao buscar passageiro." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "ID do passageiro não informado." },
        { status: 400 }
      );
    }

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "O corpo da requisição deve conter um JSON válido." },
        { status: 400 }
      );
    }

    if (
      !body ||
      typeof body !== "object" ||
      Array.isArray(body)
    ) {
      return NextResponse.json(
        { error: "Dados inválidos para atualização." },
        { status: 400 }
      );
    }

    const campos: CampoEditavel[] = [];
    const valores: unknown[] = [];

    for (const campo of CAMPOS_EDITAVEIS) {
      if (!Object.prototype.hasOwnProperty.call(body, campo)) {
        continue;
      }

      const valor = body[campo];

      if (valor !== null && typeof valor !== "string") {
        return NextResponse.json(
          { error: `O campo ${campo} deve ser um texto ou nulo.` },
          { status: 400 }
        );
      }

      campos.push(campo);
      valores.push(
        typeof valor === "string" ? valor.trim() : null
      );
    }

    if (campos.length === 0) {
      return NextResponse.json(
        { error: "Nenhum campo válido foi enviado para atualização." },
        { status: 400 }
      );
    }

    const [existentes] = await db2.query(
      "SELECT id FROM users WHERE id = ? LIMIT 1",
      [id]
    );

    if ((existentes as any[]).length === 0) {
      return NextResponse.json(
        { error: "Passageiro não encontrado." },
        { status: 404 }
      );
    }

    const setClause = campos
      .map((campo) => `\`${campo}\` = ?`)
      .join(", ");

    await db2.query(
      `UPDATE users SET ${setClause} WHERE id = ?`,
      [...valores, id]
    );

    const [rows] = await db2.query(
      `
        SELECT
          id,
          full_name,
          first_name,
          last_name,
          email,
          phone,
          identification_number,
          identification_type
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    const passageiros = rows as any[];

    return NextResponse.json({
      message: "Informações pessoais atualizadas com sucesso.",
      passageiro: passageiros[0],
    });
  } catch (error) {
    console.error("Erro ao atualizar passageiro:", error);

    return NextResponse.json(
      { error: "Erro interno ao atualizar as informações pessoais." },
      { status: 500 }
    );
  }
}