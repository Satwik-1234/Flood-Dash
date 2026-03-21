import React from 'react';

const HistoricalEvents: React.FC = () => {
  return (
    <div className='p-8 flex flex-col items-center justify-center min-h-[80vh] bg-slate-950 text-center gap-6'>
      <div className='w-full max-w-4xl space-y-4'>
        <h1 className='text-5xl font-black text-white leading-none tracking-tight'>Historical India Flood Explorer</h1>
        <p className='text-slate-400 text-xl font-light tracking-wide'>Explore past flood events using INDOFLOODS and IMD historical data.</p>
      </div>

      <div className='w-full max-w-[80vw] h-[50vh] bg-slate-900 border border-slate-800 rounded-3xl p-12 relative flex flex-col justify-end gap-6 overflow-hidden'>
        <div className='absolute inset-0 pointer-events-none opacity-5'>
          <div className='grid grid-cols-12 gap-8 h-full p-8'>
            {[...Array(12)].map((_, i) => (
              <div key={i} className='h-full w-px bg-white border-dashed opacity-50'></div>
            ))}
          </div>
        </div>
        
        <div className='absolute top-20 left-1/2 transform -translate-x-1/2 h-40 w-full flex items-center justify-center pointer-events-none'>
          <span className='text-3xl font-mono text-slate-800 tracking-widest opacity-25 uppercase'>Interactive Timeline Bubble Chart Explorer</span>
        </div>

        <div className='h-12 w-full bg-slate-800/30 rounded-full flex items-center px-6 gap-4'>
          <span className='text-xs font-mono text-slate-500'>1970</span>
          <div className='flex-1 h-px bg-slate-700/50'></div>
          <span className='text-xs font-mono text-slate-500'>2025</span>
        </div>
      </div>
      
      <div className='flex gap-8 w-full max-w-[80vw]'>
        <div className='flex-1 h-64 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500'>[Event Detail Panel]</div>
        <div className='flex-1 h-64 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-center text-slate-500'>[Annual Rainfall Trends]</div>
      </div>
    </div>
  );
};

export default HistoricalEvents;
