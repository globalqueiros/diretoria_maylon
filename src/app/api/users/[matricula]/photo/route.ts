import { NextResponse } from "next/server";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import type { RowDataPacket } from "mysql2";
import { db } from "../../../../lib/db";

export const runtime = "nodejs";

const TAMANHO_MAXIMO = 5 * 1024 * 1024;
const PASTA_PUBLICA = "/uploads/profiles/";

function detectarImagem(buf: Buffer): { ext: string } | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { ext: "jpg" };
  }

  if (
    buf.length > 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return { ext: "png" };
  }

  if (
    buf.length > 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { ext: "webp" };
  }

  return null;
}

async function apagarArquivoLocal(url?: string | null) {
  if (!url || !url.startsWith(PASTA_PUBLICA)) return;

  const nome = path.basename(url);
  const caminho = path.join(process.cwd(), "public", "uploads", "profiles", nome);

  try {
    await unlink(caminho);
  } catch {}
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matricula: string }> | { matricula: string } }
) {
  let caminhoNovo: string | null = null;

  try {
    const { matricula } = await params;

    if (!/^[A-Za-z0-9_-]+$/.test(matricula)) {
      return NextResponse.json({ error: "Matrícula inválida." }, { status: 400 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Nenhum arquivo enviado." }, { status: 400 });
    }

    if (file.size > TAMANHO_MAXIMO) {
      return NextResponse.json(
        { error: "A imagem é muito grande. O tamanho máximo é 5 MB." },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tipo = detectarImagem(buffer);

    if (!tipo) {
      return NextResponse.json(
        { error: "Formato inválido. Envie uma imagem JPG, PNG ou WebP." },
        { status: 415 }
      );
    }

    const [linhas] = await db.query<RowDataPacket[]>(
      "SELECT profile_image FROM users WHERE matricula = ? LIMIT 1",
      [matricula]
    );

    if (linhas.length === 0) {
      return NextResponse.json({ error: "Colaborador não encontrado." }, { status: 404 });
    }

    const fotoAntiga: string | null = linhas[0].profile_image ?? null;

    const pasta = path.join(process.cwd(), "public", "uploads", "profiles");
    await mkdir(pasta, { recursive: true });

    const nomeArquivo = `${matricula}-${Date.now()}.${tipo.ext}`;
    caminhoNovo = path.join(pasta, nomeArquivo);
    await writeFile(caminhoNovo, buffer);

    const url = `${PASTA_PUBLICA}${nomeArquivo}`;

    await db.query("UPDATE users SET profile_image = ? WHERE matricula = ?", [
      url,
      matricula,
    ]);

    await apagarArquivoLocal(fotoAntiga);

    return NextResponse.json({ profile_image: url });
  } catch (error) {
    if (caminhoNovo) {
      try {
        await unlink(caminhoNovo);
      } catch {}
    }

    console.error("Erro ao salvar foto:", error);
    return NextResponse.json({ error: "Erro ao salvar a foto." }, { status: 500 });
  }
}