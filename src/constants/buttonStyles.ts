const buttonBaseClasses =
  'inline-flex min-h-10 items-center justify-center gap-2 border border-slate-300/30 bg-white/80 text-sm font-bold shadow-lg shadow-slate-400/10 transition focus:outline-none focus:ring-2 disabled:cursor-wait disabled:opacity-70';

const buttonToneClasses = {
  default:
    'text-blue-900 hover:border-blue-300/80 hover:bg-blue-100/80 hover:text-blue-700 focus:ring-blue-500/20 active:border-blue-400/80 active:bg-blue-200/80 active:text-blue-800 active:shadow-inner',
  danger:
    'text-slate-500 hover:border-red-300/70 hover:bg-red-500/10 hover:text-red-600 focus:ring-red-500/20 active:border-red-400/70 active:bg-red-500/15 active:text-red-700 active:shadow-inner',
};

const buttonSizeClasses = {
  icon: 'h-10 w-10 rounded-full p-0',
  text: 'rounded-lg px-3 py-2',
};

type ButtonTone = keyof typeof buttonToneClasses;
type ButtonSize = keyof typeof buttonSizeClasses;

export function buttonClasses({
  className = '',
  size = 'text',
  tone = 'default',
}: {
  className?: string;
  size?: ButtonSize;
  tone?: ButtonTone;
} = {}) {
  return [buttonBaseClasses, buttonSizeClasses[size], buttonToneClasses[tone], className].filter(Boolean).join(' ');
}
