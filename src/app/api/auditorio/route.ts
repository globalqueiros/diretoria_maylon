import { NextResponse } from "next/server";
import { db } from "../../lib/db";

// =============================================================
// GET - LISTAR PATRIMÔNIOS
// =============================================================

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const busca = searchParams.get("busca")?.trim() || "";
    const status = searchParams.get("status") || "";
    const categoria = searchParams.get("categoria") || "";

    const conditions: string[] = [];
    const params: string[] = [];

    // =========================================================
    // BUSCA
    // =========================================================

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

      params.push(
        termo,
        termo,
        termo,
        termo,
        termo,
        termo
      );
    }

    // =========================================================
    // STATUS
    // =========================================================

    if (
      status === "Auditado" ||
      status === "Pendente" ||
      status === "Divergência"
    ) {
      conditions.push("status = ?");
      params.push(status);
    }

    // =========================================================
    // CATEGORIA
    // =========================================================

    if (categoria && categoria !== "Todas") {
      conditions.push("categoria = ?");
      params.push(categoria);
    }

    // =========================================================
    // WHERE
    // =========================================================

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    // =========================================================
    // CONSULTA
    // =========================================================

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
    console.error(
      "GET /api/auditorio:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar patrimônios.",
      },
      {
        status: 500,
      }
    );
  }
}

// =============================================================
// POST - CADASTRAR PATRIMÔNIO
// =============================================================

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
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
    } = body;

    // =========================================================
    // VALIDAÇÕES
    // =========================================================

    if (!codigo?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "O código é obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    if (!n_patrimonio?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "O número do patrimônio é obrigatório. Faça a leitura do código de barras.",
        },
        {
          status: 400,
        }
      );
    }

    if (!nomeitem?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "O nome do item é obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    if (!descricao?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "A descrição é obrigatória.",
        },
        {
          status: 400,
        }
      );
    }

    if (!categoria?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "A categoria é obrigatória.",
        },
        {
          status: 400,
        }
      );
    }

    if (!localizacao?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "A localização é obrigatória.",
        },
        {
          status: 400,
        }
      );
    }

    // =========================================================
    // CONVERTER VALOR
    // =========================================================

    let valor = 0;

    if (
      valor_aquisicao !== null &&
      valor_aquisicao !== undefined &&
      valor_aquisicao !== ""
    ) {
      if (typeof valor_aquisicao === "string") {
        valor = Number(
          valor_aquisicao
            .replace("R$", "")
            .replace(/\s/g, "")
            .replace(/\./g, "")
            .replace(",", ".")
        );
      } else {
        valor = Number(valor_aquisicao);
      }
    }

    if (Number.isNaN(valor)) {
      valor = 0;
    }

    // =========================================================
    // INSERT
    // =========================================================

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
        codigo.trim(),
        n_patrimonio.trim(),
        nomeitem.trim(),
        categoria.trim(),
        valor,
        comprovantepagamento || null,
        nfe || null,
        localizacao.trim(),
        responsavel?.trim() || null,
        datacompra || null,
        status || "Pendente",
        descricao.trim(),
        observacao?.trim() || null,
      ]
    );

    return NextResponse.json(
      {
        success: true,
        message:
          "Patrimônio cadastrado com sucesso.",
        id: (result as any).insertId,
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error(
      "POST /api/auditorio:",
      error
    );

    // =========================================================
    // DUPLICIDADE
    // =========================================================

    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        {
          success: false,
          error:
            "O código ou número do patrimônio já está cadastrado.",
        },
        {
          status: 409,
        }
      );
    }

    // =========================================================
    // ERRO DO MYSQL
    // =========================================================

    return NextResponse.json(
      {
        success: false,
        error:
          error?.sqlMessage ||
          error?.message ||
          "Erro ao cadastrar patrimônio.",
        code: error?.code || null,
      },
      {
        status: 500,
      }
    );
  }
}