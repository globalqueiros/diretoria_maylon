"use client";

import {
    AlertTriangle,
    ArrowDownToLine,
    ArrowUpRight,
    BarChart3,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    Clock3,
    FileText,
    Filter,
    Package,
    RefreshCw,
    ShoppingCart,
    Truck,
    Users,
    WalletCards,
} from "lucide-react";

const indicators = [
    {
        title: "Total comprado",
        value: "R$ 48.750,00",
        change: "+12,8% este mês",
        icon: WalletCards,
        color: "green",
    },
    {
        title: "Pedidos de compra",
        value: "128",
        change: "+8,4% este mês",
        icon: ShoppingCart,
        color: "blue",
    },
    {
        title: "Solicitações pendentes",
        value: "24",
        change: "-5,2% este mês",
        icon: FileText,
        color: "purple",
    },
    {
        title: "Economia obtida",
        value: "R$ 8.420,00",
        change: "+18,6% este mês",
        icon: ArrowUpRight,
        color: "orange",
    },
];

const purchaseFlow = [
    {
        title: "Solicitações recebidas",
        value: 186,
        width: "100%",
        color: "bg-blue-600",
    },
    {
        title: "Em cotação",
        value: 64,
        width: "72%",
        color: "bg-blue-500",
    },
    {
        title: "Aguardando aprovação",
        value: 24,
        width: "45%",
        color: "bg-violet-500",
    },
    {
        title: "Pedidos realizados",
        value: 128,
        width: "65%",
        color: "bg-indigo-500",
    },
    {
        title: "Pedidos recebidos",
        value: 97,
        width: "52%",
        color: "bg-emerald-500",
    },
];

const suppliers = [
    {
        name: "Fornecedor ABC",
        orders: 32,
        value: "R$ 14.820,00",
        status: "Em dia",
        statusColor: "bg-emerald-50 text-emerald-600",
    },
    {
        name: "Tech Solutions",
        orders: 24,
        value: "R$ 9.640,00",
        status: "Em dia",
        statusColor: "bg-emerald-50 text-emerald-600",
    },
    {
        name: "Distribuidora Central",
        orders: 18,
        value: "R$ 7.320,00",
        status: "Atenção",
        statusColor: "bg-orange-50 text-orange-600",
    },
    {
        name: "Logística Brasil",
        orders: 14,
        value: "R$ 5.890,00",
        status: "Atrasado",
        statusColor: "bg-red-50 text-red-600",
    },
];

const categories = [
    {
        name: "Material de escritório",
        value: "R$ 12.480,00",
        width: "82%",
    },
    {
        name: "Tecnologia",
        value: "R$ 9.850,00",
        width: "68%",
    },
    {
        name: "Manutenção",
        value: "R$ 7.420,00",
        width: "53%",
    },
    {
        name: "Produção",
        value: "R$ 6.890,00",
        width: "48%",
    },
];

const recentPurchases = [
    {
        number: "#PC-1024",
        supplier: "Fornecedor ABC",
        date: "01/09/2026",
        value: "R$ 4.850,00",
        status: "Recebido",
    },
    {
        number: "#PC-1023",
        supplier: "Tech Solutions",
        date: "31/08/2026",
        value: "R$ 7.240,00",
        status: "Em trânsito",
    },
    {
        number: "#PC-1022",
        supplier: "Distribuidora Central",
        date: "30/08/2026",
        value: "R$ 2.980,00",
        status: "Aguardando",
    },
    {
        number: "#PC-1021",
        supplier: "Logística Brasil",
        date: "29/08/2026",
        value: "R$ 6.420,00",
        status: "Atrasado",
    },
];

const colorClasses: Record<string, string> = {
    green: "bg-emerald-100 text-emerald-600",
    blue: "bg-blue-100 text-blue-600",
    purple: "bg-violet-100 text-violet-600",
    orange: "bg-orange-100 text-orange-500",
};

function SectionHeader({
    icon: Icon,
    title,
    description,
    color = "blue",
}: {
    icon: any;
    title: string;
    description: string;
    color?: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${colorClasses[color]}`}
            >
                <Icon size={21} />
            </div>
            <div>
                <h2 className="font-bold text-[#092b55]">{title}</h2>
                <p className="text-xs text-slate-500">{description}</p>
            </div>
        </div>
    );
}

function SummaryCard({
    icon: Icon,
    title,
    value,
    color,
}: {
    icon: any;
    title: string;
    value: string;
    color: string;
}) {
    return (
        <div className="rounded-lg border border-slate-200 p-4">
            <div className="flex items-center gap-2">
                <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${colorClasses[color]}`}
                >
                    <Icon size={16} />
                </div>
                <span className="text-xs text-slate-500">{title}</span>
            </div>
            <strong className="mt-3 block text-xl font-extrabold text-[#092b55]">
                {value}
            </strong>
        </div>
    );
}

