"use client";

import { useEffect, useState } from "react";
import type { ReactNode, FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  Check,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  Monitor,
  Save,
  Settings2,
  ShieldCheck,
  Smartphone,
  UserRound,
  X,
} from "lucide-react";

// Ajuste estas rotas conforme o seu projeto.
const ROTA_SESSOES = "/comercial/sessoes";
const ROTA_LOGIN = "/";

type FeedbackState = {
  type: "success" | "error";
  message: string;
} | null;

type SectionHeaderProps = {
  icon: ReactNode;
  title: string;
  description: string;
  badge?: string;
};

type SettingRowProps = {
  icon: ReactNode;
  title: string;
  description: string;
  enabled: boolean;
  onChange: () => void;
};

type PasswordFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  visible: boolean;
  onToggle: () => void;
  autoComplete: "current-password" | "new-password";
};

const MENU = [
  {
    id: "preferencias",
    label: "Preferências",
    subtitle: "Notificações",
    icon: Settings2,
  },
  {
    id: "seguranca",
    label: "Segurança",
    subtitle: "Senha e proteção",
    icon: ShieldCheck,
  },
  {
    id: "dispositivos",
    label: "Dispositivos",
    subtitle: "Sessões ativas",
    icon: Smartphone,
  },
  {
    id: "conta",
    label: "Minha conta",
    subtitle: "Acesso e sessão",
    icon: UserRound,
  },
] as const;

