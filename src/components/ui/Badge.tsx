import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant = 'green' | 'amber' | 'red' | 'cyan' | 'purple' | 'blue' | 'neutral';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
  pulse?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  dot = false,
  pulse = false,
  className,
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, { container: string; dotColor: string }> = {
    green: {
      container: 'bg-[#00E575]/15 text-[#045E33] dark:bg-emerald-950/60 dark:text-[#00E575] border-[#00E575]/40 dark:border-[#00E575]/30 shadow-[0_0_10px_rgba(0,229,117,0.15)] font-semibold',
      dotColor: 'bg-[#00E575]',
    },
    amber: {
      container: 'bg-amber-500/15 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-500/30 shadow-[0_0_10px_rgba(245,158,11,0.15)] font-semibold',
      dotColor: 'bg-amber-400',
    },
    red: {
      container: 'bg-red-500/15 text-red-700 dark:bg-red-950/60 dark:text-red-300 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.15)] font-semibold',
      dotColor: 'bg-red-400',
    },
    cyan: {
      container: 'bg-cyan-500/15 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-500/30 shadow-[0_0_10px_rgba(6,182,212,0.15)] font-semibold',
      dotColor: 'bg-cyan-400',
    },
    purple: {
      container: 'bg-indigo-500/15 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.15)] font-semibold',
      dotColor: 'bg-indigo-400',
    },
    blue: {
      container: 'bg-blue-500/15 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.15)] font-semibold',
      dotColor: 'bg-blue-400',
    },
    neutral: {
      container: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700/50',
      dotColor: 'bg-slate-400',
    }
  };

  const current = variantStyles[variant];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border backdrop-blur-sm transition-all',
        current.container,
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full shrink-0',
            current.dotColor,
            pulse && 'animate-pulse'
          )}
        />
      )}
      {children}
    </span>
  );
};
