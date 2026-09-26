"use client";

import {
    ArrowDown,
    ArrowUp,
    BarChart3,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    CircleDollarSign,
    Download,
    Filter,
    Megaphone,
    Plus,
    RefreshCw,
    Search,
    Target,
    TrendingUp,
    UserPlus,
    Users,
    Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";

type LeadStatus = "Novo" | "Contato" | "Qualificado" | "Convertido";
type CampaignStatus = "Ativa" | "Pausada" | "Finalizada";

type Lead = {
    id: string;
    name: string;
    email: string;
    phone: string;
    source: string;
    status: LeadStatus;
    date: string;
};

type Campaign = {
    id: string;
    name: string;
    channel: string;
    budget: number;
    spent: number;
    leads: number;
    conversions: number;
    status: CampaignStatus;
};

const leads: Lead[] = [
    {
        id: "#L00128",
        name: "João da Silva",
        email: "joao@email.com",
        phone: "(11) 99999-1234",
        source: "Instagram",
        status: "Novo",
        date: "01/09/2026 20:42",
    },
    {
        id: "#L00127",
        name: "Maria Oliveira",
        email: "maria@email.com",
        phone: "(11) 99888-4421",
        source: "Google",
        status: "Qualificado",
        date: "01/09/2026 19:32",
    },
    {
        id: "#L00126",
        name: "Carlos Santos",
        email: "carlos@email.com",
        phone: "(21) 99777-3211",
        source: "Facebook",
        status: "Contato",
        date: "01/09/2026 18:18",
    },
    {
        id: "#L00125",
        name: "Ana Souza",
        email: "ana@email.com",
        phone: "(31) 99666-2134",
        source: "Indicação",
        status: "Convertido",
        date: "01/09/2026 17:45",
    },
    {
        id: "#L00124",
        name: "Pedro Costa",
        email: "pedro@email.com",
        phone: "(41) 99555-1122",
        source: "Instagram",
        status: "Qualificado",
        date: "01/09/2026 16:23",
    },
    {
        id: "#L00123",
        name: "Fernanda Lima",
        email: "fernanda@email.com",
        phone: "(51) 99444-2311",
        source: "Google",
        status: "Novo",
        date: "01/09/2026 15:41",
    },
];

const campaigns: Campaign[] = [
    {
        id: "#C001",
        name: "Campanha Setembro",
        channel: "Instagram",
        budget: 5000,
        spent: 3240,
        leads: 128,
        conversions: 34,
        status: "Ativa",
    },
    {
        id: "#C002",
        name: "Google Ads - Corridas",
        channel: "Google",
        budget: 8000,
        spent: 6120,
        leads: 186,
        conversions: 48,
        status: "Ativa",
    },
    {
        id: "#C003",
        name: "Facebook - Motoristas",
        channel: "Facebook",
        budget: 3500,
        spent: 2100,
        leads: 82,
        conversions: 19,
        status: "Ativa",
    },
    {
        id: "#C004",
        name: "Campanha Agosto",
        channel: "Instagram",
        budget: 4000,
        spent: 4000,
        leads: 104,
        conversions: 27,
        status: "Finalizada",
    },
];

const money = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
});

const number = new Intl.NumberFormat("pt-BR");

