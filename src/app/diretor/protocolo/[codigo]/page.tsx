import { db } from "../../../lib/db";
import Sidebar from "../../../components/sidebar";
import Header from "../../../components/header";

export default async function Protocolo({ params }: any) {
  const { codigo } = await params;

  const codigoLimpo = decodeURIComponent(codigo).trim();

  const [rows]: any = await db.query(
    "SELECT * FROM protocolos WHERE codigo = ?",
    [codigoLimpo]
  );

  if (!rows || rows.length === 0) {
    return (
      <div className="p-6 text-center text-red-500">
        Protocolo não encontrado
      </div>
    );
  }

  const protocolo = rows[0];

  const [mensagens]: any = await db.query(
    "SELECT * FROM mensagens WHERE protocolo_id = ? ORDER BY criado_em ASC",
    [protocolo.id]
  );

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={false} />

      <div className="flex flex-1 flex-col">
        <Header toggleSidebar={() => {}} />

        <main className="min-h-screen bg-gray-50 p-6">
          <div className="mx-auto max-w-2xl rounded-xl bg-white p-6 shadow">
            <h1 className="text-xl font-bold">
              {protocolo.assunto}
            </h1>

            <p className="mb-2 text-sm text-gray-500">
              Código: {protocolo.codigo}
            </p>

            <p className="mb-4">
              Status:{" "}
              <span className="font-semibold">
                {protocolo.status}
              </span>
            </p>

            <div className="mt-4 space-y-2">
              {mensagens.map((msg: any) => (
                <div
                  key={msg.id}
                  className="rounded-lg bg-gray-100 p-3"
                >
                  <strong>{msg.remetente}</strong>: {msg.mensagem}
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
