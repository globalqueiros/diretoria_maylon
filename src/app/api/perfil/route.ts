// src/app/api/perfil/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import * as conexoes from "../../lib/db";

export const dynamic = "force-dynamic";

const TABELA = "users";

interface UsuarioRow extends RowDataPacket {
  id: number | string;
  matricula: string | number | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  user_type: string | null;
  created_at: string | Date | null;
}

type Pool = {
  query: (sql: string, params?: unknown[]) => Promise<unknown>;
};

/**
 * Pega TODAS as conexões exportadas por lib/db (db, db2, etc.).
 * A busca testa uma por uma e usa a primeira que tiver a tabela `users`
 * com a coluna `matricula` e o usuário logado.
 */
const POOLS: [string, Pool][] = (
  Object.entries(conexoes) as [string, unknown][]
).filter(
  (entrada): entrada is [string, Pool] =>
    !!entrada[1] && typeof (entrada[1] as Pool).query === "function"
);

async function usuarioLogadoId(): Promise<string | null> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET as string
    ) as Record<string, unknown>;

    const id = payload.id ?? payload.user_id ?? payload.usuario_id ?? payload.sub;
    return id !== undefined && id !== null && String(id).trim() !== ""
      ? String(id)
      : null;
  } catch {
    return null;
  }
}

function formatar(u: UsuarioRow) {
  return {
    id: u.id,
    matricula:
      u.matricula !== null && u.matricula !== undefined && String(u.matricula).trim() !== ""
        ? String(u.matricula)
        : "",
    first_name: u.first_name ?? "",
    last_name: u.last_name ?? "",
    email: u.email ?? "",
    phone: u.phone ?? "",
    user_type: u.user_type ?? "",
    created_at: u.created_at,
  };
}

async function buscarUsuario(
  id: string
): Promise<{ usuario: UsuarioRow; pool: Pool } | null> {
  for (const [nome, pool] of POOLS) {
    try {
      const [rows] = (await pool.query(
        `SELECT id, matricula, full_name, email, phone, user_type, cpf, agencia, conta, profile_image, user_type, created_at, user_type
           FROM ${TABELA}
          WHERE id = ?
          LIMIT 1`,
        [id]
      )) as [UsuarioRow[], unknown];

      if (rows[0]) {
        console.log(`/api/perfil: usuário ${id} encontrado na conexão "${nome}"`);
        return { usuario: rows[0], pool };
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.warn(`/api/perfil: conexão "${nome}" não serviu (${msg})`);
    }
  }
  return null;
}

export async function GET() {
  const id = await usuarioLogadoId();

  if (!id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const achado = await buscarUsuario(id);

    if (!achado) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json(formatar(achado.usuario));
  } catch (error) {
    console.error("Erro em GET /api/perfil:", error);
    return NextResponse.json(
      { error: "Erro ao buscar perfil" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  const id = await usuarioLogadoId();

  if (!id) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => null)) as {
      first_name?: unknown;
      last_name?: unknown;
      phone?: unknown;
    } | null;

    const firstName = String(body?.first_name ?? "").trim();
    const lastName = String(body?.last_name ?? "").trim();
    const phone = String(body?.phone ?? "").replace(/[^\d+()\-\s]/g, "").trim();

    if (!firstName) {
      return NextResponse.json({ error: "Informe o nome." }, { status: 400 });
    }

    if (firstName.length > 80 || lastName.length > 80 || phone.length > 25) {
      return NextResponse.json(
        { error: "Algum campo excede o tamanho permitido." },
        { status: 400 }
      );
    }

    const achado = await buscarUsuario(id);

    if (!achado) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const [resultado] = (await achado.pool.query(
      `UPDATE ${TABELA}
          SET first_name = ?, last_name = ?, phone = ?
        WHERE id = ?`,
      [firstName, lastName, phone || null, id]
    )) as [ResultSetHeader, unknown];

    if (resultado.affectedRows === 0) {
      return NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
    }

    const atualizado = await buscarUsuario(id);

    return NextResponse.json(
      atualizado ? formatar(atualizado.usuario) : { ok: true }
    );
  } catch (error) {
    console.error("Erro em PUT /api/perfil:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar perfil" },
      { status: 500 }
    );
  }
}