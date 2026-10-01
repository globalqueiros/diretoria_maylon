type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function MotoristaPage({
  params,
}: PageProps) {
  const { id } = await params;

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold text-slate-900">
        Motorista
      </h1>

      <p className="mt-2 text-slate-600">
        ID: {id}
      </p>
    </main>
  );
}
