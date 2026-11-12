import { NextResponse } from "next/server";
import { db } from "../../../../lib/db";

export const runtime = "nodejs";

export async function GET() {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        oficio_numero,
        contrato_numero,
        marca_modelo,
        numero_serie,
        numero_patrimonio,
        data_entrega,
        estado_conservacao,
        nome_completo,
        cpf,
        cargo_funcao,
        whatsapp,
        pdf_url,
        criado_em,
        atualizado_em
      FROM termos_recebimento_maquininha
      ORDER BY id DESC
    `);

    return NextResponse.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("GET /api/termos-recebimento:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao buscar termos.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      marca_modelo,
      numero_serie,
      numero_patrimonio,
      data_entrega,
      estado_conservacao,
      nome_completo,
      cpf,
      cargo_funcao,
      whatsapp,
    } = body;

    if (
      !marca_modelo ||
      !numero_serie ||
      !numero_patrimonio ||
      !data_entrega ||
      !estado_conservacao ||
      !nome_completo ||
      !cpf ||
      !cargo_funcao ||
      !whatsapp
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Preencha todos os campos obrigatórios.",
        },
        {
          status: 400,
        }
      );
    }

    const ano = new Date().getFullYear();

    const [lastRows] = await db.query(
      `
      SELECT id
      FROM termos_recebimento_maquininha
      ORDER BY id DESC
      LIMIT 1
      `
    );

    const lastId =
      Array.isArray(lastRows) && lastRows.length > 0
        ? Number((lastRows[0] as { id: number }).id)
        : 0;

    const numero = String(lastId + 1).padStart(6, "0");

    const contratoNumero = `MTT-${ano}-${numero}`;

    const [result] = await db.execute(
      `
      INSERT INTO termos_recebimento_maquininha (
        oficio_numero,
        contrato_numero,
        marca_modelo,
        numero_serie,
        numero_patrimonio,
        data_entrega,
        estado_conservacao,
        nome_completo,
        cpf,
        cargo_funcao,
        whatsapp
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        `001/${ano}`,
        contratoNumero,
        marca_modelo,
        numero_serie,
        numero_patrimonio,
        data_entrega,
        estado_conservacao,
        nome_completo,
        cpf,
        cargo_funcao,
        whatsapp,
      ]
    );

    const insertId = Number(
      (result as { insertId: number }).insertId
    );

    return NextResponse.json(
      {
        success: true,
        id: insertId,
        contrato_numero: contratoNumero,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("POST /api/termos-recebimento:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro interno ao criar termo.",
      },
      {
        status: 500,
      }
    );
  }
}