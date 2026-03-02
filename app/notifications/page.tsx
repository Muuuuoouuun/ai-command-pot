import { getMemos } from '@/lib/data';
import { MemoInput } from '@/components/memo-input';
import { MemoTimeline } from '@/components/memo-timeline';
// Removed WeeklySummary for now or I can reuse the previous code if I have it.
// I will create WeeklySummary component as well.
import WeeklySummary from '@/components/weekly-summary';
import { SectionTitle } from '@/components/section-title';
import { getRuns } from '@/lib/data';

type Memo = {
    id: string;
    content: string;
    created_at: string;
    is_processed: boolean;
};

type Run = {
    id: string;
    started_at: string;
    status: string;
    agents?: { name: string };
};

export default async function NotificationsPage() {
    const memos = (await getMemos(20)) as unknown as Memo[];
    const failedRuns = ((await getRuns(50)) as unknown as Run[]).filter((r) => r.status === 'failed');

    return (
        <div className="space-y-8">
            <SectionTitle title="System Notifications" subtitle="Alerts, updates, and memos" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column: Memos & Weekly Report (7 cols) */}
                <div className="lg:col-span-7 space-y-8">
                    <WeeklySummary />

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
                                {failedRuns.slice(0, 5).map((run) => (
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
