import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

async function getUsuario(): Promise<any | null> {
    const token = (await cookies()).get("access_token")?.value;
    if (!token || !process.env.JWT_SECRET) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null;
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const usuario = await getUsuario();
        if (!usuario) {
            return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
        }

        const colaboradorId = Number(usuario.id ?? usuario.sub);
        if (!Number.isInteger(colaboradorId) || colaboradorId <= 0) {
            return NextResponse.json({ error: "Usuário inválido." }, { status: 401 });
        }

        const { id } = await params;
        const beneficioId = Number(id);
        if (!Number.isInteger(beneficioId) || beneficioId <= 0) {
            return NextResponse.json({ error: "Benefício inválido." }, { status: 400 });
        }

        const body = await request.json();
        const ativo = Number(body?.ativo);
        if (ativo !== 0 && ativo !== 1) {
            return NextResponse.json({ error: "O campo ativo deve ser 0 ou 1." }, { status: 400 });
        }

        const [existente]: any = await db.query(
            "SELECT id FROM beneficios WHERE id = ?",
            [beneficioId]
        );
        if (!existente.length) {
            return NextResponse.json({ error: "Benefício não encontrado." }, { status: 404 });
        }

        await db.query(
            `INSERT INTO colaborador_beneficio (colaborador_id, beneficio_id, ativo, updated_at)
             VALUES (?, ?, ?, NOW())
             ON DUPLICATE KEY UPDATE ativo = VALUES(ativo), updated_at = NOW()`,
            [colaboradorId, beneficioId, ativo]
        );

        return NextResponse.json({ sucesso: true, id: beneficioId, ativo });
    } catch (error) {
        console.error("Erro ao atualizar benefício:", error);
        return NextResponse.json({ error: "Erro ao atualizar benefício." }, { status: 500 });
    }
}