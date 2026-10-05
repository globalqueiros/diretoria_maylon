import { NextResponse } from "next/server";
import { db2 } from "../../../../lib/db";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || typeof id !== "string") {
      return NextResponse.json(
        { error: "ID do passageiro não informado." },
        { status: 400 }
      );
    }

    // tr.customer_id -> vincula a corrida ao passageiro (trip_requests)
    // trc             -> endereços de origem/destino (trip_request_coordinates)
    //
    // tr.current_status guarda o status real da corrida. Os valores abaixo
    // (pending, accepted, started, completed, cancelled) são um chute comum
    // pra esse tipo de app de corridas — se os valores reais forem
    // diferentes, me diga quais são que eu ajusto o mapeamento.
    const STATUS_LABELS: Record<string, string> = {
      pending: "Aguardando motorista",
      accepted: "Aceita",
      arrived: "Motorista a caminho",
      started: "Em andamento",
      ongoing: "Em andamento",
      completed: "Concluída",
      finished: "Concluída",
      cancelled: "Cancelada",
      canceled: "Cancelada",
    };

    const [rows] = await db2.query(
      `
        SELECT
          tr.id,
          trc.pickup_address        AS origem,
          trc.destination_address   AS destino,
          COALESCE(
            NULLIF(driver.full_name, ''),
            NULLIF(
              TRIM(CONCAT(
                COALESCE(driver.first_name, ''),
                ' ',
                COALESCE(driver.last_name, '')
              )),
              ''
            )
          )                          AS motorista,
          COALESCE(
            NULLIF(tr.paid_fare, 0),
            NULLIF(tr.actual_fare, 0),
            tr.estimated_fare
          )                          AS valor,
          tr.current_status          AS status,
          tr.created_at              AS data
        FROM trip_requests tr
        LEFT JOIN trip_request_coordinates trc
          ON trc.trip_request_id = tr.id
        LEFT JOIN users driver
          ON driver.id = tr.driver_id
          AND driver.user_type = 'driver'
        WHERE tr.customer_id = ?
        ORDER BY tr.created_at DESC
        LIMIT 10
      `,
      [id]
    );

    const corridas = (rows as any[]).map((corrida) => ({
      ...corrida,
      status:
        STATUS_LABELS[String(corrida.status || "").toLowerCase()] ||
        corrida.status,
    }));

    return NextResponse.json({ corridas });
  } catch (error) {
    console.error("Erro ao buscar corridas do passageiro:", error);

    return NextResponse.json(
      { error: "Não foi possível carregar as corridas." },
      { status: 500 }
    );
  }
}