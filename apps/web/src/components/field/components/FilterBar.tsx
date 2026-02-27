import React from 'react';
import { FilterPill } from './FilterPill';

interface FilterBarProps {
  currentFilter: string;
  onFilterChange: (filterValue: string) => void;
  filters: { label: string; value: string; icon?: React.ReactNode }[];
}

export function FilterBar({ currentFilter, onFilterChange, filters }: FilterBarProps) {
  return (
    <div className="w-full overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex items-center gap-2 min-w-max">
        {filters.map((f) => (
          <FilterPill
            key={f.value}
            label={f.label}
            icon={f.icon}
            active={currentFilter === f.value}
            onClick={() => onFilterChange(f.value)}
          />
        ))}
      </div>
    </div>
  );
}
