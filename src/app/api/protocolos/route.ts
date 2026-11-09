import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db2 } from "../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ProtocoloRow = RowDataPacket & {
    id: number;
    usuario_id: number | null;
    codigo: string;
    nome: string | null;
    email: string | null;
    categoria: string | null;
    assunto: string | null;
    mensagem: string | null;
    arquivo: string | null;
    documento_url: string | null;
    status: string | null;
    resposta: string | null;
    resposta_usuario: string | null;
    resposta_usuario_em_fmt: string | null;
    criado_em_fmt: string | null;
    atualizado_em_fmt: string | null;
};

function normalizarStatus(status: string | null) {
    const valor = (status ?? "").toLowerCase().trim();

    if (
        
        valor.includes("encerrado") ||
        valor.includes("finalizado") ||
        valor.includes("fechado")
    ) {
        return "encerrado";
    }

    if (valor.includes("aguardando")) {
        return "aguardando";
    }

    if (
        valor.includes("andamento") ||
        valor.includes("em atendimento")
    ) {
        return "andamento";
    }

    return "aberto";
}

export async function GET() {
    try {
        const [rows] = await db2.query<ProtocoloRow[]>(`
        SELECT
        id,
        codigo,
        nome,
        email,
        categoria,
        assunto,
        mensagem,
        arquivo,
        documento_url,
        status,
        resposta,
        resposta_usuario,
        DATE_FORMAT(CONVERT_TZ(resposta_usuario_em, '+00:00', '-03:00'), '%d/%m/%Y %H:%i') AS resposta_usuario_em_fmt,
        DATE_FORMAT(CONVERT_TZ(criado_em, '+00:00', '-03:00'), '%d/%m/%Y %H:%i') AS criado_em_fmt,
        DATE_FORMAT(CONVERT_TZ(atualizado_em, '+00:00', '-03:00'), '%d/%m/%Y %H:%i') AS atualizado_em_fmt
        FROM protocolos
        ORDER BY criado_em DESC, id DESC
    `);

        const protocolos = rows.map((p: ProtocoloRow) => ({
            id: Number(p.id),
            numero: p.codigo || String(p.id),
            nome: p.nome || "Não informado",
            email: p.email || "",
            assunto: p.assunto || "Sem assunto",
            categoria: p.categoria || "Outros",
            descricao: p.mensagem || "",
            solicitante: "Passageiro",
            prioridade: "media",
            status: normalizarStatus(p.status),
            abertoEm: p.criado_em_fmt || "",
            arquivo: p.arquivo || "",
            documento_url: p.documento_url || "",
            resposta: p.resposta || "",
            resposta_usuario: p.resposta_usuario || "",
            resposta_usuario_em: p.resposta_usuario_em_fmt || "",
            atualizadoEm: p.atualizado_em_fmt || "",
            historico: [],
        }));

        return NextResponse.json(protocolos);
    } catch (error) {
        console.error("Erro ao consultar protocolos:", error);

        return NextResponse.json(
            { erro: "Não foi possível consultar os protocolos." },
            { status: 500 }
        );
    }
}