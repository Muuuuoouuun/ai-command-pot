export default function WeeklySummary() {
    return (
        <div className="bg-gradient-to-br from-ink to-slate-800 text-white rounded-2xl p-6 shadow-soft relative overflow-hidden text-center sm:text-left">
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4 text-white/60 text-xs uppercase tracking-widest font-medium">
                    Weekly AI Insight
                </div>
                <h3 className="text-xl font-serif font-medium leading-relaxed mb-4">
                    "This week, your system processed <span className="text-yellow-200">12 automations</span>. Memos indicate a focus on stability."
                </h3>
                <ul className="text-sm font-light space-y-2 opacity-80">
                    <li>• System health: 98%</li>
                    <li>• Top agent: Data Fetcher</li>
                    <li>• Pending: 2 memos to process</li>
                </ul>
            </div>
        </div>
    );
}
