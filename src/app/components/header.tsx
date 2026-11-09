
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Bell,
  Check,
  CheckCheck,
  ChevronDown,
  Headset,
  LogOut,
  Menu,
  RefreshCw,
  Settings,
  User,
  X,
} from "lucide-react";

// ============================================
// TIPOS
// ============================================

type UserData = {
  id: string | number;
  name?: string;
  nome?: string;
  full_name?: string;
  fullName?: string;
  nome_completo?: string;
  username?: string;
  name_user?: string;
  email?: string;
  profile_image?: string | null;
  profileImage?: string | null;
  user_type?: string;
  user_level?: string;
};

type Notification = {
  id: string | number;
  title?: string;
  message?: string;
  description?: string;
  created_at?: string;
  read_at?: string | null;
  is_read?: boolean;
  read?: boolean;
};

type HeaderProps = {
  onMenuClick?: () => void;
};

// ============================================
// ROTAS DOS PERFIS
// ============================================

const BASE_POR_PERFIL: Record<string, string> = {
  diretor: "/diretor",
  gerente: "/gerente",
  supervisora: "/supervisora",
  supervisor: "/supervisor",
  atendente: "/atendente",
  marketing: "/marketing",
  comercial: "/comercial",
  promoter: "/promoter",
  promotor: "/promoter",
  driver: "/motorista",
  motorista: "/motorista",
  passenger: "/passageiro",
  passageiro: "/passageiro",
};

// ============================================
// HELPERS
// ============================================

function isNotificationRead(notification: Notification) {
  return (
    notification.read === true ||
    notification.is_read === true ||
    Boolean(notification.read_at)
  );
}

function getUserName(user: UserData | null) {
  return (
    user?.name?.trim() ||
    user?.nome?.trim() ||
    user?.nome_completo?.trim() ||
    user?.full_name?.trim() ||
    user?.fullName?.trim() ||
    user?.username?.trim() ||
    user?.name_user?.trim() ||
    "Usuário"
  );
}

