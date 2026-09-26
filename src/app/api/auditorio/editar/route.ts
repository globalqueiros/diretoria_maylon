import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from "@aws-sdk/client-s3";
import path from "path";
import { db } from "../../../lib/db";

export const runtime = "nodejs";

type StatusPatrimonio = "Pendente" | "Compra" | "Aluguel" | "Auditado" | "Divergência";

type PatrimonioBanco = {
  id: number;
  codigo: string;
  n_patrimonio: string;
  nomeitem: string;
  descricao: string | null;
  categoria: string;
  localizacao: string;
  responsavel: string | null;
  valor_aquisicao: number | string;
  comprovantepagamento: string | null;
  nfe: string | null;
  status: StatusPatrimonio;
  datacompra: string | null;
  observacao: string | null;
  created_at?: string;
  updated_at?: string;
};

const STATUS_PERMITIDOS: StatusPatrimonio[] = [
  "Pendente",
  "Compra",
  "Aluguel",
  "Auditado",
  "Divergência",
];

const AWS_REGION = process.env.AWS_REGION_1 || "us-east-1";
const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID_1;
const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY_1;
const S3_BUCKET = process.env.AWS_S3_BUCKET_1 || "documentos-fiscais-prod";
const S3_PREFIX = "patrimonio";

const s3 = new S3Client({
  region: AWS_REGION,
  credentials:
    AWS_ACCESS_KEY_ID && AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: AWS_ACCESS_KEY_ID,
          secretAccessKey: AWS_SECRET_ACCESS_KEY,
        }
      : undefined,
});

function verificarConfiguracaoS3() {
  if (!S3_BUCKET) {
    throw new Error("AWS_S3_BUCKET_1 não configurado.");
  }

  if (!AWS_REGION) {
    throw new Error("AWS_REGION_1 não configurado.");
  }

  if (!AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY) {
    throw new Error(
      "Credenciais AWS não configuradas. Verifique AWS_ACCESS_KEY_ID_1 e AWS_SECRET_ACCESS_KEY_1."
    );
  }
}

function validarArquivo(arquivo: File): File {
  if (arquivo.size <= 0) {
    throw new Error("O arquivo enviado está vazio.");
  }

  const tamanhoMaximo = 10 * 1024 * 1024;

  if (arquivo.size > tamanhoMaximo) {
    throw new Error("O arquivo não pode ultrapassar 10 MB.");
  }

  const tiposPermitidos = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (arquivo.type && !tiposPermitidos.includes(arquivo.type)) {
    throw new Error(
      "Tipo de arquivo não permitido. Envie PDF, JPG, PNG ou WEBP."
    );
  }

  return arquivo;
}

function obterExtensao(arquivo: File): string {
  let extensao = path.extname(arquivo.name).toLowerCase();

  extensao = extensao.replace(/[^a-z0-9.]/g, "");

  if (extensao) {
    return extensao;
  }

  const extensoesPorTipo: Record<string, string> = {
    "application/pdf": ".pdf",
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
  };

  return extensoesPorTipo[arquivo.type] || "";
}

function limparNomeItem(nome: string): string {
  return String(nome || "patrimonio")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .substring(0, 100);
}

function limparNomeArquivo(nome: string): string {
  return String(nome || "arquivo")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "")
    .substring(0, 100);
}

function gerarNomeArquivo(
  prefixo: string,
  id: number,
  arquivo: File
): string {
  const extensao = obterExtensao(arquivo);
  const nomeBase = limparNomeArquivo(prefixo);
  return `${nomeBase}_${id}_${Date.now()}${extensao}`;
}

function gerarS3Key(
  prefixo: string,
  id: number,
  nomeitem: string,
  arquivo: File
): string {
  const pastaNomeItem = limparNomeItem(nomeitem);
  const nomeArquivo = gerarNomeArquivo(prefixo, id, arquivo);
  return `${S3_PREFIX}/${pastaNomeItem}/${nomeArquivo}`;
}

function gerarUrlS3(key: string): string {
  return `https://${S3_BUCKET}.s3.${AWS_REGION}.amazonaws.com/${key
    .split("/")
    .map((parte) => encodeURIComponent(parte))
    .join("/")}`;
}

