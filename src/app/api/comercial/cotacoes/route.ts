import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { randomBytes } from "crypto";
import { db } from "../../../lib/db";
import { exigirPerfilNaApi } from "../../../lib/roles";

export const dynamic = "force-dynamic";

type Status = "pendente" | "aprovada" | "recusada";

function gerarProtocolo() {
  return `PUB-${new Date().getFullYear()}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

function texto(valor: unknown, max = 0) {
  const s = String(valor ?? "").trim();
  return max > 0 ? s.slice(0, max) : s;
}

function paraArray(valor: unknown): string[] {
  if (Array.isArray(valor)) return valor.map((item) => String(item)).filter(Boolean);
  if (typeof valor === "string") {
    try {
      const parsed = JSON.parse(valor);
      return Array.isArray(parsed) ? parsed.map((item) => String(item)).filter(Boolean) : [];
    } catch {
      return valor ? [valor] : [];
    }
  }
  return [];
}

function numero(valor: unknown) {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}

export async function GET() {
  const auth = await exigirPerfilNaApi(["comercial", "gerente", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, protocolo, nome, empresa, email, whatsapp, mensagem,
              publicos, espacos, semanas, segmentado, criacao, total, status,
              observacao_gerente, criado_por_id, criado_por_nome, decidido_por, decidido_em, criado_em
         FROM cotacoes_publicidade
        ORDER BY id DESC
        LIMIT 500`
    );

    return NextResponse.json(
      rows.map((row) => ({
        id: Number(row.id),
        protocolo: String(row.protocolo ?? `#${row.id}`),
        nome: String(row.nome ?? ""),
        empresa: String(row.empresa ?? ""),
        email: String(row.email ?? ""),
        whatsapp: String(row.whatsapp ?? ""),
        mensagem: row.mensagem ? String(row.mensagem) : null,
        publicos: paraArray(row.publicos),
        espacos: paraArray(row.espacos),
        semanas: Number(row.semanas ?? 0),
        segmentado: Boolean(row.segmentado),
        criacao: Boolean(row.criacao),
        total: numero(row.total),
        status: String(row.status ?? "pendente") as Status,
        observacao_gerente: row.observacao_gerente ? String(row.observacao_gerente) : null,
        criado_por: row.criado_por_nome ? String(row.criado_por_nome) : null,
        decidido_por: row.decidido_por ? String(row.decidido_por) : null,
        decidido_em: row.decidido_em ? new Date(row.decidido_em).toISOString() : null,
        criado_em: row.criado_em
          ? new Date(row.criado_em).toISOString()
          : new Date().toISOString(),
      })),
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro GET /api/comercial/cotacoes:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as cotações." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = await exigirPerfilNaApi(["comercial", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const nome = texto(body?.nome, 150);
    const empresa = texto(body?.empresa, 150);
    const email = texto(body?.email, 150).toLowerCase();
    const whatsapp = texto(body?.whatsapp, 30);
    const mensagem = texto(body?.mensagem);
    const publicos = paraArray(body?.publicos);
    const espacos = paraArray(body?.espacos);
    const semanas = Math.min(52, Math.max(1, Math.round(numero(body?.semanas || 4))));
    const segmentado = body?.segmentadoPorRegiao === true || body?.segmentado === true;
    const criacao = body?.criacaoDoMaterial === true || body?.criacao === true;
    const total = Math.max(0, numero(body?.total));

    if (nome.length < 3) {
      return NextResponse.json({ error: "Informe o nome do responsável." }, { status: 400 });
    }

    if (empresa.length < 2) {
      return NextResponse.json({ error: "Informe a empresa." }, { status: 400 });
    }

    if (publicos.length === 0) {
      return NextResponse.json({ error: "Selecione ao menos um público." }, { status: 400 });
    }

    if (espacos.length === 0) {
      return NextResponse.json({ error: "Selecione ao menos um espaço." }, { status: 400 });
    }

    const protocolo = gerarProtocolo();

    const [result] = await db.execute(
      `INSERT INTO cotacoes_publicidade
         (protocolo, nome, empresa, email, whatsapp, mensagem, publicos, espacos,
          semanas, segmentado, criacao, total, status, criado_por_id, criado_por_nome, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pendente', ?, ?, NOW())`,
      [
        protocolo,
        nome,
        empresa,
        email || null,
        whatsapp || null,
        mensagem || null,
        JSON.stringify(publicos),
        JSON.stringify(espacos),
        semanas,
        segmentado ? 1 : 0,
        criacao ? 1 : 0,
        total,
        auth.usuario!.id,
        auth.usuario!.full_name,
      ]
    );

    return NextResponse.json(
      { success: true, id: (result as { insertId: number }).insertId, protocolo },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erro POST /api/comercial/cotacoes:", error);
    return NextResponse.json(
      { error: "Não foi possível registrar a cotação." },
      { status: 500 }
    );
  }
}
