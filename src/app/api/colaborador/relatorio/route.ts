import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { db, db2 } from "../../../lib/db";

export const dynamic = "force-dynamic";

const TABELA = "protocolos";


const COMISSAO_PADRAO = Number(process.env.COMISSAO_POR_ATENDIMENTO ?? 8);

const CANDIDATOS = {
  id: ["id", "protocolo_id"],
  codigo: ["protocolo", "numero_protocolo", "numero", "codigo", "ref_id", "id"],
  cliente: [
    "cliente_nome",
    "nome_cliente",
    "solicitante_nome",
    "customer_name",
    "nome",
    "cliente",
    "cliente_id",
    "user_id",
  ],
  atendente: [
    "atendente_id",
    "colaborador_id",
    "responsavel_id",
    "atendido_por",
    "assigned_to",
    "agent_id",
    "admin_id",
    "user_atendente_id",
  ],
  status: ["status", "situacao", "current_status"],
  valor: ["valor", "valor_comissao", "comissao", "amount"],
  data: ["atualizado_em", "updated_at", "created_at", "criado_em"],
} as const;

type Mapa = {
  id: string;
  codigo: string;
  cliente: string | null;
  atendente: string;
  status: string;
  valor: string | null;
  data: string;
};

let cacheMapa: Mapa | null = null;

async function obterMapa(): Promise<Mapa> {
  if (cacheMapa) return cacheMapa;

  const [cols] = await db2.query(`SHOW COLUMNS FROM \`${TABELA}\``);
  const nomes = (cols as any[]).map((c) => String(c.Field));

  const achar = (lista: readonly string[]) =>
    lista.find((c) => nomes.includes(c)) ?? null;

  const mapa = {
    id: achar(CANDIDATOS.id),
    codigo: achar(CANDIDATOS.codigo),
    cliente: achar(CANDIDATOS.cliente),
    atendente: achar(CANDIDATOS.atendente),
    status: achar(CANDIDATOS.status),
    valor: achar(CANDIDATOS.valor),
    data: achar(CANDIDATOS.data),
  };

  const faltando = (["id", "atendente", "status", "data"] as const).filter(
    (k) => !mapa[k]
  );

  if (faltando.length) {
    throw new Error(
      `Não achei as colunas [${faltando.join(", ")}] na tabela ${TABELA}. ` +
        `Colunas existentes: ${nomes.join(", ")}`
    );
  }

  cacheMapa = { ...mapa, codigo: mapa.codigo ?? mapa.id } as Mapa;
  return cacheMapa;
}


const TIPOS_BENEFICIO_COLABORADOR = [
  "colaborador",
  "atendente",
  "funcionario",
  "funcionário",
  "todos",
];

let avisouTipos = false;

async function buscarBeneficios() {
  try {
    const [rows] = await db.query(
      "SELECT nome, descricao, valor, tipo_usuario FROM `beneficio_ativo` WHERE ativo = 1"
    );

    const lista = (rows as any[]).filter((r) =>
      TIPOS_BENEFICIO_COLABORADOR.includes(
        String(r.tipo_usuario ?? "").trim().toLowerCase()
      )
    );

    if (!lista.length && !avisouTipos) {
      avisouTipos = true;
      const tipos = [...new Set((rows as any[]).map((r) => r.tipo_usuario))];
    }

    return lista
      .map((r) => ({
        nome: String(r.nome ?? "Benefício"),
        descricao: r.descricao ? String(r.descricao) : "",
        valor: Number(r.valor ?? 0),
      }))
      .filter((b) => b.valor > 0);
  } catch (e) {
    console.warn("[relatorio] não foi possível ler beneficio_ativo:", e);
    return [] as { nome: string; valor: number }[];
  }
}

async function getUserId(): Promise<string | null> {
  const token = (await cookies()).get("access_token")?.value;
  if (!token) return null;

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET as string) as {
      id?: string | number;
      sub?: string;
      userId?: string | number;
    };
    const id = payload.id ?? payload.userId ?? payload.sub;
    return id ? String(id) : null;
  } catch {
    return null;
  }
}

function normalizarStatus(status: string) {
  const s = String(status ?? "").toLowerCase();
  if (["encerrado", "resolvido", "concluido", "concluído", "finalizado"].includes(s))
    return "resolvido";
  if (s === "cancelado") return "cancelado";
  return "pendente";
}

