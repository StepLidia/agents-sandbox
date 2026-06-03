import { Sparkles } from 'lucide-react';

export function InsightsCard() {
  return (
    <section className="glass-panel flex h-full flex-col p-4">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-2xl bg-blue-500/10 text-blue-600">
          <Sparkles className="h-5 w-5" />
        </div>
        <h2 className="text-sm font-bold">Key Insights</h2>
      </div>
      <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-800">
        <li>You're building a solid financial foundation.</li>
        <li>Higher investment returns can add meaningful upside over 30 years.</li>
        <li>3rd pillar contributions can provide valuable tax benefits.</li>
      </ul>
    </section>
  );
}
