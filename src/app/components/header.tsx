"use client";
import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import {
  Menu,
  Bell,
  ChevronDown,
  User,
  Settings,
  Headset,
  LogOut,
} from "lucide-react";
import Link from "next/link";

type User = {
  id: number;
  full_name: string;
  email: string;
  profile_image?: string;
  user_type: string;
};

export default function Header({
  toggleSidebar,
}: {
  toggleSidebar: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [imgSrc, setImgSrc] = useState("/foto_perfil.png");

  useEffect(() => {
    const fetchUser = async () => {
      const res = await fetch("/api/me", {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    if (user?.profile_image && user.profile_image.trim() !== "") {
      setImgSrc(user.profile_image);
    } else {
      setImgSrc("/foto_perfil.png");
    }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(e: any) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const firstName = user?.full_name
    ? user.full_name.split(" ")[0]
    : "Usuário";

  const hasImage =
    user?.profile_image && user.profile_image.trim() !== "";

  return (
    <div className="w-full h-16 bg-white border-b border-gray-300 flex items-center justify-between px-4">
      <div className="flex items-center gap-4 w-full max-w-xl">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg cursor-pointer hover:bg-gray-100"
        >
          <Menu size={20} />
        </button>
      </div>
      <div className="flex items-center gap-4 relative">
        <button className="p-2 rounded-full hover:bg-gray-100 relative">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
        </button>
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 cursor-pointer hover:rounded-xl px-2 py-1 hover:bg-gray-100"
          >
            {hasImage ? (
              <Image
                src={imgSrc}
                onError={() => setImgSrc("/foto_perfil.png")}
                className="w-8 h-8 rounded-full object-cover"
                alt="Foto de perfil"
                width={32}
                height={32}
              />
            ) : (
              <div className="w-8 h-8 flex items-center justify-center rounded-full bg-teal-500 text-white text-sm font-bold">
                {firstName.charAt(0)}
              </div>
            )}
            <span className="text-sm font-medium">
              {firstName}
            </span>
            <ChevronDown size={16} />
          </button>
          {open && (
            <div className="absolute right-0 mt-2.5 w-64 bg-white border rounded-xl shadow-lg p-4 z-50">
              <div className="mb-3">
                <p className="font-semibold text-xs">
                  {firstName}
                </p>
                <p className="text-gray-500 text-capitalize mt-1 text-xs">
                  {user?.user_type || "Carregando..."}
                </p>
              </div>
              <div className="border-t my-2"></div>
              <div className="flex flex-col text-xs gap-2">
                <Link
                  href={`/${user.user_type}/perfil`}
                  className="flex items-center gap-2 p-2 cursor-pointer rounded-lg hover:bg-gray-100"
                >
                  <User size={18} />
                  Meu Perfil
                </Link>

                <Link
                  href={`/${user.user_type}/configuracoes`}
                  className="flex items-center gap-2 p-2 cursor-pointer rounded-lg hover:bg-gray-100"
                >
                  <Settings size={18} />
                  Configurações
                </Link>
                <Link
                  href={`/${user.user_type}/central_ajuda`}
                  className="flex items-center gap-2 p-2 cursor-pointer rounded-lg hover:bg-gray-100"
                >
                  <Headset size={18} />
                  Suporte
                </Link>

              </div>
              <div className="border-t my-2"></div>
              <Link
                href="/saindo"
                className="flex items-center gap-2 text-xs cursor-pointer w-full p-2 rounded-lg hover:bg-gray-100 text-red-500"
              >
                <LogOut size={18} /> Sair
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}