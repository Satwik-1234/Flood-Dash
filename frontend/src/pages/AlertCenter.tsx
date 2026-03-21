import React from 'react';

const AlertCenter: React.FC = () => {
  return (
    <div className='p-8 max-w-7xl mx-auto'>
      <header className='mb-10'>
        <h1 className='text-4xl font-black tracking-tight text-white'>India National Flood Alert Center</h1>
        <p className='text-slate-400 mt-2 text-lg'>Aggregated warnings from IMD, CWC, GDACS, and Google Flood Hub.</p>
      </header>

      {/* Filter Panel and Grid Overlay Placeholder */}
      <div className='flex flex-col md:flex-row gap-8'>
        <aside className='w-full md:w-64 space-y-6'>
          <h2 className='text-sm border-b border-slate-700 pb-2 font-bold uppercase tracking-widest text-slate-500'>Filters</h2>
          <div className='space-y-4'>
            {[1,2,3].map(i => (
              <div key={i} className='h-32 bg-slate-800/30 border border-slate-700/50 rounded-lg animate-pulse'></div>
            ))}
          </div>
        </aside>

        <section className='flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6'>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className='h-48 bg-slate-800/50 border border-slate-700 rounded-xl p-6'>
              <div className='flex justify-between items-start mb-4'>
                <div className='h-6 w-32 bg-slate-700 rounded'></div>
                <div className='h-6 w-16 bg-red-900/40 rounded-full border border-red-500/30'></div>
              </div>
              <div className='space-y-3'>
                <div className='h-4 w-full bg-slate-700/50 rounded'></div>
                <div className='h-4 w-3/4 bg-slate-700/50 rounded'></div>
                <div className='h-4 w-1/2 bg-slate-700/50 rounded'></div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
};

export default AlertCenter;
