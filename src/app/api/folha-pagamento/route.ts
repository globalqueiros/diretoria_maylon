
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import { db2 } from "../../lib/db";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type TokenPayload = {
  sub?: string;
  id?: string;
  userId?: string;
};

type FuncionarioRow = RowDataPacket & {
  id: string;
  nome: string;
  email: string;
  cargo: string | null;
  departamento: string | null;
};

type PagamentoRow = RowDataPacket & {
  id: string;
  competencia: string;
  dataPagamento: string | null;
  salarioBruto: number | string;
  descontos: number | string;
  beneficios: number | string;
  salarioLiquido: number | string;
  status: "pago" | "pendente" | "cancelado";
};

export async function GET(_request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Você precisa estar autenticado." },
        { status: 401 }
      );
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      console.error("JWT_SECRET não configurado.");
      return NextResponse.json(
        { error: "Configuração de autenticação indisponível." },
        { status: 500 }
      );
    }

    let payload: TokenPayload;

    try {
      payload = jwt.verify(token, secret) as TokenPayload;
    } catch {
      return NextResponse.json(
        { error: "Sessão inválida ou expirada." },
        { status: 401 }
      );
    }

    const userId = payload.sub ?? payload.userId ?? payload.id;

    if (!userId) {
      return NextResponse.json(
        { error: "Identificação do usuário não encontrada no token." },
        { status: 401 }
      );
    }

    const [funcionarios] = await db2.execute<FuncionarioRow[]>(
      `
      SELECT
        u.id,
        u.name AS nome,
        u.email,
        NULL AS cargo,
        NULL AS departamento
      FROM users u
      WHERE u.id = ?
      LIMIT 1
      `,
      [userId]
    );

    if (funcionarios.length === 0) {
      return NextResponse.json(
        { error: "Funcionário não encontrado." },
        { status: 404 }
      );
    }

    /*
     * SUBSTITUA esta consulta pelos nomes reais
     * da tabela e das colunas de pagamentos.
     */
    const [pagamentos] = await db2.execute<PagamentoRow[]>(
      `
      SELECT
        id,
        competencia,
        data_pagamento AS dataPagamento,
        salario_bruto AS salarioBruto,
        descontos,
        beneficios,
        salario_liquido AS salarioLiquido,
        status
      FROM folha_pagamento
      WHERE user_id = ?
      ORDER BY competencia DESC
      `,
      [userId]
    );

    return NextResponse.json(
      {
        funcionario: funcionarios[0],
        pagamentos: pagamentos.map((p) => ({
          ...p,
          salarioBruto: Number(p.salarioBruto),
          descontos: Number(p.descontos),
          beneficios: Number(p.beneficios),
          salarioLiquido: Number(p.salarioLiquido),
        })),
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "private, no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("Erro ao consultar folha de pagamento:", error);

    return NextResponse.json(
      { error: "Não foi possível consultar sua folha de pagamento." },
      { status: 500 }
    );
  }
}
