import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";
import { db } from "../../../lib/db";
import { exigirPerfilNaApi } from "../../../lib/roles";

export const dynamic = "force-dynamic";

function statusParaUi(status: unknown) {
  const valor = String(status ?? "").toLowerCase();
  if (valor === "resolvido" || valor === "fechado") return "resolvido";
  if (valor === "em_andamento" || valor === "aguardando") return "em_atendimento";
  return "aberto";
}

function prioridadeParaUi(prioridade: unknown) {
  const valor = String(prioridade ?? "").toLowerCase();
  if (valor === "urgente" || valor === "alta") return "alta";
  if (valor === "baixa") return "baixa";
  return "media";
}

export async function GET() {
  const auth = await exigirPerfilNaApi(["comercial", "gerente", "atendente", "diretor"]);

  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT ch.id, ch.protocolo, ch.titulo, ch.descricao, ch.categoria,
              ch.prioridade, ch.status, ch.usuario_id, ch.motorista_id,
              ch.atendente_id, ch.criado_em, ch.atualizado_em,
              u.full_name AS solicitante
         FROM chamados ch
         LEFT JOIN users u ON u.id = ch.usuario_id
        ORDER BY ch.id DESC
        LIMIT 500`
    );

    return NextResponse.json(
      {
        chamados: rows.map((row) => ({
          id: Number(row.id),
          protocolo: String(row.protocolo ?? `#${row.id}`),
          assunto: String(row.titulo ?? "Sem assunto"),
          descricao: String(row.descricao ?? ""),
          solicitante: String(row.solicitante ?? row.usuario_id ?? "Não informado"),
          tipo: row.motorista_id ? "motorista" : "passageiro",
          cidade: "—",
          prioridade: prioridadeParaUi(row.prioridade),
          status: statusParaUi(row.status),
          criado_em: row.criado_em ? new Date(row.criado_em).toISOString() : "",
          atualizado_em: row.atualizado_em
            ? new Date(row.atualizado_em).toISOString()
            : "",
        })),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("Erro GET /api/atendente/chamados:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar os chamados.", chamados: [] },
      { status: 500 }
    );
  }
}
