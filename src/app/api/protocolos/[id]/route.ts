import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import jwt from "jsonwebtoken";
import { db2 } from "../../../lib/db";

export const dynamic = "force-dynamic";

const pool = db2;

const STATUS_PERMITIDOS = ["pendente", "encerrado"] as const;
type StatusPermitido = (typeof STATUS_PERMITIDOS)[number];

type Contexto = {
  params: Promise<{ id: string }>;
};

type Coluna = RowDataPacket & {
  Field: string;
};

type HistoricoRow = RowDataPacket & {
  id: number;
  texto: string | null;
  data: Date | string | null;
};

type EventoInterno = {
  id: number;
  texto: string;
  data: string;
  ts: number;
  ordem: number;
};

function autenticado(req: NextRequest): boolean {
  const token = req.cookies.get("access_token")?.value;
  const secret = process.env.JWT_SECRET;
  if (!token || !secret) return false;
  try {
    jwt.verify(token, secret);
    return true;
  } catch {
    return false;
  }
}

function paraTimestamp(
  valor: Date | string | null | undefined
): number | null {
  if (!valor) return null;
  const ts = new Date(valor).getTime();
  return Number.isNaN(ts) ? null : ts;
}

function formatarData(
  valor: Date | string | null | undefined
): string {
  if (!valor) return "";
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return "";
  return data.toLocaleString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });
}

function erroJson(erro: string, status: number) {
  return NextResponse.json({ erro }, { status });
}

function identificador(nome: string): string {
  return `\`${nome.replace(/`/g, "``")}\``;
}

async function obterColunas(tabela: string): Promise<Set<string>> {
  const [colunas] = await pool.query<Coluna[]>(
    `SHOW COLUMNS FROM ${identificador(tabela)}`
  );
  return new Set(colunas.map((coluna) => coluna.Field));
}

