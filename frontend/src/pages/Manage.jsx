import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, UserPlus, Building2, Target, FileText, Link2, CheckCircle, AlertCircle, Phone, FolderKanban, Users, Receipt, Trash2, Factory } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API = `${API_BASE}/manage`;

const Toast = ({ message, type, onClose }) => {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border shadow-2xl backdrop-blur-xl animate-slide-up ${
      type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
    }`}>
      {type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
      <span className="font-medium text-sm">{message}</span>
    </div>
  );
};

const Field = ({ label, children }) => (
  <div>
    <label className="block text-[11px] font-semibold text-dark-muted uppercase tracking-wider mb-1.5">{label}</label>
    {children}
  </div>
);

const inputClass = "w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-2.5 text-dark-text placeholder-dark-muted/40 focus:outline-none focus:border-primary-500/40 focus:ring-1 focus:ring-primary-500/20 transition-all text-sm";
const selectClass = inputClass + " focus:bg-dark-bg [&>option]:bg-dark-bg [&>option]:text-dark-text ";
const btnClass = "w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 active:scale-[0.98] shadow-lg shadow-blue-500/20 text-sm";

const Manage = () => {
  const { user, token, logout } = useAuth();
  const isAdmin = user?.system_roles?.includes('Admin');
  const [toast, setToast] = useState(null);
  const [activeTab, setActiveTab] = useState(isAdmin ? 'employee' : 'client');
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [employees, setEmployees] = useState([]);
  const [clients, setClients] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [leads, setLeads] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);

  const [empForm, setEmpForm] = useState({ full_name: '', email: '', password: '', system_roles: ['Sales Lead'] });
  const [clientForm, setClientForm] = useState({ client_name: '' });
  const [industryForm, setIndustryForm] = useState({ area_name: '' });
  const [contactForm, setContactForm] = useState({ client_id: '', contact_name: '', email: '', phone_no: '' });
  const [leadForm, setLeadForm] = useState({ client_name: '', contact_name: '', contact_email: '', contact_phone: '', area_id: '', topic: '', estimated_value: '' });
  const [assignForm, setAssignForm] = useState({ lead_id: '', employee_id: '', assignment_role: 'Sales Lead' });
  const [proposalForm, setProposalForm] = useState({ lead_id: '', status: 'In Proposal' });
  const [projectForm, setProjectForm] = useState({ proposal_id: '', status: 'Kickoff' });
  const [assignProjForm, setAssignProjForm] = useState({ project_id: '', employee_id: '', assignment_role: 'Project Manager' });
  const [invoiceForm, setInvoiceForm] = useState({ project_id: '', milestone_name: '', milestone_order: '', amount: '', status: 'Pending' });

  const refreshLookups = () => {
    if (!token) return;
    const headers = { 'Authorization': `Bearer ${token}` };
    setFetchError(null);
    fetch(`${API}/lookups`, { headers })
      .then(async r => {
        if (r.status === 401 || r.status === 403) { logout(); throw new Error('Unauthorized'); }
        if (!r.ok) throw new Error('Failed to load data');
        return r.json();
      })
      .then(data => {
        setEmployees(data.employees || []);
        setClients(data.clients || []);
        setContacts(data.contacts || []);
        setIndustries(data.industries || []);
        setLeads(data.leads || []);
        setProposals(data.proposals || []);
        setProjects(data.projects || []);
        setInvoices(data.invoices || []);
      })
      .catch(err => { if (err.message !== 'Unauthorized') setFetchError(err.message); })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { refreshLookups(); }, [token]);

  const post = async (endpoint, body, resetFn) => {
    try {
      const res = await fetch(`${API}/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(body),
      });
      if (res.status === 401 || res.status === 403) return logout();
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Request failed'); }
      setToast({ message: `Created successfully!`, type: 'success' });
      resetFn();
      refreshLookups();
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
  };

  const updateProjectStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/projects/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.status === 401 || res.status === 403) return logout();
      if (!res.ok) throw new Error('Failed to update project status');
      setToast({ message: 'Project status updated', type: 'success' });
      refreshLookups();
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
  };

  const updateInvoiceStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/invoices/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.status === 401 || res.status === 403) return logout();
      if (!res.ok) throw new Error('Failed to update invoice status');
      setToast({ message: 'Invoice status updated', type: 'success' });
      refreshLookups();
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
  };

  const toggleEmployee = async (id) => {
    try {
      const res = await fetch(`${API}/employees/${id}/toggle-active`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.status === 401 || res.status === 403) return logout();
      if (!res.ok) throw new Error('Failed to toggle status');
      refreshLookups();
      setToast({ message: 'Employee status updated', type: 'success' });
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to remove this employee? This action cannot be undone.')) return;
    try {
      const res = await fetch(`${API}/employees/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      if (res.status === 401 || res.status === 403) return logout();
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete employee');
      refreshLookups();
      setToast({ 
        message: data.message || 'Employee removed successfully', 
        type: data.softDeleted ? 'warning' : 'success' 
      });
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
  };

  const updateProposalStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/proposals/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.status === 401 || res.status === 403) return logout();
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to update proposal status'); }
      setToast({ message: 'Proposal status updated', type: 'success' });
      refreshLookups();
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
  };

  const updateLeadStatus = async (id, status) => {
    try {
      const res = await fetch(`${API}/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ status })
      });
      if (res.status === 401 || res.status === 403) return logout();
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || 'Failed to update lead status'); }
      setToast({ message: 'Lead status updated', type: 'success' });
      refreshLookups();
    } catch (err) { setToast({ message: err.message, type: 'error' }); }
  };

  const wonProposals = proposals.filter(p => p.status === 'Won' && !projects.some(proj => proj.proposal_id === p.id));
  const leadsWithoutProposals = leads.filter(l => !proposals.some(p => p.lead_id === l.id));

  // Valid transitions for the lead status dropdown
  const LEAD_TRANSITIONS = {
    'Active': ['Active', 'Accepted', 'Rejected', 'Nurture', 'Cancelled'],
    'Nurture': ['Nurture', 'Active', 'Cancelled'],
    'Accepted': ['Accepted'],
    'Rejected': ['Rejected'],
    'Cancelled': ['Cancelled'],
  };

  // Valid transitions for the project status dropdown
  const PROJECT_TRANSITIONS = {
    'Kickoff': ['Kickoff', 'In Progress'],
    'In Progress': ['In Progress', 'Completed', 'On Hold'],
    'On Hold': ['On Hold', 'In Progress'],
    'Completed': ['Completed'],
  };

  // Valid transitions for the proposal status dropdown
  const PROPOSAL_TRANSITIONS = {
    'In Proposal': ['In Proposal', 'Submitted', 'Cancelled'],
    'Submitted': ['Submitted', 'Won', 'Lost', 'Cancelled'],
    'Won': ['Won'],
    'Lost': ['Lost'],
    'Cancelled': ['Cancelled'],
  };

  const tabs = [
    { id: 'employee', label: 'Employee', icon: UserPlus },
    { id: 'client', label: 'Client', icon: Building2 },
    { id: 'contact', label: 'Contact', icon: Phone },
    { id: 'industry', label: 'Industry', icon: Factory },
    { id: 'lead', label: 'Lead', icon: Target },
    { id: 'assign', label: 'Assign Lead', icon: Link2 },
    { id: 'proposal', label: 'Proposal', icon: FileText },
    { id: 'project', label: 'Project', icon: FolderKanban },
    { id: 'assign-project', label: 'Assign PM', icon: Users },
    { id: 'invoice', label: 'Invoice', icon: Receipt },
  ].filter(t => isAdmin || t.id !== 'employee');



  return (
    <div className="space-y-8 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : fetchError ? (
        <div className="glass-card p-8 text-center">
          <AlertCircle className="w-10 h-10 text-red-400 mx-auto mb-3" />
          <p className="text-dark-text font-semibold">Failed to load data</p>
          <p className="text-dark-muted text-sm mt-1">{fetchError}</p>
          <button onClick={refreshLookups} className="mt-4 px-4 py-2 bg-primary-500/10 text-primary-400 rounded-lg text-sm font-medium hover:bg-primary-500/20 transition-colors">Retry</button>
        </div>
      ) : (
        <>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-dark-text">Manage Data</h2>
            <p className="text-dark-muted mt-1 text-sm">Add employees, clients, contacts, leads, and proposals.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                      : 'bg-white/[0.02] text-dark-muted border border-white/[0.04] hover:bg-white/[0.04] hover:text-dark-text'
                  }`}>
                  <Icon className="w-4 h-4" />{tab.label}
                </button>
              );
            })}
          </div>

          <div className="glass-card hover-glow p-8 max-w-xl">

        {isAdmin && activeTab === 'employee' && (
          <form onSubmit={e => { e.preventDefault(); post('employees', empForm, () => setEmpForm({ full_name: '', email: '', password: '', system_roles: ['Sales Lead'] })); }} className="space-y-5">
            <h3 className="text-lg font-semibold flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary-500" /> Add Employee</h3>
            <Field label="Full Name"><input className={inputClass} placeholder="e.g. Jane Doe" value={empForm.full_name} onChange={e => setEmpForm({...empForm, full_name: e.target.value})} required /></Field>
            <Field label="Email"><input className={inputClass} type="email" placeholder="jane@nexuscrm.com" value={empForm.email} onChange={e => setEmpForm({...empForm, email: e.target.value})} required /></Field>
            <Field label="Password (min 8 chars)"><input className={inputClass} type="password" placeholder="Min. 8 characters" value={empForm.password} onChange={e => setEmpForm({...empForm, password: e.target.value})} required minLength={8} /></Field>
            <Field label="System Roles">
              <div className="flex flex-wrap gap-3 mt-2">
                {['Admin', 'Sales Lead', 'Project Manager', 'Tech Lead', 'Account Manager', 'Finance'].map(r => (
                  <label key={r} className="flex items-center gap-2 text-sm text-dark-text cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-white/[0.1] bg-white/[0.05] text-primary-500 focus:ring-primary-500/50 focus:ring-offset-dark-bg focus:ring-offset-2" 
                           checked={empForm.system_roles.includes(r)}
                           onChange={e => {
                             if (e.target.checked) setEmpForm({...empForm, system_roles: [...empForm.system_roles, r]});
                             else setEmpForm({...empForm, system_roles: empForm.system_roles.filter(role => role !== r)});
                           }}
                    />
                    {r}
                  </label>
                ))}
              </div>
            </Field>
            <button type="submit" className={btnClass}><Plus className="w-4 h-4" /> Add Employee</button>
          </form>
        )}

        {activeTab === 'client' && (
          <form onSubmit={e => { e.preventDefault(); post('clients', clientForm, () => setClientForm({ client_name: '' })); }} className="space-y-5">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Building2 className="w-5 h-5 text-primary-500" /> Add Client</h3>
            <Field label="Client Name"><input className={inputClass} placeholder="e.g. Acme Corp" value={clientForm.client_name} onChange={e => setClientForm({...clientForm, client_name: e.target.value})} required /></Field>
            <button type="submit" className={btnClass}><Plus className="w-4 h-4" /> Add Client</button>
          </form>
        )}

        {activeTab === 'industry' && (
          <form onSubmit={e => { e.preventDefault(); post('industries', industryForm, () => setIndustryForm({ area_name: '' })); }} className="space-y-5">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Factory className="w-5 h-5 text-primary-500" /> Add Industry Area</h3>
            <Field label="Industry Name"><input className={inputClass} placeholder="e.g. Healthcare, Finance" value={industryForm.area_name} onChange={e => setIndustryForm({...industryForm, area_name: e.target.value})} required /></Field>
            <button type="submit" className={btnClass}><Plus className="w-4 h-4" /> Add Industry</button>
          </form>
        )}

        {activeTab === 'contact' && (
          <form onSubmit={e => { e.preventDefault(); post('contacts', contactForm, () => setContactForm({ client_id: '', contact_name: '', email: '', phone_no: '' })); }} className="space-y-5">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Phone className="w-5 h-5 text-primary-500" /> Add Client Contact</h3>
            <Field label="Client">
              <select className={selectClass} value={contactForm.client_id} onChange={e => setContactForm({...contactForm, client_id: e.target.value})} required>
                <option value="">— Select Client —</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.client_name}</option>)}
              </select>
            </Field>
            <Field label="Contact Name"><input className={inputClass} placeholder="e.g. John Smith" value={contactForm.contact_name} onChange={e => setContactForm({...contactForm, contact_name: e.target.value})} required /></Field>
            <Field label="Email"><input className={inputClass} type="email" placeholder="john@acme.com" value={contactForm.email} onChange={e => setContactForm({...contactForm, email: e.target.value})} required /></Field>
            <Field label="Phone"><input className={inputClass} placeholder="+1-555-0123" value={contactForm.phone_no} onChange={e => setContactForm({...contactForm, phone_no: e.target.value})} required /></Field>
            <button type="submit" className={btnClass}><Plus className="w-4 h-4" /> Add Contact</button>
          </form>
        )}

        {activeTab === 'lead' && (
          <>
          <form onSubmit={e => { e.preventDefault(); post('leads', { ...leadForm, estimated_value: parseFloat(leadForm.estimated_value) || 0 }, () => setLeadForm({ client_name: '', contact_name: '', contact_email: '', contact_phone: '', area_id: '', topic: '', estimated_value: '' })); }} className="space-y-5">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Target className="w-5 h-5 text-primary-500" /> Add Lead</h3>
            <Field label="Client Name">
              <input className={inputClass} placeholder="e.g. Acme Corp" value={leadForm.client_name} onChange={e => setLeadForm({...leadForm, client_name: e.target.value})} required />
            </Field>
            <div className="border border-dark-border rounded-lg p-4 space-y-4">
              <p className="text-sm font-medium text-dark-muted">Contact Person</p>
              <Field label="Contact Name">
                <input className={inputClass} placeholder="e.g. John Smith" value={leadForm.contact_name} onChange={e => setLeadForm({...leadForm, contact_name: e.target.value})} required />
              </Field>
              <Field label="Contact Email">
                <input className={inputClass} type="email" placeholder="john@acme.com" value={leadForm.contact_email} onChange={e => setLeadForm({...leadForm, contact_email: e.target.value})} required />
              </Field>
              <Field label="Contact Phone">
                <input className={inputClass} placeholder="+1-555-0123" value={leadForm.contact_phone} onChange={e => setLeadForm({...leadForm, contact_phone: e.target.value})} required />
              </Field>
            </div>
            <Field label="Industry Area">
              <select className={selectClass} value={leadForm.area_id} onChange={e => setLeadForm({...leadForm, area_id: e.target.value})} required>
                <option value="">— Select Industry —</option>
                {industries.map(i => <option key={i.id} value={i.id}>{i.area_name}</option>)}
              </select>
            </Field>
            <Field label="Topic"><input className={inputClass} placeholder="e.g. ERP Migration" value={leadForm.topic} onChange={e => setLeadForm({...leadForm, topic: e.target.value})} required /></Field>
            <Field label="Estimated Value ($)"><input className={inputClass} type="number" min="0" step="0.01" placeholder="250000" value={leadForm.estimated_value} onChange={e => setLeadForm({...leadForm, estimated_value: e.target.value})} required /></Field>

            <button type="submit" className={btnClass}><Plus className="w-4 h-4" /> Add Lead</button>
          </form>

          {/* Existing Leads */}
          <div className="glass-card hover-glow p-6 mt-6">
            <h3 className="text-base font-semibold mb-4 text-dark-text">All Leads</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-dark-muted">
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider">Topic</th>
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider">Client</th>
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {leads.map(l => (
                    <tr key={l.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 text-dark-text font-medium">{l.topic}</td>
                      <td className="py-3 text-dark-muted">{l.client_name}</td>
                      <td className="py-3">
                        <select 
                          className="bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1 text-xs text-dark-text focus:outline-none focus:border-primary-500/50 focus:bg-dark-bg [&>option]:bg-dark-bg [&>option]:text-dark-text"
                          value={l.status}
                          onChange={(e) => updateLeadStatus(l.id, e.target.value)}
                        >
                          {(LEAD_TRANSITIONS[l.status] || [l.status]).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {leads.length === 0 && <p className="text-center text-dark-muted py-4 text-sm">No leads yet.</p>}
            </div>
          </div>
          </>
        )}

        {activeTab === 'assign' && (
          <form onSubmit={e => { e.preventDefault(); post('assign-lead', assignForm, () => setAssignForm({ lead_id: '', employee_id: '', assignment_role: 'Sales Lead' })); }} className="space-y-5">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Link2 className="w-5 h-5 text-primary-500" /> Assign Lead</h3>
            <Field label="Lead">
              <select className={selectClass} value={assignForm.lead_id} onChange={e => setAssignForm({...assignForm, lead_id: e.target.value})} required>
                <option value="">— Select Lead —</option>
                {leads.map(l => <option key={l.id} value={l.id}>{l.topic} — {l.client_name} (${parseFloat(l.estimated_value).toLocaleString()})</option>)}
              </select>
            </Field>
            <Field label="Employee">
              <select className={selectClass} value={assignForm.employee_id} onChange={e => setAssignForm({...assignForm, employee_id: e.target.value})} required>
                <option value="">— Select Employee —</option>
                {employees.filter(e => e.is_active).map(emp => <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.system_roles?.join(', ')})</option>)}
              </select>
            </Field>
            <Field label="Assignment Role">
              <select className={selectClass} value={assignForm.assignment_role} onChange={e => setAssignForm({...assignForm, assignment_role: e.target.value})}>
                <option value="Sales Lead">Sales Lead</option>
                <option value="Project Manager">Project Manager</option>
                <option value="Tech Lead">Tech Lead</option>
                <option value="Account Manager">Account Manager</option>
              </select>
            </Field>
            <button type="submit" className={btnClass}><Plus className="w-4 h-4" /> Assign</button>
          </form>
        )}

        {activeTab === 'proposal' && (
          <>
          <form onSubmit={e => { e.preventDefault(); post('proposals', proposalForm, () => setProposalForm({ lead_id: '', status: 'In Proposal' })); }} className="space-y-5">
            <h3 className="text-lg font-semibold flex items-center gap-2"><FileText className="w-5 h-5 text-primary-500" /> Add Proposal</h3>
            <Field label="Lead">
              <select className={selectClass} value={proposalForm.lead_id} onChange={e => setProposalForm({...proposalForm, lead_id: e.target.value})} required>
                <option value="">— Select Lead —</option>
                {leadsWithoutProposals.map(l => <option key={l.id} value={l.id}>{l.topic} — {l.client_name}</option>)}
              </select>
            </Field>

            <button type="submit" className={btnClass}><Plus className="w-4 h-4" /> Add Proposal</button>
          </form>

          {/* Existing Proposals */}
          <div className="glass-card hover-glow p-6 mt-6">
            <h3 className="text-base font-semibold mb-4 text-dark-text">All Proposals</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-dark-muted">
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider">Lead</th>
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider">Client</th>
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {proposals.map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 text-dark-text font-medium">{p.topic}</td>
                      <td className="py-3 text-dark-muted">{p.client_name}</td>
                      <td className="py-3">
                        <select 
                          className="bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1 text-xs text-dark-text focus:outline-none focus:border-primary-500/50 focus:bg-dark-bg [&>option]:bg-dark-bg [&>option]:text-dark-text"
                          value={p.status}
                          onChange={(e) => updateProposalStatus(p.id, e.target.value)}
                        >
                          {(PROPOSAL_TRANSITIONS[p.status] || [p.status]).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {proposals.length === 0 && <p className="text-center text-dark-muted py-4 text-sm">No proposals yet.</p>}
            </div>
          </div>
          </>
        )}

        {activeTab === 'project' && (
          <>
          <form onSubmit={e => { e.preventDefault(); post('projects', projectForm, () => setProjectForm({ proposal_id: '', status: 'Kickoff' })); }} className="space-y-5">
            <h3 className="text-lg font-semibold flex items-center gap-2"><FolderKanban className="w-5 h-5 text-primary-500" /> Create Project</h3>
            <Field label="Won Proposal">
              <select className={selectClass} value={projectForm.proposal_id} onChange={e => setProjectForm({...projectForm, proposal_id: e.target.value})} required>
                <option value="">— Select Won Proposal —</option>
                {wonProposals.map(p => <option key={p.id} value={p.id}>{p.topic} — {p.client_name}</option>)}
              </select>
            </Field>
            <Field label="Initial Status">
              <select className={selectClass} value={projectForm.status} onChange={e => setProjectForm({...projectForm, status: e.target.value})}>
                <option value="Kickoff">Kickoff</option>
                <option value="In Progress">In Progress</option>
              </select>
            </Field>

            <button type="submit" className={btnClass}><Plus className="w-4 h-4" /> Create Project</button>
          </form>
          
          <div className="mt-8 border-t border-white/[0.06] pt-8">
            <h3 className="text-base font-semibold mb-5 text-dark-text">Recent Projects</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-dark-muted">
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider">Project Topic</th>
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider">Client</th>
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider">Value</th>
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {projects.map(p => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 text-dark-text font-medium">{p.topic}</td>
                      <td className="py-3 text-dark-muted">{p.client_name}</td>
                      <td className="py-3 text-dark-muted">${(parseFloat(p.estimated_value) || 0).toLocaleString()}</td>
                      <td className="py-3">
                        <select 
                          className="bg-white/[0.04] border border-white/[0.08] rounded-md px-2 py-1 text-xs text-dark-text focus:outline-none focus:border-primary-500/50 focus:bg-dark-bg [&>option]:bg-dark-bg [&>option]:text-dark-text "
                          value={p.status}
                          onChange={(e) => updateProjectStatus(p.id, e.target.value)}
                        >
                          {(PROJECT_TRANSITIONS[p.status] || [p.status]).map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {projects.length === 0 && <p className="text-center text-dark-muted py-4 text-sm">No projects found.</p>}
            </div>
          </div>
          </>
        )}

        {activeTab === 'assign-project' && (
          <form onSubmit={e => { e.preventDefault(); post('assign-project', assignProjForm, () => setAssignProjForm({ project_id: '', employee_id: '', assignment_role: 'Project Manager' })); }} className="space-y-5">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Users className="w-5 h-5 text-primary-500" /> Assign Project to PM</h3>
            <Field label="Project">
              <select className={selectClass} value={assignProjForm.project_id} onChange={e => setAssignProjForm({...assignProjForm, project_id: e.target.value})} required>
                <option value="">— Select Project —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.topic} — {p.client_name} ({p.status})</option>)}
              </select>
            </Field>
            <Field label="Employee">
              <select className={selectClass} value={assignProjForm.employee_id} onChange={e => setAssignProjForm({...assignProjForm, employee_id: e.target.value})} required>
                <option value="">— Select Employee —</option>
                {employees.filter(e => e.is_active).map(emp => <option key={emp.id} value={emp.id}>{emp.full_name} ({emp.system_roles?.join(', ')})</option>)}
              </select>
            </Field>
            <Field label="Assignment Role">
              <select className={selectClass} value={assignProjForm.assignment_role} onChange={e => setAssignProjForm({...assignProjForm, assignment_role: e.target.value})}>
                <option value="Project Manager">Project Manager</option>
                <option value="Tech Lead">Tech Lead</option>
                <option value="Account Manager">Account Manager</option>
              </select>
            </Field>
            <button type="submit" className={btnClass}><Plus className="w-4 h-4" /> Assign</button>
          </form>
        )}

        {activeTab === 'invoice' && (
          <>
          <form onSubmit={e => { e.preventDefault(); post('invoices', { ...invoiceForm, milestone_order: parseInt(invoiceForm.milestone_order), amount: parseFloat(invoiceForm.amount) }, () => setInvoiceForm({ project_id: '', milestone_name: '', milestone_order: '', amount: '', status: 'Pending' })); }} className="space-y-5">
            <h3 className="text-lg font-semibold flex items-center gap-2"><Receipt className="w-5 h-5 text-primary-500" /> Add Invoice Milestone</h3>
            <Field label="Project">
              <select className={selectClass} value={invoiceForm.project_id} onChange={e => setInvoiceForm({...invoiceForm, project_id: e.target.value})} required>
                <option value="">— Select Project —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.topic} — {p.client_name}</option>)}
              </select>
            </Field>
            <Field label="Milestone Name"><input className={inputClass} placeholder="e.g. Requirements Sign-off" value={invoiceForm.milestone_name} onChange={e => setInvoiceForm({...invoiceForm, milestone_name: e.target.value})} required /></Field>
            <Field label="Milestone Order"><input className={inputClass} type="number" min="1" placeholder="1" value={invoiceForm.milestone_order} onChange={e => setInvoiceForm({...invoiceForm, milestone_order: e.target.value})} required /></Field>
            <Field label="Amount ($)"><input className={inputClass} type="number" min="0.01" step="0.01" placeholder="75000" value={invoiceForm.amount} onChange={e => setInvoiceForm({...invoiceForm, amount: e.target.value})} required /></Field>
            <Field label="Status">
              <select className={selectClass} value={invoiceForm.status} onChange={e => setInvoiceForm({...invoiceForm, status: e.target.value})}>
                <option value="Pending">Pending</option>
                <option value="Invoiced">Invoiced</option>
                <option value="Paid">Paid</option>
              </select>
            </Field>
            <button type="submit" className={btnClass}><Plus className="w-4 h-4" /> Add Invoice</button>
          </form>

          <div className="mt-8 border-t border-white/[0.06] pt-8">
            <h3 className="text-base font-semibold mb-5 text-dark-text">Invoice Tracker</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06] text-dark-muted">
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider">Project</th>
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider">Milestone</th>
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider">Amount</th>
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider">Status</th>
                    <th className="pb-3 font-medium text-xs uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {invoices.map(i => (
                    <tr key={i.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 text-dark-text font-medium">{i.project_name}</td>
                      <td className="py-3 text-dark-muted">{i.milestone_name} (Phase {i.milestone_order})</td>
                      <td className="py-3 text-emerald-400 font-medium">${(parseFloat(i.amount) || 0).toLocaleString()}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded-md text-[11px] font-medium ${
                          i.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400'
                          : i.status === 'Invoiced' ? 'bg-blue-500/10 text-blue-400'
                          : i.status === 'Cancelled' ? 'bg-red-500/10 text-red-400'
                          : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          {i.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {i.status !== 'Paid' && i.status !== 'Cancelled' && (
                          <button 
                            onClick={() => updateInvoiceStatus(i.id, 'Paid')}
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border border-emerald-500/20"
                          >
                            Mark Paid
                          </button>
                        )}
                        {i.status === 'Pending' && (
                          <button 
                            onClick={() => updateInvoiceStatus(i.id, 'Invoiced')}
                            className="ml-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors border border-blue-500/20"
                          >
                            Send Invoice
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {invoices.length === 0 && <p className="text-center text-dark-muted py-4 text-sm">No invoices found.</p>}
            </div>
          </div>
          </>
        )}
          </div>

          {/* Recent Employees Table */}
          {isAdmin && (
          <div className="glass-card hover-glow p-6">
        <h3 className="text-base font-semibold mb-5 text-dark-text">All Employees</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-dark-muted">
                <th className="pb-3 font-medium text-xs uppercase tracking-wider">Name</th>
                <th className="pb-3 font-medium text-xs uppercase tracking-wider">Email</th>
                <th className="pb-3 font-medium text-xs uppercase tracking-wider">Role</th>
                <th className="pb-3 font-medium text-xs uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {employees.map(emp => (
                <tr key={emp.id} className={`hover:bg-white/[0.02] transition-colors ${!emp.is_active ? 'opacity-50' : ''}`}>
                  <td className={`py-3 font-medium ${!emp.is_active ? 'text-dark-muted line-through' : 'text-dark-text'}`}>{emp.full_name}</td>
                  <td className="py-3 text-dark-muted">{emp.email}</td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {emp.system_roles?.map(role => (
                        <span key={role} className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
                          role === 'Sales Lead' ? 'bg-blue-500/10 text-blue-400'
                          : role === 'Project Manager' ? 'bg-emerald-500/10 text-emerald-400'
                          : role === 'Admin' ? 'bg-violet-500/10 text-violet-400'
                          : 'bg-gray-500/10 text-gray-400'
                        }`}>{role}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleEmployee(emp.id)} className="flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-white/[0.05] transition-colors border border-transparent hover:border-white/[0.1]" title="Toggle Active Status">
                        <div className={`w-1.5 h-1.5 rounded-full ${emp.is_active ? 'bg-emerald-400 shadow-lg shadow-emerald-400/30' : 'bg-red-400'}`} />
                        <span className="text-xs text-dark-muted">{emp.is_active ? 'Active' : 'Inactive'}</span>
                      </button>
                      <button onClick={() => deleteEmployee(emp.id)} className="p-1 rounded-md text-dark-muted hover:text-red-400 hover:bg-red-400/10 transition-colors" title="Remove Employee">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      )}
      </>)}
    </div>
  );
};

export default Manage;
