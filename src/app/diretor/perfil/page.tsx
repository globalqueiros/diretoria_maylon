"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Car,
  Pencil,
  Settings,
  User,
  BadgeCheck,
  Lock,
} from "lucide-react";

type Usuario = {
  id: number;
  matricula?: number | string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  profile_image: string | null;
  identification_number: string | null;
  identification_type: string | null;
  phone_verified_at: string | null;
  email_verified_at: string | null;
  tipo?: "driver" | "customer" | string | null;
  user_type?: string | null;
  status?: string | null;
};

type AlertState = {
  type: "success" | "error";
  message: string;
} | null;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);

  const [imgSrc, setImgSrc] = useState("/favicon.ico");

  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [alert, setAlert] = useState<AlertState>(null);

  /*
   * ============================================================
   * CARREGAR USUÁRIO
   * ============================================================
   */
  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        const res = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          window.location.href = "/";
          return;
        }

        const data: Usuario = await res.json();

        if (!data || !data.id) {
          window.location.href = "/";
          return;
        }

        setUsuario(data);

        if (data.profile_image) {
          setImgSrc(data.profile_image);
        }
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    };

    carregarUsuario();
  }, []);

  /*
   * ============================================================
   * ALERTA
   * ============================================================
   */
  useEffect(() => {
    if (!alert) return;

    const timer = setTimeout(() => {
      setAlert(null);
    }, 3000);

    return () => clearTimeout(timer);
  }, [alert]);

  /*
   * ============================================================
   * FORMATAR TELEFONE
   * ============================================================
   */
  const formatPhoneBR = (phone: string | null): string => {
    if (!phone) {
      return "Não informado";
    }

    let digits = phone.replace(/\D/g, "");

    if (digits.startsWith("55")) {
      digits = digits.slice(2);
    }

    if (digits.length === 11) {
      return digits.replace(
        /^(\d{2})(\d{5})(\d{4})$/,
        "($1) $2-$3"
      );
    }

    if (digits.length === 10) {
      return digits.replace(
        /^(\d{2})(\d{4})(\d{4})$/,
        "($1) $2-$3"
      );
    }

    return digits;
  };

  /*
   * ============================================================
   * UPLOAD DA FOTO
   * ============================================================
   */
  const handleUpload = async () => {
    if (!selectedFile) {
      setAlert({
        type: "error",
        message: "Selecione uma imagem.",
      });

      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();

      formData.append("file", selectedFile);

      const res = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setAlert({
          type: "error",
          message:
            data?.message ||
            "Não foi possível enviar sua foto. Tente novamente.",
        });

        return;
      }

      if (!data?.url) {
        setAlert({
          type: "error",
          message:
            "A foto foi enviada, mas a URL não foi retornada.",
        });

        return;
      }

      setImgSrc(data.url);

      if (usuario) {
        setUsuario({
          ...usuario,
          profile_image: data.url,
        });
      }

      if (previewSrc) {
        URL.revokeObjectURL(previewSrc);
      }

      setShowModal(false);
      setPreviewSrc(null);
      setSelectedFile(null);

      setAlert({
        type: "success",
        message: "Foto de perfil atualizada com sucesso!",
      });
    } catch (error) {
      console.error("Erro no upload:", error);

      setAlert({
        type: "error",
        message:
          "Ocorreu um erro inesperado. Tente novamente.",
      });
    } finally {
      setUploading(false);
    }
  };

  /*
   * ============================================================
   * SELECIONAR FOTO
   * ============================================================
   */
  const handleSelectPhoto = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    /*
     * Verificar tipo do arquivo
     */
    if (!file.type.startsWith("image/")) {
      setAlert({
        type: "error",
        message: "Selecione apenas arquivos de imagem.",
      });

      event.target.value = "";
      return;
    }

    /*
     * Limite de 5MB
     */
    if (file.size > 5 * 1024 * 1024) {
      setAlert({
        type: "error",
        message: "A imagem deve ter no máximo 5MB.",
      });

      event.target.value = "";
      return;
    }

    /*
     * Remover preview anterior
     */
    if (previewSrc) {
      URL.revokeObjectURL(previewSrc);
    }

    const preview = URL.createObjectURL(file);

    setPreviewSrc(preview);
    setSelectedFile(file);
    setShowModal(true);

    event.target.value = "";
  };

  /*
   * ============================================================
   * CANCELAR UPLOAD
   * ============================================================
   */
  const handleCancelUpload = () => {
    if (previewSrc) {
      URL.revokeObjectURL(previewSrc);
    }

    setShowModal(false);
    setPreviewSrc(null);
    setSelectedFile(null);
  };

  /*
   * ============================================================
   * FECHAR MODAL CLICANDO FORA
   * ============================================================
   */
  const handleModalBackgroundClick = (
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (
      event.target === event.currentTarget &&
      !uploading
    ) {
      handleCancelUpload();
    }
  };

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */
  if (loading) {
    return (
      <div className="min-h-screen bg-[#40b99d] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl px-8 py-7 flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-[#00a99d]/20 border-t-[#00a99d] animate-spin" />

          <p className="text-sm font-medium text-[#102a43] text-center">
            Aguarde, carregando página...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <main className="w-full">
        <div className="max-w-[1600px] mx-auto space-y-4">

          {/* =====================================================
              ALERTA
          ====================================================== */}
          {alert && (
            <div
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-sm text-sm font-medium ${
                alert.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}
            >
              <span className="break-words">
                {alert.message}
              </span>

              <button
                type="button"
                onClick={() => setAlert(null)}
                className="shrink-0 text-lg leading-none opacity-60 hover:opacity-100 transition"
                aria-label="Fechar alerta"
              >
                ×
              </button>
            </div>
          )}

          {/* =====================================================
              CAPA / PERFIL
          ====================================================== */}
          <section className="relative bg-white rounded-2xl shadow-sm overflow-visible">

            {/* Banner */}
            <div className="relative h-[210px] sm:h-[225px] md:h-[250px] overflow-hidden rounded-t-2xl">

              <Image
                src="/bg-fundo.png"
                alt="Capa do perfil"
                fill
                priority
                className="object-cover"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-[#102a43]/65" />

              {/* Conteúdo do banner */}
              <div className="absolute inset-0 flex items-center px-5 sm:px-6 md:px-8">
                <div className="text-white ml-28 sm:ml-32 md:ml-36">
                  <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
                    {usuario?.full_name || "Usuário"}
                  </h1>
                  <p className="text-sm capitalize text-white/75 mt-1">
                    {usuario?.user_type || "Usuário"}
                  </p>

                </div>
              </div>
            </div>

            {/* =================================================
                FOTO DE PERFIL
            ================================================== */}
            {usuario && (
              <div className="absolute left-5 sm:left-6 md:left-8 top-[145px] sm:top-[160px] md:top-[185px] z-20">

                <div className="relative">

                  {/* Foto */}
                  <div className="w-24 h-24 sm:w-26 sm:h-26 md:w-28 md:h-28 rounded-full border-4 border-white bg-[#d8f7eb] overflow-hidden shadow-lg">

                    <Image
                      src={imgSrc}
                      alt="Foto de perfil"
                      width={112}
                      height={112}
                      onError={() => setImgSrc("/favicon.ico")}
                      className="w-full h-full object-cover"
                    />

                  </div>

                  {/* Botão editar */}
                  <button
                    type="button"
                    onClick={() =>
                      document
                        .getElementById("uploadFoto")
                        ?.click()
                    }
                    className="absolute right-0 bottom-0 w-9 h-9 rounded-full bg-[#00a99d] hover:bg-[#008f85] text-white flex items-center justify-center shadow-md transition cursor-pointer"
                    title="Alterar foto"
                    aria-label="Alterar foto de perfil"
                  >
                    <Pencil size={16} />
                  </button>

                  {/* Input */}
                  <input
                    type="file"
                    id="uploadFoto"
                    accept="image/png,image/jpeg,image/webp"
                    className="hidden"
                    onChange={handleSelectPhoto}
                  />

                </div>
              </div>
            )}

            {/* =================================================
                DADOS BÁSICOS
            ================================================== */}
            {usuario && (
              <div className="pt-16 sm:pt-18 md:pt-20 px-4 sm:px-5 md:px-7 pb-6">

                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">

                  {/* Título */}
                  <div>
                    <div className="flex items-center gap-2">

                      <div className="w-9 h-9 rounded-xl bg-[#d8f7eb] flex items-center justify-center shrink-0">

                        {usuario.tipo === "driver" ? (
                          <Car
                            size={18}
                            className="text-[#00a99d]"
                          />
                        ) : (
                          <User
                            size={18}
                            className="text-[#00a99d]"
                          />
                        )}

                      </div>

                      <div>

                        <h2 className="text-base md:text-lg font-bold text-[#102a43]">
                          {usuario.tipo === "driver"
                            ? "Dados do Motorista"
                            : "Dados do Passageiro"}
                        </h2>

                        <p className="text-xs text-[#607d94]">
                          Informações da sua conta
                        </p>

                      </div>

                    </div>
                  </div>

                  {/* Seus dispositivos */}
                  <Link
                    href="/sessoes"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#00a99d] hover:bg-[#008f85] text-white text-xs font-semibold transition shadow-sm"
                  >
                    <Settings size={15} />

                    Seus Dispositivos
                  </Link>

                </div>

                {/* =================================================
                    INFORMAÇÕES
                ================================================== */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">

                  {/* Nome */}
                  <InfoCard
                    label="Nome Completo"
                    value={usuario.full_name}
                  />

                  {/* Telefone */}
                  <InfoCard
                    label="Telefone"
                    value={formatPhoneBR(usuario.phone)}
                    status={
                      usuario.phone_verified_at
                        ? "Verificado"
                        : "Pendente de verificação"
                    }
                    verified={
                      !!usuario.phone_verified_at
                    }
                  />

                  {/* E-mail */}
                  <InfoCard
                    label="E-mail"
                    value={usuario.email}
                    status={
                      usuario.email_verified_at
                        ? "Verificado"
                        : "Pendente de verificação"
                    }
                    verified={
                      !!usuario.email_verified_at
                    }
                  />

                  {/* Identificação */}
                  <InfoCard
                    label="Nº de Identificação"
                    value={
                      usuario.identification_number
                        ? `${usuario.identification_number}${
                            usuario.identification_type
                              ? ` / ${usuario.identification_type}`
                              : ""
                          }`
                        : "Não informado"
                    }
                  />

                </div>
              </div>
            )}
          </section>

          {/* =====================================================
              ALTERAR SENHA
          ====================================================== */}
          <section className="bg-white rounded-2xl shadow-sm px-4 sm:px-5 md:px-6 py-5">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

              <div className="flex items-center gap-3">

                <div className="w-10 h-10 rounded-xl bg-[#d8f7eb] flex items-center justify-center shrink-0">
                  <Lock
                    size={18}
                    className="text-[#00a99d]"
                  />
                </div>

                <div>

                  <h2 className="text-base font-bold text-[#102a43]">
                    Alterar Senha
                  </h2>

                  <p className="text-xs text-[#607d94] mt-0.5">
                    Mantenha sua conta segura
                  </p>

                </div>

              </div>

              <button
                type="button"
                className="w-full sm:w-auto inline-flex items-center justify-center bg-[#00a99d] hover:bg-[#008f85] text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition cursor-pointer shadow-sm"
              >
                Atualizar
              </button>

            </div>
          </section>

          {/* =====================================================
              CHILDREN
          ====================================================== */}
          {children}

        </div>
      </main>

      {/* =========================================================
          MODAL DE FOTO
      ========================================================== */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 bg-[#102a43]/60 backdrop-blur-sm flex items-center justify-center px-4 py-6 overflow-y-auto"
          onClick={handleModalBackgroundClick}
        >
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 sm:p-6 my-auto">

            {/* Título */}
            <div className="text-center">

              <h2 className="text-lg font-bold text-[#102a43]">
                Confirmar nova foto
              </h2>

              <p className="text-xs text-[#607d94] mt-1">
                Confira a imagem antes de salvar.
              </p>

            </div>

            {/* Preview */}
            {previewSrc && (
              <div className="flex justify-center my-6">

                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full overflow-hidden border-4 border-[#d8f7eb] shadow-md">

                  <img
                    src={previewSrc}
                    alt="Preview da foto"
                    className="w-full h-full object-cover"
                  />

                </div>
              </div>
            )}

            {/* Botões */}
            <div className="flex flex-col-reverse sm:flex-row gap-2">

              <button
                type="button"
                onClick={handleCancelUpload}
                disabled={uploading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#00a99d] hover:bg-[#008f85] text-white text-xs font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? "Salvando..." : "Salvar"}
              </button>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/*
 * ================================================================
 * COMPONENTE DE INFORMAÇÃO
 * ================================================================
 */
function InfoCard({
  label,
  value,
  status,
  verified,
}: {
  label: string;
  value: string | null | undefined;
  status?: string;
  verified?: boolean;
}) {
  /*
   * Se o valor vier null, undefined ou vazio,
   * mostra "Não informado".
   */
  const displayValue =
    typeof value === "string" && value.trim() !== ""
      ? value
      : "Não informado";

  return (
    <div className="rounded-xl border border-[#e8eef2] bg-[#fbfcfd] px-4 py-3">

      {/* Label */}
      <p className="text-[11px] font-medium uppercase tracking-wide text-[#7890a4]">
        {label}
      </p>

      {/* Valor */}
      <div className="flex flex-wrap items-center gap-2 mt-1">

        <p className="text-sm font-semibold text-[#102a43] break-all">
          {displayValue}
        </p>

        {/* Status */}
        {status && (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-1 rounded-full ${
              verified
                ? "bg-[#d8f7eb] text-[#008f78]"
                : "bg-red-50 text-red-500"
            }`}
          >
            {verified && (
              <BadgeCheck size={12} />
            )}

            {status}
          </span>
        )}

      </div>
    </div>
  );
}