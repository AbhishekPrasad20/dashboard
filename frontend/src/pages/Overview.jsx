import React, { useEffect, useState } from 'react';
import StatCard from '../components/StatCard';
import { useAuth } from '../context/AuthContext';
import { Users, DollarSign, Target, CheckCircle2, TrendingUp, Briefcase, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';

const Overview = () => {
  const { token, logout } = useAuth();
  const [salesData, setSalesData] = useState([]);
  const [pmData, setPmData] = useState([]);
  const [companyData, setCompanyData] = useState({ total_revenue: 0, total_leads: 0, total_won: 0, active_projects: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const [salesRes, pmRes, companyRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/metrics/sales`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/metrics/pm`, { headers }),
          fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/metrics/company`, { headers })
        ]);

        if (salesRes.status === 401 || salesRes.status === 403 || pmRes.status === 401 || pmRes.status === 403 || companyRes.status === 401) {
          logout();
          return;
        }
        if (!salesRes.ok || !pmRes.ok || !companyRes.ok) throw new Error('Failed to fetch metrics');

        setSalesData(await salesRes.json());
        setPmData(await pmRes.json());
        setCompanyData(await companyRes.json());
      } catch (err) {
        console.error("Failed to fetch:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token, logout]);

  const totalRevenue = parseFloat(companyData.total_revenue || 0);
  const totalAssigned = parseInt(companyData.total_leads || 0);
  const totalWon = parseInt(companyData.total_won || 0);
  const overallWinRate = totalAssigned > 0 ? ((totalWon / totalAssigned) * 100).toFixed(1) : 0;
  const totalProjects = parseInt(companyData.active_projects || 0);

  const topSales = salesData.length > 0 ? salesData[0] : null;
  const topPM = pmData.length > 0 ? pmData[0] : null;

  // Revenue by employee chart data
  const revenueChartData = salesData.map(s => ({
    name: s.employee_name.split(' ')[0],
    revenue: parseFloat(s.total_revenue_secured),
    deals: parseInt(s.deals_won),
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-dark-card/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-sm font-semibold text-dark-text mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-xs text-dark-muted">
            {p.name === 'revenue' ? 'Revenue' : 'Deals'}: <span className="text-dark-text font-medium">{p.name === 'revenue' ? `$${p.value.toLocaleString()}` : p.value}</span>
          </p>
        ))}
      </div>
    );
  };

  const Skeleton = () => (
    <div className="animate-pulse space-y-4">
      <div className="h-4 bg-dark-border/40 rounded-lg w-3/4" />
      <div className="h-4 bg-dark-border/40 rounded-lg w-1/2" />
      <div className="h-8 bg-dark-border/40 rounded-lg w-1/3 mt-2" />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-dark-text">
          Dashboard
        </h2>
        <p className="text-dark-muted mt-1 text-sm">High-level performance metrics across all departments.</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 stagger-children">
        <StatCard title="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} icon={DollarSign} color="primary" />
        <StatCard title="Active Projects" value={totalProjects.toString()} icon={Target} color="purple" />
        <StatCard title="Employees Tracked" value={new Set([...salesData.map(s => s.employee_id), ...pmData.map(p => p.employee_id)]).size.toString()} icon={Users} color="green" />
        <StatCard title="Win Rate" value={`${overallWinRate}%`} icon={CheckCircle2} color="amber" />
      </div>

      {/* Revenue Chart + Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Revenue Chart */}
        <div className="lg:col-span-3 glass-card hover-glow p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-semibold text-dark-text">Revenue by Sales Rep</h3>
              <p className="text-xs text-dark-muted mt-0.5">Secured revenue comparison</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueChartData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.5 }} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[8, 8, 0, 0]} maxBarSize={50} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers */}
        <div className="lg:col-span-2 space-y-5">
          {/* Top Sales */}
          <div className="glass-card hover-glow p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <p className="text-xs font-medium text-dark-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="text-lg">🏆</span> Top Sales Lead
            </p>
            {loading ? <Skeleton /> : topSales ? (
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-blue-500/25">
                    {topSales.employee_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-dark-text">{topSales.employee_name}</h4>
                    <p className="text-xs text-blue-400 flex items-center gap-1"><TrendingUp className="w-3 h-3"/>Sales Lead</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/[0.02] p-3 rounded-lg">
                    <p className="text-[10px] text-dark-muted uppercase">Revenue</p>
                    <p className="text-sm font-bold text-dark-text mt-0.5">${parseFloat(topSales.total_revenue_secured).toLocaleString()}</p>
                  </div>
                  <div className="bg-white/[0.02] p-3 rounded-lg">
                    <p className="text-[10px] text-dark-muted uppercase">Win Rate</p>
                    <p className="text-sm font-bold text-dark-text mt-0.5">{topSales.win_rate_percentage}%</p>
                  </div>
                  <div className="bg-white/[0.02] p-3 rounded-lg">
                    <p className="text-[10px] text-dark-muted uppercase">Won</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">{topSales.deals_won}</p>
                  </div>
                </div>
              </div>
            ) : <p className="text-dark-muted text-sm">No data</p>}
          </div>

          {/* Top PM */}
          <div className="glass-card hover-glow p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
            <p className="text-xs font-medium text-dark-muted uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="text-lg">⭐</span> Top Project Manager
            </p>
            {loading ? <Skeleton /> : topPM ? (
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-emerald-500/25">
                    {topPM.employee_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-dark-text">{topPM.employee_name}</h4>
                    <p className="text-xs text-emerald-400 flex items-center gap-1"><Briefcase className="w-3 h-3"/>Project Manager</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-white/[0.02] p-3 rounded-lg">
                    <p className="text-[10px] text-dark-muted uppercase">Collection</p>
                    <p className="text-sm font-bold text-dark-text mt-0.5">{topPM.invoice_collection_rate}%</p>
                  </div>
                  <div className="bg-white/[0.02] p-3 rounded-lg">
                    <p className="text-[10px] text-dark-muted uppercase">Completed</p>
                    <p className="text-sm font-bold text-emerald-400 mt-0.5">{topPM.completed_projects}</p>
                  </div>
                  <div className="bg-white/[0.02] p-3 rounded-lg">
                    <p className="text-[10px] text-dark-muted uppercase">Managed</p>
                    <p className="text-sm font-bold text-dark-text mt-0.5">${parseFloat(topPM.total_revenue_managed).toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ) : <p className="text-dark-muted text-sm">No data</p>}
          </div>
        </div>
      </div>

      {/* All Sales Leaderboard */}
      <div className="glass-card hover-glow p-6">
        <h3 className="text-base font-semibold text-dark-text mb-5">Sales Leaderboard</h3>
        <div className="space-y-3">
          {salesData.map((emp, i) => {
            const maxRev = parseFloat(salesData[0]?.total_revenue_secured) || 1;
            const pct = (parseFloat(emp.total_revenue_secured) / maxRev) * 100;
            return (
              <div key={emp.employee_id} className="flex items-center gap-4 group">
                <span className="text-xs font-bold text-dark-muted w-5">#{i + 1}</span>
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/10 flex items-center justify-center text-xs font-bold text-blue-400">
                  {emp.employee_name.split(' ').map(n => n[0]).join('')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-dark-text truncate">{emp.employee_name}</span>
                    <span className="text-sm font-bold text-dark-text">${parseFloat(emp.total_revenue_secured).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-white/[0.03] rounded-full h-1.5">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-1.5 rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <span className="text-xs text-dark-muted w-14 text-right">{emp.win_rate_percentage}% WR</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Overview;
