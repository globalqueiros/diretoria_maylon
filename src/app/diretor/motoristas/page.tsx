"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { useEffect, useState } from "react";

type Usuario = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  user_type: string;
  is_active: string;
};

type ApiResponse = {
  motoristas: Usuario[];
  passageiros: Usuario[];
};

export default function Usuarios() {
  const [motoristas, setMotoristas] = useState<Usuario[]>([]);
  const [passageiros, setPassageiros] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsuarios = async () => {
      try {
        const res = await fetch("/api/motoristas");

        const data: ApiResponse = await res.json();

        setMotoristas(data.motoristas || []);
        setPassageiros(data.passageiros || []);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsuarios();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>

          <p className="text-gray-500 font-medium">
            Aguarde, carregando página...
          </p>
        </div>
      </div>
    );
  }

  const formatPhone = (phone: string) => {
    return phone
      ?.replace(/\D/g, "")
      .replace(
        /^(\d{2})(\d{2})(\d{5})(\d{4})$/,
        "+$1 ($2) $3-$4"
      );
  };

  return (
    <div className="p-6 space-y-8">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Motorista
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Lista de motoristas cadastrados
            </p>
          </div>
          <div className="bg-teal-50 text-teal-700 px-4 py-2 rounded-xl text-sm font-semibold">
            {motoristas.length} Motoristas
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-6 py-4">Nome</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Telefone</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-center">
                  Ações
                </th>
              </tr>
            </thead>

            <tbody>
              {motoristas.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 bg-red-600 text-white text-center text-red-500"
                  >
                    Nenhum motorista encontrado
                  </td>
                </tr>
              ) : (
                motoristas.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      {item.full_name}
                    </td>

                    <td className="px-6 py-4">
                      {item.email}
                    </td>

                    <td className="px-6 py-4">
                      {formatPhone(item.phone)}
                    </td>

                    <td className="px-6 py-4">
                      {item.is_active ? (
                        <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs bg-red-100 text-red-700">
                          Inativo
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/motoristas/detalhes/${item.id}`}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-100 hover:text-teal-700 transition-all"
                      >
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}