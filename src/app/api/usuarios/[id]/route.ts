import { NextResponse } from "next/server";
import { db2 } from "../../../lib/db";

type Context = {
  params: Promise<{
    id: string;
  }>;
};

type UsuarioDB = Record<string, unknown>;

function valorTexto(...valores: unknown[]): string {
  for (const valor of valores) {
    if (valor !== null && valor !== undefined) {
      const texto = String(valor).trim();

      if (texto) {
        return texto;
      }
    }
  }

  return "";
}

function valorNumero(...valores: unknown[]): number {
  for (const valor of valores) {
    if (valor !== null && valor !== undefined && valor !== "") {
      const numero = Number(valor);

      if (Number.isFinite(numero)) {
        return numero;
      }
    }
  }

  return 0;
}

export async function GET(
  request: Request,
  { params }: Context
) {
  try {
    const { id } = await params;

    const usuarioId = String(id || "").trim();

    if (!usuarioId) {
      return NextResponse.json(
        {
          sucesso: false,
          error: "ID do usuário não informado.",
        },
        { status: 400 }
      );
    }

    // =====================================================
    // BUSCAR USUÁRIO
    // =====================================================

    const [rows] = await db2.execute(
      `
        SELECT *
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [usuarioId]
    );

    const usuarios = rows as UsuarioDB[];

    if (usuarios.length === 0) {
      return NextResponse.json(
        {
          sucesso: false,
          error: "Usuário não encontrado.",
          id: usuarioId,
        },
        { status: 404 }
      );
    }

    const usuario = usuarios[0];

    // =====================================================
    // DADOS BÁSICOS
    // =====================================================

    const nome = valorTexto(
      usuario.nome,
      usuario.name,
      usuario.full_name,
      usuario.username
    );

    const telefone = valorTexto(
      usuario.telefone,
      usuario.phone,
      usuario.phone_number,
      usuario.mobile
    );

    // =====================================================
    // E-MAIL
    // =====================================================

    const email = valorTexto(
      usuario.email,
      usuario.email_address,
      usuario.mail,
      usuario.email_usuario,
      usuario.user_email,
      usuario.login_email
    );

    // =====================================================
    // TIPO
    // =====================================================

    const tipo = valorTexto(
      usuario.tipo,
      usuario.type,
      usuario.user_type,
      usuario.role
    );

    // =====================================================
    // FOTO
    // =====================================================

    const foto = valorTexto(
      usuario.foto_url,
      usuario.foto,
      usuario.avatar,
      usuario.profile_photo,
      usuario.profile_picture,
      usuario.photo
    );

    // =====================================================
    // SERVIÇO
    // =====================================================

    const servico = valorTexto(
      usuario.servico,
      usuario.service
    );

    // =====================================================
    // RATING
    // =====================================================

    const rating = valorNumero(
      usuario.rating,
      usuario.avaliacao,
      usuario.average_rating,
      usuario.driver_rating
    );

    // =====================================================
    // LOCALIZAÇÃO
    // =====================================================

    const cidade = valorTexto(
      usuario.cidade,
      usuario.city
    );

    const estado = valorTexto(
      usuario.estado,
      usuario.state,
      usuario.uf
    );

    // =====================================================
    // CÓDIGO DE REFERÊNCIA
    // =====================================================

    const refCode = valorTexto(
      usuario.ref_code,
      usuario.refCode,
      usuario.codigo_referencia
    );

    // =====================================================
    // STATUS
    // =====================================================

    const isActive =
      Number(usuario.is_active ?? 1) === 1;

    const isTempBlocked =
      Number(usuario.is_temp_blocked ?? 0) === 1;

    const possuiBlockedAt =
      usuario.blocked_at !== null &&
      usuario.blocked_at !== undefined &&
      String(usuario.blocked_at).trim() !== "";

    const bloqueado =
      !isActive ||
      isTempBlocked ||
      possuiBlockedAt;

    // =====================================================
    // DATA DE CADASTRO
    // =====================================================

    const cadastro =
      usuario.cadastro ??
      usuario.created_at ??
      usuario.createdAt ??
      null;

    // =====================================================
    // RETORNO
    // =====================================================

    return NextResponse.json({
      sucesso: true,

      usuario: {
        // -----------------------------------------------
        // IDENTIFICAÇÃO
        // -----------------------------------------------

        id: String(usuario.id ?? usuarioId),

        nome,
        name:
          valorTexto(usuario.name) || nome,

        // -----------------------------------------------
        // E-MAIL
        // -----------------------------------------------

        email,

        email_address: email,

        mail: email,

        email_usuario: email,

        // -----------------------------------------------
        // TELEFONE
        // -----------------------------------------------

        telefone,

        phone:
          valorTexto(usuario.phone) || telefone,

        // -----------------------------------------------
        // TIPO
        // -----------------------------------------------

        tipo,

        type:
          valorTexto(usuario.type) || tipo,

        // -----------------------------------------------
        // FOTO
        // -----------------------------------------------

        foto,

        foto_url: foto,

        avatar: foto,

        // -----------------------------------------------
        // SERVIÇO
        // -----------------------------------------------

        servico,

        service:
          valorTexto(usuario.service) || servico,

        // -----------------------------------------------
        // LOCALIZAÇÃO
        // -----------------------------------------------

        cidade,

        estado,

        // -----------------------------------------------
        // RATING
        // -----------------------------------------------

        rating,

        avaliacao: valorNumero(
          usuario.avaliacao,
          usuario.rating,
          rating
        ),

        // -----------------------------------------------
        // REFERÊNCIA
        // -----------------------------------------------

        ref_code: refCode,

        // -----------------------------------------------
        // DATAS
        // -----------------------------------------------

        cadastro,

        created_at:
          usuario.created_at ?? cadastro,

        updated_at:
          usuario.updated_at ?? null,

        // -----------------------------------------------
        // BLOQUEIO
        // -----------------------------------------------

        is_active: isActive ? 1 : 0,

        is_temp_blocked:
          isTempBlocked ? 1 : 0,

        blocked_at:
          usuario.blocked_at ?? null,

        bloqueado,


        ...usuario,
      },
    });
  } catch (error) {
    console.error(
      "Erro ao buscar usuário:",
      error
    );

    const mensagem =
      error instanceof Error
        ? error.message
        : "Erro interno ao buscar usuário.";

    return NextResponse.json(
      {
        sucesso: false,
        error: mensagem,
      },
      { status: 500 }
    );
  }
}