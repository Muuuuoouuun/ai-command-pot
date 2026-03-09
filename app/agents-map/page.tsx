'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SectionTitle } from '@/components/section-title';
import { Bot, Wifi, WifiOff, RefreshCw, X, Clock, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

type AgentData = {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'idle' | 'working' | 'waiting' | 'error' | 'offline';
  current_task: string | null;
  last_activity: string | null;
  workspace_position: { x: number; y: number } | null;
  avatar_config: { color: string; initials: string } | null;
};

const STATUS_CONFIG = {
  idle: { label: 'Idle', color: 'bg-slate-400', textColor: 'text-slate-600', bg: 'bg-slate-50' },
  working: { label: 'Working', color: 'bg-green-500', textColor: 'text-green-700', bg: 'bg-green-50' },
  waiting: { label: 'Waiting', color: 'bg-amber-400', textColor: 'text-amber-700', bg: 'bg-amber-50' },
  error: { label: 'Error', color: 'bg-red-500', textColor: 'text-red-700', bg: 'bg-red-50' },
  offline: { label: 'Offline', color: 'bg-gray-300', textColor: 'text-gray-500', bg: 'bg-gray-50' },
};

const AVATAR_COLORS = [
  'from-blue-500 to-indigo-600',
  'from-purple-500 to-pink-600',
  'from-orange-400 to-red-500',
  'from-green-400 to-teal-500',
  'from-cyan-400 to-blue-500',
  'from-yellow-400 to-orange-500',
];

// Deterministic position assignment for agents without workspace_position
function getDefaultPosition(index: number, total: number): { x: number; y: number } {
  const cols = Math.ceil(Math.sqrt(total));
  const row = Math.floor(index / cols);
  const col = index % cols;
  return {
    x: 10 + (col / Math.max(cols - 1, 1)) * 80,
    y: 15 + (row / Math.max(Math.ceil(total / cols) - 1, 1)) * 70,
  };
}

function AgentCharacter({
  agent,
  index,
  total,
  onSelect,
  isSelected,
}: {
  agent: AgentData;
  index: number;
  total: number;
  onSelect: (a: AgentData) => void;
  isSelected: boolean;
}) {
  const pos = agent.workspace_position ?? getDefaultPosition(index, total);
  const cfg = STATUS_CONFIG[agent.status];
  const colorClass = AVATAR_COLORS[index % AVATAR_COLORS.length];
  const initials = agent.avatar_config?.initials ?? agent.name.slice(0, 2).toUpperCase();

  const characterVariants = {
    idle: { y: [0, -4, 0], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
    working: { rotate: [0, -2, 2, -2, 0], transition: { duration: 0.5, repeat: Infinity } },
    waiting: { scale: [1, 1.05, 1], transition: { duration: 1.5, repeat: Infinity } },
    error: { x: [-3, 3, -3, 3, 0], transition: { duration: 0.4, repeat: 2 } },
    offline: { opacity: 0.5 },
  };

  return (
    <motion.div
      key={agent.id}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      style={{ position: 'absolute', left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
      className="flex flex-col items-center gap-1 cursor-pointer group z-10"
      onClick={() => onSelect(agent)}
    >
      {/* Status bubble */}
      {agent.current_task && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[120px] bg-white border border-line shadow-sm rounded-xl px-2 py-1 text-[10px] text-ink/70 truncate mb-1"
        >
          {agent.current_task}
        </motion.div>
      )}

      {/* Character body */}
      <motion.div
        animate={characterVariants[agent.status] as Parameters<typeof motion.div>[0]['animate']}
        className={cn(
          'w-12 h-12 rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-sm shadow-md transition-all group-hover:scale-110 group-hover:shadow-lg',
          colorClass,
          isSelected && 'ring-2 ring-ink ring-offset-2'
        )}
      >
        {initials}
      </motion.div>

      {/* Status dot */}
      <div className="flex items-center gap-1">
        <div className={cn('w-2 h-2 rounded-full', cfg.color, agent.status === 'working' && 'animate-pulse')} />
        <span className="text-[9px] text-ink/40 font-medium">{agent.name}</span>
      </div>
    </motion.div>
  );
}

function AgentDetailPanel({ agent, onClose }: { agent: AgentData; onClose: () => void }) {
  const cfg = STATUS_CONFIG[agent.status];

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="absolute right-0 top-0 bottom-0 w-72 bg-paper border-l border-line shadow-2xl z-20 flex flex-col"
    >
      <div className="flex items-center justify-between p-4 border-b border-line">
        <h3 className="font-serif font-bold text-ink">{agent.name}</h3>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-ink/5 text-ink/40">
          <X size={16} />
        </button>
      </div>

      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium', cfg.bg, cfg.textColor)}>
          <div className={cn('w-2 h-2 rounded-full', cfg.color, agent.status === 'working' && 'animate-pulse')} />
          {cfg.label}
        </div>

        {agent.category && (
          <div>
            <div className="text-xs text-ink/40 mb-1">Category</div>
            <div className="text-sm text-ink">{agent.category}</div>
          </div>
        )}

        {agent.description && (
          <div>
            <div className="text-xs text-ink/40 mb-1">Description</div>
            <div className="text-sm text-ink/70">{agent.description}</div>
          </div>
        )}

        {agent.current_task && (
          <div>
            <div className="text-xs text-ink/40 mb-1 flex items-center gap-1">
              <Activity size={10} /> Current Task
            </div>
            <div className="text-sm text-ink bg-ink/5 rounded-xl p-3">{agent.current_task}</div>
          </div>
        )}

        {agent.last_activity && (
          <div>
            <div className="text-xs text-ink/40 mb-1 flex items-center gap-1">
              <Clock size={10} /> Last Active
            </div>
            <div className="text-sm text-ink/60">{new Date(agent.last_activity).toLocaleString()}</div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function AgentsMapPage() {
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(true);
  const [selected, setSelected] = useState<AgentData | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/agents/status');
      const json = await res.json();
      setAgents(json.data ?? []);
      setConnected(true);
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAgents();
    const interval = setInterval(fetchAgents, 10000);
    return () => clearInterval(interval);
  }, [fetchAgents]);

  const statusCounts = agents.reduce(
    (acc, a) => { acc[a.status] = (acc[a.status] ?? 0) + 1; return acc; },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionTitle title="Agent Visual Map" subtitle="Real-time view of your AI agents and their current activities" />
        <div className="flex items-center gap-3">
          <div className={cn('flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full', connected ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600')}>
            {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
            {connected ? 'Live' : 'Offline'}
          </div>
          <button
            onClick={fetchAgents}
            disabled={loading}
            className="p-1.5 rounded-lg bg-ink/5 hover:bg-ink/10 text-ink/60"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Status legend */}
      <div className="flex items-center gap-4 flex-wrap">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={cn('w-2.5 h-2.5 rounded-full', cfg.color)} />
            <span className="text-xs text-ink/50">{cfg.label}</span>
            {statusCounts[key] !== undefined && (
              <span className="text-xs font-mono text-ink/30">({statusCounts[key]})</span>
            )}
          </div>
        ))}
      </div>

      {/* Office map */}
      <div className="relative paper-card overflow-hidden" style={{ minHeight: '500px' }}>
        {/* Office background grid */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Zone labels */}
        <div className="absolute top-4 left-4 text-xs font-semibold text-ink/20 uppercase tracking-wider">AI Workspace</div>
        <div className="absolute top-4 right-4 text-xs text-ink/20">{agents.length} agents</div>

        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Bot size={40} className="text-ink/20 mx-auto mb-3 animate-pulse" />
              <p className="text-sm text-ink/40">Loading agents...</p>
            </div>
          </div>
        )}

        {!loading && agents.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Bot size={48} className="text-ink/20 mx-auto mb-3" />
              <h3 className="font-serif text-lg text-ink/60">No agents configured</h3>
              <p className="text-sm text-ink/40">Add agents in AI Launch to see them here.</p>
            </div>
          </div>
        )}

        <AnimatePresence>
          {agents.map((agent, index) => (
            <AgentCharacter
              key={agent.id}
              agent={agent}
              index={index}
              total={agents.length}
              onSelect={setSelected}
              isSelected={selected?.id === agent.id}
            />
          ))}
        </AnimatePresence>

        {/* Detail panel */}
        <AnimatePresence>
          {selected && (
            <AgentDetailPanel
              agent={selected}
              onClose={() => setSelected(null)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Agent list as fallback */}
      {agents.length > 0 && (
        <div>
          <h2 className="font-serif text-lg font-bold mb-4">All Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.map((agent, i) => {
              const cfg = STATUS_CONFIG[agent.status];
              const colorClass = AVATAR_COLORS[i % AVATAR_COLORS.length];
              const initials = agent.avatar_config?.initials ?? agent.name.slice(0, 2).toUpperCase();

              return (
                <button
                  key={agent.id}
                  onClick={() => setSelected(agent)}
                  className={cn(
                    'paper-card p-4 flex items-center gap-3 text-left hover:shadow-md transition-all',
                    selected?.id === agent.id && 'ring-2 ring-ink'
                  )}
                >
                  <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-bold text-xs flex-shrink-0', colorClass)}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-ink text-sm">{agent.name}</div>
                    <div className="text-xs text-ink/40 truncate">{agent.current_task ?? agent.category ?? 'No active task'}</div>
                  </div>
                  <div className={cn('flex items-center gap-1 text-xs px-2 py-0.5 rounded-full flex-shrink-0', cfg.bg, cfg.textColor)}>
                    <div className={cn('w-1.5 h-1.5 rounded-full', cfg.color)} />
                    {cfg.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
