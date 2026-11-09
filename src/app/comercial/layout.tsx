import "../globals.css";
import LayoutContainer from "./dashboard-layout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dashboard-layout">
      <LayoutContainer>{children}</LayoutContainer>
    </div>
  );
}