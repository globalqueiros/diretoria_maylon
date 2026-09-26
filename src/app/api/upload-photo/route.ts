import { NextResponse } from "next/server";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Nenhuma imagem foi enviada.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // VALIDAÇÕES
    // =========================================================

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            "Formato inválido. Use JPG, PNG ou WEBP.",
        },
        { status: 400 }
      );
    }

    // Máximo: 5 MB
    const maxSize = 5 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: "A imagem deve ter no máximo 5MB.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // EXTENSÃO
    // =========================================================

    const extensions: Record<string, string> = {
      "image/jpeg": ".jpg",
      "image/png": ".png",
      "image/webp": ".webp",
    };

    const extension = extensions[file.type];

    if (!extension) {
      return NextResponse.json(
        {
          error: "Extensão de imagem inválida.",
        },
        { status: 400 }
      );
    }

    // =========================================================
    // NOME ÚNICO
    // =========================================================

    const fileName =
      `${crypto.randomUUID()}${extension}`;

    // =========================================================
    // PASTA
    // =========================================================

    const uploadDir = path.join(
      process.cwd(),
      "public",
      "uploads",
      "profiles"
    );

    await mkdir(uploadDir, {
      recursive: true,
    });

    // =========================================================
    // SALVAR ARQUIVO
    // =========================================================

    const filePath = path.join(
      uploadDir,
      fileName
    );

    const bytes = await file.arrayBuffer();

    const buffer = Buffer.from(bytes);

    await writeFile(filePath, buffer);

    // =========================================================
    // URL PÚBLICA
    // =========================================================

    const url = `/uploads/profiles/${fileName}`;

    return NextResponse.json({
      success: true,
      url,
    });
  } catch (error) {
    console.error(
      "Erro ao fazer upload da foto:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível enviar a imagem.",
      },
      { status: 500 }
    );
  }
}