export async function GET(request: Request) {
  const userId = await getUserId();
  if (!userId) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const competencia =
    searchParams.get("competencia") || new Date().toISOString().slice(0, 7);

  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(competencia)) {
    return NextResponse.json({ error: "Competência inválida." }, { status: 400 });
  }

  const [ano, mes] = competencia.split("-").map(Number);
  const inicio = `${competencia}-01`;
  const proximo =
    mes === 12
      ? `${ano + 1}-01-01`
      : `${ano}-${String(mes + 1).padStart(2, "0")}-01`;

  try {
    const [usuarios] = await db.query(
      "SELECT full_name, matricula FROM users WHERE id = ? LIMIT 1",
      [userId]
    );
    const usuario = (usuarios as any[])[0];
    const colaborador = usuario?.full_name ?? "Meu perfil";
    const matricula = usuario?.matricula ? String(usuario.matricula) : null;

    if (!matricula) {
      return NextResponse.json(
        { error: "Seu usuário não tem matrícula cadastrada." },
        { status: 400 }
      );
    }

    const seguro = async (sql: string, params: any[]) => {
      try {
        const [rows] = await db.query(sql, params);
        return rows as any[];
      } catch (e) {
        console.warn("[relatorio] consulta de remuneração falhou:", e);
        return [];
      }
    };

    const [cfg] = await seguro(
      `SELECT salario_base, comissao_por_atendimento
         FROM colaborador_remuneracao WHERE user_id = ? LIMIT 1`,
      [userId]
    );


    const comissaoUnit =
      Number(cfg?.comissao_por_atendimento ?? 0) || COMISSAO_PADRAO;

    const M = await obterMapa();
    const q = (c: string) => `\`${c}\``;

    const [linhas] = await db2.query(
      `SELECT ${q(M.id)} AS id,
              ${q(M.codigo)} AS protocolo,
              ${M.cliente ? q(M.cliente) : "NULL"} AS cliente,
              ${q(M.status)} AS status,
              ${M.valor ? q(M.valor) : "0"} AS valor,
              ${q(M.data)} AS data
         FROM ${q(TABELA)}
        WHERE ${q(M.atendente)} = ? AND ${q(M.data)} >= ? AND ${q(M.data)} < ?
        ORDER BY ${q(M.data)} DESC`,
      [matricula, inicio, proximo]
    );

    const atendimentos = (linhas as any[]).map((r) => {
      const status = normalizarStatus(r.status);
      const valorProtocolo = Number(r.valor ?? 0);
      return {
        id: String(r.id),
        protocolo: String(r.protocolo ?? r.id),
        cliente: r.cliente != null ? String(r.cliente) : "—",
        data: new Date(r.data).toISOString(),
        status,
        // só atendimento concluído gera comissão
        valor:
          status === "resolvido"
            ? valorProtocolo > 0
              ? valorProtocolo
              : comissaoUnit
            : 0,
      };
    });

    const concluidos = atendimentos.filter((a) => a.status === "resolvido");
    const cancelados = atendimentos.filter((a) => a.status === "cancelado").length;
    const pendentes = atendimentos.length - concluidos.length - cancelados;

    
    const [folhaRows] = await db.query(
      `SELECT salario_base, comissoes, bonificacoes, descontos, total_liquido
         FROM folhas_pagamento WHERE user_id = ? AND competencia = ? LIMIT 1`,
      [userId, competencia]
    );
    const folha = (folhaRows as any[])[0];

    let salarioBase = 0;
    let comissoes = 0;
    let bonificacoes = 0;
    let descontos = 0;
    let totalReceber = 0;
    let beneficios: { nome: string; valor: number }[] = [];

    if (folha) {
      salarioBase = Number(folha.salario_base);
      comissoes = Number(folha.comissoes);
      bonificacoes = Number(folha.bonificacoes);
      descontos = Number(folha.descontos);
      totalReceber = Number(folha.total_liquido);
    } else {
        
      let salarioCadastrado = Number(cfg?.salario_base ?? 0);
      if (!cfg) {
        const [ultima] = await seguro(
          `SELECT salario_base FROM folhas_pagamento
            WHERE user_id = ? AND competencia <= ?
            ORDER BY competencia DESC LIMIT 1`,
          [userId, competencia]
        );
        salarioCadastrado = Number(ultima?.salario_base ?? 0);
      }
      salarioBase = salarioCadastrado;

      comissoes = concluidos.reduce((acc, a) => acc + a.valor, 0);

      const lancamentos = await seguro(
        `SELECT tipo, SUM(valor) AS total
           FROM folha_lancamentos
          WHERE user_id = ? AND competencia = ?
          GROUP BY tipo`,
        [userId, competencia]
      );
      for (const l of lancamentos) {
        if (l.tipo === "bonificacao") bonificacoes = Number(l.total);
        if (l.tipo === "desconto") descontos = Number(l.total);
      }

      beneficios = await buscarBeneficios();
      descontos += beneficios.reduce((acc, b) => acc + b.valor, 0);

      totalReceber = salarioBase + comissoes + bonificacoes - descontos;
    }

    return NextResponse.json({
      colaborador,
      salarioBase,
      comissoes,
      bonificacoes,
      descontos,
      totalAtendimentos: atendimentos.length,
      concluidos: concluidos.length,
      pendentes,
      cancelados,
      totalReceber,
      beneficios,
      atendimentos,
    });
  } catch (error) {
    console.error("Erro no relatório do colaborador:", error);
    return NextResponse.json(
      { error: "Não foi possível carregar o relatório." },
      { status: 500 }
    );
  }
}