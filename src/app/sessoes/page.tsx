"use client";
import { useState, useEffect } from "react";
import Sidebar from "../components/sidebar";
import Header from "../components/header";
import { AlertTriangle, Smartphone, Monitor, ChevronRight } from "lucide-react";

type Usuario = {
    id: string;
    nome: string;
    email: string;
    whatsapp: string;
    profile_image: string | null;
    tipo: "driver" | "customer";
};

type Session = {
    user_id: string;
    ip: string | null;
    user_agent: string | null;
    refresh_token: string;
    created_at: string;
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [collapsed, setCollapsed] = useState(false);
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [loadingLogout, setLoadingLogout] = useState(false);

    useEffect(() => {
        const saved = localStorage.getItem("sidebar");
        if (saved) setCollapsed(saved === "true");
    }, []);

    useEffect(() => {
        localStorage.setItem("sidebar", String(collapsed));
    }, [collapsed]);

    useEffect(() => {
        const carregarUsuario = async () => {
            try {
                const res = await fetch("/api/me", { credentials: "include" });
                if (!res.ok) return (window.location.href = "/");

                const data: Usuario = await res.json();
                if (!data || !data.id) return (window.location.href = "/");

                setUsuario(data);

                const sessRes = await fetch(`/api/sessions?userId=${data.id}`, {
                    credentials: "include",
                });

                if (sessRes.ok) {
                    const sessData: Session[] = await sessRes.json();
                    setSessions(sessData);
                }
            } catch (error) {
                console.error("Erro:", error);
                window.location.href = "/";
            } finally {
                setLoading(false);
            }
        };

        carregarUsuario();
    }, []);

    const getDeviceType = (userAgent: string | null) => {
        if (!userAgent) return "desktop";
        const ua = userAgent.toLowerCase();
        if (ua.includes("android") || ua.includes("iphone") || ua.includes("mobile")) {
            return "mobile";
        }
        return "desktop";
    };

    const parseUserAgent = (userAgent: string | null) => {
        if (!userAgent) {
            return { device: "Desconhecido", browser: "Desconhecido", os: "Desconhecido" };
        }

        const ua = userAgent.toLowerCase();

        const isMobile =
            ua.includes("android") || ua.includes("iphone") || ua.includes("mobile");

        const device = isMobile ? "Mobile" : "Desktop";

        let os = "Desconhecido";
        if (ua.includes("windows")) os = "Windows";
        else if (ua.includes("mac")) os = "MacOS";
        else if (ua.includes("android")) os = "Android";
        else if (ua.includes("iphone") || ua.includes("ipad")) os = "iOS";
        else if (ua.includes("linux")) os = "Linux";

        let browser = "Desconhecido";
        if (ua.includes("edg")) browser = "Edge";
        else if (ua.includes("chrome")) browser = "Chrome";
        else if (ua.includes("firefox")) browser = "Firefox";
        else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";

        return { device, browser, os };
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        const pad = (n: number) => String(n).padStart(2, "0");
        const day = pad(date.getDate());
        const month = pad(date.getMonth() + 1);
        const year = date.getFullYear();
        const hours = pad(date.getHours());
        const minutes = pad(date.getMinutes());
        const seconds = pad(date.getSeconds());
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };

    const logoutAllSessions = async () => {
        try {
            setLoadingLogout(true);
            setError(null);

            const res = await fetch("/api/logout-all", {
                method: "POST",
                credentials: "include",
            });
            if (!res.ok) {
                setError("Erro ao encerrar sessões");
                return;
            }
            localStorage.clear();
            window.location.href = "/";
        } catch (error) {
            console.error(error);
            setError("Erro ao sair de todas as sessões");
        } finally {
            setLoadingLogout(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="bg-gray-400 p-8 rounded-2xl shadow-lg flex flex-col items-center gap-4">
                    <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-300 font-medium">Aguarde, carregando página...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen">
            <Sidebar collapsed={collapsed} />
            <div className="flex flex-col flex-1">
                <Header toggleSidebar={() => setCollapsed(!collapsed)} />
                <main className="p-6 bg-gray-50 min-h-screen">
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold">Sessões Ativas</h1>
                        <button
                            type="button"
                            onClick={logoutAllSessions}
                            disabled={loadingLogout}
                            className={`px-4 py-2 cursor-pointer text-sm rounded-3xl font-semibold text-white transition ${loadingLogout
                                ? "bg-red-400 cursor-not-allowed"
                                : "bg-red-500 hover:bg-red-600"
                                }`}
                        >
                            {loadingLogout ? "Saindo..." : "Sair de Todos os Dispositivos"}
                        </button>
                    </div>
                    {error && (
                        <div className="mb-4 text-sm flex items-center gap-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                            <span className="font-semibold">Erro:</span>
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="space-y-4">
                        {sessions.length === 0 ? (
                            <div className="flex items-center gap-2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                                <AlertTriangle size={18} />
                                <span>Nenhuma sessão encontrada.</span>
                            </div>
                        ) : (
                            sessions.map((session) => {
                                const deviceType = getDeviceType(session.user_agent);
                                const info = parseUserAgent(session.user_agent);
                                return (
                                    <div
                                        key={session.refresh_token}
                                        className="w-full bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer"
                                    >
                                        <div className="flex items-center justify-between p-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 flex items-center justify-center bg-gray-100 rounded-lg">
                                                    {deviceType === "mobile" ? (
                                                        <Smartphone className="text-gray-600" size={22} />
                                                    ) : (
                                                        <Monitor className="text-gray-600" size={22} />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm text-gray-500">
                                                        1 sessão em um {deviceType === "mobile" ? "smartphone" : "computador"}
                                                    </span>
                                                    <span className="font-semibold text-gray-800">
                                                        {info.os}
                                                    </span>
                                                    <span className="text-xs text-teal-500 font-semibold">
                                                        {info.browser}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <div className="text-right text-sm">
                                                    <p className="font-medium text-gray-800">
                                                        {info.device} • {info.os}
                                                    </p>
                                                    <p className="text-gray-500">
                                                        {session.ip || "Local desconhecido"}
                                                    </p>
                                                    <p className="text-gray-400 text-xs">
                                                        {formatDateTime(session.created_at)}
                                                    </p>
                                                </div>
                                                <ChevronRight className="text-gray-400" size={20} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}