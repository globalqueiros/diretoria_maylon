"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";

import {
  LayoutDashboard,
  Headset,
  LogOut,
  Users,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  ChartNoAxesCombined,
  Scale,
  WalletMinimal,
  FileText,
  User as UserIcon,
  Trophy,
  ShoppingCart,
  Home,
  TriangleAlert,
  Car,
  MessageCircleMore,
  PackageOpen,
  Wallet,
  LocateFixed,
  Megaphone,
  BadgeCheck,
  ShieldCheck,
  CreditCardMinus,
  IdCard,
  ClipboardList,
  Mail,
} from "lucide-react";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSlack } from "@fortawesome/free-brands-svg-icons";

// ========================================
// TIPOS
// ========================================

type IconComponent = ComponentType<{
  size?: number;
  className?: string;
}>;

type MenuItem = {
  name: string;
  href?: string;
  icon: IconComponent;
  submenu?: {
    name: string;
    href: string;
  }[];
};

type SupportItem = {
  name: string;
  type: "internal" | "external";
  href: string;
  icon: "headset" | "slack" | "docs";
};

type UserType =
  | "atendente"
  | "gerente"
  | "diretor"
  | "comercial"
  | "marketing";

type User = {
  id: number | string;
  full_name: string;
  user_type: UserType;
};

// ========================================
// PERFIS ACEITOS E NORMALIZAÇÃO
// ========================================

const allowedTypes: UserType[] = [
  "atendente",
  "gerente",
  "diretor",
  "comercial",
  "marketing",
];

// Apelidos que podem vir do banco / da API
const roleAliases: Record<string, UserType> = {
  admin: "diretor",
  administrador: "diretor",
  diretoria: "diretor",
  gerencia: "gerente",
  atendimento: "atendente",
  suporte: "atendente",
  vendas: "comercial",
};

function normalizeRole(value: unknown): UserType | null {
  const raw = String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  if (!raw) return null;

  if (allowedTypes.includes(raw as UserType)) {
    return raw as UserType;
  }

  return roleAliases[raw] ?? null;
}

// ========================================
// VERIFICAÇÃO DE ROTAS
// ========================================

const dashboardRoutes = [
  "/atendente",
  "/gerente",
  "/diretor",
  "/comercial",
  "/marketing",
];

const isRouteActive = (
  pathname: string,
  href: string
): boolean => {
  if (!href) return false;

  if (pathname === href) return true;

  if (dashboardRoutes.includes(href)) return false;

  return pathname.startsWith(`${href}/`);
};

// ========================================
// MENU ATENDENTE
// ========================================

const menuAtendente: MenuItem[] = [
  { name: "Dashboard", icon: Home, href: "/atendente" },
  { name: "Suporte e Ocorrências", icon: TriangleAlert, href: "/atendente/suporte_ocorrencias" },
  { name: "Atendimento", icon: MessageCircleMore, href: "/atendente/atendimentos" },
  { name: "Protocolos", icon: ClipboardList, href: "/atendente/protocolos" },
  { name: "Email", icon: Mail, href: "/atendente/email" },
  { name: "Passageiros", icon: UserIcon, href: "/atendente/passageiros" },
  { name: "Motoristas", icon: Car, href: "/atendente/motoristas" },
  { name: "Entregas", icon: PackageOpen, href: "/atendente/entregas" },
  { name: "Corridas", icon: LocateFixed, href: "/atendente/corridas" },
  { name: "Pagamentos", icon: CreditCardMinus, href: "/atendente/pagamentos" },
  { name: "Maylon Pass", icon: IdCard, href: "/atendente/maylon_pass" },
  { name: "Relatórios", icon: FileText, href: "/atendente/relatorio" },
  { name: "Comunicados", icon: Megaphone, href: "/atendente/comunicados" },
  { name: "Dispositivos conectados", icon: ShieldCheck, href: "/atendente/sessoes" },
  { name: "Sair", icon: LogOut, href: "/saindo" },
];

// ========================================
// MENU GERENTE
// ========================================

