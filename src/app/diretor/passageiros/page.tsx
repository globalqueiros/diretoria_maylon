"use client";

import Link from "next/link";
import { Eye } from "lucide-react";
import { useEffect, useState } from "react";

type Passageiro = {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  user_type: string;
  is_active: boolean;
};

type ApiResponse = {
  motoristas: any[];
  passageiros: Passageiro[];
};

export default function Passageiros() {
  const [passageiros, setPassageiros] = useState<Passageiro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPassageiros() {
      try {

        // sua rota correta
        const res = await fetch("/api/motoristas");

        if (!res.ok) {
          throw new Error("Erro ao buscar passageiros");
        }

        const data: ApiResponse = await res.json();

        // pega somente passageiros
        setPassageiros(data.passageiros || []);

      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    }

    fetchPassageiros();
  }, []);

  const formatPhone = (phone: string) => {
    if (!phone) return "-";

    return phone
      .replace(/\D/g, "")
      .replace(
        /^(\d{2})(\d{2})(\d{5})(\d{4})$/,
        "+$1 ($2) $3-$4"
      );
  };

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

  return (
    <div className="p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Passageiros
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              Lista de passageiros cadastrados
            </p>
          </div>

          <div className="bg-teal-50 text-teal-700 px-4 py-2 rounded-xl text-sm font-semibold">
            {passageiros.length} Passageiros
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
              {passageiros.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-red-500"
                  >
                    Nenhum passageiro encontrado
                  </td>
                </tr>
              ) : (
                passageiros.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-gray-100 hover:bg-gray-50 transition-all"
                  >
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {item.full_name}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {item.email}
                    </td>

                    <td className="px-6 py-4 text-gray-600">
                      {formatPhone(item.phone)}
                    </td>

                    <td className="px-6 py-4">
                      {item.is_active ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                          Ativo
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
                          Inativo
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <Link
                        href={`/passageiros/detalhes/${item.id}`}
                        className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-teal-50 text-teal-600 hover:bg-teal-100 hover:text-teal-700 transition-all duration-300"
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