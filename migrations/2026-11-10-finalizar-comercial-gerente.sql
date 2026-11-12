-- Migrações necessárias para finalizar as áreas Comercial e Gerente.
-- Revise antes de executar em produção. Faça backup.

-- 1) Vínculo colaborador -> gerente (financeiro da equipe)
ALTER TABLE maylon_db.users
  ADD COLUMN gerente_id INT NULL,
  ADD INDEX idx_users_gerente_id (gerente_id);

-- 2) Protocolos: prioridade e tipo de solicitante (filtros da tela)
ALTER TABLE smartmobility_db.protocolos
  ADD COLUMN prioridade ENUM('baixa','media','alta','urgente') NOT NULL DEFAULT 'media',
  ADD COLUMN solicitante_tipo VARCHAR(20) NULL;

-- 3) Comissões: vínculo com o usuário vendedor (filtro individual do comercial)
ALTER TABLE smartmobility_db.comissoes
  ADD COLUMN user_id BIGINT NULL,
  ADD INDEX idx_comissoes_user_id (user_id);

-- 4) Dados operacionais (exemplos; ajuste os ids conforme a base)
-- Vincular motoristas ao gerente:
-- UPDATE smartmobility_db.users SET gerente = 1 WHERE user_type = 'driver' AND id = '...';
--
-- Vincular colaboradores internos ao gerente:
-- UPDATE maylon_db.users SET gerente_id = 1 WHERE id IN (...);
--
-- Popular comissões do comercial (quando a regra de negócio existir):
-- INSERT INTO smartmobility_db.comissoes
--   (gerente_id, user_id, beneficiario, perfil, referencia, meta, atingido, valor, status)
-- VALUES (NULL, 2, 'Nome do vendedor', 'comercial', '2026-11', 1000, 1200, 120, 'pendente');
