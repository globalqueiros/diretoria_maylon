import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { db } from "../../../../../lib/db";

export const dynamic = "force-dynamic";

/* ───────────── autenticação ───────────── */

async function obterUsuarioLogadoId(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  if (!token) return null;

  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET não configurado");
    return null;
  }

  try {
    const decoded = jwt.verify(token, secret) as { id?: number | string };
    return decoded.id !== undefined && decoded.id !== null
      ? String(decoded.id)
      : null;
  } catch {
    return null;
  }
}

/* ───────────── formatação ───────────── */

function escapar(valor: unknown): string {
  return String(valor ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function moeda(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function dataBR(valor: unknown): string {
  if (!valor) return "—";
  const data = new Date(String(valor));
  if (Number.isNaN(data.getTime())) return "—";
  return data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function competenciaAtual(): string {
  const texto = new Date().toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "America/Sao_Paulo",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function respostaHtml(corpo: string, status = 200) {
  return new NextResponse(corpo, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

function paginaErro(titulo: string, mensagem: string, status: number) {
  return respostaHtml(
    `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<title>${escapar(titulo)}</title>
<style>body{font-family:Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center;background:#f1f5f9;color:#0f172a}
.c{background:#fff;padding:32px 40px;border-radius:16px;box-shadow:0 10px 30px rgba(0,0,0,.08);text-align:center;max-width:420px}
h1{font-size:20px;margin:0 0 8px}p{margin:0;color:#475569;font-size:14px}</style></head>
<body><div class="c"><h1>${escapar(titulo)}</h1><p>${escapar(mensagem)}</p></div></body></html>`,
    status
  );
}

/* ───────────── rota ───────────── */

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const usuarioId = await obterUsuarioLogadoId();

    if (!usuarioId) {
      return paginaErro(
        "Sessão expirada",
        "Entre novamente para ver o holerite.",
        401
      );
    }

    // Cada pessoa só abre o próprio holerite.
    if (String(id) !== usuarioId) {
      return paginaErro(
        "Acesso negado",
        "Você só pode visualizar o seu próprio holerite.",
        403
      );
    }

    const [rows]: any = await db.query({
      sql: `
        SELECT
          f.id,
          f.matricula,
          f.full_name       AS nome,
          f.user_type       AS cargo,
          f.agencia,
          f.conta,
          f.admission_date  AS admissao
        FROM maylon_db.users f
        WHERE f.id = ?
          AND f.deleted_at IS NULL
        LIMIT 1
      `,
      values: [usuarioId],
      timeout: 15000,
    });

    const f = Array.isArray(rows) ? rows[0] : null;

    if (!f) {
      return paginaErro(
        "Funcionário não encontrado",
        "Não foi possível localizar os dados deste funcionário.",
        404
      );
    }

    // Ligue estes valores à tabela de folha quando ela existir.
    const valores = {
      salario_base: 0,
      comissao: 0,
      beneficios: 0,
      descontos: 0,
      adiantamentos: 0,
    };

    const proventos = [
      { rotulo: "Comissão", valor: valores.comissao },
      { rotulo: "Benefícios", valor: valores.beneficios },
    ];

    const descontos = [
      { rotulo: "Descontos", valor: valores.descontos },
      { rotulo: "Adiantamentos", valor: valores.adiantamentos },
    ];

    const totalProventos = proventos.reduce((t, i) => t + i.valor, 0);
    const totalDescontos = descontos.reduce((t, i) => t + i.valor, 0);
    const liquido = totalProventos - totalDescontos;

    const linhas = (itens: { rotulo: string; valor: number }[]) =>
      itens
        .map(
          (i) =>
            `<tr><td>${escapar(i.rotulo)}</td><td class="v">${escapar(
              moeda(i.valor)
            )}</td></tr>`
        )
        .join("");

    const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Holerite - ${escapar(f.nome)}</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;font-size:14px}
  .barra{max-width:820px;margin:20px auto 0;display:flex;justify-content:flex-end}
  .barra button{background:#0f766e;color:#fff;border:0;border-radius:10px;padding:10px 18px;font-weight:700;cursor:pointer;font-size:14px}
  .folha{max-width:820px;margin:16px auto 32px;background:#fff;border-radius:16px;padding:32px;box-shadow:0 10px 30px rgba(0,0,0,.08)}
  .topo{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #0f766e;padding-bottom:16px;margin-bottom:20px}
  .topo h1{margin:0;font-size:22px;color:#0f766e}
  .topo p{margin:4px 0 0;color:#475569;font-size:13px}
  .comp{text-align:right}
  .comp b{display:block;font-size:16px}
  .grade{display:grid;grid-template-columns:repeat(2,1fr);gap:12px;margin-bottom:20px}
  .campo{background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px}
  .campo span{display:block;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;font-weight:700}
  .campo b{display:block;margin-top:4px;font-size:15px;word-break:break-word}
  .cols{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:20px}
  table{width:100%;border-collapse:collapse}
  th{background:#0f766e;color:#fff;text-align:left;padding:10px 12px;font-size:12px;text-transform:uppercase;letter-spacing:.05em}
  th.v{text-align:right}
  td{padding:10px 12px;border-bottom:1px solid #e2e8f0}
  td.v{text-align:right;white-space:nowrap}
  tfoot td{font-weight:700;background:#f8fafc;border-bottom:0}
  .liq{display:flex;justify-content:space-between;align-items:center;background:#0f766e;color:#fff;border-radius:12px;padding:16px 20px;font-size:18px;font-weight:700}
  .rodape{margin-top:20px;color:#64748b;font-size:12px;text-align:center}
  @media (max-width:640px){.grade,.cols{grid-template-columns:1fr}.topo{flex-direction:column;gap:12px}.comp{text-align:left}}
  @media print{
    body{background:#fff}
    .barra{display:none}
    .folha{box-shadow:none;margin:0;max-width:none;border-radius:0}
  }
</style>
</head>
<body>
  <div class="barra"><button type="button" onclick="window.print()">Imprimir / Salvar em PDF</button></div>
  <main class="folha">
    <header class="topo">
      <div>
        <h1>Holerite</h1>
        <p>Demonstrativo de pagamento</p>
      </div>
      <div class="comp">
        <p>Competência</p>
        <b>${escapar(competenciaAtual())}</b>
      </div>
    </header>

    <section class="grade">
      <div class="campo"><span>Funcionário</span><b>${escapar(f.nome)}</b></div>
      <div class="campo"><span>Matrícula</span><b>${escapar(f.matricula || "—")}</b></div>
      <div class="campo"><span>Cargo</span><b>${escapar(f.cargo || "—")}</b></div>
      <div class="campo"><span>Admissão</span><b>${escapar(dataBR(f.admissao))}</b></div>
      <div class="campo"><span>Agência</span><b>${escapar(f.agencia || "—")}</b></div>
      <div class="campo"><span>Conta</span><b>${escapar(f.conta || "—")}</b></div>
    </section>

    <section class="cols">
      <table>
        <thead><tr><th>Proventos</th><th class="v">Valor</th></tr></thead>
        <tbody>${linhas(proventos)}</tbody>
        <tfoot><tr><td>Total de proventos</td><td class="v">${escapar(
          moeda(totalProventos)
        )}</td></tr></tfoot>
      </table>
      <table>
        <thead><tr><th>Descontos</th><th class="v">Valor</th></tr></thead>
        <tbody>${linhas(descontos)}</tbody>
        <tfoot><tr><td>Total de descontos</td><td class="v">${escapar(
          moeda(totalDescontos)
        )}</td></tr></tfoot>
      </table>
    </section>

    <div class="liq"><span>Líquido a receber</span><span>${escapar(
      moeda(liquido)
    )}</span></div>

    <p class="rodape">Documento gerado em ${escapar(
      new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
    )}</p>
  </main>
</body>
</html>`;

    return respostaHtml(html);
  } catch (error: unknown) {
    console.error("ERRO MYSQL - HOLERITE:", error);

    return paginaErro(
      "Erro ao gerar o holerite",
      "Tente novamente em instantes.",
      500
    );
  }
}