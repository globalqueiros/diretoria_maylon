import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../../lib/db";

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const { aprovadoPor, observacao } = await req.json();
    await db.query(
        `
        UPDATE marketing_campaigns
        SET
            status='APROVADA',
            aprovado_por=?,
            aprovado_em=NOW(),
            observacao_diretor=?
        WHERE id=?
    `,
        [aprovadoPor, observacao, id]
    );
    return NextResponse.json({
        success: true,
        message: "Campanha aprovada."
    });
}