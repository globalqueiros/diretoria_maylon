import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

async function getUserId(): Promise<string | null> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id?: string | number;
      sub?: string;
      userId?: string | number;
    };
    const id = payload.id ?? payload.userId ?? payload.sub;
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const ano = Number(searchParams.get("ano")) || new Date().getFullYear();

  if (ano < 2000 || ano > 2100) {
    return NextResponse.json({ error: "Ano inválido." }, { status: 400 });
  }

  try {
    const [rows] = await db.query(
      `SELECT id, competencia, salario_base, comissoes, bonificacoes, descontos,
              total_liquido, total_atendimentos, status, data_pagamento
         FROM folhas_pagamento
        WHERE user_id = ? AND competencia LIKE ?
        ORDER BY competencia DESC`,
      [userId, `${ano}-%`]
    );

    const folhas = (rows as any[]).map((r) => ({
      id: r.id,
      competencia: r.competencia,
      salarioBase: Number(r.salario_base),
      comissoes: Number(r.comissoes),
      bonificacoes: Number(r.bonificacoes),
      descontos: Number(r.descontos),
      totalLiquido: Number(r.total_liquido),
      totalAtendimentos: Number(r.total_atendimentos),
      status: r.status,
      dataPagamento: r.data_pagamento
        ? new Date(r.data_pagamento).toISOString()
        : null,
    }));

    return NextResponse.json({ folhas });
  } catch (error) {
    console.error("Erro ao listar folhas:", error);
    return NextResponse.json(
      { error: "Erro ao carregar folhas de pagamento." },
      { status: 500 }
    );
  }
}