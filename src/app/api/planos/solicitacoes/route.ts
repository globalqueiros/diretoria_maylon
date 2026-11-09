// src/app/api/maylon-pass/solicitacoes/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2/promise";
import { db } from "../../../lib/db";

export const dynamic = "force-dynamic";

interface TokenPayload {
    id: number;
    role?: string;
}

// Id do usuário logado, lido do cookie access_token (mesmo método do /api/me)
async function getUsuarioLogadoId(): Promise<number | null> {
    const token = (await cookies()).get("access_token")?.value;
    const secret = process.env.JWT_SECRET;

    if (!token || !secret) return null;

    try {
        const decoded = jwt.verify(token, secret) as TokenPayload;
        const id = Number(decoded?.id);
        return Number.isSafeInteger(id) && id > 0 ? id : null;
    } catch {
        return null;
    }
}

function lerJson(valor: unknown, padrao: any) {
    if (valor == null) return padrao;
    if (typeof valor !== "string") return valor;
    try {
        return JSON.parse(valor);
    } catch {
        return padrao;
    }
}

export async function GET(req: Request) {
    try {
        const userId = await getUsuarioLogadoId();
        if (!userId) {
            return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const status = searchParams.get("status") ?? "todos";

        const params: any[] = [userId];
        let filtroStatus = "";
        if (status !== "todos") {
            filtroStatus = "AND s.status = ?";
            params.push(status);
        }

        // Solicitações de quem está logado: usa solicitante_id e, se for NULL,
        // cai para usuario_id.
        const [rows] = await db.query<RowDataPacket[]>(
            `SELECT s.id, s.usuario_id, s.novo_usuario, s.plano, s.adicionais,
                    s.valor, s.status, s.motivo_recusa, s.criado_em, s.decidido_em,
                    u.full_name AS usuario_nome
               FROM maylon_pass_solicitacoes s
               LEFT JOIN users u ON u.id = s.usuario_id
              WHERE COALESCE(s.solicitante_id, s.usuario_id) = ?
              ${filtroStatus}
              ORDER BY s.id DESC
              LIMIT 20`,
            params
        );

        const solicitacoes = rows.map((r) => {
            const novo = lerJson(r.novo_usuario, null);
            const adicionais = lerJson(r.adicionais, []);

            return {
                id: r.id,
                status: r.status,
                plano: r.plano,
                adicionais: Array.isArray(adicionais) ? adicionais : [],
                valor: Number(r.valor),
                motivoRecusa: r.motivo_recusa ?? null,
                criadoEm: r.criado_em ? new Date(r.criado_em).toISOString() : null,
                decididoEm: r.decidido_em ? new Date(r.decidido_em).toISOString() : null,
                usuario: r.usuario_nome ? { nome: r.usuario_nome } : null,
                novoUsuario: novo?.nome ? { nome: novo.nome } : null,
            };
        });

        return NextResponse.json({ solicitacoes });
    } catch (error) {
        console.error("[solicitacoes GET]", error);
        return NextResponse.json(
            { error: "Não foi possível carregar as solicitações." },
            { status: 500 }
        );
    }
}