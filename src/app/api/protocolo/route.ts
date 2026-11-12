import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";
import { db2 } from "../../lib/db";
import { exigirPerfilNaApi } from "../../lib/roles";

const CATEGORIAS = ["beneficio", "corrida", "pagamento", "cadastro", "entrega", "outro"];
const PRIORIDADES = ["baixa", "media", "alta"];

function gerarNumero() {
  return `ATD-${Date.now().toString(36).toUpperCase()}`;
}

async function colunasDe(tabela: string) {
  const [cols] = await db2.query<RowDataPacket[]>(
    `SHOW COLUMNS FROM \`${tabela}\``
  );
  return new Set(cols.map((c) => String(c.Field)));
}

export async function POST(req: Request) {
  const auth = await exigirPerfilNaApi(["comercial", "gerente", "atendente", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ erro: auth.error }, { status: auth.status });
  }

  let body: Record<string, unknown>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const solicitanteId = String(body.solicitante_id ?? "").trim();
  const solicitanteTipo = body.solicitante_tipo === "motorista" ? "motorista" : "passageiro";
  const assunto = String(body.assunto ?? "").trim();
  const categoria = String(body.categoria ?? "");
  const prioridade = String(body.prioridade ?? "media");
  const descricao = String(body.descricao ?? "").trim();

  if (
    !solicitanteId ||
    assunto.length < 5 ||
    assunto.length > 150 ||
    descricao.length < 10 ||
    !CATEGORIAS.includes(categoria) ||
    !PRIORIDADES.includes(prioridade)
  ) {
    return NextResponse.json({ erro: "Revise os campos do protocolo." }, { status: 422 });
  }

  try {
    const [solicitantes] = await db2.query<RowDataPacket[]>(
      `SELECT id, full_name, email FROM users WHERE id = ? LIMIT 1`,
      [solicitanteId]
    );

    const solicitante = solicitantes[0];
    const colunas = await colunasDe("protocolos");

    const campos = ["codigo", "usuario_id", "nome", "email", "categoria", "assunto", "mensagem", "status", "atendente_id"];
    const valores: unknown[] = [
      gerarNumero(),
      solicitanteId,
      solicitante?.full_name ? String(solicitante.full_name) : solicitanteId,
      solicitante?.email ? String(solicitante.email) : "",
      categoria,
      assunto,
      descricao,
      "aberto",
      String(auth.usuario.id),
    ];

    if (colunas.has("prioridade")) {
      campos.push("prioridade");
      valores.push(prioridade);
    }

    if (colunas.has("solicitante_tipo")) {
      campos.push("solicitante_tipo");
      valores.push(solicitanteTipo);
    }

    const [result] = await db2.execute<ResultSetHeader>(
      `INSERT INTO protocolos (${campos.map((c) => `\`${c}\``).join(", ")})
       VALUES (${campos.map(() => "?").join(", ")})`,
      valores as any[]
    );

    return NextResponse.json({ id: result.insertId }, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar protocolo:", error);
    return NextResponse.json({ erro: "Não foi possível criar o protocolo." }, { status: 500 });
  }
}
