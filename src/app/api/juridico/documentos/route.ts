import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { gerarUrlDownloadS3 } from "../../../lib/s3";

interface Documento {
  id: number;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  responsavel: string | null;
  status: string;
  s3_key: string | null;
  is_modelo: number | boolean;
  created_at: Date;
  updated_at: Date;
}

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        nome,
        descricao,
        categoria,
        responsavel,
        status,
        s3_key,
        is_modelo,
        created_at,
        updated_at
      FROM assinatura_clicksign
      ORDER BY created_at DESC
    `);

    const assinatura_clicksign = await Promise.all(
      (rows as Documento[]).map(async (documento) => {
        let arquivo_url: string | null = null;

        if (documento.s3_key) {
          try {
            arquivo_url = await gerarUrlDownloadS3(
              documento.s3_key
            );
          } catch (error) {
            console.error(
              `Erro ao gerar URL do documento ${documento.id}:`,
              error
            );
          }
        }

        return {
          id: documento.id,
          nome: documento.nome,
          descricao: documento.descricao,
          categoria: documento.categoria,
          responsavel: documento.responsavel,
          status: documento.status,
          s3_key: documento.s3_key,
          is_modelo: documento.is_modelo,
          created_at: documento.created_at,
          updated_at: documento.updated_at,
          arquivo_url,
        };
      })
    );

    return NextResponse.json(assinatura_clicksign);
  } catch (error) {
    console.error("Erro ao buscar assinatura_clicksign:", error);

    return NextResponse.json(
      {
        error: "Erro ao buscar assinatura_clicksign.",
      },
      {
        status: 500,
      }
    );
  }
}
