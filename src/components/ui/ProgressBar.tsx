import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressBarProps {
  value: number; // 0 - 100
  color?: 'green' | 'amber' | 'red' | 'cyan' | 'purple' | 'blue';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showGlow?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  color = 'green',
  size = 'md',
  className,
  showGlow = false,
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  const colorStyles = {
    green: 'bg-[#00E575] shadow-[0_0_14px_rgba(0,229,117,0.6)]',
    amber: 'bg-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)]',
    red: 'bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.5)]',
    cyan: 'bg-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.5)]',
    purple: 'bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]',
    blue: 'bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.5)]',
  };

  const heightStyles = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5',
  };

  return (
    <div className={cn('w-full bg-slate-200/80 dark:bg-[#181D26] rounded-full overflow-hidden p-[1px] border border-slate-200/60 dark:border-transparent', heightStyles[size], className)}>
      <div
        className={cn(
          'h-full rounded-full transition-all duration-500 ease-out',
          colorStyles[color],
          !showGlow && 'shadow-none'
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
};

// Segmented Progress Bar (Completed, In Progress, Remaining) matching Project Details screen
interface SegmentedProgressBarProps {
  completedPercent: number;
  inProgressPercent: number;
  className?: string;
}

export const SegmentedProgressBar: React.FC<SegmentedProgressBarProps> = ({
  completedPercent,
  inProgressPercent,
  className,
}) => {
  const remainingPercent = Math.max(0, 100 - completedPercent - inProgressPercent);

  return (
    <div className={cn('space-y-2', className)}>
      <div className="w-full h-3 bg-slate-200/80 dark:bg-[#181D26] rounded-full overflow-hidden flex gap-1 p-[1px] border border-slate-200/60 dark:border-transparent">
        {completedPercent > 0 && (
          <div
            className="h-full bg-[#00E575] rounded-l-full transition-all duration-500 shadow-[0_0_10px_rgba(0,229,117,0.3)]"
            style={{ width: `${completedPercent}%` }}
            title={`Completed: ${completedPercent}%`}
          />
        )}
        {inProgressPercent > 0 && (
          <div
            className="h-full bg-blue-500 transition-all duration-500"
            style={{ width: `${inProgressPercent}%` }}
            title={`In Progress: ${inProgressPercent}%`}
          />
        )}
        {remainingPercent > 0 && (
          <div
            className="h-full bg-slate-300/80 dark:bg-[#202735] rounded-r-full transition-all duration-500"
            style={{ width: `${remainingPercent}%` }}
            title={`Remaining: ${remainingPercent}%`}
          />
        )}
      </div>

      <div className="flex justify-between items-center text-xs text-vault-textMuted font-medium px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#00E575] shadow-[0_0_8px_rgba(0,229,117,0.6)]"></span>
          <span className="text-vault-textSecondary font-semibold">Completed ({completedPercent}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          <span>In progress ({inProgressPercent}%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-[#2A3345]"></span>
          <span>Remaining ({remainingPercent}%)</span>
        </div>
      </div>
    </div>
  );
};

// Circular Progress Gauge matching Dashboard Progress Summaries
interface CircularGaugeProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  sublabel?: string;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  percentage,
  size = 84,
  strokeWidth = 7,
  color = '#00E575',
  sublabel,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-200 dark:stroke-[#1F2633]"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-base font-bold text-vault-textPrimary">{percentage}%</span>
        {sublabel && <span className="text-[10px] text-vault-textMuted font-medium">{sublabel}</span>}
      </div>
    </div>
  );
};
