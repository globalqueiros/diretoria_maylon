"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import FloatingDialer from "../components/FloatingDialer";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar");
    if (saved) setCollapsed(saved === "true");
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar", String(collapsed));
  }, [collapsed]);

  return (
    <div className="flex min-h-screen">
      <Sidebar collapsed={collapsed} />
      <div className="flex flex-col flex-1">
        <Header toggleSidebar={() => setCollapsed(!collapsed)} />
        <main className="p-6 bg-gradient-to-br from-[#37ad8c] via-[#45c9a5] to-[#1f8067] min-h-screen">
          {children}
          <FloatingDialer />
        </main>
      </div>
    </div>
  );
}