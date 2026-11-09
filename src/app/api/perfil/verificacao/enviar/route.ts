import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac, randomInt } from "crypto";
import jwt from "jsonwebtoken";
import { db } from "../../../../lib/db";

export const dynamic = "force-dynamic";
const TABELA_USUARIOS = "users";
const COL_EMAIL = "email";
const COL_TELEFONE = "phone";

const VALIDADE_MINUTOS = 10;
const INTERVALO_REENVIO_SEGUNDOS = 60;

type Canal = "email" | "telefone";


async function getUsuario(): Promise<any | null> {
    const token = (await cookies()).get("access_token")?.value;
    if (!token || !process.env.JWT_SECRET) return null;
    try {
        return jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        return null;
    }
}

function gerarCodigo() {
    return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

function hashCodigo(userId: number, canal: Canal, codigo: string) {
    return createHmac("sha256", process.env.JWT_SECRET as string)
        .update(`${userId}:${canal}:${codigo}`)
        .digest("hex");
}

async function enviarEmail(para: string, codigo: string) {
    const chave = process.env.RESEND_API_KEY;

    if (!chave) {
        if (process.env.NODE_ENV === "production") {
            throw new Error("Provedor de e-mail não configurado.");
        }
        console.log(`[DEV] Código de verificação de e-mail para ${para}: ${codigo}`);
        return;
    }

    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${chave}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: process.env.EMAIL_FROM || "Maylon <no-reply@maylon.com.br>",
            to: [para],
            subject: "Seu código de verificação",
            html: `
                <div style="font-family:Arial,sans-serif;max-width:420px">
                    <p>Use o código abaixo para verificar seu e-mail na Maylon:</p>
                    <p style="font-size:32px;font-weight:bold;letter-spacing:8px">${codigo}</p>
                    <p style="color:#64748b;font-size:13px">
                        O código vale por ${VALIDADE_MINUTOS} minutos. Se você não pediu, ignore esta mensagem.
                    </p>
                </div>`,
        }),
    });

    if (!res.ok) {
        throw new Error(`Falha ao enviar e-mail (${res.status}).`);
    }
}

async function enviarSms(para: string, codigo: string) {
    
    if (process.env.NODE_ENV === "production") {
        throw new Error("Provedor de SMS não configurado.");
    }
    console.log(`[DEV] Código de verificação de SMS para ${para}: ${codigo}`);
}

export async function POST(request: Request) {
    try {
        const usuario = await getUsuario();
        if (!usuario) {
            return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
        }

        const userId = Number(usuario.id ?? usuario.sub);
        if (!Number.isInteger(userId) || userId <= 0) {
            return NextResponse.json({ error: "Usuário inválido." }, { status: 401 });
        }

        const body = await request.json().catch(() => null);
        const canal = body?.canal as Canal;
        if (canal !== "email" && canal !== "telefone") {
            return NextResponse.json({ error: "Canal inválido." }, { status: 400 });
        }

        const coluna = canal === "email" ? COL_EMAIL : COL_TELEFONE;
        const [usuarios]: any = await db.query(
            `SELECT ${coluna} AS destino FROM ${TABELA_USUARIOS} WHERE id = ? LIMIT 1`,
            [userId]
        );
        const destino = String(usuarios?.[0]?.destino ?? "").trim();
        if (!destino) {
            return NextResponse.json(
                {
                    error:
                        canal === "email"
                            ? "Nenhum e-mail cadastrado."
                            : "Nenhum telefone cadastrado.",
                },
                { status: 400 }
            );
        }

        const [recentes]: any = await db.query(
            `SELECT id FROM verificacao_codigo
             WHERE user_id = ? AND canal = ?
               AND created_at > DATE_SUB(NOW(), INTERVAL ? SECOND)
             LIMIT 1`,
            [userId, canal, INTERVALO_REENVIO_SEGUNDOS]
        );
        if (recentes.length) {
            return NextResponse.json(
                { error: `Aguarde ${INTERVALO_REENVIO_SEGUNDOS} segundos para pedir outro código.` },
                { status: 429 }
            );
        }

        await db.query(
            "UPDATE verificacao_codigo SET usado = 1 WHERE user_id = ? AND canal = ? AND usado = 0",
            [userId, canal]
        );

        const codigo = gerarCodigo();
        const [insercao]: any = await db.query(
            `INSERT INTO verificacao_codigo
                (user_id, canal, destino, codigo_hash, expira_em)
             VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
            [userId, canal, destino, hashCodigo(userId, canal, codigo), VALIDADE_MINUTOS]
        );

        try {
            if (canal === "email") await enviarEmail(destino, codigo);
            else await enviarSms(destino, codigo);
        } catch (erroEnvio) {
            console.error("Erro ao enviar código:", erroEnvio);
            await db.query("DELETE FROM verificacao_codigo WHERE id = ?", [insercao.insertId]);
            return NextResponse.json(
                { error: "Não foi possível enviar o código. Tente novamente em instantes." },
                { status: 502 }
            );
        }

        return NextResponse.json({ sucesso: true, validade_minutos: VALIDADE_MINUTOS });
    } catch (error) {
        console.error("Erro na verificação (enviar):", error);
        return NextResponse.json({ error: "Erro ao enviar o código." }, { status: 500 });
    }
}