import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {  Activity, ArrowUpRight, Bell, BriefcaseBusiness, CalendarDays, CheckCircle2, ChevronDown, CircleHelp, ClipboardList,Eye, EyeOff, GraduationCap, LayoutDashboard, Search, Settings, SlidersHorizontal, Sparkles, Target, Users, X } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function App() {
  const [token, setToken] = useState(() => sessionStorage.getItem('cc_token') || '');
  const [user, setUser] = useState(() => { try { return JSON.parse(sessionStorage.getItem('cc_user') || 'null'); } catch { return null; } });
  const [authMode, setAuthMode] = useState('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [tab, setTab] = useState('Overview');
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalJob, setModalJob] = useState(null);
  const name = user?.name || '';
  const email = user?.email || '';
  const isAdmin = user?.role === 'admin';
  const [notice, setNotice] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingJobId, setEditingJobId] = useState(null);
  const [applicantsJob, setApplicantsJob] = useState(null);
  const [newJob, setNewJob] = useState({ company: '', title: '', type: 'Full-time', location: 'Noida', package: '', skills: '', deadline: '', description: '' });
  const [showPassword, setShowPassword] = useState(false);
  
  async function loadData() {
    setLoading(true); setError('');
    try {
      const [jobRes, appRes] = await Promise.all([
        fetch(`${API}/jobs`),
        fetch(`${API}/applications`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      if (appRes.status === 401) { logout(); return; }
      if (!jobRes.ok || !appRes.ok) throw new Error('API request failed');
      setJobs(await jobRes.json()); setApplications(await appRes.json());
    } catch { setError('Could not connect to the API. Start the server in the /server folder, then refresh.'); }
    finally { setLoading(false); }
  }
  useEffect(() => { if (token && user) loadData(); else setLoading(false); }, [token, user?.id]);

  function logout() {
    sessionStorage.removeItem('cc_token');
    sessionStorage.removeItem('cc_user');
    setToken(''); setUser(null); setJobs([]); setApplications([]);
    setModalJob(null); setShowAdd(false); setEditingJobId(null); setApplicantsJob(null); setNotice(''); setError('');
  }

  async function submitAuth(e) {
    e.preventDefault(); setAuthBusy(true); setError(''); setNotice('');
    try {
      const payload = authMode === 'register'
        ? { name: authName, email: authEmail, password: authPassword }
        : { email: authEmail, password: authPassword };
      const res = await fetch(`${API}/auth/${authMode}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Authentication failed.');
      if (authMode === 'register') {
        setAuthMode('login'); setAuthPassword(''); setNotice('Account created. Please log in.');
      } else {
        sessionStorage.setItem('cc_token', result.token);
        sessionStorage.setItem('cc_user', JSON.stringify(result.user));
        setToken(result.token); setUser(result.user); setTab('Overview'); setAuthPassword('');
        setNotice(`Welcome, ${result.user.name}!`);
      }
    } catch (err) { setError(err.message); }
    finally { setAuthBusy(false); }
  }

  const filteredJobs = useMemo(() => jobs.filter(j => `${j.title} ${j.company} ${j.location} ${(j.skills || []).join(' ')}`.toLowerCase().includes(search.toLowerCase())), [jobs, search]);
  const activeApps = applications.filter(a => !['Offer', 'Rejected'].includes(a.status)).length;
  const interviews = applications.filter(a => a.status === 'Interview').length;
  const offers = applications.filter(a => a.status === 'Offer').length;
  const navItems = [{ name: 'Overview', icon: LayoutDashboard }, { name: 'Find opportunities', icon: BriefcaseBusiness }, { name: 'My applications', icon: ClipboardList }];

  async function applyToJob(e) {
    e.preventDefault();
    try {
      const res = await fetch(`${API}/applications`, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ jobId: modalJob.id }) });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Could not apply');
      setNotice('Application submitted successfully.'); setModalJob(null); await loadData();
    } catch (err) { setNotice(err.message); }
  }
  function openEditJob(job) {
    setNewJob({
      company: job.company || '', title: job.title || '', type: job.type || 'Full-time',
      location: job.location || '', package: job.package || '',
      skills: (job.skills || []).join(', '), deadline: job.deadline || '',
      description: job.description || ''
    });
    setEditingJobId(job.id);
    setShowAdd(true);
  }

  function closeJobEditor() {
    setShowAdd(false);
    setEditingJobId(null);
    setNewJob({ company: '', title: '', type: 'Full-time', location: 'Noida', package: '', skills: '', deadline: '', description: '' });
  }

  async function addJob(e) {
    e.preventDefault();
    try {
      const isEditing = Boolean(editingJobId);
      const res = await fetch(`${API}/jobs${isEditing ? `/${encodeURIComponent(editingJobId)}` : ''}`, {
        method: isEditing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...newJob, skills: newJob.skills.split(',').map(s => s.trim()).filter(Boolean) })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || (isEditing ? 'Could not update listing' : 'Could not create listing'));
      closeJobEditor();
      setNotice(isEditing ? 'Opportunity updated successfully.' : 'Opportunity added.');
      await loadData();
    } catch (err) { setNotice(err.message); }
  }
  async function updateStatus(id, status) {
    try { const res = await fetch(`${API}/applications/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ status }) }); if (!res.ok) throw new Error('Status update failed'); await loadData(); }
    catch (err) { setNotice(err.message); }
  }

  if (!token || !user) {
    return (
      <div className="auth-page">
        <div className="auth-glow auth-glow-one" />
        <div className="auth-glow auth-glow-two" />
        <main className="auth-layout">
          <section className="auth-showcase">
            <div className="auth-brand">
              <div className="brand-mark"><GraduationCap size={24} /></div>
              <div><strong>CareerConnect</strong><span>STUDENT PORTAL</span></div>
            </div>
            <div className="showcase-copy">
              <div className="showcase-kicker"><Sparkles size={14} /> YOUR NEXT CHAPTER STARTS HERE</div>
              <h1>Your career journey <span>starts here.</span></h1>
              <p>Discover opportunities, apply to jobs, and keep your placement journey moving forward — all in one place.</p>
              <div className="showcase-features">
                <div className="showcase-feature"><span><BriefcaseBusiness size={18} /></span><div><strong>Explore opportunities</strong><small>Find internships and full-time roles</small></div></div>
                <div className="showcase-feature"><span><ClipboardList size={18} /></span><div><strong>Track applications</strong><small>Keep up with every next step</small></div></div>
                <div className="showcase-feature"><span><Activity size={18} /></span><div><strong>Build your future</strong><small>Turn your goals into progress</small></div></div>
              </div>
            </div>
            <div className="auth-quote"><span className="quote-mark">“</span><p>Small steps today can lead to big opportunities tomorrow.</p></div>
            <div className="showcase-decoration"><div className="deco-ring ring-one" /><div className="deco-ring ring-two" /><div className="deco-cap"><GraduationCap size={68} /></div><div className="deco-chip"><CheckCircle2 size={15} /> Your future, in progress</div></div>
          </section>
          <section className="auth-form-panel">
            <div className="auth-mobile-brand"><div className="brand-mark"><GraduationCap size={22} /></div><div><strong>CareerConnect</strong><span>STUDENT PORTAL</span></div></div>
            <div className="auth-form-wrap">
              <div className="auth-tabs">
                <button type="button" className={authMode === 'login' ? 'selected' : ''} onClick={() => { setAuthMode('login'); setError(''); setNotice(''); }}><Users size={17} /> Log in</button>
                <button type="button" className={authMode === 'register' ? 'selected' : ''} onClick={() => { setAuthMode('register'); setError(''); setNotice(''); }}><GraduationCap size={17} /> Create account</button>
              </div>
              <div className="eyebrow auth-eyebrow"><Sparkles size={14} /> YOUR CAREER JOURNEY</div>
              <h2>{authMode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
              <p className="auth-intro">{authMode === 'login' ? 'Sign in to pick up where your career journey left off.' : 'Join CareerConnect and start exploring opportunities.'}</p>
              {error && <div className="error-banner">{error}</div>}
              {notice && <div className="notice">{notice}</div>}
              <form className="auth-form" onSubmit={submitAuth}>
                {authMode === 'register' && <label>Full name<input required maxLength={100} value={authName} onChange={e => setAuthName(e.target.value)} autoComplete="name" placeholder="Enter your full name" /></label>}
                <label>Email address<input required type="email" value={authEmail} onChange={e => setAuthEmail(e.target.value)} autoComplete="email" placeholder="you@example.com" /></label>
                <label>Password
                  <div className="password-field">
                    <input required minLength={authMode === 'register' ? 8 : undefined} type={showPassword ? 'text' : 'password'} value={authPassword} onChange={e => setAuthPassword(e.target.value)} autoComplete={authMode === 'login' ? 'current-password' : 'new-password'} placeholder="Enter your password" />
                    <button type="button" className="password-toggle" onClick={() => setShowPassword(prev => !prev)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                  </div>
                </label>
                <button className="primary-button full-button auth-submit" type="submit" disabled={authBusy}>{authBusy ? 'Please wait…' : authMode === 'login' ? 'Log in to CareerConnect' : 'Create student account'} <ArrowUpRight size={17}/></button>
              </form>
              <p className="auth-switch">{authMode === 'login' ? 'New to CareerConnect?' : 'Already have an account?'} <button className="text-button" type="button" onClick={() => { setAuthMode(authMode === 'login' ? 'register' : 'login'); setError(''); setNotice(''); }}>{authMode === 'login' ? 'Create a student account' : 'Log in instead'}</button></p>
              <div className="auth-security"><span><CheckCircle2 size={14} /></span> Secure sign-in for your placement journey</div>
            </div>
            <div className="auth-copyright">CareerConnect <span>·</span> Student Placement Portal</div>
          </section>
        </main>
      </div>
    );
  }

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><GraduationCap size={22}/></div><div><strong>CareerConnect</strong><span>STUDENT PORTAL</span></div></div>
      <div className="side-label">MAIN MENU</div>
      <nav>{navItems.map(({ name, icon: Icon }) => <button key={name} className={`nav-item ${tab === name ? 'active' : ''}`} onClick={() => setTab(name)}><Icon size={18}/><span>{name}</span>{name === 'My applications' && <small>{applications.length}</small>}</button>)}</nav>
      <div className="sidebar-section-label">YOUR CAREER</div>
      <div className="side-card"><div className="side-card-icon"><Target size={18}/></div><strong>One step closer</strong><p>Every application brings you closer to your next opportunity.</p><button onClick={() => setTab('Find opportunities')}>Explore roles <ArrowUpRight size={14}/></button></div>
      <div className="sidebar-bottom"><div className="sidebar-help"><CircleHelp size={16}/><span>Keep moving forward</span></div><div className="user-mini"><div className="avatar">{(name || 'U').slice(0, 1).toUpperCase()}</div><div><strong>{name || 'User'}</strong><span>{user.role === 'admin' ? 'Admin account' : 'Student account'}</span></div><button className="text-button" onClick={logout}>Log out</button></div></div>
    </aside>

    <main className="main-area">
      <header className="topbar"><div className="breadcrumb">Workspace <span>/</span> <strong>{tab}</strong></div><div className="top-actions"><span className="today"><CalendarDays size={15}/> Placement season 2026</span><button className="icon-button" aria-label="Notifications" onClick={() => setNotice('You are all caught up!')}><Bell size={18}/></button><div className="avatar">{(name || 'U').slice(0, 1).toUpperCase()}</div></div></header>
      <div className="content">
        {error && <div className="error-banner">{error} <button onClick={loadData}>Retry</button></div>}
        {notice && <div className="notice"><CheckCircle2 size={17}/><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss"><X size={16}/></button></div>}
        {tab === 'Overview' && <>
          <section className="welcome-row"><div><div className="eyebrow"><Sparkles size={14}/> YOUR CAREER JOURNEY</div><h1>Welcome back, {name.split(' ')[0]} <span>✦</span></h1><p>A little progress each day adds up to big opportunities.</p></div><button className="primary-button" onClick={() => setTab('Find opportunities')}>Browse opportunities <ArrowUpRight size={17}/></button></section>
          <section className="hero-banner"><div className="hero-copy"><div className="hero-tag">YOUR NEXT CHAPTER</div><h2>Build your future,<br/>one step at a time.</h2><p>Find roles that fit your goals, keep track of your applications, and get ready for what's next.</p><button onClick={() => setTab('Find opportunities')}>Explore open roles <ArrowUpRight size={16}/></button><div className="hero-trust"><CheckCircle2 size={14}/> Your career journey, all in one place</div></div><div className="hero-graphic"><div className="orbit orbit-one"></div><div className="orbit orbit-two"></div><div className="hero-icon"><GraduationCap size={54}/></div><div className="float-card float-top"><CheckCircle2 size={16}/><span>Keep moving forward</span></div><div className="float-card float-bottom"><Activity size={16}/><span>Career progress</span></div></div></section>
          <section className="stats-grid"><Stat icon={BriefcaseBusiness} label="In progress" value={activeApps} hint="Applications underway"/><Stat icon={CalendarDays} label="Interviews" value={interviews} hint="Prepare for your next step"/><Stat icon={CheckCircle2} label="Offers received" value={offers} hint="Celebrate your progress"/><Stat icon={Target} label="Open opportunities" value={jobs.length} hint="Roles to explore"/></section>
          <section className="section-heading"><div><h2>Recommended opportunities</h2><p>Start with roles you may be interested in.</p></div><button className="text-button" onClick={() => setTab('Find opportunities')}>View all <ArrowUpRight size={15}/></button></section>
          <div className="job-grid">{jobs.slice(0, 3).map(job => <JobCard key={job.id} job={job} onApply={setModalJob} isAdmin={isAdmin} onEdit={openEditJob} onViewApplicants={setApplicantsJob} applications={applications}/>)}</div>
          <section className="section-heading application-heading"><div><h2>Recent applications</h2><p>Stay on top of your progress.</p></div><button className="text-button" onClick={() => setTab('My applications')}>Track applications <ArrowUpRight size={15}/></button></section>
          <ApplicationTable applications={applications.slice(0, 3)} onStatus={updateStatus} canUpdate={isAdmin}/>
        </>}
        {tab === 'Find opportunities' && <><section className="welcome-row"><div><div className="eyebrow"><BriefcaseBusiness size={14}/> CAREER OPPORTUNITIES</div><h1>Find your next opportunity</h1><p>Search openings and take the next step in your career.</p></div>{isAdmin && <button className="primary-button" onClick={() => setShowAdd(true)}>+ Add opportunity</button>}</section><div className="search-row"><div className="search-box"><Search size={18}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search job title, company, skill..."/></div><div className="filter-label"><SlidersHorizontal size={17}/> {filteredJobs.length} opportunities</div></div>{loading ? <p className="empty-state">Loading opportunities…</p> : <div className="job-grid all-jobs">{filteredJobs.map(job => <JobCard key={job.id} job={job} onApply={setModalJob} isAdmin={isAdmin} onEdit={openEditJob} onViewApplicants={setApplicantsJob} applications={applications}/>)}</div>}{!loading && filteredJobs.length === 0 && <p className="empty-state">No matching opportunities. Try another search.</p>}</>}
        {tab === 'My applications' && <><section className="welcome-row"><div><div className="eyebrow"><ClipboardList size={14}/> APPLICATION TRACKER</div><h1>My applications</h1><p>Track each application from submission to outcome.</p></div><button className="primary-button" onClick={() => setTab('Find opportunities')}>Browse jobs <ArrowUpRight size={17}/></button></section><div className="tracker-summary"><div><span>Total applications</span><strong>{applications.length}</strong></div><div><span>In progress</span><strong>{activeApps}</strong></div><div><span>Offers</span><strong>{offers}</strong></div></div><ApplicationTable applications={applications} onStatus={updateStatus} canUpdate={isAdmin}/></>}
      </div>
      <footer>CareerConnect <span>•</span> Student Placement Portal <span className="footer-right">Built for learning & career growth</span></footer>
    </main>

    {modalJob && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModalJob(null); }}><form className="modal" onSubmit={applyToJob}><button type="button" className="modal-close" onClick={() => setModalJob(null)}><X size={18}/></button><div className="eyebrow">APPLICATION FORM</div><h2>Apply to {modalJob.company}</h2><p className="modal-subtitle">{modalJob.title} · {modalJob.location}</p><label>Full name<input readOnly value={name} /></label><label>Email address<input readOnly type="email" value={email} /></label><div className="modal-note">Your details are taken from your signed-in account.</div><button className="primary-button full-button" type="submit">Submit application <ArrowUpRight size={16}/></button></form></div>}
    {isAdmin && showAdd && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) closeJobEditor(); }}><form className="modal add-modal" onSubmit={addJob}><button type="button" className="modal-close" onClick={closeJobEditor}><X size={18}/></button><div className="eyebrow">PLACEMENT OFFICE</div><h2>{editingJobId ? 'Edit opportunity' : 'Add an opportunity'}</h2><p className="modal-subtitle">{editingJobId ? 'Correct the listing details and save your changes.' : 'Create a listing for the portal.'}</p><div className="form-grid"><label>Company<input required value={newJob.company} onChange={e => setNewJob({...newJob, company:e.target.value})}/></label><label>Job title<input required value={newJob.title} onChange={e => setNewJob({...newJob, title:e.target.value})}/></label><label>Type<select value={newJob.type} onChange={e => setNewJob({...newJob, type:e.target.value})}><option>Full-time</option><option>Internship</option><option>Contract</option></select></label><label>Location<input required value={newJob.location} onChange={e => setNewJob({...newJob, location:e.target.value})}/></label><label>Package / stipend<input value={newJob.package} onChange={e => setNewJob({...newJob, package:e.target.value})} placeholder="e.g. 6 LPA or Paid"/></label><label>Application deadline<input required type="date" value={newJob.deadline} onChange={e => setNewJob({...newJob, deadline:e.target.value})}/></label><label className="wide-field">Skills (comma separated)<input value={newJob.skills} onChange={e => setNewJob({...newJob, skills:e.target.value})} placeholder="React, SQL, JavaScript"/></label><label className="wide-field">Description<textarea value={newJob.description} onChange={e => setNewJob({...newJob, description:e.target.value})} rows="2"/></label></div><button className="primary-button full-button" type="submit">{editingJobId ? 'Save changes' : 'Publish opportunity'} <ArrowUpRight size={16}/></button></form></div>}
    {isAdmin && applicantsJob && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setApplicantsJob(null); }}><section className="modal applicants-modal"><button type="button" className="modal-close" onClick={() => setApplicantsJob(null)}><X size={18}/></button><div className="eyebrow">PLACEMENT OFFICE</div><h2>Applicants</h2><p className="modal-subtitle">{applicantsJob.title} · {applicantsJob.company}</p><ApplicantsList applications={applications.filter(application => application.jobId === applicantsJob.id)} /></section></div>}
  </div>;
}

