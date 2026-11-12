import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../../lib/db";
import { exigirPerfilNaApi } from "../../../lib/roles";

export const dynamic = "force-dynamic";

type LeadStatus = "Novo" | "Em contato" | "Qualificado" | "Proposta" | "Convertido" | "Perdido";

function numero(valor: unknown) {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function statusDerivado(row: RowDataPacket): LeadStatus {
  if (numero(row.status_cliente) !== 0) return "Perdido";
  if (numero(row.vendas_pagas) > 0) return "Convertido";
  if (numero(row.vendas_abertas) > 0) return "Proposta";
  return "Novo";
}

function escopoCliente(status: string) {
  if (status === "Perdido") return 1;
  return 0;
}

export async function GET(request: NextRequest) {
  const auth = await exigirPerfilNaApi(["comercial", "gerente", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 12));
    const busca = searchParams.get("busca")?.trim() ?? "";
    const statusFiltro = searchParams.get("status")?.trim();
    const periodo = searchParams.get("periodo")?.trim() ?? "30";

    const condicoes: string[] = [];
    const parametros: unknown[] = [];

    if (busca) {
      condicoes.push("(c.nome LIKE ? OR c.email LIKE ? OR c.telefone LIKE ?)");
      const termo = `%${busca}%`;
      parametros.push(termo, termo, termo);
    }

    if (periodo && periodo !== "todos") {
      const dias = Number(periodo);
      if (Number.isFinite(dias) && dias > 0) {
        condicoes.push("c.criado_em >= DATE_SUB(CURDATE(), INTERVAL ? DAY)");
        parametros.push(dias);
      }
    }

    const where = condicoes.length ? `WHERE ${condicoes.join(" AND ")}` : "";

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT c.id, c.numero, c.nome, c.email, c.telefone, c.cidade,
              c.status AS status_cliente, c.criado_em,
              (SELECT COUNT(*) FROM vendas v WHERE v.cliente_id = c.id AND v.status = 'paga') AS vendas_pagas,
              (SELECT COUNT(*) FROM vendas v WHERE v.cliente_id = c.id AND v.status IN ('pendente','registrada')) AS vendas_abertas,
              (SELECT COALESCE(SUM(v.total), 0) FROM vendas v WHERE v.cliente_id = c.id AND v.status = 'paga') AS valor_total,
              (SELECT u.full_name FROM vendas v JOIN users u ON u.id = v.promotor_id
                WHERE v.cliente_id = c.id ORDER BY v.id DESC LIMIT 1) AS responsavel
         FROM clientes c
         ${where}
        ORDER BY c.id DESC`,
      parametros
    );

    const todos = rows.map((row) => ({
      id: String(row.id),
      name: String(row.nome ?? "—"),
      company: null,
      email: row.email ? String(row.email) : null,
      phone: row.telefone ? String(row.telefone) : null,
      city: row.cidade ? String(row.cidade) : null,
      source: "Cliente",
      status: statusDerivado(row),
      value: numero(row.valor_total),
      owner: row.responsavel ? String(row.responsavel) : null,
      created_at: row.criado_em ? new Date(row.criado_em).toISOString() : new Date().toISOString(),
      next_contact_at: null,
    }));

    const filtrados = statusFiltro && statusFiltro !== "Todos"
      ? todos.filter((item) => item.status === statusFiltro)
      : todos;

    const total = filtrados.length;
    const pages = Math.max(1, Math.ceil(total / limit));
    const inicio = (page - 1) * limit;
    const leads = filtrados.slice(inicio, inicio + limit);

    return NextResponse.json(
      {
        leads,
        totals: {
          total,
          novos: todos.filter((l) => l.status === "Novo").length,
          em_contato: todos.filter((l) => l.status === "Proposta").length,
          qualificados: todos.filter((l) => l.status === "Convertido").length,
          convertidos: todos.filter((l) => l.status === "Convertido").length,
          conversao: total > 0 ? Math.round((todos.filter((l) => l.status === "Convertido").length / total) * 100) : 0,
        },
        page,
        pages,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro GET /api/comercial/leads:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os leads." },
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
    const nome = String(body?.name ?? body?.nome ?? "").trim();
    const email = String(body?.email ?? "").trim().toLowerCase();
    const telefone = String(body?.phone ?? body?.telefone ?? "").replace(/\D/g, "");
    const cidade = String(body?.city ?? body?.cidade ?? "").trim();

    if (nome.length < 3) {
      return NextResponse.json({ error: "Nome inválido." }, { status: 400 });
    }

    const [maxRows] = await db.query<RowDataPacket[]>(
      `SELECT COALESCE(MAX(id), 0) + 1 AS proximo FROM clientes`
    );
    const proximo = String(maxRows[0]?.proximo ?? Date.now());

    const [result] = await db.execute(
      `INSERT INTO clientes (numero, nome, telefone, email, cidade, status, criado_em)
       VALUES (?, ?, ?, ?, ?, 0, NOW())`,
      [`CLI-${proximo}`, nome, telefone || null, email || null, cidade || null]
    );

    return NextResponse.json({ success: true, id: (result as { insertId: number }).insertId }, { status: 201 });
  } catch (error) {
    console.error("Erro POST /api/comercial/leads:", error);
    return NextResponse.json({ error: "Não foi possível cadastrar o lead." }, { status: 500 });
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
    const status = String(body?.status ?? "");

    if (!Number.isSafeInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Lead inválido." }, { status: 400 });
    }

    const permitidos: LeadStatus[] = ["Novo", "Em contato", "Qualificado", "Proposta", "Convertido", "Perdido"];
    if (!permitidos.includes(status as LeadStatus)) {
      return NextResponse.json({ error: "Status inválido." }, { status: 400 });
    }

    await db.execute(`UPDATE clientes SET status = ? WHERE id = ?`, [
      escopoCliente(status),
      id,
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro PATCH /api/comercial/leads:", error);
    return NextResponse.json({ error: "Não foi possível atualizar o lead." }, { status: 500 });
  }
}
