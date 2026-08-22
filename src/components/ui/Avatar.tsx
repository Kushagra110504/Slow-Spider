import React from 'react';
import { cn } from '../../lib/utils';
import { User } from '../../types/database';

interface AvatarProps {
  user?: Partial<User> | null;
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  user,
  name,
  src,
  size = 'md',
  className,
}) => {
  const displayName = name || user?.name || 'User';
  const displaySrc = src || user?.avatar_url;

  const initials = displayName
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const sizeStyles = {
    xs: 'w-5 h-5 text-[9px]',
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-8 h-8 text-xs',
    lg: 'w-10 h-10 text-sm',
  };

  return (
    <div
      className={cn(
        'relative rounded-full shrink-0 flex items-center justify-center font-semibold overflow-hidden border border-[#2B3242] bg-[#1E2430] text-slate-200 select-none shadow-sm',
        sizeStyles[size],
        className
      )}
      title={displayName}
    >
      {displaySrc ? (
        <img
          src={displaySrc}
          alt={displayName}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // fallback to initials on broken image
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};

interface AvatarStackProps {
  users: Partial<User>[];
  max?: number;
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

export const AvatarStack: React.FC<AvatarStackProps> = ({
  users,
  max = 3,
  size = 'sm',
  className,
}) => {
  const visible = users.slice(0, max);
  const remaining = users.length - max;

  return (
    <div className={cn('flex items-center -space-x-2 overflow-hidden', className)}>
      {visible.map((u, i) => (
        <Avatar
          key={u.id || i}
          user={u}
          size={size}
          className="ring-2 ring-[#0F1217] transition-transform hover:scale-110 hover:z-10"
        />
      ))}
      {remaining > 0 && (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-[#202734] text-slate-400 font-bold border border-[#2E3748] ring-2 ring-[#0F1217]',
            size === 'xs' && 'w-5 h-5 text-[9px]',
            size === 'sm' && 'w-6 h-6 text-[10px]',
            size === 'md' && 'w-8 h-8 text-xs'
          )}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
};
