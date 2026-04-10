'use client';

import { useState } from 'react';
import { Clock, ExternalLink, X, CheckCircle2, XCircle } from 'lucide-react';
import { toggleAutomation } from '@/app/actions';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export type Automation = {
  id: string;
  name: string;
  description?: string;
  platform: 'n8n' | 'make';
  trigger_type: string;
  is_active: boolean;
  success_rate: number;
  last_run_at?: string;
  config?: Record<string, unknown>;
};

function timeAgoShort(value?: string): string {
  if (!value) return 'Never';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AutomationDrawer({ data, onClose }: { data: Automation; onClose: () => void }) {
  const webhookUrl = data.config?.webhook_url as string | undefined;
  const [copied, setCopied] = useState(false);

  const copyWebhook = () => {
    if (!webhookUrl) return;
    navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 z-50 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-paper rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className={cn(
                'text-[10px] uppercase font-bold px-2 py-0.5 rounded',
                data.platform === 'n8n' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'
              )}>
                {data.platform}
              </span>
              <span className="text-[10px] text-ink/40 bg-ink/5 px-2 py-0.5 rounded">
                {data.trigger_type}
              </span>
            </div>
            <h3 className="font-serif font-bold text-ink">{data.name}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-ink/5 text-ink/30 flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        {data.description && (
          <p className="text-sm text-ink/60">{data.description}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: 'Success Rate', value: `${data.success_rate}%`, ok: data.success_rate >= 95 },
            { label: 'Last Run', value: timeAgoShort(data.last_run_at), ok: null },
            { label: 'Status', value: data.is_active ? 'Active' : 'Inactive', ok: data.is_active },
          ].map(({ label, value, ok }) => (
            <div key={label} className="bg-ink/5 rounded-xl p-3">
              <p className="text-[10px] text-ink/40 mb-0.5">{label}</p>
              <p className={cn(
                'text-sm font-semibold',
                ok === true ? 'text-green-600' : ok === false ? 'text-red-500' : 'text-ink'
              )}>
                {value}
              </p>
            </div>
          ))}
        </div>

        {/* Status indicator */}
        <div className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl text-xs',
          data.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-500'
        )}>
          {data.is_active
            ? <CheckCircle2 size={13} />
            : <XCircle size={13} />}
          {data.is_active ? '현재 활성화 상태입니다' : '비활성화 상태입니다'}
        </div>

        {/* Webhook URL */}
        {webhookUrl ? (
          <div>
            <p className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-1.5">Webhook URL</p>
            <div className="flex items-center gap-2 bg-ink/5 rounded-xl px-3 py-2">
              <code className="text-[10px] text-ink/60 flex-1 truncate font-mono">{webhookUrl}</code>
              <button
                onClick={copyWebhook}
                className="text-xs text-ink/40 hover:text-ink transition-colors flex-shrink-0"
              >
                {copied ? '✓' : 'Copy'}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-ink/30">Webhook URL이 설정되지 않았습니다 (config.webhook_url)</p>
        )}

        {/* External link */}
        <a
          href={data.platform === 'n8n' ? 'https://n8n.io' : 'https://make.com'}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 text-xs text-ink/40 hover:text-ink transition-colors"
        >
          <ExternalLink size={11} />
          {data.platform === 'n8n' ? 'n8n.io' : 'Make.com'}에서 열기
        </a>
      </motion.div>
    </motion.div>
  );
}

export function AutomationCard({ data }: { data: Automation }) {
  const [isActive, setIsActive] = useState(data.is_active);
  const [isToggling, setIsToggling] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsToggling(true);
    try {
      await toggleAutomation(data.id, !isActive);
      setIsActive(!isActive);
    } catch {
      alert('Failed to toggle');
    }
    setIsToggling(false);
  };

  return (
    <>
      <div
        onClick={() => setShowDrawer(true)}
        className={cn(
          'bg-white border rounded-2xl p-5 shadow-sm transition-all duration-300 relative overflow-hidden group cursor-pointer hover:shadow-md',
          isActive ? 'border-ink/20 shadow-md' : 'border-line opacity-80 filter grayscale-[0.5]'
        )}
      >
        <div className="flex justify-between items-start mb-4">
          <span className={cn('text-xs uppercase font-bold px-2 py-1 rounded', data.platform === 'n8n' ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700')}>
            {data.platform}
          </span>
          <button
            onClick={handleToggle}
            disabled={isToggling}
            className={cn('w-10 h-6 rounded-full p-1 transition-colors flex items-center shadow-inner', isActive ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start')}
          >
            <motion.div layout className="w-4 h-4 rounded-full bg-white shadow-sm" />
          </button>
        </div>

        <h3 className="font-serif font-bold text-lg leading-tight mb-1">{data.name}</h3>
        <p className="text-xs text-ink/60 mb-4 line-clamp-2 min-h-[2.5em]">{data.description || 'No description provided'}</p>

        <div className="grid grid-cols-2 gap-2 text-xs border-t border-line/50 pt-3">
          <div className="flex items-center gap-1.5 text-ink/70">
            <Clock size={12} />
            <span>{data.last_run_at ? timeAgoShort(data.last_run_at) : 'Never'}</span>
          </div>
          <div className="flex items-center gap-1.5 justify-end">
            <span className={cn('font-medium', data.success_rate >= 95 ? 'text-green-600' : 'text-yellow-600')}>{data.success_rate}%</span>
            <span className="text-ink/40">Success</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showDrawer && (
          <AutomationDrawer data={{ ...data, is_active: isActive }} onClose={() => setShowDrawer(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
