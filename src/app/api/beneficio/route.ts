import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db } from "../../lib/db";

export const dynamic = "force-dynamic";

async function getUsuario(): Promise<any | null> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token || !process.env.JWT_SECRET) return null;

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null;
  }
}

export async function GET() {
  const usuario = await getUsuario();
  if (!usuario) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  // Mesmo campo usado na rota PUT
  const colaboradorId = Number(usuario.id ?? usuario.sub);
  if (!Number.isInteger(colaboradorId) || colaboradorId <= 0) {
    return NextResponse.json({ error: "Usuário inválido." }, { status: 401 });
  }

  try {
    const [rows]: any = await db.query(
      `SELECT b.id, b.titulo, b.imagem, b.descricao, b.valor,
              COALESCE(cb.ativo, 0) AS ativo
       FROM beneficios b
       LEFT JOIN colaborador_beneficio cb
         ON cb.beneficio_id = b.id AND cb.colaborador_id = ?
       WHERE b.id <> 4
       ORDER BY b.titulo ASC`,
      [colaboradorId]
    );

    const beneficios = (rows as any[]).map((r) => ({
      id: r.id,
      titulo: r.titulo,
      descricao: r.descricao ?? "",
      imagem: r.imagem ?? null,
      valor: Number(r.valor ?? 0),
      ativo: Number(r.ativo) === 1 ? 1 : 0,
    }));

    return NextResponse.json(beneficios);
  } catch (error) {
    console.error("Erro ao listar benefícios:", error);
    return NextResponse.json(
      { error: "Erro ao carregar benefícios." },
      { status: 500 }
    );
  }
}