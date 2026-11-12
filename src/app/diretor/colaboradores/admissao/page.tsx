"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  FileText,
  User,
  UserPlus,
} from "lucide-react";

type FormularioAdmissao = {
  nomeCompleto: string;
  cpf: string;
  rg: string;
  dataNascimento: string;
  email: string;
  telefone: string;
  sexo: string;
  estadoCivil: string;
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  cargo: string;
  departamento: string;
  tipoContrato: string;
  dataAdmissao: string;
  salario: string;
  jornada: string;
  observacoes: string;
};

type RespostaApi = {
  message?: string;
};

const estadoInicial: FormularioAdmissao = {
  nomeCompleto: "",
  cpf: "",
  rg: "",
  dataNascimento: "",
  email: "",
  telefone: "",
  sexo: "",
  estadoCivil: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  cargo: "",
  departamento: "",
  tipoContrato: "",
  dataAdmissao: "",
  salario: "",
  jornada: "",
  observacoes: "",
};

const CHAVE_NUMERO_RECRUTAMENTO = "numero_recrutamento";
const CHAVE_DATA_NUMERO_RECRUTAMENTO = "data_numero_recrutamento";
const TEMPO_NUMERO_RECRUTAMENTO = 90 * 60 * 1000;

function gerarNumeroRecrutamento(): string {
  return Math.floor(
    100000000 + Math.random() * 900000000
  ).toString();
}

function obterNumeroRecrutamento(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const numeroSalvo = localStorage.getItem(
    CHAVE_NUMERO_RECRUTAMENTO
  );

  const dataSalva = localStorage.getItem(
    CHAVE_DATA_NUMERO_RECRUTAMENTO
  );

  const agora = Date.now();

  if (numeroSalvo && dataSalva) {
    const data = Number(dataSalva);

    if (
      Number.isFinite(data) &&
      agora - data < TEMPO_NUMERO_RECRUTAMENTO
    ) {
      return numeroSalvo;
    }
  }

  return gerarNovoNumeroRecrutamento();
}

function gerarNovoNumeroRecrutamento(): string {
  if (typeof window === "undefined") {
    return "";
  }

  const novoNumero = gerarNumeroRecrutamento();
  const agora = Date.now();

  localStorage.setItem(
    CHAVE_NUMERO_RECRUTAMENTO,
    novoNumero
  );

  localStorage.setItem(
    CHAVE_DATA_NUMERO_RECRUTAMENTO,
    agora.toString()
  );

  return novoNumero;
}

