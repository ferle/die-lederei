import React from 'react';

export function LoadingOverlay() {
  return (
    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 border-4 border-burgundy-700 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-burgundy-800 font-medium">Laden...</p>
      </div>
    </div>
  );
}