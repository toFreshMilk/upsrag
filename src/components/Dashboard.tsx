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
        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 shadow-sm shrink-0">
            {displayStats.map((stat, index) => (
                <div key={stat.label} className={`flex flex-col items-center flex-1 ${index !== displayStats.length - 1 ? 'border-r border-slate-100' : ''}`}>
                    <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                    <p className={`text-base font-bold mt-0.5 ${stat.color}`}>{stat.value}</p>
                </div>
            ))}
        </div>
    );
}
