"use client";

import { useState } from "react";
import {
  User,
  Bell,
  Lock,
  ShieldCheck,
  Smartphone,
  Mail,
  Phone,
  Eye,
  EyeOff,
  Save,
  ChevronRight,
  LogOut,
  Trash2,
} from "lucide-react";

export default function ConfiguracoesPage() {
  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [alert, setAlert] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const salvarConfiguracoes = () => {
    setAlert({
      type: "success",
      message: "Configurações atualizadas com sucesso!",
    });

    setTimeout(() => {
      setAlert(null);
    }, 3000);
  };

  const alterarSenha = () => {
    if (!password || !newPassword || !confirmPassword) {
      setAlert({
        type: "error",
        message: "Preencha todos os campos da senha.",
      });

      return;
    }

    if (newPassword !== confirmPassword) {
      setAlert({
        type: "error",
        message: "As senhas não são iguais.",
      });

      return;
    }

    if (newPassword.length < 6) {
      setAlert({
        type: "error",
        message:
          "A nova senha deve possuir pelo menos 6 caracteres.",
      });

      return;
    }

    setAlert({
      type: "success",
      message: "Senha alterada com sucesso!",
    });

    setPassword("");
    setNewPassword("");
    setConfirmPassword("");

    setTimeout(() => {
      setAlert(null);
    }, 3000);
  };

  return (
    <div className="min-h-screen">
      <main className="w-full">
        <div className="max-w-[1600px] mx-auto space-y-4">

          {/* =====================================================
              CABEÇALHO
          ====================================================== */}

          <section className="bg-white rounded-2xl shadow-sm px-5 md:px-7 py-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-[#d8f7eb] flex items-center justify-center">
                <User
                  size={21}
                  className="text-[#00a99d]"
                />
              </div>

              <div>
                <h1 className="text-lg md:text-xl font-bold text-[#102a43]">
                  Configurações
                </h1>

                <p className="text-xs md:text-sm text-[#607d94] mt-0.5">
                  Gerencie suas preferências e segurança da conta.
                </p>
              </div>
            </div>
          </section>

          {/* =====================================================
              ALERTA
          ====================================================== */}

          {alert && (
            <div
              className={`px-4 py-3 rounded-xl border text-sm font-medium ${
                alert.type === "success"
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-red-50 border-red-200 text-red-600"
              }`}
            >
              {alert.message}
            </div>
          )}

          {/* =====================================================
              PREFERÊNCIAS
          ====================================================== */}

          <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<Bell size={18} />}
              title="Preferências"
              description="Escolha como deseja receber suas notificações."
            />

            <div className="divide-y divide-[#edf1f3]">

              <SettingRow
                icon={<Bell size={17} />}
                title="Notificações"
                description="Receber notificações sobre sua conta e corridas."
                enabled={notifications}
                onChange={() =>
                  setNotifications(!notifications)
                }
              />

              <SettingRow
                icon={<Mail size={17} />}
                title="Notificações por e-mail"
                description="Receber informações importantes por e-mail."
                enabled={emailNotifications}
                onChange={() =>
                  setEmailNotifications(
                    !emailNotifications
                  )
                }
              />

              <SettingRow
                icon={<Phone size={17} />}
                title="Notificações por SMS"
                description="Receber avisos importantes por mensagem."
                enabled={smsNotifications}
                onChange={() =>
                  setSmsNotifications(!smsNotifications)
                }
              />

            </div>
          </section>

          {/* =====================================================
              SEGURANÇA
          ====================================================== */}

          <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<ShieldCheck size={18} />}
              title="Segurança"
              description="Proteja sua conta e gerencie seus acessos."
            />

            <div className="p-5 md:p-6">

              {/* Alterar senha */}

              <div className="border border-[#e8eef2] rounded-xl overflow-hidden">

                <div className="px-4 py-4 bg-[#fbfcfd] border-b border-[#e8eef2]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#d8f7eb] flex items-center justify-center">
                      <Lock
                        size={17}
                        className="text-[#00a99d]"
                      />
                    </div>

                    <div>
                      <h3 className="text-sm font-bold text-[#102a43]">
                        Alterar senha
                      </h3>

                      <p className="text-[11px] text-[#607d94]">
                        Atualize sua senha regularmente para manter
                        sua conta segura.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 md:p-5 space-y-4">

                  <PasswordInput
                    label="Senha atual"
                    value={password}
                    onChange={setPassword}
                    show={showPassword}
                    onToggle={() =>
                      setShowPassword(!showPassword)
                    }
                  />

                  <PasswordInput
                    label="Nova senha"
                    value={newPassword}
                    onChange={setNewPassword}
                    show={showNewPassword}
                    onToggle={() =>
                      setShowNewPassword(
                        !showNewPassword
                      )
                    }
                  />

                  <PasswordInput
                    label="Confirmar nova senha"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    show={showConfirmPassword}
                    onToggle={() =>
                      setShowConfirmPassword(
                        !showConfirmPassword
                      )
                    }
                  />

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={alterarSenha}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00a99d] hover:bg-[#008f85] text-white text-xs font-semibold transition cursor-pointer shadow-sm"
                    >
                      <Save size={15} />
                      Alterar senha
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </section>

          {/* =====================================================
              DISPOSITIVOS
          ====================================================== */}

          <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<Smartphone size={18} />}
              title="Dispositivos"
              description="Gerencie os dispositivos conectados à sua conta."
            />

            <div className="p-5 md:p-6">

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/sessoes";
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-[#e8eef2] bg-[#fbfcfd] hover:bg-[#f5faf8] transition cursor-pointer"
              >
                <div className="flex items-center gap-3">

                  <div className="w-10 h-10 rounded-xl bg-[#d8f7eb] flex items-center justify-center">
                    <Smartphone
                      size={18}
                      className="text-[#00a99d]"
                    />
                  </div>

                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-[#102a43]">
                      Seus dispositivos
                    </h3>

                    <p className="text-xs text-[#607d94] mt-0.5">
                      Visualizar e encerrar sessões ativas.
                    </p>
                  </div>

                </div>

                <ChevronRight
                  size={18}
                  className="text-[#7890a4]"
                />
              </button>

            </div>
          </section>

          {/* =====================================================
              CONTA
          ====================================================== */}

          <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <SectionHeader
              icon={<User size={18} />}
              title="Conta"
              description="Ações relacionadas à sua conta."
            />

            <div className="p-5 md:p-6 space-y-3">

              {/* Sair */}

              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-[#e8eef2] hover:bg-gray-50 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
                    <LogOut
                      size={18}
                      className="text-gray-600"
                    />
                  </div>

                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-[#102a43]">
                      Sair da conta
                    </h3>

                    <p className="text-xs text-[#607d94] mt-0.5">
                      Encerrar sua sessão neste dispositivo.
                    </p>
                  </div>
                </div>

                <ChevronRight
                  size={18}
                  className="text-[#7890a4]"
                />
              </button>

              {/* Excluir conta */}

              <button
                type="button"
                className="w-full flex items-center justify-between p-4 rounded-xl border border-red-100 bg-red-50/40 hover:bg-red-50 transition cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                    <Trash2
                      size={18}
                      className="text-red-500"
                    />
                  </div>

                  <div className="text-left">
                    <h3 className="text-sm font-semibold text-red-600">
                      Excluir conta
                    </h3>

                    <p className="text-xs text-red-400 mt-0.5">
                      Excluir permanentemente sua conta.
                    </p>
                  </div>
                </div>

                <ChevronRight
                  size={18}
                  className="text-red-300"
                />
              </button>

            </div>
          </section>

          {/* =====================================================
              BOTÃO SALVAR
          ====================================================== */}

          <div className="flex justify-end pb-2">
            <button
              type="button"
              onClick={salvarConfiguracoes}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#00a99d] hover:bg-[#008f85] text-white text-xs font-semibold transition shadow-sm cursor-pointer"
            >
              <Save size={16} />
              Salvar configurações
            </button>
          </div>

        </div>
      </main>
    </div>
  );
}

/* ================================================================
   HEADER DAS SEÇÕES
================================================================ */

function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="px-5 md:px-6 py-4 border-b border-[#edf1f3]">
      <div className="flex items-center gap-3">

        <div className="w-9 h-9 rounded-xl bg-[#d8f7eb] flex items-center justify-center text-[#00a99d]">
          {icon}
        </div>

        <div>
          <h2 className="text-sm md:text-base font-bold text-[#102a43]">
            {title}
          </h2>

          <p className="text-[11px] md:text-xs text-[#607d94] mt-0.5">
            {description}
          </p>
        </div>

      </div>
    </div>
  );
}

