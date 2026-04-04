import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HydrographProps {
  data: { time: string; value: number }[];
  warningLevel?: number;
  dangerLevel?: number;
  height?: number;
}

const Hydrograph: React.FC<HydrographProps> = ({ data, warningLevel, dangerLevel, height = 200 }) => {
  const chartData = useMemo(() => {
    return data.map(d => ({
      ...d,
      timestamp: new Date(d.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center bg-slate-900/50 rounded-xl border border-white/5 font-mono text-[10px] text-t3 uppercase tracking-widest" style={{ height }}>
        Insufficient Trend Data
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis 
            dataKey="timestamp" 
            stroke="#475569" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis 
            stroke="#475569" 
            fontSize={9} 
            tickLine={false} 
            axisLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: '#0f172a', 
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              fontSize: '10px',
              fontFamily: 'JetBrains Mono'
            }}
            itemStyle={{ color: '#22d3ee' }}
          />
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#22d3ee" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorValue)" 
            animationDuration={1500}
          />
          
          {warningLevel && (
            <Area 
              type="monotone" 
              dataKey={() => warningLevel} 
              stroke="#f59e0b" 
              strokeDasharray="5 5" 
              fill="transparent" 
              strokeWidth={1}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default Hydrograph;
