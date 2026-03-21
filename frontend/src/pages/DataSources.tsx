import React from 'react';

export const DataSources: React.FC = () => {
  return (
    <div className='p-8 flex flex-col items-center justify-center min-h-[80vh] text-center gap-10 max-w-4xl mx-auto'>
      <header className='space-y-4'>
        <h1 className='text-6xl font-black text-text-dark leading-none tracking-tight uppercase'>Systems & Data Attribution</h1>
        <p className='text-text-muted text-xl font-light tracking-wide'>The integrity of our intelligence relies on the accuracy and freshness of our data.</p>
      </header>

      <div className='w-full grid grid-cols-2 md:grid-cols-3 gap-8'>
        {[1,2,3,4,5,6].map(i => (
          <div key={i} className='h-48 bg-bg-white border border-border-default rounded-3xl p-8 relative flex flex-col justify-end gap-2 overflow-hidden hover:bg-bg-surface transition-colors shadow-2xl'>
            <div className='absolute top-6 right-6 h-3 w-3 rounded-full bg-suk-forest shadow-[0_0_15px_rgba(16,185,129,0.5)]'></div>
            <div className='h-2 w-16 bg-bg-surface rounded'></div>
            <div className='h-3 w-full bg-bg-surface rounded'></div>
            <div className='h-3 w-3/4 bg-bg-surface rounded'></div>
          </div>
        ))}
      </div>

      <div className='w-full h-px bg-border-default my-4'></div>

      <div className='w-full flex justify-between items-center text-text-muted font-mono text-xs uppercase tracking-widest'>
        <span>Open Source (MIT)</span>
        <span>Version 1.0.0-beta</span>
        <span>GitHub Repository</span>
      </div>
    </div>
  );
};