function formatarCPF(valor: string): string {
  return valor
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatarTelefone(valor: string): string {
  const numeros = valor.replace(/\D/g, "").slice(0, 11);

  if (numeros.length <= 10) {
    return numeros
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return numeros
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function formatarCEP(valor: string): string {
  return valor
    .replace(/\D/g, "")
    .slice(0, 8)
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function formatarSalario(valor: string): string {
  const numeros = valor.replace(/\D/g, "");

  if (!numeros) {
    return "";
  }

  const numero = Number(numeros) / 100;

  return numero.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export default function Page() {
  const [formulario, setFormulario] =
    useState<FormularioAdmissao>(estadoInicial);

  const [numeroRecrutamento, setNumeroRecrutamento] =
    useState("");

  const [
    numeroCadastroRealizado,
    setNumeroCadastroRealizado,
  ] = useState("");

  const [curriculo, setCurriculo] =
    useState<File | null>(null);

  const [salvando, setSalvando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let timeout: number | undefined;

    const atualizarNumero = () => {
      const numero = obterNumeroRecrutamento();

      setNumeroRecrutamento(numero);

      const dataSalva = localStorage.getItem(
        CHAVE_DATA_NUMERO_RECRUTAMENTO
      );

      const data = Number(dataSalva);
      const agora = Date.now();

      const restante =
        Number.isFinite(data) && data > 0
          ? Math.max(
              1000,
              TEMPO_NUMERO_RECRUTAMENTO -
                (agora - data)
            )
          : TEMPO_NUMERO_RECRUTAMENTO;

      timeout = window.setTimeout(
        atualizarNumero,
        restante
      );
    };

    atualizarNumero();

    return () => {
      if (timeout !== undefined) {
        window.clearTimeout(timeout);
      }
    };
  }, []);

  function alterarCampo(
    campo: keyof FormularioAdmissao,
    valor: string
  ) {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  async function buscarCEP() {
    const cep = formulario.cep.replace(/\D/g, "");

    if (cep.length !== 8) {
      return;
    }

    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cep}/json/`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      if (data.erro) {
        return;
      }

      setFormulario((anterior) => ({
        ...anterior,
        endereco:
          data.logradouro || anterior.endereco,
        bairro:
          data.bairro || anterior.bairro,
        cidade:
          data.localidade || anterior.cidade,
        estado:
          data.uf || anterior.estado,
      }));
    } catch (error) {
      console.error("Erro ao consultar CEP:", error);
    }
  }

  function selecionarCurriculo(
    arquivo: File | undefined
  ) {
    if (!arquivo) {
      return;
    }

    const ehPdf =
      arquivo.type === "application/pdf" ||
      arquivo.name
        .toLowerCase()
        .endsWith(".pdf");

    if (!ehPdf) {
      setErro(
        "O currículo deve estar no formato PDF."
      );
      setCurriculo(null);
      return;
    }

    if (arquivo.size > 10 * 1024 * 1024) {
      setErro(
        "O currículo deve ter no máximo 10 MB."
      );
      setCurriculo(null);
      return;
    }

    setErro("");
    setCurriculo(arquivo);
  }

  async function enviarFormulario(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setErro("");
    setSucesso(false);

    const numeroAtual =
      numeroRecrutamento ||
      obterNumeroRecrutamento();

    if (!numeroAtual) {
      setErro(
        "Não foi possível gerar o número de recrutamento."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (!curriculo) {
      setErro(
        "Anexe seu currículo em PDF antes de continuar."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (curriculo.size > 10 * 1024 * 1024) {
      setErro(
        "O currículo deve ter no máximo 10 MB."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    setSalvando(true);

    try {
      const formData = new FormData();

      Object.entries(formulario).forEach(
        ([campo, valor]) => {
          formData.append(campo, valor);
        }
      );

      formData.append(
        "numeroRecrutamento",
        numeroAtual
      );

      formData.append(
        "curriculo",
        curriculo
      );

      const response = await fetch(
        "/api/funcionarios/admissao",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: formData,
        }
      );

      const texto = await response.text();

      let data: RespostaApi = {};

      if (texto) {
        try {
          data = JSON.parse(texto) as RespostaApi;
        } catch {
          throw new Error(
            "A API retornou uma resposta inválida."
          );
        }
      }

      if (!response.ok) {
        throw new Error(
          data.message ||
            `Não foi possível realizar o cadastro. Status: ${response.status}`
        );
      }

      setNumeroCadastroRealizado(
        numeroAtual
      );

      setSucesso(true);

      setFormulario({
        ...estadoInicial,
      });

      setCurriculo(null);

      const novoNumero =
        gerarNovoNumeroRecrutamento();

      setNumeroRecrutamento(novoNumero);

      setErro("");

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error(
        "Erro ao realizar cadastro:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Erro ao realizar o cadastro."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="min-h-screen text-white">
      <div className="mx-auto max-w-8xl">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-600 text-white shadow-lg shadow-teal-900/20">
              <UserPlus className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight text-white">
                Candidato ao Recrutamento
              </h1>

              <p className="mt-1 text-sm text-white/80">
                Cadastre seus dados para participar do processo seletivo.
              </p>
            </div>
          </div>

          <Link
            href="/diretor/colaboradores"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para RH
          </Link>
        </div>

        {numeroRecrutamento && (
          <div className="mb-5 rounded-2xl border border-teal-200 bg-white p-5 shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Número do recrutamento
                </p>

                <p className="mt-0 text-2xl font-black tracking-[0.05em] text-teal-700">
                  {numeroRecrutamento}
                </p>
              </div>
            </div>
          </div>
        )}

        {sucesso && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-medium text-emerald-700">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100">
              <Check className="h-4 w-4" />
            </div>

            <div>
              <p className="font-bold">
                Candidato cadastrado com sucesso!
              </p>

              <p className="my-1 font-normal">
                Seu cadastro e currículo foram recebidos. Aguarde nosso contato.
              </p>

              <p className="mt-0 font-semibold">
                Número do recrutamento:{" "}
                {numeroCadastroRealizado}
              </p>

              <p className="mt-1 text-xs text-emerald-600">
                Um novo número de recrutamento já foi gerado para o próximo candidato.
              </p>
            </div>
          </div>
        )}

        {erro && (
          <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-medium text-red-700">
            {erro}
          </div>
        )}

        <form
          onSubmit={enviarFormulario}
          className="space-y-6"
        >
          <section className="overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
                  <User className="h-5 w-5 text-teal-700" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Dados pessoais
                  </h2>

                  <p className="text-xs text-slate-500">
                    Informe os dados básicos do candidato.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 lg:grid-cols-3">
              <Campo
                label="Nome completo"
                required
                value={formulario.nomeCompleto}
                onChange={(valor) =>
                  alterarCampo(
                    "nomeCompleto",
                    valor
                  )
                }
                className="lg:col-span-2"
                placeholder="Digite o nome completo"
              />

              <Campo
                label="CPF"
                required
                value={formulario.cpf}
                onChange={(valor) =>
                  alterarCampo(
                    "cpf",
                    formatarCPF(valor)
                  )
                }
                placeholder="000.000.000-00"
                maxLength={14}
              />

              <Campo
                label="RG"
                value={formulario.rg}
                onChange={(valor) =>
                  alterarCampo("rg", valor)
                }
                placeholder="00.000.000-0"
              />

              <Campo
                label="Data de nascimento"
                type="date"
                required
                value={
                  formulario.dataNascimento
                }
                onChange={(valor) =>
                  alterarCampo(
                    "dataNascimento",
                    valor
                  )
                }
              />

              <SelectCampo
                label="Sexo"
                required
                value={formulario.sexo}
                className="cursor-pointer"
                onChange={(valor) =>
                  alterarCampo(
                    "sexo",
                    valor
                  )
                }
                options={[
                  ["masculino", "Masculino"],
                  ["feminino", "Feminino"],
                  ["outro", "Outro"],
                ]}
              />

              <SelectCampo
                label="Estado civil"
                value={formulario.estadoCivil}
                className="cursor-pointer"
                onChange={(valor) =>
                  alterarCampo(
                    "estadoCivil",
                    valor
                  )
                }
                options={[
                  ["solteiro", "Solteiro(a)"],
                  ["casado", "Casado(a)"],
                  ["divorciado", "Divorciado(a)"],
                  ["viuvo", "Viúvo(a)"],
                  ["uniao_estavel", "União estável"],
                ]}
              />

              <Campo
                label="E-mail"
                type="email"
                required
                value={formulario.email}
                onChange={(valor) =>
                  alterarCampo(
                    "email",
                    valor
                  )
                }
                placeholder="seuemail@exemplo.com"
              />

              <Campo
                label="WhatsApp"
                required
                value={formulario.telefone}
                onChange={(valor) =>
                  alterarCampo(
                    "telefone",
                    formatarTelefone(valor)
                  )
                }
                placeholder="(00) 00000-0000"
                maxLength={15}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                  <User className="h-5 w-5 text-blue-700" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Endereço
                  </h2>

                  <p className="text-xs text-slate-500">
                    Informe o endereço residencial.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 lg:grid-cols-4">
              <Campo
                label="CEP"
                required
                value={formulario.cep}
                onChange={(valor) =>
                  alterarCampo(
                    "cep",
                    formatarCEP(valor)
                  )
                }
                onBlur={buscarCEP}
                placeholder="00000-000"
                maxLength={9}
              />

              <Campo
                label="Endereço"
                required
                value={formulario.endereco}
                onChange={(valor) =>
                  alterarCampo(
                    "endereco",
                    valor
                  )
                }
                className="lg:col-span-2"
              />

              <Campo
                label="Número"
                required
                value={formulario.numero}
                onChange={(valor) =>
                  alterarCampo(
                    "numero",
                    valor
                  )
                }
              />

              <Campo
                label="Complemento"
                value={formulario.complemento}
                onChange={(valor) =>
                  alterarCampo(
                    "complemento",
                    valor
                  )
                }
              />

              <Campo
                label="Bairro"
                required
                value={formulario.bairro}
                onChange={(valor) =>
                  alterarCampo(
                    "bairro",
                    valor
                  )
                }
              />

              <Campo
                label="Cidade"
                required
                value={formulario.cidade}
                onChange={(valor) =>
                  alterarCampo(
                    "cidade",
                    valor
                  )
                }
              />

              <Campo
                label="Estado"
                required
                value={formulario.estado}
                onChange={(valor) =>
                  alterarCampo(
                    "estado",
                    valor.toUpperCase()
                  )
                }
                placeholder="SP"
                maxLength={2}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
                  <BriefcaseBusiness className="h-5 w-5 text-teal-700" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Dados profissionais
                  </h2>

                  <p className="text-xs text-slate-500">
                    Informe os dados relacionados à oportunidade.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2 lg:grid-cols-3">
              <SelectCampo
                label="Cargo"
                required
                value={formulario.cargo}
                className="cursor-pointer"
                onChange={(valor) =>
                  alterarCampo(
                    "cargo",
                    valor
                  )
                }
                options={[
                  ["diretor", "Diretor"],
                  ["gerente", "Gerente"],
                  ["supervisor", "Supervisor"],
                  ["atendente", "Atendente"],
                  ["financeiro", "Financeiro"],
                  ["rh", "Recursos Humanos"],
                  ["marketing", "Marketing"],
                  ["juridico", "Jurídico"],
                  ["suporte", "Suporte"],
                ]}
              />

              <SelectCampo
                label="Departamento"
                required
                value={formulario.departamento}
                className="cursor-pointer"
                onChange={(valor) =>
                  alterarCampo(
                    "departamento",
                    valor
                  )
                }
                options={[
                  ["rh", "Recursos Humanos"],
                  ["administrativo", "Administrativo"],
                  ["financeiro", "Financeiro"],
                  ["comercial", "Comercial"],
                  ["marketing", "Marketing"],
                  ["juridico", "Jurídico"],
                  ["suporte", "Suporte"],
                ]}
              />

              <SelectCampo
                label="Tipo de contrato"
                required
                value={formulario.tipoContrato}
                className="cursor-pointer"
                onChange={(valor) =>
                  alterarCampo(
                    "tipoContrato",
                    valor
                  )
                }
                options={[
                  [
                    "contrato_intermitente",
                    "Contrato Intermitente",
                  ],
                  ["freelancer", "Freelancer"],
                  ["estagio", "Estágio"],
                  ["temporario", "Temporário"],
                  ["aprendiz", "Aprendiz"],
                ]}
              />

              <Campo
                label="Data de admissão"
                type="date"
                required
                value={
                  formulario.dataAdmissao
                }
                onChange={(valor) =>
                  alterarCampo(
                    "dataAdmissao",
                    valor
                  )
                }
              />

              <Campo
                label="Pagamento"
                required
                value={formulario.salario}
                onChange={(valor) =>
                  alterarCampo(
                    "salario",
                    formatarSalario(valor)
                  )
                }
                placeholder="0,00"
                prefix="R$"
              />

              <SelectCampo
                label="Jornada de trabalho"
                required
                value={formulario.jornada}
                className="cursor-pointer"
                onChange={(valor) =>
                  alterarCampo(
                    "jornada",
                    valor
                  )
                }
                options={[
                  ["44h", "44 horas semanais"],
                  ["40h", "40 horas semanais"],
                  ["36h", "36 horas semanais"],
                  ["30h", "30 horas semanais"],
                  ["20h", "20 horas semanais"],
                ]}
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100">
                  <FileText className="h-5 w-5 text-teal-700" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Currículo
                  </h2>

                  <p className="text-xs text-slate-500">
                    Anexe seu currículo atualizado em formato PDF.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Arquivo do currículo
                <span className="ml-1 text-red-500">
                  *
                </span>
              </label>

              <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 transition hover:border-teal-400 hover:bg-teal-50/30">
                <div className="flex flex-col items-center justify-center text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-teal-100">
                    <FileText className="h-7 w-7 text-teal-700" />
                  </div>

                  <p className="max-w-full truncate px-4 text-sm font-semibold text-slate-700">
                    {curriculo
                      ? curriculo.name
                      : "Nenhum currículo selecionado"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Formato PDF • Tamanho máximo 10 MB
                  </p>

                  <label className="mt-5 cursor-pointer">
                    <span className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/20 transition hover:bg-teal-700">
                      <FileText className="h-4 w-4" />
                      {curriculo
                        ? "Alterar currículo"
                        : "Selecionar currículo"}
                    </span>

                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      className="hidden"
                      onChange={(event) => {
                        selecionarCurriculo(
                          event.target.files?.[0]
                        );

                        event.target.value = "";
                      }}
                    />
                  </label>

                  {curriculo && (
                    <div className="mt-4 flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700">
                        <Check className="h-4 w-4" />
                        Currículo pronto para envio
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setCurriculo(null)
                        }
                        className="text-xs font-semibold text-red-600 transition hover:text-red-700"
                      >
                        Remover currículo
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100">
                  <FileText className="h-5 w-5 text-slate-700" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Observações
                  </h2>

                  <p className="text-xs text-slate-500">
                    Adicione informações complementares, se necessário.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <textarea
                value={formulario.observacoes}
                onChange={(event) =>
                  alterarCampo(
                    "observacoes",
                    event.target.value
                  )
                }
                rows={5}
                placeholder="Digite observações sobre o candidato..."
                className="w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/diretor/colaboradores"
              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Cancelar
            </Link>

            <button
              type="submit"
              disabled={salvando}
              className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-teal-600 px-7 py-3 text-sm font-bold text-white shadow-lg shadow-teal-900/20 transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />

              {salvando
                ? "Salvando..."
                : "Salvar Recrutamento"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

type CampoProps = {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  className?: string;
  prefix?: string;
  onBlur?: () => void;
  maxLength?: number;
};

function Campo({
  label,
  value,
  onChange,
  required = false,
  type = "text",
  placeholder,
  className = "",
  prefix,
  onBlur,
  maxLength,
}: CampoProps) {
  return (
    <div className={className}>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <div className="relative">
        {prefix && (
          <span className="absolute left-4 top-1/2 z-10 -translate-y-1/2 text-sm font-medium text-slate-500">
            {prefix}
          </span>
        )}

        <input
          type={type}
          value={value}
          required={required}
          placeholder={placeholder}
          onBlur={onBlur}
          maxLength={maxLength}
          onChange={(event) =>
            onChange(event.target.value)
          }
          className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${
            prefix ? "pl-11" : ""
          }`}
        />
      </div>
    </div>
  );
}

type SelectCampoProps = {
  label: string;
  value: string;
  onChange: (valor: string) => void;
  required?: boolean;
  options: [string, string][];
  className?: string;
};

function SelectCampo({
  label,
  value,
  onChange,
  required = false,
  options,
  className = "",
}: SelectCampoProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <select
        value={value}
        required={required}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={`w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 ${className}`}
      >
        <option value="">
          Selecione...
        </option>

        {options.map(
          ([valor, texto]) => (
            <option
              key={valor}
              value={valor}
            >
              {texto}
            </option>
          )
        )}
      </select>
    </div>
  );
}