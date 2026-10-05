import { NextRequest, NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let connection;

  try {
    const { id } = await params;

    const rifaId = Number(id);

    if (!rifaId || rifaId <= 0) {
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

    /*
     * Verifica a rifa
     */
    const [rifas] = await connection.query(
      `
      SELECT
        id,
        titulo,
        status
      FROM rifas
      WHERE id = ?
      LIMIT 1
      `,
      [rifaId]
    );

    const rifa = (rifas as any[])[0];

    if (!rifa) {
      await connection.rollback();

      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Rifa não encontrada.",
        },
        { status: 404 }
      );
    }

    /*
     * Não permite sortear novamente
     */
    if (rifa.status === "sorteada") {
      await connection.rollback();

      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Esta rifa já foi sorteada.",
        },
        { status: 400 }
      );
    }

    /*
     * Busca somente números PAGOS
     */
    const [numeros] = await connection.query(
      `
      SELECT
        id,
        numero,
        nome_cliente,
        telefone,
        status
      FROM rifa_numeros
      WHERE rifa_id = ?
        AND status = 'pago'
        AND nome_cliente IS NOT NULL
        AND telefone IS NOT NULL
      ORDER BY RAND()
      LIMIT 1
      `,
      [rifaId]
    );

    const ganhador = (numeros as any[])[0];

    if (!ganhador) {
      await connection.rollback();

      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "Não existem números pagos com cliente cadastrado para realizar o sorteio.",
        },
        { status: 400 }
      );
    }

    /*
     * Marca a rifa como sorteada
     */
    await connection.query(
      `
      UPDATE rifas
      SET status = 'sorteada'
      WHERE id = ?
      `,
      [rifaId]
    );

    await connection.commit();

    return NextResponse.json({
      sucesso: true,
      mensagem: "Sorteio realizado com sucesso!",
      ganhador: {
        id: ganhador.id,
        numero: ganhador.numero,
        nome_cliente: ganhador.nome_cliente,
        telefone: ganhador.telefone,
      },
    });

  } catch (error) {

    if (connection) {
      await connection.rollback();
    }

    console.error(
      "Erro ao realizar sorteio:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        mensagem:
          "Erro interno ao realizar o sorteio.",
      },
      { status: 500 }
    );

  } finally {

    if (connection) {
      connection.release();
    }

  }
}