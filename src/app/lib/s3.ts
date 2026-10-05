import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || "us-east-1";
const bucket = process.env.AWS_S3_BUCKET;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!bucket) {
  throw new Error("AWS_S3_BUCKET não configurado.");
}

if (!accessKeyId) {
  throw new Error("AWS_ACCESS_KEY_ID não configurado.");
}

if (!secretAccessKey) {
  throw new Error("AWS_SECRET_ACCESS_KEY não configurado.");
}

export const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

export async function uploadToS3(
  buffer: Buffer | Uint8Array,
  key: string,
  contentType = "application/octet-stream"
): Promise<{
  key: string;
  url: string;
}> {
  if (!buffer || buffer.length === 0) {
    throw new Error("Arquivo vazio.");
  }

  if (!key) {
    throw new Error("S3 key não informado.");
  }

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })
  );

  const publicBase = process.env.S3_PUBLIC_BASE_URL?.replace(
    /\/$/,
    ""
  );

  const url = publicBase
    ? `${publicBase}/${key}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return {
    key,
    url,
  };
}

function nomeSeguro(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export async function uploadDocumentoS3(
  file: File,
  pasta = "documentos"
): Promise<{
  key: string;
  url: string;
  nomeOriginal: string;
  contentType: string;
  tamanho: number;
}> {
  if (!file) {
    throw new Error("Arquivo não informado.");
  }

  if (file.size <= 0) {
    throw new Error("O arquivo está vazio.");
  }

  const nomeOriginal = file.name;
  const nome = nomeSeguro(nomeOriginal);

  const nomeFinal = `${crypto.randomUUID()}-${nome}`;
  const key = `${pasta}/${nomeFinal}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const contentType =
    file.type || "application/octet-stream";

  const uploaded = await uploadToS3(
    buffer,
    key,
    contentType
  );

  return {
    key: uploaded.key,
    url: uploaded.url,
    nomeOriginal,
    contentType,
    tamanho: file.size,
  };
}

export async function gerarUrlDownloadS3(
  key: string,
  nomeArquivo?: string,
  expiresIn = 300
): Promise<string> {
  if (!key) {
    throw new Error("S3 key não informado.");
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: nomeArquivo
      ? `attachment; filename="${nomeArquivo.replace(
          /"/g,
          ""
        )}"`
      : "attachment",
  });

  return getSignedUrl(s3, command, {
    expiresIn,
  });
}

export async function gerarUrlVisualizacaoS3(
  key: string,
  expiresIn = 300
): Promise<string> {
  if (!key) {
    throw new Error("S3 key não informado.");
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: "inline",
  });

  return getSignedUrl(s3, command, {
    expiresIn,
  });
}

export async function excluirDocumentoS3(
  key: string
): Promise<void> {
  if (!key) {
    return;
  }

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}