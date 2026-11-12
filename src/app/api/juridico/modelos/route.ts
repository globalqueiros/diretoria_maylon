import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../..//lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, nome, descricao, categoria, cor, conteudo, arquivo_url
         FROM modelos_documentos
        WHERE ativo = 1
        ORDER BY ordem ASC, nome ASC`
    );

    return NextResponse.json({ modelos: rows });
  } catch (error) {
    console.error("Erro ao buscar modelos:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os modelos." },
      { status: 500 }
    );
  }
}