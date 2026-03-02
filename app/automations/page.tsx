import { getAutomations } from '@/lib/data';
import { AutomationCard } from '@/components/automation-card';
import { SectionTitle } from '@/components/section-title';
import { Workflow } from 'lucide-react';


export type Automation = {
    id: string;
    name: string;
    description?: string;
    platform: 'n8n' | 'make';
    trigger_type: string;
    is_active: boolean;
    success_rate: number;
    last_run_at?: string;
    // ... extra fields potentially
    created_at?: string;
    owner_id?: string;
    config?: Record<string, unknown>;
};

export default async function AutomationsPage() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const automations = (await getAutomations()) as unknown as Automation[];
    const n8n = automations.filter(a => a.platform === 'n8n');
    const make = automations.filter(a => a.platform === 'make');

    // Fallback if empty to show something
    const hasData = automations.length > 0;

    return (
        <div className="space-y-10">
            <SectionTitle title="Automation Collection" subtitle="Manage and monitor your automated workflows" />

            {!hasData && (
                <div className="text-center py-20 bg-white/50 border border-dashed border-line rounded-2xl">
                    <Workflow size={48} className="text-ink/20 mx-auto mb-4" />
                    <h3 className="font-serif text-lg text-ink/60">No automations configured</h3>
                    <p className="text-sm text-ink/40">Add automations to your database to see them here.</p>
                </div>
            )}

            {/* n8n Section */}
            {n8n.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-4 sticky top-0 bg-paper/80 backdrop-blur-md z-10 py-2 border-b border-line/0">
                        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs uppercase shadow-sm">n8n</div>
                        <h2 className="font-serif text-xl font-bold">n8n Scenarios</h2>
                        <span className="bg-ink/5 text-ink/60 text-xs px-2 py-0.5 rounded-full font-mono">{n8n.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {n8n.map(a => <AutomationCard key={a.id} data={a} />)}
                    </div>
                </section>
            )}

            {/* Make Section */}
            {make.length > 0 && (
                <section>
                    <div className="flex items-center gap-3 mb-4 sticky top-0 bg-paper/80 backdrop-blur-md z-10 py-2 border-b border-line/0">
                        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600 font-bold text-xs uppercase shadow-sm">M</div>
                        <h2 className="font-serif text-xl font-bold">Make Scenarios</h2>
                        <span className="bg-ink/5 text-ink/60 text-xs px-2 py-0.5 rounded-full font-mono">{make.length}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {make.map(a => <AutomationCard key={a.id} data={a} />)}
                    </div>
                </section>
            )}
        </div>
    );
}
