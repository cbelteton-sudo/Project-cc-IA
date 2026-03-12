import React from 'react';

export const LogoIcon = ({ className = 'w-8 h-8' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect
      x="5"
      y="5"
      width="90"
      height="90"
      rx="20"
      fill="white"
      stroke="#F59E0B"
      strokeWidth="6"
    />
    <rect x="20" y="20" width="18" height="28" rx="6" fill="#F59E0B" />
    <rect x="44" y="20" width="38" height="28" rx="6" fill="#FFFFFF" />
    <rect x="20" y="52" width="18" height="28" rx="6" fill="#F1F5F9" />
    <path
      d="M46 64 L56 74 L80 48"
      stroke="#F59E0B"
      strokeWidth="8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
