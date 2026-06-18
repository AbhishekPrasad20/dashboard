import React, { useEffect, useRef, useState } from 'react';

// Animated counter hook
const useCounter = (end, duration = 1200) => {
  const [count, setCount] = useState(0);
  const prevEnd = useRef(end);
  useEffect(() => {
    prevEnd.current = end;
    const num = typeof end === 'string' ? parseFloat(end.replace(/[^0-9.-]/g, '')) : end;
    if (isNaN(num)) { setCount(end); return; }
    let start = 0;
    const startTime = performance.now();
    const step = (timestamp) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.floor(eased * num));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(num);
    };
    requestAnimationFrame(step);
  }, [end, duration]);
  return count;
};

const StatCard = ({ title, value, icon: Icon, color = 'primary' }) => {
  // Parse numeric value for counter
  const isPercent = typeof value === 'string' && value.includes('%');
  const isDollar = typeof value === 'string' && value.includes('$');
  const rawNum = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
  const animatedNum = useCounter(isNaN(rawNum) ? 0 : rawNum);

  const formatValue = () => {
    if (isNaN(rawNum)) return value;
    if (isDollar) return `$${animatedNum.toLocaleString()}`;
    if (isPercent) return `${animatedNum}%`;
    return animatedNum.toLocaleString();
  };

  const colorMap = {
    primary: { bg: 'from-blue-500/10 to-indigo-500/5', icon: 'text-blue-400', border: 'border-blue-500/10' },
    green: { bg: 'from-emerald-500/10 to-green-500/5', icon: 'text-emerald-400', border: 'border-emerald-500/10' },
    purple: { bg: 'from-violet-500/10 to-purple-500/5', icon: 'text-violet-400', border: 'border-violet-500/10' },
    amber: { bg: 'from-amber-500/10 to-orange-500/5', icon: 'text-amber-400', border: 'border-amber-500/10' },
  };

  const c = colorMap[color] || colorMap.primary;

  return (
    <div className={`glass-card hover-glow p-6 group cursor-default border bg-gradient-to-br ${c.border} ${c.bg}`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-xs font-medium text-dark-muted uppercase tracking-wider mb-2">{title}</p>
          <h3 className="text-3xl font-bold text-dark-text tracking-tight transition-colors">
            {formatValue()}
          </h3>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl bg-white/[0.03] ${c.icon} group-hover:scale-110 transition-all duration-300`}>
            <Icon className="w-5 h-5" strokeWidth={1.5} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StatCard;
