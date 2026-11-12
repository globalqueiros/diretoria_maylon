import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2/promise";
import { db } from "../../../lib/db";
import { getUsuarioSessao } from "../../../lib/roles";

export const dynamic = "force-dynamic";

function lerJson(valor: unknown, padrao: unknown) {
  if (valor == null) return padrao;
  if (typeof valor !== "string") return valor;
  try {
    return JSON.parse(valor);
  } catch {
    return padrao;
  }
}

export async function GET(req: NextRequest) {
  try {
    const usuario = await getUsuarioSessao();

    if (!usuario) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") ?? "todos";
    const escopo = searchParams.get("escopo") ?? "";
    const gerente = escopo === "gerente";

    if (gerente && !["gerente", "diretor"].includes(usuario.user_type)) {
      return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
    }

    const params: unknown[] = [];
    const condicoes: string[] = [];

    if (gerente) {
      condicoes.push("(s.gerente_id = ? OR s.gerente_id IS NULL)");
      params.push(usuario.id);
    } else {
      condicoes.push("COALESCE(s.solicitante_id, s.usuario_id) = ?");
      params.push(usuario.id);
    }

    if (status !== "todos") {
      condicoes.push("s.status = ?");
      params.push(status);
    }

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT s.id, s.usuario_id, s.novo_usuario, s.plano, s.adicionais,
              s.valor, s.observacao, s.status, s.motivo_recusa,
              s.solicitante_id, s.gerente_id, s.criado_em, s.decidido_em,
              u.full_name AS usuario_nome, u.email AS usuario_email,
              u.phone AS usuario_telefone,
              sol.full_name AS solicitante_nome
         FROM maylon_pass_solicitacoes s
         LEFT JOIN users u ON u.id = s.usuario_id
         LEFT JOIN users sol ON sol.id = s.solicitante_id
        WHERE ${condicoes.join(" AND ")}
        ORDER BY s.id DESC
        LIMIT 200`,
      params
    );

    const solicitacoes = rows.map((r) => {
      const novo = lerJson(r.novo_usuario, null) as
        | { nome?: string; email?: string; telefone?: string }
        | null;
      const adicionais = lerJson(r.adicionais, []);

      return {
        id: r.id,
        status: r.status,
        plano: r.plano,
        adicionais: Array.isArray(adicionais) ? adicionais : [],
        valor: Number(r.valor),
        observacao: r.observacao ?? null,
        motivoRecusa: r.motivo_recusa ?? null,
        criadoEm: r.criado_em ? new Date(r.criado_em).toISOString() : null,
        criado_em: r.criado_em ? new Date(r.criado_em).toISOString() : null,
        decididoEm: r.decidido_em ? new Date(r.decidido_em).toISOString() : null,
        nome: novo?.nome ?? r.usuario_nome ?? "Novo usuário",
        email: novo?.email ?? r.usuario_email ?? "",
        telefone: novo?.telefone ?? r.usuario_telefone ?? "",
        solicitante: r.solicitante_nome ?? null,
        usuario: r.usuario_nome ? { nome: r.usuario_nome } : null,
        novoUsuario: novo?.nome ? { nome: novo.nome } : null,
      };
    });

    return NextResponse.json({ solicitacoes });
  } catch (error) {
    console.error("[solicitacoes GET]", error);
    return NextResponse.json(
      { error: "Não foi possível carregar as solicitações." },
      { status: 500 }
    );
  }
}
