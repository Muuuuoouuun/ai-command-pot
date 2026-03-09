'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionTitle } from '@/components/section-title';
import { BarChart3, TrendingUp, Zap, AlertCircle, DollarSign, RefreshCw } from 'lucide-react';

type ServiceStat = { calls: number; cost: number; tokens: number; errors: number };
type DailyRow = {
  date: string;
  service: string;
  total_calls: number;
  total_cost_usd: number;
};
type Budget = {
  id: string;
  service: string;
  budget_type: string;
  budget_usd: number;
  alert_threshold_percent: number;
};

type DashboardData = {
  summary: { totalCost: number; totalCalls: number; totalTokens: number; errorCount: number; period: string };
  byService: Record<string, ServiceStat>;
  daily: DailyRow[];
  budgets: Budget[];
};

const SERVICE_COLORS: Record<string, string> = {
  claude: 'bg-orange-500',
  gemini: 'bg-blue-500',
  codex: 'bg-green-500',
  github: 'bg-gray-700',
  antigravity: 'bg-purple-500',
  other: 'bg-slate-400',
};

const SERVICE_ICONS: Record<string, string> = {
  claude: 'C',
  gemini: 'G',
  codex: 'O',
  github: 'GH',
  antigravity: 'AG',
  other: '?',
};

export default function AIUsagePage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai-usage/dashboard?period=${period}`);
      const json = await res.json();
      setData(json);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const services = data ? Object.entries(data.byService) : [];
  const totalCost = data?.summary.totalCost ?? 0;
  const totalCalls = data?.summary.totalCalls ?? 0;
  const totalTokens = data?.summary.totalTokens ?? 0;
  const errorRate = totalCalls > 0 ? ((data?.summary.errorCount ?? 0) / totalCalls * 100).toFixed(1) : '0';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <SectionTitle title="AI Usage Dashboard" subtitle="Track token consumption, costs, and service performance" />
        <div className="flex items-center gap-2">
          {(['7d', '30d', '90d'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                period === p ? 'bg-ink text-white' : 'bg-ink/5 text-ink/60 hover:bg-ink/10'
              }`}
            >
              {p}
            </button>
          ))}
          <button
            onClick={fetchData}
            disabled={loading}
            className="p-1.5 rounded-lg bg-ink/5 hover:bg-ink/10 text-ink/60 transition-all"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Spend', value: `$${totalCost.toFixed(4)}`, icon: DollarSign, color: 'text-green-600' },
          { label: 'API Calls', value: totalCalls.toLocaleString(), icon: Zap, color: 'text-blue-600' },
          { label: 'Tokens Used', value: totalTokens > 1000 ? `${(totalTokens / 1000).toFixed(1)}K` : totalTokens.toString(), icon: BarChart3, color: 'text-purple-600' },
          { label: 'Error Rate', value: `${errorRate}%`, icon: AlertCircle, color: 'text-red-500' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="paper-card p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-ink/50 uppercase tracking-wider">{label}</span>
              <Icon size={16} className={color} />
            </div>
            <div className="text-2xl font-bold text-ink font-mono">{loading ? '—' : value}</div>
          </div>
        ))}
      </div>

      {/* Service Breakdown */}
      <div>
        <h2 className="font-serif text-lg font-bold mb-4">Service Breakdown</h2>
        {!loading && services.length === 0 ? (
          <div className="text-center py-16 bg-white/50 border border-dashed border-line rounded-2xl">
            <BarChart3 size={40} className="text-ink/20 mx-auto mb-3" />
            <p className="text-sm text-ink/50">No usage data for this period.</p>
            <p className="text-xs text-ink/30 mt-1">Use the <code>/api/ai-usage/track</code> endpoint to log AI calls.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map(([service, stat]) => {
              const budget = data?.budgets.find(b => b.service === service && b.budget_type === 'monthly');
              const budgetPct = budget ? Math.min(100, (stat.cost / budget.budget_usd) * 100) : null;

              return (
                <div key={service} className="paper-card p-5 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg ${SERVICE_COLORS[service] ?? 'bg-slate-400'} flex items-center justify-center text-white text-xs font-bold`}>
                      {SERVICE_ICONS[service] ?? service.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-ink capitalize">{service}</div>
                      <div className="text-xs text-ink/40">{stat.calls.toLocaleString()} calls</div>
                    </div>
                    <div className="ml-auto text-right">
                      <div className="font-mono text-sm font-bold text-ink">${stat.cost.toFixed(4)}</div>
                      <div className="text-xs text-ink/40">{((stat.tokens ?? 0) / 1000).toFixed(1)}K tokens</div>
                    </div>
                  </div>

                  {stat.errors > 0 && (
                    <div className="flex items-center gap-1.5 text-red-500 text-xs bg-red-50 rounded-lg px-2 py-1">
                      <AlertCircle size={12} />
                      {stat.errors} error{stat.errors > 1 ? 's' : ''}
                    </div>
                  )}

                  {budgetPct !== null && (
                    <div>
                      <div className="flex justify-between text-xs text-ink/40 mb-1">
                        <span>Monthly Budget</span>
                        <span>{budgetPct.toFixed(0)}%</span>
                      </div>
                      <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${budgetPct >= 100 ? 'bg-red-500' : budgetPct >= 80 ? 'bg-amber-500' : 'bg-green-500'}`}
                          style={{ width: `${budgetPct}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {loading && Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="paper-card p-5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-ink/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-ink/10 rounded w-24" />
                    <div className="h-2 bg-ink/5 rounded w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Timeline */}
      {data && data.daily.length > 0 && (
        <div>
          <h2 className="font-serif text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-ink/40" />
            Daily Activity
          </h2>
          <div className="paper-card p-5 overflow-x-auto">
            <div className="flex items-end gap-1 min-w-[400px] h-32">
              {(() => {
                const grouped: Record<string, number> = {};
                for (const row of data.daily) {
                  grouped[row.date] = (grouped[row.date] ?? 0) + row.total_calls;
                }
                const dates = Object.keys(grouped).sort();
                const maxVal = Math.max(...Object.values(grouped), 1);
                return dates.map(date => (
                  <div key={date} className="flex flex-col items-center flex-1 gap-1" title={`${date}: ${grouped[date]} calls`}>
                    <div
                      className="w-full bg-ink/80 rounded-t transition-all hover:bg-ink"
                      style={{ height: `${(grouped[date] / maxVal) * 100}%`, minHeight: grouped[date] > 0 ? '4px' : '0' }}
                    />
                    {dates.length <= 14 && (
                      <span className="text-[9px] text-ink/30 rotate-45 origin-left">{date.slice(5)}</span>
                    )}
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {/* How to track */}
      <div className="paper-card p-5 bg-ink/2 border-dashed">
        <h3 className="font-semibold text-sm text-ink mb-2">How to Track AI Usage</h3>
        <p className="text-xs text-ink/50 mb-3">
          POST to <code className="bg-ink/10 px-1 rounded">/api/ai-usage/track</code> after each AI call to log usage data.
        </p>
        <pre className="text-xs bg-ink/5 rounded-xl p-3 overflow-x-auto text-ink/70">{`fetch('/api/ai-usage/track', {
  method: 'POST',
  body: JSON.stringify({
    service: 'claude',
    model: 'claude-sonnet-4-6',
    operation: 'chat',
    tokens_input: 1200,
    tokens_output: 450,
    cost_usd: 0.0048,
    latency_ms: 1230,
    status: 'success'
  })
})`}</pre>
      </div>
    </div>
  );
}
