-- Modelo de comissões comerciais por produto (maylon_db)

CREATE TABLE IF NOT EXISTS `comissoes_comerciais_regras` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chave` varchar(50) NOT NULL,
  `nome` varchar(150) NOT NULL,
  `percentual` decimal(5,2) NOT NULL DEFAULT 0.00,
  `ativo` tinyint(1) NOT NULL DEFAULT 1,
  `vigencia_inicio` date DEFAULT NULL,
  `vigencia_fim` date DEFAULT NULL,
  `atualizado_por` int(11) DEFAULT NULL,
  `criado_em` timestamp NOT NULL DEFAULT current_timestamp(),
  `atualizado_em` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_comissoes_regras_chave` (`chave`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comissoes_comerciais_lancamentos` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `regra_id` int(11) NOT NULL,
  `produto_chave` varchar(50) NOT NULL,
  `produto_nome` varchar(150) NOT NULL,
  `beneficiario_id` int(11) NOT NULL,
  `beneficiario_nome` varchar(150) NOT NULL,
  `gerente_id` int(11) DEFAULT NULL,
  `valor_base` decimal(12,2) NOT NULL DEFAULT 0.00,
  `percentual` decimal(5,2) NOT NULL DEFAULT 0.00,
  `valor_comissao` decimal(12,2) NOT NULL DEFAULT 0.00,
  `status` enum('pendente','aprovada','paga','cancelada') NOT NULL DEFAULT 'pendente',
  `origem_tabela` varchar(80) NOT NULL,
  `origem_id` varchar(80) NOT NULL,
  `referencia` char(7) DEFAULT NULL,
  `observacao` varchar(500) DEFAULT NULL,
  `criado_em` datetime NOT NULL DEFAULT current_timestamp(),
  `aprovado_em` datetime DEFAULT NULL,
  `pago_em` datetime DEFAULT NULL,
  `cancelado_em` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_comissoes_origem_regra` (`origem_tabela`,`origem_id`,`regra_id`),
  KEY `idx_comissoes_beneficiario` (`beneficiario_id`),
  KEY `idx_comissoes_status` (`status`),
  KEY `idx_comissoes_referencia` (`referencia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `comissoes_comerciais_regras_historico` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `regra_id` int(11) NOT NULL,
  `percentual_anterior` decimal(5,2) NOT NULL DEFAULT 0.00,
  `percentual_novo` decimal(5,2) NOT NULL DEFAULT 0.00,
  `alterado_por` int(11) DEFAULT NULL,
  `alterado_em` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_regras_historico_regra` (`regra_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `vendas`
  ADD COLUMN `produto_chave` varchar(50) DEFAULT NULL;

INSERT IGNORE INTO `comissoes_comerciais_regras` (`chave`, `nome`, `percentual`, `ativo`) VALUES
  ('maylon_pass', 'Maylon Pass', 10.00, 1),
  ('planos_assinaturas', 'Planos e assinaturas', 10.00, 1),
  ('parcerias', 'Parcerias comerciais', 5.00, 1),
  ('publicidade', 'Publicidade e anúncios', 10.00, 1),
  ('seguros_beneficios', 'Seguros e benefícios', 10.00, 1),
  ('servicos_adicionais', 'Serviços adicionais', 5.00, 1);
