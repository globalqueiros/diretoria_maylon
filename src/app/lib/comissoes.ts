import type { RowDataPacket } from "mysql2";
import { db } from "./db";
import { ADICIONAIS } from "./maylon-pass";

export type StatusComissao = "pendente" | "aprovada" | "paga" | "cancelada";

export type ComissaoRegra = {
  id: number;
  chave: string;
  nome: string;
  percentual: number;
};

type RegistrarParams = {
  produtoChave: string;
  beneficiarioId: number;
  beneficiarioNome: string;
  gerenteId?: number | null;
  valorBase: number;
  origemTabela: string;
  origemId: string | number;
  referencia?: string | null;
  status?: StatusComissao;
  observacao?: string | null;
};

function numero(valor: unknown) {
  const n = Number(valor ?? 0);
  return Number.isFinite(n) ? n : 0;
}

function arredondar(valor: number) {
  return Math.round(valor * 100) / 100;
}

function referenciaDe(valor?: Date | string | null) {
  const data = valor ? new Date(valor) : new Date();
  if (Number.isNaN(data.getTime())) return new Date().toISOString().slice(0, 7);
  return data.toISOString().slice(0, 7);
}

function lerJson(valor: unknown, padrao: unknown) {
  if (valor == null) return padrao;
  if (typeof valor !== "string") return valor;
  try {
    return JSON.parse(valor);
  } catch {
    return padrao;
  }
}

