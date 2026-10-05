"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Menu,
  Bell,
  ChevronDown,
  User,
  Settings,
  Headset,
  LogOut,
  CheckCheck,
  X,
} from "lucide-react";

type UserData = {
  id: number;
  full_name: string;
  email: string;
  profile_image?: string | null;
  user_type: string;
};

type HeaderProps = {
  toggleSidebar: () => void;
};

type Notification = {
  id: number;
  title: string;
  message: string;
  created_at: string;
  is_read: number | boolean;
};

export default function Header({ toggleSidebar }: HeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [imgSrc, setImgSrc] = useState("/foto_perfil.png");
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState(false);

  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchUser() {
      try {
        const response = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!response.ok) return;

        const data: UserData = await response.json();

        if (!cancelled) {
          setUser(data);
        }
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
      }
    }

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, []);

  async function fetchNotifications() {
    try {
      setNotificationsLoading(true);
      setNotificationsError(false);

      const response = await fetch("/api/notifications", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar notificações");
      }

      const data = await response.json();

      const notificationData = Array.isArray(data)
        ? data
        : data.notifications;

      if (Array.isArray(notificationData)) {
        setNotifications(notificationData);
      } else {
        setNotifications([]);
      }
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
      setNotificationsError(true);
      setNotifications([]);
    } finally {
      setNotificationsLoading(false);
    }
  }

  useEffect(() => {
    if (!user?.id) return;
    fetchNotifications();
  }, [user?.id]);

  useEffect(() => {
    const profileImage = user?.profile_image?.trim();

    setImgSrc(
      profileImage ? profileImage : "/foto_perfil.png"
    );
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        profileDropdownRef.current &&
        !profileDropdownRef.current.contains(target)
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

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const firstName = user?.full_name?.trim()
    ? user.full_name.trim().split(/\s+/)[0]
    : "Usuário";

  const hasImage = Boolean(user?.profile_image?.trim());

  const unreadNotifications = notifications.filter(
    (notification) => Number(notification.is_read) === 0
  ).length;

  async function markNotificationAsRead(id: number) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === id
          ? { ...notification, is_read: 1 }
          : notification
      )
    );

    try {
      const response = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          "Não foi possível marcar a notificação como lida."
        );
      }
    } catch (error) {
      console.error(
        "Erro ao marcar notificação como lida:",
        error
      );

      await fetchNotifications();
    }
  }

  async function markAllAsRead() {
    const previousNotifications = notifications;

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: 1,
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
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.error ||
            "Não foi possível marcar as notificações."
        );
      }

      await fetchNotifications();
    } catch (error) {
      console.error(
        "Erro ao marcar todas como lidas:",
        error
      );

      setNotifications(previousNotifications);
    }
  }

  function formatNotificationDate(date: string) {
    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "";
    }

    return parsedDate.toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short",
    });
  }

  function handleNotificationToggle() {
    const willOpen = !notificationOpen;

    setNotificationOpen(willOpen);
    setProfileOpen(false);

    if (willOpen && user?.id) {
      fetchNotifications();
    }
  }

  function handleProfileToggle() {
    setProfileOpen((current) => !current);
    setNotificationOpen(false);
  }

  const userBasePath = user?.user_type
    ? `/${user.user_type}`
    : "";

  return (
    <header className="relative z-50 flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Abrir menu"
          className="cursor-pointer rounded-lg p-2 transition hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div
          ref={notificationRef}
          className="relative"
        >
          <button
            type="button"
            onClick={handleNotificationToggle}
            aria-label="Notificações"
            aria-expanded={notificationOpen}
            className="relative cursor-pointer rounded-full p-2 transition hover:bg-gray-100"
          >
            <Bell size={20} />

            {unreadNotifications > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-bold text-white">
                {unreadNotifications > 9
                  ? "9+"
                  : unreadNotifications}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div className="absolute right-0 top-full z-50 mt-3 w-[350px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Notificações
                  </h3>

                  <p className="mt-0.5 text-xs text-gray-500">
                    {notificationsLoading
                      ? "Carregando..."
                      : unreadNotifications > 0
                      ? `${unreadNotifications} não lidas`
                      : ""}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  {unreadNotifications > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-teal-600 transition hover:bg-teal-50"
                    >
                      <CheckCheck size={15} />
                      Marcar tudo
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() =>
                      setNotificationOpen(false)
                    }
                    className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Fechar notificações"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="max-h-[400px] overflow-y-auto">
                {notificationsLoading &&
                  notifications.length === 0 && (
                    <div className="px-4 py-10 text-center">
                      <p className="text-sm text-gray-500">
                        Carregando notificações...
                      </p>
                    </div>
                  )}

                {!notificationsLoading &&
                  notificationsError && (
                    <div className="px-4 py-10 text-center">
                      <Bell
                        size={24}
                        className="mx-auto text-red-300"
                      />

                      <p className="mt-2 text-sm text-gray-500">
                        Não foi possível carregar as
                        notificações.
                      </p>

                      <button
                        type="button"
                        onClick={fetchNotifications}
                        className="mt-3 rounded-lg bg-teal-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-teal-600"
                      >
                        Tentar novamente
                      </button>
                    </div>
                  )}

                {!notificationsLoading &&
                  !notificationsError &&
                  notifications.length === 0 && (
                    <div className="px-4 py-10 text-center">
                      <Bell
                        size={24}
                        className="mx-auto text-gray-300"
                      />

                      <p className="mt-2 text-sm text-gray-500">
                        Nenhuma notificação.
                      </p>
                    </div>
                  )}

                {!notificationsError &&
                  notifications.map((notification) => {
                    const isUnread =
                      Number(notification.is_read) === 0;

                    return (
                      <button
                        key={notification.id}
                        type="button"
                        onClick={() =>
                          markNotificationAsRead(
                            notification.id
                          )
                        }
                        className={`flex w-full gap-3 border-b border-gray-100 px-4 py-4 text-left transition hover:bg-gray-50 ${
                          isUnread
                            ? "bg-teal-50/40"
                            : "bg-white"
                        }`}
                      >
                        <div className="pt-1">
                          <span
                            className={`block h-2.5 w-2.5 rounded-full ${
                              isUnread
                                ? "bg-orange-500"
                                : "bg-gray-300"
                            }`}
                          />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={`text-sm ${
                                isUnread
                                  ? "font-semibold text-gray-900"
                                  : "font-medium text-gray-700"
                              }`}
                            >
                              {notification.title}
                            </p>

                            {isUnread && (
                              <span className="shrink-0 text-[9px] font-bold uppercase text-orange-500">
                                Nova
                              </span>
                            )}
                          </div>

                          <p className="mt-1 text-xs leading-5 text-gray-500">
                            {notification.message}
                          </p>

                          <p className="mt-1.5 text-[10px] text-gray-400">
                            {formatNotificationDate(
                              notification.created_at
                            )}
                          </p>
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        <div
          ref={profileDropdownRef}
          className="relative"
        >
          <button
            type="button"
            onClick={handleProfileToggle}
            aria-expanded={profileOpen}
            aria-haspopup="menu"
            className="flex cursor-pointer items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-gray-100"
          >
            {hasImage ? (
              <Image
                src={imgSrc}
                onError={() =>
                  setImgSrc("/foto_perfil.png")
                }
                className="h-8 w-8 rounded-full object-cover"
                alt="Foto de perfil"
                width={32}
                height={32}
                unoptimized
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500 text-sm font-bold text-white">
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}

            <span className="hidden text-sm font-medium sm:block">
              {firstName}
            </span>

            <ChevronDown
              size={16}
              className={`transition-transform ${
                profileOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {profileOpen && (
            <div
              className="absolute right-0 top-full z-50 mt-2.5 w-64 overflow-hidden rounded-xl border border-gray-200 bg-white p-4 shadow-lg"
              role="menu"
            >
              <div className="mb-3">
                <p className="truncate text-xs font-semibold text-gray-900">
                  {user?.full_name || "Usuário"}
                </p>

                {user?.email && (
                  <p className="mt-1 truncate text-xs text-gray-500">
                    {user.email}
                  </p>
                )}

                <p className="mt-1 text-xs text-gray-500">
                  {user?.user_type || "Carregando..."}
                </p>
              </div>

              <div className="my-2 border-t border-gray-100" />

              <div className="flex flex-col gap-1 text-xs">
                <Link
                  href={
                    userBasePath
                      ? `${userBasePath}/perfil`
                      : "#"
                  }
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-lg p-2 transition hover:bg-gray-100"
                  role="menuitem"
                >
                  <User size={18} />
                  Meu Perfil
                </Link>

                <Link
                  href={
                    userBasePath
                      ? `${userBasePath}/configuracoes`
                      : "#"
                  }
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-lg p-2 transition hover:bg-gray-100"
                  role="menuitem"
                >
                  <Settings size={18} />
                  Configurações
                </Link>

                <Link
                  href={
                    userBasePath
                      ? `${userBasePath}/central_ajuda`
                      : "#"
                  }
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 rounded-lg p-2 transition hover:bg-gray-100"
                  role="menuitem"
                >
                  <Headset size={18} />
                  Suporte
                </Link>
              </div>

              <div className="my-2 border-t border-gray-100" />

              <Link
                href="/saindo"
                onClick={() => setProfileOpen(false)}
                className="flex w-full items-center gap-2 rounded-lg p-2 text-xs text-red-500 transition hover:bg-red-50"
                role="menuitem"
              >
                <LogOut size={18} />
                Sair
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
