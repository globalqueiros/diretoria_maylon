import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { ResultSetHeader } from "mysql2";
import { db2 } from "../../lib/db";

const CATEGORIAS = ["beneficio", "corrida", "pagamento", "cadastro", "entrega", "outro"];
const PRIORIDADES = ["baixa", "media", "alta"];

function gerarNumero() {
  return `ATD-${Date.now()}-${String(Math.floor(Math.random() * 100)).padStart(2, "0")}`;
}

export async function POST(req: Request) {
  // Autenticação pelo cookie access_token
  const token = (await cookies()).get("access_token")?.value;
  let matricula: string | null = null;
  try {
    const payload = jwt.verify(token ?? "", process.env.JWT_SECRET!) as { matricula?: string };
    matricula = payload.matricula ?? null;
  } catch {
    return NextResponse.json({ erro: "Sessão expirada. Entre novamente." }, { status: 401 });
  }

  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const solicitante_id = String(b.solicitante_id ?? "");
  const solicitante_tipo = b.solicitante_tipo === "motorista" ? "motorista" : "passageiro";
  const assunto = String(b.assunto ?? "").trim();
  const categoria = String(b.categoria ?? "");
  const prioridade = String(b.prioridade ?? "media");
  const descricao = String(b.descricao ?? "").trim();

  if (
    !solicitante_id ||
    assunto.length < 5 ||
    assunto.length > 150 ||
    descricao.length < 10 ||
    !CATEGORIAS.includes(categoria) ||
    !PRIORIDADES.includes(prioridade)
  ) {
    return NextResponse.json({ erro: "Revise os campos do protocolo." }, { status: 422 });
  }

  try {
    const [r] = await db2.execute<ResultSetHeader>(
      `INSERT INTO protocolos
         (numero, solicitante_id, solicitante_tipo, assunto, categoria, prioridade, descricao, status, atendente_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'aberto', ?)`,
      [gerarNumero(), solicitante_id, solicitante_tipo, assunto, categoria, prioridade, descricao, matricula]
    );
    return NextResponse.json({ id: r.insertId }, { status: 201 });
  } catch (e) {
    console.error("Erro ao criar protocolo:", e);
    return NextResponse.json({ erro: "Não foi possível criar o protocolo." }, { status: 500 });
  }
}