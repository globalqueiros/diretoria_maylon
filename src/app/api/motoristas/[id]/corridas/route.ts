import { NextRequest, NextResponse } from "next/server";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  request: NextRequest,
  { params }: Params
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        {
          error: "ID do motorista não informado.",
        },
        { status: 400 }
      );
    }

    /*
     * Aqui deverá entrar a consulta das corridas
     * usando o ID do motorista.
     */

    return NextResponse.json({
      corridas: [],
    });
  } catch (error) {
    console.error(
      "GET /api/motoristas/[id]/corridas:",
      error
    );

    return NextResponse.json(
      {
        error: "Erro interno ao buscar corridas.",
      },
      { status: 500 }
    );
  }
}
