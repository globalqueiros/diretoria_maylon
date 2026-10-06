import {
  DeleteObjectCommand,
<<<<<<< HEAD
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const region = process.env.AWS_REGION || "us-east-1";
const bucket = process.env.AWS_S3_BUCKET;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
=======
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const region = process.env.AWS_REGION;
const bucket = process.env.AWS_S3_BUCKET;

if (!region) {
  throw new Error("AWS_REGION não configurado.");
}
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1

if (!bucket) {
  throw new Error("AWS_S3_BUCKET não configurado.");
}

<<<<<<< HEAD
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
=======
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
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
): Promise<{
  key: string;
  url: string;
}> {
<<<<<<< HEAD
  if (!buffer || buffer.length === 0) {
    throw new Error("Arquivo vazio.");
  }

  if (!key) {
    throw new Error("S3 key não informado.");
  }
=======
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
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
<<<<<<< HEAD
      Body: buffer,
      ContentType: contentType,
    })
  );

  const publicBase = process.env.S3_PUBLIC_BASE_URL?.replace(
    /\/$/,
    ""
  );
=======
      Body: Buffer.from(arrayBuffer),
      ContentType: file.type,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  const publicBase =
    process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "");
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1

  const url = publicBase
    ? `${publicBase}/${key}`
    : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;

  return {
    key,
    url,
  };
}

<<<<<<< HEAD
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
=======
export async function excluirImagemS3(key: string) {
  if (!key) return;
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1

  await s3.send(
    new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    })
  );
}