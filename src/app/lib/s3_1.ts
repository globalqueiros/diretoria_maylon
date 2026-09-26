import {
  DeleteObjectCommand,
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
}

export const s3 = new S3Client({
  region,
  credentials: {
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

function nomeSeguro(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function removerExtensao(nome: string) {
  return nome.replace(/\.[a-zA-Z0-9]+$/, "");
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

  const extensao = EXTENSOES_POR_MIME[file.type] ?? ".jpg";

  const arrayBuffer = await file.arrayBuffer();

  const nomeBase = removerExtensao(nomeSeguro(file.name));

  const nomeFinal = `${randomUUID()}-${nomeBase}${extensao}`;

  const key = `${pasta}/${nomeFinal}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(arrayBuffer),
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
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

export async function excluirImagemS3(key: string) {
  if (!key) return;

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}