import { getMemos, getRuns, getWeeklyStats } from '@/lib/data';
import { MemoInput } from '@/components/memo-input';
import { MemoTimeline } from '@/components/memo-timeline';
import WeeklySummary from '@/components/weekly-summary';
import { SectionTitle } from '@/components/section-title';

export const dynamic = 'force-dynamic';

const defaultStats: { totalRuns: number; healthPct: number; topAgentName: string | null; pendingMemos: number; monthlyCost: number } = {
    totalRuns: 0, healthPct: 100, topAgentName: null, pendingMemos: 0, monthlyCost: 0
};

export default async function NotificationsPage() {
    let memos: unknown[] = [], failedRuns: unknown[] = [];
    let weeklyStats = defaultStats;
    try {
        const [m, allRuns, ws] = await Promise.all([getMemos(20), getRuns({ limit: 50 }), getWeeklyStats()]);
        memos = m;
        failedRuns = (allRuns as { status: string }[]).filter((r) => r.status === 'failed');
        weeklyStats = ws;
    } catch {}

    return (
        <div className="space-y-8">
            <SectionTitle title="System Notifications" subtitle="Alerts, updates, and memos" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Memos & Weekly Report (7 cols) */}
                <div className="lg:col-span-7 space-y-8">
                    <WeeklySummary stats={weeklyStats} />

                    <section>
                        <h3 className="flex items-center gap-2 font-serif text-lg font-semibold mb-3">
                            My Logs
                        </h3>
                        <MemoInput />
                        <div className="mt-8">
                            <MemoTimeline memos={memos} />
                        </div>
                    </section>
                </div>

                {/* Right Column: Updates & Alerts (5 cols) */}
                <div className="lg:col-span-5 space-y-8">
                    <section>
                        <h3 className="font-serif text-lg font-semibold mb-3">Alerts</h3>
                        {failedRuns.length > 0 ? (
                            <div className="space-y-3">
                                {(failedRuns as { id: string; agents?: { name?: string }; started_at: string }[]).slice(0, 5).map((run) => (
                                    <div key={run.id} className="bg-red-50 border border-red-100 p-4 rounded-xl flex gap-3 text-sm">
                                        <div className="text-red-600 font-bold">!</div>
                                        <div>
                                            <p className="font-medium text-red-900">{run.agents?.name || 'Unknown Agent'}</p>
                                            <p className="text-xs text-red-700/60 mt-1">Failed on {new Date(run.started_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 bg-green-50 border border-green-100 rounded-xl text-center text-green-700 text-sm">
                                No recent errors found.
                            </div>
                        )}
                    </section>
                </div>
            </div>
        </div>
    );
}
