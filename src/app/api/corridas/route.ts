// src/app/api/corridas/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db, db2 } from "../../lib/db";

export const dynamic = "force-dynamic";

const LIMITE_PADRAO = 500;
const LIMITE_MAXIMO = 2000;

/**
 * CARTEIRA DO GERENTE
 *
 * O gerente é um registro de maylon_db.users com user_type = 'gerente'.
 * Os motoristas da carteira são as linhas de maylon_db.users que apontam
 * para esse gerente. Como o nome da coluna de vínculo pode variar, a rota
 * descobre sozinha, em information_schema, qual das colunas candidatas
 * existe de verdade na tabela (a lista abaixo é fixa no código, nunca vem
 * da requisição).
 */
const BANCO_GERENTES = "maylon_db";
const CARTEIRA_TABELA = "users";

// coluna de users que guarda o id do gerente responsável pelo motorista
const CANDIDATAS_GERENTE = [
  "gerente_id",
  "manager_id",
  "id_gerente",
  "responsavel_id",
  "parent_id",
];

// coluna de users que guarda o id do motorista igual a trip_requests.driver_id
const CANDIDATAS_MOTORISTA = [
  "driver_uuid",
  "driver_id",
  "smartmobility_id",
  "smartmobility_user_id",
  "external_id",
  "user_uuid",
  "uuid",
  "id",
];

let colunasCache: string[] | null = null;

async function colunasDeUsers(): Promise<string[]> {
  if (colunasCache) return colunasCache;

  const [rows] = await db.query({
    sql: `
      SELECT LOWER(column_name) AS coluna
        FROM information_schema.columns
       WHERE table_schema = ? AND table_name = ?
    `,
    values: [BANCO_GERENTES, CARTEIRA_TABELA],
    timeout: 15000,
  });

  colunasCache = (rows as Array<{ coluna: string }>).map((r) => r.coluna);
  return colunasCache;
}

/** Lê o id do gerente logado a partir do cookie access_token (JWT). */
async function gerenteLogado(): Promise<string | null> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as Record<
      string,
      unknown
    >;
    const id = payload.id ?? payload.user_id ?? payload.usuario_id ?? payload.sub;
    return id !== undefined && id !== null && String(id).trim() !== ""
      ? String(id)
      : null;
  } catch {
    return null;
  }
}

/** Confirma em maylon_db.users que o id logado é de um gerente. */
async function ehGerente(id: string): Promise<boolean> {
  const [rows] = await db.query({
    sql: `
      SELECT id
        FROM ${BANCO_GERENTES}.users
       WHERE id = ? AND user_type = 'gerente'
       LIMIT 1
    `,
    values: [id],
    timeout: 15000,
  });
  return Array.isArray(rows) && rows.length > 0;
}

