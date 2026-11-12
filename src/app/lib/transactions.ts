import "server-only";
import type { RowDataPacket } from "mysql2";
import { db2 } from "./db";

export type Transaction = {
  id: string;
  reference: string;
  date: string | null;
  to: string;
  credit: number;
  debit: number;
  balance: number;
  explanation: string;
};

// Pega o primeiro campo existente. Se a sua coluna tiver outro nome, adicione aqui.
const pick = (row: RowDataPacket, names: string[]) => {
  for (const n of names) if (row[n] !== undefined && row[n] !== null) return row[n];
  return null;
};

const F = {
  id: ["transaction_id", "trx_id", "id"],
  reference: ["reference", "trx_ref_id", "ref"],
  date: ["transaction_date", "created_at", "date"],
  to: ["transaction_to", "account", "user_name", "user_id"],
  credit: ["credit"],
  debit: ["debit"],
  balance: ["balance"],
  explanation: ["explanation", "description", "note", "attribute"],
};

export async function listTransactions(q = ""): Promise<Transaction[]> {
  const [rows] = await db2.query<RowDataPacket[]>(
    "SELECT * FROM transactions ORDER BY id DESC LIMIT 500"
  );

  const list = rows.map((r) => {
    const d = pick(r, F.date);
    return {
      id: String(pick(r, F.id) ?? ""),
      reference: String(pick(r, F.reference) ?? "—"),
      date: d ? new Date(d).toISOString() : null,
      to: String(pick(r, F.to) ?? "—"),
      credit: Number(pick(r, F.credit) ?? 0),
      debit: Number(pick(r, F.debit) ?? 0),
      balance: Number(pick(r, F.balance) ?? 0),
      explanation: String(pick(r, F.explanation) ?? "—"),
    };
  });

  const t = q.toLowerCase().trim();
  if (!t) return list;
  return list.filter((x) =>
    `${x.id} ${x.reference} ${x.to} ${x.explanation}`.toLowerCase().includes(t)
  );
}