import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { db } from "../../../lib/db";
import {
    TIPOS_ATENDIMENTO,
    getUsuarioLogado,
} from "../../../lib/maylon-pass";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mesmas regras da rota POST /api/maylon-pass
const BENEFICIO_MAYLON_PASS_ID = 2;
const TABELA_ASSINATURAS = "beneficio_assinaturas";
const TABELA_SOLICITACOES = "maylon_pass_solicitacoes";

const STATUS_ASSINATURA_ENCERRADA = [
    "inativo",
    "inactive",
    "0",
    "false",
    "cancelado",
    "cancelada",
    "canceled",
    "cancelled",
    "encerrado",
    "encerrada",
    "expirado",
    "expirada",
    "expired",
    "suspenso",
    "suspensa",
    "suspended",
    "desativado",
    "desativada",
    "disabled",
];

const CANDIDATAS_STATUS = [
    "status",
    "status_assinatura",
    "situacao",
    "ativo",
    "ativa",
    "active",
    "is_active",
];

const CANDIDATAS_USUARIO = [
    "user_id",
    "users_id",
    "usuario_id",
    "id_user",
    "id_usuario",
    "cliente_id",
    "id_cliente",
];

const CANDIDATAS_BENEFICIO = [
    "beneficio_id",
    "beneficios_id",
    "id_beneficio",
    "benefit_id",
];

type ColunasAssinatura = {
    usuario: string;
    beneficio: string;
    status: string | null;
};

let colunasEmCache: ColunasAssinatura | null = null;

async function descobrirColunas(): Promise<ColunasAssinatura> {
    if (colunasEmCache) return colunasEmCache;

    const [cols] = await db.query<RowDataPacket[]>(
        `SHOW COLUMNS FROM \`${TABELA_ASSINATURAS}\``
    );

    const nomes = cols.map((c) => String(c.Field));

    const achar = (candidatas: string[]) =>
        nomes.find((nome) => candidatas.includes(nome.toLowerCase())) ?? null;

    const usuario = achar(CANDIDATAS_USUARIO);
    const beneficio = achar(CANDIDATAS_BENEFICIO);

    if (!usuario || !beneficio) {
        throw new Error(
            `Colunas de usuário ou benefício não identificadas em ${TABELA_ASSINATURAS}.`
        );
    }

    colunasEmCache = { usuario, beneficio, status: achar(CANDIDATAS_STATUS) };

    return colunasEmCache;
}

// Dos ids recebidos, quais já têm Maylon Pass ativo?
async function idsComPlanoAtivo(ids: number[]) {
    const colunas = await descobrirColunas();

    const parametros: unknown[] = [BENEFICIO_MAYLON_PASS_ID, ids];
    let filtroStatus = "";

    if (colunas.status) {
        filtroStatus = `AND (\`${colunas.status}\` IS NULL
            OR LOWER(TRIM(\`${colunas.status}\`)) NOT IN (?))`;
        parametros.push(STATUS_ASSINATURA_ENCERRADA);
    }

    const [rows] = await db.query<RowDataPacket[]>(
        `SELECT DISTINCT \`${colunas.usuario}\` AS uid
         FROM \`${TABELA_ASSINATURAS}\`
         WHERE \`${colunas.beneficio}\` = ?
           AND \`${colunas.usuario}\` IN (?)
           ${filtroStatus}`,
        parametros
    );

    return new Set(rows.map((r) => Number(r.uid)));
}

// Dos ids recebidos, quais têm solicitação aguardando o gerente?
async function idsComSolicitacaoPendente(ids: number[]) {
    const [rows] = await db.query<RowDataPacket[]>(
        `SELECT DISTINCT usuario_id AS uid
         FROM \`${TABELA_SOLICITACOES}\`
         WHERE status = 'pendente'
           AND usuario_id IN (?)`,
        [ids]
    );

    return new Set(rows.map((r) => Number(r.uid)));
}

export async function GET(req: Request) {
    try {
        const sessao = await getUsuarioLogado();

        if (!sessao) {
            console.warn(
                "[MAYLON PASS] Busca bloqueada: sessão não encontrada."
            );

            return NextResponse.json(
                { error: "Sessão não encontrada. Faça login novamente." },
                { status: 401 }
            );
        }

        if (!TIPOS_ATENDIMENTO.includes(sessao.tipo)) {
            console.warn(
                "[MAYLON PASS] Busca bloqueada: tipo sem permissão.",
                { tipo: sessao.tipo }
            );

            return NextResponse.json(
                { error: "Seu perfil não tem permissão para consultar usuários." },
                { status: 403 }
            );
        }

        const busca = (
            new URL(req.url).searchParams.get("busca") ?? ""
        ).trim();

        if (busca.length < 2) {
            return NextResponse.json([]);
        }

        const termo = `%${busca.replace(/[\\%_]/g, "\\$&")}%`;

        const [rows] = await db.query<RowDataPacket[]>(
            `SELECT
                id,
                full_name AS nome,
                email,
                phone AS telefone
             FROM users
             WHERE user_type = 'customer'
               AND (
                    full_name LIKE ? ESCAPE '\\\\'
                    OR email LIKE ? ESCAPE '\\\\'
                    OR phone LIKE ? ESCAPE '\\\\'
               )
             ORDER BY full_name
             LIMIT 10`,
            [termo, termo, termo]
        );

        if (!rows.length) {
            return NextResponse.json([]);
        }

        const ids = rows.map((r) => Number(r.id));

        const [ativos, pendentes] = await Promise.all([
            idsComPlanoAtivo(ids),
            idsComSolicitacaoPendente(ids),
        ]);

        const resultado = rows.map((r) => ({
            id: r.id,
            nome: r.nome,
            email: r.email,
            telefone: r.telefone,
            temPlanoAtivo: ativos.has(Number(r.id)),
            temSolicitacaoPendente: pendentes.has(Number(r.id)),
        }));

        return NextResponse.json(resultado, {
            headers: { "Cache-Control": "no-store" },
        });
    } catch (error) {
        console.error("[MAYLON PASS] Erro na busca de usuários:", error);

        return NextResponse.json(
            { error: "Erro interno ao buscar usuários." },
            { status: 500 }
        );
    }
}