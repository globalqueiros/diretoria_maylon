"use client";

import { Eye, Lock, LockOpen, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Usuario = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  tipo: "Motorista" | "Passageiro";
  cadastro: string;
  ref_code: string;
  is_temp_blocked: number;
  is_active: number;
  blocked_at?: string | null;
  bloqueado: boolean;
};

type Paginacao = {
  pagina: number;
  limite: number;
  total: number;
  totalPaginas: number;
};

const ITENS_POR_PAGINA = 20;

export default function UsuariosTable() {
  const router = useRouter();

  const [sucesso, setSucesso] = useState("");
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState("");
  const [pagina, setPagina] = useState(1);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState("");

  const [modalBloqueioAberto, setModalBloqueioAberto] = useState(false);

  const [usuarioParaBloquear, setUsuarioParaBloquear] =
    useState<Usuario | null>(null);

  const [bloqueando, setBloqueando] = useState(false);

  const [paginacao, setPaginacao] = useState<Paginacao>({
    pagina: 1,
    limite: ITENS_POR_PAGINA,
    total: 0,
    totalPaginas: 0,
  });

  /**
   * ============================================================
   * CARREGAR USUÁRIOS
   * ============================================================
   */
  const carregarUsuarios = useCallback(async () => {
    try {
      setLoading(true);
      setErro("");

      const params = new URLSearchParams();

      params.set("pagina", String(pagina));
      params.set("limite", String(ITENS_POR_PAGINA));

      if (busca.trim()) {
        params.set("busca", busca.trim());
      }

      if (tipo) {
        params.set("tipo", tipo);
      }

      const response = await fetch(
        `/api/usuarios?${params.toString()}`,
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const texto = await response.text();

      let data: any = {};

      try {
        data = texto ? JSON.parse(texto) : {};
      } catch {
        throw new Error(
          "A API não retornou um JSON válido."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Erro ${response.status}: erro ao carregar usuários.`
        );
      }

      if (data?.sucesso === false) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Erro ao carregar usuários."
        );
      }

      const lista = Array.isArray(data?.dados)
        ? data.dados
        : Array.isArray(data?.data)
        ? data.data
        : [];

      const usuariosFormatados: Usuario[] = lista.map(
        (usuario: any) => {
          const nomeCompleto = [
            usuario?.first_name,
            usuario?.last_name,
          ]
            .filter(Boolean)
            .join(" ");

          const tipoUsuario =
            usuario?.tipo ||
            (usuario?.user_type === "driver" ||
            usuario?.user_type === "motorista"
              ? "Motorista"
              : "Passageiro");

          /**
           * ======================================================
           * ESTADO DO CADEADO
           * ======================================================
           *
           * blocked_at preenchido -> BLOQUEADO -> 🔒
           * blocked_at NULL       -> DESBLOQUEADO -> 🔓
           *
           * Também consideramos:
           * is_active = 0
           * is_temp_blocked = 1
           *
           * O blocked_at tem prioridade porque é o campo
           * que registra o bloqueio no banco.
           */

          const isActive = Number(
            usuario?.is_active ?? 1
          );

          const isTempBlocked = Number(
            usuario?.is_temp_blocked ?? 0
          );

          const blockedAt =
            usuario?.blocked_at ??
            usuario?.blockedAt ??
            null;

          const bloqueado =
            blockedAt !== null &&
            blockedAt !== ""
              ? true
              : isActive === 0 ||
                isTempBlocked === 1;

          return {
            id: String(usuario?.id ?? ""),

            nome:
              usuario?.nome ||
              usuario?.full_name ||
              nomeCompleto ||
              "Sem nome",

            email: usuario?.email || "",

            telefone:
              usuario?.telefone ||
              usuario?.phone ||
              "",

            ref_code:
              usuario?.ref_code ||
              usuario?.refCode ||
              "",

            tipo:
              tipoUsuario === "Motorista"
                ? "Motorista"
                : "Passageiro",

            cadastro:
              usuario?.cadastro ||
              usuario?.created_at ||
              "",

            is_active: isActive,

            is_temp_blocked: isTempBlocked,

            blocked_at: blockedAt,

            bloqueado,
          };
        }
      );

      setUsuarios(usuariosFormatados);

      /**
       * ======================================================
       * PAGINAÇÃO
       * ======================================================
       */

      if (data?.paginacao) {
        const total =
          Number(data.paginacao.total) || 0;

        const totalPaginas =
          Number(data.paginacao.totalPaginas) ||
          Math.ceil(
            total / ITENS_POR_PAGINA
          );

        setPaginacao({
          pagina:
            Number(data.paginacao.pagina) ||
            pagina,

          limite:
            Number(data.paginacao.limite) ||
            ITENS_POR_PAGINA,

          total,
          totalPaginas,
        });
      } else {
        const total =
          usuariosFormatados.length;

        setPaginacao({
          pagina,
          limite: ITENS_POR_PAGINA,
          total,
          totalPaginas: Math.ceil(
            total / ITENS_POR_PAGINA
          ),
        });
      }
    } catch (error) {
      console.error(
        "Erro ao carregar usuários:",
        error
      );

      setUsuarios([]);

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os usuários."
      );
    } finally {
      setLoading(false);
    }
  }, [pagina, busca, tipo]);

  useEffect(() => {
    carregarUsuarios();
  }, [carregarUsuarios]);

  /**
   * ============================================================
   * ATUALIZAR
   * ============================================================
   */

  async function atualizarTabela() {
    await carregarUsuarios();
  }

  /**
   * ============================================================
   * MODAL
   * ============================================================
   */

  function abrirModalBloqueio(usuario: Usuario) {
    setUsuarioParaBloquear(usuario);
    setModalBloqueioAberto(true);
  }

  function fecharModalBloqueio() {
    if (bloqueando) {
      return;
    }

    setModalBloqueioAberto(false);
    setUsuarioParaBloquear(null);
  }

  /**
   * ============================================================
   * BLOQUEAR / DESBLOQUEAR
   * ============================================================
   */

  async function confirmarBloqueio() {
    if (!usuarioParaBloquear?.id) {
      setErro("Usuário inválido.");
      return;
    }

    const usuarioId =
      String(usuarioParaBloquear.id).trim();

    /**
     * Estado atual
     *
     * false = desbloqueado
     * true  = bloqueado
     */

    const estadoAnterior =
      usuarioParaBloquear.bloqueado;

    /**
     * Inverte o estado
     *
     * desbloqueado -> bloquear
     * bloqueado -> desbloquear
     */

    const novaSituacao =
      !estadoAnterior;

    try {
      setBloqueando(true);
      setErro("");
      setSucesso("");

      const response = await fetch(
        `/api/usuarios/${encodeURIComponent(
          usuarioId
        )}/bloquear`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            bloqueado: novaSituacao,
            enviarEmail: novaSituacao,
            enviarWhatsApp: novaSituacao,
          }),
        }
      );

      const texto =
        await response.text();

      let data: any = {};

      try {
        data = texto
          ? JSON.parse(texto)
          : {};
      } catch {
        throw new Error(
          "A API não retornou um JSON válido."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            data?.message ||
            `Erro ${response.status} ao ${
              novaSituacao
                ? "bloquear"
                : "desbloquear"
            } usuário.`
        );
      }

      if (data?.sucesso === false) {
        throw new Error(
          data?.error ||
            data?.message ||
            "Não foi possível alterar o bloqueio."
        );
      }

      /**
       * ========================================================
       * DESCOBRIR O ESTADO REAL
       * ========================================================
       */

      let bloqueadoAtual =
        novaSituacao;

      /**
       * 1. blocked_at retornado pela API
       *
       * Se existir e estiver preenchido:
       * bloqueado = true
       */

      if (
        data?.usuario?.blocked_at !==
        undefined
      ) {
        bloqueadoAtual =
          data.usuario.blocked_at !== null &&
          data.usuario.blocked_at !== "";
      }

      /**
       * 2. is_active
       */

      else if (
        data?.usuario?.is_active !==
        undefined
      ) {
        bloqueadoAtual =
          Number(
            data.usuario.is_active
          ) === 0;
      }

      /**
       * 3. usuario.bloqueado
       */

      else if (
        data?.usuario?.bloqueado !==
        undefined
      ) {
        bloqueadoAtual =
          data.usuario.bloqueado === true ||
          Number(
            data.usuario.bloqueado
          ) === 1 ||
          data.usuario.bloqueado === "true";
      }

      /**
       * 4. bloqueado diretamente
       */

      else if (
        data?.bloqueado !== undefined
      ) {
        bloqueadoAtual =
          data.bloqueado === true ||
          Number(data.bloqueado) === 1 ||
          data.bloqueado === "true";
      }

      /**
       * 5. ação
       */

      else if (data?.acao) {
        bloqueadoAtual =
          data.acao === "bloqueado" ||
          data.acao === "blocked";
      }

      /**
       * ========================================================
       * DATA DO BLOQUEIO
       * ========================================================
       */

      let blockedAtAtual:
        | string
        | null;

      if (bloqueadoAtual) {
        blockedAtAtual =
          data?.usuario?.blocked_at ??
          data?.blocked_at ??
          new Date().toISOString();
      } else {
        blockedAtAtual = null;
      }

      /**
       * ========================================================
       * ATUALIZA A TABELA
       * ========================================================
       */

      setUsuarios(
        (usuariosAtuais) =>
          usuariosAtuais.map(
            (usuario) =>
              usuario.id === usuarioId
                ? {
                    ...usuario,

                    bloqueado:
                      bloqueadoAtual,

                    is_active:
                      bloqueadoAtual
                        ? 0
                        : 1,

                    is_temp_blocked:
                      bloqueadoAtual
                        ? usuario.is_temp_blocked
                        : 0,

                    blocked_at:
                      blockedAtAtual,
                  }
                : usuario
          )
      );

      /**
       * ========================================================
       * FECHA MODAL
       * ========================================================
       */

      setModalBloqueioAberto(false);
      setUsuarioParaBloquear(null);

      /**
       * ========================================================
       * MENSAGEM
       * ========================================================
       */

      setSucesso(
        data?.message ||
          (bloqueadoAtual
            ? "Usuário bloqueado com sucesso."
            : "Usuário desbloqueado com sucesso.")
      );

      setTimeout(() => {
        setSucesso("");
      }, 4000);
    } catch (error) {
      console.error(
        "Erro ao alterar bloqueio do usuário:",
        error
      );

      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o bloqueio do usuário."
      );
    } finally {
      setBloqueando(false);
    }
  }

  /**
   * ============================================================
   * FILTROS
   * ============================================================
   */

  function alterarBusca(valor: string) {
    setBusca(valor);

    if (pagina !== 1) {
      setPagina(1);
    }
  }

  function alterarTipo(valor: string) {
    setTipo(valor);

    if (pagina !== 1) {
      setPagina(1);
    }
  }

  /**
   * ============================================================
   * PAGINAÇÃO
   * ============================================================
   */

  function irParaPagina(
    novaPagina: number
  ) {
    if (novaPagina < 1) {
      return;
    }

    if (
      paginacao.totalPaginas > 0 &&
      novaPagina >
        paginacao.totalPaginas
    ) {
      return;
    }

    setPagina(novaPagina);
  }

  const paginas = useMemo(() => {
    const total =
      paginacao.totalPaginas;

    if (total <= 1) {
      return [1];
    }

    const quantidadeVisivel = 5;

    if (total <= quantidadeVisivel) {
      return Array.from(
        { length: total },
        (_, index) => index + 1
      );
    }

    const paginasGeradas: (
      | number
      | string
    )[] = [];

    paginasGeradas.push(1);

    let inicio = Math.max(
      2,
      pagina - 1
    );

    let fim = Math.min(
      total - 1,
      pagina + 1
    );

    if (pagina <= 3) {
      inicio = 2;
      fim = 4;
    }

    if (pagina >= total - 2) {
      inicio = total - 3;
      fim = total - 1;
    }

    if (inicio > 2) {
      paginasGeradas.push("...");
    }

    for (
      let numero = inicio;
      numero <= fim;
      numero++
    ) {
      paginasGeradas.push(numero);
    }

    if (fim < total - 1) {
      paginasGeradas.push("...");
    }

    paginasGeradas.push(total);

    return paginasGeradas;
  }, [
    pagina,
    paginacao.totalPaginas,
  ]);

  /**
   * ============================================================
   * VISUALIZAR
   * ============================================================
   */

  function visualizarUsuario(
    usuario: Usuario
  ) {
    const id =
      String(usuario.id ?? "").trim();

    if (!id) {
      setErro(
        "Este usuário não possui um ID válido."
      );
      return;
    }

    router.push(
      `/diretor/passageiros_motoristas/visualizacao/${encodeURIComponent(
        id
      )}`
    );
  }

  /**
   * ============================================================
   * FORMATAÇÕES
   * ============================================================
   */

  function formatarTelefone(
    telefone: string
  ) {
    const numeros =
      String(telefone || "").replace(
        /\D/g,
        ""
      );

    if (!numeros) {
      return "-";
    }

    if (numeros.length === 11) {
      return numeros.replace(
        /^(\d{2})(\d{5})(\d{4})$/,
        "($1) $2-$3"
      );
    }

    if (numeros.length === 10) {
      return numeros.replace(
        /^(\d{2})(\d{4})(\d{4})$/,
        "($1) $2-$3"
      );
    }

    if (
      numeros.length === 13 &&
      numeros.startsWith("55")
    ) {
      return numeros.replace(
        /^55(\d{2})(\d{5})(\d{4})$/,
        "($1) $2-$3"
      );
    }

    if (
      numeros.length === 12 &&
      numeros.startsWith("55")
    ) {
      return numeros.replace(
        /^55(\d{2})(\d{4})(\d{4})$/,
        "($1) $2-$3"
      );
    }

    return telefone;
  }

  function formatarData(data: string) {
    if (!data) {
      return "-";
    }

    const date = new Date(data);

    if (Number.isNaN(date.getTime())) {
      return data;
    }

    return date.toLocaleDateString(
      "pt-BR",
      {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }
    );
  }

  const primeiroRegistro =
    paginacao.total === 0
      ? 0
      : (pagina - 1) *
          ITENS_POR_PAGINA +
        1;

  const ultimoRegistro =
    paginacao.total === 0
      ? 0
      : Math.min(
          pagina *
            ITENS_POR_PAGINA,
          paginacao.total
        );

  return (
    <div className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* CABEÇALHO */}

      <div className="flex flex-col gap-4 border-b border-slate-100 p-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-100">
            <svg
              className="h-6 w-6 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.8}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"
              />

              <circle
                cx="9"
                cy="7"
                r="4"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M22 21v-2a4 4 0 00-3-3.87"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 3.13a4 4 0 010 7.75"
              />
            </svg>
          </div>

          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Todos os Passageiros e Motoristas
            </h2>

            <p className="text-sm text-slate-500">
              Lista completa dos usuários cadastrados.
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              window.history.back()
            }
            className="cursor-pointer rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            ← Voltar
          </button>

          <button
            type="button"
            onClick={atualizarTabela}
            disabled={loading}
            className="flex w-fit cursor-pointer items-center gap-2 rounded-xl bg-[#00a99d] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#00958b] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={17}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />

            {loading
              ? "Atualizando..."
              : "Atualizar"}
          </button>
        </div>
      </div>

      {/* FILTROS */}

      <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row">
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m21 21-4.35-4.35m2.35-5.65a8 8 0 11-16 0 8 8 0 0116 0z"
            />
          </svg>

          <input
            type="text"
            value={busca}
            onChange={(e) =>
              alterarBusca(
                e.target.value
              )
            }
            placeholder="Buscar por nome, e-mail, telefone ou ID..."
            className="h-11 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />
        </div>

        <select
          value={tipo}
          onChange={(e) =>
            alterarTipo(
              e.target.value
            )
          }
          className="h-11 cursor-pointer rounded-lg border border-slate-200 bg-white px-4 text-sm text-slate-600 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        >
          <option value="">
            Todos os tipos
          </option>

          <option value="Motorista">
            Motorista
          </option>

          <option value="Passageiro">
            Passageiro
          </option>
        </select>
      </div>

      {/* ERRO */}

      {erro && (
        <div className="border-b border-red-100 bg-red-50 px-5 py-3">
          <p className="text-sm text-red-600">
            {erro}
          </p>
        </div>
      )}

      {/* SUCESSO */}

      {sucesso && (
        <div className="border-b border-emerald-100 bg-emerald-50 px-5 py-3">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                ✓
              </div>

              <p className="text-sm font-semibold text-emerald-700">
                {sucesso}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setSucesso("")
              }
              className="cursor-pointer text-sm font-semibold text-emerald-600 hover:text-emerald-800"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* TABELA */}

      <div className="w-full overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-700">
                ID
              </th>

              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-700">
                NOME
              </th>

              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-700">
                E-MAIL
              </th>

              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-700">
                TELEFONE
              </th>

              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-700">
                REF CODE
              </th>

              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-700">
                TIPO
              </th>

              <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-700">
                DATA DO CADASTRO
              </th>

              <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-700">
                AÇÕES
              </th>
            </tr>
          </thead>

          <tbody>
            {/* LOADING */}

            {loading && (
              <tr>
                <td
                  colSpan={8}
                  className="px-6 py-14"
                >
                  <div className="flex items-center justify-center gap-3">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />

                    <span className="text-sm text-slate-500">
                      Carregando usuários...
                    </span>
                  </div>
                </td>
              </tr>
            )}

            {/* USUÁRIOS */}

            {!loading &&
              !erro &&
              usuarios.length > 0 &&
              usuarios.map((usuario) => (
                <tr
                  key={usuario.id}
                  className={`border-b border-slate-100 transition ${
                    usuario.bloqueado
                      ? "bg-red-50/40"
                      : "hover:bg-slate-50"
                  }`}
                >
                  {/* ID */}

                  <td className="max-w-[250px] px-6 py-4">
                    <span
                      title={usuario.id}
                      className="block truncate text-xs font-semibold text-blue-900"
                    >
                      {usuario.id}
                    </span>
                  </td>

                  {/* NOME */}

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                          usuario.bloqueado
                            ? "bg-red-100 text-red-600"
                            : "bg-emerald-100 text-emerald-600"
                        }`}
                      >
                        {usuario.nome
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div>
                        <span className="block text-sm font-semibold text-slate-900">
                          {usuario.nome}
                        </span>

                        {usuario.bloqueado && (
                          <span className="text-xs font-semibold text-red-600">
                            Usuário bloqueado
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* EMAIL */}

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {usuario.email || "-"}
                  </td>

                  {/* TELEFONE */}

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formatarTelefone(
                      usuario.telefone
                    )}
                  </td>

                  {/* REF CODE */}

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {usuario.ref_code || "-"}
                  </td>

                  {/* TIPO */}

                  <td className="px-6 py-4">
                    {usuario.tipo ===
                    "Motorista" ? (
                      <span className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                        Motorista
                      </span>
                    ) : (
                      <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Passageiro
                      </span>
                    )}
                  </td>

                  {/* DATA */}

                  <td className="px-6 py-4 text-sm text-slate-600">
                    {formatarData(
                      usuario.cadastro
                    )}
                  </td>

                  {/* AÇÕES */}

                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      {/* VISUALIZAR */}

                      <button
                        type="button"
                        title="Visualizar"
                        aria-label={`Visualizar ${usuario.nome}`}
                        onClick={() =>
                          visualizarUsuario(
                            usuario
                          )
                        }
                        className="cursor-pointer rounded-lg p-2 text-slate-500 transition hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Eye size={18} />
                      </button>

                      {/* CADEADO */}

                      <button
                        type="button"
                        title={
                          usuario.bloqueado
                            ? "Desbloquear usuário"
                            : "Bloquear usuário"
                        }
                        aria-label={
                          usuario.bloqueado
                            ? `Desbloquear ${usuario.nome}`
                            : `Bloquear ${usuario.nome}`
                        }
                        onClick={() =>
                          abrirModalBloqueio(
                            usuario
                          )
                        }
                        disabled={bloqueando}
                        className={`cursor-pointer rounded-lg p-2 transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          usuario.bloqueado
                            ? "text-red-600 hover:bg-emerald-50 hover:text-emerald-600"
                            : "text-slate-500 hover:bg-red-50 hover:text-red-600"
                        }`}
                      >
                        {usuario.bloqueado ? (
                          <Lock size={18} />
                        ) : (
                          <LockOpen size={18} />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

            {/* SEM RESULTADOS */}

            {!loading &&
              !erro &&
              usuarios.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-14 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="text-3xl">
                        👥
                      </div>

                      <span className="text-sm font-medium text-slate-600">
                        Nenhum usuário encontrado.
                      </span>

                      <span className="text-xs text-slate-400">
                        Tente alterar os filtros.
                      </span>
                    </div>
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>

      {/* PAGINAÇÃO */}

      <div className="flex flex-col gap-4 border-t border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
        <span className="text-xs text-slate-500">
          Mostrando{" "}
          <strong>
            {primeiroRegistro}
          </strong>{" "}
          até{" "}
          <strong>
            {ultimoRegistro}
          </strong>{" "}
          de{" "}
          <strong>
            {paginacao.total}
          </strong>{" "}
          registros
        </span>

        {paginacao.totalPaginas > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={
                pagina === 1 ||
                loading
              }
              onClick={() =>
                irParaPagina(
                  pagina - 1
                )
              }
              className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 transition hover:border-emerald-500 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Anterior
            </button>

            {paginas.map(
              (numero, index) => {
                if (
                  numero === "..."
                ) {
                  return (
                    <span
                      key={`ellipsis-${index}`}
                      className="px-2 text-sm text-slate-400"
                    >
                      ...
                    </span>
                  );
                }

                return (
                  <button
                    key={numero}
                    type="button"
                    disabled={loading}
                    onClick={() =>
                      irParaPagina(
                        numero as number
                      )
                    }
                    className={`h-9 min-w-9 cursor-pointer rounded-lg px-3 text-sm font-semibold transition ${
                      pagina === numero
                        ? "bg-emerald-600 text-white"
                        : "border border-slate-200 bg-white text-slate-500 hover:border-emerald-500 hover:text-emerald-600"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {numero}
                  </button>
                );
              }
            )}

            <button
              type="button"
              disabled={
                pagina >=
                  paginacao.totalPaginas ||
                paginacao.totalPaginas ===
                  0 ||
                loading
              }
              onClick={() =>
                irParaPagina(
                  pagina + 1
                )
              }
              className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-500 transition hover:border-emerald-500 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      {/* MODAL BLOQUEAR / DESBLOQUEAR */}

      {modalBloqueioAberto &&
        usuarioParaBloquear && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
            onClick={
              fecharModalBloqueio
            }
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <div className="mb-5 flex items-start gap-4">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${
                    usuarioParaBloquear.bloqueado
                      ? "bg-emerald-100"
                      : "bg-red-100"
                  }`}
                >
                  {usuarioParaBloquear.bloqueado ? (
                    <LockOpen
                      size={24}
                      className="text-emerald-600"
                    />
                  ) : (
                    <Lock
                      size={24}
                      className="text-red-600"
                    />
                  )}
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {usuarioParaBloquear.bloqueado
                      ? "Desbloquear usuário?"
                      : "Bloquear usuário?"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {usuarioParaBloquear.bloqueado
                      ? "O acesso deste usuário será liberado novamente."
                      : "O acesso deste usuário será bloqueado."}
                  </p>
                </div>
              </div>

              <div className="mb-5 rounded-xl bg-slate-50 p-4">
                <p className="text-sm font-bold text-slate-800">
                  {usuarioParaBloquear.nome}
                </p>

                {usuarioParaBloquear.email && (
                  <p className="mt-1 text-sm text-slate-500">
                    {usuarioParaBloquear.email}
                  </p>
                )}

                {usuarioParaBloquear.telefone && (
                  <p className="mt-1 text-sm text-slate-500">
                    {formatarTelefone(
                      usuarioParaBloquear.telefone
                    )}
                  </p>
                )}
              </div>

              {!usuarioParaBloquear.bloqueado && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="text-sm leading-6 text-amber-800">
                    Tem certeza que deseja bloquear este usuário?
                  </p>

                  <p className="mt-2 text-sm leading-6 text-amber-700">
                    Após confirmar, o usuário será bloqueado e receberá uma notificação por{" "}
                    <strong>
                      email e WhatsApp
                    </strong>
                    .
                  </p>
                </div>
              )}

              {usuarioParaBloquear.bloqueado && (
                <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                  <p className="text-sm leading-6 text-emerald-800">
                    O acesso do usuário será liberado novamente.
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  disabled={bloqueando}
                  onClick={
                    fecharModalBloqueio
                  }
                  className="cursor-pointer rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={bloqueando}
                  onClick={
                    confirmarBloqueio
                  }
                  className={`flex cursor-pointer items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                    usuarioParaBloquear.bloqueado
                      ? "bg-emerald-600 hover:bg-emerald-700"
                      : "bg-red-600 hover:bg-red-700"
                  }`}
                >
                  {bloqueando && (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  )}

                  {bloqueando
                    ? usuarioParaBloquear.bloqueado
                      ? "Desbloqueando..."
                      : "Bloqueando..."
                    : usuarioParaBloquear.bloqueado
                    ? "Sim, desbloquear"
                    : "Sim, bloquear"}
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
}