import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../lib/db";
import { exigirPerfilNaApi } from "../../lib/roles";
import { sincronizarComissaoDaCampanha } from "../../lib/comissoes";

export const dynamic = "force-dynamic";

const STATUS_UI_POR_DB: Record<string, string> = {
  pendente: "nova",
  em_contato: "em_contato",
  convertido: "fechada",
  cancelado: "perdida",
};

const STATUS_DB_POR_UI: Record<string, string> = {
  nova: "pendente",
  em_contato: "em_contato",
  proposta_enviada: "em_contato",
  fechada: "convertido",
  perdida: "cancelado",
};

function numero(valor: unknown) {
  if (typeof valor === "number") return valor;
  const texto = String(valor ?? "").replace(/[^\d,.-]/g, "").replace(",", ".");
  const n = Number(texto);
  return Number.isFinite(n) ? n : 0;
}

function statusValido(valor: unknown) {
  const status = String(valor ?? "").trim().toLowerCase();
  return STATUS_UI_POR_DB[status] ?? "nova";
}

export async function GET() {
  const auth = await exigirPerfilNaApi(["comercial", "gerente", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, nome_empresa, nome_responsavel, email, telefone, cidade, estado,
              tipo_anuncio, quantidade_veiculos, orcamento, mensagem, status, created_at
         FROM solicitacoes_especialista
        ORDER BY id DESC
        LIMIT 500`
    );

    return NextResponse.json(
      rows.map((row) => ({
        id: Number(row.id),
        criadoEm: row.created_at
          ? new Date(row.created_at).toISOString()
          : new Date().toISOString(),
        nome: String(row.nome_responsavel ?? row.nome_empresa ?? "Não informado"),
        empresa: String(row.nome_empresa ?? "Não informado"),
        email: String(row.email ?? ""),
        whatsapp: String(row.telefone ?? ""),
        objetivo: String(row.tipo_anuncio ?? row.mensagem ?? "Campanha"),
        canais: row.tipo_anuncio ? [String(row.tipo_anuncio)] : [],
        meses: 1,
        orcamento: numero(row.orcamento),
        total: numero(row.orcamento),
        status: statusValido(row.status),
      })),
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro GET /api/cotacao:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as cotações." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await exigirPerfilNaApi(["comercial", "gerente", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const id = Number(body?.id);
    const status = String(body?.status ?? "").trim().toLowerCase();

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Cotação inválida." }, { status: 400 });
    }

    const statusDb = STATUS_DB_POR_UI[status];

    if (!statusDb) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }

    const [result] = await db.execute(
      `UPDATE solicitacoes_especialista SET status = ?, updated_at = NOW() WHERE id = ? LIMIT 1`,
      [statusDb, id]
    );

    if ((result as { affectedRows: number }).affectedRows === 0) {
      return NextResponse.json({ error: "Cotação não encontrada." }, { status: 404 });
    }

    try {
      await sincronizarComissaoDaCampanha(id, status, {
        id: auth.usuario!.id,
        nome: auth.usuario!.full_name,
      });
    } catch (erroComissao) {
      console.error("[comissoes] erro na comissão da campanha:", erroComissao);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro PATCH /api/cotacao:", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar a cotação." },
      { status: 500 }
    );
  }
}
