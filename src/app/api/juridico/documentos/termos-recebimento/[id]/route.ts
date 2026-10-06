import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: Params
) {
  try {
    const { id } = await params;

    const termoId = Number(id);

    if (!Number.isInteger(termoId) || termoId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "ID do termo inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const [rows] = await db.execute(
      `
      SELECT *
      FROM termos_recebimento_maquininha
      WHERE id = ?
      LIMIT 1
      `,
      [termoId]
    );

    const data = rows as any[];

    if (!data.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Termo não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      data: data[0],
    });
  } catch (error) {
    console.error("GET /api/termos-recebimento/[id]:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno.",
      },
      {
        status: 500,
      }
    );
  }
}