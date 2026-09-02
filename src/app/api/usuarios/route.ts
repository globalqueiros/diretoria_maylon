import { NextRequest, NextResponse } from "next/server";
import { db2 } from "../../lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const pagina = Math.max(
      Number(searchParams.get("pagina")) || 1,
      1
    );

    const limite = Math.min(
      Math.max(
        Number(searchParams.get("limite")) || 10,
        1
      ),
      100
    );

    const busca = searchParams.get("busca")?.trim() || "";
    const tipo = searchParams.get("tipo")?.trim() || "";

    const offset = (pagina - 1) * limite;

    const where: string[] = ["deleted_at IS NULL"];
    const values: unknown[] = [];

    if (busca) {
      where.push(`
        (
          id LIKE ?
          OR full_name LIKE ?
          OR first_name LIKE ?
          OR last_name LIKE ?
          OR email LIKE ?
          OR phone LIKE ?
        )
      `);

      const termo = `%${busca}%`;

      values.push(
        termo,
        termo,
        termo,
        termo,
        termo,
        termo
      );
    }

    if (tipo === "Motorista") {
      where.push("user_type = ?");
      values.push("driver");
    }

    if (tipo === "Passageiro") {
      where.push("user_type = ?");
      values.push("customer");
    }

    const whereSql = `WHERE ${where.join(" AND ")}`;

    const [countRows] = await db2.query(
      `
        SELECT COUNT(*) AS total
        FROM users
        ${whereSql}
      `,
      values
    );

    const total = Number(
      (countRows as any[])[0]?.total || 0
    );

    const totalPaginas =
      total > 0 ? Math.ceil(total / limite) : 0;

    const [rows] = await db2.query(
      `
        SELECT
          id,
          full_name,
          first_name,
          last_name,
          email,
          phone,
          ref_code, 
          user_type,
          created_at
        FROM users
        ${whereSql}
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `,
      [
        ...values,
        limite,
        offset
      ]
    );

    const usuarios = (rows as any[]).map((usuario) => {
      let nome = usuario.full_name;

      if (!nome) {
        nome = [
          usuario.first_name,
          usuario.last_name
        ]
          .filter(Boolean)
          .join(" ");
      }

      if (!nome) {
        nome = "Sem nome";
      }

      const tipoFormatado =
        usuario.user_type === "driver" ||
        usuario.user_type === "motorista"
          ? "Motorista"
          : "Passageiro";

      return {
        id: String(usuario.id),
        nome,
        email: usuario.email || "",
        telefone: usuario.phone || "",
        tipo: tipoFormatado,
        ref_code : usuario.ref_code || "",
        cadastro: usuario.created_at
          ? new Date(usuario.created_at).toISOString()
          : ""
      };
    });

    return NextResponse.json({
      sucesso: true,
      dados: usuarios,
      paginacao: {
        pagina,
        limite,
        total,
        totalPaginas
      }
    });
  } catch (error) {
    console.error("❌ API USUÁRIOS:", error);

    return NextResponse.json(
      {
        sucesso: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao buscar usuários."
      },
      {
        status: 500
      }
    );
  }
}
