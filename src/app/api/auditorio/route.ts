import { NextResponse } from "next/server";
import { db } from "../../lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const busca = searchParams.get("busca")?.trim() || "";
    const status = searchParams.get("status") || "";
    const categoria = searchParams.get("categoria") || "";

    const conditions: string[] = [];
    const params: string[] = [];

    if (busca) {
      conditions.push(`
        (
          codigo LIKE ?
          OR n_patrimonio LIKE ?
          OR nomeitem LIKE ?
          OR descricao LIKE ?
          OR responsavel LIKE ?
          OR localizacao LIKE ?
        )
      `);

      const termo = `%${busca}%`;
      params.push(termo, termo, termo, termo, termo, termo);
    }

    if (
      status === "Auditado" ||
      status === "Pendente" ||
      status === "Divergência"
    ) {
      conditions.push("status = ?");
      params.push(status);
    }

    if (categoria && categoria !== "Todas") {
      conditions.push("categoria = ?");
      params.push(categoria);
    }

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const [patrimonios] = await db.query(
      `
        SELECT
          id,
          codigo,
          n_patrimonio,
          nomeitem,
          categoria,
          valor_aquisicao,
          comprovantepagamento,
          nfe,
          localizacao,
          responsavel,
          datacompra,
          status,
          descricao,
          observacao,
          created_at,
          updated_at
        FROM patrimonio
        ${where}
        ORDER BY id DESC
      `,
      params
    );

    return NextResponse.json({
      success: true,
      data: patrimonios,
    });
  } catch (error) {
    console.error("GET /api/auditorio:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar patrimônios.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get("content-type") || "";

    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json(
        {
          success: false,
          error: "A requisição deve ser enviada como JSON.",
          contentType,
        },
        { status: 415 }
      );
    }

    let body: any;

    try {
      body = await request.json();
    } catch (error) {
      console.error("JSON inválido recebido em /api/auditorio:", error);

      return NextResponse.json(
        {
          success: false,
          error: "O corpo da requisição contém JSON inválido.",
        },
        { status: 400 }
      );
    }

    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json(
        {
          success: false,
          error: "Os dados enviados são inválidos.",
        },
        { status: 400 }
      );
    }

    const codigo =
      typeof body.codigo === "string"
        ? body.codigo.trim()
        : "";

    const n_patrimonio =
      typeof body.n_patrimonio === "string"
        ? body.n_patrimonio.trim()
        : "";

    const nomeitem =
      typeof body.nomeitem === "string"
        ? body.nomeitem.trim()
        : "";

    const categoria =
      typeof body.categoria === "string"
        ? body.categoria.trim()
        : "";

    const localizacao =
      typeof body.localizacao === "string"
        ? body.localizacao.trim()
        : "";

    const responsavel =
      typeof body.responsavel === "string"
        ? body.responsavel.trim()
        : "";

    const descricao =
      typeof body.descricao === "string"
        ? body.descricao.trim()
        : "";

    const observacao =
      typeof body.observacao === "string"
        ? body.observacao.trim()
        : "";

    const comprovantepagamento =
      typeof body.comprovantepagamento === "string"
        ? body.comprovantepagamento.trim()
        : null;

    const nfe =
      typeof body.nfe === "string"
        ? body.nfe.trim()
        : null;

    const datacompra =
      typeof body.datacompra === "string"
        ? body.datacompra.trim()
        : null;

    const status =
      typeof body.status === "string" &&
      body.status.trim()
        ? body.status.trim()
        : "Pendente";

    if (!codigo) {
      return NextResponse.json(
        {
          success: false,
          error: "O código é obrigatório.",
        },
        { status: 400 }
      );
    }

    if (!n_patrimonio) {
      return NextResponse.json(
        {
          success: false,
          error:
            "O número do patrimônio é obrigatório. Faça a leitura do código de barras.",
        },
        { status: 400 }
      );
    }

    if (!nomeitem) {
      return NextResponse.json(
        {
          success: false,
          error: "O nome do item é obrigatório.",
        },
        { status: 400 }
      );
    }

    if (!descricao) {
      return NextResponse.json(
        {
          success: false,
          error: "A descrição é obrigatória.",
        },
        { status: 400 }
      );
    }

    if (!categoria) {
      return NextResponse.json(
        {
          success: false,
          error: "A categoria é obrigatória.",
        },
        { status: 400 }
      );
    }

    if (!localizacao) {
      return NextResponse.json(
        {
          success: false,
          error: "A localização é obrigatória.",
        },
        { status: 400 }
      );
    }

    let valor = 0;

    const valorRecebido = body.valor_aquisicao;

    if (
      valorRecebido !== null &&
      valorRecebido !== undefined &&
      valorRecebido !== ""
    ) {
      if (typeof valorRecebido === "number") {
        valor = valorRecebido;
      } else if (typeof valorRecebido === "string") {
        const valorLimpo = valorRecebido
          .replace(/R\$/gi, "")
          .replace(/\s/g, "")
          .replace(/\./g, "")
          .replace(",", ".");

        valor = Number(valorLimpo);
      }
    }

    if (!Number.isFinite(valor) || valor < 0) {
      valor = 0;
    }

    const [result] = await db.execute(
      `
        INSERT INTO patrimonio (
          codigo,
          n_patrimonio,
          nomeitem,
          categoria,
          valor_aquisicao,
          comprovantepagamento,
          nfe,
          localizacao,
          responsavel,
          datacompra,
          status,
          descricao,
          observacao
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        codigo,
        n_patrimonio,
        nomeitem,
        categoria,
        valor,
        comprovantepagamento,
        nfe,
        localizacao,
        responsavel || null,
        datacompra || null,
        status,
        descricao,
        observacao || null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message: "Patrimônio cadastrado com sucesso.",
        id: (result as any).insertId,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("POST /api/auditorio:", error);

    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        {
          success: false,
          error:
            "O código ou número do patrimônio já está cadastrado.",
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error?.sqlMessage ||
          error?.message ||
          "Erro ao cadastrar patrimônio.",
        code: error?.code || null,
      },
      { status: 500 }
    );
  }
}