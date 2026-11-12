import { NextResponse } from "next/server";
import { db, db2 } from "../../../../lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type DbConnection = typeof db;

type DbRow = Record<string, any>;

function valorValido(value: any) {
    return (
        value !== null &&
        value !== undefined &&
        value !== ""
    );
}

function pegar(
    row: DbRow,
    campos: string[],
    padrao: any = null
) {
    for (const campo of campos) {
        if (
            Object.prototype.hasOwnProperty.call(
                row,
                campo
            ) &&
            valorValido(row[campo])
        ) {
            return row[campo];
        }
    }

    return padrao;
}

function numero(value: any, padrao = 0) {
    if (
        value === null ||
        value === undefined ||
        value === ""
    ) {
        return padrao;
    }

    const n = Number(value);

    return Number.isFinite(n) ? n : padrao;
}

async function buscarTabela(
    connection: DbConnection,
    database: string,
    tabela: string
) {
    try {
        const [rows] = await connection.query(
            `
            SELECT
                COLUMN_NAME
            FROM information_schema.COLUMNS
            WHERE TABLE_SCHEMA = ?
              AND TABLE_NAME = ?
            ORDER BY ORDINAL_POSITION
            `,
            [database, tabela]
        );

        return (rows as any[]).map(
            (row) => row.COLUMN_NAME
        );
    } catch (error) {
        console.error(
            `Erro ao verificar tabela ${database}.${tabela}:`,
            error
        );

        return [];
    }
}

async function procurarViagem(
    connection: DbConnection,
    database: string,
    tripId: string
) {
    const colunas = await buscarTabela(
        connection,
        database,
        "trips"
    );

    console.log(
        `[${database}] COLUNAS trips:`,
        colunas
    );

    if (!colunas.length) {
        return null;
    }

    const candidatos = [
        "id",
        "uuid",
        "trip_id",
        "trip_request_id",
        "request_id",
    ];

    for (const coluna of candidatos) {
        if (!colunas.includes(coluna)) {
            continue;
        }

        try {
            const [rows] = await connection.query(
                `
                SELECT *
                FROM \`${database}\`.\`trips\`
                WHERE \`${coluna}\` = ?
                LIMIT 1
                `,
                [tripId]
            );

            const encontrados =
                rows as DbRow[];

            if (encontrados.length) {
                console.log(
                    `VIAGEM ENCONTRADA EM ${database}.trips`
                );

                console.log(
                    `COLUNA UTILIZADA: ${coluna}`
                );

                return {
                    row: encontrados[0],
                    database,
                };
            }
        } catch (error) {
            console.error(
                `Erro consultando ${database}.trips.${coluna}:`,
                error
            );
        }
    }

    return null;
}

