
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type { RowDataPacket } from "mysql2";
import { db2 } from "../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ComunicadoStatus = "Rascunho" | "Publicado" | "Agendado";

type ComunicadoRow = RowDataPacket & {
  id: string;
  titulo: string;
  categoria: string;
  publico: string;
  mensagem: string;
  status: ComunicadoStatus;
  data: string | Date;
};

const STATUS_VALIDOS: ComunicadoStatus[] = [
  "Rascunho",
  "Publicado",
  "Agendado",
];

const CATEGORIAS = [
  "Geral",
  "Manutenção",
  "Atualização",
  "Segurança",
  "Financeiro",
  "Motoristas",
  "Passageiros",
];

const PUBLICOS = [
  "Todos",
  "Motoristas",
  "Passageiros",
  "Equipe interna",
];

export async function GET() {
  try {
    const [rows] = await db2.execute<ComunicadoRow[]>(
      `SELECT
        id,
        titulo,
        categoria,
        publico,
        mensagem,
        status,
        DATE_FORMAT(criado_em, '%Y-%m-%dT%H:%i:%s') AS data
      FROM comunicados
      ORDER BY criado_em DESC`
    );

    return NextResponse.json({ comunicados: rows });
  } catch (error) {
    console.error("Erro ao listar comunicados:", error);

    return NextResponse.json(
      { erro: "Não foi possível carregar os comunicados." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const titulo =
      typeof body.titulo === "string" ? body.titulo.trim() : "";
    const categoria = body.categoria;
    const publico = body.publico;
    const mensagem =
      typeof body.mensagem === "string" ? body.mensagem.trim() : "";
    const status = body.status;

    if (!titulo || !mensagem) {
      return NextResponse.json(
        { erro: "Preencha o título e a mensagem." },
        { status: 400 }
      );
    }

    if (titulo.length > 200 || mensagem.length > 65535) {
      return NextResponse.json(
        { erro: "O título ou a mensagem excede o tamanho permitido." },
        { status: 400 }
      );
    }

    if (
      !CATEGORIAS.includes(categoria) ||
      !PUBLICOS.includes(publico) ||
      !STATUS_VALIDOS.includes(status)
    ) {
      return NextResponse.json(
        { erro: "Categoria, público ou status inválido." },
        { status: 400 }
      );
    }

    const id = `COM-${randomUUID()}`;

    await db2.execute(
      `INSERT INTO comunicados
        (id, titulo, categoria, publico, mensagem, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, titulo, categoria, publico, mensagem, status]
    );

    const [rows] = await db2.execute<ComunicadoRow[]>(
      `SELECT
        id,
        titulo,
        categoria,
        publico,
        mensagem,
        status,
        DATE_FORMAT(criado_em, '%Y-%m-%dT%H:%i:%s') AS data
       FROM comunicados
       WHERE id = ?
       LIMIT 1`,
      [id]
    );

    return NextResponse.json(
      { comunicado: rows[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro ao criar comunicado:", error);

    return NextResponse.json(
      { erro: "Não foi possível salvar o comunicado." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id")?.trim();

    if (!id) {
      return NextResponse.json(
        { erro: "Informe o ID do comunicado." },
        { status: 400 }
      );
    }

    const [result] = await db2.execute(
      "DELETE FROM comunicados WHERE id = ?",
      [id]
    );

    const resultado = result as { affectedRows: number };

    if (resultado.affectedRows === 0) {
      return NextResponse.json(
        { erro: "Comunicado não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({ mensagem: "Comunicado excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir comunicado:", error);

    return NextResponse.json(
      { erro: "Não foi possível excluir o comunicado." },
      { status: 500 }
    );
  }
}
