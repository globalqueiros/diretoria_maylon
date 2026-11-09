// src/app/api/planos/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import type { RowDataPacket, ResultSetHeader } from "mysql2/promise";
import { db } from "../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Configurações
// ---------------------------------------------------------------------------

const PLANOS = {
    basico: 29.9,
    plus: 59.9,
    premium: 89.9,
} as const;

const ADICIONAIS = {
    home: 50,
    van_escolar: 210,
} as const;

type Plano = keyof typeof PLANOS;
type Adicional = keyof typeof ADICIONAIS;

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

// Cookie com o token de login (JWT HS256 assinado com JWT_SECRET)
const COOKIE_TOKEN = "access_token";

const CANDIDATAS_EMAIL = ["email"];
const CANDIDATAS_TELEFONE = ["phone", "telefone", "celular"];
const CANDIDATAS_CPF = ["identification_number", "cpf", "nid"];

type ColunasAssinatura = {
    usuario: string;
    beneficio: string;
    status: string | null;
};

type ColunasUsuarios = {
    email: string | null;
    telefone: string | null;
    cpf: string | null;
};

let colunasEmCache: ColunasAssinatura | null = null;
let colunasUsuariosEmCache: ColunasUsuarios | null = null;

// ---------------------------------------------------------------------------
// Funções auxiliares
// ---------------------------------------------------------------------------

async function descobrirColunas(): Promise<ColunasAssinatura> {
    if (colunasEmCache) return colunasEmCache;

    const [cols] = await db.query<RowDataPacket[]>(
        `SHOW COLUMNS FROM \`beneficio_assinaturas\``
    );

    const nomes = cols.map((c) => String(c.Field));

    const achar = (candidatas: string[]) =>
        nomes.find((nome) => candidatas.includes(nome.toLowerCase())) ?? null;

    const usuario = achar(CANDIDATAS_USUARIO);
    const beneficio = achar(CANDIDATAS_BENEFICIO);

    if (!usuario || !beneficio) {
        throw new Error(
            `Colunas de usuário ou benefício não identificadas em beneficio_assinaturas.`
        );
    }

    const status = achar(CANDIDATAS_STATUS);

    colunasEmCache = { usuario, beneficio, status };

    return colunasEmCache;
}

async function descobrirColunasUsuarios(): Promise<ColunasUsuarios> {
    if (colunasUsuariosEmCache) return colunasUsuariosEmCache;

    // CORRIGIDO: lê as colunas da tabela de usuários (antes lia a de solicitações)
    const [cols] = await db.query<RowDataPacket[]>(
        `SHOW COLUMNS FROM \`users\``
    );

    const nomes = cols.map((c) => String(c.Field));

    const achar = (candidatas: string[]) =>
        nomes.find((nome) => candidatas.includes(nome.toLowerCase())) ?? null;

    colunasUsuariosEmCache = {
        email: achar(CANDIDATAS_EMAIL),
        telefone: achar(CANDIDATAS_TELEFONE),
        cpf: achar(CANDIDATAS_CPF),
    };

    return colunasUsuariosEmCache;
}

// Id (users.id) de quem está logado, lido do cookie. Null se não houver sessão.
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

// A tabela de solicitações já tem a coluna solicitante_id?
let temColunaSolicitante: boolean | null = null;

async function solicitacoesTemSolicitante() {
    if (temColunaSolicitante !== null) return temColunaSolicitante;

    const [cols] = await db.query<RowDataPacket[]>(
        `SHOW COLUMNS FROM \`maylon_pass_solicitacoes\` LIKE 'solicitante_id'`
    );

    temColunaSolicitante = cols.length > 0;

    return temColunaSolicitante;
}

// Expressão SQL que deixa só os números de uma coluna (tira máscara)
function somenteDigitosSql(coluna: string) {
    return `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(\`${coluna}\`, '(', ''), ')', ''), '-', ''), '.', ''), ' ', '')`;
}

function somenteDigitos(valor: unknown) {
    return String(valor ?? "").replace(/\D/g, "");
}

// O usuário já tem Maylon Pass ativo?
async function usuarioTemPlanoAtivo(usuarioId: number) {
    const colunas = await descobrirColunas();

    const parametros: unknown[] = [usuarioId, 2];

    let filtroStatus = "";

    if (colunas.status) {
        filtroStatus = `
            AND (
                \`${colunas.status}\` IS NULL
                OR LOWER(TRIM(\`${colunas.status}\`)) NOT IN (?)
            )
        `;

        parametros.push(STATUS_ASSINATURA_ENCERRADA);
    }

    const [rows] = await db.query<RowDataPacket[]>(
        `SELECT 1
         FROM \`beneficio_assinaturas\`
         WHERE \`${colunas.usuario}\` = ?
           AND \`${colunas.beneficio}\` = ?
           ${filtroStatus}
         LIMIT 1`,
        parametros
    );

    return rows.length > 0;
}