export default function ComercialPage() {
    const [period, setPeriod] = useState("Este mês");
    const [leadStatus, setLeadStatus] = useState("Todos");
    const [search, setSearch] = useState("");

    const faturamento = 48750;
    const vendas = 128;
    const totalLeads = 624;
    const conversao = 20.5;

    const investimento = campaigns.reduce(
        (total, campaign) => total + campaign.spent,
        0
    );

    const totalConversions = campaigns.reduce(
        (total, campaign) => total + campaign.conversions,
        0
    );

    const roi =
        investimento > 0
            ? ((faturamento - investimento) / investimento) * 100
            : 0;

    const filteredLeads = useMemo(() => {
        return leads.filter((lead) => {
            const matchesStatus =
                leadStatus === "Todos" || lead.status === leadStatus;

            const query = search.toLowerCase().trim();

            const matchesSearch =
                lead.name.toLowerCase().includes(query) ||
                lead.email.toLowerCase().includes(query) ||
                lead.source.toLowerCase().includes(query) ||
                lead.id.toLowerCase().includes(query);

            return matchesStatus && matchesSearch;
        });
    }, [leadStatus, search]);

    function exportLeads() {
        const headers = [
            "ID",
            "Nome",
            "E-mail",
            "Telefone",
            "Origem",
            "Status",
            "Data",
        ];

        const rows = leads.map((lead) => [
            lead.id,
            lead.name,
            lead.email,
            lead.phone,
            lead.source,
            lead.status,
            lead.date,
        ]);

        const csv = [
            headers.join(";"),
            ...rows.map((row) =>
                row
                    .map((value) => `"${String(value).replace(/"/g, '""')}"`)
                    .join(";")
            ),
        ].join("\n");

        const blob = new Blob(["\ufeff" + csv], {
            type: "text/csv;charset=utf-8;",
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = "leads-comercial.csv";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);
    }

    return (
        <main className="min-h-screen">
            <header className="mb-5 flex flex-col gap-4 text-white md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-[30px] font-extrabold tracking-tight">
                        Comercial & Marketing
                    </h1>

                    <p className="text-sm text-white/95">
                        Acompanhe vendas, leads, campanhas e resultados comerciais.
                    </p>
                </div>

                <button
                    onClick={() => window.location.reload()}
                    className="flex items-center justify-center gap-2 rounded-[10px] bg-[#00a99d] px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#009990]"
                >
                    <RefreshCw size={17} />
                    Atualizar
                </button>
            </header>

            <section className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    title="Faturamento"
                    value={money.format(faturamento)}
                    description="+18,4% este mês"
                    icon={<CircleDollarSign size={23} />}
                    iconClass="bg-[#d3f9e8] text-[#00a681]"
                    positive
                />

                <MetricCard
                    title="Vendas"
                    value={number.format(vendas)}
                    description="+12,8% este mês"
                    icon={<TrendingUp size={23} />}
                    iconClass="bg-[#dce9ff] text-[#1264e8]"
                    positive
                />

                <MetricCard
                    title="Leads"
                    value={number.format(totalLeads)}
                    description="+24,2% este mês"
                    icon={<UserPlus size={23} />}
                    iconClass="bg-[#e9e1ff] text-[#7651d8]"
                    positive
                />

                <MetricCard
                    title="Conversão"
                    value={`${conversao.toFixed(1)}%`}
                    description="+2,3% este mês"
                    icon={<Target size={23} />}
                    iconClass="bg-[#ffead3] text-[#e58a18]"
                    positive
                />
            </section>

            <section className="mb-5 overflow-hidden rounded-xl bg-white shadow-[0_2px_7px_rgba(17,61,67,0.10)]">
                <div className="flex min-h-[98px] items-center gap-3 border-b border-[#edf1f5] px-6 py-6">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-[#dce9ff] text-[#1264e8]">
                        <BarChart3 size={21} />
                    </div>

                    <div>
                        <h2 className="text-[18px] font-bold text-[#192c48]">
                            Desempenho comercial
                        </h2>

                        <p className="text-[13px] text-[#5f7391]">
                            Visão geral dos principais indicadores comerciais.
                        </p>
                    </div>

                    <span className="ml-auto hidden whitespace-nowrap text-xs text-[#607493] lg:block">
                        Atualizado em{" "}
                        <strong className="text-[#1a3455]">
                            21:09:24 01/09/2026
                        </strong>
                    </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-b border-[#edf1f5] px-6 py-4">
                    <label className="flex h-[38px] items-center gap-2 rounded-lg border border-[#dce4ed] bg-white px-3 text-[#5b6f8b]">
                        <CalendarDays size={16} />

                        <select
                            value={period}
                            onChange={(event) => setPeriod(event.target.value)}
                            className="min-w-[125px] cursor-pointer border-0 bg-transparent text-xs text-[#334b69] outline-none"
                        >
                            <option>Hoje</option>
                            <option>Esta semana</option>
                            <option>Este mês</option>
                            <option>Últimos 30 dias</option>
                            <option>Este ano</option>
                        </select>
                    </label>

                    <button className="flex h-[38px] items-center gap-2 rounded-lg border border-[#dce4ed] bg-white px-4 text-xs font-semibold text-[#38516f] transition hover:bg-[#f6f9fb]">
                        <Filter size={16} />
                        Mais filtros
                    </button>

                    <button
                        onClick={exportLeads}
                        className="ml-auto flex h-[38px] items-center gap-2 rounded-lg border border-[#dce4ed] bg-white px-4 text-xs font-semibold text-[#38516f] transition hover:bg-[#f6f9fb]"
                    >
                        <Download size={16} />
                        Exportar
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-3 p-5 md:grid-cols-2 xl:grid-cols-4">
                    <PerformanceCard
                        label="Faturamento"
                        value={money.format(faturamento)}
                        icon={<Wallet size={18} />}
                        color="text-[#00a681]"
                        bg="bg-[#d3f9e8]"
                    />

                    <PerformanceCard
                        label="Ticket médio"
                        value={money.format(faturamento / vendas)}
                        icon={<CircleDollarSign size={18} />}
                        color="text-[#1264e8]"
                        bg="bg-[#dce9ff]"
                    />

                    <PerformanceCard
                        label="Leads convertidos"
                        value={number.format(totalConversions)}
                        icon={<Users size={18} />}
                        color="text-[#7651d8]"
                        bg="bg-[#e9e1ff]"
                    />

                    <PerformanceCard
                        label="ROI Marketing"
                        value={`${roi.toFixed(1)}%`}
                        icon={<TrendingUp size={18} />}
                        color="text-[#e58a18]"
                        bg="bg-[#ffead3]"
                    />
                </div>
            </section>

            <section className="mb-5 grid grid-cols-1 gap-5 xl:grid-cols-2">
                <section className="overflow-hidden rounded-xl bg-white shadow-[0_2px_7px_rgba(17,61,67,0.10)]">
                    <div className="flex min-h-[91px] items-center gap-3 border-b border-[#edf1f5] px-6 py-5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-[#d3f9e8] text-[#00a681]">
                            <Target size={21} />
                        </div>

                        <div>
                            <h2 className="text-[18px] font-bold text-[#192c48]">
                                Funil comercial
                            </h2>

                            <p className="text-[13px] text-[#5f7391]">
                                Acompanhe a evolução dos seus leads.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4 p-6">
                        <FunnelRow
                            label="Leads recebidos"
                            value={624}
                            percentage={100}
                            color="bg-[#1264e8]"
                        />

                        <FunnelRow
                            label="Em contato"
                            value={318}
                            percentage={51}
                            color="bg-[#3783ee]"
                        />

                        <FunnelRow
                            label="Qualificados"
                            value={176}
                            percentage={28}
                            color="bg-[#7651d8]"
                        />

                        <FunnelRow
                            label="Propostas"
                            value={91}
                            percentage={15}
                            color="bg-[#9a7be7]"
                        />

                        <FunnelRow
                            label="Convertidos"
                            value={128}
                            percentage={20}
                            color="bg-[#00a681]"
                        />
                    </div>
                </section>

                <section className="overflow-hidden rounded-xl bg-white shadow-[0_2px_7px_rgba(17,61,67,0.10)]">
                    <div className="flex min-h-[91px] items-center gap-3 border-b border-[#edf1f5] px-6 py-5">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-[#e9e1ff] text-[#7651d8]">
                            <Megaphone size={21} />
                        </div>

                        <div>
                            <h2 className="text-[18px] font-bold text-[#192c48]">
                                Desempenho por canal
                            </h2>

                            <p className="text-[13px] text-[#5f7391]">
                                Veja de onde estão vindo seus leads.
                            </p>
                        </div>
                    </div>

                    <div className="divide-y divide-[#edf1f5]">
                        <ChannelRow
                            name="Instagram"
                            leads={210}
                            conversions={52}
                            percentage={84}
                            color="bg-[#e1306c]"
                        />

                        <ChannelRow
                            name="Google"
                            leads={186}
                            conversions={48}
                            percentage={76}
                            color="bg-[#4285f4]"
                        />

                        <ChannelRow
                            name="Facebook"
                            leads={128}
                            conversions={31}
                            percentage={61}
                            color="bg-[#1877f2]"
                        />

                        <ChannelRow
                            name="Indicação"
                            leads={72}
                            conversions={24}
                            percentage={48}
                            color="bg-[#00a681]"
                        />

                        <ChannelRow
                            name="Site"
                            leads={28}
                            conversions={9}
                            percentage={28}
                            color="bg-[#f59e0b]"
                        />
                    </div>
                </section>
            </section>

            <section className="mb-5 overflow-hidden rounded-xl bg-white shadow-[0_2px_7px_rgba(17,61,67,0.10)]">
                <div className="flex min-h-[91px] items-center gap-3 border-b border-[#edf1f5] px-6 py-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-[#dce9ff] text-[#1264e8]">
                        <Megaphone size={21} />
                    </div>

                    <div>
                        <h2 className="text-[18px] font-bold text-[#192c48]">
                            Campanhas de marketing
                        </h2>

                        <p className="text-[13px] text-[#5f7391]">
                            Acompanhe investimento e resultados das campanhas.
                        </p>
                    </div>

                    <button className="ml-auto flex items-center gap-2 rounded-lg bg-[#00a681] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#008f70]">
                        <Plus size={16} />
                        Nova campanha
                    </button>
                </div>

                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[950px] border-collapse">
                        <thead className="bg-[#f0f4f8]">
                            <tr>
                                <TableHead>ID</TableHead>
                                <TableHead>CAMPANHA</TableHead>
                                <TableHead>CANAL</TableHead>
                                <TableHead>ORÇAMENTO</TableHead>
                                <TableHead>INVESTIDO</TableHead>
                                <TableHead>LEADS</TableHead>
                                <TableHead>CONVERSÕES</TableHead>
                                <TableHead>STATUS</TableHead>
                            </tr>
                        </thead>

                        <tbody>
                            {campaigns.map((campaign) => (
                                <tr
                                    key={campaign.id}
                                    className="transition hover:bg-[#fafcfd]"
                                >
                                    <TableCell className="font-semibold text-[#637893]">
                                        {campaign.id}
                                    </TableCell>

                                    <TableCell className="font-semibold text-[#263d5a]">
                                        {campaign.name}
                                    </TableCell>

                                    <TableCell>{campaign.channel}</TableCell>

                                    <TableCell>
                                        {money.format(campaign.budget)}
                                    </TableCell>

                                    <TableCell>
                                        {money.format(campaign.spent)}
                                    </TableCell>

                                    <TableCell>
                                        <span className="font-bold text-[#1264e8]">
                                            {campaign.leads}
                                        </span>
                                    </TableCell>

                                    <TableCell>
                                        <span className="font-bold text-[#00a681]">
                                            {campaign.conversions}
                                        </span>
                                    </TableCell>

                                    <TableCell>
                                        <CampaignStatus status={campaign.status} />
                                    </TableCell>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex min-h-[69px] items-center justify-between px-5 text-xs text-[#637893]">
                    <span>Mostrando {campaigns.length} campanhas</span>

                    <div className="flex gap-1.5">
                        <button
                            disabled
                            className="flex h-[38px] items-center gap-1 rounded-lg border border-[#e3e9ef] bg-white px-3 text-xs text-[#a7b3c1]"
                        >
                            <ChevronLeft size={16} />
                            Anterior
                        </button>

                        <button
                            disabled
                            className="flex h-[38px] items-center gap-1 rounded-lg border border-[#e3e9ef] bg-white px-3 text-xs text-[#a7b3c1]"
                        >
                            Próxima
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </section>

            <section className="overflow-hidden rounded-xl bg-white shadow-[0_2px_7px_rgba(17,61,67,0.10)]">
                <div className="flex min-h-[91px] items-center gap-3 border-b border-[#edf1f5] px-6 py-5">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px] bg-[#d3f9e8] text-[#00a681]">
                        <UserPlus size={21} />
                    </div>

                    <div>
                        <h2 className="text-[18px] font-bold text-[#192c48]">
                            Leads recentes
                        </h2>

                        <p className="text-[13px] text-[#5f7391]">
                            Novos contatos e oportunidades comerciais.
                        </p>
                    </div>

                    <div className="ml-auto hidden items-center md:flex">
                        <div className="relative">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9bae]"
                            />

                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Buscar lead..."
                                className="h-[38px] w-[230px] rounded-lg border border-[#dce4ed] pl-9 pr-3 text-xs text-[#314a69] outline-none transition placeholder:text-[#9aa9ba] focus:border-[#35b99b]"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 border-b border-[#edf1f5] px-6 py-3">
                    <div className="flex h-[34px] items-center gap-2 rounded-lg bg-[#f5f8fa] px-3 text-xs text-[#637893]">
                        <Filter size={14} />

                        <select
                            value={leadStatus}
                            onChange={(event) => setLeadStatus(event.target.value)}
                            className="cursor-pointer border-0 bg-transparent outline-none"
                        >
                            <option>Todos</option>
                            <option>Novo</option>
                            <option>Contato</option>
                            <option>Qualificado</option>
                            <option>Convertido</option>
                        </select>
                    </div>

                    <button
                        onClick={exportLeads}
                        className="ml-auto flex h-[34px] items-center gap-2 rounded-lg border border-[#dce4ed] bg-white px-3 text-xs font-semibold text-[#38516f] hover:bg-[#f6f9fb]"
                    >
                        <Download size={14} />
                        Exportar
                    </button>
                </div>

                <div className="border-b border-[#edf1f5] px-4 py-3 md:hidden">
                    <div className="relative">
                        <Search
                            size={16}
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b9bae]"
                        />

                        <input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Buscar lead..."
                            className="h-[38px] w-full rounded-lg border border-[#dce4ed] pl-9 pr-3 text-xs outline-none"
                        />
                    </div>
                </div>

                <div className="w-full overflow-x-auto">
                    <table className="w-full min-w-[900px] border-collapse">
                        <thead className="bg-[#f0f4f8]">
                            <tr>
                                <TableHead>ID</TableHead>
                                <TableHead>NOME</TableHead>
                                <TableHead>E-MAIL</TableHead>
                                <TableHead>TELEFONE</TableHead>
                                <TableHead>ORIGEM</TableHead>
                                <TableHead>STATUS</TableHead>
                                <TableHead>CADASTRO</TableHead>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredLeads.length > 0 ? (
                                filteredLeads.map((lead) => (
                                    <tr
                                        key={lead.id}
                                        className="transition hover:bg-[#fafcfd]"
                                    >
                                        <TableCell className="font-semibold text-[#637893]">
                                            {lead.id}
                                        </TableCell>

                                        <TableCell className="font-semibold text-[#263d5a]">
                                            {lead.name}
                                        </TableCell>

                                        <TableCell>{lead.email}</TableCell>

                                        <TableCell>{lead.phone}</TableCell>

                                        <TableCell>{lead.source}</TableCell>

                                        <TableCell>
                                            <LeadStatusBadge status={lead.status} />
                                        </TableCell>

                                        <TableCell>{lead.date}</TableCell>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td
                                        colSpan={7}
                                        className="h-[120px] text-center text-sm text-[#9aa9b9]"
                                    >
                                        Nenhum lead encontrado.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex min-h-[69px] flex-col items-start justify-between gap-4 px-5 py-4 text-xs text-[#637893] sm:flex-row sm:items-center">
                    <span>
                        Mostrando {filteredLeads.length} de {leads.length} leads
                    </span>

                    <div className="flex gap-1.5">
                        <button
                            disabled
                            className="flex h-[38px] items-center gap-1 rounded-lg border border-[#e3e9ef] bg-white px-3 text-xs text-[#a7b3c1]"
                        >
                            <ChevronLeft size={16} />
                            Anterior
                        </button>

                        <button
                            disabled
                            className="flex h-[38px] items-center gap-1 rounded-lg border border-[#e3e9ef] bg-white px-3 text-xs text-[#a7b3c1]"
                        >
                            Próxima
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </section>

            <button
                aria-label="Ajuda"
                className="fixed bottom-5 right-5 flex h-16 w-16 items-center justify-center rounded-full border-0 bg-[#00a6ad] text-2xl font-bold text-white shadow-[0_8px_22px_rgba(0,76,87,0.25)] transition hover:-translate-y-1 hover:bg-[#00969d]"
            >
                ?
            </button>
        </main>
    );
}

function MetricCard({
    title,
    value,
    description,
    icon,
    iconClass,
    positive,
}: {
    title: string;
    value: string;
    description: string;
    icon: React.ReactNode;
    iconClass: string;
    positive?: boolean;
}) {
    return (
        <div className="flex min-h-[101px] items-center justify-between rounded-xl bg-white p-5 shadow-[0_2px_7px_rgba(17,61,67,0.10)]">
            <div>
                <p className="mb-2 text-sm text-[#526887]">{title}</p>

                <strong className="block text-2xl font-extrabold tracking-tight text-[#12284a]">
                    {value}
                </strong>

                <span
                    className={`mt-1 flex items-center gap-1 text-[11px] ${
                        positive ? "text-[#00a681]" : "text-[#e23b3b]"
                    }`}
                >
                    {positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                    {description}
                </span>
            </div>

            <div
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[11px] ${iconClass}`}
            >
                {icon}
            </div>
        </div>
    );
}

function PerformanceCard({
    label,
    value,
    icon,
    color,
    bg,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    color: string;
    bg: string;
}) {
    return (
        <div className="rounded-[9px] border border-[#edf1f5] bg-white p-4">
            <div className="mb-3 flex items-center gap-2">
                <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${bg} ${color}`}
                >
                    {icon}
                </div>

                <span className="text-xs text-[#647793]">{label}</span>
            </div>

            <strong className="text-xl font-extrabold text-[#1a2e4b]">
                {value}
            </strong>
        </div>
    );
}

function FunnelRow({
    label,
    value,
    percentage,
    color,
}: {
    label: string;
    value: number;
    percentage: number;
    color: string;
}) {
    return (
        <div>
            <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-[#526986]">
                    {label}
                </span>

                <span className="text-xs font-bold text-[#263d5a]">
                    {number.format(value)}
                </span>
            </div>

            <div className="h-2.5 overflow-hidden rounded-full bg-[#edf2f6]">
                <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

function ChannelRow({
    name,
    leads,
    conversions,
    percentage,
    color,
}: {
    name: string;
    leads: number;
    conversions: number;
    percentage: number;
    color: string;
}) {
    return (
        <div className="px-6 py-4">
            <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${color}`} />

                    <span className="text-xs font-semibold text-[#304a69]">
                        {name}
                    </span>
                </div>

                <span className="text-[11px] text-[#71839a]">
                    {leads} leads · {conversions} conversões
                </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-[#edf2f6]">
                <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${percentage}%` }}
                />
            </div>
        </div>
    );
}

function CampaignStatus({ status }: { status: CampaignStatus }) {
    const styles: Record<CampaignStatus, string> = {
        Ativa: "bg-[#e1f8ee] text-[#078d6d]",
        Pausada: "bg-[#fff0cd] text-[#a26b00]",
        Finalizada: "bg-[#edf1f5] text-[#687c96]",
    };

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${styles[status]}`}
        >
            {status}
        </span>
    );
}

function LeadStatusBadge({ status }: { status: LeadStatus }) {
    const styles: Record<LeadStatus, string> = {
        Novo: "bg-[#dce9ff] text-[#1264e8]",
        Contato: "bg-[#fff0cd] text-[#a26b00]",
        Qualificado: "bg-[#e9e1ff] text-[#7651d8]",
        Convertido: "bg-[#e1f8ee] text-[#078d6d]",
    };

    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${styles[status]}`}
        >
            {status}
        </span>
    );
}

function TableHead({ children }: { children: React.ReactNode }) {
    return (
        <th className="px-[17px] py-[13px] text-left text-[11px] font-bold text-[#344c6b]">
            {children}
        </th>
    );
}

function TableCell({
    children,
    className = "",
}: {
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <td
            className={`border-b border-[#edf1f5] px-[17px] py-[15px] text-xs text-[#526986] ${className}`}
        >
            {children}
        </td>
    );
}
