'use client';

import { useState, useEffect, useCallback } from 'react';
import { SectionTitle } from '@/components/section-title';
import { BookOpen, Lightbulb, BarChart2, Search, ChevronRight, X, Star, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Types ---
type Skill = {
  id: string;
  title: string;
  slug: string;
  category: string;
  tags: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  related_service: string | null;
  view_count: number;
  content_md?: string;
};

type Tip = {
  id: string;
  title: string;
  body: string;
  service: string | null;
  tip_type: 'prompt' | 'workflow' | 'cost' | 'security';
  is_featured: boolean;
};

type Report = {
  id: string;
  report_type: 'weekly' | 'monthly';
  period_start: string;
  period_end: string;
  generated_at: string;
};

// --- Constants ---
const DIFFICULTY_CONFIG = {
  beginner: { label: 'Beginner', color: 'bg-green-100 text-green-700' },
  intermediate: { label: 'Intermediate', color: 'bg-amber-100 text-amber-700' },
  advanced: { label: 'Advanced', color: 'bg-red-100 text-red-600' },
};

const TIP_TYPE_CONFIG = {
  prompt: { label: 'Prompt', color: 'bg-purple-100 text-purple-700', icon: '✍️' },
  workflow: { label: 'Workflow', color: 'bg-blue-100 text-blue-700', icon: '⚙️' },
  cost: { label: 'Cost', color: 'bg-green-100 text-green-700', icon: '💰' },
  security: { label: 'Security', color: 'bg-red-100 text-red-600', icon: '🔒' },
};

// --- Simple Markdown renderer (no external deps) ---
function SimpleMarkdown({ content }: { content: string }) {
  const html = content
    .replace(/^### (.+)$/gm, '<h3 class="font-serif text-base font-bold mt-4 mb-2 text-ink">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="font-serif text-lg font-bold mt-5 mb-2 text-ink">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="font-serif text-xl font-bold mt-2 mb-3 text-ink">$1</h1>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`([^`\n]+)`/g, '<code class="bg-ink/10 px-1 rounded text-sm font-mono">$1</code>')
    .replace(/```[\w]*\n([\s\S]*?)```/gm, '<pre class="bg-ink/5 rounded-xl p-4 overflow-x-auto text-xs font-mono my-3"><code>$1</code></pre>')
    .replace(/^\| (.+) \|$/gm, '<tr><td class="border border-line px-3 py-1 text-sm">$1</td></tr>')
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-sm text-ink/80">$1</li>')
    .replace(/\n\n/g, '</p><p class="text-sm text-ink/70 my-2">')
    .replace(/^(?!<[hplu]|<pre|<tr)(.+)$/gm, '<p class="text-sm text-ink/70 my-1">$1</p>');
  return <div dangerouslySetInnerHTML={{ __html: html }} className="prose-sm" />;
}

// ========================
// SKILLS TAB
// ========================
function SkillsTab() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set('q', search);
    if (selectedDifficulty) params.set('difficulty', selectedDifficulty);
    try {
      const res = await fetch(`/api/skills?${params}`);
      const json = await res.json();
      setSkills(json.data ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, [search, selectedDifficulty]);

  useEffect(() => {
    const t = setTimeout(fetchSkills, 300);
    return () => clearTimeout(t);
  }, [fetchSkills]);

  const openSkill = async (slug: string) => {
    setLoadingDetail(true);
    const res = await fetch(`/api/skills/${slug}`);
    const json = await res.json();
    setSelectedSkill(json);
    setLoadingDetail(false);
  };

  return (
    <div className="space-y-6">
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/30" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search skills..."
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-ink/10"
          />
        </div>
        <div className="flex gap-2">
          {(['', 'beginner', 'intermediate', 'advanced'] as const).map(d => (
            <button
              key={d}
              onClick={() => setSelectedDifficulty(d)}
              className={cn(
                'px-3 py-2 text-xs font-medium rounded-lg transition-all',
                selectedDifficulty === d ? 'bg-ink text-white' : 'bg-ink/5 text-ink/60 hover:bg-ink/10'
              )}
            >
              {d || 'All'}
            </button>
          ))}
        </div>
      </div>

      {/* Skills grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="paper-card p-5 animate-pulse space-y-3">
              <div className="h-4 bg-ink/10 rounded w-3/4" />
              <div className="h-3 bg-ink/5 rounded w-1/2" />
              <div className="flex gap-2">
                <div className="h-5 bg-ink/5 rounded w-16" />
                <div className="h-5 bg-ink/5 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : skills.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-line rounded-2xl">
          <BookOpen size={40} className="text-ink/20 mx-auto mb-3" />
          <p className="text-sm text-ink/50">No skills found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {skills.map(skill => (
            <button
              key={skill.id}
              onClick={() => openSkill(skill.slug)}
              className="paper-card p-5 text-left hover:shadow-md transition-all group space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-sm text-ink group-hover:text-ink leading-snug">{skill.title}</h3>
                <ChevronRight size={14} className="text-ink/20 group-hover:text-ink/60 transition-colors flex-shrink-0 mt-0.5" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {skill.difficulty && (
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', DIFFICULTY_CONFIG[skill.difficulty].color)}>
                    {DIFFICULTY_CONFIG[skill.difficulty].label}
                  </span>
                )}
                <span className="text-xs text-ink/40 bg-ink/5 px-2 py-0.5 rounded-full">{skill.category}</span>
                {skill.related_service && (
                  <span className="text-xs text-ink/40 bg-ink/5 px-2 py-0.5 rounded-full capitalize">{skill.related_service}</span>
                )}
              </div>
              {skill.tags.length > 0 && (
                <div className="flex gap-1 flex-wrap">
                  {skill.tags.slice(0, 3).map(tag => (
                    <span key={tag} className="text-[10px] text-ink/30 bg-ink/5 px-1.5 py-0.5 rounded font-mono">{tag}</span>
                  ))}
                </div>
              )}
              <div className="text-[10px] text-ink/30 flex items-center gap-1">
                <ExternalLink size={8} /> {skill.view_count} views
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Skill detail modal */}
      {(selectedSkill || loadingDetail) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedSkill(null)}>
          <div className="bg-paper rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-paper border-b border-line p-5 flex items-center justify-between">
              <div>
                {selectedSkill && <h2 className="font-serif text-lg font-bold">{selectedSkill.title}</h2>}
                {selectedSkill?.difficulty && (
                  <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', DIFFICULTY_CONFIG[selectedSkill.difficulty].color)}>
                    {DIFFICULTY_CONFIG[selectedSkill.difficulty].label}
                  </span>
                )}
              </div>
              <button onClick={() => setSelectedSkill(null)} className="p-2 rounded-xl hover:bg-ink/5 text-ink/40">
                <X size={18} />
              </button>
            </div>
            <div className="p-6">
              {loadingDetail ? (
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-ink/10 rounded w-full" />
                  <div className="h-4 bg-ink/10 rounded w-3/4" />
                  <div className="h-20 bg-ink/5 rounded" />
                </div>
              ) : selectedSkill?.content_md ? (
                <SimpleMarkdown content={selectedSkill.content_md} />
              ) : (
                <p className="text-sm text-ink/50">No content available.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ========================
// TIPS TAB
// ========================
function TipsTab() {
  const [tips, setTips] = useState<Tip[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('');

  useEffect(() => {
    const fetchTips = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedType) params.set('type', selectedType);
      try {
        const res = await fetch(`/api/tips?${params}`);
        const json = await res.json();
        setTips(json.data ?? []);
      } catch { /* ignore */ }
      setLoading(false);
    };
    fetchTips();
  }, [selectedType]);

  const featured = tips.filter(t => t.is_featured);
  const rest = tips.filter(t => !t.is_featured);

  return (
    <div className="space-y-6">
      {/* Type filters */}
      <div className="flex gap-2 flex-wrap">
        {(['', 'prompt', 'workflow', 'cost', 'security'] as const).map(type => (
          <button
            key={type}
            onClick={() => setSelectedType(type)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded-lg transition-all',
              selectedType === type ? 'bg-ink text-white' : 'bg-ink/5 text-ink/60 hover:bg-ink/10'
            )}
          >
            {type ? `${TIP_TYPE_CONFIG[type].icon} ${TIP_TYPE_CONFIG[type].label}` : 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="paper-card p-5 animate-pulse space-y-2">
              <div className="h-4 bg-ink/10 rounded w-2/3" />
              <div className="h-3 bg-ink/5 rounded w-full" />
              <div className="h-3 bg-ink/5 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {featured.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Star size={10} className="text-amber-400 fill-amber-400" /> Featured Tips
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featured.map(tip => (
                  <div key={tip.id} className="paper-card p-5 border-l-4 border-amber-400 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm text-ink">{tip.title}</h4>
                      {tip.tip_type && (
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0', TIP_TYPE_CONFIG[tip.tip_type].color)}>
                          {TIP_TYPE_CONFIG[tip.tip_type].icon} {TIP_TYPE_CONFIG[tip.tip_type].label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-ink/60">{tip.body}</p>
                    {tip.service && (
                      <span className="text-xs text-ink/30 capitalize">{tip.service}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {rest.length > 0 && (
            <div>
              {featured.length > 0 && (
                <h3 className="text-xs font-semibold text-ink/40 uppercase tracking-wider mb-3">More Tips</h3>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rest.map(tip => (
                  <div key={tip.id} className="paper-card p-5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm text-ink">{tip.title}</h4>
                      {tip.tip_type && (
                        <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0', TIP_TYPE_CONFIG[tip.tip_type].color)}>
                          {TIP_TYPE_CONFIG[tip.tip_type].label}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-ink/60">{tip.body}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {tips.length === 0 && (
            <div className="text-center py-16 border border-dashed border-line rounded-2xl">
              <Lightbulb size={40} className="text-ink/20 mx-auto mb-3" />
              <p className="text-sm text-ink/50">No tips found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ========================
// REPORTS TAB
// ========================
function ReportsTab() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState<'weekly' | 'monthly'>('weekly');
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/reports');
      const json = await res.json();
      setReports(json.data ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchReports(); }, [fetchReports]);

  const generate = async () => {
    setGenerating(true);
    try {
      await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: reportType, period_start: periodStart }),
      });
      await fetchReports();
    } catch { /* ignore */ }
    setGenerating(false);
  };

  return (
    <div className="space-y-6">
      {/* Generate report form */}
      <div className="paper-card p-5 space-y-4">
        <h3 className="font-semibold text-sm text-ink">Generate Report</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex gap-2">
            {(['weekly', 'monthly'] as const).map(t => (
              <button
                key={t}
                onClick={() => setReportType(t)}
                className={cn(
                  'px-4 py-2 text-xs font-medium rounded-lg capitalize transition-all',
                  reportType === t ? 'bg-ink text-white' : 'bg-ink/5 text-ink/60 hover:bg-ink/10'
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <input
            type="date"
            value={periodStart}
            onChange={e => setPeriodStart(e.target.value)}
            className="px-3 py-2 text-sm rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-ink/10"
          />
          <button
            onClick={generate}
            disabled={generating}
            className="px-4 py-2 text-xs font-medium rounded-lg bg-ink text-white hover:bg-ink/90 disabled:opacity-50 transition-all"
          >
            {generating ? 'Generating...' : 'Generate'}
          </button>
        </div>
        <p className="text-xs text-ink/40">Generates a {reportType} report starting from the selected date using your AI usage and automation data.</p>
      </div>

      {/* Reports list */}
      <div>
        <h3 className="font-serif text-lg font-bold mb-4">Past Reports</h3>
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="paper-card p-4 animate-pulse flex items-center gap-3">
                <div className="w-10 h-10 bg-ink/10 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-ink/10 rounded w-32" />
                  <div className="h-2 bg-ink/5 rounded w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : reports.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-line rounded-2xl">
            <BarChart2 size={40} className="text-ink/20 mx-auto mb-3" />
            <p className="text-sm text-ink/50">No reports generated yet</p>
            <p className="text-xs text-ink/30 mt-1">Generate your first report above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map(r => (
              <div key={r.id} className="paper-card p-4 flex items-center gap-3">
                <div className={cn(
                  'w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white',
                  r.report_type === 'weekly' ? 'bg-blue-500' : 'bg-purple-500'
                )}>
                  {r.report_type === 'weekly' ? 'W' : 'M'}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm text-ink capitalize">{r.report_type} Report</div>
                  <div className="text-xs text-ink/40">
                    {r.period_start} → {r.period_end}
                  </div>
                </div>
                <div className="text-xs text-ink/30">
                  {new Date(r.generated_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ========================
// MAIN PAGE
// ========================
const TABS = [
  { id: 'skills', label: 'Skills', icon: BookOpen },
  { id: 'tips', label: 'Tips', icon: Lightbulb },
  { id: 'reports', label: 'Reports', icon: BarChart2 },
] as const;

type TabId = typeof TABS[number]['id'];

export default function SkillsPage() {
  const [activeTab, setActiveTab] = useState<TabId>('skills');

  return (
    <div className="space-y-6">
      <SectionTitle title="Skills & Tips" subtitle="Learn AI best practices, explore tips, and generate usage reports" />

      {/* Tab bar */}
      <div className="flex gap-1 bg-ink/5 rounded-xl p-1 w-fit">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
              activeTab === id ? 'bg-white shadow-sm text-ink' : 'text-ink/50 hover:text-ink/70'
            )}
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'skills' && <SkillsTab />}
      {activeTab === 'tips' && <TipsTab />}
      {activeTab === 'reports' && <ReportsTab />}
    </div>
  );
}
