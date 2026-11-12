import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import mysql from "mysql2/promise";

const env = {};

for (const line of fs.readFileSync(path.resolve(".env"), "utf8").split("\n")) {
  const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (match) env[match[1]] = match[2].replace(/^["']|["']$/g, "");
}

const modo = process.argv.includes("--clean") ? "clean" : "apply";

const maylon = await mysql.createConnection({
  host: env.DB_HOST,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,
});

const smart = await mysql.createConnection({
  host: env.DB2_HOST,
  user: env.DB2_USER,
  password: env.DB2_PASSWORD,
  database: env.DB2_NAME,
});

async function q(conn, sql, params = []) {
  const [rows] = await conn.query(sql, params);
  return rows;
}

async function exec(conn, sql, params = []) {
  const [result] = await conn.execute(sql, params);
  return result;
}

async function clean() {
  console.log("Removendo dados de teste...");

  const clientes = await q(
    maylon,
    "SELECT id FROM clientes WHERE numero LIKE 'TESTE-%' OR nome LIKE '[TESTE]%'"
  );
  const clienteIds = clientes.map((c) => Number(c.id));

  if (clienteIds.length) {
    const vendasTeste = await q(
      maylon,
      `SELECT id FROM vendas WHERE cliente_id IN (${clienteIds.map(() => "?").join(",")})`,
      clienteIds
    );
    const vendaIds = vendasTeste.map((v) => String(v.id));

    if (vendaIds.length) {
      await q(
        maylon,
        `DELETE FROM comissoes_comerciais_lancamentos
          WHERE origem_tabela = 'vendas'
            AND origem_id IN (${vendaIds.map(() => "?").join(",")})`,
        vendaIds
      );
    }

    await q(maylon, `DELETE FROM vendas WHERE cliente_id IN (${clienteIds.map(() => "?").join(",")})`, clienteIds);
    await q(maylon, `DELETE FROM clientes WHERE id IN (${clienteIds.map(() => "?").join(",")})`, clienteIds);
  }

  const cotacoesTeste = await q(
    maylon,
    "SELECT id FROM solicitacoes_especialista WHERE nome_empresa LIKE '[TESTE]%'"
  );
  const cotacaoIds = cotacoesTeste.map((c) => String(c.id));

  if (cotacaoIds.length) {
    await q(
      maylon,
      `DELETE FROM comissoes_comerciais_lancamentos
        WHERE origem_tabela = 'solicitacoes_especialista'
          AND origem_id IN (${cotacaoIds.map(() => "?").join(",")})`,
      cotacaoIds
    );
  }

  const maylonTeste = await q(
    maylon,
    "SELECT id FROM maylon_pass_solicitacoes WHERE observacao LIKE '[TESTE]%'"
  );
  const maylonIds = maylonTeste.map((m) => String(m.id));

  if (maylonIds.length) {
    await q(
      maylon,
      `DELETE FROM comissoes_comerciais_lancamentos
        WHERE origem_tabela = 'maylon_pass_solicitacoes'
          AND origem_id IN (${maylonIds.map(() => "?").join(",")})`,
      maylonIds
    );
  }

  await q(maylon, "DELETE FROM comissoes_comerciais_lancamentos WHERE observacao LIKE '%[TESTE]%'");
  await q(maylon, "DELETE FROM metas WHERE titulo LIKE '[TESTE]%'");
  await q(maylon, "DELETE FROM solicitacoes_especialista WHERE nome_empresa LIKE '[TESTE]%'");
  await q(maylon, "DELETE FROM chamados WHERE protocolo LIKE 'TESTE-%' OR titulo LIKE '[TESTE]%'");
  await q(maylon, "DELETE FROM maylon_pass_solicitacoes WHERE observacao LIKE '[TESTE]%'");

  const colaboradores = await q(
    maylon,
    "SELECT id FROM users WHERE email LIKE '%@maylon.test' AND matricula LIKE 'TESTE-%'"
  );
  const colaboradorIds = colaboradores.map((c) => Number(c.id));

  if (colaboradorIds.length) {
    await q(maylon, `DELETE FROM folhas_pagamento WHERE user_id IN (${colaboradorIds.map(() => "?").join(",")})`, colaboradorIds);
    await q(maylon, `DELETE FROM users WHERE id IN (${colaboradorIds.map(() => "?").join(",")})`, colaboradorIds);
  }

  await q(maylon, "UPDATE metas_cidade SET realizado = 0 WHERE ano = YEAR(CURDATE()) AND mes = MONTH(CURDATE())");

  const trips = await q(smart, "SELECT id FROM trip_requests WHERE ref_id LIKE 'TESTE-%'");
  const tripIds = trips.map((t) => String(t.id));

  if (tripIds.length) {
    await q(smart, `DELETE FROM trip_request_coordinates WHERE trip_request_id IN (${tripIds.map(() => "?").join(",")})`, tripIds);
    await q(smart, `DELETE FROM chamados_reembolso WHERE corrida_id IN (${tripIds.map(() => "?").join(",")})`, tripIds);
    await q(smart, `DELETE FROM trip_requests WHERE id IN (${tripIds.map(() => "?").join(",")})`, tripIds);
  }

  await q(smart, "DELETE FROM comissoes WHERE beneficiario LIKE '[TESTE]%'");
  await q(smart, "DELETE FROM chamados_reembolso WHERE protocolo LIKE 'TESTE-%'");
  await q(smart, "DELETE FROM comunicados WHERE titulo LIKE '[TESTE]%'");

  console.log("Dados de teste removidos.");
}

async function seed() {
  await clean();

  console.log("Garantindo regras de comissão...");
  const regrasPadrao = [
    ["maylon_pass", "Maylon Pass", 10],
    ["planos_assinaturas", "Planos e assinaturas", 10],
    ["parcerias", "Parcerias comerciais", 5],
    ["publicidade", "Publicidade e anúncios", 10],
    ["seguros_beneficios", "Seguros e benefícios", 10],
    ["servicos_adicionais", "Serviços adicionais", 5],
  ];

  for (const [chave, nome, percentual] of regrasPadrao) {
    await q(
      maylon,
      `INSERT IGNORE INTO comissoes_comerciais_regras (chave, nome, percentual, ativo)
       VALUES (?, ?, ?, 1)`,
      [chave, nome, percentual]
    );
  }

  await q(
    maylon,
    "UPDATE users SET gerente_id = 4 WHERE id IN (1, 5) AND gerente_id IS NULL"
  );

  console.log("Inserindo clientes de teste...");
  const clientes = [
    ["TESTE-001", "[TESTE] Comércio Santos", "(13) 99999-0001", "comercio.santos@maylon.test", "Santos - SP", 2],
    ["TESTE-002", "[TESTE] Transportes São Vicente", "(13) 99999-0002", "transportes.sv@maylon.test", "São Vicente - SP", 5],
    ["TESTE-003", "[TESTE] Serviços Praia Grande", "(13) 99999-0003", "servicos.pg@maylon.test", "Praia Grande - SP", 1],
    ["TESTE-004", "[TESTE] Logística Litoral", "(13) 99999-0004", "logistica.litoral@maylon.test", "Santos - SP", 0],
  ];

  const clienteIds = [];

  for (const [numero, nome, telefone, email, cidade, dias] of clientes) {
    const result = await exec(
      maylon,
      `INSERT INTO clientes (numero, nome, telefone, email, cidade, status, criado_em)
       VALUES (?, ?, ?, ?, ?, 0, DATE_SUB(NOW(), INTERVAL ? DAY))`,
      [numero, nome, telefone, email, cidade, dias]
    );
    clienteIds.push(Number(result.insertId));
  }

  console.log("Inserindo vendas de teste...");
  const vendas = [
    [clienteIds[0], 1, 18000, "pix", "paga", 3, "planos_assinaturas"],
    [clienteIds[0], 5, 9500, "cartao", "paga", 75, "parcerias"],
    [clienteIds[1], 5, 12000, "boleto", "paga", 5, "seguros_beneficios"],
    [clienteIds[1], 1, 4200, "pix", "registrada", 1, "planos_assinaturas"],
    [clienteIds[2], 1, 6700, "pix", "paga", 40, "parcerias"],
    [clienteIds[2], 5, 2300, "cartao", "pendente", 0, "seguros_beneficios"],
    [clienteIds[3], 5, 15000, "boleto", "paga", 120, "planos_assinaturas"],
    [clienteIds[3], 1, 1200, "pix", "cancelada", 0, "parcerias"],
  ];

  const maxVenda = await q(maylon, "SELECT COALESCE(MAX(id), 0) AS maxId FROM vendas");
  let vendaId = Number(maxVenda[0]?.maxId ?? 0) + 1;
  const vendasCriadas = [];
  const usuariosComerciais = await q(
    maylon,
    "SELECT id, full_name FROM users WHERE id IN (1, 5)"
  );
  const nomesUsuarios = new Map(
    usuariosComerciais.map((u) => [Number(u.id), String(u.full_name ?? "Comercial")])
  );
  const regras = await q(
    maylon,
    "SELECT id, chave, nome, percentual FROM comissoes_comerciais_regras WHERE ativo = 1"
  );
  const regrasPorChave = new Map(
    regras.map((r) => [
      String(r.chave),
      { id: Number(r.id), nome: String(r.nome), percentual: Number(r.percentual) },
    ])
  );

  for (const [clienteId, promotorId, total, forma, status, dias, produto] of vendas) {
    const id = vendaId++;
    const data = new Date();
    data.setDate(data.getDate() - dias);
    const referencia = data.toISOString().slice(0, 7);

    await exec(
      maylon,
      `INSERT INTO vendas (id, promotor_id, cliente_id, total, forma_pagamento, produto_chave, status, criado_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? DAY))`,
      [id, promotorId, clienteId, total, forma, produto, status, dias]
    );
    vendasCriadas.push({ id, promotorId, total, status, referencia, produto });
  }

  console.log("Inserindo comissões comerciais de teste...");
  for (const venda of vendasCriadas) {
    const regra = regrasPorChave.get(venda.produto);
    if (!regra) continue;

    const status =
      venda.status === "paga"
        ? "aprovada"
        : venda.status === "cancelada"
          ? "cancelada"
          : "pendente";
    const valorComissao = Math.round(((venda.total * regra.percentual) / 100) * 100) / 100;

    await exec(
      maylon,
      `INSERT INTO comissoes_comerciais_lancamentos
        (regra_id, produto_chave, produto_nome, beneficiario_id, beneficiario_nome,
         gerente_id, valor_base, percentual, valor_comissao, status,
         origem_tabela, origem_id, referencia, observacao, aprovado_em, cancelado_em)
       VALUES (?, ?, ?, ?, ?, 4, ?, ?, ?, ?, 'vendas', ?, ?, '[TESTE] Venda do seed',
         CASE WHEN ? = 'aprovada' THEN NOW() ELSE NULL END,
         CASE WHEN ? = 'cancelada' THEN NOW() ELSE NULL END)`,
      [
        regra.id,
        venda.produto,
        regra.nome,
        venda.promotorId,
        nomesUsuarios.get(venda.promotorId) ?? "Comercial",
        venda.total,
        regra.percentual,
        valorComissao,
        status,
        String(venda.id),
        venda.referencia,
        status,
        status,
      ]
    );
  }

  console.log("Inserindo metas de teste...");
  const inicio = new Date();
  inicio.setDate(1);
  const fim = new Date(inicio.getFullYear(), inicio.getMonth() + 1, 0);

  await exec(
    maylon,
    `INSERT INTO metas (titulo, descricao, tipo, valor_meta, valor_atual, inicio, fim, responsavel, status)
     VALUES (?, ?, 'vendas', 50000, 61200, ?, ?, 'Comercial Teste', 'ativa')`,
    ["[TESTE] Meta de vendas do mês", "Meta criada para demonstração do painel comercial.", inicio, fim]
  );

  await q(
    maylon,
    `UPDATE metas_cidade SET realizado = 180 WHERE cidade = 'Santos' AND ano = YEAR(CURDATE()) AND mes = MONTH(CURDATE())`
  );
  await q(
    maylon,
    `UPDATE metas_cidade SET realizado = 100 WHERE cidade = 'São Vicente' AND ano = YEAR(CURDATE()) AND mes = MONTH(CURDATE())`
  );
  await q(
    maylon,
    `UPDATE metas_cidade SET realizado = 120 WHERE cidade = 'Praia Grande' AND ano = YEAR(CURDATE()) AND mes = MONTH(CURDATE())`
  );

  console.log("Inserindo cotações de campanha...");
  const cotacoes = [
    ["[TESTE] Loja Alpha", "00.000.000/0001-01", "Ana Teste", "Marketing", "ana.alpha@maylon.test", "(13) 98888-0001", "Santos", "SP", "Instagram", 10, "2500", "[TESTE] Campanha de lançamento", "pendente"],
    ["[TESTE] Beta Veículos", "00.000.000/0001-02", "Bruno Teste", "Diretor", "bruno.beta@maylon.test", "(13) 98888-0002", "São Vicente", "SP", "Google Ads", 8, "4200", "[TESTE] Campanha de fim de ano", "em_contato"],
    ["[TESTE] Gama Entregas", "00.000.000/0001-03", "Carla Teste", "Operações", "carla.gama@maylon.test", "(13) 98888-0003", "Praia Grande", "SP", "TikTok", 15, "3600", "[TESTE] Divulgação de frota", "convertido"],
    ["[TESTE] Delta Serviços", "00.000.000/0001-04", "Diego Teste", "Comercial", "diego.delta@maylon.test", "(13) 98888-0004", "Santos", "SP", "WhatsApp", 5, "1800", "[TESTE] Campanha de indicação", "cancelado"],
  ];

  for (const c of cotacoes) {
    await exec(
      maylon,
      `INSERT INTO solicitacoes_especialista
        (nome_empresa, cnpj, nome_responsavel, cargo, email, telefone, cidade, estado,
         tipo_anuncio, quantidade_veiculos, orcamento, mensagem, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL 3 DAY), NOW())`,
      c
    );
  }

  const regraPublicidade = regrasPorChave.get("publicidade");
  const cotacaoConvertida = await q(
    maylon,
    "SELECT id, orcamento FROM solicitacoes_especialista WHERE nome_empresa = '[TESTE] Delta Serviços' LIMIT 1"
  );

  if (regraPublicidade && cotacaoConvertida.length) {
    const valorBase = Number(String(cotacaoConvertida[0].orcamento ?? "0").replace(/[^\d,.-]/g, "")) || 1800;
    const valorComissao =
      Math.round(((valorBase * regraPublicidade.percentual) / 100) * 100) / 100;

    await exec(
      maylon,
      `INSERT INTO comissoes_comerciais_lancamentos
        (regra_id, produto_chave, produto_nome, beneficiario_id, beneficiario_nome,
         gerente_id, valor_base, percentual, valor_comissao, status,
         origem_tabela, origem_id, referencia, observacao, aprovado_em)
       VALUES (?, 'publicidade', 'Publicidade e anúncios', 5, 'Comercial Teste', 4, ?, ?, ?, 'aprovada',
         'solicitacoes_especialista', ?, ?, '[TESTE] Publicidade do seed', NOW())`,
      [
        regraPublicidade.id,
        valorBase,
        regraPublicidade.percentual,
        valorComissao,
        String(cotacaoConvertida[0].id),
        new Date().toISOString().slice(0, 7),
      ]
    );
  }

  console.log("Inserindo chamados de teste...");
  const chamados = [
    ["TESTE-CH-001", "[TESTE] Atraso na entrega", "Cliente relata atraso na entrega de teste.", "entrega", "alta", "aberto", 1, 1, null, 1, null],
    ["TESTE-CH-002", "[TESTE] Cobrança duplicada", "Passageiro identificou cobrança duplicada na corrida de teste.", "pagamento", "urgente", "em_andamento", 5, 1, null, 2, null],
    ["TESTE-CH-003", "[TESTE] Dúvida sobre plano", "Cliente quer entender os adicionais do Maylon Pass.", "beneficio", "media", "aguardando", 1, null, null, 4, null],
    ["TESTE-CH-004", "[TESTE] Cadastro atualizado", "Solicitação de atualização cadastral concluída.", "cadastro", "baixa", "resolvido", 5, 1, null, 6, 1],
  ];

  for (const [protocolo, titulo, descricao, categoria, prioridade, status, usuarioId, atendenteId, motoristaId, horas, resolvido] of chamados) {
    await exec(
      maylon,
      `INSERT INTO chamados
        (protocolo, titulo, descricao, categoria, prioridade, status, usuario_id, motorista_id, atendente_id, criado_em, atualizado_em, resolvido_em)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, DATE_SUB(NOW(), INTERVAL ? HOUR), NOW(), ?)`,
      [protocolo, titulo, descricao, categoria, prioridade, status, usuarioId, motoristaId, atendenteId, horas, resolvido ? new Date() : null]
    );
  }

  console.log("Inserindo comunicados de teste...");
  const comunicados = [
    ["[TESTE] Novo horário de atendimento", "Geral", "Todos", "O atendimento passa a funcionar das 7h às 20h.", "Publicado", -2],
    ["[TESTE] Atualização no Maylon Pass", "Atualização", "Equipe interna", "Novos benefícios foram adicionados ao plano Plus.", "Publicado", -1],
    ["[TESTE] Manutenção programada", "Manutenção", "Motoristas", "O aplicativo ficará indisponível das 2h às 4h.", "Agendado", 1],
    ["[TESTE] Rascunho de campanha", "Geral", "Todos", "Rascunho de comunicado para validação interna.", "Rascunho", 0],
  ];

  for (const [titulo, categoria, publico, mensagem, status, dias] of comunicados) {
    await exec(
      smart,
      `INSERT INTO comunicados (titulo, categoria, publico, mensagem, status, criado_em, atualizado_em)
       VALUES (?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), NOW())`,
      [titulo, categoria, publico, mensagem, status, dias]
    );
  }

  console.log("Inserindo comissões de teste...");
  const comissoes = [
    ["[TESTE] Ana Paula", "motorista", null, 4, "2026-11", 1000, 1200, 120, "pendente"],
    ["[TESTE] Marcelo Souza", "motorista", null, 4, "2026-11", 1000, 900, 90, "pendente"],
    ["[TESTE] Humberto Santos", "motorista", null, 4, "2026-11", 1000, 1350, 135, "pago"],
  ];

  for (const [beneficiario, perfil, userId, gerenteId, referencia, meta, atingido, valor, status] of comissoes) {
    await exec(
      smart,
      `INSERT INTO comissoes (gerente_id, user_id, beneficiario, perfil, referencia, meta, atingido, valor, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [gerenteId, userId, beneficiario, perfil, referencia, meta, atingido, valor, status]
    );
  }

  console.log("Inserindo entregas de teste...");
  const motoristas = await q(
    smart,
    "SELECT id, full_name FROM users WHERE user_type = 'driver' AND gerente = 4 ORDER BY full_name LIMIT 3"
  );
  const clientesDb2 = await q(
    smart,
    "SELECT id FROM users WHERE user_type = 'customer' ORDER BY id LIMIT 2"
  );

  const entregas = [
    ["TESTE-9001", motoristas[0]?.id, clientesDb2[0]?.id, "pending", 45, 5, "unpaid", 1, "Rua das Palmeiras, 120 - Santos", "Av. Ana Costa, 300 - Santos"],
    ["TESTE-9002", motoristas[1]?.id, clientesDb2[1]?.id, "ongoing", 60, 8, "unpaid", 2, "Rua XV de Novembro, 45 - São Vicente", "Praça da Independência, 10 - Santos"],
    ["TESTE-9003", motoristas[2]?.id, clientesDb2[0]?.id, "completed", 80, 12, "paid", 3, "Av. Presidente Kennedy, 900 - Praia Grande", "Rua do Comércio, 77 - Santos"],
  ];

  const entregaIds = [];

  for (const [refId, driverId, customerId, status, valor, distancia, pagamento, dias, origem, destino] of entregas) {
    const id = randomUUID();

    await exec(
      smart,
      `INSERT INTO trip_requests
        (id, ref_id, customer_id, driver_id, estimated_fare, actual_fare, estimated_distance,
         paid_fare, payment_method, payment_status, type, current_status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pix', ?, 'parcel', ?, DATE_SUB(NOW(), INTERVAL ? DAY), NOW())`,
      [id, refId, customerId, driverId, valor, valor, distancia, pagamento === "paid" ? valor : 0, pagamento, status, dias]
    );

    await exec(
      smart,
      `INSERT INTO trip_request_coordinates (trip_request_id, pickup_address, destination_address, created_at, updated_at)
       VALUES (?, ?, ?, NOW(), NOW())`,
      [id, origem, destino]
    );

    entregaIds.push(id);
  }

  console.log("Inserindo reembolsos de teste...");
  await exec(
    smart,
    `INSERT INTO chamados_reembolso
      (protocolo, corrida_id, valor, motivo, descricao, status, aberto_por, created_at, updated_at)
     VALUES (?, ?, ?, 'reembolso', ?, 'aberto', '1', NOW(), NOW())`,
    ["TESTE-RB-001", entregaIds[0], 12.5, "[TESTE] Reembolso solicitado pelo cliente."]
  );

  await exec(
    smart,
    `INSERT INTO chamados_reembolso
      (protocolo, corrida_id, valor, motivo, descricao, status, aberto_por, created_at, updated_at)
     VALUES (?, ?, ?, 'valor_incorreto', ?, 'em_analise', '1', NOW(), NOW())`,
    ["TESTE-RB-002", entregaIds[1], 18.9, "[TESTE] Valor cobrado diferente do combinado."]
  );

  console.log("Inserindo colaboradores e folha de teste...");
  const colaboradores = [
    ["TESTE-COL-01", "[TESTE] Colaborador Um", "colaborador1@maylon.test", "(13) 97777-0001", "0001", "12345-1", 2500, 300, 150, 200, 2750, 22, "pendente", null],
    ["TESTE-COL-02", "[TESTE] Colaborador Dois", "colaborador2@maylon.test", "(13) 97777-0002", "0001", "12345-2", 3200, 450, 250, 300, 3600, 28, "pago", new Date()],
  ];

  for (const [matricula, nome, email, telefone, agencia, conta, salario, comissoesValor, bonificacoes, descontos, liquido, atendimentos, status, pagamento] of colaboradores) {
    const user = await exec(
      maylon,
      `INSERT INTO users
        (matricula, full_name, email, phone, agencia, conta, profile_image, user_type, recruitment_status, contract_signed, status, gerente_id)
       VALUES (?, ?, ?, ?, ?, ?, '', 'atendente', 'contratado', 1, 'active', 4)`,
      [matricula, nome, email, telefone, agencia, conta]
    );

    await exec(
      maylon,
      `INSERT INTO folhas_pagamento
        (id, user_id, competencia, salario_base, comissoes, bonificacoes, descontos, total_liquido, total_atendimentos, status, data_pagamento, created_at, updated_at)
       VALUES (?, ?, '2026-11', ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [randomUUID(), user.insertId, salario, comissoesValor, bonificacoes, descontos, liquido, atendimentos, status, pagamento]
    );
  }

  console.log("Inserindo solicitações extras do Maylon Pass...");
  const solicitacaoAprovada = await exec(
    maylon,
    `INSERT INTO maylon_pass_solicitacoes
      (usuario_id, novo_usuario, plano, adicionais, valor, observacao, solicitante_id, status, criado_em, decidido_em, gerente_id)
     VALUES (NULL, ?, 'plus', ?, 109.9, '[TESTE] Solicitação aprovada para demonstração.', 5, 'aprovado', DATE_SUB(NOW(), INTERVAL 5 DAY), DATE_SUB(NOW(), INTERVAL 4 DAY), 4)`,
    [JSON.stringify({ nome: "[TESTE] Assinante Aprovado", email: "assinante.aprovado@maylon.test", telefone: "13988880001", cpf: null }), JSON.stringify(["home"])]
  );

  const regraPlano = regrasPorChave.get("maylon_pass");
  const regraAdicional = regrasPorChave.get("servicos_adicionais");

  if (regraPlano && solicitacaoAprovada.insertId) {
    const referencia = new Date().toISOString().slice(0, 7);
    const basePlano = 59.9;
    const valorPlano = Math.round(((basePlano * regraPlano.percentual) / 100) * 100) / 100;

    await exec(
      maylon,
      `INSERT INTO comissoes_comerciais_lancamentos
        (regra_id, produto_chave, produto_nome, beneficiario_id, beneficiario_nome,
         gerente_id, valor_base, percentual, valor_comissao, status,
         origem_tabela, origem_id, referencia, observacao, aprovado_em)
       VALUES (?, 'maylon_pass', 'Maylon Pass', 5, 'Comercial Teste', 4, ?, ?, ?, 'aprovada',
         'maylon_pass_solicitacoes', ?, ?, '[TESTE] Maylon Pass do seed', NOW())`,
      [regraPlano.id, basePlano, regraPlano.percentual, valorPlano, String(solicitacaoAprovada.insertId), referencia]
    );

    if (regraAdicional) {
      const valorAdicional = Math.round(((50 * regraAdicional.percentual) / 100) * 100) / 100;
      await exec(
        maylon,
        `INSERT INTO comissoes_comerciais_lancamentos
          (regra_id, produto_chave, produto_nome, beneficiario_id, beneficiario_nome,
           gerente_id, valor_base, percentual, valor_comissao, status,
           origem_tabela, origem_id, referencia, observacao, aprovado_em)
         VALUES (?, 'servicos_adicionais', 'Serviços adicionais', 5, 'Comercial Teste', 4, 50, ?, ?, 'aprovada',
           'maylon_pass_solicitacoes', ?, ?, '[TESTE] Adicional do seed', NOW())`,
        [regraAdicional.id, regraAdicional.percentual, valorAdicional, String(solicitacaoAprovada.insertId), referencia]
      );
    }
  }

  await exec(
    maylon,
    `INSERT INTO maylon_pass_solicitacoes
      (usuario_id, novo_usuario, plano, adicionais, valor, observacao, solicitante_id, status, criado_em, decidido_em, gerente_id, motivo_recusa)
     VALUES (NULL, ?, 'basico', ?, 29.9, '[TESTE] Solicitação recusada para demonstração.', 5, 'recusado', DATE_SUB(NOW(), INTERVAL 8 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), 4, 'Dados cadastrais incompletos.')`,
    [JSON.stringify({ nome: "[TESTE] Assinante Recusado", email: "assinante.recusado@maylon.test", telefone: "13988880002", cpf: null }), JSON.stringify([])]
  );

  console.log("Seed aplicado com sucesso.");
}

try {
  if (modo === "clean") {
    await clean();
  } else {
    await seed();
  }
} finally {
  await maylon.end();
  await smart.end();
}
