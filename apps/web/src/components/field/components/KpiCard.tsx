import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export type KpiColor = 'red' | 'blue' | 'green' | 'purple' | 'slate';

interface KpiCardProps {
  title: string;
  value: number | string;
  color: KpiColor;
  icon?: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

const colorMap = {
  red: 'bg-red-50 text-red-700 border-red-100 hover:bg-red-100 focus:ring-red-200',
  blue: 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100 focus:ring-blue-200',
  green:
    'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100 focus:ring-emerald-200',
  purple:
    'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100 focus:ring-purple-200',
  slate: 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 focus:ring-slate-300',
};

const iconColorMap = {
  red: 'text-red-500',
  blue: 'text-blue-500',
  green: 'text-emerald-500',
  purple: 'text-purple-500',
  slate: 'text-slate-500',
};

export function KpiCard({ title, value, color, icon, onClick, className }: KpiCardProps) {
  const isClickable = !!onClick;

  return (
    <div
      onClick={onClick}
      role={isClickable ? 'button' : 'article'}
      tabIndex={isClickable ? 0 : undefined}
      className={twMerge(
        clsx(
          'relative p-4 rounded-xl border flex flex-col justify-between transition-colors outline-none focus:ring-2 focus:ring-offset-2',
          colorMap[color],
          isClickable ? 'cursor-pointer' : '',
        ),
        className,
      )}
    >
      <div className="flex justify-between items-start mb-2">
        <span className="text-sm font-medium leading-tight">{title}</span>
        {icon && <span className={iconColorMap[color]}>{icon}</span>}
      </div>
      <div className="text-3xl font-bold tracking-tight">{value}</div>
    </div>
  );
}