function extrairS3Key(
  arquivo: string | null | undefined,
  nomeitem?: string
): string | null {
  if (!arquivo) {
    return null;
  }

  const valor = String(arquivo).trim();

  if (!valor) {
    return null;
  }

  if (valor.startsWith("http://") || valor.startsWith("https://")) {
    try {
      const url = new URL(valor);

      let key = decodeURIComponent(
        url.pathname.replace(/^\/+/, "")
      );

      if (key.startsWith(`${S3_PREFIX}/`)) {
        return key;
      }

      if (key.startsWith(`${S3_BUCKET}/`)) {
        key = key.substring(S3_BUCKET.length + 1);
      }

      if (key.startsWith(`${S3_PREFIX}/`)) {
        return key;
      }

      if (nomeitem) {
        const pasta = limparNomeItem(nomeitem);
        return `${S3_PREFIX}/${pasta}/${key}`;
      }

      return `${S3_PREFIX}/${key}`;
    } catch {
      return null;
    }
  }

  let key = valor.replace(/^\/+/, "");

  if (key.startsWith(`${S3_PREFIX}/`)) {
    return key;
  }

  if (key.startsWith(`${S3_BUCKET}/`)) {
    key = key.substring(S3_BUCKET.length + 1);
  }

  if (key.startsWith(`${S3_PREFIX}/`)) {
    return key;
  }

  if (nomeitem) {
    const pasta = limparNomeItem(nomeitem);
    return `${S3_PREFIX}/${pasta}/${key}`;
  }

  return `${S3_PREFIX}/${key}`;
}

async function arquivoExisteS3(key: string): Promise<boolean> {
  try {
    await s3.send(
      new HeadObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      })
    );

    return true;
  } catch {
    return false;
  }
}

async function salvarArquivoS3(
  arquivo: File,
  prefixo: string,
  id: number,
  nomeitem: string
) {
  verificarConfiguracaoS3();

  const key = gerarS3Key(prefixo, id, nomeitem, arquivo);
  const buffer = Buffer.from(await arquivo.arrayBuffer());

  console.log("UPLOAD PARA S3");
  console.log("Nome do item:", nomeitem);
  console.log("Pasta:", limparNomeItem(nomeitem));
  console.log("Bucket:", S3_BUCKET);
  console.log("Região:", AWS_REGION);
  console.log("Key:", key);
  console.log("Arquivo original:", arquivo.name);
  console.log("Tamanho:", buffer.length);
  console.log("Tipo:", arquivo.type);

  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: arquivo.type || "application/octet-stream",
      ContentLength: buffer.length,
    })
  );

  const existe = await arquivoExisteS3(key);

  if (!existe) {
    throw new Error(
      `O upload foi enviado, mas o arquivo não foi encontrado no S3: ${key}`
    );
  }

  const url = gerarUrlS3(key);

  console.log("UPLOAD CONFIRMADO");
  console.log("Nome do item:", nomeitem);
  console.log("Pasta:", limparNomeItem(nomeitem));
  console.log("Key:", key);
  console.log("URL:", url);

  return {
    key,
    url,
    nomeArquivo: arquivo.name,
    nomeitem,
    pasta: `${S3_PREFIX}/${limparNomeItem(nomeitem)}`,
  };
}

async function excluirArquivoS3(
  arquivo: string | null | undefined,
  nomeitem?: string
) {
  if (!arquivo) {
    return;
  }

  try {
    verificarConfiguracaoS3();

    const key = extrairS3Key(arquivo, nomeitem);

    if (!key) {
      console.warn("Não foi possível identificar a key:", arquivo);
      return;
    }

    console.log("EXCLUINDO ARQUIVO ANTIGO");
    console.log("Valor MySQL:", arquivo);
    console.log("Nome do item:", nomeitem);
    console.log("Bucket:", S3_BUCKET);
    console.log("Key:", key);

    await s3.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      })
    );

    console.log("Arquivo antigo excluído:", key);
  } catch (error) {
    console.error("Erro ao excluir arquivo antigo:", error);
  }
}

async function excluirNovoArquivoS3(
  key: string | null
) {
  if (!key) {
    return;
  }

  try {
    await s3.send(
      new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      })
    );

    console.log("Arquivo novo removido:", key);
  } catch (error) {
    console.error("Erro ao remover arquivo novo:", key, error);
  }
}

