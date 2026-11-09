export const TIPOS = ['cotacoes', 'vendas'] as const;
export const STATUS_MANUAL = ['ativa', 'concluida', 'cancelada'] as const;

export type Tipo = (typeof TIPOS)[number];
export type StatusManual = (typeof STATUS_MANUAL)[number];

export type Meta = {
  id: number;
  titulo: string;
  descricao: string;
  tipo: Tipo;
  valorMeta: number;
  valorAtual: number;
  inicio: string; // YYYY-MM-DD
  fim: string; // YYYY-MM-DD
  responsavel: string;
  status: StatusManual;
  criadoEm: string;
};

export type DadosMeta = Omit<Meta, 'id' | 'criadoEm'>;

// Aceita DATE como texto ('2026-11-06') ou como objeto Date, dependendo da configuração do pool
const dataISO = (v: unknown) =>
  v instanceof Date
    ? `${v.getFullYear()}-${String(v.getMonth() + 1).padStart(2, '0')}-${String(v.getDate()).padStart(2, '0')}`
    : String(v).slice(0, 10);

export function linhaParaMeta(r: Record<string, unknown>): Meta {
  return {
    id: Number(r.id),
    titulo: String(r.titulo),
    descricao: r.descricao ? String(r.descricao) : '',
    tipo: r.tipo as Tipo,
    valorMeta: Number(r.valor_meta),
    valorAtual: Number(r.valor_atual),
    inicio: dataISO(r.inicio),
    fim: dataISO(r.fim),
    responsavel: r.responsavel ? String(r.responsavel) : '',
    status: r.status as StatusManual,
    criadoEm: String(r.criado_em),
  };
}

const DATA = /^\d{4}-\d{2}-\d{2}$/;

export type ResultadoValidacao = { ok: boolean; erro?: string; dados?: DadosMeta };

export function validarMeta(body: unknown): ResultadoValidacao {
  if (!body || typeof body !== 'object') return { ok: false, erro: 'Dados inválidos.' };
  const b = body as Record<string, unknown>;

  const titulo = String(b.titulo ?? '').trim();
  const descricao = String(b.descricao ?? '').trim();
  const responsavel = String(b.responsavel ?? '').trim();
  const tipo = b.tipo as Tipo;
  const status = (b.status ?? 'ativa') as StatusManual;
  const valorMeta = Number(b.valorMeta);
  const valorAtual = Number(b.valorAtual ?? 0);
  const inicio = String(b.inicio ?? '');
  const fim = String(b.fim ?? '');

  if (!titulo) return { ok: false, erro: 'Informe o nome da meta.' };
  if (titulo.length > 120) return { ok: false, erro: 'O nome da meta pode ter até 120 caracteres.' };
  if (descricao.length > 500) return { ok: false, erro: 'A descrição pode ter até 500 caracteres.' };
  if (responsavel.length > 80) return { ok: false, erro: 'O responsável pode ter até 80 caracteres.' };
  if (!TIPOS.includes(tipo)) return { ok: false, erro: 'Escolha uma métrica válida.' };
  if (!STATUS_MANUAL.includes(status)) return { ok: false, erro: 'Situação inválida.' };
  if (!Number.isFinite(valorMeta) || valorMeta <= 0) return { ok: false, erro: 'O valor da meta deve ser maior que zero.' };
  if (!Number.isFinite(valorAtual) || valorAtual < 0) return { ok: false, erro: 'O valor atual não pode ser negativo.' };
  if (!DATA.test(inicio) || !DATA.test(fim)) return { ok: false, erro: 'Informe as datas de início e fim.' };
  if (fim < inicio) return { ok: false, erro: 'A data final não pode ser antes da inicial.' };

  return { ok: true, dados: { titulo, descricao, tipo, valorMeta, valorAtual, inicio, fim, responsavel, status } };
}