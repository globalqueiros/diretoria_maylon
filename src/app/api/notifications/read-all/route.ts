import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../lib/db";

export async function PATCH(req: NextRequest) {
    try {
        const userId = req.headers.get("x-user-id");

        if (!userId) {
            return NextResponse.json(
                { error: "Não autorizado" },
                { status: 401 }
            );
        }

        await db.query(
            `
            UPDATE notifications
            SET
                is_read = TRUE,
                read_at = NOW()
            WHERE user_id = ?
              AND is_read = FALSE
            `,
            [userId]
        );

        return NextResponse.json({
            success: true,
        });

    } catch (error) {
        console.error(error);

        return NextResponse.json(
            { error: "Erro ao marcar notificações" },
            { status: 500 }
        );
    }
}