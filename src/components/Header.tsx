import { useState } from 'react';
import { CircleHelp, Download } from 'lucide-react';
import { buttonClasses } from '../constants/buttonStyles';

export function Header({
  isExporting = false,
  onExportPdf,
  showActions = true,
  subtitle = 'State of your financial situation',
  title = 'Overview',
}: {
  isExporting?: boolean;
  onExportPdf?: () => void;
  showActions?: boolean;
  subtitle?: string;
  title?: string;
}) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-3xl font-semibold tracking-normal text-slate-950">{title}</h1>
        <p className="mt-1 max-w-xs wrap-break-word text-sm text-slate-700 md:max-w-full">{subtitle}</p>
      </div>
      {showActions && (
        <div className="flex items-center gap-2" data-pdf-exclude="true">
          <button className={buttonClasses()} disabled={isExporting} onClick={onExportPdf} type="button">
            <Download className="h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Export PDF'}
          </button>
          <div className="relative">
            <button
              className={buttonClasses({ size: 'icon' })}
              aria-controls="header-help-tooltip"
              aria-expanded={isHelpOpen}
              aria-label="Help"
              type="button"
              onClick={() => setIsHelpOpen((isOpen) => !isOpen)}
            >
              <CircleHelp className="h-5 w-5" />
            </button>
            {isHelpOpen && <HelpTooltip />}
          </div>
        </div>
      )}
    </header>
  );
}

function HelpTooltip() {
  return (
    <div
      id="header-help-tooltip"
      role="dialog"
      aria-label="Pension and investing information"
      className="absolute right-0 top-12 z-30 max-h-[min(70vh,720px)] w-[min(calc(100vw-2rem),34rem)] overflow-y-auto rounded-lg border border-slate-300/30 bg-white/95 p-5 text-sm leading-6 text-slate-700 shadow-xl shadow-slate-400/20 backdrop-blur-xl"
    >
      <section>
        <h2 className="text-base font-bold text-slate-950">AHV (1st Pillar)</h2>
        <h3 className="mt-3 font-bold text-slate-900">About the 1st Pillar (AHV)</h3>
        <p className="mt-2">
          The Swiss Old-Age and Survivors&apos; Insurance (AHV) is the foundation of the Swiss pension system. It is
          designed to cover basic living expenses in retirement. The pension amount depends on your contribution
          history, years of contributions, and average income.
        </p>
        <p className="mt-2">
          For individuals permanently leaving Switzerland, withdrawal options depend on nationality and destination
          country. Citizens of non-EU/EFTA countries are eligible under certain conditions to withdraw part of their pension assets when leaving
          Switzerland permanently.
        </p>
        <MoreInfo href="https://www.ahv-iv.ch" />
      </section>

      <section className="mt-5 border-t border-slate-200 pt-5">
        <h2 className="text-base font-bold text-slate-950">Pension Fund (2nd Pillar)</h2>
        <h3 className="mt-3 font-bold text-slate-900">About the 2nd Pillar (BVG / Pension Fund)</h3>
        <p className="mt-2">
          The 2nd pillar complements the AHV and aims to help maintain your standard of living after retirement.
          Contributions are made jointly by employees and employers and are accumulated in an individual pension account.
        </p>
        <p className="mt-2">
          Your current retirement savings balance can be found in your latest pension fund statement
          (Pensionskassenausweis). Benefits vary depending on salary, age, contribution rates, and pension fund
          regulations.
        </p>
        <MoreInfo href="https://www.bsv.admin.ch" />
      </section>

      <section className="mt-5 border-t border-slate-200 pt-5">
        <h2 className="text-base font-bold text-slate-950">3rd Pillar (Pillar 3a)</h2>
        <h3 className="mt-3 font-bold text-slate-900">About the 3rd Pillar (3a)</h3>
        <p className="mt-2">
          The 3rd pillar is a voluntary retirement savings scheme designed to supplement AHV and pension fund benefits.
          Contributions to Pillar 3a may provide tax advantages and can help close retirement income gaps.
        </p>
        <p className="mt-2">
          Savings can be held in cash accounts or invested through securities-based solutions, potentially increasing
          long-term growth opportunities.
        </p>
        <MoreInfo href="https://finpension.ch/en/3a" />
      </section>

      <section className="mt-5 border-t border-slate-200 pt-5">
        <h2 className="text-base font-bold text-slate-950">Long-Term Investing</h2>
        <h3 className="mt-3 font-bold text-slate-900">The Power of Long-Term Investing</h3>
        <p className="mt-2">
          Long-Term investing allows savings to benefit from compound growth, where returns generate additional returns
          over time. Even modest monthly contributions can grow significantly over several decades.
        </p>
        <p className="mt-2">
          Historically, diversified investments have generally outperformed cash savings over long investment horizons.
          However, investment values can fluctuate and future returns are not guaranteed.
        </p>
        <p className="mt-2">Starting early and investing consistently often has a greater impact than attempting to time the market.</p>
      </section>

      <section className="mt-5 border-t border-slate-200 pt-5">
        <h2 className="text-base font-bold text-slate-950">Disclaimer</h2>
        <h3 className="mt-3 font-bold text-slate-900">Important Notice</h3>
        <p className="mt-2">
          This calculator provides illustrative estimates based on the assumptions entered. Actual pension benefits,
          investment returns, tax treatment, and future financial outcomes may differ. The results do not constitute
          financial, tax, or legal advice.
        </p>
      </section>
    </div>
  );
}

function MoreInfo({ href }: { href: string }) {
  return (
    <p className="mt-3 font-medium">
      More information:{' '}
      <a className="text-cyan-700 underline decoration-cyan-700/40 underline-offset-2 hover:text-cyan-900" href={href} target="_blank" rel="noopener noreferrer">
        {href}
      </a>
    </p>
  );
}
