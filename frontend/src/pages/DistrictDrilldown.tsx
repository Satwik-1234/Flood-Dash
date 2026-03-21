import React from 'react';
import { useParams } from 'react-router-dom';

const DistrictDrilldown: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  return (
    <div className='p-8 flex flex-col gap-10 max-w-7xl mx-auto'>
      <header className='flex items-end justify-between border-b border-slate-800 pb-8'>
        <div className='space-y-2'>
          <h2 className='text-sm font-black uppercase tracking-widest text-slate-500'>District Status Report</h2>
          <h1 className='text-5xl font-black text-white leading-none tracking-tight'>
            {id || 'No District Selected'}
          </h1>
          <p className='text-slate-400 font-medium tracking-wide'>State: [Loading state...] — Latest Update: 21 Mar 2026, 09:40 IST</p>
        </div>
        
        <div className='flex items-center gap-6'>
          <div className='text-right'>
            <div className='text-sm font-bold text-slate-500 uppercase tracking-widest mb-1'>Composite Risk Score</div>
            <div className='text-4xl font-black text-red-500'>74.2 / 100</div>
          </div>
          <div className='h-16 w-px bg-slate-800 mx-4'></div>
          <div className='h-20 w-48 bg-red-950/20 border-2 border-red-500/30 rounded-2xl flex flex-col items-center justify-center p-4'>
            <div className='text-xs font-black uppercase tracking-[0.2em] text-red-400 mb-1'>Risk State</div>
            <div className='text-xl font-black uppercase text-red-500 tracking-tighter'>RED ALERT</div>
          </div>
        </div>
      </header>

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-10'>
        <div className='aspect-video bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden relative shadow-2xl'>
          <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
            <span className='text-3xl font-mono text-slate-800 tracking-widest opacity-25 uppercase'>Mini-Map Highlight</span>
          </div>
        </div>
        
        <div className='grid grid-cols-2 gap-6'>
          <div className='h-52 bg-slate-900 border border-slate-800 rounded-3xl p-6'>
            <div className='h-2 w-20 bg-slate-800 rounded mb-4'></div>
            <div className='h-10 w-full bg-slate-800/20 rounded-lg'></div>
          </div>
          <div className='h-52 bg-slate-900 border border-slate-800 rounded-3xl p-6'>
            <div className='h-2 w-20 bg-slate-800 rounded mb-4'></div>
            <div className='h-10 w-full bg-slate-800/20 rounded-lg'></div>
          </div>
          <div className='h-52 bg-slate-900 border border-slate-800 rounded-3xl p-6'>
            <div className='h-2 w-20 bg-slate-800 rounded mb-4'></div>
            <div className='h-10 w-full bg-slate-800/20 rounded-lg'></div>
          </div>
          <div className='h-52 bg-slate-900 border border-slate-800 rounded-3xl p-6'>
            <div className='h-2 w-20 bg-slate-800 rounded mb-4'></div>
            <div className='h-10 w-full bg-slate-800/20 rounded-lg'></div>
          </div>
        </div>
      </div>

      <section className='bg-red-950/10 border border-red-900/40 rounded-3xl p-10'>
        <h3 className='text-2xl font-black text-red-100 flex items-center gap-3 mb-6'>
          <div className='h-8 w-8 rounded-full bg-red-500 flex items-center justify-center text-red-950 text-base font-bold italic animate-pulse'>!</div>
          Active Public Safety Guidance
        </h3>
        <p className='text-red-200/50 text-lg leading-relaxed max-w-4xl'>
          Severe flood risk detected in district. Possible evacuation advisory in effect for low-lying areas. Move to higher ground immediately. Charge mobile devices and pack emergency supplies. Monitor District Collector broadcasts.
        </p>
      </section>
    </div>
  );
};

export default DistrictDrilldown;
