-- Status próprio do funil de leads (CRM comercial).
-- Antes o status era derivado de vendas; agora fica persistido em clientes.lead_status.
-- Execute via scripts/run-migration-leads-status.mjs (checa information_schema antes).

ALTER TABLE clientes
  ADD COLUMN lead_status VARCHAR(20) NOT NULL DEFAULT 'Novo';

UPDATE clientes c SET lead_status = CASE
  WHEN EXISTS (SELECT 1 FROM vendas v WHERE v.cliente_id = c.id AND v.status = 'paga') THEN 'Convertido'
  WHEN EXISTS (SELECT 1 FROM vendas v WHERE v.cliente_id = c.id AND v.status IN ('pendente', 'registrada')) THEN 'Proposta'
  WHEN c.status = 1 THEN 'Perdido'
  ELSE 'Novo'
END;
