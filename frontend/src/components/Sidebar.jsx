import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, TrendingUp, Briefcase, PlusCircle, Zap, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { name: 'Overview', path: '/overview', icon: LayoutDashboard },
    { name: 'Sales Evaluation', path: '/sales', icon: TrendingUp },
    { name: 'PM Evaluation', path: '/pm', icon: Briefcase },
    { name: 'Manage Data', path: '/manage', icon: PlusCircle },
  ];

  return (
    <aside className="w-[260px] bg-dark-card/50 backdrop-blur-xl border-r border-white/[0.04] flex flex-col relative">
      {/* Subtle gradient accent */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary-500/30 to-transparent" />

      {/* Logo */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-dark-text tracking-tight">NEXUS</h1>
            <p className="text-[10px] text-dark-muted uppercase tracking-[0.2em] -mt-0.5">CRM Dashboard</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        <p className="px-3 pb-2 text-[10px] font-semibold text-dark-muted uppercase tracking-[0.15em]">Navigation</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                isActive
                  ? 'bg-primary-500/10 text-primary-400'
                  : 'text-dark-muted hover:bg-white/[0.03] hover:text-dark-text'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-500 rounded-r-full" />
              )}
              <Icon className={`w-[18px] h-[18px] transition-all duration-200 ${isActive ? 'text-primary-400' : 'group-hover:text-dark-text'}`} strokeWidth={isActive ? 2 : 1.5} />
              <span className={`text-sm ${isActive ? 'font-semibold' : 'font-medium'}`}>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom user section */}
      {user && (
      <div className="p-3 border-t border-white/[0.04]">
        <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-white/[0.03] transition-colors group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-lg shadow-purple-500/20">
            {user.full_name ? user.full_name.split(' ').map(n => n[0]).join('').substring(0, 2) : 'U'}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-dark-text truncate">{user.full_name}</p>
            <p className="text-[11px] text-dark-muted truncate">{user.system_roles?.join(', ')}</p>
          </div>
          <LogOut className="w-4 h-4 text-dark-muted group-hover:text-red-400 transition-colors" />
        </button>
      </div>
      )}
    </aside>
  );
};

export default Sidebar;
