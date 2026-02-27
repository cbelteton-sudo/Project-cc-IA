import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface FilterPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  label: string;
  icon?: React.ReactNode;
}

export function FilterPill({ active, label, icon, className, ...props }: FilterPillProps) {
  return (
    <button
      {...props}
      className={twMerge(
        clsx(
          'flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1',
          active
            ? 'bg-slate-800 text-white focus:ring-slate-800'
            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 focus:ring-slate-200',
        ),
        className,
      )}
    >
      {icon && (
        <span
          className={clsx('text-base leading-none', active ? 'text-slate-300' : 'text-slate-400')}
        >
          {icon}
        </span>
      )}
      {label}
    </button>
  );
}
