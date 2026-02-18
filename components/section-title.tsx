import { PencilLine } from 'lucide-react';

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="space-y-2">
      <div className="flex items-center gap-2 text-ink/80">
        <PencilLine size={16} />
        <span className="text-xs uppercase tracking-[0.2em]">Notebook</span>
      </div>
      <h1 className="font-serif text-3xl leading-tight">{title}</h1>
      {subtitle ? <p className="max-w-xl text-sm text-ink/75">{subtitle}</p> : null}
    </header>
  );
}
