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
      numero_rifa: String(rifa.numero_rifa ?? ""),
      titulo: rifa.titulo ?? "",
      descricao: rifa.descricao ?? "",
      imagem: rifa.imagem ?? null,
      valor_numero: Number(rifa.valor_numero ?? 0),
      total_numeros: Number(rifa.total_numeros ?? 0),
      data_sorteio: rifa.data_sorteio ?? null,
      status: rifa.status ?? "aberta",
      created_at: rifa.created_at ?? null,
      numeros_criados: Number(rifa.numeros_criados ?? 0),
      numeros_pagos: Number(rifa.numeros_pagos ?? 0),
      numeros_reservados: Number(rifa.numeros_reservados ?? 0),
      numeros_disponiveis: Number(rifa.numeros_disponiveis ?? 0),
    }));

    return NextResponse.json({
      sucesso: true,
      rifas,
      total: rifas.length,
    });
  } catch (error) {
    console.error("Erro ao buscar rifas:", error);

    return NextResponse.json(
      {
        sucesso: false,
        mensagem: "Erro interno ao buscar as rifas.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const numeroRifa = String(body.numero_rifa ?? "").trim();
    const titulo = String(body.titulo ?? "").trim();
    const descricao = String(body.descricao ?? "").trim();
    const imagem = body.imagem ? String(body.imagem) : null;

    const imagens = Array.isArray(body.imagens)
      ? body.imagens.filter(
          (url: unknown) =>
            typeof url === "string" && url.trim() !== ""
        )
      : [];

    const valorNumero = Number(body.valor_numero);
    const totalNumeros = Number(body.total_numeros);
    const dataSorteio = String(body.data_sorteio ?? "").trim();
    const status = String(body.status ?? "aberta").trim();

    if (!numeroRifa) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "O número da rifa é obrigatório.",
        },
        { status: 400 }
      );
    }

    if (!titulo) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "O título da rifa é obrigatório.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(valorNumero) || valorNumero <= 0) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "O valor por número é inválido.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(totalNumeros) || totalNumeros <= 0) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "A quantidade de números é inválida.",
        },
        { status: 400 }
      );
    }

    if (!dataSorteio) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "A data e hora do sorteio são obrigatórias.",
        },
        { status: 400 }
      );
    }

    const dataSorteioDate = new Date(dataSorteio);

    if (Number.isNaN(dataSorteioDate.getTime())) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "A data do sorteio é inválida.",
        },
        { status: 400 }
      );
    }

    if (dataSorteioDate.getTime() <= Date.now()) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "A data do sorteio deve ser futura.",
        },
        { status: 400 }
      );
    }

    const statusPermitidos = [
      "aberta",
      "fechada",
      "encerrada",
      "cancelada",
    ];

    if (!statusPermitidos.includes(status)) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem: "O status informado é inválido.",
        },
        { status: 400 }
      );
    }

    if (imagens.length === 0 && !imagem) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "A rifa precisa ter pelo menos uma imagem.",
        },
        { status: 400 }
      );
    }

    const [rifaExistente] = await db.execute(
      `
        SELECT id
        FROM rifas
        WHERE numero_rifa = ?
        LIMIT 1
      `,
      [numeroRifa]
    );

    if ((rifaExistente as any[]).length > 0) {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "Este número de rifa já está cadastrado.",
        },
        { status: 409 }
      );
    }

    const imagemPrincipal = imagem || imagens[0] || null;

    const dataMysql =
      dataSorteio.replace("T", " ") +
      (dataSorteio.length === 16 ? ":00" : "");

    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [resultadoRifa] = await connection.execute(
        `
          INSERT INTO rifas (
            numero_rifa,
            titulo,
            descricao,
            imagem,
            valor_numero,
            total_numeros,
            data_sorteio,
            status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          numeroRifa,
          titulo,
          descricao || null,
          imagemPrincipal,
          valorNumero,
          totalNumeros,
          dataMysql,
          status,
        ]
      );

      const rifaId = Number(
        (resultadoRifa as any).insertId
      );

      if (!rifaId) {
        throw new Error(
          "Não foi possível obter o ID da rifa criada."
        );
      }

      const valores: string[] = [];
      const parametros: (number | string)[] = [];

      for (
        let numero = 1;
        numero <= totalNumeros;
        numero++
      ) {
        valores.push("(?, ?, ?)");
        parametros.push(
          rifaId,
          numero,
          "disponivel"
        );
      }

      if (valores.length > 0) {
        await connection.execute(
          `
            INSERT INTO rifa_numeros (
              rifa_id,
              numero,
              status
            )
            VALUES ${valores.join(",")}
          `,
          parametros
        );
      }

      await connection.commit();

      return NextResponse.json(
        {
          sucesso: true,
          mensagem: "Rifa cadastrada com sucesso!",
          rifa: {
            id: rifaId,
            numero_rifa: numeroRifa,
            titulo,
            descricao,
            imagem: imagemPrincipal,
            imagens,
            valor_numero: valorNumero,
            total_numeros: totalNumeros,
            data_sorteio: dataSorteio,
            status,
          },
        },
        { status: 201 }
      );
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error: any) {
    console.error("Erro ao cadastrar rifa:", error);

    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        {
          sucesso: false,
          mensagem:
            "Esta rifa ou número já está cadastrado.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        sucesso: false,
        mensagem:
          error?.message ||
          "Não foi possível cadastrar a rifa.",
      },
      { status: 500 }
    );
  }
}