export default function ComprasPage() {
    return (
        <main className="min-h-screen">
            <div className="mx-auto max-w-[1600px]">
                <header className="mb-5 flex items-start justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold tracking-tight text-white">
                            Compras
                        </h1>
                        <p className="mt-0 text-sm text-white">
                            Acompanhe solicitações, pedidos, fornecedores e gastos.
                        </p>
                    </div>
                    <button className="hidden cursor-pointer items-center gap-2 rounded-lg bg-[#00aaa2] px-5 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#009991] sm:flex">
                        <RefreshCw size={17} />
                        Atualizar
                    </button>
                </header>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {indicators.map((item) => {
                        const Icon = item.icon;

                        return (
                            <div
                                key={item.title}
                                className="rounded-xl bg-white p-5 shadow-sm"
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-sm text-slate-500">
                                            {item.title}
                                        </p>
                                        <h2 className="mt-2 text-[25px] font-extrabold tracking-tight text-[#092b55]">
                                            {item.value}
                                        </h2>
                                        <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-500">
                                            <ArrowUpRight size={13} />
                                            {item.change}
                                        </div>
                                    </div>
                                    <div
                                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClasses[item.color]}`}
                                    >
                                        <Icon size={23} />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </section>

                <section className="mt-5 overflow-hidden rounded-xl bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-5">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                            <SectionHeader
                                icon={BarChart3}
                                title="Desempenho de compras"
                                description="Visão geral dos principais indicadores de compras."
                            />
                            <p className="text-xs text-slate-500">
                                Atualizado em{" "}
                                <strong className="text-[#092b55]">
                                    21:09:24 01/09/2026
                                </strong>
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2 border-b border-slate-100 p-4">
                        <button className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-medium text-slate-600">
                            <CalendarDays size={15} />
                            Este mês
                            <ChevronDown size={15} />
                        </button>
                        <button className="flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600">
                            <Filter size={15} />
                            Mais filtros
                        </button>
                        <button className="ml-auto flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600">
                            <ArrowDownToLine size={15} />
                            Exportar
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
                        <SummaryCard
                            icon={ShoppingCart}
                            title="Pedidos realizados"
                            value="128"
                            color="blue"
                        />
                        <SummaryCard
                            icon={Clock3}
                            title="Aguardando aprovação"
                            value="24"
                            color="purple"
                        />
                        <SummaryCard
                            icon={Truck}
                            title="Entregas pendentes"
                            value="31"
                            color="orange"
                        />
                        <SummaryCard
                            icon={CheckCircle2}
                            title="Pedidos recebidos"
                            value="97"
                            color="green"
                        />
                    </div>
                </section>

                <section className="mt-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
                    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                        <div className="border-b border-slate-100 p-5">
                            <SectionHeader
                                icon={Package}
                                title="Fluxo de compras"
                                description="Acompanhe cada etapa das solicitações."
                                color="blue"
                            />
                        </div>

                        <div className="space-y-5 p-5">
                            {purchaseFlow.map((item) => (
                                <div key={item.title}>
                                    <div className="mb-2 flex justify-between text-xs">
                                        <span className="text-slate-600">
                                            {item.title}
                                        </span>
                                        <strong className="text-[#092b55]">
                                            {item.value}
                                        </strong>
                                    </div>
                                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className={`h-full rounded-full ${item.color}`}
                                            style={{ width: item.width }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-xl bg-white shadow-sm">
                        <div className="border-b border-slate-100 p-5">
                            <SectionHeader
                                icon={WalletCards}
                                title="Gastos por categoria"
                                description="Veja onde o orçamento está sendo utilizado."
                                color="green"
                            />
                        </div>

                        <div className="space-y-5 p-5">
                            {categories.map((category) => (
                                <div key={category.name}>
                                    <div className="mb-2 flex justify-between text-xs">
                                        <span className="text-slate-600">
                                            {category.name}
                                        </span>
                                        <strong className="text-[#092b55]">
                                            {category.value}
                                        </strong>
                                    </div>
                                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                                        <div
                                            className="h-full rounded-full bg-emerald-500"
                                            style={{ width: category.width }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <section className="mt-5 overflow-hidden rounded-xl bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-5">
                        <SectionHeader
                            icon={Users}
                            title="Desempenho dos fornecedores"
                            description="Acompanhe pedidos, valores e situação das entregas."
                            color="purple"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left">
                            <thead>
                                <tr className="border-b border-slate-100 text-xs text-slate-400">
                                    <th className="px-5 py-4 font-medium">
                                        Fornecedor
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Pedidos
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Valor comprado
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Status
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Ação
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {suppliers.map((supplier) => (
                                    <tr
                                        key={supplier.name}
                                        className="border-b border-slate-50 last:border-0"
                                    >
                                        <td className="px-5 py-4 text-sm font-semibold text-[#092b55]">
                                            {supplier.name}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-500">
                                            {supplier.orders}
                                        </td>
                                        <td className="px-5 py-4 text-sm font-semibold text-[#092b55]">
                                            {supplier.value}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${supplier.statusColor}`}
                                            >
                                                {supplier.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <button className="text-xs font-semibold text-blue-600 hover:underline">
                                                Ver detalhes
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="mt-5 overflow-hidden rounded-xl bg-white shadow-sm">
                    <div className="border-b border-slate-100 p-5">
                        <SectionHeader
                            icon={ShoppingCart}
                            title="Pedidos de compra recentes"
                            description="Últimos pedidos realizados pelo setor."
                            color="blue"
                        />
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[800px] text-left">
                            <thead>
                                <tr className="border-b border-slate-100 text-xs text-slate-400">
                                    <th className="px-5 py-4 font-medium">
                                        Pedido
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Fornecedor
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Data
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Valor
                                    </th>
                                    <th className="px-5 py-4 font-medium">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {recentPurchases.map((purchase) => (
                                    <tr
                                        key={purchase.number}
                                        className="border-b border-slate-50 last:border-0"
                                    >
                                        <td className="px-5 py-4 text-sm font-bold text-blue-600">
                                            {purchase.number}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-600">
                                            {purchase.supplier}
                                        </td>
                                        <td className="px-5 py-4 text-sm text-slate-500">
                                            {purchase.date}
                                        </td>
                                        <td className="px-5 py-4 text-sm font-semibold text-[#092b55]">
                                            {purchase.value}
                                        </td>
                                        <td className="px-5 py-4">
                                            <span
                                                className={`rounded-full px-3 py-1 text-[11px] font-semibold ${purchase.status === "Recebido"
                                                        ? "bg-emerald-50 text-emerald-600"
                                                        : purchase.status === "Atrasado"
                                                            ? "bg-red-50 text-red-600"
                                                            : purchase.status === "Em trânsito"
                                                                ? "bg-blue-50 text-blue-600"
                                                                : "bg-orange-50 text-orange-600"
                                                    }`}
                                            >
                                                {purchase.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>

                <section className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
                    <AlertCard
                        icon={AlertTriangle}
                        title="Pedidos atrasados"
                        value="7 pedidos"
                        description="Precisam de acompanhamento."
                        color="red"
                    />
                    <AlertCard
                        icon={Clock3}
                        title="Aguardando aprovação"
                        value="24 solicitações"
                        description="Aguardando aprovação do responsável."
                        color="orange"
                    />
                    <AlertCard
                        icon={Truck}
                        title="Entregas hoje"
                        value="12 pedidos"
                        description="Previsão de recebimento hoje."
                        color="blue"
                    />
                </section>
            </div>
        </main>
    );
}

function AlertCard({
    icon: Icon,
    title,
    value,
    description,
    color,
}: {
    icon: any;
    title: string;
    value: string;
    description: string;
    color: "red" | "orange" | "blue";
}) {
    const colors = {
        red: "bg-red-50 text-red-500",
        orange: "bg-orange-50 text-orange-500",
        blue: "bg-blue-50 text-blue-500",
    };

    return (
        <div className="flex items-start gap-4 rounded-xl bg-white p-5 shadow-sm">
            <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${colors[color]}`}
            >
                <Icon size={20} />
            </div>
            <div>
                <p className="text-xs text-slate-500">{title}</p>
                <strong className="mt-1 block text-lg text-[#092b55]">
                    {value}
                </strong>
                <p className="mt-1 text-xs text-slate-400">
                    {description}
                </p>
            </div>
        </div>
    );
}
