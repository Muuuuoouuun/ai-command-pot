'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionTitle } from '@/components/section-title';
import {
  Plus, Download, Trash2, ToggleLeft, ToggleRight,
  AlertTriangle, Copy, Check, ExternalLink, ChevronDown, ChevronUp,
  Plug, FileCode2, Globe, Wifi, WifiOff, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Types ─────────────────────────────────────────────────────────────────────

type Transport = 'stdio' | 'http' | 'sse';
type ServerType =
  | 'notion' | 'figma' | 'github' | 'slack' | 'linear' | 'jira'
  | 'google-drive' | 'custom-stdio' | 'custom-http' | 'custom-sse';

type MCPServer = {
  id: string;
  name: string;
  description: string | null;
  server_type: ServerType;
  transport: Transport;
  command: string | null;
  args: string[];
  working_dir: string | null;
  endpoint_url: string | null;
  env_var_names: string[];
  vault_key_ids: string[];
  capabilities: string[];
  config: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
};

type NewServer = {
  name: string;
  description: string;
  server_type: ServerType;
  transport: Transport;
  command: string;
  args: string;           // raw comma-separated string → split on save
  endpoint_url: string;
  env_var_names: string;  // raw newline-separated string
  capabilities: string[];
};

// ── Server templates ──────────────────────────────────────────────────────────

type Template = {
  type: ServerType;
  label: string;
  description: string;
  transport: Transport;
  command?: string;
  args?: string;
  endpoint_url?: string;
  env_var_names?: string;
  capabilities: string[];
  docsUrl: string;
  icon: string;
};

const TEMPLATES: Template[] = [
  {
    type: 'notion',
    label: 'Notion',
    description: 'Read/write Notion pages, databases, and blocks via MCP.',
    transport: 'stdio',
    command: 'npx',
    args: '-y,@notionhq/notion-mcp-server',
    env_var_names: 'OPENAI_API_KEY\nNOTION_API_KEY',
    capabilities: ['tools', 'resources'],
    docsUrl: 'https://github.com/makenotion/notion-mcp-server',
    icon: '📄',
  },
  {
    type: 'figma',
    label: 'Figma',
    description: 'Inspect Figma designs, export components, and read styles.',
    transport: 'http',
    endpoint_url: 'https://figma.com/api/mcp',
    env_var_names: 'FIGMA_ACCESS_TOKEN',
    capabilities: ['tools', 'resources'],
    docsUrl: 'https://www.figma.com/developers/mcp',
    icon: '🎨',
  },
  {
    type: 'github',
    label: 'GitHub',
    description: 'Search repos, read files, manage issues and PRs.',
    transport: 'stdio',
    command: 'npx',
    args: '-y,@modelcontextprotocol/server-github',
    env_var_names: 'GITHUB_PERSONAL_ACCESS_TOKEN',
    capabilities: ['tools'],
    docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/github',
    icon: '🐙',
  },
  {
    type: 'slack',
    label: 'Slack',
    description: 'Read channels, send messages, and search workspace history.',
    transport: 'stdio',
    command: 'npx',
    args: '-y,@modelcontextprotocol/server-slack',
    env_var_names: 'SLACK_BOT_TOKEN\nSLACK_TEAM_ID',
    capabilities: ['tools'],
    docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/slack',
    icon: '💬',
  },
  {
    type: 'linear',
    label: 'Linear',
    description: 'Query and update Linear issues, projects, and cycles.',
    transport: 'stdio',
    command: 'npx',
    args: '-y,@modelcontextprotocol/server-linear',
    env_var_names: 'LINEAR_API_KEY',
    capabilities: ['tools'],
    docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/linear',
    icon: '📐',
  },
  {
    type: 'jira',
    label: 'Jira',
    description: 'Search and manage Jira issues and sprints.',
    transport: 'http',
    endpoint_url: '',
    env_var_names: 'JIRA_URL\nJIRA_API_TOKEN\nJIRA_EMAIL',
    capabilities: ['tools'],
    docsUrl: 'https://github.com/sooperset/mcp-atlassian',
    icon: '🎯',
  },
  {
    type: 'google-drive',
    label: 'Google Drive',
    description: 'Read and search Google Drive files and documents.',
    transport: 'stdio',
    command: 'npx',
    args: '-y,@modelcontextprotocol/server-gdrive',
    env_var_names: 'GDRIVE_CLIENT_ID\nGDRIVE_CLIENT_SECRET\nGDRIVE_REFRESH_TOKEN',
    capabilities: ['tools', 'resources'],
    docsUrl: 'https://github.com/modelcontextprotocol/servers/tree/main/src/gdrive',
    icon: '🗂️',
  },
  {
    type: 'custom-stdio',
    label: 'Custom stdio Server',
    description: 'Any local process implementing the MCP stdio transport.',
    transport: 'stdio',
    command: '',
    args: '',
    env_var_names: '',
    capabilities: [],
    docsUrl: 'https://modelcontextprotocol.io/docs/concepts/transports',
    icon: '⚙️',
  },
  {
    type: 'custom-http',
    label: 'Custom HTTP Server',
    description: 'An HTTP endpoint that implements the MCP JSON-RPC protocol.',
    transport: 'http',
    endpoint_url: '',
    env_var_names: '',
    capabilities: [],
    docsUrl: 'https://modelcontextprotocol.io/docs/concepts/transports',
    icon: '🌐',
  },
  {
    type: 'custom-sse',
    label: 'Custom SSE Server',
    description: 'A server-sent events endpoint for streaming MCP responses.',
    transport: 'sse',
    endpoint_url: '',
    env_var_names: '',
    capabilities: [],
    docsUrl: 'https://modelcontextprotocol.io/docs/concepts/transports',
    icon: '📡',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

const CAPABILITY_COLORS: Record<string, string> = {
  tools: 'bg-blue-100 text-blue-700',
  resources: 'bg-green-100 text-green-700',
  prompts: 'bg-purple-100 text-purple-700',
};

function transportIcon(t: Transport) {
  if (t === 'stdio') return <FileCode2 size={12} className="text-ink/40" />;
  if (t === 'sse') return <Globe size={12} className="text-ink/40" />;
  return <Plug size={12} className="text-ink/40" />;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button onClick={copy} className="p-1 rounded hover:bg-ink/10 text-ink/40 transition-colors">
      {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
    </button>
  );
}

// ── Add-server modal ──────────────────────────────────────────────────────────

function AddServerModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (data: Partial<NewServer> & { server_type: ServerType; transport: Transport }) => Promise<void>;
}) {
  const [step, setStep] = useState<'pick' | 'form'>('pick');
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [form, setForm] = useState<NewServer>({
    name: '',
    description: '',
    server_type: 'custom-stdio',
    transport: 'stdio',
    command: '',
    args: '',
    endpoint_url: '',
    env_var_names: '',
    capabilities: [],
  });

  const pickTemplate = (t: Template) => {
    setSelectedTemplate(t);
    setForm({
      name: t.label,
      description: t.description,
      server_type: t.type,
      transport: t.transport,
      command: t.command ?? '',
      args: t.args ?? '',
      endpoint_url: t.endpoint_url ?? '',
      env_var_names: t.env_var_names ?? '',
      capabilities: t.capabilities,
    });
    setStep('form');
  };

  const submit = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      await onSave({
        ...form,
        args: form.args,          // keep as string, API route will handle split
        env_var_names: form.env_var_names,
      });
      onClose();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-paper rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-paper border-b border-line px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="font-serif font-bold text-lg text-ink">
              {step === 'pick' ? 'Choose MCP Server Type' : `Configure ${selectedTemplate?.label ?? 'Server'}`}
            </h2>
            {step === 'form' && (
              <button onClick={() => setStep('pick')} className="text-xs text-ink/40 hover:text-ink mt-0.5">
                ← Back to templates
              </button>
            )}
          </div>
          <button onClick={onClose} className="text-ink/30 hover:text-ink text-xl leading-none">×</button>
        </div>

        {/* Step 1: pick template */}
        {step === 'pick' && (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TEMPLATES.map(t => (
              <button
                key={t.type}
                onClick={() => pickTemplate(t)}
                className="paper-card p-4 text-left hover:shadow-md transition-all group space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xl">{t.icon}</span>
                  <div>
                    <div className="font-semibold text-sm text-ink group-hover:text-ink">{t.label}</div>
                    <div className="flex items-center gap-1 text-[10px] text-ink/40 mt-0.5">
                      {transportIcon(t.transport)}
                      <span>{t.transport}</span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-ink/50 leading-snug">{t.description}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: configure */}
        {step === 'form' && (
          <div className="p-6 space-y-4">
            {saveError && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                <AlertTriangle size={14} /> {saveError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-1.5 block">Name *</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-ink/10"
                  placeholder="My Notion Workspace"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-1.5 block">Description</label>
                <input
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-ink/10"
                  placeholder="Optional description"
                />
              </div>
            </div>

            {/* stdio fields */}
            {form.transport === 'stdio' && (
              <>
                <div>
                  <label className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-1.5 block">Command *</label>
                  <input
                    value={form.command}
                    onChange={e => setForm(f => ({ ...f, command: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-ink/10 font-mono"
                    placeholder="npx"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-1.5 block">
                    Arguments <span className="font-normal normal-case text-ink/30">(comma-separated)</span>
                  </label>
                  <input
                    value={form.args}
                    onChange={e => setForm(f => ({ ...f, args: e.target.value }))}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-ink/10 font-mono"
                    placeholder="-y,@notionhq/notion-mcp-server"
                  />
                </div>
              </>
            )}

            {/* http/sse fields */}
            {(form.transport === 'http' || form.transport === 'sse') && (
              <div>
                <label className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-1.5 block">
                  Endpoint URL *
                </label>
                <input
                  value={form.endpoint_url}
                  onChange={e => setForm(f => ({ ...f, endpoint_url: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-ink/10 font-mono"
                  placeholder="https://your-mcp-server.example.com/mcp"
                />
              </div>
            )}

            {/* Env var names */}
            <div>
              <label className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-1.5 block">
                Required Env Vars <span className="font-normal normal-case text-ink/30">(one per line)</span>
              </label>
              <textarea
                value={form.env_var_names}
                onChange={e => setForm(f => ({ ...f, env_var_names: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-ink/10 font-mono resize-none"
                placeholder={'NOTION_API_KEY\nOPENAI_API_KEY'}
              />
              <p className="text-xs text-ink/30 mt-1">
                Store actual values in API Vault — enter only the variable names here.
              </p>
            </div>

            {/* Capabilities */}
            <div>
              <label className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-1.5 block">Capabilities</label>
              <div className="flex gap-2">
                {(['tools', 'resources', 'prompts'] as const).map(cap => (
                  <button
                    key={cap}
                    type="button"
                    onClick={() => setForm(f => ({
                      ...f,
                      capabilities: f.capabilities.includes(cap)
                        ? f.capabilities.filter(c => c !== cap)
                        : [...f.capabilities, cap],
                    }))}
                    className={cn(
                      'px-3 py-1 text-xs font-medium rounded-lg transition-all',
                      form.capabilities.includes(cap)
                        ? CAPABILITY_COLORS[cap]
                        : 'bg-ink/5 text-ink/40 hover:bg-ink/10'
                    )}
                  >
                    {cap}
                  </button>
                ))}
              </div>
            </div>

            {/* Docs link */}
            {selectedTemplate?.docsUrl && (
              <a
                href={selectedTemplate.docsUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-xs text-ink/40 hover:text-ink transition-colors"
              >
                <ExternalLink size={11} /> Setup documentation
              </a>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm rounded-xl border border-line text-ink/60 hover:bg-ink/5"
              >
                Cancel
              </button>
              <button
                onClick={submit}
                disabled={saving || !form.name.trim()}
                className="px-4 py-2 text-sm rounded-xl bg-ink text-white hover:bg-ink/90 disabled:opacity-50"
              >
                {saving ? 'Saving…' : 'Add Server'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Server card ───────────────────────────────────────────────────────────────

type TestResult = { ok: boolean; message: string; tools?: string[]; transport?: string };

function ServerCard({
  server,
  onToggle,
  onDelete,
}: {
  server: MCPServer;
  onToggle: (id: string, active: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const template = TEMPLATES.find(t => t.type === server.server_type);

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(`/api/mcp/${server.id}/test`, { method: 'POST' });
      const json: TestResult = await res.json();
      setTestResult(json);
    } catch {
      setTestResult({ ok: false, message: '요청 실패' });
    } finally {
      setTesting(false);
    }
  };

  const configSnippet = server.transport === 'stdio'
    ? JSON.stringify({
        command: server.command,
        args: server.args,
        ...(server.env_var_names.length > 0
          ? { env: Object.fromEntries(server.env_var_names.map(v => [v, `\${${v}}`])) }
          : {}),
      }, null, 2)
    : JSON.stringify({ url: server.endpoint_url, transport: server.transport }, null, 2);

  return (
    <div className={cn(
      'paper-card transition-all',
      !server.is_active && 'opacity-60'
    )}>
      <div className="p-4 flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">{template?.icon ?? '🔌'}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm text-ink">{server.name}</span>
            <div className="flex items-center gap-1 text-[10px] text-ink/40 bg-ink/5 px-1.5 py-0.5 rounded font-mono">
              {transportIcon(server.transport)}
              <span>{server.transport}</span>
            </div>
            {server.capabilities.map(cap => (
              <span key={cap} className={cn('text-[10px] px-1.5 py-0.5 rounded font-medium', CAPABILITY_COLORS[cap] ?? 'bg-ink/5 text-ink/40')}>
                {cap}
              </span>
            ))}
          </div>
          {server.description && (
            <p className="text-xs text-ink/40 mt-0.5 truncate">{server.description}</p>
          )}
          {server.env_var_names.length > 0 && (
            <div className="flex gap-1 mt-1 flex-wrap">
              {server.env_var_names.map(v => (
                <code key={v} className="text-[9px] bg-amber-50 text-amber-700 px-1 rounded">{v}</code>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={testConnection}
            disabled={testing}
            className="p-1.5 rounded-lg text-ink/30 hover:text-blue-500 hover:bg-blue-50 disabled:opacity-40"
            title="연결 테스트"
          >
            {testing
              ? <Loader2 size={14} className="animate-spin" />
              : testResult
                ? testResult.ok
                  ? <Wifi size={14} className="text-green-500" />
                  : <WifiOff size={14} className="text-red-400" />
                : <Wifi size={14} />}
          </button>
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1.5 rounded-lg text-ink/30 hover:text-ink hover:bg-ink/5"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={() => onToggle(server.id, !server.is_active)}
            className="p-1.5 rounded-lg text-ink/30 hover:text-ink hover:bg-ink/5"
            title={server.is_active ? 'Disable' : 'Enable'}
          >
            {server.is_active
              ? <ToggleRight size={18} className="text-green-500" />
              : <ToggleLeft size={18} />}
          </button>
          <button
            onClick={() => onDelete(server.id)}
            className="p-1.5 rounded-lg text-ink/30 hover:text-red-500 hover:bg-red-50"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Test result banner */}
      {testResult && (
        <div className={cn(
          'mx-4 mb-0 mt-0 px-3 py-2 rounded-xl text-xs flex items-start gap-2',
          testResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
        )}>
          {testResult.ok
            ? <Wifi size={12} className="flex-shrink-0 mt-0.5" />
            : <WifiOff size={12} className="flex-shrink-0 mt-0.5" />}
          <div>
            <span>{testResult.message}</span>
            {testResult.ok && testResult.tools && testResult.tools.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {testResult.tools.map(t => (
                  <code key={t} className="bg-green-100 text-green-800 px-1 rounded text-[10px]">{t}</code>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expanded: config snippet + env checklist */}
      {expanded && (
        <div className="border-t border-line px-4 pb-4 pt-3 space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-ink/40 uppercase tracking-wider">Config Snippet</span>
              <CopyButton text={configSnippet} />
            </div>
            <pre className="text-[11px] bg-ink/5 rounded-xl p-3 overflow-x-auto text-ink/70 font-mono leading-relaxed">
              {configSnippet}
            </pre>
          </div>

          {server.env_var_names.length > 0 && (
            <div>
              <span className="text-xs font-semibold text-ink/40 uppercase tracking-wider block mb-1.5">
                Required Environment Variables
              </span>
              <div className="space-y-1">
                {server.env_var_names.map(v => (
                  <div key={v} className="flex items-center gap-2 text-xs">
                    <code className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded font-mono">{v}</code>
                    <span className="text-ink/30">→ store value in API Vault</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {template?.docsUrl && (
            <a
              href={template.docsUrl}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 text-xs text-ink/40 hover:text-ink"
            >
              <ExternalLink size={11} /> Documentation
            </a>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MCPPage() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [exporting, setExporting] = useState(false);

  const fetchServers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/mcp');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setServers(json.data ?? []);
    } catch {
      setError('MCP 서버 목록을 불러오지 못했습니다.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchServers(); }, [fetchServers]);

  const addServer = async (data: Partial<NewServer> & { server_type: ServerType; transport: Transport }) => {
    const payload = {
      ...data,
      args: typeof data.args === 'string'
        ? data.args.split(',').map(s => s.trim()).filter(Boolean)
        : data.args ?? [],
      env_var_names: typeof data.env_var_names === 'string'
        ? data.env_var_names.split('\n').map(s => s.trim()).filter(Boolean)
        : data.env_var_names ?? [],
    };

    const res = await fetch('/api/mcp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const json = await res.json();
      throw new Error(json.error ?? `HTTP ${res.status}`);
    }
    await fetchServers();
  };

  const toggleServer = async (id: string, active: boolean) => {
    setServers(prev => prev.map(s => s.id === id ? { ...s, is_active: active } : s));
    await fetch(`/api/mcp/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: active }),
    });
  };

  const deleteServer = async (id: string) => {
    if (!confirm('이 MCP 서버 설정을 삭제하시겠습니까?')) return;
    setServers(prev => prev.filter(s => s.id !== id));
    await fetch(`/api/mcp/${id}`, { method: 'DELETE' });
  };

  const exportConfig = async (format: 'claude' | 'env') => {
    setExporting(true);
    try {
      const res = await fetch(`/api/mcp/export?format=${format}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'env' ? '.env.mcp' : 'claude_desktop_config.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch { /* ignore */ }
    setExporting(false);
  };

  const activeCount = servers.filter(s => s.is_active).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <SectionTitle
          title="MCP Servers"
          subtitle="Model Context Protocol 서버를 등록하고 Claude에 연결하세요"
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative group">
            <button
              disabled={exporting || servers.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-line bg-paper text-ink/60 hover:bg-ink/5 disabled:opacity-40 transition-all"
            >
              <Download size={13} /> Export
            </button>
            {/* Dropdown on hover */}
            <div className="absolute right-0 top-full mt-1 w-52 bg-paper border border-line rounded-xl shadow-lg py-1 hidden group-hover:block z-20">
              <button
                onClick={() => exportConfig('claude')}
                disabled={exporting}
                className="w-full text-left px-3 py-2 text-xs text-ink hover:bg-ink/5"
              >
                claude_desktop_config.json
              </button>
              <button
                onClick={() => exportConfig('env')}
                disabled={exporting}
                className="w-full text-left px-3 py-2 text-xs text-ink hover:bg-ink/5"
              >
                .env.mcp (env var names)
              </button>
            </div>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-ink text-white hover:bg-ink/90 transition-all"
          >
            <Plus size={13} /> Add Server
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
          <AlertTriangle size={16} className="flex-shrink-0" />
          {error}
          <button onClick={fetchServers} className="ml-auto underline text-xs">재시도</button>
        </div>
      )}

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Servers', value: servers.length },
          { label: 'Active', value: activeCount },
          { label: 'Inactive', value: servers.length - activeCount },
        ].map(({ label, value }) => (
          <div key={label} className="paper-card p-4">
            <div className="text-xs text-ink/40 mb-1">{label}</div>
            <div className="text-2xl font-bold font-mono text-ink">{loading ? '—' : value}</div>
          </div>
        ))}
      </div>

      {/* Server list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="paper-card p-4 animate-pulse flex items-center gap-3">
              <div className="w-8 h-8 bg-ink/10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-ink/10 rounded w-40" />
                <div className="h-2 bg-ink/5 rounded w-64" />
              </div>
            </div>
          ))}
        </div>
      ) : servers.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-line rounded-2xl space-y-4">
          <div className="text-4xl">🔌</div>
          <div>
            <h3 className="font-serif text-lg text-ink/60">MCP 서버가 없습니다</h3>
            <p className="text-sm text-ink/40 mt-1">Notion, Figma, GitHub 등의 서버를 추가해 Claude에 연결하세요.</p>
          </div>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm rounded-xl bg-ink text-white hover:bg-ink/90"
          >
            <Plus size={15} /> 첫 서버 추가
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {servers.map(s => (
            <ServerCard
              key={s.id}
              server={s}
              onToggle={toggleServer}
              onDelete={deleteServer}
            />
          ))}
        </div>
      )}

      {/* Usage guide */}
      <div className="paper-card p-5 space-y-4">
        <h3 className="font-semibold text-sm text-ink">Claude에 MCP 서버 연결하기</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 text-xs">
          {[
            {
              step: '1',
              title: 'API 자격증명 저장',
              desc: 'API Vault에 각 서버의 API 키를 암호화 저장합니다.',
              action: '/vault',
              actionLabel: 'API Vault →',
            },
            {
              step: '2',
              title: '서버 등록 및 설정',
              desc: '위에서 MCP 서버를 추가하고 필요한 env var 이름을 입력합니다.',
              action: null,
              actionLabel: null,
            },
            {
              step: '3',
              title: 'Claude Desktop 연결',
              desc: 'Export → claude_desktop_config.json 다운로드 후 ~/Library/Application Support/Claude/에 저장하면 Claude Desktop에서 즉시 사용 가능합니다.',
              action: null,
              actionLabel: null,
            },
            {
              step: '4',
              title: '인앱 에이전트 연결',
              desc: '에이전트 config에 mcp_server_ids 배열을 추가하면 HTTP/SSE 서버 도구가 Claude에 자동 주입됩니다. Wifi 버튼으로 연결을 먼저 테스트하세요.',
              action: '/agents-map',
              actionLabel: 'Agent Map →',
            },
          ].map(({ step, title, desc, action, actionLabel }) => (
            <div key={step} className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-ink text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {step}
              </div>
              <div>
                <div className="font-semibold text-ink mb-0.5">{title}</div>
                <p className="text-ink/50">{desc}</p>
                {action && (
                  <a href={action} className="text-ink/40 hover:text-ink underline mt-1 inline-block">
                    {actionLabel}
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-ink/5 rounded-xl p-3">
          <div className="text-xs font-semibold text-ink/50 uppercase tracking-wider mb-2">
            자체 MCP 서버 개발
          </div>
          <p className="text-xs text-ink/60 leading-relaxed">
            Custom HTTP/SSE 타입을 선택하면 직접 개발한 MCP 서버를 등록할 수 있습니다.
            MCP 프로토콜은 JSON-RPC 2.0 기반으로 <code className="bg-ink/10 px-1 rounded">tools</code>,{' '}
            <code className="bg-ink/10 px-1 rounded">resources</code>,{' '}
            <code className="bg-ink/10 px-1 rounded">prompts</code> 세 가지 기능을 노출할 수 있습니다.
          </p>
          <a
            href="https://modelcontextprotocol.io/quickstart/server"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-xs text-ink/40 hover:text-ink mt-2"
          >
            <ExternalLink size={10} /> MCP 서버 개발 가이드
          </a>
        </div>
      </div>

      {/* Add modal */}
      {showAdd && (
        <AddServerModal
          onClose={() => setShowAdd(false)}
          onSave={addServer}
        />
      )}
    </div>
  );
}
