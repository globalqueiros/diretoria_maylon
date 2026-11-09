import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import type {
    PoolConnection,
    ResultSetHeader,
    RowDataPacket,
} from "mysql2/promise";
import { db } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Configurações
// ---------------------------------------------------------------------------

const BENEFICIO_MAYLON_PASS_ID = 2;
const TABELA_ASSINATURAS = "beneficio_assinaturas";
const TABELA_SOLICITACOES = "maylon_pass_solicitacoes";

// Cookie com o token de login e valor de users.user_type que identifica o gerente
const COOKIE_TOKEN = "access_token";
const TIPO_GERENTE = "gerente";

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

type Contexto = {
    params: Promise<{ id: string }>;
};

type InfoColuna = { nome: string; tipo: string };

type NovoUsuario = {
    nome: string;
    email: string;
    telefone: string;
    cpf: string | null;
};

// ---------------------------------------------------------------------------
// Autenticação: lê o id do usuário logado no cookie (JWT HS256 com JWT_SECRET)
// ---------------------------------------------------------------------------

function lerUsuarioLogadoId(request: NextRequest): number | null {
    const token = request.cookies.get(COOKIE_TOKEN)?.value;
    const segredo = process.env.JWT_SECRET;

    if (!token || !segredo) return null;

    const partes = token.split(".");
    if (partes.length !== 3) return null;

    const [cabecalho, corpo, assinatura] = partes;

    try {
        const header = JSON.parse(
            Buffer.from(cabecalho, "base64url").toString("utf8")
        );
        if (header?.alg !== "HS256") return null;

        const esperado = createHmac("sha256", segredo)
            .update(`${cabecalho}.${corpo}`)
            .digest();
        const recebido = Buffer.from(assinatura, "base64url");

        if (
            recebido.length !== esperado.length ||
            !timingSafeEqual(recebido, esperado)
        ) {
            return null;
        }

        const payload = JSON.parse(
            Buffer.from(corpo, "base64url").toString("utf8")
        );

        if (
            typeof payload.exp === "number" &&
            payload.exp * 1000 < Date.now()
        ) {
            return null;
        }

        const id = Number(
            payload.id ?? payload.sub ?? payload.userId ?? payload.user_id
        );

        return Number.isSafeInteger(id) && id > 0 ? id : null;
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Auxiliares de banco
// ---------------------------------------------------------------------------

async function mapaColunas(conn: PoolConnection, tabela: string) {
    const [cols] = await conn.query<RowDataPacket[]>(
        `SHOW COLUMNS FROM \`${tabela}\``
    );

    const mapa = new Map<string, InfoColuna>();

    for (const c of cols) {
        mapa.set(String(c.Field).toLowerCase(), {
            nome: String(c.Field),
            tipo: String(c.Type).toLowerCase(),
        });
    }

    return mapa;
}

function achar(
    mapa: Map<string, InfoColuna>,
    candidatas: string[]
): InfoColuna | null {
    for (const candidata of candidatas) {
        const coluna = mapa.get(candidata);
        if (coluna) return coluna;
    }
    return null;
}

// Valor que representa "assinatura ativa" conforme o tipo da coluna de status
function valorAtivo(tipo: string): string | number {
    if (/int|bit|bool/.test(tipo)) return 1;

    if (tipo.startsWith("enum")) {
        for (const opcao of ["ativo", "active", "ativa"]) {
            if (tipo.includes(`'${opcao}'`)) return opcao;
        }
        const primeira = tipo.match(/'([^']+)'/);
        if (primeira) return primeira[1];
    }

    return "ativo";
}

// Expressão SQL que deixa só os números de uma coluna (tira máscara)
function somenteDigitosSql(coluna: string) {
    return `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(\`${coluna}\`, '(', ''), ')', ''), '-', ''), '.', ''), ' ', ''), '+', '')`;
}

function somenteDigitos(valor: unknown) {
    return String(valor ?? "").replace(/\D/g, "");
}

function lerJson<T>(valor: unknown): T | null {
    if (valor === null || valor === undefined) return null;

    if (typeof valor === "string") {
        try {
            return JSON.parse(valor) as T;
        } catch {
            return null;
        }
    }

    return valor as T;
}

function resposta(mensagem: string, status: number) {
    return NextResponse.json({ error: mensagem }, { status });
}

// ---------------------------------------------------------------------------
// PATCH - Aprovar ou recusar uma solicitação
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, context: Contexto) {
    let connection: PoolConnection | null = null;
    let emTransacao = false;

    try {
        // Validações que não precisam do banco vêm antes de pegar conexão
        const { id } = await context.params;
        const solicitacaoId = Number(id);

        if (!Number.isSafeInteger(solicitacaoId) || solicitacaoId <= 0) {
            return resposta("Solicitação inválida.", 400);
        }

        let body: { decisao?: unknown; motivo?: unknown } | null = null;

        try {
            body = await request.json();
        } catch {
            return resposta("Corpo da requisição inválido.", 400);
        }

        if (
            !body ||
            typeof body !== "object" ||
            (body.decisao !== "aprovar" && body.decisao !== "recusar")
        ) {
            return resposta("Decisão inválida.", 400);
        }

        // 1) Quem está decidindo? Precisa estar logado e ser gerente.
        const gerenteId = lerUsuarioLogadoId(request);

        if (!gerenteId) {
            return resposta(
                "Sessão inválida ou expirada. Entre novamente.",
                401
            );
        }

        connection = await db.getConnection();

        const [gerentes] = await connection.query<RowDataPacket[]>(
            "SELECT id FROM users WHERE id = ? AND user_type = ? LIMIT 1",
            [gerenteId, TIPO_GERENTE]
        );

        if (!gerentes.length) {
            return resposta(
                "Apenas gerentes podem decidir solicitações.",
                403
            );
        }

        // 2) Trava a solicitação para ninguém decidir duas vezes
        await connection.beginTransaction();
        emTransacao = true;

        const [rows] = await connection.query<RowDataPacket[]>(
            `SELECT *
             FROM \`${TABELA_SOLICITACOES}\`
             WHERE id = ?
             FOR UPDATE`,
            [solicitacaoId]
        );

        if (!rows.length) {
            await connection.rollback();
            emTransacao = false;
            return resposta("Solicitação não encontrada.", 404);
        }

        const solicitacao = rows[0];

        if (solicitacao.status !== "pendente") {
            await connection.rollback();
            emTransacao = false;
            return resposta("Esta solicitação já foi decidida.", 409);
        }

        // 3) Recusar
        if (body.decisao === "recusar") {
            await connection.query<ResultSetHeader>(
                `UPDATE \`${TABELA_SOLICITACOES}\`
                 SET status = 'recusado',
                     gerente_id = ?,
                     motivo_recusa = ?,
                     decidido_em = NOW()
                 WHERE id = ?
                   AND status = 'pendente'`,
                [
                    gerenteId,
                    typeof body.motivo === "string"
                        ? body.motivo.trim().slice(0, 500) || null
                        : null,
                    solicitacaoId,
                ]
            );

            await connection.commit();
            emTransacao = false;

            return NextResponse.json({
                success: true,
                message: "Solicitação recusada.",
            });
        }

        // 4) Aprovar: cadastra o usuário (se for novo) e ativa o plano
        let vinculado = false;
        let usuarioId: number | null =
            solicitacao.usuario_id !== null &&
            solicitacao.usuario_id !== undefined
                ? Number(solicitacao.usuario_id)
                : null;

        if (!usuarioId) {
            const novo = lerJson<NovoUsuario>(solicitacao.novo_usuario);

            if (!novo) {
                await connection.rollback();
                emTransacao = false;
                return resposta(
                    "A solicitação não tem usuário nem dados de cadastro.",
                    422
                );
            }

            const nome = String(novo.nome ?? "").trim();
            const email = String(novo.email ?? "").trim();
            const telefone = String(novo.telefone ?? "").trim();
            const emailBusca = email.toLowerCase();
            const telefoneBusca = somenteDigitos(telefone);

            if (!nome || !emailBusca || !telefoneBusca) {
                await connection.rollback();
                emTransacao = false;
                return resposta(
                    "Os dados de cadastro da solicitação estão incompletos (nome, e-mail ou telefone).",
                    422
                );
            }

            const colsUsuarios = await mapaColunas(connection, "users");

            const colNome = achar(colsUsuarios, ["full_name", "name", "nome"]);
            const colEmail = achar(colsUsuarios, ["email"]);
            const colTelefone = achar(colsUsuarios, [
                "phone",
                "telefone",
                "celular",
            ]);
            const colCpf = achar(colsUsuarios, [
                "identification_number",
                "cpf",
                "nid",
            ]);

            if (!colNome || !colEmail || !colTelefone) {
                throw new Error(
                    "Colunas de nome, e-mail ou telefone não identificadas em users."
                );
            }

            // Já existe cadastro com esse e-mail ou telefone? Então o plano
            // é ativado nesse usuário, em vez de criar um cadastro duplicado.
            const [existentes] = await connection.query<RowDataPacket[]>(
                `SELECT id FROM users
                 WHERE LOWER(TRIM(\`${colEmail.nome}\`)) = ?
                    OR ${somenteDigitosSql(colTelefone.nome)} = ?`,
                [emailBusca, telefoneBusca]
            );

            const idsExistentes = [
                ...new Set(existentes.map((r) => Number(r.id))),
            ];

            if (idsExistentes.length > 1) {
                await connection.rollback();
                emTransacao = false;
                return resposta(
                    "O e-mail e o telefone desta solicitação pertencem a usuários diferentes. Recuse e refaça a solicitação com o usuário correto.",
                    409
                );
            }

            if (idsExistentes.length === 1) {
                usuarioId = idsExistentes[0];
                vinculado = true;
            } else {
                const campos: string[] = [
                    colNome.nome,
                    colEmail.nome,
                    colTelefone.nome,
                ];
                const valores: unknown[] = [nome, email, telefone];

                if (colCpf && novo.cpf) {
                    campos.push(colCpf.nome);
                    valores.push(novo.cpf);
                }

                const [criado] = await connection.query<ResultSetHeader>(
                    `INSERT INTO users (${campos
                        .map((c) => `\`${c}\``)
                        .join(", ")})
                     VALUES (${campos.map(() => "?").join(", ")})`,
                    valores
                );

                usuarioId = criado.insertId;

                if (!usuarioId) {
                    throw new Error(
                        "O cadastro do usuário não devolveu um id."
                    );
                }
            }
        }

        const colsAssinatura = await mapaColunas(connection, TABELA_ASSINATURAS);

        const colUsuario = achar(colsAssinatura, [
            "user_id",
            "users_id",
            "usuario_id",
            "id_user",
            "id_usuario",
            "cliente_id",
            "id_cliente",
        ]);
        const colBeneficio = achar(colsAssinatura, [
            "beneficio_id",
            "beneficios_id",
            "id_beneficio",
            "benefit_id",
        ]);

        if (!colUsuario || !colBeneficio) {
            throw new Error(
                `Colunas de usuário ou benefício não identificadas em ${TABELA_ASSINATURAS}.`
            );
        }

        const colStatus = achar(colsAssinatura, [
            "status",
            "status_assinatura",
            "situacao",
            "ativo",
            "ativa",
            "active",
            "is_active",
        ]);
        const colPlano = achar(colsAssinatura, ["plano", "plan", "plan_name"]);
        const colValor = achar(colsAssinatura, ["valor", "price", "amount"]);
        const colAdicionais = achar(colsAssinatura, ["adicionais", "addons"]);

        // O usuário já tem Maylon Pass ativo?
        const parametrosAtivo: unknown[] = [usuarioId, BENEFICIO_MAYLON_PASS_ID];
        let filtroAtivo = "";

        if (colStatus) {
            filtroAtivo = `AND (\`${colStatus.nome}\` IS NULL
                OR LOWER(TRIM(\`${colStatus.nome}\`)) NOT IN (?))`;
            parametrosAtivo.push(STATUS_ASSINATURA_ENCERRADA);
        }

        const [ativas] = await connection.query<RowDataPacket[]>(
            `SELECT 1
             FROM \`${TABELA_ASSINATURAS}\`
             WHERE \`${colUsuario.nome}\` = ?
               AND \`${colBeneficio.nome}\` = ?
               ${filtroAtivo}
             LIMIT 1`,
            parametrosAtivo
        );

        if (ativas.length) {
            await connection.rollback();
            emTransacao = false;
            return resposta("Este usuário já possui plano ativo.", 409);
        }

        const camposAss: string[] = [colUsuario.nome, colBeneficio.nome];
        const valoresAss: unknown[] = [usuarioId, BENEFICIO_MAYLON_PASS_ID];

        if (colStatus) {
            camposAss.push(colStatus.nome);
            valoresAss.push(valorAtivo(colStatus.tipo));
        }
        if (colPlano) {
            camposAss.push(colPlano.nome);
            valoresAss.push(solicitacao.plano);
        }
        if (colValor) {
            camposAss.push(colValor.nome);
            valoresAss.push(solicitacao.valor);
        }
        if (colAdicionais) {
            const adicionais = lerJson<string[]>(solicitacao.adicionais) ?? [];
            camposAss.push(colAdicionais.nome);
            valoresAss.push(JSON.stringify(adicionais));
        }

        await connection.query<ResultSetHeader>(
            `INSERT INTO \`${TABELA_ASSINATURAS}\`
             (${camposAss.map((c) => `\`${c}\``).join(", ")})
             VALUES (${camposAss.map(() => "?").join(", ")})`,
            valoresAss
        );

        await connection.query<ResultSetHeader>(
            `UPDATE \`${TABELA_SOLICITACOES}\`
             SET status = 'aprovado',
                 gerente_id = ?,
                 decidido_em = NOW()
             WHERE id = ?
               AND status = 'pendente'`,
            [gerenteId, solicitacaoId]
        );

        await connection.commit();
        emTransacao = false;

        return NextResponse.json({
            success: true,
            message: vinculado
                ? "Solicitação aprovada. Este e-mail ou telefone já tinha cadastro, então o plano foi ativado no usuário existente."
                : "Solicitação aprovada e plano ativado.",
        });
    } catch (error) {
        if (emTransacao && connection) {
            await connection.rollback().catch(() => undefined);
        }

        console.error("[solicitacoes PATCH]", error);

        // E-mail, telefone ou CPF duplicado em users (corrida entre cadastros)
        if ((error as { code?: string } | null)?.code === "ER_DUP_ENTRY") {
            return resposta(
                "Já existe um cadastro com esses dados (e-mail, telefone ou CPF).",
                409
            );
        }

        return resposta("Erro ao processar solicitação.", 500);
    } finally {
        connection?.release();
    }
}