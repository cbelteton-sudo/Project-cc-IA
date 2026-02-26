import React from 'react';

interface WidgetCardProps {
  title: string;
  children: React.ReactNode;
}

export const WidgetCard = ({ title, children }: WidgetCardProps) => {
  return (
    <div className="bg-white rounded-lg p-5 flex flex-col border border-gray-200 shadow-sm h-full min-h-[320px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-gray-800 font-semibold text-lg">{title}</h3>
      </div>
      <div className="flex-1 flex flex-col relative w-full h-full overflow-hidden">{children}</div>
    </div>
  );
};
