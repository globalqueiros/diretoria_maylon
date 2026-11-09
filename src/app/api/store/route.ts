import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function GET() {
  let connection;

  try {
    connection = await db.getConnection();

    const [produtosRows] = await connection.query(`
      SELECT
        id,
        codigo,
        nome,
        descricao,
        categoria,
        estoque,
        estoque_minimo,
        preco,
        imagem_principal
      FROM produtos
      ORDER BY id DESC
    `);

    const [transacoesRows] = await connection.query(`
      SELECT
        t.id,
        t.codigo,
        t.cliente,
        COALESCE(p.nome, 'Produto não encontrado') AS produto,
        t.tipo,
        t.valor,
        t.data,
        t.status
      FROM transacoes t
      LEFT JOIN produtos p
        ON p.id = t.produto_id
      ORDER BY t.id DESC
    `);

    const produtosBanco = produtosRows as any[];
    const transacoesBanco = transacoesRows as any[];

    const produtos = produtosBanco.map((produto) => {
      const estoque = Number(produto.estoque ?? 0);
      const estoqueMinimo = Number(produto.estoque_minimo ?? 0);
      const preco = Number(produto.preco ?? 0);

      let status: "Ativo" | "Baixo estoque" | "Sem estoque";

      if (estoque === 0) {
        status = "Sem estoque";
      } else if (estoque <= estoqueMinimo) {
        status = "Baixo estoque";
      } else {
        status = "Ativo";
      }

      return {
        id: Number(produto.id),
        codigo: String(produto.codigo ?? ""),
        nome: String(produto.nome ?? ""),
        descricao: String(produto.descricao ?? ""),
        categoria: String(produto.categoria ?? "Sem categoria"),
        estoque,
        estoqueMinimo,
        preco,
        imagem_principal: produto.imagem_principal
          ? String(produto.imagem_principal)
          : null,
        vendas: 0,
        status,
      };
    });

    for (const produto of produtos) {
      const vendasProduto = transacoesBanco.filter((transacao) => {
        const produtoEncontrado = produtosBanco.find(
          (p) =>
            String(p.nome) === String(transacao.produto)
        );

        return (
          Number(produtoEncontrado?.id) === produto.id &&
          transacao.tipo === "Venda" &&
          transacao.status === "Concluída"
        );
      }).length;

      produto.vendas = vendasProduto;
    }

    const transacoes = transacoesBanco.map((transacao) => ({
      id: Number(transacao.id),
      codigo: String(transacao.codigo ?? ""),
      cliente: String(
        transacao.cliente ?? "Cliente não informado"
      ),
      produto: String(
        transacao.produto ?? "Produto não informado"
      ),
      tipo: transacao.tipo,
      valor: Number(transacao.valor ?? 0),
      data: transacao.data,
      status: transacao.status,
    }));

    const valorEstoque = produtos.reduce(
      (total, produto) =>
        total + produto.estoque * produto.preco,
      0
    );

    const estoqueBaixo = produtos.filter(
      (produto) =>
        produto.estoque > 0 &&
        produto.estoque <= produto.estoqueMinimo
    ).length;

    const semEstoque = produtos.filter(
      (produto) => produto.estoque === 0
    ).length;

    const totalVendas = transacoes
      .filter(
        (transacao) =>
          transacao.tipo === "Venda" &&
          transacao.status === "Concluída"
      )
      .reduce(
        (total, transacao) =>
          total + transacao.valor,
        0
      );

    return NextResponse.json({
      produtos,
      transacoes,
      indicadores: {
        valorEstoque,
        produtosCadastrados: produtos.length,
        totalVendas,
        estoqueBaixo,
        semEstoque,
      },
    });
  } catch (error) {
    console.error("ERRO API STORE:", error);

    return NextResponse.json(
      {
        message: "Erro ao buscar dados da Maylon Store.",
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