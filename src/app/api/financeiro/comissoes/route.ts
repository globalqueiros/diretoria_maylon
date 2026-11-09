import { NextRequest, NextResponse } from "next/server";
import { db2 } from "../../../lib/db";
import type { RowDataPacket } from "mysql2/promise";
export const dynamic = "force-dynamic";

const PERFIL = "motorista";

type ComissaoRow = RowDataPacket & {
  id: number;
  beneficiario: string;
  perfil: string;
  referencia: string;
  meta: string | number;
  atingido: string | number;
  valor: string | number;
  status: string;
};

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const referencia = searchParams.get("referencia")?.trim();
    const gerenteId = searchParams.get("gerente_id")?.trim();

    const condicoes: string[] = ["perfil = ?"];
    const parametros: string[] = [PERFIL];

    if (referencia) {
      condicoes.push("referencia = ?");
      parametros.push(referencia);
    }
    if (gerenteId) {
      condicoes.push("gerente_id = ?");
      parametros.push(gerenteId);
    }

    const where = `WHERE ${condicoes.join(" AND ")}`;

    const [rows] = await db2.query<ComissaoRow[]>(
      `SELECT id, beneficiario, perfil, referencia, meta, atingido, valor, status
         FROM comissoes
         ${where}
        ORDER BY referencia DESC, id DESC
        LIMIT 500`,
      parametros
    );

    const comissoes = rows.map((r) => ({
      id: r.id,
      beneficiario: r.beneficiario,
      perfil: r.perfil,
      referencia: r.referencia,
      meta: Number(r.meta),
      atingido: Number(r.atingido),
      valor: Number(r.valor),
      status: r.status,
    }));

    return NextResponse.json({ comissoes }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Erro em GET /api/financeiro/comissoes:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as comissões." },
      { status: 500 }
    );
  }
}