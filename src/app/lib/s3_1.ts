import {
  DeleteObjectCommand,
<<<<<<< HEAD
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
=======
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";

const region = process.env.AWS_REGION_1;
const bucket = process.env.AWS_S3_BUCKET_1;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID_1;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY_1;

if (!region) {
  throw new Error("AWS_REGION_1 não configurado.");
}

if (!bucket) {
  throw new Error("AWS_S3_BUCKET_1 não configurado.");
}

if (!accessKeyId) {
  throw new Error("AWS_ACCESS_KEY_ID_1 não configurado.");
}

if (!secretAccessKey) {
  throw new Error("AWS_SECRET_ACCESS_KEY_1 não configurado.");
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
}

export const s3 = new S3Client({
  region,
  credentials: {
<<<<<<< HEAD
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

=======
    accessKeyId,
    secretAccessKey,
  },
});

const EXTENSOES_POR_MIME: Record<string, string> = {
  "image/png": ".png",
  "image/webp": ".webp",
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
function nomeSeguro(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

<<<<<<< HEAD
=======
function removerExtensao(nome: string) {
  return nome.replace(/\.[a-zA-Z0-9]+$/, "");
}

>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
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

<<<<<<< HEAD
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
=======
  const extensao = EXTENSOES_POR_MIME[file.type] ?? ".jpg";

  const arrayBuffer = await file.arrayBuffer();

  const nomeBase = removerExtensao(nomeSeguro(file.name));

  const nomeFinal = `${randomUUID()}-${nomeBase}${extensao}`;
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1

  const key = `${pasta}/${nomeFinal}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(arrayBuffer),
      ContentType: file.type,
<<<<<<< HEAD
=======
      CacheControl: "public, max-age=31536000, immutable",
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
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

<<<<<<< HEAD
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

=======
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
export async function excluirImagemS3(key: string) {
  if (!key) return;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
