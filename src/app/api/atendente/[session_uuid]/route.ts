
import { NextRequest, NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { promises as fs } from "fs";
import path from "path";
import { db } from "../../../lib/db";
import {
    comNovaTentativa,
    sessaoDaRequisicao,
    type SessaoInvalida,
    type SessaoValida,
} from "../../../lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TAMANHO_MAX = 5 * 1024 * 1024;
const PASTA = path.join(process.cwd(), "storage", "avatars");

const EXTENSOES: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/avif": "avif",
};

const MIME_POR_EXT: Record<string, string> = {
    jpg: "image/jpeg",
    png: "image/png",
    webp: "image/webp",
    avif: "image/avif",
};

function detectarMime(b: Buffer): string | null {
    if (b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
    if (b.length >= 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
    if (b.length >= 12 && b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WEBP") return "image/webp";
    if (b.length >= 12 && b.toString("ascii", 4, 8) === "ftyp" && ["avif", "avis"].includes(b.toString("ascii", 8, 12))) return "image/avif";
    return null;
}

async function autenticar(req: NextRequest) {
    const sessao = await sessaoDaRequisicao(req);

    if (sessao.ok) {
        return { userId: (sessao as SessaoValida).userId } as const;
    }

    if ((sessao as SessaoInvalida).indisponivel) {
        return {
            resposta: NextResponse.json(
                { error: "Serviço temporariamente indisponível. Tente novamente." },
                { status: 503 }
            ),
        } as const;
    }

    return {
        resposta: NextResponse.json(
            { error: "Sessão inválida. Entre novamente." },
            { status: 401 }
        ),
    } as const;
}

function valorColuna(v: unknown): string {
    if (v === null || v === undefined) return "";
    return (Buffer.isBuffer(v) ? v.toString("utf8") : String(v)).trim();
}

export async function POST(req: NextRequest) {
    const auth = await autenticar(req);

    if ("resposta" in auth) return auth.resposta;

    const userId = auth.userId;

    let form: FormData;

    try {
        form = await req.formData();
    } catch {
        return NextResponse.json({ error: "Envio inválido." }, { status: 400 });
    }

    const arquivo = form.get("foto");

    if (!(arquivo instanceof File)) {
        return NextResponse.json({ error: "Nenhuma imagem foi enviada." }, { status: 400 });
    }

    if (arquivo.size === 0) {
        return NextResponse.json({ error: "O arquivo está vazio." }, { status: 400 });
    }

    if (arquivo.size > TAMANHO_MAX) {
        return NextResponse.json({ error: "A imagem deve ter no máximo 5 MB." }, { status: 413 });
    }

    const buffer = Buffer.from(await arquivo.arrayBuffer());
    const mime = detectarMime(buffer);

    if (!mime) {
        return NextResponse.json(
            { error: "Formato não suportado. Use JPG, PNG, WEBP ou AVIF." },
            { status: 415 }
        );
    }

    const nomeArquivo = `${userId.replace(/\W/g, "")}-${Date.now()}.${EXTENSOES[mime]}`;

    try {
        const [antes] = await comNovaTentativa(() =>
            db.execute<RowDataPacket[]>(
                "SELECT profile_image FROM users WHERE id = ? LIMIT 1",
                [userId]
            )
        );

        if (antes.length === 0) {
            return NextResponse.json({ error: "Usuário não encontrado." }, { status: 404 });
        }

        const anterior = valorColuna(antes[0].profile_image);

        await fs.mkdir(PASTA, { recursive: true });
        await fs.writeFile(path.join(PASTA, nomeArquivo), buffer);

        const [resultado] = await comNovaTentativa(() =>
            db.execute<ResultSetHeader>(
                "UPDATE users SET profile_image = ? WHERE id = ?",
                [nomeArquivo, userId]
            )
        );

        if (resultado.affectedRows === 0) {
            await fs.unlink(path.join(PASTA, nomeArquivo)).catch(() => {});
            return NextResponse.json({ error: "Não foi possível salvar a foto." }, { status: 500 });
        }

        if (anterior && !/^(https?:)?\/\//.test(anterior) && anterior !== nomeArquivo) {
            await fs.unlink(path.join(PASTA, path.basename(anterior))).catch(() => {});
        }
    } catch (e) {
        console.error("Erro ao salvar foto de perfil:", e);
        return NextResponse.json({ error: "Não foi possível salvar a foto." }, { status: 500 });
    }

    return NextResponse.json({ avatar: `/api/perfil/foto?v=${Date.now()}` });
}

export async function GET(req: NextRequest) {
    const auth = await autenticar(req);

    if ("resposta" in auth) return auth.resposta;

    const userId = auth.userId;

    try {
        const [rows] = await comNovaTentativa(() =>
            db.execute<RowDataPacket[]>(
                "SELECT profile_image FROM users WHERE id = ? LIMIT 1",
                [userId]
            )
        );

        const valor = rows.length ? valorColuna(rows[0].profile_image) : "";

        if (!valor) return new NextResponse(null, { status: 404 });

        if (/^https?:\/\//.test(valor)) {
            return NextResponse.redirect(valor);
        }

        const caminho = path.join(PASTA, path.basename(valor));

        const [info, dados] = await Promise.all([
            fs.stat(caminho),
            fs.readFile(caminho),
        ]);

        const ext = path.extname(caminho).slice(1).toLowerCase();
        const mime = MIME_POR_EXT[ext] ?? "application/octet-stream";
        const etag = `"${info.size}-${Math.floor(info.mtimeMs)}"`;

        if (req.headers.get("if-none-match") === etag) {
            return new NextResponse(null, {
                status: 304,
                headers: { ETag: etag },
            });
        }

        return new NextResponse(new Uint8Array(dados), {
            headers: {
                "Content-Type": mime,
                "Content-Length": String(dados.length),
                "Cache-Control": "private, no-cache",
                ETag: etag,
                "X-Content-Type-Options": "nosniff",
            },
        });
    } catch (e) {
        if ((e as NodeJS.ErrnoException)?.code === "ENOENT") {
            return new NextResponse(null, { status: 404 });
        }

        console.error("Erro ao buscar foto de perfil:", e);

        return NextResponse.json(
            { error: "Não foi possível carregar a foto." },
            { status: 500 }
        );
    }
}