export async function buscarRegra(produtoChave: string): Promise<ComissaoRegra | null> {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, chave, nome, percentual
       FROM comissoes_comerciais_regras
      WHERE chave = ?
        AND ativo = 1
        AND (vigencia_inicio IS NULL OR vigencia_inicio <= CURDATE())
        AND (vigencia_fim IS NULL OR vigencia_fim >= CURDATE())
      LIMIT 1`,
    [produtoChave]
  );

  if (!rows.length) return null;

  return {
    id: Number(rows[0].id),
    chave: String(rows[0].chave),
    nome: String(rows[0].nome),
    percentual: numero(rows[0].percentual),
  };
}

export async function registrarComissao(params: RegistrarParams) {
  const regra = await buscarRegra(params.produtoChave);

  if (!regra) return null;

  const valorBase = numero(params.valorBase);
  const valorComissao = arredondar((valorBase * regra.percentual) / 100);
  const status = params.status ?? "pendente";
  const origemId = String(params.origemId);

  const [existentes] = await db.query<RowDataPacket[]>(
    `SELECT id, status
       FROM comissoes_comerciais_lancamentos
      WHERE origem_tabela = ? AND origem_id = ? AND regra_id = ?
      LIMIT 1`,
    [params.origemTabela, origemId, regra.id]
  );

  if (existentes.length) {
    const atual = existentes[0];

    if (atual.status === "paga") return null;

    const novoStatus =
      atual.status === "aprovada" && status === "pendente" ? "aprovada" : status;

    await db.execute(
      `UPDATE comissoes_comerciais_lancamentos
          SET produto_chave = ?, produto_nome = ?, beneficiario_id = ?,
              beneficiario_nome = ?, gerente_id = ?, valor_base = ?,
              percentual = ?, valor_comissao = ?, status = ?,
              referencia = ?, observacao = ?,
              aprovado_em = CASE WHEN ? = 'aprovada' THEN COALESCE(aprovado_em, NOW()) ELSE aprovado_em END,
              cancelado_em = CASE WHEN ? = 'cancelada' THEN NOW() ELSE cancelado_em END
        WHERE id = ?`,
      [
        regra.chave,
        regra.nome,
        params.beneficiarioId,
        params.beneficiarioNome,
        params.gerenteId ?? null,
        valorBase,
        regra.percentual,
        valorComissao,
        novoStatus,
        params.referencia ?? null,
        params.observacao ?? null,
        novoStatus,
        novoStatus,
        atual.id,
      ]
    );

    return { id: Number(atual.id), valor: valorComissao };
  }

  const [result] = await db.execute(
    `INSERT INTO comissoes_comerciais_lancamentos
      (regra_id, produto_chave, produto_nome, beneficiario_id, beneficiario_nome,
       gerente_id, valor_base, percentual, valor_comissao, status,
       origem_tabela, origem_id, referencia, observacao, aprovado_em, cancelado_em)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
       CASE WHEN ? = 'aprovada' THEN NOW() ELSE NULL END,
       CASE WHEN ? = 'cancelada' THEN NOW() ELSE NULL END)`,
    [
      regra.id,
      regra.chave,
      regra.nome,
      params.beneficiarioId,
      params.beneficiarioNome,
      params.gerenteId ?? null,
      valorBase,
      regra.percentual,
      valorComissao,
      status,
      params.origemTabela,
      origemId,
      params.referencia ?? null,
      params.observacao ?? null,
      status,
      status,
    ]
  );

  return { id: Number((result as { insertId: number }).insertId), valor: valorComissao };
}

export async function atualizarStatusComissaoPorOrigem(
  origemTabela: string,
  origemId: string | number,
  status: StatusComissao
) {
  if (status === "cancelada") {
    await db.execute(
      `UPDATE comissoes_comerciais_lancamentos
          SET status = 'cancelada', cancelado_em = NOW()
        WHERE origem_tabela = ? AND origem_id = ? AND status <> 'paga'`,
      [origemTabela, String(origemId)]
    );
    return;
  }

  if (status === "aprovada") {
    await db.execute(
      `UPDATE comissoes_comerciais_lancamentos
          SET status = 'aprovada', aprovado_em = COALESCE(aprovado_em, NOW())
        WHERE origem_tabela = ? AND origem_id = ? AND status = 'pendente'`,
      [origemTabela, String(origemId)]
    );
  }
}

export async function sincronizarComissaoDaVenda(
  vendaId: string | number,
  statusVenda: string
) {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT v.id, v.produto_chave, v.total, v.status, v.promotor_id, v.criado_em,
            u.full_name AS promotor_nome, u.gerente_id
       FROM vendas v
       LEFT JOIN users u ON u.id = v.promotor_id
      WHERE v.id = ?
      LIMIT 1`,
    [vendaId]
  );

  if (!rows.length) return null;

  const venda = rows[0];
  const produtoChave = String(venda.produto_chave ?? "").trim();

  if (!["planos_assinaturas", "parcerias", "seguros_beneficios"].includes(produtoChave)) {
    return null;
  }

  if (statusVenda === "cancelada") {
    await atualizarStatusComissaoPorOrigem("vendas", vendaId, "cancelada");
    return null;
  }

  const status: StatusComissao = statusVenda === "paga" ? "aprovada" : "pendente";

  return registrarComissao({
    produtoChave,
    beneficiarioId: Number(venda.promotor_id),
    beneficiarioNome: String(venda.promotor_nome ?? "Comercial"),
    gerenteId: venda.gerente_id ? Number(venda.gerente_id) : null,
    valorBase: numero(venda.total),
    origemTabela: "vendas",
    origemId: String(vendaId),
    referencia: referenciaDe(venda.criado_em),
    status,
  });
}

