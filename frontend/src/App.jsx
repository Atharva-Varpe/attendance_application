import React from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { PrimeReactProvider } from 'primereact/api';
import { Menubar } from 'primereact/menubar';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';

import AuthProvider from './context/AuthContext.jsx';
import { useAuth } from './context/useAuth.js';
import LoginPage from './pages/LoginPage.jsx';
import EmployeesPage from './pages/EmployeesPage.jsx';
import AttendancePage from './pages/AttendancePage.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';

// Salary page (employees can view their own salary)
function SalaryPage() {
  const { user, data } = useAuth();
  if (user?.role?.toLowerCase() !== 'admin' && !user?.employeeId) {
    return <div className="p-3"><h3>Not authorized</h3></div>;
  }
  const record = user?.employeeId ? data.getSalaryByEmployee(user.employeeId) : null;
  const emp = user?.employeeId ? data.getEmployeeById(user.employeeId) : null;

  return (
    <div className="p-3">
      <h2>Salary</h2>
      {!record ? (
        <p className="text-600">No salary data for this account.</p>
      ) : (
        <div className="grid">
          <div className="col-12 md:col-4">
            <div className="p-card p-component">
              <div className="p-card-body">
                <div className="p-card-title">Summary</div>
                <div className="p-mt-3">
                  <div className="p-d-flex p-jc-between p-my-2"><span>Base</span><strong>{record.base.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</strong></div>
                  <div className="p-d-flex p-jc-between p-my-2"><span>Allowances</span><strong>{record.allowances.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</strong></div>
                  <div className="p-d-flex p-jc-between p-my-2"><span>Deductions</span><strong>{record.deductions.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</strong></div>
                  <div className="p-d-flex p-jc-between p-my-2"><span>Net</span><strong>{record.net.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</strong></div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 md:col-8">
            <div className="p-card p-component">
              <div className="p-card-body">
                <div className="p-card-title">Recent Payslips</div>
                <div className="p-mt-3">
                  <table className="p-datatable-table" style={{ width: '100%' }}>
                    <thead>
                      <tr>
                        <th className="p-2 text-700">Month</th>
                        <th className="p-2 text-700">Base</th>
                        <th className="p-2 text-700">Allowances</th>
                        <th className="p-2 text-700">Deductions</th>
                        <th className="p-2 text-700">Net</th>
                        <th className="p-2 text-700">Paid On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {record.payslips.map((p, i) => (
                        <tr key={i}>
                          <td className="p-2">{p.month}</td>
                          <td className="p-2">{p.base.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                          <td className="p-2">{p.allowances.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                          <td className="p-2">{p.deductions.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                          <td className="p-2"><strong>{p.net.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</strong></td>
                          <td className="p-2">{p.paidOn}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Profile page with conditional edit
function ProfilePage() {
  const { user, data } = useAuth();
  const [editing, setEditing] = React.useState(false);
  const [form, setForm] = React.useState(() => {
    if (!user?.employeeId) return { name: user?.name || '', email: user?.email || '' };
    const emp = data.getEmployeeById(user.employeeId);
    return {
      name: emp?.name || '',
      email: emp?.email || user?.email || '',
      role: emp?.role || '',
      department: emp?.department || '',
      phone: emp?.phone || '',
      status: emp?.status || 'Active',
      hireDate: emp?.hireDate || '',
      id: emp?.id || '',
    };
  });

  const isSelf = user?.role?.toLowerCase() === 'employee';

  function save() {
    setEditing(false);
  }


  return (
    <div className="p-3">
      <h2>Profile</h2>
      <div className="grid mt-3">
        <div className="col-12 md:col-6">
          <div className="p-card p-component">
            <div className="p-card-body">
              <div className="p-card-title">Details</div>
              <div className="p-fluid p-formgrid p-grid">
                <div className="p-field p-col-12">
                  <label>Name</label>
                  <input className="p-inputtext p-component" value={form.name} readOnly={!isSelf || !editing} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="p-field p-col-12">
                  <label>Email</label>
                  <input className="p-inputtext p-component" value={form.email} readOnly={!isSelf || !editing} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
                <div className="p-field p-col-12 md:p-col-6">
                  <label>Role</label>
                  <input className="p-inputtext p-component" value={form.role || ''} readOnly />
                </div>
                <div className="p-field p-col-12 md:p-col-6">
                  <label>Department</label>
                  <input className="p-inputtext p-component" value={form.department || ''} readOnly={!isSelf || !editing} onChange={(e) => setForm({ ...form, department: e.target.value })} />
                </div>
                <div className="p-field p-col-12 md:p-col-6">
                  <label>Phone</label>
                  <input className="p-inputtext p-component" value={form.phone || ''} readOnly={!isSelf || !editing} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </div>
                <div className="p-field p-col-12 md:p-col-6">
                  <label>Status</label>
                  <input className="p-inputtext p-component" value={form.status || ''} readOnly />
                </div>
                <div className="p-field p-col-12 md:p-col-6">
                  <label>Hire Date</label>
                  <input className="p-inputtext p-component" value={form.hireDate || ''} readOnly />
                </div>
                <div className="p-field p-col-12 md:p-col-6">
                  <label>Employee ID</label>
                  <input className="p-inputtext p-component" value={form.id || ''} readOnly />
                </div>
              </div>
              {isSelf ? (
                <div className="p-mt-3 p-d-flex p-gap-2">
                  {!editing ? (
                    <button className="p-button p-component" type="button" onClick={() => setEditing(true)}><span className="pi pi-pencil p-mr-2" />Edit</button>
                  ) : (
                    <>
                      <button className="p-button p-component" type="button" onClick={save}><span className="pi pi-check p-mr-2" />Save</button>
                      <button className="p-button p-component p-button-secondary" type="button" onClick={() => setEditing(false)}><span className="pi pi-times p-mr-2" />Cancel</button>
                    </>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Simple in-memory theme switcher
function useTheme() {
  const [theme, setTheme] = React.useState(
    localStorage.getItem('theme') || 'lara-light-blue'
  );
  React.useEffect(() => {
    // swap PrimeReact theme by replacing link tag href
    const id = 'primereact-theme-link';
    const linkEl = document.getElementById(id) || document.querySelector('link[href*="primereact/resources/themes/"]');
    if (linkEl) {
      const href = linkEl.getAttribute('href');
      const newHref = href.replace(/themes\/[^/]+\/theme.css/, `themes/${theme}/theme.css`);
      linkEl.setAttribute('href', newHref);
    }
    localStorage.setItem('theme', theme);
  }, [theme]);
  return { theme, setTheme };
}

function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const toastRef = React.useRef(null);
  const { setTheme } = useTheme();

  // Left menu with top-level navigation
  const items = [
    { label: 'Dashboard', icon: 'pi pi-home', command: () => navigate('/dashboard') },
    { label: 'Attendance', icon: 'pi pi-calendar', command: () => navigate('/attendance') },
    { label: 'Salary', icon: 'pi pi-wallet', command: () => navigate('/salary') },
    ...(user?.role?.toLowerCase() === 'admin'
      ? [
          { label: 'Employees', icon: 'pi pi-users', command: () => navigate('/employees') },
          { label: 'Admin', icon: 'pi pi-cog', command: () => navigate('/admin') },
        ]
      : []),
  ];

  // Right profile menu with theme switcher and no duplicate profile on left
  const profileMenuRef = React.useRef(null);
  const profileItems = [
    { label: 'Profile', icon: 'pi pi-user', command: () => navigate('/profile') },
    {
      label: 'Theme',
      icon: 'pi pi-palette',
      items: [
        { label: 'Light (Lara Blue)', command: () => setTheme('lara-light-blue') },
        { label: 'Dark (Lara Blue)', command: () => setTheme('lara-dark-blue') },
        { label: 'Light (Saga Blue)', command: () => setTheme('saga-blue') },
        { label: 'Dark (Saga Blue)', command: () => setTheme('arya-blue') },
      ],
    },
    { separator: true },
    { label: 'Logout', icon: 'pi pi-sign-out', command: logout },
  ];

  const start = (
    <Link to="/dashboard" className="p-menubar-button p-button-text" style={{ textDecoration: 'none' }}>
      <span className="pi pi-briefcase p-mr-2" />
      <span className="p-text-bold">HR Suite</span>
    </Link>
  );

  const end = user ? (
    <div className="p-d-flex p-ai-center p-gap-2">
      <span className="p-text-600" style={{ display: 'none' }}>{user.name || user.email}</span>
      <Menu model={profileItems} popup ref={profileMenuRef} id="profile_menu" />
      <Button text rounded
        aria-haspopup
        aria-controls="profile_menu"
        onClick={(e) => profileMenuRef.current?.toggle(e)}
        icon={<Avatar icon="pi pi-user" size="small" shape="circle" />}
      />
    </div>
  ) : (
    <Link to="/login">
      <Button label="Login" icon="pi pi-sign-in" />
    </Link>
  );

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Toast ref={toastRef} />
      <Menubar model={items} start={start} end={end} className="shadow-1" />
      <main
        className="app-main"
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          padding: '1.5rem'
        }}
      >
        <div
          className="app-container"
          style={{
            width: '100%',
            maxWidth: 1280,
          }}
        >
          <Routes location={location}>
          <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <div className="container-fluid">
                  <Dashboard />
                </div>
              </ProtectedRoute>
            }
          />
          {/* Admin can access Employees; employees cannot */}
          <Route
            path="/employees"
            element={
              <AdminRoute>
                <div className="container-fluid">
                  <EmployeesPage />
                </div>
              </AdminRoute>
            }
          />
          {/* Attendance is employee display-only route */}
          <Route
            path="/attendance"
            element={
              <ProtectedRoute>
                <div className="container-fluid">
                  <AttendancePage />
                </div>
              </ProtectedRoute>
            }
          />
          {/* Salary and Profile accessible to authenticated users; per-page will restrict viewing to self */}
          <Route
            path="/salary"
            element={
              <ProtectedRoute>
                <div className="container-fluid">
                  <SalaryPage />
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <div className="container-fluid">
                  <ProfilePage />
                </div>
              </ProtectedRoute>
            }
          />
          {/* Admin tools page */}
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div className="container-fluid">
                  <AdminDashboard />
                </div>
              </AdminRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </div>
      </main>
      <footer className="app-footer text-600" style={{ padding: '0.75rem 1.5rem' }}>© {new Date().getFullYear()} HR Suite</footer>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { token } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { token, user } = useAuth();
  if (!token) return <Navigate to="/login" replace />;
  if (user?.role?.toLowerCase() !== 'admin') return <Navigate to="/dashboard" replace />;
  return children;
}

// Summary Dashboard using seeded data
function Dashboard() {
  const { user, data } = useAuth();

  const [loading, setLoading] = React.useState(true);
  const [presentToday, setPresentToday] = React.useState(0);
  const [absentToday, setAbsentToday] = React.useState(0);
  const [recent, setRecent] = React.useState([]);

  React.useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      const employees = data.getEmployees();
      const today = new Date().toISOString().slice(0, 10);
      let present = 0, absent = 0;
      const recentRows = [];
      for (const e of employees) {
        const list = data.getAttendanceByEmployee(e.id);
        const todayRec = list.find(r => r.date === today);
        if (todayRec?.status === 'Present' || todayRec?.status === 'Late') present++;
        else absent++;
        const last = list.slice(-1)[0];
        if (last) recentRows.push({ ...last, name: e.name, id: e.id });
      }
      recentRows.sort((a, b) => (a.date < b.date ? 1 : -1));
      setPresentToday(present);
      setAbsentToday(absent);
      setRecent(recentRows.slice(0, 5));
      setLoading(false);
    }, 200);
  }, [data]);

  const countCard = (title, value, icon) => (
    <div className="col-12 md:col-4">
      <div className="p-card p-component shadow-1" style={{ borderRadius: 14 }}>
        <div className="p-card-body">
          <div className="p-d-flex p-jc-between p-ai-center">
            <div>
              <div className="p-card-title" style={{ fontSize: 18 }}>{title}</div>
              <div className="p-card-subtitle">Today</div>
            </div>
            <span className={`pi ${icon}`} style={{ fontSize: 30 }} />
          </div>
          <div className="p-mt-3" style={{ fontSize: 34, fontWeight: 800 }}>{value}</div>
        </div>
      </div>
    </div>
  );

  const tagSeverity = (s) => s === 'Present' ? 'success' : s === 'Late' ? 'warning' : s === 'Leave' ? 'info' : s === 'Absent' ? 'danger' : 'secondary';
  const t = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-');

  return (
    <div className="p-0">
      <div
        className="p-3"
        style={{
          background: 'linear-gradient(135deg, rgba(79,70,229,0.08), rgba(14,165,233,0.08))',
          borderRadius: 12,
          marginBottom: '1rem'
        }}
      >
        <div className="p-d-flex p-jc-between p-ai-center p-flex-wrap" style={{ gap: '0.75rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Dashboard</h2>
            <div className="text-600">Overview and recent activity</div>
          </div>
          <div className="p-d-flex p-gap-2">
            <Link to="/attendance" className="p-button p-button-outlined"><span className="pi pi-calendar p-mr-2" />Attendance</Link>
            <Link to="/employees" className="p-button p-button-outlined"><span className="pi pi-users p-mr-2" />Employees</Link>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid">
          <div className="col-12 md:col-4"><div className="p-skeleton p-component" style={{ height: 180 }} /></div>
          <div className="col-12 md:col-4"><div className="p-skeleton p-component" style={{ height: 180 }} /></div>
          <div className="col-12 md:col-4"><div className="p-skeleton p-component" style={{ height: 180 }} /></div>
        </div>
      ) : (
        <>
          <div className="grid">
            {countCard('Total Employees', data.getEmployees().length, 'pi-users')}
            {countCard('Present Today', presentToday, 'pi-user-check')}
            {countCard('Absent Today', absentToday, 'pi-user-times')}
          </div>

          <div className="grid mt-6">
            <div className="col-12 lg:col-7">
              <div className="p-card p-component" style={{ borderRadius: 14 }}>
                <div className="p-card-body">
                  <div className="p-d-flex p-jc-between p-ai-center">
                    <div>
                      <div className="p-card-title" style={{ marginBottom: 4 }}>Recent Attendance</div>
                      <div className="p-card-subtitle">Latest updates</div>
                    </div>
                    <Link to="/attendance" className="p-button p-button-text">
                      <span className="pi pi-external-link p-mr-2" /> View all
                    </Link>
                  </div>
                  <div className="p-mt-3">
                    <table className="p-datatable-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th className="p-3 text-700">Employee</th>
                          <th className="p-3 text-700">Date</th>
                          <th className="p-3 text-700">Status</th>
                          <th className="p-3 text-700">In</th>
                          <th className="p-3 text-700">Out</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recent.map((r, i) => (
                          <tr key={i} className="p-selectable-row">
                            <td className="p-3">{r.name}</td>
                            <td className="p-3">{r.date}</td>
                            <td className="p-3"><span className={`p-tag p-tag-${tagSeverity(r.status)}`}>{r.status}</span></td>
                            <td className="p-3">{t(r.checkIn)}</td>
                            <td className="p-3">{t(r.checkOut)}</td>
                          </tr>
                        ))}
                        {recent.length === 0 ? (
                          <tr><td colSpan={5} className="p-4 p-text-secondary">No recent entries</td></tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-12 lg:col-5">
              <div className="p-card p-component" style={{ borderRadius: 14, height: '100%' }}>
                <div className="p-card-body">
                  <div className="p-card-title" style={{ marginBottom: 4 }}>Today’s Summary</div>
                  <div className="p-card-subtitle">Quick glance</div>
                  <div className="grid p-mt-3">
                    <div className="col-12 sm:col-6">
                      <div className="p-3 shadow-1" style={{ borderRadius: 12 }}>
                        <div className="text-700">Present</div>
                        <div style={{ fontSize: 28, fontWeight: 700 }}>{presentToday}</div>
                      </div>
                    </div>
                    <div className="col-12 sm:col-6">
                      <div className="p-3 shadow-1" style={{ borderRadius: 12 }}>
                        <div className="text-700">Absent</div>
                        <div style={{ fontSize: 28, fontWeight: 700 }}>{absentToday}</div>
                      </div>
                    </div>
                  </div>
                  <div className="p-mt-3">
                    <Link to="/employees" className="p-button p-button-sm p-button-text">
                      Manage Employees <span className="pi pi-arrow-right p-ml-2" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function App() {
  return (
    <PrimeReactProvider>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </PrimeReactProvider>
  );
}
