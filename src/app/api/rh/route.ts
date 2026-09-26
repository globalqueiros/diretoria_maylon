import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const [rows] = await db.query(`
            SELECT
                rc.id,
                rc.vaga,
                rc.etapa,

                u.id AS user_id,
                u.matricula,
                u.full_name,
                u.email,
                u.phone,
                u.cpf,
                u.profile_image,
                u.user_type,
                u.recruitment_status,
                u.contract_signed,
                u.contract_signed_at,
                u.admission_date,
                u.status,
                u.email_verified,
                u.two_factor_enabled,
                u.last_login,
                u.created_at AS user_created_at,
                u.updated_at AS user_updated_at

            FROM rh_candidatos rc

            INNER JOIN users u
                ON u.id = rc.user_id

            ORDER BY rc.created_at DESC

            LIMIT 10
        `);

        return NextResponse.json(rows);
    } catch (error: unknown) {
        console.error("ERRO GET /api/rh:", error);

        return NextResponse.json(
            {
                error: "Erro ao carregar candidatos.",
                details:
                    error instanceof Error
                        ? error.message
                        : "Erro desconhecido no banco de dados.",
            },
            { status: 500 }
        );
    }
}