function pegar(row: RowDataPacket, ...colunas: string[]) {
    for (const coluna of colunas) {
        const valor = row[coluna];

        if (valor !== null && valor !== undefined && valor !== "") {
            return valor;
        }
    }

    return null;
}

function formatarValor(valor: unknown): number {
    if (valor === null || valor === undefined || valor === "") {
        return 0;
    }

    const numero = Number(valor);

    return Number.isFinite(numero) ? numero : 0;
}

function respostaErro(mensagem: string, status: number) {
    // Mostra no terminal o motivo de cada recusa (409 não é bug, é regra)
    if (status === 409) {
        console.warn("[api/planos] 409:", mensagem);
    }

    return NextResponse.json({ error: mensagem }, { status });
}

// ---------------------------------------------------------------------------
// GET - Listar assinantes atuais
// ---------------------------------------------------------------------------

export async function GET() {
    try {
        const colunas = await descobrirColunas();

        const parametros: unknown[] = [2];

        let filtroStatus = "";
        let selectStatus = "NULL AS assinatura_status";

        if (colunas.status) {
            filtroStatus = `
                AND (
                    ba.\`${colunas.status}\` IS NULL
                    OR LOWER(TRIM(ba.\`${colunas.status}\`)) NOT IN (?)
                )
            `;

            parametros.push(STATUS_ASSINATURA_ENCERRADA);

            // Status da assinatura (e não do cadastro do usuário)
            selectStatus = `(
                SELECT ba2.\`${colunas.status}\`
                FROM \`beneficio_assinaturas\` ba2
                WHERE ba2.\`${colunas.usuario}\` = u.id
                  AND ba2.\`${colunas.beneficio}\` = 2
                LIMIT 1
            ) AS assinatura_status`;
        }

        // CORRIGIDO: parte da tabela de usuários e liga à assinatura pelo id do
        // usuário. Plano e valor vêm da última solicitação aprovada dele.
        const [rows] = await db.query<RowDataPacket[]>(
            `SELECT u.*,
                    s.plano AS plano_solicitado,
                    s.valor AS valor_solicitado,
                    ${selectStatus}
             FROM \`users\` u
             LEFT JOIN \`maylon_pass_solicitacoes\` s
               ON s.id = (
                    SELECT MAX(s2.id)
                    FROM \`maylon_pass_solicitacoes\` s2
                    WHERE s2.usuario_id = u.id
                      AND s2.status = 'aprovado'
               )
             WHERE EXISTS (
                SELECT 1
                FROM \`beneficio_assinaturas\` ba
                WHERE ba.\`${colunas.usuario}\` = u.id
                  AND ba.\`${colunas.beneficio}\` = ?
                  ${filtroStatus}
             )
             ORDER BY u.id DESC`,
            parametros
        );

        const usuarios = rows.map((r) => {
            const nome =
                pegar(r, "full_name", "name", "nome") ??
                ([r.first_name, r.last_name].filter(Boolean).join(" ") ||
                    "Nome não informado");

            return {
                id: r.id,
                full_name: nome,
                email: pegar(r, "email") ?? "Não informado",
                phone: pegar(r, "phone", "telefone", "celular"),
                profile_image: pegar(r, "profile_image", "avatar", "foto"),
                created_at: pegar(r, "created_at", "criado_em"),
                plano: pegar(r, "plano_solicitado") ?? "Sem plano",
                valor: formatarValor(pegar(r, "valor_solicitado")),
                // A lista só traz assinaturas não encerradas; sem coluna de
                // status na assinatura, considera ativo.
                status: pegar(r, "assinatura_status") ?? "ativo",
            };
        });

        return NextResponse.json(
            { usuarios },
            { headers: { "Cache-Control": "no-store" } }
        );
    } catch (error) {
        console.error("[api/planos] erro ao listar:", error);

        return respostaErro(
            "Não foi possível carregar os assinantes do Maylon Pass.",
            500
        );
    }
}