const menuGerente: MenuItem[] = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/gerente" },
  { name: "Motoristas", icon: Car, href: "/gerente/motoristas" },
  { name: "Entregas", icon: PackageOpen, href: "/gerente/entregas" },
  { name: "Comissões e bonificações", icon: Wallet, href: "/gerente/comissao_bonificacoes" },
  { name: "Cotações de publicidade", icon: Megaphone, href: "/gerente/cotacoes" },
  { name: "Pagamentos", icon: CreditCardMinus, href: "/gerente/pagamentos" },
  { name: "Maylon Pass", icon: IdCard, href: "/gerente/maylon_pass" },
  { name: "Financeiro", icon: ChartNoAxesCombined, href: "/gerente/financeiro" },
  { name: "Comunicados", icon: Megaphone, href: "/gerente/comunicados" },
  { name: "Perfil", icon: UserIcon, href: "/gerente/perfil" },
  { name: "Dispositivos conectados", icon: ShieldCheck, href: "/gerente/sessoes" },
  { name: "Sair", icon: LogOut, href: "/saindo" },
];

// ========================================
// MENU DIRETOR
// ========================================

const menuDiretor: MenuItem[] = [
  { name: "Dashboard", icon: LayoutDashboard, href: "/diretor" },
  { name: "Maylon Store", icon: ShoppingCart, href: "/diretor/maylon_store" },
  { name: "Rifas", icon: Trophy, href: "/diretor/rifa" },
  { name: "Comercial", icon: BriefcaseBusiness, href: "/diretor/comercial" },
  { name: "Protocolos", icon: ClipboardList, href: "/diretor/protocolos" },
  { name: "Financeiro", icon: WalletMinimal, href: "/diretor/financeiro" },
  { name: "Verificações", icon: BadgeCheck, href: "/diretor/verificacao" },
  { name: "Recursos Humanos (RH)", icon: Users, href: "/diretor/colaboradores" },
  { name: "Jurídico", icon: Scale, href: "/diretor/juridico" },
  { name: "Transações", icon: WalletMinimal, href: "/diretor/transacoes" },
  { name: "Auditoria", icon: FileText, href: "/diretor/auditoria" },
  { name: "Sair", icon: LogOut, href: "/saindo" },
];

const menuComercial: MenuItem[] = [
  { name: "Dashboard", icon: Home, href: "/comercial" },
  { name: "Clientes", icon: UserIcon, href: "/comercial/clientes" },
  { name: "Leads Comerciais", icon: Users, href: "/comercial/leads" },
  { name: "Comercial", icon: BriefcaseBusiness, href: "/comercial/comercial" },
  { name: "CRM", icon: BriefcaseBusiness, href: "/comercial/crm" },
  { name: "Planos e Assinaturas", icon: IdCard, href: "/comercial/planos" },
  { name: "Campanhas", icon: Megaphone, href: "/comercial/campanhas" },
  { name: "Protocolos", icon: ClipboardList, href: "/comercial/protocolos" },
  { name: "Comunicados", icon: Mail, href: "/comercial/comunicados" },
  { name: "Comissões", icon: Wallet, href: "/comercial/comissoes" },
  { name: "Atendimentos", icon: MessageCircleMore, href: "/comercial/atendimentos" },
  { name: "Perfil", icon: UserIcon, href: "/comercial/perfil" },
  { name: "Dispositivos conectados", icon: ShieldCheck, href: "/comercial/sessoes" },
  { name: "Sair", icon: LogOut, href: "/saindo" },
];

// ========================================
// MENU MARKETING
// ========================================

const menuMarketing: MenuItem[] = [
  { name: "Dashboard Marketing", icon: Home, href: "/marketing" },
  { name: "Campanhas", icon: Megaphone, href: "/marketing/campanhas" },
  { name: "Redes Sociais", icon: MessageCircleMore, href: "/marketing/redes-sociais" },
  { name: "Meta Ads", icon: ChartNoAxesCombined, href: "/marketing/meta-ads" },
  { name: "Google Ads", icon: ChartNoAxesCombined, href: "/marketing/google-ads" },
  { name: "Criação de Conteúdo", icon: FileText, href: "/marketing/conteudo" },
  { name: "Leads", icon: Users, href: "/marketing/leads" },
  { name: "Materiais e Artes", icon: BriefcaseBusiness, href: "/marketing/materiais" },
  { name: "Relatórios", icon: ChartNoAxesCombined, href: "/marketing/relatorios" },
  { name: "Comunicados", icon: Mail, href: "/marketing/comunicados" },
  { name: "Sair", icon: LogOut, href: "/saindo" },
];

