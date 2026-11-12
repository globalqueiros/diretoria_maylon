import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

/**
 * Devolve o id do usuário autenticado, lido do cookie "access_token".
 * O id vem sempre do token assinado, nunca do navegador.
 */
async function obterUsuarioLogadoId(): Promise<number | string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return null;

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET não configurado");
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as { id?: number | string };
    return decoded.id ?? null;
  } catch {
    // token inválido ou expirado
    return null;
  }
}

export async function GET() {
  try {
    const usuarioId = await obterUsuarioLogadoId();

    if (!usuarioId) {
      return NextResponse.json(
        { error: "Não autenticado." },
        { status: 401 }
      );
    }

    const [rows]: any = await db.query({
      sql: `
        SELECT
          f.id,
          f.matricula,
          f.full_name       AS nome,
          f.user_type       AS cargo,
          f.agencia,
          f.conta,
          f.admission_date  AS admissao,
          0 AS salario_base,
          0 AS comissao,
          0 AS beneficios,
          0 AS descontos,
          0 AS adiantamentos,
          0 AS liquido
        FROM maylon_db.users f
        WHERE f.id = ?
          AND f.deleted_at IS NULL
        LIMIT 1
      `,
      values: [usuarioId],
      timeout: 15000,
    });

    return NextResponse.json({
      funcionarios: Array.isArray(rows) ? rows : [],
    });
  } catch (error: unknown) {
    console.error("ERRO MYSQL - FOLHA:", error);

    return NextResponse.json(
      { error: "Erro ao consultar a folha de pagamento." },
      { status: 500 }
    );
  }
}