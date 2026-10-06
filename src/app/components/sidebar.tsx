"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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
  Percent,
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
<<<<<<< HEAD
  CreditCardMinus,
  IdCard,
  ClipboardList,
=======
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
} from "lucide-react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSlack } from "@fortawesome/free-brands-svg-icons";

type IconComponent = React.ComponentType<{
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
};

type User = {
  id: number;
  full_name: string;
  user_type: "atendente" | "diretor";
};

const isRouteActive = (pathname: string, href: string) => {
  if (!href) return false;
  if (pathname === href) return true;

  const rootRoutes = ["/atendente", "/diretor"];

  if (rootRoutes.includes(href)) return false;

  return pathname.startsWith(`${href}/`);
};

const menuAtendente: MenuItem[] = [
  {
    name: "Dashboard",
    icon: Home,
    href: "/atendente",
  },
  {
    name: "Suporte e Ocorrências",
    icon: TriangleAlert,
    href: "/atendente/suporte_ocorrencias",
  },
  {
    name: "Atendimento",
    icon: MessageCircleMore,
    href: "/atendente/atendimentos",
  },
  {
<<<<<<< HEAD
    name: "Protocolos",
    icon: ClipboardList,
    href: "/atendente/protocolos",
  },
  {
    name: "Passageiros",
    icon: UserIcon,
=======
    name: "Passageiros",
    icon: Car,
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
    href: "/atendente/passageiros",
  },
  {
    name: "Motoristas",
    icon: Car,
    href: "/atendente/motoristas",
  },
  {
    name: "Entregas",
    icon: PackageOpen,
    href: "/atendente/entregas",
  },
  {
    name: "Corridas",
    icon: LocateFixed,
    href: "/atendente/corridas",
  },
  {
<<<<<<< HEAD
    name: "Pagamentos",
    icon: CreditCardMinus,
    href: "/atendente/pagamentos",
  },
  {
    name: "Maylon Pass",
    icon: IdCard,
    href: "/atendente/maylon_pass",
  },
  {
    name: "Comunicados",
    icon: Megaphone,
    href: "/atendente/comunicados",
  },
  {
    name: "Meu Perfil",
    icon: UserIcon,
    href: "/atendente/perfil",
=======
    name: "Financeiro",
    icon: Wallet,
    href: "/atendente/financeiro",
  },
  {
    name: "Relatórios",
    icon: FileText,
    href: "/atendente/relatorio",
  },
  {
    name: "Notificações",
    icon: Megaphone,
    href: "/atendente/notificacoes",
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
  },
  {
    name: "Sair",
    icon: LogOut,
    href: "/atendente/motoristas/saindo",
  },
];

<<<<<<< HEAD

=======
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
const menuDiretor: MenuItem[] = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    href: "/diretor",
  },
  {
    name: "Maylon Store",
    icon: ShoppingCart,
    href: "/diretor/maylon_store",
  },
  {
    name: "Rifas",
    icon: Trophy,
    href: "/diretor/rifa",
  },
  {
    name: "Comercial",
    icon: BriefcaseBusiness,
    href: "/diretor/comercial",
  },
  {
    name: "Financeiro",
    icon: WalletMinimal,
    href: "/diretor/financeiro",
  },
  {
    name: "Verificações",
    icon: BadgeCheck,
    href: "/diretor/verificacao",
  },
  {
    name: "Recursos Humanos (RH)",
    icon: Users,
    href: "/diretor/colaboradores",
  },
  {
    name: "Jurídico",
    icon: Scale,
    href: "/diretor/juridico",
  },
  {
    name: "Relatórios",
    icon: ChartNoAxesCombined,
    submenu: [
      {
        name: "Relatórios Financeiros",
        href: "/diretor/relatorios/financeiro",
      },
      {
        name: "Relatórios de Transações",
        href: "/diretor/relatorios/transacoes",
      },
      {
        name: "Relatórios Comerciais",
        href: "/diretor/relatorios/receitas",
      },
      {
        name: "Relatórios de Operação",
        href: "/diretor/relatorios/corridas",
      },
      {
        name: "Relatórios de Passageiros",
        href: "/diretor/relatorios/passageiros",
      },
      {
        name: "Relatórios de Motoristas",
        href: "/diretor/relatorios/motoristas",
      },
      {
        name: "Relatórios de Recursos Humanos (RH)",
        href: "/diretor/relatorios/rh",
      },
      {
        name: "Relatórios Jurídicos",
        href: "/diretor/relatorios/juridico",
      },
      {
        name: "Relatórios de Compras",
        href: "/diretor/relatorios/compras",
      },
      {
        name: "Relatórios da Maylon Pass",
        href: "/diretor/relatorios/maylon-pass",
      },
      {
        name: "Relatórios de Marketing",
        href: "/diretor/relatorios/marketing",
      },
      {
        name: "Relatórios de Auditoria",
        href: "/diretor/relatorios/auditoria",
      },
    ],
  },
  {
    name: "Transações",
    icon: WalletMinimal,
    href: "/diretor/transacoes",
  },
  {
    name: "Auditoria",
    icon: FileText,
    href: "/diretor/auditoria",
  },
  {
    name: "Perfil",
    icon: UserIcon,
    href: "/diretor/perfil",
  },
  {
    name: "Sair",
    icon: LogOut,
    href: "/saindo",
  },
];