// ========================================
// MAPAS POR PERFIL
// ========================================

const menuPorPerfil: Record<UserType, MenuItem[]> = {
  diretor: menuDiretor,
  gerente: menuGerente,
  comercial: menuComercial,
  marketing: menuMarketing,
  atendente: menuAtendente,
};

const basePorPerfil: Record<UserType, string> = {
  diretor: "/diretor",
  gerente: "/gerente",
  comercial: "/comercial",
  marketing: "/marketing",
  atendente: "/atendente",
};

// ========================================
// ÍCONES DO SUPORTE
// ========================================

function SupportIcon({
  icon,
}: {
  icon: SupportItem["icon"];
}) {
  if (icon === "slack") {
    return (
      <FontAwesomeIcon
        icon={faSlack}
        className="h-5 w-5"
      />
    );
  }

  if (icon === "docs") {
    return <FileText size={20} />;
  }

  return <Headset size={20} />;
}

// ========================================
// SIDEBAR PRINCIPAL
// ========================================

export default function Sidebar({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const pathname = usePathname();

  const [user, setUser] = useState<User | null>(null);

  const [openMenus, setOpenMenus] = useState<
    Record<string, boolean>
  >({});

  // ========================================
  // BUSCAR USUÁRIO
  // ========================================

  useEffect(() => {
    let cancelled = false;

    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          if (!cancelled) setUser(null);
          return;
        }

        const data = await res.json();

        const userData =
          data?.user ??
          data?.usuario ??
          data;

        // Aceita vários nomes de campo para o perfil
        const userType = normalizeRole(
          userData?.user_type ??
            userData?.papel ??
            userData?.role ??
            userData?.perfil ??
            userData?.tipo
        );

        if (!userData || !userType) {
          console.warn(
            "Perfil de usuário não reconhecido. Resposta de /api/me:",
            data
          );

          if (!cancelled) setUser(null);
          return;
        }

        if (!cancelled) {
          setUser({
            id: userData.id,
            full_name:
              userData.full_name ??
              userData.nome_completo ??
              userData.nomeCompleto ??
              userData.nome ??
              userData.name ??
              "Usuário",
            user_type: userType,
          });
        }
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);

        if (!cancelled) setUser(null);
      }
    };

    fetchUser();

    return () => {
      cancelled = true;
    };
  }, []);

  // ========================================
  // CARREGAMENTO
  // ========================================

  if (!user) return null;

  // ========================================
  // MENU E SUPORTE DO PERFIL
  // ========================================

  const menuItems: MenuItem[] = menuPorPerfil[user.user_type];
  const supportBase = basePorPerfil[user.user_type];

  const supportItems: SupportItem[] = [
    {
      name: "Central de Ajuda",
      type: "internal",
      icon: "headset",
      href: `${supportBase}/central_ajuda`,
    },
    {
      name: "Slack",
      type: "external",
      icon: "slack",
      href: "https://join.slack.com/t/maylon-grupo/shared_invite/zt-48i0334qf-M_LdsNNL3grr06FMJFpAkA",
    },
    {
      name: "Documentação",
      type: "external",
      icon: "docs",
      href: "https://docs.maylon.com.br/",
    },
  ];

  // ========================================
  // RENDERIZAÇÃO
  // ========================================

  return (
    <aside
      className={`
        sidebar-scroll
        flex
        h-screen
        flex-shrink-0
        flex-col
        overflow-y-auto
        border-r
        border-gray-200
        bg-white
        transition-all
        duration-300
        ${collapsed ? "w-20" : "w-64"}
      `}
    >
      {/* LOGOTIPO */}

      {collapsed ? (
        <div className="grid h-16 shrink-0 place-items-center border-b border-gray-200">
          <Image
            src="/favicon.webp"
            alt="Maylon"
            width={30}
            height={30}
            className="rounded-xl"
            priority
          />
        </div>
      ) : (
        <div className="flex h-16 shrink-0 items-center justify-center border-b border-gray-200 p-3">
          <Image
            src="/logo.png"
            alt="Maylon"
            width={125}
            height={40}
            className="max-h-12 w-auto object-contain"
            priority
          />
        </div>
      )}

      {/* MENU PRINCIPAL */}

      <nav
        aria-label="Menu principal"
        className="mt-4 px-2"
      >
        {menuItems.map((item) => {
          const active = isRouteActive(
            pathname,
            item.href ?? ""
          );

          // MENUS COM SUBMENU

          if (item.submenu) {
            const hasActiveSubmenu =
              item.submenu.some((subItem) =>
                isRouteActive(pathname, subItem.href)
              );

            const menuOpen =
              openMenus[item.name] ?? hasActiveSubmenu;

            return (
              <div key={item.name} className="mb-1">
                <button
                  type="button"
                  title={collapsed ? item.name : undefined}
                  aria-expanded={menuOpen}
                  onClick={() =>
                    setOpenMenus((previous) => ({
                      ...previous,
                      [item.name]: !(
                        previous[item.name] ??
                        hasActiveSubmenu
                      ),
                    }))
                  }
                  className={`
                    flex w-full items-center rounded-lg p-3 transition
                    ${collapsed ? "justify-center" : "justify-between"}
                    ${
                      hasActiveSubmenu
                        ? "bg-teal-500 text-white shadow-md"
                        : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  <span className="flex items-center gap-3">
                    <item.icon size={20} />

                    {!collapsed && (
                      <span className="text-left text-xs font-medium">
                        {item.name}
                      </span>
                    )}
                  </span>

                  {!collapsed &&
                    (menuOpen ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    ))}
                </button>

                {/* SUBMENU */}

                {menuOpen && !collapsed && (
                  <div className="ml-5 mt-1 flex flex-col gap-1 border-l border-gray-200 pl-3">
                    {item.submenu.map((subItem) => {
                      const subActive = isRouteActive(
                        pathname,
                        subItem.href
                      );

                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          aria-current={
                            subActive ? "page" : undefined
                          }
                          className={`
                            rounded-lg px-3 py-2 text-xs transition
                            ${
                              subActive
                                ? "bg-teal-100 font-semibold text-teal-700"
                                : "text-gray-700 hover:bg-gray-100"
                            }
                          `}
                        >
                          {subItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          // MENUS NORMAIS

          if (!item.href) return null;

          return (
            <Link
              key={item.name}
              href={item.href}
              title={collapsed ? item.name : undefined}
              aria-current={active ? "page" : undefined}
              className={`
                mb-1 flex items-center gap-3 rounded-lg p-3 transition
                ${collapsed ? "justify-center" : "justify-start"}
                ${
                  active
                    ? "bg-teal-500 text-white shadow-md"
                    : "text-gray-700 hover:bg-gray-100"
                }
              `}
            >
              <item.icon size={20} />

              {!collapsed && (
                <span className="text-xs font-medium">
                  {item.name}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* SUPORTE */}

      <div className="mb-4 mt-6 px-2">
        {!collapsed && (
          <p className="mb-2 px-3 text-sm font-semibold text-gray-900">
            Suporte
          </p>
        )}

        {supportItems.map((item) => {
          const active =
            item.type === "internal" &&
            isRouteActive(pathname, item.href);

          if (item.type === "internal") {
            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                aria-current={active ? "page" : undefined}
                className={`
                  mb-1 flex items-center gap-3 rounded-lg p-3 transition
                  ${collapsed ? "justify-center" : "justify-start"}
                  ${
                    active
                      ? "bg-teal-500 text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  }
                `}
              >
                <SupportIcon icon={item.icon} />

                {!collapsed && (
                  <span className="text-xs font-medium">
                    {item.name}
                  </span>
                )}
              </Link>
            );
          }

          return (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              title={collapsed ? item.name : undefined}
              className={`
                mb-1 flex items-center gap-3 rounded-lg p-3
                text-gray-700 transition hover:bg-gray-100
                ${collapsed ? "justify-center" : "justify-start"}
              `}
            >
              <SupportIcon icon={item.icon} />

              {!collapsed && (
                <span className="text-xs font-medium">
                  {item.name}
                </span>
              )}
            </a>
          );
        })}
      </div>
    </aside>
  );
}