function Stat({ icon: Icon, label, value, hint }) { return <div className="stat-card"><div className="stat-top"><div className="stat-icon"><Icon size={19}/></div><span className="stat-dot"></span></div><div className="stat-value">{value}</div><div className="stat-label">{label}</div><div className="stat-hint">{hint}</div></div>; }
function JobCard({ job, onApply, isAdmin = false, onEdit, onViewApplicants, applications = [] }) {
  const applicantCount = applications.filter(application => application.jobId === job.id).length;
  return <article className="job-card">
    <div className="job-card-top"><div className="company-logo">{(job.company || '?').slice(0, 1).toUpperCase()}</div><span className="job-type">{job.type}</span></div>
    <div className="company-name">{job.company}</div><h3>{job.title}</h3><p className="job-location">{job.location} <span>·</span> {job.package}</p>
    <div className="skill-list">{(job.skills || []).slice(0, 3).map(skill => <span key={skill}>{skill}</span>)}</div>
    <div className="job-card-bottom"><span><CalendarDays size={14}/> Deadline {job.deadline || 'Not specified'}</span>{!isAdmin && <button onClick={() => onApply(job)}>Apply <ArrowUpRight size={15}/></button>}</div>
    {isAdmin && <div className="admin-job-actions"><button type="button" onClick={() => onEdit(job)}>Edit job <Settings size={14}/></button><button type="button" onClick={() => onViewApplicants(job)}>Applicants <Users size={14}/><span className="applicant-count">{applicantCount}</span></button></div>}
  </article>;
}

