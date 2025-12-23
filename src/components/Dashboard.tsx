interface DashboardProps {
    stats: {
        totalDocs: number;
        totalTokens: number;
        avgLatency: number; // ms 단위
    };
}

export default function Dashboard({ stats }: DashboardProps) {
    const displayStats = [
        {
            label: "전체 문서",
            value: `${stats.totalDocs}건`,
            color: "text-blue-600"
        },
        {
            label: "사용 토큰",
            value: stats.totalTokens > 1000
                ? `${(stats.totalTokens / 1000).toFixed(1)}k`
                : `${stats.totalTokens}`,
            color: "text-green-600"
        },
        {
            label: "평균 응답속도",
            value: stats.avgLatency > 0 ? `${stats.avgLatency}ms` : "-",
            color: "text-orange-600"
        },
    ];

    return (
        <div className="grid grid-cols-3 gap-4">
            {displayStats.map((stat) => (
                <div key={stat.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                </div>
            ))}
        </div>
    );
}
