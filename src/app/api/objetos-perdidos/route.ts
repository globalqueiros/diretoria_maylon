import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "../../lib/db";
import { s3 } from "../../lib/s3";
import crypto from "crypto";

const AWS_REGION = process.env.AWS_REGION_1!;
const AWS_BUCKET = process.env.AWS_S3_BUCKET_1!;

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        const protocolo = String(formData.get("protocolo") || "");
        const nome = String(formData.get("nome") || "");
        const telefone = String(formData.get("telefone") || "");

        const viagem = String(formData.get("viagem") || "");
        const data = String(formData.get("data") || "");
        const local = String(formData.get("local") || "");

        const tipoObjeto = String(
            formData.get("tipo_objeto") || ""
        );

        const objeto = String(
            formData.get("objeto") || ""
        );

        const caracteristicas = String(
            formData.get("caracteristicas") || ""
        );

        // ------------------------------------------------------------
        // VALIDAÇÕES
        // ------------------------------------------------------------

        if (!protocolo) {
            return NextResponse.json(
                {
                    sucesso: false,
                    erro: "Protocolo não informado.",
                },
                { status: 400 }
            );
        }

        if (!nome) {
            return NextResponse.json(
                {
                    sucesso: false,
                    erro: "Nome não informado.",
                },
                { status: 400 }
            );
        }

        if (!telefone) {
            return NextResponse.json(
                {
                    sucesso: false,
                    erro: "Telefone não informado.",
                },
                { status: 400 }
            );
        }

        if (!data) {
            return NextResponse.json(
                {
                    sucesso: false,
                    erro: "Data da perda não informada.",
                },
                { status: 400 }
            );
        }

        if (!tipoObjeto) {
            return NextResponse.json(
                {
                    sucesso: false,
                    erro: "Tipo do objeto não informado.",
                },
                { status: 400 }
            );
        }

        if (!objeto) {
            return NextResponse.json(
                {
                    sucesso: false,
                    erro: "Identificação do objeto não informada.",
                },
                { status: 400 }
            );
        }

        if (!caracteristicas) {
            return NextResponse.json(
                {
                    sucesso: false,
                    erro: "Características do objeto não informadas.",
                },
                { status: 400 }
            );
        }

        // ------------------------------------------------------------
        // VERIFICA SE O PROTOCOLO JÁ EXISTE
        // ------------------------------------------------------------

        const [protocoloExistente] = await db.execute(
            `
            SELECT id
            FROM objetos_perdidos
            WHERE protocolo = ?
            LIMIT 1
            `,
            [protocolo]
        );

        if (
            Array.isArray(protocoloExistente) &&
            protocoloExistente.length > 0
        ) {
            return NextResponse.json(
                {
                    sucesso: false,
                    erro: "Este protocolo já foi utilizado.",
                },
                { status: 409 }
            );
        }

        // ------------------------------------------------------------
        // UPLOAD DO ANEXO PARA O S3
        // (apenas o primeiro arquivo enviado é salvo)
        // ------------------------------------------------------------

        const arquivos = formData
            .getAll("anexos")
            .filter(
                (item): item is File =>
                    item instanceof File && item.size > 0
            );

        const arquivo = arquivos[0] ?? null;

        let anexo: string | null = null;

        if (arquivo) {
            // Extensão original
            const nomeOriginal = arquivo.name;

            const extensao = nomeOriginal.includes(".")
                ? nomeOriginal
                      .substring(nomeOriginal.lastIndexOf("."))
                      .toLowerCase()
                : "";

            // Nome único para o arquivo
            const nomeArquivo = `${crypto.randomUUID()}${extensao}`;

            // Organização dos arquivos dentro do bucket
            const chave = `objetos-perdidos/${protocolo}/${nomeArquivo}`;

            // Converte File para Buffer
            const buffer = Buffer.from(
                await arquivo.arrayBuffer()
            );

            // Upload
            await s3.send(
                new PutObjectCommand({
                    Bucket: AWS_BUCKET,
                    Key: chave,
                    Body: buffer,
                    ContentType:
                        arquivo.type || "application/octet-stream",
                    ContentLength: buffer.length,
                })
            );

            // URL pública do arquivo (mesmo bucket/região do upload)
            anexo = `https://${AWS_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${chave}`;
        }

        // ------------------------------------------------------------
        // INSERT NO MYSQL
        // ------------------------------------------------------------

        const [resultado] = await db.execute(
            `
            INSERT INTO objetos_perdidos (
                protocolo,
                nome,
                telefone,
                viagem,
                data_perda,
                local_perda,
                tipo_objeto,
                objeto,
                caracteristicas,
                anexo,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'aberto')
            `,
            [
                protocolo,
                nome,
                telefone,
                viagem || null,
                data,
                local || null,
                tipoObjeto,
                objeto,
                caracteristicas,
                anexo,
            ]
        );

        const insertId =
            "insertId" in resultado
                ? resultado.insertId
                : null;

        return NextResponse.json(
            {
                sucesso: true,
                mensagem:
                    "Objeto perdido registrado com sucesso.",
                id: insertId,
                protocolo,
                anexo,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error(
            "Erro ao registrar objeto perdido:",
            error
        );

        return NextResponse.json(
            {
                sucesso: false,
                erro:
                    "Erro interno ao registrar o objeto perdido.",
            },
            { status: 500 }
        );
    }
}