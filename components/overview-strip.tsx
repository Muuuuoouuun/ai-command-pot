import Link from 'next/link';

type Item = { label: string; value: string | number; href?: string; hint?: string };

export function OverviewStrip({ title, items }: { title: string; items: Item[] }) {
  return (
    <section className="space-y-2">
      <h2 className="font-serif text-xl">{title}</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((item) => {
          const body = (
            <div className="paper-card h-full p-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-ink/60">{item.label}</p>
              <p className="mt-1 font-serif text-xl">{item.value}</p>
              {item.hint ? <p className="mt-1 text-xs text-ink/65">{item.hint}</p> : null}
            </div>
          );

          return item.href ? <Link key={item.label} href={item.href}>{body}</Link> : <div key={item.label}>{body}</div>;
        })}
      </div>
    </section>
  );
}
