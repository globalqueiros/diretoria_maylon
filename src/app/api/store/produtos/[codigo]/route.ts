import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";
import type {
  RowDataPacket,
  ResultSetHeader,
} from "mysql2";

type Params = {
  params: Promise<{
    codigo: string;
  }>;
};

type ProdutoRow = RowDataPacket & {
  id: number;
  codigo: string;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  estoque: number;
  estoque_minimo: number;
  preco: number;
  promocao: number;
  imagem_principal: string | null;
  imagem_2: string | null;
  imagem_3: string | null;
  imagem_4: string | null;
};

const SELECT_PRODUTO = `
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
`;

function formatarProduto(produto: ProdutoRow) {
  return {
    id: Number(produto.id),
    codigo: String(produto.codigo ?? ""),
    nome: String(produto.nome ?? ""),
    descricao: String(produto.descricao ?? ""),
    categoria: String(produto.categoria ?? ""),
    estoque: Number(produto.estoque ?? 0),
    estoque_minimo: Number(produto.estoque_minimo ?? 0),
    preco: Number(produto.preco ?? 0),
    promocao: Number(produto.promocao ?? 0),

    imagem_principal: produto.imagem_principal ?? null,
    imagem_2: produto.imagem_2 ?? null,
    imagem_3: produto.imagem_3 ?? null,
    imagem_4: produto.imagem_4 ?? null,
  };
}

function numeroOuAtual(valor: unknown, atual: number) {
  if (valor === undefined || valor === null || valor === "") {
    return atual;
  }
  return Number(valor);
}

function textoOuAtual(valor: unknown, atual: string | null) {
  if (valor === undefined) return atual;
  if (valor === null) return null;
  const texto = String(valor).trim();
  return texto === "" ? null : texto;
}

async function lerBody(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") || "";

  if (
    contentType.includes("multipart/form-data") ||
    contentType.includes("application/x-www-form-urlencoded")
  ) {
    const form = await request.formData();
    const dados: Record<string, unknown> = {};

    form.forEach((valor, chave) => {
      if (typeof valor === "string") {
        dados[chave] = valor;
      }
    });

    return dados;
  }

  return (await request.json()) as Record<string, unknown>;
}

export async function GET(
  request: Request,
  { params }: Params
) {
  let connection;

  try {
    const { codigo } = await params;

    if (!codigo) {
      return NextResponse.json(
        { message: "Código do produto não informado." },
        { status: 400 }
      );
    }

    connection = await db.getConnection();

    const [rows] = await connection.query(SELECT_PRODUTO, [codigo]);
    const produtos = rows as ProdutoRow[];

    if (produtos.length === 0) {
      return NextResponse.json(
        { message: "Produto não encontrado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      produto: formatarProduto(produtos[0]),
    });

  } catch (error) {
    const e = error as { code?: string; sqlMessage?: string; message?: string };

    console.error("ERRO AO BUSCAR PRODUTO:", {
      code: e.code,
      sqlMessage: e.sqlMessage,
      message: e.message,
    });

    return NextResponse.json(
      {
        message: "Erro ao buscar produto.",
        error: e.sqlMessage || e.message || "Erro desconhecido",
        code: e.code ?? null,
      },
      { status: 500 }
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
        { message: "Código do produto não informado." },
        { status: 400 }
      );
    }

    let body: Record<string, unknown>;

    try {
      body = await lerBody(request);
    } catch {
      return NextResponse.json(
        {
          message:
            "Body inválido. Envie JSON (Content-Type: application/json) ou FormData.",
        },
        { status: 400 }
      );
    }

    connection = await db.getConnection();

    const [existenteRows] = await connection.query(SELECT_PRODUTO, [codigo]);
    const existentes = existenteRows as ProdutoRow[];

    if (existentes.length === 0) {
      return NextResponse.json(
        { message: "Produto não encontrado." },
        { status: 404 }
      );
    }

    const atual = existentes[0];

    const nome =
      body.nome === undefined
        ? atual.nome
        : typeof body.nome === "string"
        ? body.nome.trim()
        : "";

    if (!nome) {
      return NextResponse.json(
        { message: "O nome do produto é obrigatório." },
        { status: 400 }
      );
    }

    const estoque = numeroOuAtual(body.estoque, Number(atual.estoque ?? 0));
    const estoqueMinimo = numeroOuAtual(
      body.estoque_minimo,
      Number(atual.estoque_minimo ?? 0)
    );
    const preco = numeroOuAtual(body.preco, Number(atual.preco ?? 0));

    const promocao =
      body.promocao === "" || body.promocao === null
        ? 0
        : numeroOuAtual(body.promocao, Number(atual.promocao ?? 0));

    const invalidos = [estoque, estoqueMinimo, preco, promocao].some(
      (v) => !Number.isFinite(v) || v < 0
    );

    if (invalidos) {
      return NextResponse.json(
        { message: "Existem valores numéricos inválidos." },
        { status: 400 }
      );
    }


    const descricao = textoOuAtual(body.descricao, atual.descricao);
    const categoria = textoOuAtual(body.categoria, atual.categoria);

    const imagemPrincipal = textoOuAtual(body.imagem_principal, atual.imagem_principal);
    const imagem2 = textoOuAtual(body.imagem_2, atual.imagem_2);
    const imagem3 = textoOuAtual(body.imagem_3, atual.imagem_3);
    const imagem4 = textoOuAtual(body.imagem_4, atual.imagem_4);


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
            promocao = ?,
            imagem_principal = ?,
            imagem_2 = ?,
            imagem_3 = ?,
            imagem_4 = ?
        WHERE codigo = ?
        LIMIT 1
      `,
      [
        nome,
        descricao,
        categoria,
        estoque,
        estoqueMinimo,
        preco,
        promocao,
        imagemPrincipal,
        imagem2,
        imagem3,
        imagem4,
        codigo,
      ]
    );

    const resultado = result as ResultSetHeader;

    const [rows] = await connection.query(SELECT_PRODUTO, [codigo]);
    const atualizados = rows as ProdutoRow[];

    if (atualizados.length === 0) {
      return NextResponse.json(
        { message: "Não foi possível recuperar o produto atualizado." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message:
        resultado.affectedRows > 0
          ? "Produto atualizado com sucesso!"
          : "Nenhuma alteração necessária.",
      produto: formatarProduto(atualizados[0]),
    });

  } catch (error) {
    const e = error as { code?: string; sqlMessage?: string; message?: string };

    console.error("ERRO AO ATUALIZAR PRODUTO:", {
      code: e.code,
      sqlMessage: e.sqlMessage,
      message: e.message,
    });

    return NextResponse.json(
      {
        message: "Erro ao atualizar produto.",
        error: e.sqlMessage || e.message || "Erro desconhecido",
        code: e.code ?? null,
      },
      { status: 500 }
    );

  } finally {
    if (connection) {
      connection.release();
    }
  }
}