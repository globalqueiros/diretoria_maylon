import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db, db2 } from "../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * =========================================================
 * CONFIGURAÇÃO
 * =========================================================
 */

const TABELA_FATURAS = "faturas";
const IS_DEV = process.env.NODE_ENV !== "production";

// valores normalizados (minúsculos, sem acento, sem espaços)
const PERFIS_PERMITIDOS = ["atendente", "diretor", "gerente"];

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function normalizar(valor: unknown): string {
  return String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/*
 * =========================================================
 * AUTENTICAÇÃO (mesmo padrão do /api/me)
 * O token só tem o id; o perfil vem da tabela users (db).
 * =========================================================
 */

type ResultadoAuth = {
  ok: boolean;
  status?: number;
  error?: string;
  motivo?: string;
};

function falha(status: number, error: string, motivo: string): ResultadoAuth {
  console.warn(`[faturas] ${status} - ${motivo}`);
  return { ok: false, status, error, motivo };
}

async function verificarAutorizacao(): Promise<ResultadoAuth> {
  const cookieStore = await cookies();

  if (IS_DEV) {
    console.log(
      "[faturas] cookies recebidos:",
      cookieStore.getAll().map((c) => c.name)
    );
  }

  const token = cookieStore.get("access_token")?.value;

  if (!token) {
    return falha(
      401,
      "Não autenticado",
      "cookie access_token ausente (sessão expirou ou cookie foi apagado)"
    );
  }

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    return falha(
      500,
      "Erro interno de autenticação",
      "JWT_SECRET não configurado"
    );
  }

  let decoded: { id?: number; iat?: number; exp?: number };

  try {
    decoded = jwt.verify(token, secret) as typeof decoded;
  } catch (error) {
    return falha(
      401,
      "Token inválido ou sessão expirada",
      `jwt.verify falhou: ${(error as Error).message}`
    );
  }

  if (!decoded?.id) {
    return falha(401, "Token inválido", "payload sem id");
  }

  // usuários ficam no mesmo banco usado pelo /api/me (db)
  const [rows]: any = await db.query(
    "SELECT user_type FROM users WHERE id = ? LIMIT 1",
    [decoded.id]
  );

  if (!rows || rows.length === 0) {
    return falha(
      401,
      "Usuário não encontrado",
      `nenhum usuário com id=${decoded.id} na tabela users`
    );
  }

  const tipoOriginal = rows[0].user_type;
  const tipo = normalizar(tipoOriginal);

  if (!PERFIS_PERMITIDOS.includes(tipo)) {
    return falha(
      403,
      "Sem permissão para acessar faturas.",
      `perfil "${tipoOriginal}" não permitido`
    );
  }

  return { ok: true };
}

/*
 * =========================================================
 * GET /api/maylon-pass/faturas?usuario_id=ID
 * =========================================================
 */

export async function GET(req: NextRequest) {
  try {
    const auth = await verificarAutorizacao();

    if (!auth.ok) {
      return NextResponse.json(
        {
          error: auth.error ?? "Não autorizado.",
          ...(IS_DEV && auth.motivo ? { motivo: auth.motivo } : {}),
        },
        { status: auth.status ?? 401 }
      );
    }

    const usuarioId = req.nextUrl.searchParams.get("usuario_id")?.trim();

    // aceita UUID (padrão do Maylon Pass) ou ID numérico
    const idValido =
      !!usuarioId && (UUID_REGEX.test(usuarioId) || /^\d+$/.test(usuarioId));

    if (!usuarioId || !idValido) {
      return NextResponse.json(
        { error: "Informe um usuario_id válido." },
        { status: 400 }
      );
    }

    // faturas ficam no banco do db2
    const [rows]: any = await db2.query(
      `SELECT
         id,
         usuario_id,
         numero,
         descricao,
         valor,
         status,
         vencimento,
         pago_em,
         metodo_pagamento,
         created_at
       FROM \`${TABELA_FATURAS}\`
       WHERE usuario_id = ?
       ORDER BY COALESCE(vencimento, created_at) DESC, id DESC
       LIMIT 200`,
      [usuarioId]
    );

    const faturas = (rows as any[]).map((row) => ({
      id: row.id,
      usuario_id: row.usuario_id,
      numero: row.numero,
      descricao: row.descricao,
      valor: row.valor === null ? null : Number(row.valor),
      status: row.status,
      vencimento: row.vencimento,
      pago_em: row.pago_em,
      metodo: row.metodo_pagamento,
      created_at: row.created_at,
    }));

    return NextResponse.json(
      { faturas },
      { status: 200, headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro ao consultar faturas:", error);

    return NextResponse.json(
      { error: "Não foi possível consultar as faturas." },
      { status: 500 }
    );
  }
}

// FIM DO ARQUIVO