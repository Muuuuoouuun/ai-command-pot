'use client';

import { useRouter } from 'next/navigation';

interface Props {
  agents: Array<{ id: string; name: string }>;
  currentAgentId: string;
  currentStatus: string;
  currentRange: string;
}

export function LogsFilters({ agents, currentAgentId, currentStatus, currentRange }: Props) {
  const router = useRouter();

  const handleAgentChange = (agentId: string) => {
    const params = new URLSearchParams();
    params.set('status', currentStatus);
    params.set('range', currentRange);
    if (agentId) params.set('agentId', agentId);
    router.push(`/logs?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={currentAgentId}
        onChange={(e) => handleAgentChange(e.target.value)}
        className="text-xs rounded-full border border-line px-3 py-1 bg-paper text-ink focus:ring-1 focus:ring-ink outline-none"
      >
        <option value="">All Agents</option>
        {agents.map((a) => (
          <option key={a.id} value={a.id}>{a.name}</option>
        ))}
      </select>
      {currentAgentId && (
        <button
          onClick={() => handleAgentChange('')}
          className="text-xs text-ink/40 hover:text-ink transition-colors"
        >
          × clear
        </button>
      )}
    </div>
  );
}