function ApplicantsList({ applications }) {
  if (!applications.length) return <div className="empty-state applicants-empty">No students have applied to this opportunity yet.</div>;
  return <div className="applicants-list">{applications.map(application => <div className="applicant-row" key={application.id}>
    <div className="avatar">{(application.studentName || '?').slice(0, 1).toUpperCase()}</div>
    <div className="applicant-info"><strong>{application.studentName || 'Student'}</strong><span>{application.email || 'Email unavailable'}</span><small>Applied {application.appliedAt ? new Date(application.appliedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'date unavailable'}</small></div>
    <span className={`status-pill ${(application.status || 'Applied').toLowerCase()}`}>{application.status || 'Applied'}</span>
  </div>)}</div>;
}
function ApplicationTable({ applications, onStatus, canUpdate = false }) { return <div className="table-wrap"><table><thead><tr><th>COMPANY / ROLE</th><th>APPLIED ON</th><th>STATUS</th>{canUpdate && <th>UPDATE STATUS</th>}</tr></thead><tbody>{applications.map(app => <tr key={app.id}><td><div className="table-company"><div className="company-logo small-logo">{(app.job?.company || '?').slice(0,1)}</div><div><strong>{app.job?.company || 'Unknown company'}</strong><span>{app.job?.title || 'Role unavailable'}</span></div></div></td><td>{new Date(app.appliedAt).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}</td><td><span className={`status-pill ${app.status.toLowerCase()}`}>{app.status}</span></td>{canUpdate && <td><select className="status-select" value={app.status} onChange={e => onStatus(app.id, e.target.value)} aria-label={`Update status for ${app.job?.company || 'application'}`}><option>Applied</option><option>Assessment</option><option>Interview</option><option>Offer</option><option>Rejected</option></select></td>}</tr>)}</tbody></table>{applications.length === 0 && <div className="empty-state">No applications yet. Browse opportunities and apply to get started.</div>}</div>; }

export default App;