function formatNotificationDate(date?: string) {
  if (!date) return "";

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function Header({ onMenuClick }: HeaderProps) {
  const pathname = usePathname();

  const [user, setUser] = useState<UserData | null>(null);

  const [notifications, setNotifications] = useState<Notification[]>([]);

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const [loadingUser, setLoadingUser] = useState(true);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  const [profileImageError, setProfileImageError] = useState(false);
  const [notificationError, setNotificationError] = useState(false);

  const profileRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  const notificationRequestRef = useRef(false);
  const notificationRequestId = useRef(0);

  // ============================================
  // DADOS DO USUÁRIO
  // ============================================

  const userName = useMemo(
    () => getUserName(user),
    [user]
  );

  const firstName = userName.split(/\s+/)[0];

  const profileImage =
    user?.profile_image ||
    user?.profileImage ||
    null;

  const hasProfileImage =
    Boolean(profileImage) && !profileImageError;

  const userType = (user?.user_type || "")
    .trim()
    .toLowerCase();

  const currentRoute = pathname?.split("/")[1]
    ? `/${pathname.split("/")[1]}`
    : "/atendente";

  const userBasePath =
    BASE_POR_PERFIL[userType] || currentRoute;

  const unreadNotifications = useMemo(
    () =>
      notifications.filter(
        (notification) => !isNotificationRead(notification)
      ).length,
    [notifications]
  );

  // ============================================
  // CARREGAR USUÁRIO
  // ============================================

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      try {
        setLoadingUser(true);

        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Não foi possível carregar o usuário.");
        }

        const data = await response.json();

        if (cancelled) return;

        const userData =
          data?.user ??
          data?.usuario ??
          data?.data?.user ??
          data?.data?.usuario ??
          data?.data ??
          data;

        if (!userData?.id) {
          throw new Error("Usuário não identificado.");
        }

        setUser({
          ...userData,

          name:
            userData.name ??
            userData.nome ??
            userData.nome_completo ??
            userData.full_name ??
            userData.fullName ??
            userData.username ??
            userData.name_user ??
            userData.display_name ??
            "Usuário",

          email:
            userData.email ??
            userData.email_address ??
            "",

          profile_image:
            userData.profile_image ??
            userData.profileImage ??
            userData.avatar_url ??
            userData.avatar ??
            userData.foto ??
            null,
        });
      } catch (error) {
        console.error("Erro ao carregar usuário:", error);
      } finally {
        if (!cancelled) {
          setLoadingUser(false);
        }
      }
    }

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================
  // CARREGAR NOTIFICAÇÕES
  // ============================================

  const fetchNotifications = useCallback(async () => {
    if (notificationRequestRef.current) return;

    notificationRequestRef.current = true;

    const requestId = ++notificationRequestId.current;

    setLoadingNotifications(true);
    setNotificationError(false);

    try {
      const response = await fetch("/api/notifications", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar notificações.");
      }

      const data = await response.json();

      const list: Notification[] = Array.isArray(data)
        ? data
        : data?.notifications ??
          data?.notificacoes ??
          data?.data?.notifications ??
          data?.data?.notificacoes ??
          [];

      if (requestId === notificationRequestId.current) {
        setNotifications(Array.isArray(list) ? list : []);
      }
    } catch (error) {
      console.error("Erro nas notificações:", error);
      setNotificationError(true);
    } finally {
      if (requestId === notificationRequestId.current) {
        notificationRequestRef.current = false;
        setLoadingNotifications(false);
      }
    }
  }, []);

  // ============================================
  // ATUALIZAÇÃO AUTOMÁTICA
  // ============================================

  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();

    const interval = window.setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => {
      window.clearInterval(interval);
    };
  }, [user?.id, fetchNotifications]);

  // ============================================
  // FOTO DE PERFIL
  // ============================================

  useEffect(() => {
    setProfileImageError(false);
  }, [profileImage]);

  // ============================================
  // FECHAR MENUS
  // ============================================

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;

      if (
        profileRef.current &&
        !profileRef.current.contains(target)
      ) {
        setProfileOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(target)
      ) {
        setNotificationOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setNotificationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // ============================================
  // MARCAR NOTIFICAÇÃO COMO LIDA
  // ============================================

  async function markNotificationAsRead(
    notification: Notification
  ) {
    if (isNotificationRead(notification)) return;

    const previousNotifications = notifications;

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? {
              ...item,
              read: true,
              is_read: true,
              read_at: new Date().toISOString(),
            }
          : item
      )
    );

    try {
      const response = await fetch(
        `/api/notifications/${encodeURIComponent(
          String(notification.id)
        )}`,
        {
          method: "PATCH",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: "mark_as_read",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao marcar como lida.");
      }
    } catch (error) {
      setNotifications(previousNotifications);
      console.error(error);
    }
  }

  // ============================================
  // MARCAR TODAS COMO LIDAS
  // ============================================

  async function markAllAsRead() {
    if (unreadNotifications === 0) return;

    const previousNotifications = notifications;

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        read: true,
        is_read: true,
        read_at:
          notification.read_at ||
          new Date().toISOString(),
      }))
    );

    try {
      const response = await fetch("/api/notifications", {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "mark_all_as_read",
        }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar notificações.");
      }

      await fetchNotifications();
    } catch (error) {
      setNotifications(previousNotifications);
      console.error(error);
    }
  }

  // ============================================
  // ABRIR MENUS
  // ============================================

  function toggleProfile() {
    setProfileOpen((current) => !current);
    setNotificationOpen(false);
  }

  function toggleNotifications() {
    const willOpen = !notificationOpen;

    setNotificationOpen(willOpen);
    setProfileOpen(false);

    if (willOpen) {
      fetchNotifications();
    }
  }

  // ============================================
  // RENDERIZAÇÃO
  // ============================================

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-3 shadow-sm sm:px-6">

      {/* MENU LATERAL */}

      <div className="flex min-w-0 items-center gap-3">

        <button
          type="button"
          onClick={onMenuClick}
          aria-label="Abrir ou recolher menu"
          aria-controls="sidebar"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-gray-600 transition hover:bg-[#e5f5ef] hover:text-[#27876d] focus:outline-none focus:ring-2 focus:ring-[#35a989]"
        >
          <Menu size={22} />
        </button>
      </div>

      {/* AÇÕES */}

      <div className="flex items-center gap-1 sm:gap-3">

        {/* NOTIFICAÇÕES */}

        <div ref={notificationRef} className="relative">

          <button
            type="button"
            onClick={toggleNotifications}
            aria-label={`Notificações: ${unreadNotifications} não lidas`}
            aria-expanded={notificationOpen}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl text-gray-600 transition hover:bg-gray-100 hover:text-[#27876d]"
          >
            <Bell size={21} />

            {unreadNotifications > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white ring-2 ring-white">
                {unreadNotifications > 99
                  ? "99+"
                  : unreadNotifications}
              </span>
            )}

          </button>

          {/* PAINEL DE NOTIFICAÇÕES */}

          {notificationOpen && (
            <div className="absolute right-0 top-12 z-[60] w-[min(370px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">

              {/* CABEÇALHO */}

              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-4">

                <div>
                  <h2 className="text-sm font-bold text-gray-900">
                    Notificações
                  </h2>

                  <p className="mt-1 text-xs text-gray-500">
                    {unreadNotifications} não lida(s)
                  </p>
                </div>

                <div className="flex items-center gap-1">

                  <button
                    type="button"
                    onClick={fetchNotifications}
                    disabled={loadingNotifications}
                    aria-label="Atualizar notificações"
                    className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 disabled:opacity-50"
                  >
                    <RefreshCw
                      size={16}
                      className={
                        loadingNotifications
                          ? "animate-spin"
                          : ""
                      }
                    />
                  </button>

                  <button
                    type="button"
                    onClick={() => setNotificationOpen(false)}
                    aria-label="Fechar notificações"
                    className="rounded-lg p-2 text-gray-500 transition hover:bg-gray-100"
                  >
                    <X size={17} />
                  </button>

                </div>

              </div>

              {/* MARCAR TODAS */}

              {unreadNotifications > 0 && (
                <div className="flex justify-end border-b border-gray-100 px-4 py-2">

                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="inline-flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-semibold text-[#27876d] transition hover:bg-[#e5f5ef]"
                  >
                    <CheckCheck size={15} />
                    Marcar todas como lidas
                  </button>

                </div>
              )}

              {/* LISTA */}

              <div className="max-h-[400px] overflow-y-auto">

                {loadingNotifications &&
                notifications.length === 0 ? (

                  <div className="px-4 py-10 text-center">
                    <RefreshCw
                      size={24}
                      className="mx-auto animate-spin text-[#35a989]"
                    />

                    <p className="mt-3 text-sm text-gray-500">
                      Carregando notificações...
                    </p>
                  </div>

                ) : notificationError &&
                  notifications.length === 0 ? (

                  <div className="px-4 py-10 text-center">

                    <p className="text-sm font-medium text-gray-700">
                      Não foi possível carregar.
                    </p>

                    <button
                      type="button"
                      onClick={fetchNotifications}
                      className="mt-3 text-xs font-semibold text-[#27876d] hover:underline"
                    >
                      Tentar novamente
                    </button>

                  </div>

                ) : notifications.length === 0 ? (

                  <div className="px-4 py-12 text-center">

                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <Bell size={23} className="text-gray-400" />
                    </div>

                    <p className="mt-3 text-sm font-semibold text-gray-700">
                      Nenhuma notificação
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      Você verá suas notificações aqui.
                    </p>

                  </div>

                ) : (

                  notifications.map((notification) => {
                    const isRead =
                      isNotificationRead(notification);

                    return (

                      <button
                        key={notification.id}
                        type="button"
                        onClick={() =>
                          markNotificationAsRead(notification)
                        }
                        disabled={isRead}
                        className={`block w-full border-b border-gray-100 px-4 py-4 text-left transition last:border-0 hover:bg-gray-50 ${
                          !isRead
                            ? "bg-[#e5f5ef]/50"
                            : "bg-white"
                        }`}
                      >

                        <div className="flex items-start gap-3">

                          <span
                            className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                              !isRead
                                ? "bg-[#35a989]"
                                : "bg-gray-300"
                            }`}
                          />

                          <div className="min-w-0 flex-1">

                            <div className="flex items-start justify-between gap-2">

                              <p className="text-sm font-semibold text-gray-800">
                                {notification.title || "Notificação"}
                              </p>

                              {!isRead && (
                                <span className="shrink-0 rounded-full bg-[#e5f5ef] px-2 py-0.5 text-[9px] font-bold text-[#27876d]">
                                  NOVA
                                </span>
                              )}

                            </div>

                            <p className="mt-1 whitespace-normal break-words text-sm leading-relaxed text-gray-600">
                              {notification.message ||
                                notification.description ||
                                "Você tem uma nova notificação."}
                            </p>

                            {notification.created_at && (
                              <p className="mt-2 text-[11px] text-gray-400">
                                {formatNotificationDate(
                                  notification.created_at
                                )}
                              </p>
                            )}

                            {!isRead && (
                              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[#27876d]">
                                <Check size={12} />
                                Clique para marcar como lida
                              </span>
                            )}

                          </div>

                        </div>

                      </button>

                    );
                  })

                )}

              </div>
            </div>
          )}

        </div>

        {/* PERFIL */}

        <div ref={profileRef} className="relative">

          <button
            type="button"
            onClick={toggleProfile}
            aria-label="Abrir perfil"
            aria-expanded={profileOpen}
            className="flex cursor-pointer items-center gap-2 rounded-xl p-1.5 transition hover:bg-gray-100 sm:gap-3 sm:pl-2"
          >

            {/* FOTO */}

            {hasProfileImage ? (

              <Image
                src={profileImage as string}
                alt={`Foto de ${userName}`}
                width={38}
                height={38}
                unoptimized
                onError={() => setProfileImageError(true)}
                className="h-9 w-9 rounded-full border border-gray-200 object-cover"
              />

            ) : (

              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e5f5ef] text-[#27876d]">
                <User size={19} />
              </span>

            )}

            {/* INFORMAÇÕES */}

            <span className="hidden min-w-0 text-left sm:block">

              <span className="block max-w-36 truncate text-sm font-semibold text-gray-800">
                {loadingUser ? "Carregando..." : firstName}
              </span>

              <span className="block max-w-36 truncate text-xs text-gray-500">
                {user?.email || "Minha conta"}
              </span>

            </span>

            <ChevronDown
              size={16}
              className={`hidden text-gray-500 transition sm:block ${
                profileOpen ? "rotate-180" : ""
              }`}
            />

          </button>

          {/* MENU DO PERFIL */}

          {profileOpen && (

            <div className="absolute right-0 top-12 z-[60] w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">

              {/* DADOS */}

              <div className="border-b border-gray-100 bg-gray-50 px-4 py-4">

                <div className="flex items-center gap-3">

                  {hasProfileImage ? (

                    <Image
                      src={profileImage as string}
                      alt={`Foto de ${userName}`}
                      width={44}
                      height={44}
                      unoptimized
                      className="h-11 w-11 rounded-full border border-gray-200 object-cover"
                    />

                  ) : (

                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e5f5ef] text-[#27876d]">
                      <User size={22} />
                    </div>

                  )}

                  <div className="min-w-0 flex-1">

                    <p className="truncate text-sm font-bold text-gray-900">
                      {userName}
                    </p>

                    <p className="mt-1 truncate text-xs text-gray-500">
                      {user?.email || ""}
                    </p>

                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-[#27876d]">
                      {user?.user_type || "Usuário"}
                    </p>

                  </div>

                </div>

              </div>

              {/* OPÇÕES */}

              <div className="space-y-1 p-2">

                <Link
                  href={`${userBasePath}/perfil`}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-700 transition hover:bg-[#e5f5ef] hover:text-[#27876d]"
                >
                  <User size={18} />
                  Meu perfil
                </Link>

                <Link
                  href={`${userBasePath}/configuracoes`}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-700 transition hover:bg-[#e5f5ef] hover:text-[#27876d]"
                >
                  <Settings size={18} />
                  Configurações
                </Link>

                <Link
                  href={`${userBasePath}/central_ajuda`}
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-gray-700 transition hover:bg-[#e5f5ef] hover:text-[#27876d]"
                >
                  <Headset size={18} />
                  Central de ajuda
                </Link>

                <div className="my-2 border-t border-gray-100" />

                <Link
                  href="/saindo"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                >
                  <LogOut size={18} />
                  Sair da conta
                </Link>

              </div>

            </div>

          )}

        </div>

      </div>

    </header>
  );
}