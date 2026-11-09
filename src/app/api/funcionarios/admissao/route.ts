import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { db } from "../../../lib/db";

export const runtime = "nodejs";

const REGION = process.env.AWS_REGION_2 || "us-east-1";
const BUCKET = process.env.AWS_S3_BUCKET_2 || "";
const ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID_2 || "";
const SECRET_KEY = process.env.AWS_SECRET_ACCESS_KEY_2 || "";

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

function limparNomePasta(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s_-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

function limparNomeArquivo(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "_")
    .replace(/_+/g, "_")
    .trim();
}

function gerarUrlS3(key: string): string {
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

function obterTexto(formData: FormData, campo: string): string {
  const valor = formData.get(campo);

  if (typeof valor !== "string") {
    return "";
  }

  return valor.trim();
}

async function enviarCurriculoS3(
  arquivo: File,
  numeroRecrutamento: string,
  nomeCompleto: string
): Promise<string> {
  if (!BUCKET) {
    throw new Error(
      "AWS_S3_BUCKET_2 não está configurado no .env.local."
    );
  }

  if (!REGION) {
    throw new Error(
      "AWS_REGION_2 não está configurado no .env.local."
    );
  }

  if (!ACCESS_KEY) {
    throw new Error(
      "AWS_ACCESS_KEY_ID_2 não está configurado no .env.local."
    );
  }

  if (!SECRET_KEY) {
    throw new Error(
      "AWS_SECRET_ACCESS_KEY_2 não está configurado no .env.local."
    );
  }

  const nomeLimpo = limparNomePasta(nomeCompleto);
  const pastaRecrutamento = `${numeroRecrutamento}-${nomeLimpo}`;
  const nomeArquivo = limparNomeArquivo(arquivo.name);
  const key = `recrutamento/${pastaRecrutamento}/${nomeArquivo}`;

  const buffer = Buffer.from(await arquivo.arrayBuffer());

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: arquivo.type || "application/pdf",
      ContentLength: buffer.length,
    })
  );

  return gerarUrlS3(key);
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const busca = searchParams.get("busca")?.trim() || "";
    const status = searchParams.get("status") || "";

    const conditions: string[] = [];
    const params: string[] = [];

    if (busca) {
      conditions.push(`
        (
          numero_recrutamento LIKE ?
          OR nome_completo LIKE ?
          OR cpf LIKE ?
          OR email LIKE ?
          OR telefone LIKE ?
          OR cargo LIKE ?
          OR departamento LIKE ?
          OR cidade LIKE ?
        )
      `);

      const termo = `%${busca}%`;

      params.push(
        termo,
        termo,
        termo,
        termo,
        termo,
        termo,
        termo,
        termo
      );
    }

    if (
      status === "pendente" ||
      status === "em_analise" ||
      status === "aprovado" ||
      status === "reprovado" ||
      status === "contratado"
    ) {
      conditions.push("status = ?");
      params.push(status);
    }

    const where =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const [recrutamentos] = await db.query(
      `
        SELECT
          id,
          numero_recrutamento,
          nome_completo,
          cpf,
          rg,
          data_nascimento,
          email,
          telefone,
          sexo,
          estado_civil,
          cep,
          endereco,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          cargo,
          departamento,
          tipo_contrato,
          data_admissao,
          salario,
          jornada,
          observacoes,
          curriculo,
          status,
          created_at,
          updated_at
        FROM candidatos
        ${where}
        ORDER BY id DESC
      `,
      params
    );

    return NextResponse.json({
      success: true,
      data: recrutamentos,
    });
  } catch (error: any) {
    console.error(
      "GET /api/funcionarios/admissao:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        message: "Erro ao buscar recrutamentos.",
        error: error?.sqlMessage || error?.message || null,
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const numeroRecrutamento = obterTexto(
      formData,
      "numeroRecrutamento"
    );

    const nomeCompleto = obterTexto(
      formData,
      "nomeCompleto"
    );

    const cpf = obterTexto(formData, "cpf");
    const rg = obterTexto(formData, "rg");

    const dataNascimento = obterTexto(
      formData,
      "dataNascimento"
    );

    const email = obterTexto(formData, "email");
    const telefone = obterTexto(formData, "telefone");
    const sexo = obterTexto(formData, "sexo");

    const estadoCivil = obterTexto(
      formData,
      "estadoCivil"
    );

    const cep = obterTexto(formData, "cep");
    const endereco = obterTexto(formData, "endereco");
    const numero = obterTexto(formData, "numero");

    const complemento = obterTexto(
      formData,
      "complemento"
    );

    const bairro = obterTexto(formData, "bairro");
    const cidade = obterTexto(formData, "cidade");
    const estado = obterTexto(formData, "estado");

    const cargo = obterTexto(formData, "cargo");

    const departamento = obterTexto(
      formData,
      "departamento"
    );

    const tipoContrato = obterTexto(
      formData,
      "tipoContrato"
    );

    const dataAdmissao = obterTexto(
      formData,
      "dataAdmissao"
    );

    const salarioTexto = obterTexto(
      formData,
      "salario"
    );

    const jornada = obterTexto(formData, "jornada");

    const observacoes = obterTexto(
      formData,
      "observacoes"
    );

    const curriculo = formData.get("curriculo");

    if (!numeroRecrutamento) {
      return NextResponse.json(
        {
          success: false,
          message: "Número do recrutamento não informado.",
        },
        {
          status: 400,
        }
      );
    }

    if (!/^\d{9}$/.test(numeroRecrutamento)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Número do recrutamento inválido.",
        },
        {
          status: 400,
        }
      );
    }

    if (!nomeCompleto) {
      return NextResponse.json(
        {
          success: false,
          message: "O nome completo é obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    if (!cpf) {
      return NextResponse.json(
        {
          success: false,
          message: "O CPF é obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          success: false,
          message: "O e-mail é obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    if (!telefone) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O telefone/WhatsApp é obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    let arquivoCurriculo: File | null = null;

    if (
      curriculo instanceof File &&
      curriculo.size > 0
    ) {
      arquivoCurriculo = curriculo;
    }

    if (!arquivoCurriculo) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O currículo em PDF é obrigatório.",
        },
        {
          status: 400,
        }
      );
    }

    const ehPdf =
      arquivoCurriculo.type === "application/pdf" ||
      arquivoCurriculo.name
        .toLowerCase()
        .endsWith(".pdf");

    if (!ehPdf) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O currículo deve ser um arquivo PDF.",
        },
        {
          status: 400,
        }
      );
    }

    const LIMITE_ARQUIVO = 10 * 1024 * 1024;

    if (
      arquivoCurriculo.size >
      LIMITE_ARQUIVO
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "O currículo não pode ultrapassar 10 MB.",
        },
        {
          status: 400,
        }
      );
    }

    let salario = 0;

    if (salarioTexto) {
      salario = Number(
        salarioTexto
          .replace("R$", "")
          .replace(/\s/g, "")
          .replace(/\./g, "")
          .replace(",", ".")
      );
    }

    if (!Number.isFinite(salario)) {
      salario = 0;
    }

    const caminhoCurriculo =
      await enviarCurriculoS3(
        arquivoCurriculo,
        numeroRecrutamento,
        nomeCompleto
      );

    const [result] = await db.execute(
      `
        INSERT INTO candidatos (
          numero_recrutamento,
          nome_completo,
          cpf,
          rg,
          data_nascimento,
          email,
          telefone,
          sexo,
          estado_civil,
          cep,
          endereco,
          numero,
          complemento,
          bairro,
          cidade,
          estado,
          cargo,
          departamento,
          tipo_contrato,
          data_admissao,
          salario,
          jornada,
          observacoes,
          curriculo,
          status
        )
        VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          ?
        )
      `,
      [
        numeroRecrutamento,
        nomeCompleto,
        cpf,
        rg || null,
        dataNascimento || null,
        email,
        telefone,
        sexo || null,
        estadoCivil || null,
        cep || null,
        endereco || null,
        numero || null,
        complemento || null,
        bairro || null,
        cidade || null,
        estado || null,
        cargo || null,
        departamento || null,
        tipoContrato || null,
        dataAdmissao || null,
        salario,
        jornada || null,
        observacoes || null,
        caminhoCurriculo,
        "pendente",
      ]
    );

    const id = (result as any).insertId;

    return NextResponse.json(
      {
        success: true,
        message:
          "Recrutamento cadastrado com sucesso.",
        id,
        numeroRecrutamento,
        curriculo: caminhoCurriculo,
      },
      {
        status: 201,
      }
    );
  } catch (error: any) {
    console.error(
      "POST /api/funcionarios/admissao:",
      error
    );

    if (error?.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        {
          success: false,
          message:
            "Este CPF já possui um recrutamento cadastrado.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message:
          error?.sqlMessage ||
          error?.message ||
          "Erro ao cadastrar recrutamento.",
        code: error?.code || null,
      },
      {
        status: 500,
      }
    );
  }
}