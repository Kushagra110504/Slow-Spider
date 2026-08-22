import React from 'react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' | 'frozen';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  className,
  disabled,
  ...props
}) => {
  const variantStyles: Record<ButtonVariant, string> = {
    primary: 'bg-[#00E575] hover:bg-[#00D069] text-[#042B16] font-bold shadow-[0_0_18px_rgba(0,229,117,0.4)] hover:shadow-[0_0_24px_rgba(0,229,117,0.6)] border border-[#00C966]/40 active:scale-[0.98]',
    secondary: 'bg-vault-cardHover text-vault-textPrimary hover:bg-vault-borderLight border border-vault-border active:scale-[0.98]',
    ghost: 'bg-transparent text-vault-textMuted hover:text-vault-textPrimary hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98]',
    danger: 'bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30 active:scale-[0.98]',
    warning: 'bg-amber-400 text-black hover:bg-amber-300 font-semibold shadow-[0_0_15px_rgba(245,158,11,0.35)] active:scale-[0.98]',
    frozen: 'bg-amber-400 text-black hover:bg-amber-300 font-semibold shadow-[0_0_15px_rgba(245,158,11,0.35)] active:scale-[0.98]',
  };

  const sizeStyles: Record<ButtonSize, string> = {
    sm: 'text-xs px-3 py-1.5 rounded-lg gap-1.5',
    md: 'text-sm px-4 py-2 rounded-xl gap-2',
    lg: 'text-base px-6 py-2.5 rounded-xl gap-2.5',
    icon: 'p-2 rounded-xl aspect-square',
  };

  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 cursor-pointer',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
      )}
      {children}
    </button>
  );
};
