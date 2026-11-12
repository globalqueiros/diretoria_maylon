import { NextResponse } from "next/server";
import { db } from "../../../../../lib/db";
import { gerarUrlVisualizacaoS3 } from "../../../../../lib/s3";

interface Documento {
  id: number;
  nome: string;
  s3_key: string | null;
}

export async function GET(
  request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id } = await context.params;

    const [rows] = await db.query(
      `
      SELECT
        id,
        nome,
        s3_key
      FROM assinatura_clicksign
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    const assinatura_clicksign = rows as Documento[];

    if (assinatura_clicksign.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Documento não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const documento = assinatura_clicksign[0];

    if (!documento.s3_key) {
      return NextResponse.json(
        {
          success: false,
          message: "Este documento não possui arquivo.",
        },
        {
          status: 404,
        }
      );
    }

    const url = await gerarUrlVisualizacaoS3(documento.s3_key);

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (error) {
    console.error("Erro ao visualizar documento:", error);

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao visualizar documento.",
      },
      {
        status: 500,
      }
    );
  }
}
