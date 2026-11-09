import { NextResponse } from "next/server";
import { db } from "../../../lib/db";
import { MODELOS_DOCUMENTOS } from "../../../../config/documentos";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const modeloCodigo = String(
      body.modelo || ""
    ).toUpperCase();

    const dados = body.dados || {};

    const modelo =
      MODELOS_DOCUMENTOS[modeloCodigo];

    if (!modelo) {
      return NextResponse.json(
        {
          success: false,
          error: "Modelo de documento inválido.",
        },
        { status: 400 }
      );
    }

    for (const campo of modelo.campos) {
      if (
        campo.required &&
        !String(dados[campo.name] || "").trim()
      ) {
        return NextResponse.json(
          {
            success: false,
            error: `O campo "${campo.label}" é obrigatório.`,
          },
          { status: 400 }
        );
      }
    }

    const [result] = await db.execute(
      `
      INSERT INTO documentos (
        modelo,
        titulo,
        dados,
        status
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        modelo.codigo,
        modelo.titulo,
        JSON.stringify(dados),
        "Pendente",
      ]
    );

    const id = Number(
      (result as { insertId: number }).insertId
    );

    return NextResponse.json(
      {
        success: true,
        id,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "POST /api/documentos:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao salvar documento.",
      },
      {
        status: 500,
      }
    );
  }
}