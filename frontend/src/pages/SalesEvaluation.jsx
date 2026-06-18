import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadialBarChart, RadialBar } from 'recharts';
import { User, ChevronRight, DollarSign, Target, Award, TrendingUp } from 'lucide-react';
import StatCard from '../components/StatCard';

const SalesEvaluation = () => {
  const { token, logout } = useAuth();
  const [salesData, setSalesData] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [activeLeads, setActiveLeads] = useState([]);
  const [companyAvg, setCompanyAvg] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/metrics/sales`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => {
        if (res.status === 401 || res.status === 403) { logout(); throw new Error('Unauthorized'); }
        if (!res.ok) throw new Error('Failed to load sales metrics');
        return res.json();
      })
      .then(data => {
        const safeData = data || [];
        setSalesData(safeData);
        if (safeData.length > 0) setSelectedEmp(safeData[0]);
        
        const validReps = safeData.filter(s => parseInt(s.total_leads_assigned || 0) > 0);
        const totalLeads = validReps.reduce((acc, s) => acc + parseInt(s.total_leads_assigned || 0), 0);
        const totalWon = validReps.reduce((acc, s) => acc + parseInt(s.deals_won || 0), 0);
        
        if (totalLeads > 0) {
          setCompanyAvg((totalWon / totalLeads) * 100);
        } else {
          setCompanyAvg(0);
        }
      })
      .catch(() => setError('Unable to load sales metrics.'))
      .finally(() => setIsLoading(false));
  }, [token, logout]);

  useEffect(() => {
    if (selectedEmp) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/employees/${selectedEmp.employee_id}/history`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => {
          if (res.status === 401 || res.status === 403) { logout(); throw new Error('Unauthorized'); }
          if (!res.ok) throw new Error('Failed to load history');
          return res.json();
        })
        .then(data => setActiveLeads(data?.leads || data?.history || []))
        .catch(() => setActiveLeads([]));
    }
  }, [selectedEmp, token, logout]);

  const chartData = selectedEmp ? [
    { name: 'Company Avg', winRate: parseFloat(companyAvg.toFixed(1)) },
    { name: selectedEmp.employee_name.split(' ')[0], winRate: parseFloat(selectedEmp.win_rate_percentage) },
  ] : [];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-dark-card/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-sm font-semibold text-dark-text">{label}</p>
        <p className="text-xs text-dark-muted">Win Rate: <span className="text-blue-400 font-medium">{payload[0].value}%</span></p>
      </div>
    );
  };

  // Radial chart for win rate
  const radialData = selectedEmp ? [{ name: 'Win Rate', value: parseFloat(selectedEmp.win_rate_percentage), fill: '#3b82f6' }] : [];

  return (
    <div className="space-y-8 animate-fade-in">
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-dark-bg/50 backdrop-blur-sm rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      )}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-dark-text">Sales Evaluation</h2>
        <p className="text-dark-muted mt-1 text-sm">Analyze sales team performance, win rates, and deal pipeline.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee Cards */}
        <div className="lg:col-span-1 space-y-2 stagger-children">
          {salesData.map((emp) => (
            <button
              key={emp.employee_id}
              onClick={() => setSelectedEmp(emp)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                selectedEmp?.employee_id === emp.employee_id
                  ? 'glass-card border-blue-500/20 shadow-lg shadow-blue-500/5'
                  : 'bg-dark-card/40 border-white/[0.04] hover:bg-dark-card/70 hover:border-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${
                    selectedEmp?.employee_id === emp.employee_id
                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg shadow-blue-500/25'
                      : 'bg-white/[0.04] text-dark-muted'
                  }`}>
                    {emp.employee_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-dark-text">{emp.employee_name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-dark-muted">
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3"/>${parseFloat(emp.total_revenue_secured).toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Award className="w-3 h-3"/>{emp.win_rate_percentage}%</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-all ${selectedEmp?.employee_id === emp.employee_id ? 'text-blue-400 translate-x-0.5' : 'text-dark-muted/30'}`} />
              </div>
            </button>
          ))}
        </div>

        {/* Detail View */}
        {selectedEmp && (
        <div className="lg:col-span-2 space-y-5 animate-fade-in">
          {/* Stats row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 stagger-children">
            <StatCard title="Leads" value={selectedEmp.total_leads_assigned} icon={Target} color="primary" />
            <StatCard title="Won" value={selectedEmp.deals_won} icon={Award} color="green" />
            <StatCard title="Revenue" value={`$${selectedEmp.total_revenue_secured}`} icon={TrendingUp} color="amber" />
          </div>

          {/* Win Rate Chart */}
          <div className="glass-card hover-glow p-6">
            <h3 className="text-sm font-semibold mb-5 text-dark-text">Win Rate vs Company Average</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesBarGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#1e293b', opacity: 0.3 }} />
                  <Bar dataKey="winRate" fill="url(#salesBarGrad)" radius={[8, 8, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Leads Table */}
          <div className="glass-card hover-glow p-6">
            <h3 className="text-sm font-semibold mb-4 text-dark-text">Assigned Leads</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-dark-muted">
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider">Client</th>
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider">Topic</th>
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider">Status</th>
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {activeLeads.map((lead) => (
                    <tr key={lead.lead_id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 text-dark-text font-medium">{lead.client_name}</td>
                      <td className="py-3 text-dark-muted">{lead.topic}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          lead.status === 'Accepted' ? 'bg-emerald-500/10 text-emerald-400'
                          : lead.status === 'Active' ? 'bg-blue-500/10 text-blue-400'
                          : 'bg-red-500/10 text-red-400'
                        }`}>{lead.status}</span>
                      </td>
                      <td className="py-3 text-right text-dark-text font-medium">${parseFloat(lead.estimated_value).toLocaleString()}</td>
                    </tr>
                  ))}
                  {activeLeads.length === 0 && (
                    <tr><td colSpan="4" className="py-8 text-center text-dark-muted text-sm">No leads assigned.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default SalesEvaluation;
