import { NextResponse } from "next/server";
import { randomInt } from "node:crypto";
import { db2 } from "../../lib/db";

export const dynamic = "force-dynamic";

const NIVEIS_ELEGIVEIS = ["platinum", "diamond"];

const MAX_GANHADORES = 20;

type Motorista = {
  id: number | string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  user_level_id: string | null;
  loyalty_points: number | null;
  profile_image: string | null;
};

async function buscarElegiveis(): Promise<Motorista[]> {
  const [rows] = await db2.query(
    `
    SELECT
      id,
      full_name,
      first_name,
      last_name,
      user_level_id,
      loyalty_points,
      profile_image
    FROM smartmobility_db.users
    WHERE user_type = 'driver'
      AND deleted_at IS NULL
      AND is_active = 1
      AND LOWER(user_level_id) IN (?)
    ORDER BY id ASC
    `,
    [NIVEIS_ELEGIVEIS]
  );
  return rows as Motorista[];
}

function erroResposta(error: unknown, rotulo: string) {
  console.error(`ERRO MYSQL - ${rotulo}:`, error);
  return NextResponse.json(
    {
      error: error instanceof Error ? error.message : "Erro ao consultar os motoristas.",
      motoristas: [],
    },
    { status: 500 }
  );
}

// Lista quem está participando do sorteio.
export async function GET() {
  try {
    const motoristas = await buscarElegiveis();
    return NextResponse.json({
      niveis: NIVEIS_ELEGIVEIS,
      total: motoristas.length,
      motoristas,
    });
  } catch (error: unknown) {
    return erroResposta(error, "SORTEIO LISTA");
  }
}

// Realiza o sorteio no servidor. Body opcional: { "quantidade": 1 }
export async function POST(request: Request) {
  try {
    const corpo = await request.json().catch(() => ({}));
    const pedido = Number(corpo?.quantidade ?? 1);
    const quantidade = Number.isInteger(pedido)
      ? Math.min(Math.max(pedido, 1), MAX_GANHADORES)
      : 1;

    const elegiveis = await buscarElegiveis();
    if (elegiveis.length === 0) {
      return NextResponse.json(
        { error: "Nenhum motorista elegível para o sorteio.", ganhadores: [] },
        { status: 404 }
      );
    }

    // Embaralha com aleatoriedade criptográfica (Fisher-Yates) e pega os primeiros.
    const lista = [...elegiveis];
    for (let i = lista.length - 1; i > 0; i--) {
      const j = randomInt(i + 1);
      [lista[i], lista[j]] = [lista[j], lista[i]];
    }
    const ganhadores = lista.slice(0, Math.min(quantidade, lista.length));

    return NextResponse.json({
      sorteadoEm: new Date().toISOString(),
      participantes: elegiveis.length,
      ganhadores,
    });
  } catch (error: unknown) {
    return erroResposta(error, "SORTEIO");
  }
}