import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Briefcase, ChevronRight, CheckCircle, Clock, DollarSign, AlertTriangle, Activity, PauseCircle } from 'lucide-react';
import StatCard from '../components/StatCard';

const PMEvaluation = () => {
  const { token, logout } = useAuth();
  const [pmData, setPmData] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState(null);
  const [projectHistory, setProjectHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    setError(null);
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/metrics/pm`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => {
        if (res.status === 401 || res.status === 403) { logout(); throw new Error('Unauthorized'); }
        if (!res.ok) throw new Error('Failed to load PM metrics');
        return res.json();
      })
      .then(data => {
        setPmData(data || []);
        if (data && data.length > 0) setSelectedEmp(data[0]);
      }).catch(() => setError('Unable to load PM metrics.'));
  }, [token, logout]);

  useEffect(() => {
    if (selectedEmp) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/employees/${selectedEmp.employee_id}/history`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(res => {
          if (res.status === 401 || res.status === 403) { logout(); throw new Error('Unauthorized'); }
          if (!res.ok) throw new Error('Failed to load history');
          return res.json();
        })
        .then(data => setProjectHistory(data?.projects || data?.history || []))
        .catch(() => setProjectHistory([]));
    }
  }, [selectedEmp, token, logout]);

  const projectStatus = selectedEmp ? [
    { name: 'Completed', value: parseInt(selectedEmp.completed_projects || 0), color: '#10b981' },
    { name: 'On Hold', value: parseInt(selectedEmp.stalled_projects || 0), color: '#f59e0b' },
    { name: 'Active', value: parseInt(selectedEmp.active_projects || 0), color: '#3b82f6' },
  ].filter(s => s.value > 0) : [];

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-dark-card/95 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-3 shadow-2xl">
        <p className="text-sm font-semibold text-dark-text">{payload[0].name}</p>
        <p className="text-xs text-dark-muted">{payload[0].value} project{payload[0].value !== 1 ? 's' : ''}</p>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-dark-text">PM Evaluation</h2>
        <p className="text-dark-muted mt-1 text-sm">Track project execution, milestones, and invoice collection.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* PM Cards */}
        <div className="lg:col-span-1 space-y-2 stagger-children">
          {pmData.map((emp) => (
            <button
              key={emp.employee_id}
              onClick={() => setSelectedEmp(emp)}
              className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                selectedEmp?.employee_id === emp.employee_id
                  ? 'glass-card border-emerald-500/20 shadow-lg shadow-emerald-500/5'
                  : 'bg-dark-card/40 border-white/[0.04] hover:bg-dark-card/70 hover:border-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold ${
                    selectedEmp?.employee_id === emp.employee_id
                      ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25'
                      : 'bg-white/[0.04] text-dark-muted'
                  }`}>
                    {emp.employee_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-dark-text">{emp.employee_name}</p>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-dark-muted">
                      <span>{emp.total_projects_managed} projects</span>
                      <span className="text-emerald-400">{emp.invoice_collection_rate}%</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className={`w-4 h-4 transition-all ${selectedEmp?.employee_id === emp.employee_id ? 'text-emerald-400 translate-x-0.5' : 'text-dark-muted/30'}`} />
              </div>
            </button>
          ))}
        </div>

        {/* Detail View */}
        {selectedEmp && (
        <div className="lg:col-span-2 space-y-5 animate-fade-in">
          {/* Stats */}
          <div className="grid grid-cols-2 xl:grid-cols-5 gap-3 stagger-children">
            <StatCard title="Projects" value={selectedEmp.total_projects_managed} icon={Briefcase} color="primary" />
            <StatCard title="Active" value={selectedEmp.active_projects} icon={Activity} color="primary" />
            <StatCard title="Done" value={selectedEmp.completed_projects} icon={CheckCircle} color="green" />
            <StatCard title="On Hold" value={selectedEmp.stalled_projects} icon={PauseCircle} color="amber" />
            <StatCard title="Collected" value={`${selectedEmp.invoice_collection_rate}%`} icon={DollarSign} color="purple" />
          </div>

          {/* Pie + Revenue */}
          <div className="glass-card hover-glow p-6 flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/2">
              <h3 className="text-sm font-semibold mb-1 text-dark-text">Project Status</h3>
              <p className="text-xs text-dark-muted mb-4">Distribution overview</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={projectStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {projectStatus.map((entry, i) => (
                        <Cell key={`cell-${i}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '12px' }}
                      formatter={(value) => <span className="text-dark-muted ml-1">{value}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="w-full md:w-1/2">
              <div className="glass-card p-5">
                <p className="text-xs text-dark-muted flex items-center gap-1.5 uppercase tracking-wider"><DollarSign className="w-3.5 h-3.5"/>Total Managed</p>
                <p className="text-3xl font-bold text-dark-text mt-2">${parseFloat(selectedEmp.total_revenue_managed).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Project History */}
          <div className="glass-card hover-glow p-6">
            <h3 className="text-sm font-semibold mb-4 text-dark-text">Managed Projects</h3>
            <div className="space-y-2">
              {projectHistory.map((proj) => {
                const isCompleted = proj.status === 'Completed';
                const isHold = proj.status === 'On Hold';
                return (
                  <div key={proj.project_id} className="flex items-center justify-between p-3 bg-white/[0.02] rounded-xl border border-white/[0.04] hover:border-white/[0.08] transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${isCompleted ? 'bg-emerald-500/10 text-emerald-400' : isHold ? 'bg-amber-500/10 text-amber-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {isCompleted ? <CheckCircle className="w-4 h-4" /> : isHold ? <AlertTriangle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-dark-text">{proj.topic}</p>
                        <p className="text-[11px] text-dark-muted">${parseFloat(proj.estimated_value).toLocaleString()}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                      isCompleted ? 'bg-emerald-500/10 text-emerald-400'
                      : isHold ? 'bg-amber-500/10 text-amber-400'
                      : 'bg-blue-500/10 text-blue-400'
                    }`}>{proj.status}</span>
                  </div>
                );
              })}
              {projectHistory.length === 0 && (
                <p className="text-center text-dark-muted py-8 text-sm">No projects assigned.</p>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default PMEvaluation;
