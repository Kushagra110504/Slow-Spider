import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverEffect?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  hoverEffect = false,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-vault-card border border-vault-border rounded-2xl p-5 shadow-card transition-all duration-200 text-vault-textPrimary',
        hoverEffect && 'hover:border-vault-borderLight hover:bg-vault-cardHover hover:shadow-lg',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
