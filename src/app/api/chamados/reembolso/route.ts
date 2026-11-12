import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import jwt from "jsonwebtoken";
import { db2 } from "../../../lib/db";

export const dynamic = "force-dynamic";

const MOTIVOS = [
  "reembolso",
  "cobranca_duplicada",
  "cobranca_indevida",
  "valor_incorreto",
  "pagamento_nao_reconhecido",
  "outro",
];

async function usuarioId(): Promise<string | null> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return null;
  try {
    const p = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id?: string | number;
    };
    return p.id !== undefined ? String(p.id) : null;
  } catch {
    return null;
  }
}

type Linha = Record<string, unknown>;

export async function POST(request: Request) {
  const userId = await usuarioId();
  if (!userId) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const corridaId = String(body.corridaId ?? "").trim();
    const motivo = String(body.motivo ?? "").trim();
    const descricao = String(body.descricao ?? "").trim();

    if (!corridaId) {
      return NextResponse.json({ error: "Corrida não informada." }, { status: 400 });
    }
    if (!MOTIVOS.includes(motivo)) {
      return NextResponse.json(
        { error: `Assunto inválido: "${motivo}".` },
        { status: 400 }
      );
    }
    if (descricao.length < 10 || descricao.length > 2000) {
      return NextResponse.json(
        { error: "Descreva o problema com 10 a 2000 caracteres." },
        { status: 400 }
      );
    }

    // 1) A corrida existe?
    const [corridas] = (await db2.query({
      sql: `
        SELECT id, payment_status, paid_fare, actual_fare, estimated_fare
        FROM smartmobility_db.trip_requests
        WHERE id = ? AND deleted_at IS NULL
        LIMIT 1
      `,
      values: [corridaId],
      timeout: 10000,
    })) as unknown as [Linha[], unknown];

    const corrida = corridas[0];
    if (!corrida) {
      return NextResponse.json({ error: "Corrida não encontrada." }, { status: 404 });
    }

    // 2) Já existe chamado em andamento para esta corrida?
    const [existentes] = (await db2.query({
      sql: `
        SELECT protocolo
        FROM smartmobility_db.chamados_reembolso
        WHERE corrida_id = ? AND status IN ('aberto','em_analise')
        LIMIT 1
      `,
      values: [corridaId],
      timeout: 10000,
    })) as unknown as [Linha[], unknown];

    if (existentes[0]) {
      return NextResponse.json(
        { error: `Já existe um chamado em andamento (${existentes[0].protocolo}).` },
        { status: 409 }
      );
    }

    // 3) Cria o chamado
    const paga = Number(corrida.paid_fare ?? 0);
    const valor = paga > 0 ? paga : Number(corrida.actual_fare ?? corrida.estimated_fare ?? 0);
    const protocolo = `CHM-${new Date().getFullYear()}-${randomBytes(3)
      .toString("hex")
      .toUpperCase()}`;

    await db2.query({
      sql: `
        INSERT INTO smartmobility_db.chamados_reembolso
          (protocolo, corrida_id, valor, motivo, descricao, aberto_por)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
      values: [protocolo, corridaId, valor, motivo, descricao, userId],
      timeout: 10000,
    });

    return NextResponse.json({ ok: true, protocolo }, { status: 201 });
  } catch (error: unknown) {
    console.error("ERRO MYSQL - CHAMADO:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Não foi possível abrir o chamado.",
      },
      { status: 500 }
    );
  }
}