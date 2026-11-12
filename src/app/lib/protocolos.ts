
export type Status =
  | "aberto"
  | "andamento"
  | "aguardando"
  | "encerrado";

export type Prioridade = "baixa" | "media" | "alta";

export type Solicitante = "Passageiro" | "Motorista";

export type Evento = {
  texto: string;
  data: string;
};

export type Protocolo = {
  id: number;
  numero: string;
  nome: string;
  email: string;
  assunto: string;
  categoria: string;
  descricao: string;
  solicitante: Solicitante;
  prioridade: Prioridade;
  status: Status;
  abertoEm: string;
  arquivo?: string;
  documento_url?: string;
  resposta?: string;
  resposta_usuario?: string;
  resposta_usuario_em?: string;
  atualizadoEm?: string;
  historico: Evento[];
};
