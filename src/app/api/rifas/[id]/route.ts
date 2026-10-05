import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

type Params = {
  params: Promise<{ id: string }>;
};

type RifaRow = RowDataPacket & {
  id: number;
};

export async function DELETE(
  _request: Request,
  { params }: Params
) {
  let connection;

  try {
    const { id } = await params;
    const rifaId = Number(id);

    if (!Number.isInteger(rifaId) || rifaId <= 0) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "ID da rifa inválido.",
        },
        { status: 400 }
      );
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rifas] = await connection.query<RifaRow[]>(
      `
      SELECT id
      FROM rifas
      WHERE id = ?
      LIMIT 1
      `,
      [rifaId]
    );

    if (!Array.isArray(rifas) || rifas.length === 0) {
      await connection.rollback();

      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Rifa não encontrada.",
        },
        { status: 404 }
      );
    }

    const [resultado] =
      await connection.query<ResultSetHeader>(
        `
        DELETE FROM rifas
        WHERE id = ?
        LIMIT 1
        `,
        [rifaId]
      );

    if (!resultado || resultado.affectedRows !== 1) {
      await connection.rollback();

      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "A rifa não foi excluída.",
        },
        { status: 409 }
      );
    }

    await connection.commit();

    return NextResponse.json(
      {
        sucesso: true,
        mensagem: "Rifa excluída com sucesso.",
        id: rifaId,
      },
      { status: 200 }
    );
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error("Erro ao fazer rollback:", rollbackError);
      }
    }

    console.error("ERRO DELETE /api/rifas/[id]:", error);

    const erroMysql = error as {
      code?: string;
      errno?: number;
      sqlMessage?: string;
      message?: string;
    };

    if (
      erroMysql.code === "ER_ROW_IS_REFERENCED_2" ||
      erroMysql.code === "ER_ROW_IS_REFERENCED"
    ) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "Não é possível excluir esta rifa porque existem registros relacionados a ela.",
          codigo: erroMysql.code,
        },
        { status: 409 }
      );
    }

    if (erroMysql.code === "ER_LOCK_DEADLOCK") {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "O banco de dados está ocupado. Tente excluir a rifa novamente.",
          codigo: erroMysql.code,
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        sucesso: false,
        mensagem: "Não foi possível excluir a rifa.",
        error:
          erroMysql.sqlMessage ||
          erroMysql.message ||
          "Erro desconhecido.",
        codigo: erroMysql.code || null,
      },
      { status: 500 }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}
