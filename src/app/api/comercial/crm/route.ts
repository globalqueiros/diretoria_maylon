import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../../lib/db";
import { exigirPerfilNaApi } from "../../../lib/roles";
import { sincronizarComissaoDaVenda } from "../../../lib/comissoes";

export const dynamic = "force-dynamic";

type Stage = "Novo" | "Contato" | "Qualificação" | "Proposta" | "Negociação" | "Ganho" | "Perdido";

const STAGES: Stage[] = ["Novo", "Contato", "Qualificação", "Proposta", "Negociação", "Ganho", "Perdido"];

const STATUS_POR_STAGE: Record<Stage, string> = {
  Novo: "pendente",
  Contato: "pendente",
  Qualificação: "pendente",
  Proposta: "registrada",
  Negociação: "pendente",
  Ganho: "paga",
  Perdido: "cancelada",
};

const STAGE_POR_STATUS: Record<string, Stage> = {
  pendente: "Contato",
  registrada: "Proposta",
  paga: "Ganho",
  cancelada: "Perdido",
};

const PROBABILIDADE: Record<Stage, number> = {
  Novo: 10,
  Contato: 20,
  Qualificação: 40,
  Proposta: 60,
  Negociação: 75,
  Ganho: 100,
  Perdido: 0,
};

function numero(valor: unknown) {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function GET(request: NextRequest) {
  const auth = await exigirPerfilNaApi(["comercial", "gerente", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const busca = searchParams.get("busca")?.trim() ?? "";
    const responsavel = searchParams.get("responsavel")?.trim();
    const periodo = searchParams.get("periodo")?.trim() ?? "30";

    const condicoes: string[] = [];
    const parametros: unknown[] = [];

    if (busca) {
      condicoes.push("(c.nome LIKE ? OR c.email LIKE ? OR c.telefone LIKE ? OR CAST(v.id AS CHAR) LIKE ?)");
      const termo = `%${busca}%`;
      parametros.push(termo, termo, termo, termo);
    }

    if (responsavel && responsavel !== "Todos") {
      condicoes.push("u.full_name = ?");
      parametros.push(responsavel);
    }

    const dias = Number(periodo);
    if (Number.isFinite(dias) && dias > 0) {
      condicoes.push("v.criado_em >= DATE_SUB(CURDATE(), INTERVAL ? DAY)");
      parametros.push(dias);
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT v.id, v.cliente_id, v.promotor_id, v.total, v.forma_pagamento,
              v.produto_chave, v.status, v.crm_stage, v.criado_em, c.nome, c.email, c.telefone, c.cidade,
              u.full_name AS responsavel
         FROM vendas v
         LEFT JOIN clientes c ON c.id = v.cliente_id
         LEFT JOIN users u ON u.id = v.promotor_id
         ${where}
        ORDER BY v.id DESC
        LIMIT 500`,
      parametros
    );

    const deals = rows.map((row) => {
      const crmStage = String(row.crm_stage ?? "");
      const stage: Stage = STAGES.includes(crmStage as Stage)
        ? (crmStage as Stage)
        : STAGE_POR_STATUS[String(row.status)] ?? "Contato";
      return {
        id: String(row.id),
        title: `Venda #${row.id}`,
        contact_name: String(row.nome ?? "Cliente não informado"),
        company: null,
        email: row.email ? String(row.email) : null,
        phone: row.telefone ? String(row.telefone) : null,
        city: row.cidade ? String(row.cidade) : null,
        stage,
        value: numero(row.total),
        probability: PROBABILIDADE[stage],
        owner: row.responsavel ? String(row.responsavel) : null,
        source: row.forma_pagamento ? String(row.forma_pagamento) : null,
        produtoChave: row.produto_chave ? String(row.produto_chave) : null,
        product: row.produto_chave ? String(row.produto_chave) : null,
        next_action: null,
        next_action_at: null,
        updated_at: row.criado_em ? new Date(row.criado_em).toISOString() : undefined,
        created_at: row.criado_em ? new Date(row.criado_em).toISOString() : undefined,
      };
    });

    const stages = STAGES.reduce<Record<string, number>>((acc, stage) => {
      acc[stage] = deals.filter((deal) => deal.stage === stage).length;
      return acc;
    }, {});

    const ativos = deals.filter((deal) => !["Ganho", "Perdido"].includes(deal.stage));
    const ganhos = deals.filter((deal) => deal.stage === "Ganho");
    const perdidos = deals.filter((deal) => deal.stage === "Perdido");

    return NextResponse.json(
      {
        deals,
        stages,
        totals: {
          total: deals.length,
          pipeline: ativos.reduce((soma, deal) => soma + deal.value, 0),
          ganhos: ganhos.reduce((soma, deal) => soma + deal.value, 0),
          perdidos: perdidos.reduce((soma, deal) => soma + deal.value, 0),
          previsao: ativos.reduce(
            (soma, deal) => soma + (deal.value * numero(deal.probability)) / 100,
            0
          ),
          conversao:
            deals.length > 0 ? Math.round((ganhos.length / deals.length) * 100) : 0,
        },
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro GET /api/comercial/crm:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o CRM." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await exigirPerfilNaApi(["comercial", "gerente", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const nome = String(body?.contact_name ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const telefone = String(body?.phone ?? "").replace(/\D/g, "");
    const cidade = String(body?.city ?? "").trim();
    const valor = Number(body?.value ?? 0);
    const etapa = String(body?.stage ?? "Contato") as Stage;
    const produtoChave = String(body?.product ?? body?.produtoChave ?? body?.produto_chave ?? "").trim();

    const PRODUTOS_VENDA = ["planos_assinaturas", "parcerias", "seguros_beneficios"];

    if (nome.length < 3) {
      return NextResponse.json({ error: "Informe o nome do contato." }, { status: 400 });
    }

    if (!PRODUTOS_VENDA.includes(produtoChave)) {
      return NextResponse.json({ error: "Selecione um produto válido." }, { status: 400 });
    }

    let clienteId: number | null = null;

    if (email || telefone) {
      const [encontrados] = await db.query<RowDataPacket[]>(
        `SELECT id FROM clientes
          WHERE (? <> '' AND LOWER(email) = ?)
             OR (? <> '' AND REPLACE(REPLACE(REPLACE(telefone,'(',''),')',''),'-','') = ?)
          LIMIT 1`,
        [email, email, telefone, telefone]
      );

      if (encontrados.length) {
        clienteId = Number(encontrados[0].id);
      }
    }

    if (!clienteId) {
      const [maxRows] = await db.query<RowDataPacket[]>(
        `SELECT COALESCE(MAX(id), 0) + 1 AS proximo FROM clientes`
      );
      const proximo = String(maxRows[0]?.proximo ?? Date.now());

      const [result] = await db.execute(
        `INSERT INTO clientes (numero, nome, telefone, email, cidade, status, criado_em)
         VALUES (?, ?, ?, ?, ?, 0, NOW())`,
        [`CLI-${proximo}`, nome, telefone || null, email || null, cidade || null]
      );

      clienteId = Number((result as { insertId: number }).insertId);
    }

    const status = STATUS_POR_STAGE[etapa] ?? "pendente";

    const [maxRows] = await db.query<RowDataPacket[]>(
      `SELECT COALESCE(MAX(id), 0) + 1 AS proximo FROM vendas`
    );
    const proximo = Number(maxRows[0]?.proximo ?? Date.now());

    await db.execute(
      `INSERT INTO vendas (id, promotor_id, cliente_id, total, forma_pagamento, produto_chave, status, crm_stage, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        proximo,
        auth.usuario.id,
        clienteId,
        Number.isFinite(valor) ? valor : 0,
        "pix",
        produtoChave,
        status,
        etapa,
      ]
    );

    await sincronizarComissaoDaVenda(proximo, status);

    return NextResponse.json({ success: true, id: proximo }, { status: 201 });
  } catch (error) {
    console.error("Erro POST /api/comercial/crm:", error);
    return NextResponse.json(
      { error: "Não foi possível cadastrar a oportunidade." },
      { status: 500 }
    );
  }
}
