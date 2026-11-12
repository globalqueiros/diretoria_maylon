import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

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

function nomeSeguro(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function normalizarPasta(pasta: string): string {
  return pasta
    .split("/")
    .map((parte) => nomeSeguro(parte))
    .filter(Boolean)
    .join("/");
}

function validarChave(key: string): void {
  if (!key || !key.trim()) {
    throw new Error("S3 key não informado.");
  }
}

function validarExpiracao(expiresIn: number): void {
  if (
    !Number.isInteger(expiresIn) ||
    expiresIn < 1 ||
    expiresIn > 604800
  ) {
    throw new Error(
      "A expiração deve estar entre 1 e 604800 segundos."
    );
  }
}

function gerarUrlPublica(key: string): string {
  const publicBase = process.env.S3_PUBLIC_BASE_URL?.replace(
    /\/+$/,
    ""
  );

  const caminho = key
    .split("/")
    .map((parte) => encodeURIComponent(parte))
    .join("/");

  return publicBase
    ? `${publicBase}/${caminho}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${caminho}`;
}

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

  validarChave(key);

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ...(contentType.startsWith("image/")
        ? {
            CacheControl:
              "public, max-age=31536000, immutable",
          }
        : {}),
    })
  );

  return {
    key,
    url: gerarUrlPublica(key),
  };
}

export async function uploadImagemS3(
  file: File,
  pasta: string
): Promise<{
  key: string;
  url: string;
}> {
  if (!file || file.size <= 0) {
    throw new Error("O arquivo está vazio ou não foi informado.");
  }

  const extensoesPorMime: Record<string, string> = {
    "image/png": ".png",
    "image/webp": ".webp",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/avif": ".avif",
    "image/bmp": ".bmp",
    "image/tiff": ".tiff",
  };

  const extensao = extensoesPorMime[file.type];

  if (!extensao) {
    throw new Error(
      `Formato de imagem não suportado: ${file.type || "desconhecido"}.`
    );
  }

  const pastaSegura = normalizarPasta(pasta);

  if (!pastaSegura) {
    throw new Error("A pasta de destino não foi informada.");
  }

  const nomeBase =
    nomeSeguro(file.name).replace(/\.[^.]+$/, "") || "imagem";

  const key = `${pastaSegura}/${randomUUID()}-${nomeBase}${extensao}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  return uploadToS3(buffer, key, file.type);
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
  const nome = nomeSeguro(nomeOriginal) || "documento";
  const pastaSegura = normalizarPasta(pasta);

  if (!pastaSegura) {
    throw new Error("A pasta de destino não foi informada.");
  }

  const key = `${pastaSegura}/${randomUUID()}-${nome}`;
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
  validarChave(key);
  validarExpiracao(expiresIn);

  const nome = (nomeArquivo || "documento")
    .replace(/["\r\n\\/]/g, "")
    .trim();

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${nome || "documento"}"`,
  });

  return getSignedUrl(s3, command, {
    expiresIn,
  });
}

export async function gerarUrlVisualizacaoS3(
  key: string,
  expiresIn = 300
): Promise<string> {
  validarChave(key);
  validarExpiracao(expiresIn);

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
  if (!key || !key.trim()) {
    return;
  }

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}

export async function excluirImagemS3(
  key: string
): Promise<void> {
  return excluirDocumentoS3(key);
}