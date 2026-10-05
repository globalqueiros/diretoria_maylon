import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

type Params = {
  params: Promise<{
    codigo: string;
  }>;
};

export async function GET(
  request: Request,
  { params }: Params
) {
  let connection;

  try {
    const { codigo } = await params;

    if (!codigo) {
      return NextResponse.json(
        {
          message: "Código do produto não informado.",
        },
        {
          status: 400,
        }
      );
    }

    connection = await db.getConnection();

    const [rows] = await connection.query(
      `
        SELECT
          id,
          codigo,
          nome,
          descricao,
          categoria,
          estoque,
          estoque_minimo,
          preco,
          promocao,
          imagem_principal,
          imagem_2,
          imagem_3,
          imagem_4
        FROM produtos
        WHERE codigo = ?
        LIMIT 1
      `,
      [codigo]
    );

    const produtos = rows as any[];

    if (produtos.length === 0) {
      return NextResponse.json(
        {
          message: "Produto não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const produto = produtos[0];

    return NextResponse.json({
      produto: {
        id: Number(produto.id),
        codigo: String(produto.codigo ?? ""),
        nome: String(produto.nome ?? ""),
        descricao: String(produto.descricao ?? ""),
        categoria: String(
          produto.categoria ?? ""
        ),
        estoque: Number(
          produto.estoque ?? 0
        ),
        estoque_minimo: Number(
          produto.estoque_minimo ?? 0
        ),
        preco: Number(
          produto.preco ?? 0
        ),
        promocao: Number(
          produto.promocao ?? 0
        ),
        imagem_principal:
          produto.imagem_principal
            ? String(produto.imagem_principal)
            : null,
        imagem_2:
          produto.imagem_2
            ? String(produto.imagem_2)
            : null,
        imagem_3:
          produto.imagem_3
            ? String(produto.imagem_3)
            : null,
        imagem_4:
          produto.imagem_4
            ? String(produto.imagem_4)
            : null,
      },
    });
  } catch (error) {
    console.error(
      "ERRO AO BUSCAR PRODUTO:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro ao buscar produto.",
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
      },
      {
        status: 500,
      }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

export async function PUT(
  request: Request,
  { params }: Params
) {
  let connection;

  try {
    const { codigo } = await params;

    if (!codigo) {
      return NextResponse.json(
        {
          message: "Código do produto não informado.",
        },
        {
          status: 400,
        }
      );
    }

    const body = await request.json();

    const {
      nome,
      descricao,
      categoria,
      estoque,
      estoque_minimo,
      preco,
      promocao,
    } = body;

    if (!nome) {
      return NextResponse.json(
        {
          message:
            "O nome do produto é obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    connection = await db.getConnection();

    const [result] = await connection.query(
      `
        UPDATE produtos
        SET
          nome = ?,
          descricao = ?,
          categoria = ?,
          estoque = ?,
          estoque_minimo = ?,
          preco = ?,
          promocao = ?
        WHERE codigo = ?
        LIMIT 1
      `,
      [
        nome,
        descricao ?? "",
        categoria ?? "",
        Number(estoque ?? 0),
        Number(estoque_minimo ?? 0),
        Number(preco ?? 0),
        Number(promocao ?? 0),
        codigo,
      ]
    );

    const resultado = result as any;

    if (!resultado.affectedRows) {
      return NextResponse.json(
        {
          message:
            "Produto não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const [rows] = await connection.query(
      `
        SELECT
          id,
          codigo,
          nome,
          descricao,
          categoria,
          estoque,
          estoque_minimo,
          preco,
          promocao,
          imagem_principal,
          imagem_2,
          imagem_3,
          imagem_4
        FROM produtos
        WHERE codigo = ?
        LIMIT 1
      `,
      [codigo]
    );

    const produtos = rows as any[];

    return NextResponse.json({
      message:
        "Produto atualizado com sucesso!",
      produto: produtos[0] ?? null,
    });
  } catch (error) {
    console.error(
      "ERRO AO ATUALIZAR PRODUTO:",
      error
    );

    return NextResponse.json(
      {
        message:
          "Erro ao atualizar produto.",
        error:
          error instanceof Error
            ? error.message
            : "Erro desconhecido",
      },
      {
        status: 500,
      }
    );
  } finally {
    if (connection) {
      connection.release();
    }
  }
}