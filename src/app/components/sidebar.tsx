"use client";
import Image from "next/image";
import {
  LayoutDashboard,
  FilePenLine,
  HandCoins,
  Headset,
  LogOut,
  ShieldCheck,
  Users,
  BriefcaseBusiness,
  ChevronDown,
  ChevronRight,
  Settings,
  ChartNoAxesCombined,
  Scale,
  WalletMinimal,
  FileText,
  Percent,
  User,
  Trophy,
  ArrowLeftRight,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const menuAtendente = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    href: "/atendente",
  },
  {
    name: "Clientes",
    icon: Users,
    href: "/atendente/clientes",
  },
  {
    name: "Relatório",
    icon: FilePenLine,
    href: "/atendente/relatorio",
  },
  {
    name: "Benefícios",
    icon: HandCoins,
    href: "/atendente/beneficios",
  },
  {
    name: "Sair",
    icon: LogOut,
    href: "/saindo",
  },
];


const menuDiretor = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    href: "/diretor",
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
    name: "Compras",
    icon: Percent,
    href: "/diretor/compras",
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
    icon: User,
    href: "/diretor/admin",
  },
  {
    name: "Sair",
    icon: LogOut,
    href: "/saindo",
  },
];

const supportItems = [
  {
    name: "Central de Ajuda",
    icon: Headset,
    href: "/central_ajuda",
  },
  {
    name: "Slack",
    icon: Headset,
    href: "/central_ajuda",
  },
];

type User = {
  id: number;
  full_name: string;
  user_type: "atendente" | "diretor";
};

export default function Sidebar({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const [user, setUser] =
    useState<User | null>(null);
  const [openUsers, setOpenUsers] =
    useState(false);
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("/api/me", {
          credentials: "include",
        });
        if (!res.ok) return;
        const data = await res.json();
        setUser(data);
      } catch (err) {
        console.error(
          "Erro ao buscar usuário"
        );
      }
    };
    fetchUser();
  }, []);

  if (!user) return null;

  const isDiretor =
    user.user_type === "diretor";

  const menuItems = isDiretor
    ? menuDiretor
    : menuAtendente;

  return (
    <div
      className={`h-screen bg-white border-r border-gray-300 transition-all duration-300 overflow-y-auto
      ${collapsed
          ? "w-20"
          : "w-64"
        }`}
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
      <div className="px-2 mt-4">
        {menuItems.map((item: any, index) => {
          const isActive =
            pathname === item.href;
          if (item.submenu) {
            return (
              <div
                key={index}
                className="mb-1"
              >
                <button
                  onClick={() =>
                    setOpenUsers(!openUsers)
                  }
                  className={`w-full cursor-pointer flex items-center ${collapsed ? "justify-center" : "justify-between"
                    } p-3 rounded-lg transition
                  ${openUsers
                      ? "bg-teal-500 text-white shadow-md"
                      : "hover:bg-gray-100 text-gray-700"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon size={20} />
                    {!collapsed && (
                      <span className="text-xs font-medium">
                        {item.name}
                      </span>
                    )}
                  </div>
                  {!collapsed && (
                    <>
                      {openUsers ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </>
                  )}
                </button>
                {openUsers && !collapsed && (
                  <div className="ml-5 mt-1 flex flex-col gap-1">
                    {item.submenu.map(
                      (
                        subItem: any,
                        subIndex: number
                      ) => {
                        const isSubActive =
                          pathname ===
                          subItem.href;
                        return (
                          <Link
                            key={subIndex}
                            href={subItem.href}
                            className={`px-3 py-2 rounded-lg text-xs transition                            
                            ${isSubActive
                                ? "bg-teal-100 text-teal-700 font-semibold"
                                : "hover:bg-gray-100 text-gray-700"
                              }
                          `}
                          >
                            {subItem.name}
                          </Link>
                        );
                      }
                    )}
                  </div>
                )}
              </div>
            );
          }
          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center ${collapsed ? "justify-center" : "justify-start"
                } gap-3 p-3 rounded-lg transition mb-1
                ${isActive
                  ? "bg-teal-500 text-white shadow-md"
                  : "hover:bg-gray-100 text-gray-700"
                }`}
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
      </div>
      <div className="px-2 mt-6">
        {!collapsed && (
          <p className="text-black font-semibold text-sm px-3 mb-2">
            Suporte
          </p>
        )}
        {supportItems.map((item, index) => {
          const isActive =
            pathname === item.href;
          return (
            <Link
              key={index}
              href={item.href}
              className={`flex items-center gap-3 p-3 rounded-lg transition              
              ${isActive
                  ? "bg-teal-500 text-white shadow-md"
                  : "hover:bg-gray-100 text-gray-700"
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
      </div>
    </div>
  );
}