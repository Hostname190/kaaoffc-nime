'use client';

export default function Loading() {
  return (
    <div className="fixed inset-0 z-[100] bg-[#09090b] flex flex-col items-center justify-center">
      <div className="relative flex flex-col items-center">
        <img 
          src="/welcome-logo.png" 
          alt="Loading..." 
          className="w-24 h-auto object-contain mb-8 animate-pulse"
          onError={(e) => { e.currentTarget.src = '/logo.png'; }}
        />
        <div className="w-8 h-8 border-4 border-zinc-700 border-t-amber-500 rounded-full animate-spin"></div>
      </div>
    </div>
  );
}
