import { NextRequest, NextResponse } from "next/server";
import type { PoolConnection, ResultSetHeader, RowDataPacket } from "mysql2/promise";
import jwt from "jsonwebtoken";
import { db2 } from "../../../../lib/db";

export const dynamic = "force-dynamic";

type ProtocoloRow = RowDataPacket & {
  id: number;
  status?: string | null;
};

type EventoRow = RowDataPacket & {
  id: number;
  texto: string;
  data: Date | string;
};

type Coluna = RowDataPacket & {
  Field: string;
};

type Contexto = {
  params: Promise<{ id: string }>;
};

const PREFIXO_RESPOSTA = "Resposta do atendimento:";

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

function erroJson(erro: string, status: number) {
  return NextResponse.json({ erro }, { status });
}

export async function POST(request: NextRequest, { params }: Contexto) {
  if (!autenticado(request)) {
    return erroJson("Não autorizado.", 401);
  }

  const { id: idParam } = await params;
  const id = Number(idParam);

  if (!Number.isSafeInteger(id) || id <= 0) {
    return erroJson("ID de protocolo inválido.", 400);
  }

  let corpo: unknown;

  try {
    corpo = await request.json();
  } catch {
    return erroJson("Corpo da requisição inválido.", 400);
  }

  const dados =
    typeof corpo === "object" && corpo !== null
      ? (corpo as { texto?: unknown; mensagem?: unknown })
      : {};

  const bruto = dados.texto ?? dados.mensagem;
  const mensagem = typeof bruto === "string" ? bruto.trim() : "";

  if (!mensagem) {
    return erroJson("Digite uma resposta antes de enviar.", 400);
  }

  if (mensagem.length > 3000) {
    return erroJson("A resposta deve ter no máximo 3.000 caracteres.", 400);
  }

  let conexao: PoolConnection | undefined;

  try {
    conexao = await db2.getConnection();
    await conexao.beginTransaction();
    const [colunas] = await conexao.query<Coluna[]>(
      "SHOW COLUMNS FROM protocolos"
    );
    const campos = new Set(colunas.map((coluna) => coluna.Field));
    const temStatus = campos.has("status");
    const temAtualizadoEm = campos.has("atualizado_em");

    const [protocolos] = await conexao.execute<ProtocoloRow[]>(
      `SELECT id${temStatus ? ", status" : ""}
       FROM protocolos
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [id]
    );

    if (protocolos.length === 0) {
      await conexao.rollback();
      return erroJson("Protocolo não encontrado.", 404);
    }

    const [anteriores] = await conexao.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total
       FROM protocolo_historico
       WHERE protocolo_id = ? AND texto LIKE ?`,
      [id, `${PREFIXO_RESPOSTA}%`]
    );
    const primeiraResposta = Number(anteriores[0]?.total ?? 0) === 0;

    const [resultado] = await conexao.execute<ResultSetHeader>(
      `INSERT INTO protocolo_historico (protocolo_id, texto, data) VALUES (?, ?, NOW())`,
      [id, `${PREFIXO_RESPOSTA} ${mensagem}`]
    );
    let status = temStatus
      ? String(protocolos[0].status ?? "").toLowerCase()
      : null;

    if (
      temStatus &&
      primeiraResposta &&
      status !== "pendente" &&
      status !== "encerrado"
    ) {
      await conexao.execute(
        `UPDATE protocolos
         SET status = 'pendente'${temAtualizadoEm ? ", atualizado_em = NOW()" : ""}
         WHERE id = ?`,
        [id]
      );
      status = "pendente";
    }

    const [eventos] = await conexao.execute<EventoRow[]>(
      `SELECT id, texto, data FROM protocolo_historico WHERE id = ? AND protocolo_id = ? LIMIT 1`,
      [resultado.insertId, id]
    );

    await conexao.commit();

    const evento = eventos[0];

    return NextResponse.json(
      {
        ok: true,
        sucesso: true,
        status,
        evento: evento
          ? {
              id: evento.id,
              texto: evento.texto,
              data: evento.data instanceof Date ? evento.data.toISOString() : evento.data,
            }
          : null,
      },
      { status: 201 }
    );
  } catch (erro) {
    if (conexao) {
      try {
        await conexao.rollback();
      } catch {}
    }

    console.error("Erro ao salvar resposta do protocolo:", erro);
    return erroJson("Não foi possível salvar a resposta.", 500);
  } finally {
    conexao?.release();
  }
}