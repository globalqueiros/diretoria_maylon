export type CampoDocumento = {
  name: string;
  label: string;
  type?: "text" | "date" | "number" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  options?: string[];
};

export type ModeloDocumento = {
  codigo: string;
  titulo: string;
  descricao: string;
  template: string;
  campos: CampoDocumento[];
};

export const MODELOS_DOCUMENTOS: Record<
  string,
  ModeloDocumento
> = {
  "MOD-001": {
    codigo: "MOD-001",
    titulo: "Termo de Recebimento de Maquininha",
    descricao:
      "Documento para recebimento de máquina de cartão.",
    template:
      "termo_recebimento_maquininha_cartao.pdf",

    campos: [
      {
        name: "marca_modelo",
        label: "Marca / Modelo",
        type: "text",
        placeholder: "Ex.: NEXGO N86",
        required: true,
      },
      {
        name: "numero_serie",
        label: "Número de Série",
        type: "text",
        placeholder: "Digite o número de série",
        required: true,
      },
      {
        name: "numero_patrimonio",
        label: "Número de Patrimônio",
        type: "text",
        placeholder: "Ex.: PAT-000001",
        required: true,
      },
      {
        name: "data_entrega",
        label: "Data de Entrega",
        type: "date",
        required: true,
      },
      {
        name: "estado_conservacao",
        label: "Estado de Conservação",
        type: "select",
        required: true,
        options: [
          "Perfeito estado de conservação",
          "Bom estado de conservação",
          "Regular estado de conservação",
        ],
      },
      {
        name: "nome_completo",
        label: "Nome Completo",
        type: "text",
        placeholder: "Digite o nome completo",
        required: true,
      },
      {
        name: "cpf",
        label: "CPF",
        type: "text",
        placeholder: "000.000.000-00",
        required: true,
      },
      {
        name: "cargo_funcao",
        label: "Cargo / Função",
        type: "text",
        placeholder: "Ex.: Motorista",
        required: true,
      },
      {
        name: "whatsapp",
        label: "WhatsApp",
        type: "text",
        placeholder: "(11) 99999-9999",
        required: true,
      },
    ],
  },

  "MOD-002": {
    codigo: "MOD-002",
    titulo: "Termo de Entrega de Veículo",
    descricao:
      "Documento para entrega de veículo ao motorista.",
    template: "termo_entrega_veiculo.pdf",

    campos: [
      {
        name: "marca",
        label: "Marca",
        type: "text",
        required: true,
      },
      {
        name: "modelo",
        label: "Modelo",
        type: "text",
        required: true,
      },
      {
        name: "placa",
        label: "Placa",
        type: "text",
        required: true,
      },
      {
        name: "renavam",
        label: "RENAVAM",
        type: "text",
        required: true,
      },
      {
        name: "quilometragem",
        label: "Quilometragem",
        type: "number",
        required: true,
      },
      {
        name: "data_entrega",
        label: "Data de Entrega",
        type: "date",
        required: true,
      },
      {
        name: "nome_motorista",
        label: "Nome do Motorista",
        type: "text",
        required: true,
      },
      {
        name: "cpf",
        label: "CPF",
        type: "text",
        required: true,
      },
      {
        name: "cnh",
        label: "CNH",
        type: "text",
        required: true,
      },
    ],
  },

  "MOD-003": {
    codigo: "MOD-003",
    titulo: "Termo de Devolução",
    descricao:
      "Documento para devolução de equipamentos.",
    template: "termo_devolucao.pdf",

    campos: [
      {
        name: "equipamento",
        label: "Equipamento",
        type: "text",
        required: true,
      },
      {
        name: "numero_patrimonio",
        label: "Número de Patrimônio",
        type: "text",
        required: true,
      },
      {
        name: "data_devolucao",
        label: "Data de Devolução",
        type: "date",
        required: true,
      },
      {
        name: "motivo",
        label: "Motivo da Devolução",
        type: "textarea",
        required: true,
      },
      {
        name: "nome_completo",
        label: "Nome Completo",
        type: "text",
        required: true,
      },
      {
        name: "cpf",
        label: "CPF",
        type: "text",
        required: true,
      },
      {
        name: "observacoes",
        label: "Observações",
        type: "textarea",
      },
    ],
  },
};