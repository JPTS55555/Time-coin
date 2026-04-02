import React from 'react';

export function AdBanner({ format = 'banner', onClick }: { format?: 'banner' | 'rectangle', onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`bg-gray-100 border border-gray-200 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:bg-gray-200 transition-colors ${format === 'banner' ? 'w-full h-16 rounded-xl' : 'w-full h-48 rounded-2xl'}`}
    >
      <span className="text-[10px] uppercase tracking-widest mb-1">Advertisement</span>
      <span className="text-sm font-medium text-gray-500">Local Sponsored Content</span>
      {onClick && <span className="text-xs text-indigo-500 mt-2">Click to earn rewards</span>}
    </div>
  );
}