/* ================================================================
   LINHA DE CONFIGURAÇÃO
================================================================ */

function SettingRow({
  icon,
  title,
  description,
  enabled,
  onChange,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 md:px-6 py-4">

      <div className="flex items-center gap-3 min-w-0">

        <div className="w-9 h-9 shrink-0 rounded-lg bg-[#f1f8f5] flex items-center justify-center text-[#00a99d]">
          {icon}
        </div>

        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-[#102a43]">
            {title}
          </h3>

          <p className="text-[11px] text-[#607d94] mt-0.5">
            {description}
          </p>
        </div>

      </div>

      {/* Switch */}

      <button
        type="button"
        onClick={onChange}
        aria-label={title}
        className={`relative shrink-0 w-11 h-6 rounded-full transition cursor-pointer ${
          enabled
            ? "bg-[#00a99d]"
            : "bg-gray-300"
        }`}
      >
        <span
          className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${
            enabled
              ? "left-6"
              : "left-1"
          }`}
        />
      </button>

    </div>
  );
}

/* ================================================================
   INPUT DE SENHA
================================================================ */

function PasswordInput({
  label,
  value,
  onChange,
  show,
  onToggle,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#102a43] mb-1.5">
        {label}
      </label>

      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Digite sua senha"
          className="w-full h-10 rounded-xl border border-[#dfe7eb] bg-white px-3 pr-10 text-sm text-[#102a43] outline-none transition placeholder:text-[#a3b1bb] focus:border-[#00a99d] focus:ring-2 focus:ring-[#00a99d]/10"
        />

        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7890a4] hover:text-[#00a99d] cursor-pointer"
        >
          {show ? (
            <EyeOff size={16} />
          ) : (
            <Eye size={16} />
          )}
        </button>
      </div>
    </div>
  );
}