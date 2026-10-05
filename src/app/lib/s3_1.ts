import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION;
const bucket = process.env.AWS_S3_BUCKET;

if (!region) {
  throw new Error("AWS_REGION não configurado.");
}

if (!bucket) {
  throw new Error("AWS_S3_BUCKET não configurado.");
}

export const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

function nomeSeguro(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export async function uploadImagemS3(
  file: File,
  pasta: string
): Promise<{
  key: string;
  url: string;
}> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`O arquivo ${file.name} não é uma imagem válida.`);
  }

  const arrayBuffer = await file.arrayBuffer();

  const nome = nomeSeguro(file.name);

  const extensao =
    file.type === "image/png"
      ? ".png"
      : file.type === "image/webp"
        ? ".webp"
        : ".jpg";

  const nomeFinal = `${crypto.randomUUID()}-${nome.replace(
    /\.(png|jpg|jpeg|webp)$/i,
    ""
  )}${extensao}`;

  const key = `${pasta}/${nomeFinal}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(arrayBuffer),
      ContentType: file.type,
    })
  );

  const publicBase = process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");

  const url = publicBase
    ? `${publicBase}/${key}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return {
    key,
    url,
  };
}

/**
 * Gera URL temporária para visualizar o arquivo.
 */
export async function gerarUrlVisualizacaoS3(
  key: string,
  contentType?: string | null,
  expiresIn = 300
) {
  if (!key) {
    throw new Error("Chave do arquivo S3 não informada.");
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,

    // Mantém o arquivo aberto no navegador
    ResponseContentDisposition: "inline",

    // Define o tipo correto para PDF, imagem etc.
    ...(contentType
      ? {
          ResponseContentType: contentType,
        }
      : {}),
  });

  return getSignedUrl(s3, command, {
    expiresIn,
  });
}

/**
 * Gera URL temporária para download.
 */
export async function gerarUrlDownloadS3(
  key: string,
  nomeArquivo?: string,
  expiresIn = 300
) {
  if (!key) {
    throw new Error("Chave do arquivo S3 não informada.");
  }

  const nome = (nomeArquivo || "documento")
    .replace(/"/g, "")
    .replace(/\r/g, "")
    .replace(/\n/g, "");

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${nome}"`,
  });

  return getSignedUrl(s3, command, {
    expiresIn,
  });
}

export async function excluirImagemS3(key: string) {
  if (!key) return;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}