async function buscarTarifa(
    connection: DbConnection,
    database: string,
    viagem: DbRow
) {
    const colunas = await buscarTabela(
        connection,
        database,
        "trip_fares"
    );

    console.log(
        `[${database}] COLUNAS trip_fares:`,
        colunas
    );

    if (!colunas.length) {
        return null;
    }

    const zoneId = pegar(
        viagem,
        [
            "zone_id",
            "pickup_zone_id",
            "origin_zone_id",
        ]
    );

    const vehicleCategoryId = pegar(
        viagem,
        [
            "vehicle_category_id",
            "vehicle_type_id",
            "category_id",
        ]
    );

    console.log(
        "ZONE ID DA VIAGEM:",
        zoneId
    );

    console.log(
        "VEHICLE CATEGORY ID DA VIAGEM:",
        vehicleCategoryId
    );

    /*
     * Primeiro tenta encontrar a tarifa pela combinação
     * zona + categoria do veículo.
     */
    if (
        zoneId &&
        vehicleCategoryId &&
        colunas.includes("zone_id") &&
        colunas.includes("vehicle_category_id")
    ) {
        try {
            const [rows] =
                await connection.query(
                    `
                    SELECT *
                    FROM \`${database}\`.\`trip_fares\`
                    WHERE zone_id = ?
                      AND vehicle_category_id = ?
                    ORDER BY created_at DESC
                    LIMIT 1
                    `,
                    [
                        zoneId,
                        vehicleCategoryId,
                    ]
                );

            const tarifas =
                rows as DbRow[];

            if (tarifas.length) {
                console.log(
                    "TARIFA ENCONTRADA POR ZONA + CATEGORIA"
                );

                return tarifas[0];
            }
        } catch (error) {
            console.error(
                "Erro buscando tarifa por zona/categoria:",
                error
            );
        }
    }

    /*
     * Caso a viagem possua um ID de tarifa,
     * tenta utilizar diretamente.
     */
    const tarifaId = pegar(
        viagem,
        [
            "trip_fare_id",
            "fare_id",
            "fare_rule_id",
            "default_trip_fare_id",
        ]
    );

    if (
        tarifaId &&
        colunas.includes("id")
    ) {
        try {
            const [rows] =
                await connection.query(
                    `
                    SELECT *
                    FROM \`${database}\`.\`trip_fares\`
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [tarifaId]
                );

            const tarifas =
                rows as DbRow[];

            if (tarifas.length) {
                console.log(
                    "TARIFA ENCONTRADA PELO ID"
                );

                return tarifas[0];
            }
        } catch (error) {
            console.error(
                "Erro buscando tarifa pelo ID:",
                error
            );
        }
    }

    return null;
}

function calcularValor(
    viagem: DbRow,
    tarifa: DbRow | null
) {
    /*
     * Se a viagem já possuir o valor calculado,
     * damos prioridade para ele.
     */
    const valorExistente = pegar(
        viagem,
        [
            "valor",
            "fare",
            "amount",
            "price",
            "total_fare",
            "trip_fare",
            "final_fare",
            "total_amount",
            "valor_corrida",
        ]
    );

    if (valorExistente !== null) {
        const valor = numero(
            valorExistente,
            0
        );

        if (valor > 0) {
            return valor;
        }
    }

    if (!tarifa) {
        return 0;
    }

    const baseFare = numero(
        tarifa.base_fare,
        0
    );

    const farePerKm = numero(
        tarifa.base_fare_per_km,
        0
    );

    const distancia = numero(
        pegar(
            viagem,
            [
                "distance",
                "distance_km",
                "trip_distance",
                "total_distance",
                "km",
                "kilometers",
            ],
            0
        ),
        0
    );

    if (
        baseFare === 0 &&
        farePerKm === 0
    ) {
        return 0;
    }

    return (
        baseFare +
        farePerKm * distancia
    );
}

export async function GET(
    request: Request,
    {
        params,
    }: {
        params: Promise<{
            id: string;
        }>;
    }
) {
    try {
        const { id } = await params;

        const tripId = String(
            id ?? ""
        ).trim();

        console.log(
            "================================="
        );

        console.log(
            "BUSCAR VIAGEM"
        );

        console.log(
            "ID RECEBIDO:",
            tripId
        );

        console.log(
            "================================="
        );

        if (!tripId) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "ID da viagem não informado.",
                },
                {
                    status: 400,
                }
            );
        }

        /*
         * =====================================================
         * 1. PROCURA A VIAGEM NO smartmobility_db
         * =====================================================
         */

        let resultado =
            await procurarViagem(
                db,
                "smartmobility_db",
                tripId
            );

        /*
         * =====================================================
         * 2. SE NÃO ENCONTROU, PROCURA NO maylon_db
         * =====================================================
         */

        if (!resultado) {
            resultado =
                await procurarViagem(
                    db2,
                    "maylon_db",
                    tripId
                );
        }

        /*
         * =====================================================
         * 3. VIAGEM NÃO ENCONTRADA
         * =====================================================
         */

        if (!resultado) {
            console.log(
                "================================="
            );

            console.log(
                "VIAGEM NÃO ENCONTRADA"
            );

            console.log(
                "UUID:",
                tripId
            );

            console.log(
                "================================="
            );

            return NextResponse.json(
                {
                    success: false,
                    message:
                        "Viagem não encontrada.",
                    id: tripId,
                },
                {
                    status: 404,
                }
            );
        }

        const viagem =
            resultado.row;

        const database =
            resultado.database;

        console.log(
            "BANCO DA VIAGEM:",
            database
        );

        console.log(
            "DADOS DA VIAGEM:",
            viagem
        );

        /*
         * =====================================================
         * 4. BUSCAR TARIFA
         * =====================================================
         */

        const connection =
            database === "maylon_db"
                ? db2
                : db;

        const tarifa =
            await buscarTarifa(
                connection,
                database,
                viagem
            );

        console.log(
            "TARIFA ENCONTRADA:",
            tarifa
        );

        /*
         * =====================================================
         * 5. DADOS BÁSICOS
         * =====================================================
         */

        const tripRequestId =
            pegar(
                viagem,
                [
                    "trip_request_id",
                    "request_id",
                    "trip_request",
                    "request_number",
                    "trip_number",
                    "id",
                ],
                tripId
            );

        const pickupAddress =
            pegar(
                viagem,
                [
                    "pickup_address",
                    "origin",
                    "pickup_location",
                    "origem",
                    "endereco_origem",
                    "start_address",
                    "from_address",
                ],
                "Origem não informada"
            );

        const destinationAddress =
            pegar(
                viagem,
                [
                    "destination_address",
                    "destination",
                    "dropoff_address",
                    "dropoff_location",
                    "destino",
                    "endereco_destino",
                    "end_address",
                    "to_address",
                ],
                "Destino não informado"
            );

        const status =
            pegar(
                viagem,
                [
                    "current_status",
                    "status",
                    "trip_status",
                    "situacao",
                ],
                "pending"
            );

        const valor =
            calcularValor(
                viagem,
                tarifa
            );

        const distancia =
            numero(
                pegar(
                    viagem,
                    [
                        "distance",
                        "distance_km",
                        "trip_distance",
                        "total_distance",
                        "km",
                        "kilometers",
                    ],
                    0
                )
            );

        /*
         * =====================================================
         * 6. MOTORISTA
         * =====================================================
         */

        const motorista = {
            id: pegar(
                viagem,
                [
                    "driver_id",
                    "driver_user_id",
                    "motorista_id",
                ]
            ),

            nome: pegar(
                viagem,
                [
                    "driver_name",
                    "motorista_nome",
                    "driver_full_name",
                ],
                null
            ),

            telefone: pegar(
                viagem,
                [
                    "driver_phone",
                    "motorista_telefone",
                    "driver_mobile",
                ],
                null
            ),
        };

        /*
         * =====================================================
         * 7. VEÍCULO
         * =====================================================
         */

        const veiculo = {
            id: pegar(
                viagem,
                [
                    "vehicle_id",
                    "car_id",
                    "motorista_vehicle_id",
                ]
            ),

            modelo: pegar(
                viagem,
                [
                    "vehicle_model",
                    "model",
                    "modelo",
                    "vehicle_name",
                ],
                null
            ),

            placa: pegar(
                viagem,
                [
                    "vehicle_plate",
                    "plate",
                    "placa",
                ],
                null
            ),

            categoria: pegar(
                viagem,
                [
                    "vehicle_category",
                    "category",
                    "categoria",
                ],
                null
            ),

            imagem: pegar(
                viagem,
                [
                    "vehicle_image",
                    "vehicle_photo",
                    "image",
                    "photo",
                ],
                null
            ),
        };

        /*
         * =====================================================
         * 8. RESPOSTA
         * =====================================================
         */

        const trip = {
            id: pegar(
                viagem,
                ["id", "uuid"],
                tripId
            ),

            uuid: tripId,

            trip_request_id:
                String(
                    tripRequestId
                ),

            pickup_address:
                String(
                    pickupAddress
                ),

            destination_address:
                String(
                    destinationAddress
                ),

            valor,

            distance: distancia,

            current_status:
                String(status),

            status:
                String(status),

            payment_method:
                pegar(
                    viagem,
                    [
                        "payment_method",
                        "payment_type",
                        "payment_mode",
                        "forma_pagamento",
                    ],
                    null
                ),

            created_at:
                pegar(
                    viagem,
                    [
                        "created_at",
                        "createdAt",
                        "data_criacao",
                    ],
                    null
                ),

            scheduled_at:
                pegar(
                    viagem,
                    [
                        "scheduled_at",
                        "pickup_time",
                        "trip_date",
                        "scheduled_date",
                        "date",
                    ],
                    null
                ),

            motorista,

            veiculo,

            tarifa: tarifa
                ? {
                      id: tarifa.id,
                      zone_id:
                          tarifa.zone_id,
                      vehicle_category_id:
                          tarifa.vehicle_category_id,
                      base_fare:
                          numero(
                              tarifa.base_fare
                          ),
                      base_fare_per_km:
                          numero(
                              tarifa.base_fare_per_km
                          ),
                      waiting_fee_per_min:
                          numero(
                              tarifa.waiting_fee_per_min
                          ),
                      cancellation_fee_percent:
                          numero(
                              tarifa.cancellation_fee_percent
                          ),
                      min_cancellation_fee:
                          numero(
                              tarifa.min_cancellation_fee
                          ),
                  }
                : null,
        };

        console.log(
            "================================="
        );

        console.log(
            "VIAGEM ENCONTRADA"
        );

        console.log(
            "TRIP REQUEST ID:",
            trip.trip_request_id
        );

        console.log(
            "VALOR:",
            trip.valor
        );

        console.log(
            "STATUS:",
            trip.current_status
        );

        console.log(
            "================================="
        );

        return NextResponse.json(
            {
                success: true,
                trip,
            },
            {
                status: 200,
                headers: {
                    "Cache-Control":
                        "no-store, no-cache, must-revalidate",
                },
            }
        );
    } catch (error) {
        console.error(
            "================================="
        );

        console.error(
            "ERRO REAL AO BUSCAR VIAGEM:"
        );

        console.error(error);

        console.error(
            "================================="
        );

        return NextResponse.json(
            {
                success: false,
                message:
                    "Erro interno ao buscar a viagem.",
                error:
                    process.env.NODE_ENV ===
                    "development"
                        ? error instanceof Error
                            ? error.message
                            : String(error)
                        : undefined,
            },
            {
                status: 500,
            }
        );
    }
}