export default function ConfiguracoesPage() {
  const router = useRouter();

  const [notifications, setNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);

  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [activeSection, setActiveSection] = useState<string>("preferencias");
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  function notify(type: "success" | "error", message: string) {
    setFeedback({ type, message });
  }

  // Avisos de sucesso somem sozinhos; erros ficam até serem fechados.
  useEffect(() => {
    if (!feedback || feedback.type !== "success") return;

    const timer = window.setTimeout(() => setFeedback(null), 5000);

    return () => window.clearTimeout(timer);
  }, [feedback]);

  // Carrega as preferências persistidas do usuário.
  useEffect(() => {
    let ativo = true;

    fetch("/api/me/preferences", { cache: "no-store", credentials: "same-origin" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!ativo || !data) return;
        setNotifications(Boolean(data.notifications ?? true));
        setEmailNotifications(Boolean(data.email_notifications ?? true));
        setSmsNotifications(Boolean(data.sms_notifications ?? false));
      })
      .catch(() => null);

    return () => {
      ativo = false;
    };
  }, []);

  // Destaca no menu a seção que está visível na tela.
  useEffect(() => {
    const elementos = MENU.map((item) =>
      document.getElementById(item.id)
    ).filter((el): el is HTMLElement => el !== null);

    if (elementos.length === 0) return;

    const observer = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            setActiveSection(entrada.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -60% 0px" }
    );

    elementos.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  async function saveSettings() {
    if (saving) return;

    setSaving(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/me/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          notifications,
          email_notifications: emailNotifications,
          sms_notifications: smsNotifications,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || "Não foi possível salvar as preferências.");
      }

      notify("success", "Preferências salvas com sucesso!");
    } catch (error) {
      notify(
        "error",
        error instanceof Error ? error.message : "Erro ao salvar as preferências."
      );
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!password || !newPassword || !confirmPassword) {
      notify("error", "Preencha todos os campos da senha.");
      return;
    }

    if (newPassword.length < 8) {
      notify("error", "A nova senha deve ter pelo menos 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      notify("error", "As senhas informadas não coincidem.");
      return;
    }

    if (password === newPassword) {
      notify("error", "A nova senha deve ser diferente da atual.");
      return;
    }

    setSavingPassword(true);
    setFeedback(null);

    try {
      const response = await fetch("/api/me/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          current_password: password,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.message || data?.error || "Não foi possível alterar a senha."
        );
      }

      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      notify("success", "Senha alterada com sucesso!");
    } catch (error) {
      notify(
        "error",
        error instanceof Error ? error.message : "Erro ao alterar a senha."
      );
    } finally {
      setSavingPassword(false);
    }
  }

  function scrollToSection(id: string) {
    setActiveSection(id);

    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  async function logout() {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
    }).catch(() => null);

    localStorage.removeItem("token");
    sessionStorage.clear();
    router.replace(ROTA_LOGIN);
  }

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-8xl">
        <header className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Configurações
            </h1>

            <p className="mt-0 text-sm leading-6 text-white">
              Gerencie suas preferências, segurança e acesso à sua conta.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start rounded-xl border border-[#e6ecee] bg-white px-4 py-3 shadow-sm sm:self-auto">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e3f6f0] text-[#078b7d]">
              <ShieldCheck size={21} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#2b404b]">
                Segurança da conta
              </p>
              <p className="mt-1 text-xs text-[#8996a0]">
                Gerencie sua proteção
              </p>
            </div>
          </div>
        </header>

        {feedback && (
          <div
            role={feedback.type === "error" ? "alert" : "status"}
            aria-live={feedback.type === "error" ? "assertive" : "polite"}
            className={`mb-6 flex items-center gap-3 rounded-xl border p-4 ${
              feedback.type === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback.type === "success" ? (
              <Check size={19} className="shrink-0" />
            ) : (
              <X size={19} className="shrink-0" />
            )}

            <p className="flex-1 text-sm font-medium">{feedback.message}</p>

            <button
              type="button"
              aria-label="Fechar aviso"
              onClick={() => setFeedback(null)}
              className="rounded-md p-1 hover:bg-black/5"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-6">
            <div className="rounded-2xl border border-[#e6ecef] bg-white p-3 shadow-sm">
              <p className="px-3 pb-3 pt-2 text-[10px] font-bold tracking-[0.16em] text-[#9aa6ae]">
                CONFIGURAÇÕES DA CONTA
              </p>

              <nav
                aria-label="Navegação das configurações"
                className="grid grid-cols-2 gap-1 lg:grid-cols-1"
              >
                {MENU.map((item) => {
                  const Icon = item.icon;
                  const selected = activeSection === item.id;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => scrollToSection(item.id)}
                      aria-current={selected ? "location" : undefined}
                      className={`flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                        selected
                          ? "bg-[#e6f6f1] text-[#087d70]"
                          : "text-[#687b87] hover:bg-[#f5f8f9]"
                      }`}
                    >
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                          selected
                            ? "bg-white text-[#078b7d] shadow-sm"
                            : "bg-[#f3f6f7] text-[#81919b]"
                        }`}
                      >
                        <Icon size={18} />
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">
                          {item.label}
                        </span>
                        <span className="mt-1 hidden truncate text-[11px] text-[#8a9aa3] sm:block">
                          {item.subtitle}
                        </span>
                      </span>

                      {selected && (
                        <span className="hidden h-5 w-1 rounded-full bg-[#078b7d] lg:block" />
                      )}
                    </button>
                  );
                })}
              </nav>

              <div className="mt-4 border-t border-[#edf1f3] px-3 py-4">
                <div className="flex items-start gap-2.5">
                  <LockKeyhole
                    size={16}
                    className="mt-0.5 shrink-0 text-[#078b7d]"
                  />
                  <div>
                    <p className="text-xs font-semibold text-[#344954]">
                      Mantenha sua conta segura
                    </p>
                    <p className="mt-1 text-[11px] leading-5 text-[#8796a0]">
                      Use uma senha exclusiva e verifique seus dispositivos.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="min-w-0 space-y-6">
            {/* PREFERÊNCIAS */}
            <section
              id="preferencias"
              className="scroll-mt-6 overflow-hidden rounded-2xl border border-[#e6ecef] bg-white shadow-sm"
            >
              <SectionHeader
                icon={<Bell size={19} />}
                title="Preferências de notificações"
                description="Escolha como deseja receber avisos e atualizações."
                badge="3 opções"
              />

              <div className="divide-y divide-[#edf1f3] px-5 sm:px-7">
                <SettingRow
                  icon={<Bell size={18} />}
                  title="Notificações gerais"
                  description="Receba alertas sobre sua conta e atividades."
                  enabled={notifications}
                  onChange={() => setNotifications((v) => !v)}
                />

                <SettingRow
                  icon={<Mail size={18} />}
                  title="Notificações por e-mail"
                  description="Receba informações importantes diretamente no seu e-mail."
                  enabled={emailNotifications}
                  onChange={() => setEmailNotifications((v) => !v)}
                />

                <SettingRow
                  icon={<Smartphone size={18} />}
                  title="Notificações por SMS"
                  description="Receba avisos importantes por mensagem de texto."
                  enabled={smsNotifications}
                  onChange={() => setSmsNotifications((v) => !v)}
                />
              </div>

              <div className="flex flex-col justify-between gap-3 border-t border-[#edf1f3] bg-[#fbfcfd] px-5 py-4 sm:flex-row sm:items-center sm:px-7">
                <p className="text-xs leading-5 text-[#86949e]">
                  Salve suas preferências para continuar.
                </p>

                <button
                  type="button"
                  onClick={saveSettings}
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#078b7d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#06766b] disabled:cursor-wait disabled:opacity-60"
                >
                  <Save size={16} />
                  {saving ? "Salvando..." : "Salvar preferências"}
                </button>
              </div>
            </section>

            {/* SEGURANÇA */}
            <section
              id="seguranca"
              className="scroll-mt-6 overflow-hidden rounded-2xl border border-[#e6ecef] bg-white shadow-sm"
            >
              <SectionHeader
                icon={<ShieldCheck size={19} />}
                title="Segurança da conta"
                description="Gerencie suas credenciais e mantenha sua conta protegida."
              />

              <div className="p-5 sm:p-7">
                <div className="overflow-hidden rounded-xl border border-[#e7edef]">
                  <div className="flex items-center gap-3 border-b border-[#e9eff1] bg-[#fafcfc] px-4 py-4 sm:px-5">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e3f6f0] text-[#078b7d]">
                      <KeyRound size={19} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-[#2b404b]">
                        Alterar senha
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-[#84939d]">
                        Escolha uma senha forte com pelo menos 8 caracteres.
                      </p>
                    </div>
                  </div>

                  <form
                    onSubmit={changePassword}
                    className="space-y-5 p-4 sm:p-5"
                  >
                    <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
                      <PasswordField
                        id="current-password"
                        label="Senha atual"
                        value={password}
                        onChange={setPassword}
                        visible={showPassword}
                        onToggle={() => setShowPassword((v) => !v)}
                        autoComplete="current-password"
                      />

                      <div className="hidden xl:block" />

                      <PasswordField
                        id="new-password"
                        label="Nova senha"
                        value={newPassword}
                        onChange={setNewPassword}
                        visible={showNewPassword}
                        onToggle={() => setShowNewPassword((v) => !v)}
                        autoComplete="new-password"
                      />

                      <PasswordField
                        id="confirm-password"
                        label="Confirmar nova senha"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        visible={showConfirmPassword}
                        onToggle={() => setShowConfirmPassword((v) => !v)}
                        autoComplete="new-password"
                      />
                    </div>

                    <div className="flex flex-col gap-3 border-t border-[#edf1f3] pt-5 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs leading-5 text-[#87959e]">
                        Nunca compartilhe sua senha com terceiros.
                      </p>

                      <button
                        type="submit"
                        disabled={savingPassword}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#078b7d] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#06766b] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <LockKeyhole size={16} />
                        {savingPassword ? "Salvando..." : "Atualizar senha"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </section>

            {/* DISPOSITIVOS */}
            <section
              id="dispositivos"
              className="scroll-mt-6 overflow-hidden rounded-2xl border border-[#e6ecef] bg-white shadow-sm"
            >
              <SectionHeader
                icon={<Monitor size={19} />}
                title="Dispositivos e sessões"
                description="Gerencie os dispositivos conectados à sua conta."
              />

              <div className="p-5 sm:p-7">
                <button
                  type="button"
                  onClick={() => router.push(ROTA_SESSOES)}
                  className="group flex w-full items-center gap-4 rounded-xl border border-[#e6ecef] p-4 text-left transition hover:border-[#b9dfd5] hover:bg-[#f8fcfa] sm:p-5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#e3f6f0] text-[#078b7d] transition group-hover:bg-[#d5f0e8]">
                    <Smartphone size={20} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-[#2b404b]">
                      Gerenciar dispositivos
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[#84939d]">
                      Visualize suas sessões e encerre acessos desconhecidos.
                    </p>
                  </div>

                  <ChevronRight
                    size={19}
                    className="shrink-0 text-[#98a5ae] transition group-hover:translate-x-1 group-hover:text-[#078b7d]"
                  />
                </button>
              </div>
            </section>

            {/* CONTA */}
            <section
              id="conta"
              className="scroll-mt-6 overflow-hidden rounded-2xl border border-[#e6ecef] bg-white shadow-sm"
            >
              <SectionHeader
                icon={<UserRound size={19} />}
                title="Minha conta"
                description="Gerencie o acesso à sua conta neste dispositivo."
              />

              <div className="p-5 sm:p-7">
                <div className="flex flex-col gap-4 rounded-xl border border-[#f0dddd] p-4 sm:flex-row sm:items-center sm:p-5">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff0ef] text-[#c45454]">
                    <LogOut size={20} />
                  </div>

                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-[#2b404b]">
                      Sair da conta
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[#84939d]">
                      Encerre sua sessão neste dispositivo.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#edcccc] px-4 py-2.5 text-sm font-semibold text-[#bd4848] transition hover:bg-[#fff2f1]"
                  >
                    <LogOut size={16} />
                    Sair da conta
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

/* Cabeçalho de cada seção */
function SectionHeader({
  icon,
  title,
  description,
  badge,
}: SectionHeaderProps) {
  return (
    <div className="flex items-center gap-3 border-b border-[#edf1f3] px-5 py-5 sm:px-7">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#e3f6f0] text-[#078b7d]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="text-base font-bold text-[#172d3a]">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-[#84939d]">{description}</p>
      </div>

      {badge && (
        <span className="shrink-0 rounded-full bg-[#e6f6f1] px-3 py-1 text-[11px] font-semibold text-[#087d70]">
          {badge}
        </span>
      )}
    </div>
  );
}

/* Linha com botão liga/desliga */
function SettingRow({
  icon,
  title,
  description,
  enabled,
  onChange,
}: SettingRowProps) {
  return (
    <div className="flex items-center gap-4 py-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f3f6f7] text-[#7c8d98]">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#2b404b]">{title}</p>
        <p className="mt-1 text-xs leading-5 text-[#84939d]">{description}</p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={title}
        onClick={onChange}
        className={`relative h-6 w-11 shrink-0 rounded-full transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#078b7d] focus-visible:ring-offset-2 ${
          enabled ? "bg-[#078b7d]" : "bg-[#cfd8dd]"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            enabled ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

/* Campo de senha com botão de mostrar/ocultar */
function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggle,
  autoComplete,
}: PasswordFieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-xs font-semibold text-[#4a5f6b]"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          autoComplete={autoComplete}
          className="w-full rounded-lg border border-[#dfe6e9] bg-[#fbfcfd] py-3 pl-4 pr-12 text-sm text-[#203440] outline-none transition placeholder:text-[#a2aeb6] focus:border-[#078b7d] focus:bg-white focus:ring-4 focus:ring-[#078b7d]/10"
        />

        <button
          type="button"
          onClick={onToggle}
          aria-label={visible ? "Ocultar senha" : "Mostrar senha"}
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-[#8a9aa3] transition hover:bg-[#f0f4f5] hover:text-[#078b7d]"
        >
          {visible ? <EyeOff size={17} /> : <Eye size={17} />}
        </button>
      </div>
    </div>
  );
}