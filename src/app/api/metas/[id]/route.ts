import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../../../lib/db';
import { linhaParaMeta, validarMeta } from '../../../lib/metas';

type Ctx = { params: Promise<{ id: string }> };

const COLUNAS = 'id, titulo, descricao, tipo, valor_meta, valor_atual, inicio, fim, responsavel, status, criado_em';

async function lerId(ctx: Ctx) {
  const { id } = await ctx.params;
  const n = Number(id);
  return Number.isInteger(n) && n > 0 ? n : null;
}

export async function PUT(req: Request, ctx: Ctx) {
  try {
    const id = await lerId(ctx);
    if (!id) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });

    const v = validarMeta(await req.json());
    if (!v.ok || !v.dados) return NextResponse.json({ error: v.erro ?? 'Dados inválidos.' }, { status: 400 });
    const d = v.dados;

    const [res] = await db.execute<ResultSetHeader>(
      `UPDATE metas
         SET titulo = ?, descricao = ?, tipo = ?, valor_meta = ?, valor_atual = ?,
             inicio = ?, fim = ?, responsavel = ?, status = ?
       WHERE id = ?`,
      [d.titulo, d.descricao || null, d.tipo, d.valorMeta, d.valorAtual, d.inicio, d.fim, d.responsavel || null, d.status, id]
    );
    if (res.affectedRows === 0) return NextResponse.json({ error: 'Meta não encontrada.' }, { status: 404 });

    const [linhas] = await db.query<RowDataPacket[]>(`SELECT ${COLUNAS} FROM metas WHERE id = ?`, [id]);
    return NextResponse.json(linhaParaMeta(linhas[0]));
  } catch (e) {
    console.error('PUT /api/metas/[id]', e);
    return NextResponse.json({ error: 'Erro ao salvar a meta.' }, { status: 500 });
  }
}

export async function DELETE(_req: Request, ctx: Ctx) {
  try {
    const id = await lerId(ctx);
    if (!id) return NextResponse.json({ error: 'ID inválido.' }, { status: 400 });

    const [res] = await db.execute<ResultSetHeader>('DELETE FROM metas WHERE id = ?', [id]);
    if (res.affectedRows === 0) return NextResponse.json({ error: 'Meta não encontrada.' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('DELETE /api/metas/[id]', e);
    return NextResponse.json({ error: 'Erro ao excluir a meta.' }, { status: 500 });
  }
}