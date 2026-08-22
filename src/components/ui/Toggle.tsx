import React from 'react';
import { cn } from '../../lib/utils';

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  dotColor?: string;
  disabled?: boolean;
  className?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  dotColor,
  disabled = false,
  className,
}) => {
  return (
    <label
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'inline-flex items-center justify-between gap-3 cursor-pointer select-none',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {label && (
        <div className="flex items-center gap-2">
          {dotColor && <span className={cn('w-2 h-2 rounded-full', dotColor)} />}
          <span className="text-xs font-medium text-vault-textSecondary">{label}</span>
        </div>
      )}
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div className="w-10 h-5 bg-slate-300 dark:bg-vault-borderLight peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
      </div>
    </label>
  );
};
