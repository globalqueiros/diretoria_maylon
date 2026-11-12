import "../globals.css";
import LayoutContainer from "./dashboard-layout";
import { exigirPerfilNaPagina } from "../lib/roles";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await exigirPerfilNaPagina(["comercial", "diretor"]);

  return (
    <div className="dashboard-layout">
      <LayoutContainer>{children}</LayoutContainer>
    </div>
  );
}
