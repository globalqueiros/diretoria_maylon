// src/app/api/motoristas/pendentes/route.ts
import { NextResponse } from "next/server";
import { db2 } from "../../../lib/db"; // ajuste o caminho se necessário

// Para cada campo da tela, nomes de coluna possíveis em `users` (usa a primeira que existir).
const CANDIDATAS = {
  nome: ["full_name", "name", "nome"],
  documento: ["identification_number"],
  documento_tipo: ["identification_type"],
  veiculo: ["veiculo", "vehicle", "vehicle_model", "car_model", "modelo_veiculo"],
  placa: ["placa", "plate", "license_plate", "vehicle_plate", "placa_veiculo"],
  enviado_em: ["created_at", "createdAt", "data_cadastro", "registered_at"],
  status: ["status_cadastro", "approval_status", "status_aprovacao", "driver_status"],
};

export async function GET() {
  try {
    const [colRows]: any = await db2.query("SHOW COLUMNS FROM users");
    const existentes = new Set<string>(colRows.map((c: any) => c.Field));
    const achar = (lista: string[]) => lista.find((c) => existentes.has(c));

    const col = {
      nome: achar(CANDIDATAS.nome),
      documento: achar(CANDIDATAS.documento),
      documento_tipo: achar(CANDIDATAS.documento_tipo),
      veiculo: achar(CANDIDATAS.veiculo),
      placa: achar(CANDIDATAS.placa),
      enviado_em: achar(CANDIDATAS.enviado_em),
      status: achar(CANDIDATAS.status),
    };

    const sel = (c: string | undefined, alias: string) =>
      c ? `u.\`${c}\` AS ${alias}` : `NULL AS ${alias}`;

    // Motorista = usuário cujo nível (user_levels) tem user_type = 'driver'
    const where: string[] = ["ul.user_type = 'driver'"];
    if (col.status) where.push(`u.\`${col.status}\` = 'pendente'`);

    const sql = `
      SELECT u.id,
             ${sel(col.nome, "nome")},
             ${sel(col.documento, "documento")},
             ${sel(col.documento_tipo, "documento_tipo")},
             ${sel(col.veiculo, "veiculo")},
             ${sel(col.placa, "placa")},
             ${sel(col.enviado_em, "enviado_em")}
        FROM users u
        JOIN user_levels ul ON ul.id = u.user_level_id
       WHERE ${where.join(" AND ")}
       ORDER BY ${col.enviado_em ? `u.\`${col.enviado_em}\`` : "u.id"} ASC`;

    const [rows] = await db2.query(sql);

    return NextResponse.json({
      cadastros: rows,
      // Para depurar; remova depois que estiver ok.
      _debug: { colunas_usadas: col, filtro_status_ativo: Boolean(col.status) },
    });
  } catch (error) {
    console.error("GET /api/motoristas/pendentes", error);
    return NextResponse.json({ error: "Erro ao buscar cadastros." }, { status: 500 });
  }
}