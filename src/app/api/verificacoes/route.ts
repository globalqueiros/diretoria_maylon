import { NextRequest, NextResponse } from "next/server";
import { db2 } from "../../lib/db";
import {
  IDENTITY_MATCH_KEY,
  LAST_LIVENESS_KEY,
  mapearStatusDidit,
  provaVidaDevida,
} from "../../lib/didit";

export const dynamic = "force-dynamic";

// =====================================================
// HELPERS
// =====================================================

function valorTexto(...valores: unknown[]): string {
  for (const valor of valores) {
    if (valor !== null && valor !== undefined) {
      const texto = String(valor).trim();

      if (texto) {
        return texto;
      }
    }
  }

  return "";
}

type Detalhes = Record<string, unknown>;

function parseDetalhes(raw: unknown): Detalhes | null {
  if (!raw) return null;

  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Detalhes;
    } catch {
      return null;
    }
  }

  if (typeof raw === "object") {
    return raw as Detalhes;
  }

  return null;
}

function extrairDocumentoTipo(detalhes: Detalhes | null): string | null {
  if (!detalhes) return null;

  const decisao = detalhes["decision"] as Detalhes | undefined;
  const idVerificacoes = decisao?.["id_verifications"];

  if (Array.isArray(idVerificacoes) && idVerificacoes.length > 0) {
    const primeira = idVerificacoes[0] as Detalhes;

    const tipo = valorTexto(primeira?.["document_type"]);

    if (tipo) return tipo;
  }

  const identityMatch = detalhes[IDENTITY_MATCH_KEY] as Detalhes | undefined;
  const tipoOcr = (identityMatch?.["tipo"] as Detalhes | undefined)?.["ocr"];

  return valorTexto(tipoOcr) || null;
}

function extrairLiveness(detalhes: Detalhes | null): string | null {
  if (!detalhes) return null;

  const valor = detalhes[LAST_LIVENESS_KEY];

  return valor ? String(valor) : null;
}

// =====================================================
// GET
// =====================================================

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const pagina = Math.max(
      Number(searchParams.get("pagina")) || 1,
      1
    );

    const limite = Math.min(
      Math.max(Number(searchParams.get("limite")) || 10, 1),
      100
    );

    const busca = searchParams.get("busca")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";

    const offset = (pagina - 1) * limite;

    // ---------------------------------------------
    // BUSCA
    // ---------------------------------------------

    let buscaSql = "";
    const buscaValues: unknown[] = [];

    if (busca) {
      buscaSql = `
        AND (
          u.id LIKE ?
          OR u.full_name LIKE ?
          OR u.first_name LIKE ?
          OR u.last_name LIKE ?
          OR u.email LIKE ?
          OR u.phone LIKE ?
        )
      `;

      const termo = `%${busca}%`;

      buscaValues.push(
        termo,
        termo,
        termo,
        termo,
        termo,
        termo
      );
    }

    // ---------------------------------------------
    // BASE (última verificação Didit + usuário)
    // ---------------------------------------------

    const baseSql = `
      SELECT
        u.id,
        u.full_name,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        u.profile_image,
        u.is_active,
        u.created_at,
        d.is_verified,
        d.is_suspended,
        v.current_status,
        v.attempt_details,
        v.updated_at AS verification_updated_at,
        CASE
          WHEN v.current_status = 'Approved' THEN 'aprovado'
          WHEN v.current_status = 'In Review' THEN 'em_analise'
          WHEN v.current_status IN ('Not Started', 'In Progress', 'Awaiting User', 'Resubmitted') THEN 'pendente'
          WHEN v.current_status IN ('Declined', 'Abandoned', 'Expired') THEN 'reprovado'
          WHEN v.current_status IS NOT NULL THEN 'pendente'
          WHEN d.is_verified = 1 THEN 'aprovado'
          ELSE 'nao_iniciado'
        END AS status
      FROM driver_identity_verifications v
      INNER JOIN users u
        ON u.id = v.driver_id
      LEFT JOIN driver_details d
        ON d.user_id = u.id
      WHERE u.deleted_at IS NULL
        AND v.id = (
          SELECT v2.id
          FROM driver_identity_verifications v2
          WHERE v2.driver_id = v.driver_id
          ORDER BY v2.updated_at DESC
          LIMIT 1
        )
        ${buscaSql}
    `;

    const statusSql = status ? "WHERE t.status = ?" : "";

    // ---------------------------------------------
    // TOTAL
    // ---------------------------------------------

    const countValues: unknown[] = [...buscaValues];

    if (status) {
      countValues.push(status);
    }

    const [countRows] = await db2.query(
      `
        SELECT COUNT(*) AS total
        FROM (
          ${baseSql}
        ) t
        ${statusSql}
      `,
      countValues
    );

    const total = Number(
      (countRows as Record<string, unknown>[])[0]?.total || 0
    );

    const totalPaginas = total > 0 ? Math.ceil(total / limite) : 0;

    // ---------------------------------------------
    // LISTA
    // ---------------------------------------------

    const listValues: unknown[] = [...buscaValues];

    if (status) {
      listValues.push(status);
    }

    listValues.push(limite, offset);

    const [rows] = await db2.query(
      `
        SELECT *
        FROM (
          ${baseSql}
        ) t
        ${statusSql}
        ORDER BY t.verification_updated_at DESC
        LIMIT ? OFFSET ?
      `,
      listValues
    );

    const dados = (rows as Record<string, unknown>[]).map((row) => {
      const detalhes = parseDetalhes(row.attempt_details);

      const nome =
        valorTexto(row.full_name) ||
        [row.first_name, row.last_name]
          .map((parte) => valorTexto(parte))
          .filter(Boolean)
          .join(" ") ||
        "Sem nome";

      const created = row.created_at
        ? new Date(row.created_at as string).toISOString()
        : null;

      const lastLivenessAt = extrairLiveness(detalhes);

      return {
        id: String(row.id),
        nome,
        email: valorTexto(row.email),
        telefone: valorTexto(row.phone),
        foto: valorTexto(row.profile_image),

        status: mapearStatusDidit(
          valorTexto(row.current_status) || null,
          Number(row.is_verified ?? 0)
        ),
        didit_status: valorTexto(row.current_status) || null,

        is_verified: Number(row.is_verified ?? 0) === 1,
        is_suspended: Number(row.is_suspended ?? 0) === 1,
        is_active: Number(row.is_active ?? 0) === 1,

        documento_tipo: extrairDocumentoTipo(detalhes),
        last_liveness_at: lastLivenessAt,
        prova_vida_devida: provaVidaDevida(created, lastLivenessAt),

        created_at: created,
        updated_at: row.verification_updated_at
          ? new Date(row.verification_updated_at as string).toISOString()
          : null,
      };
    });

    return NextResponse.json({
      sucesso: true,
      dados,
      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas,
      },
    });
  } catch (error) {
    console.error("❌ API VERIFICAÇÕES:", error);

    return NextResponse.json(
      {
        sucesso: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao buscar verificações.",
      },
      {
        status: 500,
      }
    );
  }
}
