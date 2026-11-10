import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../../lib/db";
import { exigirPerfilNaApi } from "../../../lib/roles";

export const dynamic = "force-dynamic";

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
    const referencia = searchParams.get("referencia")?.trim();
    const status = searchParams.get("status")?.trim();

    const condicoes: string[] = [];
    const parametros: unknown[] = [];

    if (referencia) {
      condicoes.push("cl.referencia = ?");
      parametros.push(referencia);
    }

    if (status && status !== "todos") {
      condicoes.push("cl.status = ?");
      parametros.push(status);
    }

    if (auth.usuario.user_type === "comercial") {
      condicoes.push("cl.beneficiario_id = ?");
      parametros.push(auth.usuario.id);
    } else if (auth.usuario.user_type === "gerente") {
      condicoes.push("(cl.gerente_id = ? OR cl.beneficiario_id = ?)");
      parametros.push(auth.usuario.id, auth.usuario.id);
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT cl.id, cl.regra_id, cl.produto_chave, cl.produto_nome,
              cl.beneficiario_id, cl.beneficiario_nome, cl.gerente_id,
              cl.valor_base, cl.percentual, cl.valor_comissao, cl.status,
              cl.origem_tabela, cl.origem_id, cl.referencia, cl.observacao,
              cl.criado_em, cl.aprovado_em, cl.pago_em, cl.cancelado_em
         FROM comissoes_comerciais_lancamentos cl
         ${where}
        ORDER BY cl.referencia DESC, cl.id DESC
        LIMIT 500`,
      parametros
    );

    return NextResponse.json(
      {
        comissoes: rows.map((row) => ({
          id: Number(row.id),
          regraId: Number(row.regra_id),
          produtoChave: String(row.produto_chave),
          produtoNome: String(row.produto_nome),
          beneficiarioId: Number(row.beneficiario_id),
          beneficiario: String(row.beneficiario_nome ?? ""),
          gerenteId: row.gerente_id ? Number(row.gerente_id) : null,
          valorBase: numero(row.valor_base),
          percentual: numero(row.percentual),
          valorComissao: numero(row.valor_comissao),
          valor: numero(row.valor_comissao),
          valor_base: numero(row.valor_base),
          status: String(row.status),
          origemTabela: String(row.origem_tabela),
          origemId: String(row.origem_id),
          referencia: String(row.referencia ?? ""),
          observacao: row.observacao ?? null,
          criadoEm: row.criado_em ? new Date(row.criado_em).toISOString() : null,
          aprovadoEm: row.aprovado_em ? new Date(row.aprovado_em).toISOString() : null,
          pagoEm: row.pago_em ? new Date(row.pago_em).toISOString() : null,
          canceladoEm: row.cancelado_em ? new Date(row.cancelado_em).toISOString() : null,
          descricao: String(row.produto_nome ?? "Comissão"),
          cidade: "—",
          data: row.criado_em ? new Date(row.criado_em).toISOString() : "",
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro GET /api/comercial/comissoes:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as comissões." },
      { status: 500 }
    );
  }
}