export default function Sidebar({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [openReports, setOpenReports] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          setUser(null);
          return;
        }

        const data = await res.json();
        const userData = data?.user ?? data;

        if (
          !userData ||
          !["atendente", "diretor"].includes(
            String(userData.user_type).toLowerCase()
          )
        ) {
          setUser(null);
          return;
        }

        setUser({
          id: Number(userData.id),
          full_name:
            userData.full_name ??
            userData.nome_completo ??
            userData.nomeCompleto ??
            userData.nome ??
            userData.name ??
            "Usuário",
          user_type: String(
            userData.user_type
          ).toLowerCase() as "atendente" | "diretor",
        });
      } catch (error) {
        console.error("Erro ao buscar usuário:", error);
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  const isReportsPage = menuDiretor
    .find((item) => item.name === "Relatórios")
    ?.submenu?.some((subItem) =>
      isRouteActive(pathname, subItem.href)
    );

  useEffect(() => {
    if (isReportsPage) {
      setOpenReports(true);
    }
  }, [isReportsPage]);

  if (!user) {
    return null;
  }

  const isDiretor = user.user_type === "diretor";
  const menuItems: MenuItem[] = isDiretor
    ? menuDiretor
    : menuAtendente;

  const supportItems: SupportItem[] = [
    {
      name: "Central de Ajuda",
      type: "internal",
      href: isDiretor
        ? "/diretor/central_ajuda"
        : "/atendente/central_ajuda",
    },
    {
      name: "Slack",
      type: "external",
      href: "https://join.slack.com/t/maylon-grupo/shared_invite/zt-48i0334qf-M_LdsNNL3grr06FMJFpAkA",
    },
  ];

  return (
    <aside
<<<<<<< HEAD
      className={`h-screen bg-white border-r border-gray-300 transition-all duration-300 overflow-y-auto flex-shrink-0 ${collapsed ? "w-20" : "w-64"
        }`}
=======
      className={`h-screen bg-white border-r border-gray-300 transition-all duration-300 overflow-y-auto flex-shrink-0 ${
        collapsed ? "w-20" : "w-64"
      }`}
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
    >
      {collapsed ? (
        <div className="grid h-16 place-items-center border-b border-gray-200">
          <Image
            src="/favicon.webp"
            alt="Logo"
            width={42}
            height={42}
            className="rounded-xl"
            priority
          />
        </div>
      ) : (
        <div className="flex items-center justify-center p-3 border-b border-gray-200">
          <Image
            src="/logo.png"
            alt="Logo"
            width={180}
            height={60}
            priority
          />
        </div>
      )}

      <nav className="px-2 mt-4">
        {menuItems.map((item) => {
          const isActive = isRouteActive(
            pathname,
            item.href ?? ""
          );

          if (item.submenu) {
            const hasActiveSubmenu = item.submenu.some(
              (subItem) =>
                isRouteActive(pathname, subItem.href)
            );

            const reportsOpen =
              openReports || hasActiveSubmenu;

            return (
              <div key={item.name} className="mb-1">
                <button
                  type="button"
                  onClick={() =>
                    setOpenReports((previous) => !previous)
                  }
<<<<<<< HEAD
                  className={`w-full cursor-pointer flex items-center ${collapsed
                      ? "justify-center"
                      : "justify-between"
                    } p-3 rounded-lg transition ${hasActiveSubmenu
                      ? "bg-teal-500 text-white shadow-md"
                      : "hover:bg-gray-100 text-gray-700"
                    }`}
=======
                  className={`w-full cursor-pointer flex items-center ${
                    collapsed
                      ? "justify-center"
                      : "justify-between"
                  } p-3 rounded-lg transition ${
                    hasActiveSubmenu
                      ? "bg-teal-500 text-white shadow-md"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} />
                    {!collapsed && (
                      <span className="text-xs font-medium">
                        {item.name}
                      </span>
                    )}
                  </div>
                  {!collapsed &&
                    (reportsOpen ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    ))}
                </button>

                {reportsOpen && !collapsed && (
                  <div className="ml-5 mt-1 flex flex-col gap-1">
                    {item.submenu.map((subItem) => {
                      const isSubActive = isRouteActive(
                        pathname,
                        subItem.href
                      );

                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
<<<<<<< HEAD
                          className={`px-3 py-2 rounded-lg text-xs transition ${isSubActive
                              ? "bg-teal-100 text-teal-700 font-semibold"
                              : "hover:bg-gray-100 text-gray-700"
                            }`}
=======
                          className={`px-3 py-2 rounded-lg text-xs transition ${
                            isSubActive
                              ? "bg-teal-100 text-teal-700 font-semibold"
                              : "hover:bg-gray-100 text-gray-700"
                          }`}
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
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

          if (!item.href) {
            return null;
          }

          return (
            <Link
              key={item.name}
              href={item.href}
<<<<<<< HEAD
              className={`flex items-center ${collapsed
                  ? "justify-center"
                  : "justify-start"
                } gap-3 p-3 rounded-lg transition mb-1 ${isActive
                  ? "bg-teal-500 text-white shadow-md"
                  : "hover:bg-gray-100 text-gray-700"
                }`}
=======
              className={`flex items-center ${
                collapsed
                  ? "justify-center"
                  : "justify-start"
              } gap-3 p-3 rounded-lg transition mb-1 ${
                isActive
                  ? "bg-teal-500 text-white shadow-md"
                  : "hover:bg-gray-100 text-gray-700"
              }`}
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
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

      <div className="px-2 mt-6">
        {!collapsed && (
          <p className="text-black font-semibold text-sm px-3 mb-2">
            Suporte
          </p>
        )}

        {supportItems.map((item) => {
          const isActive =
            item.type === "internal" &&
            isRouteActive(pathname, item.href);

          if (item.type === "internal") {
            return (
              <Link
                key={item.name}
                href={item.href}
<<<<<<< HEAD
                className={`flex items-center ${collapsed
                    ? "justify-center"
                    : "justify-start"
                  } gap-3 p-3 rounded-lg transition mb-1 ${isActive
                    ? "bg-teal-500 text-white shadow-md"
                    : "hover:bg-gray-100 text-gray-700"
                  }`}
=======
                className={`flex items-center ${
                  collapsed
                    ? "justify-center"
                    : "justify-start"
                } gap-3 p-3 rounded-lg transition mb-1 ${
                  isActive
                    ? "bg-teal-500 text-white shadow-md"
                    : "hover:bg-gray-100 text-gray-700"
                }`}
>>>>>>> 329b250dda240af642406b1a722be799da19c6d1
              >
                <Headset size={20} />
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
              className="flex items-center justify-start gap-3 p-3 rounded-lg transition mb-1 hover:bg-gray-100 text-gray-700"
            >
              <FontAwesomeIcon
                icon={faSlack}
                className="w-5 h-5"
              />
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
