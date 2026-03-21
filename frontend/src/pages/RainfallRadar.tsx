import React from 'react';

const RainfallRadar: React.FC = () => {
  return (
    <div className='p-8 h-full flex flex-col gap-8'>
      <header>
        <h1 className='text-3xl font-black text-white leading-none tracking-tight'>Rainfall Radar & Satellite Precipitation</h1>
        <p className='text-slate-500 mt-2 font-medium tracking-wide'>NASA GPM IMERG Near Real-Time Precipitation Estimates.</p>
      </header>
      
      <div className='flex-1 flex flex-col gap-6'>
        <div className='flex-1 relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl'>
          <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
            <span className='text-5xl font-mono text-slate-800 tracking-widest opacity-25 uppercase'>GPM Heatmap Overlay Placeholder</span>
          </div>
          
          {/* Time Scrubber Placeholder */}
          <div className='absolute bottom-8 left-1/2 transform -translate-x-1/2 h-14 w-3/4 bg-slate-900/90 border border-slate-700/50 backdrop-blur-3xl rounded-2xl p-4 flex items-center gap-4'>
            <div className='h-4 w-4 rounded-full bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]'></div>
            <div className='flex-1 h-1.5 bg-slate-800 rounded'>
              <div className='w-3/4 h-full bg-sky-500 rounded'></div>
            </div>
          </div>
        </div>

        <div className='h-80 bg-slate-900 border border-slate-800 rounded-3xl p-8'>
          <h3 className='text-sm font-bold uppercase tracking-widest text-slate-500 mb-6'>Rainfall Forecast vs Observed (Past 7 Days + Next 7 Days)</h3>
          <div className='h-48 w-full bg-slate-800/30 rounded-xl relative flex items-end gap-1 px-4 border-b border-l border-slate-700/50'>
            {[...Array(14)].map((_, i) => (
              <div key={i} className={`flex-1 rounded-t ${i < 7 ? 'bg-slate-700/50' : 'bg-sky-500/20'}`} style={{ height: `${10+Math.random()*80}%` }}></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RainfallRadar;
