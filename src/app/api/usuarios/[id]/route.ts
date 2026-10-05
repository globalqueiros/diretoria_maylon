import { NextResponse } from "next/server";
import { db2 } from "../../../lib/db";
import {
  IDENTITY_MATCH_KEY,
  LAST_LIVENESS_KEY,
  mapearStatusDidit,
  provaVidaDevida,
} from "../../../lib/didit";

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
    // VERIFICAÇÃO (motorista)
    // =====================================================

    const ehMotorista = ["driver", "motorista"].some((valor) =>
      tipo.toLowerCase().includes(valor)
    );

    let verificacaoDocumento: {
      status: string;
      didit_status: string | null;
      is_verified: boolean;
      identity_match: unknown;
      documento_tipo: string | null;
    } | null = null;

    let provaVida: {
      devida: boolean;
      last_liveness_at: string | null;
    } | null = null;

    if (ehMotorista) {
      try {
        const [driverDetailsRows] = await db2.execute(
          `
            SELECT is_verified
            FROM driver_details
            WHERE user_id = ?
            LIMIT 1
          `,
          [usuarioId]
        );

        const [verificacoesRows] = await db2.execute(
          `
            SELECT current_status, attempt_details
            FROM driver_identity_verifications
            WHERE driver_id = ?
            ORDER BY updated_at DESC
            LIMIT 1
          `,
          [usuarioId]
        );

        const driverDetails = driverDetailsRows as Record<string, unknown>[];
        const verificacoes = verificacoesRows as Record<string, unknown>[];

        const detailsRow = driverDetails[0];
        const verifRow = verificacoes[0];

        const isVerified = Number(detailsRow?.is_verified ?? 0);

        const diditStatus =
          typeof verifRow?.current_status === "string"
            ? verifRow.current_status
            : null;

        let lastLivenessAt: string | null = null;
        let identityMatch: unknown = null;
        let documentoTipo: string | null = null;

        if (verifRow?.attempt_details) {
          try {
            // mysql2 pode devolver objeto OU string — tratar os dois
            const detalhes =
              typeof verifRow.attempt_details === "string"
                ? JSON.parse(verifRow.attempt_details)
                : verifRow.attempt_details;

            if (
              typeof (detalhes as Record<string, unknown>)?.[
                LAST_LIVENESS_KEY
              ] === "string" &&
              (detalhes as Record<string, unknown>)[LAST_LIVENESS_KEY]
            ) {
              lastLivenessAt = String(
                (detalhes as Record<string, unknown>)[LAST_LIVENESS_KEY]
              );
            }

            if (
              (detalhes as Record<string, unknown>)?.[IDENTITY_MATCH_KEY]
            ) {
              identityMatch = (detalhes as Record<string, unknown>)[
                IDENTITY_MATCH_KEY
              ];
            }

            // Tipo de documento aprovado (ex: Identity Card, Driving License)
            const decisao = (detalhes as Record<string, unknown>)?.[
              "decision"
            ] as Record<string, unknown> | undefined;

            const idVerificacoes = decisao?.["id_verifications"];

            if (Array.isArray(idVerificacoes) && idVerificacoes.length > 0) {
              const primeira = idVerificacoes[0] as Record<string, unknown>;

              if (typeof primeira?.["document_type"] === "string") {
                documentoTipo = primeira["document_type"];
              }
            }
          } catch {
            lastLivenessAt = null;
          }
        }

        verificacaoDocumento = {
          status: mapearStatusDidit(diditStatus, isVerified),
          didit_status: diditStatus,
          is_verified: Boolean(isVerified),
          identity_match: identityMatch,
          documento_tipo: documentoTipo,
        };

        provaVida = {
          devida: provaVidaDevida(
            (usuario.created_at as string) ?? null,
            lastLivenessAt
          ),
          last_liveness_at: lastLivenessAt,
        };
      } catch (dbError) {
        console.error("erro ao consultar verificação do motorista:", dbError);
      }
    }

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

      verification: {
        documento: verificacaoDocumento,
        prova_vida: provaVida,
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