import { type ReactNode } from 'react';

export function InsightValue({ children }: { children: ReactNode }) {
  return <span className="font-extrabold text-slate-950">{children}</span>;
}
