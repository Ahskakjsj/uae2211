import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { ShieldAlert, PieChart as PieChartIcon } from 'lucide-react';

interface SeverityPieChartProps {
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  activeSeverity?: string;
  onSelectSeverity?: (sev: string) => void;
}

const SEVERITY_COLORS = {
  critical: {
    color: '#f43f5e', // rose-500
    glow: 'rgba(244, 63, 94, 0.4)',
    label: 'حرجة (Critical)',
    badgeBg: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
  },
  high: {
    color: '#f97316', // orange-500
    glow: 'rgba(249, 115, 22, 0.4)',
    label: 'عالية (High)',
    badgeBg: 'bg-orange-500/10 text-orange-400 border-orange-500/30'
  },
  medium: {
    color: '#eab308', // yellow-500
    glow: 'rgba(234, 179, 8, 0.4)',
    label: 'متوسطة (Medium)',
    badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
  },
  low: {
    color: '#10b981', // emerald-500
    glow: 'rgba(16, 185, 129, 0.4)',
    label: 'عادية (Low)',
    badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
  }
};

interface ChartDataItem {
  id: 'critical' | 'high' | 'medium' | 'low';
  name: string;
  value: number;
  color: string;
  percentage: number;
}

export const SeverityPieChart: React.FC<SeverityPieChartProps> = ({
  criticalCount,
  highCount,
  mediumCount,
  lowCount,
  activeSeverity = 'all',
  onSelectSeverity
}) => {
  const total = criticalCount + highCount + mediumCount + lowCount;

  const rawData: ChartDataItem[] = [
    {
      id: 'critical',
      name: 'حرجة',
      value: criticalCount,
      color: SEVERITY_COLORS.critical.color,
      percentage: total > 0 ? Math.round((criticalCount / total) * 100) : 0
    },
    {
      id: 'high',
      name: 'عالية',
      value: highCount,
      color: SEVERITY_COLORS.high.color,
      percentage: total > 0 ? Math.round((highCount / total) * 100) : 0
    },
    {
      id: 'medium',
      name: 'متوسطة',
      value: mediumCount,
      color: SEVERITY_COLORS.medium.color,
      percentage: total > 0 ? Math.round((mediumCount / total) * 100) : 0
    },
    {
      id: 'low',
      name: 'عادية',
      value: lowCount,
      color: SEVERITY_COLORS.low.color,
      percentage: total > 0 ? Math.round((lowCount / total) * 100) : 0
    }
  ];

  const data = rawData.filter(d => d.value > 0);

  if (total === 0) {
    return (
      <div className="bg-bg border border-border rounded-xl p-4 text-center">
        <div className="flex items-center justify-center gap-1.5 text-xs text-text-dim mb-1">
          <PieChartIcon className="w-3.5 h-3.5 text-text-dim" />
          <span className="font-bold">مخطط خطورة التريقرات</span>
        </div>
        <p className="text-[11px] text-text-dim/70">لا توجد بيانات تريقرات لعرضها حالياً</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item: ChartDataItem = payload[0].payload;
      return (
        <div className="bg-surface/95 border border-border px-3 py-2 rounded-xl shadow-xl backdrop-blur-md text-xs font-mono">
          <div className="flex items-center gap-1.5 mb-1 font-bold text-white">
            <span 
              className="w-2.5 h-2.5 rounded-full inline-block" 
              style={{ backgroundColor: item.color }} 
            />
            <span>{item.name}</span>
          </div>
          <div className="text-text-dim flex justify-between gap-4">
            <span>العدد:</span>
            <span className="text-white font-bold">{item.value.toLocaleString()}</span>
          </div>
          <div className="text-text-dim flex justify-between gap-4">
            <span>النسبة:</span>
            <span className="text-accent font-bold">{item.percentage}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-bg border border-border rounded-xl p-3.5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-bold text-white">
          <PieChartIcon className="w-4 h-4 text-accent" />
          <span>توزيع مستويات الخطورة (Severity)</span>
        </div>
        <span className="text-[10px] font-mono text-text-dim bg-white/[0.03] px-2 py-0.5 rounded border border-white/5">
          {total.toLocaleString()} حدث
        </span>
      </div>

      {/* Pie Chart Visualization */}
      <div className="relative w-full h-44 flex items-center justify-center">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={42}
              outerRadius={68}
              paddingAngle={3}
              dataKey="value"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth={2}
              cursor="pointer"
              onClick={(entry: any) => {
                const targetId = entry?.id || entry?.payload?.id;
                if (onSelectSeverity && targetId) {
                  onSelectSeverity(activeSeverity === targetId ? 'all' : targetId);
                }
              }}
            >
              {data.map((entry) => {
                const isSelected = activeSeverity === entry.id;
                return (
                  <Cell
                    key={`cell-${entry.id}`}
                    fill={entry.color}
                    opacity={activeSeverity === 'all' || isSelected ? 1 : 0.35}
                    className="transition-all duration-200 hover:opacity-100"
                  />
                );
              })}
            </Pie>
          </PieChart>
        </ResponsiveContainer>

        {/* Center Donut Info */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] text-text-dim font-bold uppercase tracking-wider">الأعلى خطورة</span>
          <span className="text-base font-mono font-bold text-rose-400">
            {criticalCount}
          </span>
          <span className="text-[9px] text-rose-400/80 font-mono">
            {total > 0 ? `${Math.round((criticalCount / total) * 100)}%` : '0%'}
          </span>
        </div>
      </div>

      {/* Interactive Legend Items */}
      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-border/50">
        {rawData.map((item) => {
          const isSelected = activeSeverity === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSeverity && onSelectSeverity(isSelected ? 'all' : item.id)}
              className={`flex items-center justify-between p-2 rounded-lg border text-xs transition-all cursor-pointer ${
                isSelected 
                  ? 'bg-white/10 border-accent shadow-sm ring-1 ring-accent/30' 
                  : 'bg-white/[0.02] border-white/5 hover:border-white/20 hover:bg-white/[0.04]'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[11px] font-medium text-white">{item.name}</span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <span className="text-white font-bold">{item.value}</span>
                <span className="text-text-dim text-[10px]">({item.percentage}%)</span>
              </div>
            </button>
          );
        })}
      </div>

      {activeSeverity !== 'all' && (
        <button
          onClick={() => onSelectSeverity && onSelectSeverity('all')}
          className="w-full py-1 text-[10px] text-text-dim hover:text-accent font-medium text-center transition-colors cursor-pointer"
        >
          إلغاء الفلتر وعرض جميع المستويات
        </button>
      )}
    </div>
  );
};