export async function sincronizarComissaoDaCampanha(
  cotacaoId: string | number,
  statusUi: string,
  beneficiario: { id: number; nome: string; gerenteId?: number | null }
) {
  if (statusUi === "perdida") {
    await atualizarStatusComissaoPorOrigem("solicitacoes_especialista", cotacaoId, "cancelada");
    return null;
  }

  if (statusUi !== "fechada") return null;

  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT id, nome_empresa, orcamento, created_at
       FROM solicitacoes_especialista
      WHERE id = ?
      LIMIT 1`,
    [cotacaoId]
  );

  if (!rows.length) return null;

  const cotacao = rows[0];
  const texto = String(cotacao.orcamento ?? "").replace(/[^\d,.-]/g, "").replace(",", ".");
  const valor = Number(texto);
  let gerenteId = beneficiario.gerenteId ?? null;

  if (!gerenteId) {
    const [usuarios] = await db.query<RowDataPacket[]>(
      `SELECT gerente_id FROM users WHERE id = ? LIMIT 1`,
      [beneficiario.id]
    );
    gerenteId = usuarios[0]?.gerente_id ? Number(usuarios[0].gerente_id) : null;
  }

  return registrarComissao({
    produtoChave: "publicidade",
    beneficiarioId: beneficiario.id,
    beneficiarioNome: beneficiario.nome,
    gerenteId,
    valorBase: Number.isFinite(valor) ? valor : 0,
    origemTabela: "solicitacoes_especialista",
    origemId: String(cotacaoId),
    referencia: referenciaDe(cotacao.created_at),
    status: "aprovada",
    observacao: `Publicidade - ${cotacao.nome_empresa ?? "campanha"}`,
  });
}

export async function registrarComissoesDoMaylonPass(solicitacaoId: string | number) {
  const [rows] = await db.query<RowDataPacket[]>(
    `SELECT s.id, s.plano, s.adicionais, s.valor, s.solicitante_id, s.usuario_id,
            s.status, s.decidido_em,
            COALESCE(sol.full_name, u.full_name) AS beneficiario_nome,
            COALESCE(sol.gerente_id, u.gerente_id) AS gerente_id,
            COALESCE(sol.user_type, u.user_type) AS beneficiario_tipo
       FROM maylon_pass_solicitacoes s
       LEFT JOIN users sol ON sol.id = s.solicitante_id
       LEFT JOIN users u ON u.id = s.usuario_id
      WHERE s.id = ?
      LIMIT 1`,
    [solicitacaoId]
  );

  if (!rows.length) return null;

  const solicitacao = rows[0];

  if (solicitacao.status !== "aprovado") return null;

  const tipoBeneficiario = String(solicitacao.beneficiario_tipo ?? "").toLowerCase();

  if (!["comercial", "atendente", "gerente"].includes(tipoBeneficiario)) {
    return null;
  }

  const beneficiarioId = Number(solicitacao.solicitante_id ?? solicitacao.usuario_id);

  if (!Number.isSafeInteger(beneficiarioId) || beneficiarioId <= 0) return null;

  const adicionais = lerJson(solicitacao.adicionais, []);
  const lista = Array.isArray(adicionais) ? adicionais.map(String) : [];
  const valorAdicionais = lista.reduce(
    (soma, chave) => soma + numero(ADICIONAIS[chave]),
    0
  );
  const valorTotal = numero(solicitacao.valor);
  const valorPlano = Math.max(0, valorTotal - valorAdicionais);
  const referencia = referenciaDe(solicitacao.decidido_em);
  const beneficiarioNome = String(solicitacao.beneficiario_nome ?? "Comercial");
  const gerenteId = solicitacao.gerente_id ? Number(solicitacao.gerente_id) : null;

  await registrarComissao({
    produtoChave: "maylon_pass",
    beneficiarioId,
    beneficiarioNome,
    gerenteId,
    valorBase: valorPlano,
    origemTabela: "maylon_pass_solicitacoes",
    origemId: String(solicitacaoId),
    referencia,
    status: "aprovada",
    observacao: `Maylon Pass - plano ${solicitacao.plano}`,
  });

  if (valorAdicionais > 0) {
    await registrarComissao({
      produtoChave: "servicos_adicionais",
      beneficiarioId,
      beneficiarioNome,
      gerenteId,
      valorBase: valorAdicionais,
      origemTabela: "maylon_pass_solicitacoes",
      origemId: String(solicitacaoId),
      referencia,
      status: "aprovada",
      observacao: `Adicionais: ${lista.join(", ")}`,
    });
  }

  return { valorPlano, valorAdicionais };
}
