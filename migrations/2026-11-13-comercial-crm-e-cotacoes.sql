-- Correções e recursos da área Comercial.
-- 1) CRM: estágio próprio do funil na tabela vendas (separado do status de pagamento).
-- 2) Cotações de publicidade: tabela própria (comercial cria, gerente aprova).
-- Execute via scripts/run-migration-crm-cotacoes.mjs (checa information_schema antes).

-- 1) CRM ---------------------------------------------------------------------
ALTER TABLE vendas
  ADD COLUMN crm_stage VARCHAR(20) NULL,
  ADD COLUMN crm_atualizado_em DATETIME NULL;

UPDATE vendas SET crm_stage = CASE status
  WHEN 'pendente'   THEN 'Contato'
  WHEN 'registrada' THEN 'Proposta'
  WHEN 'paga'       THEN 'Ganho'
  WHEN 'cancelada'  THEN 'Perdido'
  ELSE 'Contato'
END
WHERE crm_stage IS NULL;

-- 2) Cotações de publicidade -------------------------------------------------
CREATE TABLE IF NOT EXISTS cotacoes_publicidade (
  id INT AUTO_INCREMENT PRIMARY KEY,
  protocolo VARCHAR(30) NOT NULL UNIQUE,
  nome VARCHAR(150) NOT NULL,
  empresa VARCHAR(150) NOT NULL,
  email VARCHAR(150) NULL,
  whatsapp VARCHAR(30) NULL,
  mensagem TEXT NULL,
  publicos JSON NOT NULL,
  espacos JSON NOT NULL,
  semanas INT NOT NULL DEFAULT 4,
  segmentado TINYINT(1) NOT NULL DEFAULT 0,
  criacao TINYINT(1) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  status ENUM('pendente','aprovada','recusada') NOT NULL DEFAULT 'pendente',
  observacao_gerente TEXT NULL,
  criado_por_id INT NULL,
  criado_por_nome VARCHAR(150) NULL,
  decidido_por VARCHAR(150) NULL,
  decidido_em DATETIME NULL,
  criado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  atualizado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
