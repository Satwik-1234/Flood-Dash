import React from 'react';

const Overview: React.FC = () => {
  return (
    <div className='p-8'>
      <h1 className='text-4xl font-bold tracking-tight text-white mb-2'>National Overview Dashboard</h1>
      <p className='text-slate-400 text-lg'>Live flood intelligence and risk management for the Indian subcontinent.</p>
      
      <div className='mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Placeholder for National Metrics */}
        <div className='lg:col-span-2 aspect-video bg-slate-800/50 border border-slate-700 rounded-xl flex items-center justify-center'>
          <span className='text-slate-500'>[National Choropleth Map Placeholder]</span>
        </div>
        <div className='space-y-6'>
          <div className='h-64 bg-slate-800/50 border border-slate-700 rounded-xl flex items-center justify-center'>
            <span className='text-slate-500'>[Active Events Feed Placeholder]</span>
          </div>
          <div className='grow bg-slate-800/50 border border-slate-700 rounded-xl flex items-center justify-center'>
            <span className='text-slate-500'>[National Metrics Stack Placeholder]</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Overview;
