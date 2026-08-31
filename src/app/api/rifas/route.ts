import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function GET() {
  try {
    const [rows] = await db.execute(`
      SELECT
        r.id,
        r.numero_rifa,
        r.titulo,
        r.descricao,
        r.imagem,
        r.valor_numero,
        r.total_numeros,
        r.data_sorteio,
        r.status,
        r.created_at,

        COUNT(rn.id) AS numeros_criados,

        COALESCE(
          SUM(
            CASE
              WHEN rn.status = 'pago' THEN 1
              ELSE 0
            END
          ),
          0
        ) AS numeros_pagos,

        COALESCE(
          SUM(
            CASE
              WHEN rn.status = 'reservado' THEN 1
              ELSE 0
            END
          ),
          0
        ) AS numeros_reservados,

        COALESCE(
          SUM(
            CASE
              WHEN rn.status = 'disponivel' THEN 1
              ELSE 0
            END
          ),
          0
        ) AS numeros_disponiveis

      FROM rifas r

      LEFT JOIN rifa_numeros rn
        ON rn.rifa_id = r.id

      GROUP BY
        r.id,
        r.numero_rifa,
        r.titulo,
        r.descricao,
        r.imagem,
        r.valor_numero,
        r.total_numeros,
        r.data_sorteio,
        r.status,
        r.created_at

      ORDER BY r.id DESC
    `);

    const rifas = (rows as any[]).map((rifa) => ({
      id: Number(rifa.id),

      numero_rifa: String(
        rifa.numero_rifa ?? ""
      ),

      titulo: rifa.titulo,

      descricao: rifa.descricao,

      imagem: rifa.imagem,

      valor_numero: Number(
        rifa.valor_numero ?? 0
      ),

      total_numeros: Number(
        rifa.total_numeros ?? 0
      ),

      data_sorteio:
        rifa.data_sorteio,

      status: rifa.status,

      created_at:
        rifa.created_at,

      numeros_criados: Number(
        rifa.numeros_criados ?? 0
      ),

      numeros_pagos: Number(
        rifa.numeros_pagos ?? 0
      ),

      numeros_reservados: Number(
        rifa.numeros_reservados ?? 0
      ),

      numeros_disponiveis: Number(
        rifa.numeros_disponiveis ?? 0
      ),
    }));

    return NextResponse.json({
      sucesso: true,
      rifas,
      total: rifas.length,
    });
  } catch (error) {
    console.error(
      "Erro ao buscar rifas:",
      error
    );

    return NextResponse.json(
      {
        sucesso: false,
        mensagem:
          "Erro interno ao buscar as rifas.",
      },
      {
        status: 500,
      }
    );
  }
}