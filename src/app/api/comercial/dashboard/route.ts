import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../../lib/db";
import { exigirPerfilNaApi } from "../../../lib/roles";

export const dynamic = "force-dynamic";

type Periodo = "hoje" | "semana" | "mes" | "ano";

function filtroPeriodo(periodo: Periodo, coluna: string) {
  if (periodo === "hoje") return `DATE(${coluna}) = CURDATE()`;
  if (periodo === "semana") return `${coluna} >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)`;
  if (periodo === "ano") return `YEAR(${coluna}) = YEAR(CURDATE())`;
  return `YEAR(${coluna}) = YEAR(CURDATE()) AND MONTH(${coluna}) = MONTH(CURDATE())`;
}

function numero(valor: unknown) {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function indicador(valor: number) {
  return { valor, variacao: 0, tendencia: "estavel" as const };
}

export async function GET(request: NextRequest) {
  const auth = await exigirPerfilNaApi(["comercial", "gerente", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const param = new URL(request.url).searchParams.get("periodo");
  const periodo: Periodo =
    param === "hoje" || param === "semana" || param === "ano" ? param : "mes";

  try {
    const filtroClientes = filtroPeriodo(periodo, "criado_em");
    const filtroVendas = filtroPeriodo(periodo, "criado_em");

    const [clientesRows] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) total,
              SUM(${filtroClientes}) novos,
              SUM(status = 1) ativos
         FROM clientes`
    );

    const [vendasRows] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) total,
              SUM(status = 'paga') pagas,
              SUM(status IN ('pendente', 'registrada')) propostas,
              COALESCE(SUM(CASE WHEN status = 'paga' THEN total ELSE 0 END), 0) faturamento
         FROM vendas
        WHERE ${filtroVendas}`
    );

    const [leadsRows] = await db.query<RowDataPacket[]>(
      `SELECT COUNT(*) total
         FROM clientes c
        WHERE ${filtroClientes}
          AND NOT EXISTS (SELECT 1 FROM vendas v WHERE v.cliente_id = c.id AND v.status = 'paga')`
    );

    const [passRows] = await db.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(valor), 0) total
         FROM maylon_pass_solicitacoes
        WHERE status = 'aprovado'`
    );

    const [finRows] = await db.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(valor), 0) total
         FROM fin_transacoes
        WHERE tipo = 'receita' AND ${filtroPeriodo(periodo, "data")}`
    );

    const [metaRows] = await db.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(meta), 0) meta, COALESCE(SUM(realizado), 0) realizado
         FROM metas_cidade
        WHERE ano = YEAR(CURDATE()) AND mes = MONTH(CURDATE())`
    );

    const [metasRows] = await db.query<RowDataPacket[]>(
      `SELECT id, titulo, valor_meta, valor_atual, inicio, fim, status
         FROM metas
        WHERE ${filtroPeriodo(periodo, "inicio")}
        ORDER BY id DESC
        LIMIT 20`
    );

    const [mesRows] = await db.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(criado_em, '%Y-%m') mes,
              COUNT(*) vendas,
              COALESCE(SUM(total), 0) faturamento
         FROM vendas
        WHERE status = 'paga' AND criado_em >= DATE_SUB(CURDATE(), INTERVAL 5 MONTH)
        GROUP BY DATE_FORMAT(criado_em, '%Y-%m')
        ORDER BY mes ASC`
    );

    const [cidadesRows] = await db.query<RowDataPacket[]>(
      `SELECT mc.cidade, mc.meta, mc.realizado,
              COALESCE(SUM(CASE WHEN v.status = 'paga' THEN v.total ELSE 0 END), 0) faturamento
         FROM metas_cidade mc
         LEFT JOIN clientes c ON SUBSTRING_INDEX(c.cidade, ' - ', 1) = mc.cidade
         LEFT JOIN vendas v ON v.cliente_id = c.id
        WHERE mc.ano = YEAR(CURDATE()) AND mc.mes = MONTH(CURDATE())
        GROUP BY mc.cidade, mc.meta, mc.realizado
        ORDER BY mc.cidade ASC`
    );

    const clientes = (clientesRows[0] ?? {}) as Record<string, unknown>;
    const vendas = (vendasRows[0] ?? {}) as Record<string, unknown>;
    const totalClientes = numero(clientes.total);
    const totalVendas = numero(vendas.pagas);
    const faturamento =
      numero(vendas.faturamento) + numero(passRows[0]?.total) + numero(finRows[0]?.total);
    const meta = numero(metaRows[0]?.meta);
    const realizado = numero(metaRows[0]?.realizado) || faturamento;

    return NextResponse.json(
      {
        leads: indicador(numero(leadsRows[0]?.total)),
        clientes: indicador(totalClientes),
        propostas: indicador(numero(vendas.propostas)),
        vendas: indicador(totalVendas),
        faturamento: indicador(faturamento),
        conversao: indicador(
          totalClientes > 0 ? Math.round((totalVendas / totalClientes) * 100) : 0
        ),
        meta: { meta, realizado },
        vendas_por_mes: mesRows.map((r) => ({
          mes: String(r.mes),
          vendas: numero(r.vendas),
          faturamento: numero(r.faturamento),
        })),
        desempenho_cidades: cidadesRows.map((r) => ({
          cidade: String(r.cidade),
          vendas: numero(r.realizado),
          meta: numero(r.meta),
          faturamento: numero(r.faturamento),
        })),
        metas: metasRows.map((r) => ({
          id: r.id,
          titulo: r.titulo,
          escopo: "Geral",
          prazo: r.fim,
          meta: numero(r.valor_meta),
          realizado: numero(r.valor_atual),
          unidade: "moeda" as const,
        })),
        atualizado_em: new Date().toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro GET /api/comercial/dashboard:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o dashboard comercial." },
      { status: 500 }
    );
  }
}
