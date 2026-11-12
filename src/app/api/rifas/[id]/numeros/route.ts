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

    const body = await request.json();

    const quantidadeAdicionar = Number(body.quantidade);

    if (!quantidadeAdicionar || quantidadeAdicionar <= 0) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "Informe quantos números deseja adicionar.",
        },
        { status: 400 }
      );
    }

    if (quantidadeAdicionar > 100000) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "A quantidade máxima é 100.000 números por vez.",
        },
        { status: 400 }
      );
    }

    connection = await db.getConnection();

    await connection.beginTransaction();

    const [rifas] = await connection.query(
      `
      SELECT id, total_numeros
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

    const [resultado] = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM rifa_numeros
      WHERE rifa_id = ?
      `,
      [rifaId]
    );

    const totalExistente = Number(
      (resultado as any[])[0].total
    );

    const [ultimoResultado] = await connection.query(
      `
      SELECT MAX(numero) AS ultimo
      FROM rifa_numeros
      WHERE rifa_id = ?
      `,
      [rifaId]
    );

    const ultimoNumero = Number(
      (ultimoResultado as any[])[0].ultimo || 0
    );
    
    const novoTotal =
      totalExistente + quantidadeAdicionar;

      
    const valores: number[] = [];

    for (
      let numero = ultimoNumero + 1;
      numero <= ultimoNumero + quantidadeAdicionar;
      numero++
    ) {
      valores.push(numero);
    }
    
    if (valores.length > 0) {
      const placeholders = valores
        .map(() => "(?, ?, 'disponivel')")
        .join(", ");

      const paramsInsert: any[] = [];

      for (const numero of valores) {
        paramsInsert.push(rifaId, numero);
      }

      await connection.query(
        `
        INSERT INTO rifa_numeros
        (
          rifa_id,
          numero,
          status
        )
        VALUES ${placeholders}
        `,
        paramsInsert
      );
    }

    await connection.query(
      `
      UPDATE rifas
      SET total_numeros = ?
      WHERE id = ?
      `,
      [novoTotal, rifaId]
    );

    await connection.commit();

    return NextResponse.json({
      sucesso: true,

      mensagem: `${quantidadeAdicionar} números adicionados com sucesso.`,

      totalAnterior: totalExistente,

      adicionados: quantidadeAdicionar,

      total: novoTotal,

      primeiroNumero:
        valores.length > 0
          ? valores[0]
          : null,

      ultimoNumero:
        valores.length > 0
          ? valores[valores.length - 1]
          : null,
    });

  } catch (error) {

    if (connection) {
      await connection.rollback();
    }

    console.error(
      "Erro ao adicionar números da rifa:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        mensagem:
          "Erro ao salvar os números no banco de dados.",
      },
      { status: 500 }
    );

  } finally {

    if (connection) {
      connection.release();
    }

  }
}