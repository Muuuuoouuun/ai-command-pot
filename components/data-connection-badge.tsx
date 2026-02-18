export function DataConnectionBadge({ connected, note }: { connected: boolean; note?: string }) {
  return (
    <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${connected ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-800'}`}>
      <span className={`h-2 w-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-amber-500'}`} />
      <span>{connected ? 'Data Connected' : 'Data Fallback Mode'}</span>
      {note ? <span className="text-[11px] opacity-80">· {note}</span> : null}
    </div>
  );
}
