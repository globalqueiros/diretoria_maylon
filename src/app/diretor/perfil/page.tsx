"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Car, Pencil, Settings, User, BadgeCheck, Lock } from "lucide-react";
import Link from "next/link";

type Usuario = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  profile_image: string | null;
  identification_number: string | null;
  identification_type: string | null;
  phone_verified_at: string | null;
  email_verified_at: string | null;
  tipo: "driver" | "customer";
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar");
    if (saved) setCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    const carregarUsuario = async () => {
      try {
        const res = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          window.location.href = "/";
          return;
        }

        const data = await res.json();

        if (!data || !data.id) {
          window.location.href = "/";
          return;
        }

        setUsuario(data);
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        window.location.href = "/";
      } finally {
        setLoading(false);
      }
    };

    carregarUsuario();
  }, []);

  const [imgSrc, setImgSrc] = useState("/favicon.ico");

  useEffect(() => {
    if (usuario?.profile_image) {
      setImgSrc(usuario.profile_image);
    }
  }, [usuario]);

  const formatPhoneBR = (phone: string) => {
    if (!phone) return "";
    let digits = phone.replace(/\D/g, "");
    if (digits.startsWith("55")) {
      digits = digits.slice(2);
    }
    if (digits.length === 11) {
      return digits.replace(/^(\d{2})(\d{5})(\d{4})$/, "($1) $2-$3");
    }
    return digits;
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setAlert({ type: "error", message: "Selecione uma imagem" });
      return;
    }
    const formData = new FormData();
    formData.append("file", selectedFile);
    try {
      const res = await fetch("/api/upload-photo", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setAlert({ type: "error", message: "Não foi possível enviar sua foto de perfil. Tente novamente em instantes." });
        return;
      }
      setImgSrc(data.url);
      setShowModal(false);
      setPreviewSrc(null);
      setSelectedFile(null);
      setAlert({ type: "success", message: "Foto de perfil atualizada com sucesso!" });
    } catch (error) {
      console.error(error);
      setAlert({ type: "error", message: "Ocorreu um erro inesperado. Tente novamente em instantes." });
    }
  };

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
    return () => {
      if (previewSrc) {
        URL.revokeObjectURL(previewSrc);
      }
    };
  }, [previewSrc]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-gray-400 p-8 rounded-2xl shadow-lg flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-300 font-medium">
            Aguarde, carregando página...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <div className="flex flex-col flex-1">
        <main className="p-6 bg-gray-50 min-h-screen">
          <div className="relative w-full h-[250px] rounded-2xl overflow-visible mb-17">
            <Image
              src="/bg-login.png"
              alt="Perfil"
              fill
              className="object-cover rounded-2xl"
              priority
            />
            <div className="absolute inset-0 bg-black/60 rounded-2xl"></div>
            {usuario && (
              <div className="absolute left-6 -bottom-12 z-10">
                <div className="relative w-24 h-24">
                  <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden bg-gray-200 shadow-lg">
                    <Image
                      src={imgSrc}
                      alt="Foto de perfil"
                      width={96}
                      height={96}
                      onError={() => setImgSrc("/favicon.ico")}
                      className="object-cover w-full h-full"
                    />
                  </div>
                  <button
                    className="absolute bottom-0 right-0 bg-teal-500 hover:bg-teal-600 p-2 cursor-pointer rounded-full shadow-md transition"
                    onClick={() => document.getElementById("uploadFoto")?.click()}
                  >
                    <Pencil size={16} className="text-white" />
                  </button>
                  <input
                    type="file"
                    id="uploadFoto"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const preview = URL.createObjectURL(file);
                        setPreviewSrc(preview);
                        setSelectedFile(file);
                        setShowModal(true);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </div>
          {alert && (
            <div
              className={`mb-4 px-4 py-3 rounded-xl shadow flex justify-between items-center ${alert.type === "success"
                ? "bg-green-100 text-green-700 border border-green-300"
                : "bg-red-100 text-red-700 border border-red-300"
                }`}
            >
              <span>{alert.message}</span>
            </div>
          )}
          {usuario && (
            <div className="bg-white rounded-2xl shadow p-5 flex flex-col md:flex-row justify-between items-start gap-4">
              <div>
                <h1 className="text-xl font-bold text-black font-bold">
                  {usuario.tipo === "driver" ? (
                    <span className="flex items-center gap-2">
                      <Car size={16} />
                      Dados do Motorista
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <User size={16} />
                      Dados do Passageiro
                    </span>
                  )}
                </h1>
                <div className="text-sm mt-2.5 space-y-3">
                  <p>
                    Nome Completo:{" "}
                    <span className="font-semibold">
                      {usuario.full_name}
                    </span>
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Telefone:</span>
                    <span className="flex items-center gap-2 font-semibold">
                      {formatPhoneBR(usuario.phone)}
                      {usuario.phone_verified_at ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <BadgeCheck size={14} />
                          Verificado
                        </span>
                      ) : (
                        <span className="text-sm text-red-500">Pendente de verificação</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">Email:</span>
                    <span className="flex items-center gap-2 font-semibold">
                      {usuario.email}
                      {usuario.email_verified_at ? (
                        <span className="flex items-center gap-1 text-green-600 text-sm">
                          <BadgeCheck size={14} />
                          Verificado
                        </span>
                      ) : (
                        <span className="text-sm text-red-500">
                          Pendente de verificação
                        </span>
                      )}
                    </span>
                  </div>
                  <p>
                    Nº de Identificação:{" "}
                    <span className="font-semibold">
                      {usuario.identification_number} / {usuario.identification_type}
                    </span>
                  </p>
                </div>
              </div>
              <Link
                href="/sessoes"
                className="flex items-center justify-center gap-2 px-5 py-2 text-xs rounded-xl font-semibold text-white bg-teal-500 hover:bg-teal-600 transition"
              >
                <Settings size={16} />
                Seus Dispositivos
              </Link>
            </div>
          )}
          <div className="bg-white rounded-2xl mt-4 shadow p-5 flex items-center justify-between">
            <h1 className="flex items-center gap-2 text-base font-bold text-black">
              <Lock size={16} className="text-teal-500" />
              Alterar Senha
            </h1>
            <button className="bg-teal-500 hover:bg-teal-600 text-sm text-white cursor-pointer px-4 py-2 rounded-xl text-sm">
              Atualizar
            </button>
          </div>
        </main>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl shadow-lg w-[300px] text-center">
            <h2 className="text-lg font-semibold">
              Confirmar nova foto
            </h2>
            {previewSrc && (
              <img
                src={previewSrc}
                alt="Preview"
                className="w-32 h-32 mx-auto rounded-full object-cover mt-4 my-6"
              />
            )}
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => {
                  setShowModal(false);
                  setPreviewSrc(null);
                  setSelectedFile(null);
                }}
                className="px-4 py-1.5 text-sm bg-red-400 hover:bg-red-300 cursor-pointer text-white rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="px-6 py-1 bg-teal-600 hover:bg-teal-500 cursor-pointer text-white text-sm text-white rounded-lg disabled:opacity-50"
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