function parseMoney(value: unknown): number {
  if (value === null || value === undefined || value === "") {
    return 0;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  let texto = String(value).trim();

  texto = texto.replace(/R\$/gi, "");
  texto = texto.replace(/\s/g, "");

  if (texto.includes(",")) {
    texto = texto.replace(/\./g, "").replace(",", ".");
  }

  const numero = Number(texto);

  return Number.isFinite(numero) ? numero : 0;
}

function validarStatus(
  valor: unknown
): valor is StatusPatrimonio {
  return (
    typeof valor === "string" &&
    STATUS_PERMITIDOS.includes(valor as StatusPatrimonio)
  );
}

function criarDocumentos(item: PatrimonioBanco) {
  const pasta = limparNomeItem(item.nomeitem);

  return {
    pasta: `${S3_PREFIX}/${pasta}`,
    nomeitem: item.nomeitem,
    nfe: item.nfe
      ? {
          nome: `NFe - ${item.nomeitem}`,
          url: item.nfe,
          nomeitem: item.nomeitem,
          tipo: "nfe",
          pasta: `${S3_PREFIX}/${pasta}`,
        }
      : null,
    comprovante: item.comprovantepagamento
      ? {
          nome: `Comprovante - ${item.nomeitem}`,
          url: item.comprovantepagamento,
          nomeitem: item.nomeitem,
          tipo: "comprovante",
          pasta: `${S3_PREFIX}/${pasta}`,
        }
      : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const busca = searchParams.get("busca")?.trim() || "";
    const status = searchParams.get("status")?.trim() || "";
    const categoria = searchParams.get("categoria")?.trim() || "";

    let sql = `
      SELECT
        id,
        codigo,
        n_patrimonio,
        nomeitem,
        descricao,
        categoria,
        localizacao,
        responsavel,
        valor_aquisicao,
        comprovantepagamento,
        nfe,
        status,
        datacompra,
        observacao,
        created_at,
        updated_at
      FROM patrimonio
      WHERE 1 = 1
    `;

    const params: (string | number)[] = [];

    if (busca) {
      sql += `
        AND (
          codigo LIKE ?
          OR n_patrimonio LIKE ?
          OR nomeitem LIKE ?
          OR descricao LIKE ?
          OR localizacao LIKE ?
          OR responsavel LIKE ?
        )
      `;

      const termo = `%${busca}%`;

      params.push(
        termo,
        termo,
        termo,
        termo,
        termo,
        termo
      );
    }

    if (validarStatus(status)) {
      sql += ` AND status = ?`;
      params.push(status);
    }

    if (categoria) {
      sql += ` AND categoria = ?`;
      params.push(categoria);
    }

    sql += ` ORDER BY id DESC`;

    const [rows] = await db.query(sql, params);

    const dados = Array.isArray(rows)
      ? (rows as PatrimonioBanco[]).map((item) => ({
          ...item,
          nomeitem: item.nomeitem,
          documentos: criarDocumentos(item),
        }))
      : [];

    return NextResponse.json({
      success: true,
      data: dados,
      s3: {
        bucket: S3_BUCKET,
        regiao: AWS_REGION,
        pasta: S3_PREFIX,
        estrutura: "patrimonio/nomeitem/arquivo",
      },
    });
  } catch (error) {
    console.error("GET /api/auditoria/editar:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Erro ao carregar os patrimônios.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(request: NextRequest) {
  let novoNfeKey: string | null = null;
  let novoComprovanteKey: string | null = null;

  try {
    verificarConfiguracaoS3();

    const formData = await request.formData();
    const id = Number(formData.get("id"));

    if (!id || !Number.isInteger(id)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID do patrimônio inválido.",
        },
        { status: 400 }
      );
    }

    const localizacao = String(
      formData.get("localizacao") ?? ""
    ).trim();

    const responsavel = String(
      formData.get("responsavel") ?? ""
    ).trim();

    const descricao = String(
      formData.get("descricao") ?? ""
    ).trim();

    const observacao = String(
      formData.get("observacao") ?? ""
    ).trim();

    const datacompra = String(
      formData.get("datacompra") ?? ""
    ).trim();

    const statusRecebido = String(
      formData.get("status") ?? ""
    ).trim();

    if (!validarStatus(statusRecebido)) {
      return NextResponse.json(
        {
          success: false,
          error: `Status inválido: "${statusRecebido}".`,
          statusPermitidos: STATUS_PERMITIDOS,
        },
        { status: 400 }
      );
    }

    const status = statusRecebido;

    const valorAquisicao = parseMoney(
      formData.get("valor_aquisicao")
    );

    if (!localizacao) {
      return NextResponse.json(
        {
          success: false,
          error: "A localização é obrigatória.",
        },
        { status: 400 }
      );
    }

    if (status === "Divergência" && !observacao) {
      return NextResponse.json(
        {
          success: false,
          error: "Informe o motivo da divergência.",
        },
        { status: 400 }
      );
    }

    if (!Number.isFinite(valorAquisicao) || valorAquisicao < 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Valor de aquisição inválido.",
        },
        { status: 400 }
      );
    }

    const [rows] = await db.query(
      `
        SELECT
          id,
          nomeitem,
          nfe,
          comprovantepagamento,
          status
        FROM patrimonio
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    const patrimonio =
      Array.isArray(rows) && rows.length > 0
        ? (rows[0] as {
            id: number;
            nomeitem: string;
            nfe: string | null;
            comprovantepagamento: string | null;
            status: string | null;
          })
        : null;

    if (!patrimonio) {
      return NextResponse.json(
        {
          success: false,
          error: "Patrimônio não encontrado.",
        },
        { status: 404 }
      );
    }

    const nomeitem = String(
      patrimonio.nomeitem || ""
    ).trim();

    if (!nomeitem) {
      throw new Error(
        "O patrimônio não possui nomeitem cadastrado."
      );
    }

    console.log("PATRIMÔNIO ENCONTRADO");
    console.log("ID:", patrimonio.id);
    console.log("NOME DO ITEM:", nomeitem);
    console.log(
      "PASTA S3:",
      `${S3_PREFIX}/${limparNomeItem(nomeitem)}`
    );
    console.log("NFE ANTIGA:", patrimonio.nfe);
    console.log(
      "COMPROVANTE ANTIGO:",
      patrimonio.comprovantepagamento
    );

    const nfeForm = formData.get("nfe");

    const arquivoNfe =
      nfeForm instanceof File && nfeForm.size > 0
        ? validarArquivo(nfeForm)
        : null;

    const comprovanteForm = formData.get(
      "comprovantepagamento"
    );

    const arquivoComprovante =
      comprovanteForm instanceof File &&
      comprovanteForm.size > 0
        ? validarArquivo(comprovanteForm)
        : null;

    let novoNfeUrl: string | null = null;

    if (arquivoNfe) {
      const resultadoNfe = await salvarArquivoS3(
        arquivoNfe,
        "nfe",
        id,
        nomeitem
      );

      novoNfeKey = resultadoNfe.key;
      novoNfeUrl = resultadoNfe.url;
    }

    let novoComprovanteUrl: string | null = null;

    if (arquivoComprovante) {
      const resultadoComprovante =
        await salvarArquivoS3(
          arquivoComprovante,
          "comprovante",
          id,
          nomeitem
        );

      novoComprovanteKey = resultadoComprovante.key;
      novoComprovanteUrl = resultadoComprovante.url;
    }

    const nfeFinal =
      novoNfeUrl || patrimonio.nfe || null;

    const comprovanteFinal =
      novoComprovanteUrl ||
      patrimonio.comprovantepagamento ||
      null;

    const [resultado] = await db.query(
      `
        UPDATE patrimonio
        SET
          descricao = ?,
          localizacao = ?,
          responsavel = ?,
          valor_aquisicao = ?,
          nfe = ?,
          comprovantepagamento = ?,
          datacompra = ?,
          observacao = ?,
          status = ?,
          updated_at = NOW()
        WHERE id = ?
      `,
      [
        descricao || null,
        localizacao,
        responsavel || null,
        valorAquisicao,
        nfeFinal,
        comprovanteFinal,
        datacompra || null,
        observacao || null,
        status,
        id,
      ]
    );

    const resultadoUpdate = resultado as {
      affectedRows?: number;
    };

    if (resultadoUpdate.affectedRows === 0) {
      throw new Error(
        "Nenhum registro foi atualizado."
      );
    }

    if (arquivoNfe && patrimonio.nfe) {
      await excluirArquivoS3(
        patrimonio.nfe,
        nomeitem
      );
    }

    if (
      arquivoComprovante &&
      patrimonio.comprovantepagamento
    ) {
      await excluirArquivoS3(
        patrimonio.comprovantepagamento,
        nomeitem
      );
    }

    const [atualizado] = await db.query(
      `
        SELECT
          id,
          codigo,
          n_patrimonio,
          nomeitem,
          descricao,
          categoria,
          localizacao,
          responsavel,
          valor_aquisicao,
          comprovantepagamento,
          nfe,
          status,
          datacompra,
          observacao,
          created_at,
          updated_at
        FROM patrimonio
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    const registroAtualizado =
      Array.isArray(atualizado)
        ? (atualizado[0] as PatrimonioBanco)
        : null;

    const resposta = registroAtualizado
      ? {
          ...registroAtualizado,
          nomeitem: registroAtualizado.nomeitem,
          documentos: criarDocumentos(
            registroAtualizado
          ),
        }
      : null;

    return NextResponse.json({
      success: true,
      message: "Patrimônio atualizado com sucesso.",
      data: resposta,
      s3: {
        bucket: S3_BUCKET,
        regiao: AWS_REGION,
        pasta: S3_PREFIX,
        nomeitem:
          registroAtualizado?.nomeitem ||
          nomeitem,
        pastaItem: `${S3_PREFIX}/${limparNomeItem(
          registroAtualizado?.nomeitem ||
            nomeitem
        )}`,
        nfe: novoNfeKey,
        comprovante: novoComprovanteKey,
      },
    });
  } catch (error) {
    console.error(
      "ERRO PUT /api/auditoria/editar"
    );
    console.error(error);

    if (novoNfeKey) {
      await excluirNovoArquivoS3(novoNfeKey);
    }

    if (novoComprovanteKey) {
      await excluirNovoArquivoS3(
        novoComprovanteKey
      );
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro interno ao atualizar o patrimônio.",
      },
      { status: 500 }
    );
  }
}