// ---------------------------------------------------------------------------
// POST - Criar solicitação pendente de aprovação
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const plano = body.plano as Plano;

        if (!Object.prototype.hasOwnProperty.call(PLANOS, plano)) {
            return respostaErro("Plano inválido.", 400);
        }

        const adicionaisRecebidos = body.adicionais ?? [];

        if (
            !Array.isArray(adicionaisRecebidos) ||
            adicionaisRecebidos.some(
                (id) =>
                    typeof id !== "string" ||
                    !Object.prototype.hasOwnProperty.call(ADICIONAIS, id)
            )
        ) {
            return respostaErro("Adicionais inválidos.", 400);
        }

        const adicionais = [...new Set(adicionaisRecebidos as Adicional[])];

        const valor =
            PLANOS[plano] +
            adicionais.reduce((total, id) => total + ADICIONAIS[id], 0);

        const observacao =
            typeof body.observacao === "string"
                ? body.observacao.trim().slice(0, 500)
                : null;

        let usuarioVinculado: { id: number; nome: string } | null = null;
        let usuarioId: number | null = null;
        let novoUsuario: {
            nome: string;
            email: string;
            telefone: string;
            cpf: string | null;
        } | null = null;

        if (body.usuarioId !== undefined && body.usuarioId !== null) {
            usuarioId = Number(body.usuarioId);

            if (!Number.isSafeInteger(usuarioId) || usuarioId <= 0) {
                return respostaErro("Usuário inválido.", 400);
            }

            // CORRIGIDO: confere o usuário na tabela de usuários
            const [usuarios] = await db.query<RowDataPacket[]>(
                `SELECT id FROM \`users\` WHERE id = ? LIMIT 1`,
                [usuarioId]
            );

            if (!usuarios.length) {
                return respostaErro("Usuário não encontrado.", 404);
            }

            // Já tem plano ativo?
            if (await usuarioTemPlanoAtivo(usuarioId)) {
                return respostaErro("Este usuário já possui plano ativo.", 409);
            }

            // Já tem solicitação aguardando o gerente?
            const [pendentes] = await db.query<RowDataPacket[]>(
                `SELECT id
                 FROM \`maylon_pass_solicitacoes\`
                 WHERE usuario_id = ?
                   AND status = 'pendente'
                 LIMIT 1`,
                [usuarioId]
            );

            if (pendentes.length) {
                return respostaErro(
                    `Já existe uma solicitação pendente (nº ${pendentes[0].id}) para este usuário. O gerente precisa aprovar ou recusar essa antes de enviar outra.`,
                    409
                );
            }
        } else {
            const dados = body.novoUsuario;

            if (!dados || typeof dados !== "object") {
                return respostaErro(
                    "Informe um usuário existente ou os dados do novo usuário.",
                    400
                );
            }

            const nome =
                typeof dados.nome === "string" ? dados.nome.trim() : "";

            const email =
                typeof dados.email === "string"
                    ? dados.email.trim().toLowerCase()
                    : "";

            const telefone =
                typeof dados.telefone === "string"
                    ? dados.telefone.replace(/\D/g, "")
                    : "";

            const cpf =
                typeof dados.cpf === "string"
                    ? dados.cpf.replace(/\D/g, "")
                    : "";

            if (nome.length < 3) {
                return respostaErro("Nome inválido.", 400);
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return respostaErro("E-mail inválido.", 400);
            }

            if (telefone.length < 10 || telefone.length > 11) {
                return respostaErro("Telefone inválido.", 400);
            }

            if (cpf && cpf.length !== 11) {
                return respostaErro("CPF inválido.", 400);
            }

            // Já existe cadastro com esses dados? Então a solicitação é feita
            // para o usuário existente, em vez de pedir um cadastro duplicado.
            const colsUsuarios = await descobrirColunasUsuarios();

            const condicoes: string[] = [];
            const paramsBusca: unknown[] = [];

            if (colsUsuarios.email) {
                condicoes.push(`LOWER(TRIM(\`${colsUsuarios.email}\`)) = ?`);
                paramsBusca.push(email);
            }

            if (colsUsuarios.telefone) {
                condicoes.push(`${somenteDigitosSql(colsUsuarios.telefone)} = ?`);
                paramsBusca.push(telefone);
            }

            if (colsUsuarios.cpf && cpf) {
                condicoes.push(`${somenteDigitosSql(colsUsuarios.cpf)} = ?`);
                paramsBusca.push(cpf);
            }

            // Texto que explica por qual dado o cadastro existente foi achado
            let detalheVinculo = "";

            if (condicoes.length) {
                // CORRIGIDO: busca na tabela de usuários
                const [encontrados] = await db.query<RowDataPacket[]>(
                    `SELECT * FROM \`users\` WHERE ${condicoes.join(" OR ")}`,
                    paramsBusca
                );

                const ids = [...new Set(encontrados.map((r) => Number(r.id)))];

                if (ids.length > 1) {
                    return respostaErro(
                        `O e-mail, telefone ou CPF informados pertencem a usuários diferentes (ids ${ids.join(", ")}). Busque pelo cadastro correto.`,
                        409
                    );
                }

                if (ids.length === 1) {
                    const achado = encontrados[0];

                    usuarioVinculado = {
                        id: ids[0],
                        nome: String(
                            pegar(achado, "full_name", "name", "nome") ?? nome
                        ),
                    };

                    // Quais dados digitados bateram com esse cadastro
                    const bateu: string[] = [];

                    if (
                        colsUsuarios.email &&
                        String(achado[colsUsuarios.email] ?? "")
                            .trim()
                            .toLowerCase() === email
                    ) {
                        bateu.push("e-mail");
                    }

                    if (
                        colsUsuarios.telefone &&
                        somenteDigitos(achado[colsUsuarios.telefone]) === telefone
                    ) {
                        bateu.push("telefone");
                    }

                    if (
                        colsUsuarios.cpf &&
                        cpf &&
                        somenteDigitos(achado[colsUsuarios.cpf]) === cpf
                    ) {
                        bateu.push("CPF");
                    }

                    detalheVinculo = bateu.length
                        ? ` O cadastro (id ${ids[0]}) foi encontrado pelo ${bateu.join(" e ")} informado.`
                        : ` O cadastro tem o id ${ids[0]}.`;
                }
            }

            if (usuarioVinculado) {
                usuarioId = usuarioVinculado.id;

                if (await usuarioTemPlanoAtivo(usuarioId)) {
                    return respostaErro(
                        `${usuarioVinculado.nome} já possui plano ativo.${detalheVinculo}`,
                        409
                    );
                }

                const [pendentesUsuario] = await db.query<RowDataPacket[]>(
                    `SELECT id
                     FROM \`maylon_pass_solicitacoes\`
                     WHERE usuario_id = ?
                       AND status = 'pendente'
                     LIMIT 1`,
                    [usuarioId]
                );

                if (pendentesUsuario.length) {
                    return respostaErro(
                        `Já existe uma solicitação pendente (nº ${pendentesUsuario[0].id}) para ${usuarioVinculado.nome}. O gerente precisa aprovar ou recusar essa antes de enviar outra.${detalheVinculo}`,
                        409
                    );
                }
            } else {
                // Já existe outra solicitação pendente para a mesma pessoa?
                const [pendentes] = await db.query<RowDataPacket[]>(
                    `SELECT id
                     FROM \`maylon_pass_solicitacoes\`
                     WHERE status = 'pendente'
                       AND novo_usuario IS NOT NULL
                       AND (
                            JSON_UNQUOTE(JSON_EXTRACT(novo_usuario, '$.email')) = ?
                            OR JSON_UNQUOTE(JSON_EXTRACT(novo_usuario, '$.telefone')) = ?
                       )
                     LIMIT 1`,
                    [email, telefone]
                );

                if (pendentes.length) {
                    return respostaErro(
                        `Já existe uma solicitação pendente (nº ${pendentes[0].id}) para este e-mail ou telefone. O gerente precisa aprovar ou recusar essa antes de enviar outra.`,
                        409
                    );
                }

                novoUsuario = {
                    nome,
                    email,
                    telefone,
                    cpf: cpf || null,
                };
            }
        }

        // A solicitação é gravada sem criar usuário ou assinatura.
        // O solicitante é o users.id de quem está logado (cookie de login).
        const solicitanteId = lerUsuarioLogadoId(request);

        const campos = [
            "usuario_id",
            "novo_usuario",
            "plano",
            "adicionais",
            "valor",
            "observacao",
            "status",
        ];
        const valores: unknown[] = [
            usuarioId,
            novoUsuario ? JSON.stringify(novoUsuario) : null,
            plano,
            JSON.stringify(adicionais),
            valor,
            observacao,
            "pendente",
        ];

        if (await solicitacoesTemSolicitante()) {
            campos.push("solicitante_id");
            valores.push(solicitanteId);
        }

        const [resultado] = await db.query<ResultSetHeader>(
            `INSERT INTO \`maylon_pass_solicitacoes\`
             (${campos.map((c) => `\`${c}\``).join(", ")})
             VALUES (${campos.map(() => "?").join(", ")})`,
            valores
        );

        return NextResponse.json(
            {
                success: true,
                message: usuarioVinculado
                    ? `${usuarioVinculado.nome} já tinha cadastro. Solicitação enviada para aprovação do gerente no usuário existente.`
                    : "Solicitação enviada para aprovação do gerente.",
                usuarioExistente: usuarioVinculado,
                solicitacaoId: resultado.insertId,
                status: "pendente",
                valor,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("[api/planos] erro ao solicitar plano:", error);

        return respostaErro(
            "Não foi possível enviar a solicitação. Veja o erro no terminal do servidor.",
            500
        );
    }
}