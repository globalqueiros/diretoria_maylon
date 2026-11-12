import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

async function getUserId(): Promise<string | null> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id?: string | number;
      sub?: string;
      userId?: string | number;
    };
    const id = payload.id ?? payload.userId ?? payload.sub;
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

const moeda = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    v || 0
  );

const esc = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ] as string
  );

function nomeCompetencia(c: string) {
  const [ano, mes] = c.split("-").map(Number);
  const t = new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { id } = await params;

  try {
    // O filtro por user_id garante que o colaborador só acessa o próprio holerite
    const [rows] = await db.query(
      `SELECT f.*, u.full_name
         FROM folhas_pagamento f
         JOIN users u ON u.id = f.user_id
        WHERE f.id = ? AND f.user_id = ?
        LIMIT 1`,
      [id, userId]
    );

    const f = (rows as any[])[0];
    if (!f) {
      return NextResponse.json(
        { error: "Holerite não encontrado." },
        { status: 404 }
      );
    }

    const linhas = [
      ["Salário base", Number(f.salario_base), false],
      ["Comissões", Number(f.comissoes), false],
      ["Bonificações", Number(f.bonificacoes), false],
      ["Descontos", Number(f.descontos), true],
    ] as const;

    const pagamento = f.data_pagamento
      ? new Date(f.data_pagamento).toLocaleDateString("pt-BR", {
          timeZone: "America/Sao_Paulo",
        })
      : "A definir";

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>Holerite ${esc(nomeCompetencia(f.competencia))}</title>
<style>
  *{box-sizing:border-box}
  body{font-family:Arial,Helvetica,sans-serif;color:#1f2937;margin:0;padding:32px;background:#f3f4f6}
  .folha{max-width:760px;margin:0 auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px}
  header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #159B78;padding-bottom:16px;margin-bottom:24px}
  h1{margin:0;font-size:22px;color:#159B78}
  .muted{color:#6b7280;font-size:13px}
  .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:24px}
  .grid b{display:block;font-size:15px;margin-top:2px}
  table{width:100%;border-collapse:collapse;font-size:14px}
  th,td{padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:left}
  th{background:#f9fafb;font-size:12px;color:#6b7280}
  td.v,th.v{text-align:right}
  .desc{color:#dc2626}
  .total td{border-bottom:0;border-top:2px solid #159B78;font-weight:bold;font-size:16px;padding-top:14px}
  .total td.v{color:#159B78}
  .acoes{max-width:760px;margin:16px auto 0;text-align:right}
  button{background:#159B78;color:#fff;border:0;border-radius:8px;padding:10px 18px;font-weight:bold;cursor:pointer}
  footer{margin-top:28px;font-size:12px;color:#9ca3af}
  @media print{body{background:#fff;padding:0}.folha{border:0}.acoes{display:none}}
</style>
</head>
<body>
  <div class="folha">
    <header>
      <div>
        <h1>Holerite</h1>
        <div class="muted">Competência: ${esc(nomeCompetencia(f.competencia))}</div>
      </div>
      <div class="muted" style="text-align:right">Maylon</div>
    </header>

    <div class="grid">
      <div class="muted">Colaborador<b>${esc(f.full_name)}</b></div>
      <div class="muted">Pagamento<b>${esc(pagamento)}</b></div>
      <div class="muted">Atendimentos<b>${esc(f.total_atendimentos)}</b></div>
    </div>

    <table>
      <thead><tr><th>Descrição</th><th class="v">Valor</th></tr></thead>
      <tbody>
        ${linhas
          .map(
            ([titulo, valor, desconto]) =>
              `<tr><td>${esc(titulo)}</td><td class="v ${desconto ? "desc" : ""}">${
                desconto && valor > 0 ? "− " : ""
              }${esc(moeda(valor))}</td></tr>`
          )
          .join("")}
        <tr class="total"><td>Total líquido</td><td class="v">${esc(
          moeda(Number(f.total_liquido))
        )}</td></tr>
      </tbody>
    </table>

    <footer>Documento gerado em ${new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
    })}. Sujeito a conferência com o setor financeiro.</footer>
  </div>
  <div class="acoes"><button onclick="window.print()">Imprimir / salvar PDF</button></div>
</body>
</html>`;

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Erro ao gerar holerite:", error);
    return NextResponse.json(
      { error: "Erro ao gerar holerite." },
      { status: 500 }
    );
  }
}