import { NextResponse } from "next/server";
import {
  PDFDocument,
  StandardFonts,
  rgb,
} from "pdf-lib";
import { db } from "../../../../../../lib/db";
import { uploadToS3 } from "../../../../../../lib/s3";

export const runtime = "nodejs";

type Params = {
  params: Promise<{
    id: string;
  }>;
};

type Termo = {
  id: number;
  marca_modelo: string | null;
  numero_serie: string | null;
  numero_patrimonio: string | null;
  data_entrega: string | Date | null;
  estado_conservacao: string | null;
  nome_completo: string | null;
  cpf: string | null;
  cargo_funcao: string | null;
  whatsapp: string | null;
  contrato_numero: string | null;
};

type ModeloDocumento = {
  arquivo_url: string | null;
};

export async function POST(
  request: Request,
  { params }: Params
) {
  return generatePdf(request, params, true);
}

export async function GET(
  request: Request,
  { params }: Params
) {
  return generatePdf(request, params, false);
}

async function generatePdf(
  _request: Request,
  params: Params["params"],
  download: boolean
) {
  try {
    const { id } = await params;

    const termoId = Number(id);

    if (!Number.isInteger(termoId) || termoId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: "ID do termo inválido.",
        },
        {
          status: 400,
        }
      );
    }

    const [rows] = await db.execute(
      `
      SELECT
        id,
        marca_modelo,
        numero_serie,
        numero_patrimonio,
        data_entrega,
        estado_conservacao,
        nome_completo,
        cpf,
        cargo_funcao,
        whatsapp,
        contrato_numero
      FROM termos_recebimento_maquininha
      WHERE id = ?
      LIMIT 1
      `,
      [termoId]
    );

    const termos = rows as Termo[];

    if (!termos.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Termo não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    const termo = termos[0];

    /*
     * Busca o modelo de documento.
     *
     * IMPORTANTE:
     * Ajuste o WHERE conforme a estrutura da sua tabela
     * modelos_documentos.
     *
     * Se existir apenas um modelo ativo para esse termo,
     * pode usar a consulta abaixo.
     */

    const [modeloRows] = await db.execute(
      `
      SELECT arquivo_url
      FROM modelos_documentos
      WHERE ativo = 1
      ORDER BY id DESC
      LIMIT 1
      `
    );

    const modelos = modeloRows as ModeloDocumento[];

    if (!modelos.length || !modelos[0].arquivo_url) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Modelo do documento não encontrado ou arquivo_url não configurado.",
        },
        {
          status: 404,
        }
      );
    }

    const arquivoUrl = modelos[0].arquivo_url;

    /*
     * Baixa o modelo PDF do S3.
     */

    const templateResponse = await fetch(arquivoUrl);

    if (!templateResponse.ok) {
      throw new Error(
        `Não foi possível baixar o modelo PDF. HTTP ${templateResponse.status}`
      );
    }

    const templateBytes =
      await templateResponse.arrayBuffer();

    const pdfDoc = await PDFDocument.load(templateBytes);

    const pages = pdfDoc.getPages();

    if (!pages.length) {
      throw new Error(
        "O modelo PDF não possui páginas."
      );
    }

    const page1 = pages[0];

    const font = await pdfDoc.embedFont(
      StandardFonts.Helvetica
    );

    const boldFont = await pdfDoc.embedFont(
      StandardFonts.HelveticaBold
    );

    const textColor = rgb(
      0.08,
      0.11,
      0.14
    );

    /*
     * ================================
     * CAMPOS DO TERMO
     * ================================
     */

    drawText(page1, termo.marca_modelo, {
      x: 155,
      y: 455,
      size: 9,
      font,
      color: textColor,
      maxWidth: 330,
    });

    drawText(page1, termo.numero_serie, {
      x: 155,
      y: 438,
      size: 9,
      font,
      color: textColor,
      maxWidth: 330,
    });

    drawText(page1, termo.numero_patrimonio, {
      x: 155,
      y: 421,
      size: 9,
      font,
      color: textColor,
      maxWidth: 330,
    });

    drawText(
      page1,
      formatDate(termo.data_entrega),
      {
        x: 155,
        y: 404,
        size: 9,
        font,
        color: textColor,
        maxWidth: 330,
      }
    );

    drawText(
      page1,
      termo.estado_conservacao,
      {
        x: 155,
        y: 387,
        size: 9,
        font,
        color: textColor,
        maxWidth: 330,
      }
    );

    drawText(page1, termo.nome_completo, {
      x: 155,
      y: 370,
      size: 9,
      font,
      color: textColor,
      maxWidth: 330,
    });

    drawText(page1, termo.cpf, {
      x: 155,
      y: 353,
      size: 9,
      font,
      color: textColor,
      maxWidth: 330,
    });

    drawText(page1, termo.cargo_funcao, {
      x: 155,
      y: 336,
      size: 9,
      font,
      color: textColor,
      maxWidth: 330,
    });

    drawText(page1, termo.whatsapp, {
      x: 155,
      y: 319,
      size: 9,
      font,
      color: textColor,
      maxWidth: 330,
    });

    /*
     * ================================
     * CONTRATO
     * ================================
     */

    page1.drawRectangle({
      x: 180,
      y: 724,
      width: 160,
      height: 14,
      color: rgb(1, 1, 1),
    });

    page1.drawText(
      `CONTRATO Nº ${termo.contrato_numero ?? ""}`,
      {
        x: 182,
        y: 727,
        size: 8,
        font: boldFont,
        color: textColor,
      }
    );

    /*
     * ================================
     * GERA PDF
     * ================================
     */

    const pdfBytes = await pdfDoc.save();

    /*
     * ================================
     * UPLOAD S3
     * ================================
     */

    const fileName = `termo-${termo.contrato_numero ?? termoId}-${termoId}.pdf`;

    const s3Key = `termos-recebimento/${new Date().getFullYear()}/${fileName}`;

    const uploaded = await uploadToS3(
      Buffer.from(pdfBytes),
      s3Key,
      "application/pdf"
    );

    /*
     * ================================
     * ATUALIZA MYSQL
     * ================================
     */

    await db.execute(
      `
      UPDATE termos_recebimento_maquininha
      SET
        pdf_url = ?,
        pdf_key = ?
      WHERE id = ?
      `,
      [
        uploaded.url,
        uploaded.key,
        termoId,
      ]
    );

    /*
     * ================================
     * RETORNA PDF
     * ================================
     */

    return new Response(
      Buffer.from(pdfBytes),
      {
        status: 200,
        headers: {
          "Content-Type":
            "application/pdf",

          "Content-Disposition": download
            ? `attachment; filename="${fileName}"`
            : `inline; filename="${fileName}"`,

          "Cache-Control": "no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Erro ao gerar termo PDF:",
      error
    );

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Erro ao gerar PDF do termo.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ======================================
 * DESENHA TEXTO COM SEGURANÇA
 * ======================================
 */

function drawText(
  page: ReturnType<PDFDocument["getPages"]>[number],
  value: string | null | undefined,
  options: {
    x: number;
    y: number;
    size: number;
    font: any;
    color: ReturnType<typeof rgb>;
    maxWidth?: number;
  }
) {
  if (
    value === null ||
    value === undefined ||
    String(value).trim() === ""
  ) {
    return;
  }

  page.drawText(String(value), {
    x: options.x,
    y: options.y,
    size: options.size,
    font: options.font,
    color: options.color,
    maxWidth: options.maxWidth,
  });
}

/*
 * ======================================
 * FORMATA DATA
 * ======================================
 */

function formatDate(
  value: string | Date | null | undefined
): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(
    "pt-BR",
    {
      timeZone: "UTC",
    }
  );
}