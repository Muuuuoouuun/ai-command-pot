type WeeklyStats = {
    totalRuns: number;
    healthPct: number;
    topAgentName: string | null;
    pendingMemos: number;
    monthlyCost: number;
};

export default function WeeklySummary({ stats }: { stats: WeeklyStats }) {
    const { totalRuns, healthPct, topAgentName, pendingMemos, monthlyCost } = stats;

    const headline =
        totalRuns === 0
            ? 'No automations ran this week. Everything is quiet.'
            : `This week, your system processed ${totalRuns} automation${totalRuns !== 1 ? 's' : ''}. System health looks ${healthPct >= 90 ? 'stable' : 'unstable'}.`;

    return (
        <div className="bg-gradient-to-br from-ink to-slate-800 text-white rounded-2xl p-6 shadow-soft relative overflow-hidden text-center sm:text-left">
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 text-white/60 text-xs uppercase tracking-widest font-medium">
                    Weekly AI Insight
                </div>
                <h3 className="text-xl font-serif font-medium leading-relaxed mb-4">
                    &ldquo;{headline.replace(/(\d+)/, (m) => m)}&rdquo;
                </h3>
                <ul className="text-sm font-light space-y-2 opacity-80">
                    <li>• System health: <span className={healthPct >= 90 ? 'text-green-300' : 'text-yellow-300'}>{healthPct}%</span></li>
                    <li>• Top agent: {topAgentName ?? 'No runs yet'}</li>
                    <li>• Pending memos: {pendingMemos}</li>
                    <li>• Monthly subscriptions: ${monthlyCost.toFixed(2)}</li>
                </ul>
            </div>
        </div>
    );
}