export async function GET(
  req: NextRequest,
  { params }: Contexto
) {
  if (!autenticado(req)) {
    return erroJson("Não autorizado.", 401);
  }

  const { id } = await params;

  if (!/^[1-9]\d*$/.test(id)) {
    return erroJson("ID do protocolo inválido.", 400);
  }

  try {
    const colunas = await obterColunas("protocolos");

    if (!colunas.has("id")) {
      return erroJson(
        "A tabela protocolos não possui a coluna id.",
        500
      );
    }

    const campos = [
      "id",
      "usuario_id",
      "nome",
      "email",
      "codigo",
      "categoria",
      "assunto",
      "mensagem",
      "arquivo",
      "documento_url",
      "status",
      "resposta",
      "resposta_usuario",
      "resposta_usuario_em",
      "criado_em",
      "atualizado_em",
    ];

    const camposExistentes = campos.filter((campo) =>
      colunas.has(campo)
    );

    const selectProtocolo = camposExistentes
      .map((campo) => `p.${identificador(campo)}`)
      .join(", ");

    const [registros] = await pool.query<RowDataPacket[]>(
      `SELECT ${selectProtocolo}
       FROM protocolos p
       WHERE p.id = ?
       LIMIT 1`,
      [id]
    );

    if (registros.length === 0) {
      try {
        const [info] = await pool.query<RowDataPacket[]>(
          `SELECT DATABASE() AS banco,
                  (SELECT COUNT(*) FROM protocolos) AS total,
                  (SELECT MAX(id) FROM protocolos) AS maior_id`
        );

        console.error("Protocolo não encontrado:", {
          id,
          ...info[0],
        });
      } catch (erroInfo) {
        console.error(
          "Protocolo não encontrado (id " + id + ")",
          erroInfo
        );
      }

      return erroJson("Protocolo não encontrado.", 404);
    }

    const protocolo: Record<string, unknown> = {
      ...registros[0],
    };

    if (!colunas.has("usuario_id")) {
      protocolo.usuario_id = null;

      if (colunas.has("email")) {
        const colunasUsers = await obterColunas("users");

        if (
          colunasUsers.has("id") &&
          colunasUsers.has("email")
        ) {
          const [usuarios] = await pool.query<RowDataPacket[]>(
            `SELECT id
             FROM users
             WHERE email = ?
             LIMIT 1`,
            [protocolo.email ?? null]
          );

          if (usuarios.length > 0) {
            protocolo.usuario_id = Number(usuarios[0].id);
          }
        }
      }
    }

    const eventos: EventoInterno[] = [];
    let ordem = 0;

    try {
      const colunasHistorico = await obterColunas(
        "protocolo_historico"
      );

      if (
        colunasHistorico.has("id") &&
        colunasHistorico.has("protocolo_id") &&
        colunasHistorico.has("texto") &&
        colunasHistorico.has("data")
      ) {
        const [itens] = await pool.query<HistoricoRow[]>(
          `SELECT id, texto, data
           FROM protocolo_historico
           WHERE protocolo_id = ?
           ORDER BY data ASC, id ASC`,
          [id]
        );

        for (const item of itens) {
          eventos.push({
            id: Number(item.id),
            texto: String(item.texto ?? ""),
            data: formatarData(item.data),
            ts:
              paraTimestamp(item.data) ??
              Number.MAX_SAFE_INTEGER,
            ordem: ordem++,
          });
        }
      }
    } catch (erroHistorico) {
      console.error("Erro ao carregar histórico:", erroHistorico);
    }

    const abertura = [
      protocolo.assunto,
      protocolo.mensagem,
    ]
      .filter(
        (valor) =>
          valor != null && String(valor).trim() !== ""
      )
      .map(String)
      .join(" — ");

    const textoAbertura = abertura || "Protocolo aberto.";

    const aberturaJaExiste = eventos.some(
      (item) => item.texto.trim() === textoAbertura.trim()
    );

    if (!aberturaJaExiste) {
      eventos.push({
        id: 0,
        texto: textoAbertura,
        data: formatarData(
          protocolo.criado_em as Date | string | null
        ),
        ts:
          paraTimestamp(
            protocolo.criado_em as Date | string | null
          ) ?? 0,
        ordem: -1,
      });
    }

    if (
      protocolo.resposta &&
      String(protocolo.resposta).trim() !== ""
    ) {
      const resposta = String(protocolo.resposta);
      const texto = `Resposta do atendimento: ${resposta}`;

      const jaExiste = eventos.some(
        (item) =>
          item.texto === texto ||
          item.texto === `Atendimento: ${resposta}` ||
          item.texto.includes(resposta)
      );

      if (!jaExiste) {
        eventos.push({
          id: -1,
          texto,
          data: formatarData(
            protocolo.atualizado_em as Date | string | null
          ),
          ts:
            paraTimestamp(
              protocolo.atualizado_em as Date | string | null
            ) ?? Number.MAX_SAFE_INTEGER,
          ordem: ordem++,
        });
      }
    }

    if (
      protocolo.resposta_usuario &&
      String(protocolo.resposta_usuario).trim() !== ""
    ) {
      const respostaUsuario = String(
        protocolo.resposta_usuario
      );

      const texto = `Resposta do usuário: ${respostaUsuario}`;

      const jaExiste = eventos.some(
        (item) =>
          item.texto === texto ||
          item.texto.includes(respostaUsuario)
      );

      if (!jaExiste) {
        eventos.push({
          id: -2,
          texto,
          data: formatarData(
            protocolo.resposta_usuario_em as
              | Date
              | string
              | null
          ),
          ts:
            paraTimestamp(
              protocolo.resposta_usuario_em as
                | Date
                | string
                | null
            ) ?? Number.MAX_SAFE_INTEGER,
          ordem: ordem++,
        });
      }
    }

    eventos.sort((a, b) => a.ts - b.ts || a.ordem - b.ordem);

    const historico = eventos.map(
      ({ id: eventoId, texto, data }) => ({
        id: eventoId,
        texto,
        data,
      })
    );

    return NextResponse.json({
      ...protocolo,
      id: Number(protocolo.id),
      usuario_id:
        protocolo.usuario_id == null
          ? null
          : Number(protocolo.usuario_id),
      solicitacao: protocolo.mensagem ?? null,
      criado_em: formatarData(
        (protocolo.criado_em ?? null) as
          | Date
          | string
          | null
      ),
      atualizado_em: formatarData(
        (protocolo.atualizado_em ?? null) as
          | Date
          | string
          | null
      ),
      resposta_usuario_em: formatarData(
        (protocolo.resposta_usuario_em ?? null) as
          | Date
          | string
          | null
      ),
      historico,
    });
  } catch (erro) {
    console.error("GET /api/protocolos/[id]:", erro);
    return erroJson(
      "Erro interno ao carregar o protocolo.",
      500
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: Contexto
) {
  if (!autenticado(req)) {
    return erroJson("Não autorizado.", 401);
  }

  const { id } = await params;

  if (!/^[1-9]\d*$/.test(id)) {
    return erroJson("ID do protocolo inválido.", 400);
  }

  let body: { status?: string };

  try {
    body = await req.json();
  } catch {
    return erroJson("Corpo inválido.", 400);
  }

  const novoStatus = String(body.status ?? "").toLowerCase();

  if (!STATUS_PERMITIDOS.includes(novoStatus as StatusPermitido)) {
    return erroJson("Status inválido.", 400);
  }

  const status = novoStatus as StatusPermitido;

  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    const [colunas] = await conn.query<Coluna[]>(
      "SHOW COLUMNS FROM protocolos"
    );

    const campos = new Set(
      colunas.map((coluna) => coluna.Field)
    );

    if (!campos.has("id") || !campos.has("status")) {
      await conn.rollback();

      return erroJson(
        "A tabela protocolos precisa ter as colunas id e status.",
        500
      );
    }

    const [protocolos] = await conn.query<RowDataPacket[]>(
      `SELECT id, status
       FROM protocolos
       WHERE id = ?
       FOR UPDATE`,
      [id]
    );

    if (protocolos.length === 0) {
      await conn.rollback();
      return erroJson("Protocolo não encontrado.", 404);
    }

    const statusAtual = String(
      protocolos[0].status ?? ""
    ).toLowerCase();

    // Protocolo encerrado não muda mais
    if (statusAtual === "encerrado") {
      await conn.rollback();

      return erroJson(
        "Este protocolo já está encerrado.",
        409
      );
    }

    // Já está no status pedido: não faz nada e responde ok
    if (statusAtual === status) {
      await conn.rollback();

      return NextResponse.json({
        ok: true,
        id: Number(id),
        status,
      });
    }

    if (campos.has("atualizado_em")) {
      await conn.query(
        `UPDATE protocolos
         SET status = ?,
             atualizado_em = NOW()
         WHERE id = ?`,
        [status, id]
      );
    } else {
      await conn.query(
        `UPDATE protocolos
         SET status = ?
         WHERE id = ?`,
        [status, id]
      );
    }

    // Só o encerramento é registrado no histórico
    if (status === "encerrado") {
      try {
        const [colunasHistorico] = await conn.query<Coluna[]>(
          "SHOW COLUMNS FROM protocolo_historico"
        );

        const camposHistorico = new Set(
          colunasHistorico.map((coluna) => coluna.Field)
        );

        if (
          camposHistorico.has("protocolo_id") &&
          camposHistorico.has("texto") &&
          camposHistorico.has("data")
        ) {
          await conn.query(
            `INSERT INTO protocolo_historico
               (protocolo_id, texto, data)
             VALUES (?, ?, NOW())`,
            [id, "Protocolo encerrado."]
          );
        }
      } catch (erroHistorico) {
        console.error(
          "Não foi possível registrar o histórico:",
          erroHistorico
        );
      }
    }

    await conn.commit();

    return NextResponse.json({
      ok: true,
      id: Number(id),
      status,
      mensagem:
        status === "encerrado"
          ? "Protocolo encerrado com sucesso."
          : "Status atualizado para pendente.",
    });
  } catch (erro) {
    try {
      await conn.rollback();
    } catch {}

    console.error("PATCH /api/protocolos/[id]:", erro);

    return erroJson(
      "Erro interno ao atualizar o status do protocolo.",
      500
    );
  } finally {
    conn.release();
  }
}