export async function GET(request: Request) {
  const gerenteId = await gerenteLogado();

  if (!gerenteId) {
    return NextResponse.json(
      { error: "Não autorizado", corridas: [] },
      { status: 401 }
    );
  }

  try {
    if (!(await ehGerente(gerenteId))) {
      return NextResponse.json(
        { error: "Acesso permitido somente para gerentes.", corridas: [] },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pedido = Number(searchParams.get("limite") ?? LIMITE_PADRAO);
    const limite = Number.isInteger(pedido)
      ? Math.min(Math.max(pedido, 1), LIMITE_MAXIMO)
      : LIMITE_PADRAO;

    const colunas = await colunasDeUsers();
    const CARTEIRA_COL_GERENTE = CANDIDATAS_GERENTE.find((c) =>
      colunas.includes(c)
    );
    const CARTEIRA_COL_MOTORISTA = CANDIDATAS_MOTORISTA.find((c) =>
      colunas.includes(c)
    );

    if (!CARTEIRA_COL_GERENTE || !CARTEIRA_COL_MOTORISTA) {
      return NextResponse.json(
        {
          error:
            "Não encontrei em maylon_db.users a coluna que liga o motorista ao gerente. " +
            "Crie uma (ex.: ALTER TABLE users ADD COLUMN gerente_id VARCHAR(36) NULL) " +
            "ou informe qual das colunas abaixo faz esse vínculo.",
          colunas_users: colunas,
          corridas: [],
        },
        { status: 422 }
      );
    }

    // Etapa 1: motoristas que estão na carteira do gerente logado
    const [carteira] = await db.query({
      sql: `
        SELECT ${CARTEIRA_COL_MOTORISTA} AS motorista_id
          FROM ${BANCO_GERENTES}.${CARTEIRA_TABELA}
         WHERE ${CARTEIRA_COL_GERENTE} = ?
      `,
      values: [gerenteId],
      timeout: 15000,
    });

    const motoristaIds = Array.from(
      new Set(
        (carteira as Array<{ motorista_id: unknown }>)
          .map((r) => String(r.motorista_id ?? "").trim())
          .filter(Boolean)
      )
    );

    if (motoristaIds.length === 0) {
      return NextResponse.json({ corridas: [], total: 0 });
    }

    // Etapa 2: corridas somente desses motoristas
    const [rows] = await db2.query({
      sql: `
        SELECT
          t.id,
          t.ref_id,
          t.current_status AS status,
          c.pickup_address AS origem,
          c.destination_address AS destino,
          up.full_name AS passageiro,
          um.full_name AS motorista,
          CASE
            WHEN t.actual_fare IS NOT NULL AND t.actual_fare > 0 THEN t.actual_fare
            ELSE t.estimated_fare
          END AS valor,
          t.paid_fare,
          t.payment_method AS forma_pagamento,
          t.payment_status AS status_pagamento,
          t.trip_cancellation_reason AS motivo_cancelamento,
          COALESCE(f.cancellation_fee, 0) AS taxa_cancelamento,
          COALESCE(f.return_fee, 0) AS taxa_retorno,
          COALESCE(f.waiting_fee, 0) AS taxa_espera,
          COALESCE(f.idle_fee, 0) AS taxa_ociosidade,
          COALESCE(f.delay_fee, 0) AS taxa_atraso,
          COALESCE(f.vat_tax, 0) AS imposto,
          COALESCE(f.tips, 0) AS gorjeta,
          COALESCE(f.admin_commission, 0) AS comissao_admin,
          f.cancelled_by AS cancelado_por,
          tm.estimated_time AS tempo_estimado,
          tm.actual_time AS tempo_real,
          tm.waiting_time AS tempo_espera,
          tm.delay_time AS tempo_atraso,
          tm.idle_time AS tempo_ocioso,
          tm.driver_arrival_time AS tempo_chegada_motorista,
          tm.driver_arrives_at AS motorista_chegou_em,
          tm.customer_arrives_at AS passageiro_chegou_em,
          ts.pending AS solicitada_em,
          ts.accepted AS aceita_em,
          ts.out_for_pickup AS a_caminho_em,
          ts.picked_up AS embarcou_em,
          ts.ongoing AS em_andamento_em,
          ts.completed AS concluida_em,
          ts.cancelled AS cancelada_em,
          ts.failed AS falhou_em,
          ts.returning AS retornando_em,
          ts.returned AS retornou_em,
          ts.note AS observacao_status,
          t.created_at AS data
        FROM smartmobility_db.trip_requests t
        LEFT JOIN smartmobility_db.trip_request_coordinates c ON c.trip_request_id = t.id
        LEFT JOIN smartmobility_db.trip_request_fees f ON f.trip_request_id = t.id
        LEFT JOIN smartmobility_db.trip_request_times tm ON tm.trip_request_id = t.id
        LEFT JOIN smartmobility_db.trip_status ts ON ts.trip_request_id = t.id
        LEFT JOIN smartmobility_db.users up ON up.id = t.customer_id
        LEFT JOIN smartmobility_db.users um ON um.id = t.driver_id
        WHERE t.deleted_at IS NULL
          AND t.driver_id IN (?)
        ORDER BY t.created_at DESC, t.id DESC
        LIMIT ?
      `,
      values: [motoristaIds, limite],
      timeout: 15000,
    });

    return NextResponse.json({
      corridas: rows,
      total: Array.isArray(rows) ? rows.length : 0,
    });
  } catch (error: unknown) {
    console.error("ERRO MYSQL - CORRIDAS:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Erro ao consultar as corridas.",
        corridas: [],
      },
      { status: 500 }
    );
  }
}