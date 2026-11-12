
"use client";

import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  FileText,
  FileWarning,
  LockKeyhole,
  Paperclip,
  Send,
  ShieldCheck,
  UploadCloud,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useRef, useState } from "react";

export default function Page() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [arquivos, setArquivos] = useState<File[]>([]);
  const [erro, setErro] = useState("");

  function selecionarArquivos(lista: FileList | null) {
    if (!lista) return;

    const novos = Array.from(lista);
    const combinados = [...arquivos, ...novos];
    const unicos = combinados.filter(
      (arquivo, index, array) =>
        array.findIndex(
          (item) =>
            item.name === arquivo.name &&
            item.size === arquivo.size &&
            item.lastModified === arquivo.lastModified
        ) === index
    );

    if (unicos.length > 5) {
      setErro("Você pode anexar no máximo 5 arquivos.");
      return;
    }

    const limite = 10 * 1024 * 1024;

    if (unicos.some((arquivo) => arquivo.size > limite)) {
      setErro("Cada arquivo deve ter no máximo 10 MB.");
      return;
    }

    setErro("");
    setArquivos(unicos);

    if (fileRef.current) {
      const transferencia = new DataTransfer();
      unicos.forEach((arquivo) => transferencia.items.add(arquivo));
      fileRef.current.files = transferencia.files;
    }
  }

  function removerArquivo(index: number) {
    const atualizados = arquivos.filter((_, i) => i !== index);
    setArquivos(atualizados);

    if (fileRef.current) {
      const transferencia = new DataTransfer();
      atualizados.forEach((arquivo) => transferencia.items.add(arquivo));
      fileRef.current.files = transferencia.files;
    }
  }

  function enviarDenuncia(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");

    if (enviando) return;

    setEnviando(true);

    setTimeout(() => {
      setEnviando(false);
      setEnviado(true);
    }, 800);
  }

  const inputClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-[#35a989] focus:ring-4 focus:ring-[#35a989]/10";

  const labelClass = "text-sm font-semibold text-slate-700";

  if (enviado) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl shadow-slate-200/50">
          <div className="h-2 bg-gradient-to-r from-[#35a989] to-emerald-400" />

          <div className="px-6 py-10 text-center sm:px-10 sm:py-12">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50">
              <CheckCircle2 size={42} className="text-[#259c79]" />
            </div>

            <span className="mt-6 inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Solicitação registrada
            </span>

            <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Denúncia enviada!
            </h1>

            <p className="mt-3 text-sm leading-7 text-slate-500">
              Sua denúncia foi registrada nesta demonstração. As informações
              poderão ser encaminhadas à equipe responsável quando o envio
              estiver integrado ao sistema da Maylon.
            </p>

            <button
              type="button"
              onClick={() => router.push("/suporte")}
              className="mt-8 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#35a989] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-[#288c70]"
            >
              Voltar para Suporte e Ocorrências
              <ChevronRight size={17} />
            </button>

            <button
              type="button"
              onClick={() => {
                setEnviado(false);
                setArquivos([]);
              }}
              className="mt-4 cursor-pointer text-sm font-medium text-slate-500 transition hover:text-[#259c79]"
            >
              Registrar outra denúncia
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-8xl">
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-0 inline-flex text-black cursor-pointer items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition bg-white"
        >
          <ArrowLeft size={17} />
          Voltar
        </button>

        <div className="mb-4 grid gap-6 lg:grid-cols-[1fr_280px] lg:items-center">
          <div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Canal de denúncias
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-white sm:text-sm">
              Ajude-nos a manter uma experiência melhor para todos. Descreva
              a ocorrência com clareza para que as informações possam ser
              avaliadas pela equipe responsável.
            </p>
          </div>

          <div className="hidden rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm lg:block">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50">
              <ShieldCheck size={25} className="text-[#35a989]" />
            </div>
            <h2 className="mt-4 font-semibold text-slate-800">
              Relato responsável
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Informe os detalhes relevantes e anexe evidências, se houver.
            </p>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="min-w-0 overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm shadow-slate-200/40">
            <div className="border-b border-slate-100 px-5 py-6 sm:px-8">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50">
                  <FileWarning size={24} className="text-[#35a989]" />
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Formulário de denúncia
                  </h2>
                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Preencha os campos abaixo para registrar os detalhes da
                    ocorrência.
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    <span className="text-rose-500">*</span> Campos obrigatórios
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={enviarDenuncia}
              className="space-y-8 px-5 py-7 sm:px-8 sm:py-8"
            >
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                    01
                  </span>
                  <h3 className="font-semibold text-slate-800">
                    Seus dados
                  </h3>
                  <span className="text-xs text-slate-400">(opcional)</span>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="nome" className={labelClass}>
                      Nome completo
                    </label>
                    <input
                      id="nome"
                      name="nome"
                      type="text"
                      autoComplete="name"
                      placeholder="Digite seu nome"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label htmlFor="telefone" className={labelClass}>
                      Telefone / WhatsApp
                    </label>
                    <input
                      id="telefone"
                      name="telefone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="(00) 00000-0000"
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-7">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                    02
                  </span>
                  <h3 className="font-semibold text-slate-800">
                    Dados da ocorrência
                  </h3>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="tipo" className={labelClass}>
                      Tipo de ocorrência <span className="text-rose-500">*</span>
                    </label>
                    <select
                      id="tipo"
                      name="tipo"
                      required
                      defaultValue=""
                      className={`${inputClass} cursor-pointer`}
                    >
                      <option value="" disabled>
                        Selecione uma opção
                      </option>
                      <option value="passageiro">
                        Ocorrência com passageiro
                      </option>
                      <option value="motorista">
                        Ocorrência com motorista
                      </option>
                      <option value="viagem">
                        Ocorrência durante viagem
                      </option>
                      <option value="outros">Outros</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="viagem" className={labelClass}>
                      Número da viagem
                    </label>
                    <input
                      id="viagem"
                      name="viagem"
                      type="text"
                      placeholder="Ex.: MAY-000123"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="mt-5">
                  <label htmlFor="assunto" className={labelClass}>
                    Assunto <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="assunto"
                    name="assunto"
                    type="text"
                    required
                    maxLength={150}
                    placeholder="Resuma o motivo da denúncia"
                    className={inputClass}
                  />
                </div>

                <div className="mt-5">
                  <label htmlFor="descricao" className={labelClass}>
                    Descrição da ocorrência{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="descricao"
                    name="descricao"
                    required
                    minLength={10}
                    maxLength={5000}
                    rows={6}
                    placeholder="Descreva o que aconteceu, incluindo data, horário, local e outras informações relevantes..."
                    className={`${inputClass} min-h-40 resize-y leading-7`}
                  />
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Evite incluir senhas ou informações pessoais que não sejam
                    necessárias para analisar a ocorrência.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-7">
                <div className="mb-4 flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                    03
                  </span>
                  <h3 className="font-semibold text-slate-800">
                    Documentos e evidências
                  </h3>
                  <span className="text-xs text-slate-400">(opcional)</span>
                </div>

                <input
                  ref={fileRef}
                  id="anexos"
                  name="anexos"
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={(event) =>
                    selecionarArquivos(event.currentTarget.files)
                  }
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="group flex w-full cursor-pointer flex-col items-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 px-5 py-8 text-center transition hover:border-[#35a989] hover:bg-emerald-50/40"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#35a989] shadow-sm transition group-hover:scale-105">
                    <UploadCloud size={28} />
                  </div>
                  <span className="mt-4 text-sm font-semibold text-slate-700">
                    Clique para selecionar arquivos
                  </span>
                  <span className="mt-2 text-xs leading-5 text-slate-400">
                    Fotos, PDF ou documentos · Máximo de 5 arquivos de até 10
                    MB cada
                  </span>
                </button>

                {arquivos.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {arquivos.map((arquivo, index) => (
                      <div
                        key={`${arquivo.name}-${arquivo.lastModified}`}
                        className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                          <FileText size={20} className="text-[#35a989]" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-700">
                            {arquivo.name}
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            {(arquivo.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => removerArquivo(index)}
                          aria-label={`Remover ${arquivo.name}`}
                          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {erro && (
                  <p
                    role="alert"
                    className="mt-3 flex items-center gap-2 text-sm text-rose-600"
                  >
                    <AlertTriangle size={16} />
                    {erro}
                  </p>
                )}
              </div>

              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4">
                <div className="flex items-start gap-3">
                  <LockKeyhole
                    size={20}
                    className="mt-0.5 shrink-0 text-[#278e70]"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Proteção das informações
                    </p>
                    <p className="mt-1 text-xs leading-6 text-slate-500">
                      Preencha somente as informações necessárias para
                      compreender o ocorrido. O tratamento e a confidencialidade
                      dos dados devem seguir as políticas aplicáveis da Maylon.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => router.back()}
                  disabled={enviando}
                  className="cursor-pointer rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={enviando}
                  className="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#35a989] px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-900/10 transition hover:bg-[#288c70] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {enviando ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      Enviando denúncia...
                    </>
                  ) : (
                    <>
                      <Send size={17} />
                      Enviar denúncia
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

          <aside className="space-y-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                  <Paperclip size={20} className="text-[#35a989]" />
                </div>
                <h3 className="font-semibold text-slate-800">
                  Como registrar?
                </h3>
              </div>

              <ol className="mt-5 space-y-4">
                {[
                  "Selecione o tipo de ocorrência.",
                  "Descreva os fatos com clareza.",
                  "Anexe evidências, se disponíveis.",
                  "Revise os dados antes de enviar.",
                ].map((item, index) => (
                  <li key={item} className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-[#278e70]">
                      {index + 1}
                    </span>
                    <p className="text-sm leading-6 text-slate-500">{item}</p>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}