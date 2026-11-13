import { NextResponse } from 'next/server';
import type { ResultSetHeader, RowDataPacket } from 'mysql2';
import { db } from '../../lib/db';
import { linhaParaMeta, validarMeta } from '../../lib/metas';

const COLUNAS = 'id, titulo, descricao, tipo, valor_meta, valor_atual, inicio, fim, responsavel, status, criado_em';

export async function GET() {
  try {
    const [linhas] = await db.query<RowDataPacket[]>(`SELECT ${COLUNAS} FROM metas ORDER BY fim ASC, id DESC`);
    return NextResponse.json(linhas.map(linhaParaMeta));
  } catch (e) {
    console.error('GET /api/metas', e);
    return NextResponse.json({ error: 'Erro ao carregar as metas.' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const v = validarMeta(await req.json());
    if (!v.ok || !v.dados) return NextResponse.json({ error: v.erro ?? 'Dados inválidos.' }, { status: 400 });
    const d = v.dados;

    const [res] = await db.execute<ResultSetHeader>(
      `INSERT INTO metas (titulo, descricao, tipo, valor_meta, valor_atual, inicio, fim, responsavel, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [d.titulo, d.descricao || null, d.tipo, d.valorMeta, d.valorAtual, d.inicio, d.fim, d.responsavel || null, d.status]
    );

    const [linhas] = await db.query<RowDataPacket[]>(`SELECT ${COLUNAS} FROM metas WHERE id = ?`, [res.insertId]);
    return NextResponse.json(linhaParaMeta(linhas[0]), { status: 201 });
  } catch (e) {
    console.error('POST /api/metas', e);
    return NextResponse.json({ error: 'Erro ao criar a meta.' }, { status: 500 });
  }
}