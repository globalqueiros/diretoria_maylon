
import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../lib/db";
import {
    comNovaTentativa,
    sessaoDaRequisicao,
    type SessaoInvalida,
    type SessaoValida,
} from "../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FILTROS = new Set(["all", "active", "inactive", "revoked"]);

const STATUS_EFETIVO = `
    CASE
        WHEN LOWER(s.status) = 'revoked' THEN 'revoked'
        WHEN LOWER(s.status) = 'active' AND s.expires_at > NOW() THEN 'active'
        ELSE 'inactive'
    END
`;

function semCache(resposta: NextResponse) {
    resposta.headers.set("Cache-Control", "no-store");
    return resposta;
}

export async function GET(req: NextRequest) {
    const sessao = await sessaoDaRequisicao(req);

    if (!sessao.ok) {
        if ((sessao as SessaoInvalida).indisponivel) {
            return semCache(
                NextResponse.json(
                    { error: "Serviço temporariamente indisponível. Tente novamente." },
                    { status: 503 }
                )
            );
        }

        return semCache(
            NextResponse.json(
                { error: "Sessão inválida. Entre novamente." },
                { status: 401 }
            )
        );
    }

    const { userId, sessionUuid } = sessao as SessaoValida;

    const pedido = (req.nextUrl.searchParams.get("status") || "all").toLowerCase();
    const filtro = FILTROS.has(pedido) ? pedido : "all";

    const consulta = (comUsuario: boolean) => `
        SELECT * FROM (
            SELECT
                s.session_uuid,
                s.user_id,
                ${
                    comUsuario
                        ? "NULLIF(TRIM(CONCAT_WS(' ', u.first_name, u.last_name)), '') AS user_name, u.email AS user_email,"
                        : "NULL AS user_name, NULL AS user_email,"
                }
                s.ip_address,
                s.device_name,
                s.browser_name,
                s.operating_system,
                ${STATUS_EFETIVO} AS effective_status,
                s.created_at,
                s.last_activity_at,
                s.expires_at,
                s.ended_at,
                s.end_reason
            FROM user_sessions s
            ${comUsuario ? "LEFT JOIN users u ON u.id = s.user_id" : ""}
            WHERE s.user_id = ?
        ) t
        WHERE (? = 'all' OR t.effective_status = ?)
        ORDER BY t.created_at DESC
        LIMIT 200
    `;

    try {
        let linhas: RowDataPacket[];

        try {
            [linhas] = await comNovaTentativa(() =>
                db.execute<RowDataPacket[]>(consulta(true), [userId, filtro, filtro])
            );
        } catch (e) {
            if ((e as { code?: string })?.code !== "ER_BAD_FIELD_ERROR") {
                throw e;
            }

            [linhas] = await comNovaTentativa(() =>
                db.execute<RowDataPacket[]>(consulta(false), [userId, filtro, filtro])
            );
        }

        const [contagem] = await comNovaTentativa(() =>
            db.execute<RowDataPacket[]>(
                `
                    SELECT
                        COUNT(*) AS total,
                        COALESCE(SUM(effective_status = 'active'), 0) AS active,
                        COALESCE(SUM(effective_status = 'inactive'), 0) AS inactive,
                        COALESCE(SUM(effective_status = 'revoked'), 0) AS revoked
                    FROM (
                        SELECT ${STATUS_EFETIVO} AS effective_status
                        FROM user_sessions s
                        WHERE s.user_id = ?
                    ) c
                `,
                [userId]
            )
        );

        const sessions = linhas.map((l) => ({
            ...l,
            user_id: String(l.user_id),
            is_current: l.session_uuid === sessionUuid,
        }));

        const c = (contagem[0] ?? {}) as Record<string, unknown>;

        return semCache(
            NextResponse.json({
                success: true,
                sessions,
                counts: {
                    total: Number(c.total ?? 0),
                    active: Number(c.active ?? 0),
                    inactive: Number(c.inactive ?? 0),
                    revoked: Number(c.revoked ?? 0),
                },
            })
        );
    } catch (e) {
        console.error("[sessoes] erro ao listar sessões:", e);

        return semCache(
            NextResponse.json(
                { error: "Não foi possível consultar as sessões." },
                { status: 500 }
            )
        );
    }
}