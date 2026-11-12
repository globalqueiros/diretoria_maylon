
import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function GET() {
  try {
    const [rows] = await db.execute(
      `SELECT
        id,
        numero,
        nome,
        email,
        telefone,
        cidade,
        status,
        criado_em
       FROM clientes
       ORDER BY id DESC`
    );

    return NextResponse.json(rows);

  } catch (error) {
    console.error("Erro ao listar clientes:", error);

    return NextResponse.json(
      { erro: "Erro ao buscar clientes no banco de dados." },
      { status: 500 }
    );
  }
}
