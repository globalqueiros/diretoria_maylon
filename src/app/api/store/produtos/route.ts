import { NextResponse } from "next/server";
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { db } from "../../../lib/db";

export const runtime = "nodejs";

const region = process.env.AWS_REGION_3;
const bucket = process.env.AWS_S3_BUCKET_3;
const accessKeyId = process.env.AWS_ACCESS_KEY_ID_3;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY_3;

if (!region) {
  throw new Error("AWS_REGION_3 não configurado.");
}

if (!bucket) {
  throw new Error("AWS_S3_BUCKET_3 não configurado.");
}

if (!accessKeyId) {
  throw new Error("AWS_ACCESS_KEY_ID_3 não configurado.");
}

if (!secretAccessKey) {
  throw new Error("AWS_SECRET_ACCESS_KEY_3 não configurado.");
}

const s3 = new S3Client({
  region,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

const MAX_FILE_SIZE = 10 * 1024 * 1024;

const TIPOS_IMAGEM_PERMITIDOS = [
  "image/jpeg",
  "image/png",
  "image/webp",
];

function nomeSeguro(nome: string) {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

async function uploadImagemS3(
  file: File,
  pasta: string
): Promise<{
  key: string;
  url: string;
}> {
  if (!file || file.size === 0) {
    throw new Error("Arquivo de imagem vazio.");
  }

  if (!TIPOS_IMAGEM_PERMITIDOS.includes(file.type)) {
    throw new Error(
      `Formato de imagem inválido: ${file.name}. Use JPG, PNG ou WEBP.`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `A imagem ${file.name} ultrapassa o limite de 10 MB.`
    );
  }

  const arrayBuffer = await file.arrayBuffer();
  const nome = nomeSeguro(file.name);

  let extensao = ".jpg";

  if (file.type === "image/png") {
    extensao = ".png";
  }

  if (file.type === "image/webp") {
    extensao = ".webp";
  }

  const nomeSemExtensao = nome.replace(
    /\.(png|jpg|jpeg|webp)$/i,
    ""
  );

  const nomeFinal = `${crypto.randomUUID()}-${nomeSemExtensao}${extensao}`;

  const pastaLimpa = pasta
    .replace(/^\/+|\/+$/g, "")
    .replace(/\/+/g, "/");

  const key = `${pastaLimpa}/${nomeFinal}`;

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

async function excluirImagemS3(key: string) {
  if (!key) {
    return;
  }

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );
  } catch (error) {
    console.error("Erro ao remover imagem do S3:", key, error);
  }
}

function validarImagem(
  file: File | null,
  obrigatoria = false
) {
  if (!file) {
    if (obrigatoria) {
      throw new Error(
        "Imagem principal obrigatória não enviada."
      );
    }

    return;
  }

  if (!TIPOS_IMAGEM_PERMITIDOS.includes(file.type)) {
    throw new Error(
      `Formato de imagem inválido: ${file.name}. Use JPG, PNG ou WEBP.`
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `A imagem ${file.name} ultrapassa o limite de 10 MB.`
    );
  }
}

function numeroDecimal(
  valor: FormDataEntryValue | null
) {
  if (typeof valor !== "string") {
    return 0;
  }

  let valorNormalizado = valor.trim();

  if (valorNormalizado.includes(",")) {
    valorNormalizado = valorNormalizado
      .replace(/\./g, "")
      .replace(",", ".");
  }

  const numero = Number(valorNormalizado);

  if (!Number.isFinite(numero)) {
    return 0;
  }

  return numero;
}

function numeroInteiro(
  valor: FormDataEntryValue | null
) {
  if (typeof valor !== "string") {
    return 0;
  }

  const numero = Number.parseInt(valor, 10);

  if (!Number.isFinite(numero)) {
    return 0;
  }

  return numero;
}

export async function POST(request: Request) {
  const imagensEnviadas: {
    key: string;
    url: string;
  }[] = [];

  try {
    const formData = await request.formData();

    const codigo = String(
      formData.get("codigo") || ""
    ).trim();

    const nome = String(
      formData.get("nome") || ""
    ).trim();

    const descricao = String(
      formData.get("descricao") || ""
    ).trim();

    const categoria = String(
      formData.get("categoria") || ""
    ).trim();

    const estoque = numeroInteiro(
      formData.get("estoque")
    );

    const estoqueMinimo = numeroInteiro(
      formData.get("estoqueMinimo")
    );

    const preco = numeroDecimal(
      formData.get("preco")
    );

    const promocao = numeroDecimal(
      formData.get("promocao")
    );

    const imagemPrincipalEntry =
      formData.get("imagemPrincipal");

    const imagemPrincipal =
      imagemPrincipalEntry instanceof File &&
      imagemPrincipalEntry.size > 0
        ? imagemPrincipalEntry
        : null;

    const imagensSecundarias = formData
      .getAll("imagensSecundarias")
      .filter(
        (item): item is File =>
          item instanceof File &&
          item.size > 0
      )
      .slice(0, 3);

    if (!nome) {
      return NextResponse.json(
        {
          success: false,
          message: "Informe o nome do produto.",
        },
        { status: 400 }
      );
    }

    if (!categoria) {
      return NextResponse.json(
        {
          success: false,
          message: "Selecione uma categoria.",
        },
        { status: 400 }
      );
    }

    if (preco <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Informe um preço válido.",
        },
        { status: 400 }
      );
    }

    if (estoque < 0) {
      return NextResponse.json(
        {
          success: false,
          message: "O estoque não pode ser negativo.",
        },
        { status: 400 }
      );
    }

    if (estoqueMinimo < 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O estoque mínimo não pode ser negativo.",
        },
        { status: 400 }
      );
    }

    if (promocao < 0) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O valor da promoção não pode ser negativo.",
        },
        { status: 400 }
      );
    }

    validarImagem(imagemPrincipal, true);

    imagensSecundarias.forEach((imagem) => {
      validarImagem(imagem);
    });

    let codigoProduto = codigo;

    if (!codigoProduto) {
      codigoProduto = `MAY-${Math.floor(
        100000 + Math.random() * 900000
      )}`;
    }

    const [existentes]: any = await db.query(
      `
        SELECT id
        FROM produtos
        WHERE codigo = ?
        LIMIT 1
      `,
      [codigoProduto]
    );

    if (
      Array.isArray(existentes) &&
      existentes.length > 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Já existe um produto com este código.",
        },
        { status: 409 }
      );
    }

    const pastaS3 =
      `store/produtos/${codigoProduto}`;

    const principal = await uploadImagemS3(
      imagemPrincipal!,
      pastaS3
    );

    imagensEnviadas.push(principal);

    const secundarias: {
      key: string;
      url: string;
    }[] = [];

    for (const imagem of imagensSecundarias) {
      const uploaded = await uploadImagemS3(
        imagem,
        pastaS3
      );

      secundarias.push(uploaded);
      imagensEnviadas.push(uploaded);
    }

    const imagem2 =
      secundarias[0]?.url ?? null;

    const imagem3 =
      secundarias[1]?.url ?? null;

    const imagem4 =
      secundarias[2]?.url ?? null;

    const [resultado]: any = await db.query(
      `
        INSERT INTO produtos (
          codigo,
          nome,
          imagem_principal,
          imagem_2,
          imagem_3,
          imagem_4,
          descricao,
          categoria,
          estoque,
          estoque_minimo,
          preco,
          promocao
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        codigoProduto,
        nome,
        principal.url,
        imagem2,
        imagem3,
        imagem4,
        descricao || null,
        categoria || null,
        estoque,
        estoqueMinimo,
        preco,
        promocao > 0 ? promocao : null,
      ]
    );

    const produtoId = resultado.insertId;

    return NextResponse.json(
      {
        success: true,
        message:
          "Produto cadastrado com sucesso!",
        produto: {
          id: produtoId,
          codigo: codigoProduto,
          nome,
          descricao,
          categoria,
          estoque,
          estoqueMinimo,
          preco,
          promocao:
            promocao > 0 ? promocao : null,
          imagem_principal:
            principal.url,
          imagem_2: imagem2,
          imagem_3: imagem3,
          imagem_4: imagem4,
          imagens: [
            {
              url: principal.url,
              key: principal.key,
              tipo: "principal",
              ordem: 1,
            },
            ...secundarias.map(
              (imagem, index) => ({
                url: imagem.url,
                key: imagem.key,
                tipo: "secundaria",
                ordem: index + 2,
              })
            ),
          ],
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "ERRO AO CADASTRAR PRODUTO:",
      error
    );

    if (imagensEnviadas.length > 0) {
      await Promise.allSettled(
        imagensEnviadas.map((imagem) =>
          excluirImagemS3(imagem.key)
        )
      );
    }

    const message =
      error instanceof Error
        ? error.message
        : "Erro interno ao cadastrar produto.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}
