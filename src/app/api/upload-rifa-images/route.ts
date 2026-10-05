import { NextResponse } from "next/server";
import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
const bucket = process.env.AWS_S3_BUCKET;

const s3 = new S3Client({
  region,
  credentials:
    accessKeyId && secretAccessKey
      ? {
          accessKeyId,
          secretAccessKey,
        }
      : undefined,
});

export async function POST(request: Request) {
  try {
    if (!region) {
      return NextResponse.json(
        { mensagem: "AWS_REGION não configurado." },
        { status: 500 }
      );
    }

    if (!accessKeyId) {
      return NextResponse.json(
        { mensagem: "AWS_ACCESS_KEY_ID não configurado." },
        { status: 500 }
      );
    }

    if (!secretAccessKey) {
      return NextResponse.json(
        { mensagem: "AWS_SECRET_ACCESS_KEY não configurado." },
        { status: 500 }
      );
    }

    if (!bucket) {
      return NextResponse.json(
        { mensagem: "AWS_S3_BUCKET não configurado." },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const dataSorteioRaw = formData.get("data_sorteio");

    const dataSorteio =
      typeof dataSorteioRaw === "string"
        ? dataSorteioRaw.trim()
        : "";

    if (!dataSorteio) {
      return NextResponse.json(
        {
          mensagem:
            "A data e hora do sorteio são obrigatórias.",
        },
        { status: 400 }
      );
    }

    const dataExpiracao = new Date(dataSorteio);

    if (Number.isNaN(dataExpiracao.getTime())) {
      return NextResponse.json(
        {
          mensagem: "A data do sorteio é inválida.",
        },
        { status: 400 }
      );
    }

    if (dataExpiracao.getTime() <= Date.now()) {
      return NextResponse.json(
        {
          mensagem:
            "A data do sorteio deve ser futura.",
        },
        { status: 400 }
      );
    }

    const files = formData.getAll("files");

    if (files.length === 0) {
      return NextResponse.json(
        {
          mensagem: "Nenhuma imagem foi enviada.",
        },
        { status: 400 }
      );
    }

    if (files.length > 4) {
      return NextResponse.json(
        {
          mensagem:
            "Você pode enviar no máximo 4 imagens.",
        },
        { status: 400 }
      );
    }

    const numeroRifaRaw = formData.get("numero_rifa");

    const numeroRifa =
      typeof numeroRifaRaw === "string"
        ? numeroRifaRaw.trim()
        : "";

    if (!numeroRifa) {
      return NextResponse.json(
        {
          mensagem: "O número da rifa é obrigatório.",
        },
        { status: 400 }
      );
    }

    const tituloRaw = formData.get("titulo");

    const titulo =
      typeof tituloRaw === "string"
        ? tituloRaw.trim()
        : "";

    const dataExpiracaoISO =
      dataExpiracao.toISOString();

    const dataFormatada = dataSorteio
      .split("T")[0]
      .split("-")
      .reverse()
      .join("-");

    const pastaRifa =
      `rifas/${numeroRifa}-${dataFormatada}`;

    const urls: string[] = [];

    for (const item of files) {
      if (!(item instanceof File)) {
        continue;
      }

      if (!item.type.startsWith("image/")) {
        return NextResponse.json(
          {
            mensagem: `O arquivo "${item.name}" não é uma imagem válida.`,
          },
          { status: 400 }
        );
      }

      if (item.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          {
            mensagem: `A imagem "${item.name}" ultrapassa o limite de 5 MB.`,
          },
          { status: 400 }
        );
      }

      const buffer = Buffer.from(
        await item.arrayBuffer()
      );

      let extensao =
        item.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      extensao =
        extensao.replace(/[^a-z0-9]/g, "") || "jpg";

      const nomeArquivo =
        `${pastaRifa}/${Date.now()}-${crypto.randomUUID()}.${extensao}`;

      const metadata: Record<string, string> = {
        data_sorteio: dataSorteio,
        expira_em: dataExpiracaoISO,
        numero_rifa: numeroRifa,
      };

      if (titulo) {
        metadata.titulo = titulo;
      }

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: nomeArquivo,
          Body: buffer,
          ContentType: item.type,
          Metadata: metadata,
        })
      );

      const url =
        `https://${bucket}.s3.${region}.amazonaws.com/${nomeArquivo}`;

      urls.push(url);
    }

    if (urls.length === 0) {
      return NextResponse.json(
        {
          mensagem:
            "Nenhuma imagem válida foi enviada.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      sucesso: true,
      urls,
      pasta: pastaRifa,
      numeroRifa,
      dataSorteio,
      dataExpiracao: dataExpiracaoISO,
    });
  } catch (error) {
    console.error(
      "Erro ao enviar imagens para AWS:",
      error
    );

    return NextResponse.json(
      {
        mensagem:
          "Não foi possível enviar as imagens para a AWS.",
      },
      { status: 500 }
    );
  }
}
