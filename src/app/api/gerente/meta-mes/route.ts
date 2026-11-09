import { NextResponse } from "next/server";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

type LinhaMeta = {
  cidade: string;
  meta: number;
  realizado: number;
};

export async function GET() {
  try {
    const [rows] = await db.query(
      `SELECT cidade, meta, realizado
         FROM metas_cidade
        WHERE ano = YEAR(CURDATE())
          AND mes = MONTH(CURDATE())
        ORDER BY cidade ASC`
    );

    const cidades: LinhaMeta[] = (rows as LinhaMeta[]).map((r) => ({
      cidade: r.cidade,
      meta: Number(r.meta),
      realizado: Number(r.realizado),
    }));

    return NextResponse.json({
      meta: cidades.reduce((soma, c) => soma + c.meta, 0),
      realizado: cidades.reduce((soma, c) => soma + c.realizado, 0),
      cidades,
    });
  } catch (error) {
    console.error("Erro ao buscar meta do mês:", error);

    return NextResponse.json(
      { message: "Erro ao buscar meta do mês." },
      { status: 500 }
    );
  }
}