import { NextRequest, NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../../../lib/db";
import { exigirPerfilNaApi } from "../../../../lib/roles";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await exigirPerfilNaApi(["diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { id } = await context.params;
    const regraId = Number(id);
    const body = await request.json().catch(() => ({}));

    if (!Number.isSafeInteger(regraId) || regraId <= 0) {
      return NextResponse.json({ error: "Regra inválida." }, { status: 400 });
    }

    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, percentual FROM comissoes_comerciais_regras WHERE id = ? LIMIT 1`,
      [regraId]
    );

    if (!rows.length) {
      return NextResponse.json({ error: "Regra não encontrada." }, { status: 404 });
    }

    const atual = rows[0];
    const percentual =
      body.percentual !== undefined ? Number(body.percentual) : Number(atual.percentual);

    if (!Number.isFinite(percentual) || percentual < 0 || percentual > 100) {
      return NextResponse.json(
        { error: "O percentual deve estar entre 0 e 100." },
        { status: 400 }
      );
    }

    const ativo =
      body.ativo !== undefined ? (body.ativo ? 1 : 0) : undefined;
    const vigenciaInicio =
      body.vigenciaInicio === null || body.vigenciaInicio === ""
        ? null
        : typeof body.vigenciaInicio === "string"
          ? body.vigenciaInicio
          : undefined;
    const vigenciaFim =
      body.vigenciaFim === null || body.vigenciaFim === ""
        ? null
        : typeof body.vigenciaFim === "string"
          ? body.vigenciaFim
          : undefined;

    const campos: string[] = ["percentual = ?", "atualizado_por = ?"];
    const valores: unknown[] = [percentual, auth.usuario.id];

    if (ativo !== undefined) {
      campos.push("ativo = ?");
      valores.push(ativo);
    }

    if (vigenciaInicio !== undefined) {
      campos.push("vigencia_inicio = ?");
      valores.push(vigenciaInicio);
    }

    if (vigenciaFim !== undefined) {
      campos.push("vigencia_fim = ?");
      valores.push(vigenciaFim);
    }

    valores.push(regraId);

    await db.execute(
      `UPDATE comissoes_comerciais_regras SET ${campos.join(", ")} WHERE id = ?`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      valores as any[]
    );

    if (Number(atual.percentual) !== percentual) {
      await db.execute(
        `INSERT INTO comissoes_comerciais_regras_historico
          (regra_id, percentual_anterior, percentual_novo, alterado_por)
         VALUES (?, ?, ?, ?)`,
        [regraId, Number(atual.percentual), percentual, auth.usuario.id]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro PATCH /api/comissoes/regras/[id]:", error);
    return NextResponse.json(
      { error: "Não foi possível atualizar a regra de comissão." },
      { status: 500 }
    );
  }
}
