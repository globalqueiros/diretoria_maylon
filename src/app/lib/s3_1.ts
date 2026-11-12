import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

const region = process.env.AWS_REGION_1 || process.env.AWS_REGION;
const bucket =
  process.env.AWS_S3_BUCKET_1 || process.env.AWS_S3_BUCKET;
const accessKeyId =
  process.env.AWS_ACCESS_KEY_ID_1 || process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey =
  process.env.AWS_SECRET_ACCESS_KEY_1 ||
  process.env.AWS_SECRET_ACCESS_KEY;

if (!region) {
  throw new Error("AWS_REGION_1 ou AWS_REGION não configurado.");
}

if (!bucket) {
  throw new Error("AWS_S3_BUCKET_1 ou AWS_S3_BUCKET não configurado.");
}

if (!accessKeyId) {
  throw new Error(
    "AWS_ACCESS_KEY_ID_1 ou AWS_ACCESS_KEY_ID não configurado."
  );
}

if (!secretAccessKey) {
  throw new Error(
    "AWS_SECRET_ACCESS_KEY_1 ou AWS_SECRET_ACCESS_KEY não configurado."
  );
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
  "image/avif": ".avif",
  "image/bmp": ".bmp",
  "image/tiff": ".tiff",
  "image/heic": ".heic",
};

function nomeSeguro(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
}

function removerExtensao(nome: string): string {
  return nome.replace(/\.[a-zA-Z0-9]+$/, "");
}

function normalizarPasta(pasta: string): string {
  return pasta
    .split("/")
    .map((parte) => nomeSeguro(parte))
    .filter(Boolean)
    .join("/");
}

function validarExpiracao(expiresIn: number): void {
  if (
    !Number.isInteger(expiresIn) ||
    expiresIn < 1 ||
    expiresIn > 604800
  ) {
    throw new Error(
      "O tempo de expiração deve estar entre 1 e 604800 segundos."
    );
  }
}

function validarChave(key: string): void {
  if (!key || !key.trim()) {
    throw new Error("Chave do arquivo S3 não informada.");
  }
}

export async function uploadImagemS3(
  file: File,
  pasta: string
): Promise<{
  key: string;
  url: string;
}> {
  if (!file || file.size === 0) {
    throw new Error("O arquivo enviado está vazio.");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error(
      `O arquivo ${file.name} não é uma imagem válida.`
    );
  }

  const extensao = EXTENSOES_POR_MIME[file.type];

  if (!extensao) {
    throw new Error(
      `O formato de imagem ${file.type} não é suportado.`
    );
  }

  const pastaSegura = normalizarPasta(pasta);

  if (!pastaSegura) {
    throw new Error("A pasta de destino não foi informada.");
  }

  const arrayBuffer = await file.arrayBuffer();
  const nomeBase = removerExtensao(nomeSeguro(file.name)) || "imagem";
  const nomeFinal = `${randomUUID()}-${nomeBase}${extensao}`;
  const key = `${pastaSegura}/${nomeFinal}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: Buffer.from(arrayBuffer),
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  const publicBase = process.env.S3_PUBLIC_BASE_URL?.replace(
    /\/+$/,
    ""
  );

  const caminhoCodificado = key
    .split("/")
    .map((parte) => encodeURIComponent(parte))
    .join("/");

  const url = publicBase
    ? `${publicBase}/${caminhoCodificado}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${caminhoCodificado}`;

  return {
    key,
    url,
  };
}

export async function gerarUrlVisualizacaoS3(
  key: string,
  contentType?: string | null,
  expiresIn = 300
): Promise<string> {
  validarChave(key);
  validarExpiracao(expiresIn);

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
    ResponseContentDisposition: "inline",
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

export async function gerarUrlDownloadS3(
  key: string,
  nomeArquivo?: string,
  expiresIn = 300
): Promise<string> {
  validarChave(key);
  validarExpiracao(expiresIn);

  const nome = (nomeArquivo || "documento")
    .replace(/["\r\n]/g, "")
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

export async function excluirImagemS3(
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