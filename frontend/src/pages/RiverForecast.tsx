import React from 'react';

const RiverForecast: React.FC = () => {
  return (
    <div className='p-8 h-full flex flex-col'>
      <header className='mb-8'>
        <h1 className='text-3xl font-black text-white uppercase tracking-tighter'>Strategic River Discharge Forecasts</h1>
        <p className='text-slate-500'>Multi-ensemble river stage and discharge prediction (GloFAS + CWC).</p>
      </header>

      <div className='flex flex-1 gap-8'>
        <aside className='w-80 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl flex flex-col'>
          <div className='p-4 border-b border-slate-800'>
            <div className='h-10 w-full bg-slate-800 rounded px-4 py-2 text-slate-500 text-sm flex items-center justify-between'>
              Search stations...
            </div>
          </div>
          <div className='flex-1 overflow-y-auto p-4 space-y-4'>
            {[1,2,3,4,5,6,7,8].map(i => (
              <div key={i} className='h-12 bg-slate-800/30 border border-slate-700/50 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer p-3'>
                <div className='h-2 w-3/4 bg-slate-600/50 rounded mb-2'></div>
                <div className='h-1.5 w-1/2 bg-slate-700/50 rounded'></div>
              </div>
            ))}
          </div>
        </aside>

        <section className='flex-1 flex flex-col gap-6'>
          <div className='flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-8 relative'>
            <div className='absolute inset-0 flex items-center justify-center pointer-events-none opacity-10'>
              <span className='text-7xl font-bold uppercase tracking-widest text-white transform -rotate-12'>GloFAS v4 Chart</span>
            </div>
            <div className='h-full flex flex-col justify-end'>
              <div className='h-3/4 w-full bg-gradient-to-t from-slate-800/30 to-transparent border-b border-l border-slate-700/50 flex items-end gap-1 px-4'>
                {[...Array(40)].map((_, i) => (
                  <div key={i} className='flex-1 bg-sky-500/10 rounded-t' style={{ height: `${20 + Math.sin(i * 0.3) * 30 + (i === 30 ? 40 : 10)}%` }}></div>
                ))}
              </div>
            </div>
          </div>
          <div className='h-64 grid grid-cols-2 gap-6'>
            <div className='bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center p-6'>
              <span className='text-slate-500'>[Return Period Exceedance Label]</span>
            </div>
            <div className='bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center p-6'>
              <span className='text-slate-500'>[Seasonal Monthly Distribution]</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default RiverForecast;
