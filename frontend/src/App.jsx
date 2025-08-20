import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { PrimeReactProvider } from 'primereact/api';
import { Menubar } from 'primereact/menubar';
import { Button } from 'primereact/button';
import { Toast } from 'primereact/toast';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';

import AuthProvider from './context/AuthContext.jsx';
import { useAuth } from './context/useAuth.js';
import SessionManager from './components/SessionManager.jsx';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage.jsx'));
const AttendancePage = lazy(() => import('./pages/AttendancePage.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));

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
      <h2 style={{ color: '#2a2a2a', fontWeight: 600, marginBottom: '1.5rem' }}>Salary</h2>
      {!record ? (
        <p className="text-600">No salary data for this account.</p>
      ) : (
        <div className="grid" style={{ gap: '2rem' }}>
          <div className="col-12 md:col-4">
            <div className="p-card p-component" style={{ minWidth: 260 }}>
              <div className="p-card-body">
                <div className="p-card-title" style={{ fontSize: '1.15rem', fontWeight: 500 }}>Summary</div>
                <div className="p-mt-3">
                  <div className="p-d-flex p-jc-between p-my-2"><span>Base</span><strong>{record.base.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</strong></div>
                  <div className="p-d-flex p-jc-between p-my-2"><span>Allowances</span><strong>{record.allowances.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</strong></div>
                  <div className="p-d-flex p-jc-between p-my-2"><span>Deductions</span><strong>{record.deductions.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</strong></div>
                  <div className="p-d-flex p-jc-between p-my-2"><span>Net</span><strong style={{ color: '#4f46e5' }}>{record.net.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</strong></div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-12 md:col-8">
            <div className="p-card p-component" style={{ overflowX: 'auto' }}>
              <div className="p-card-body">
                <div className="p-card-title" style={{ fontSize: '1.15rem', fontWeight: 500 }}>Recent Payslips</div>
                <div className="p-mt-3">
                  <table className="p-datatable-table" style={{ width: '100%', tableLayout: 'fixed', wordBreak: 'break-word' }}>
                    <thead>
                      <tr>
                        <th className="p-2 text-700" style={{ minWidth: 80 }}>Month</th>
                        <th className="p-2 text-700" style={{ minWidth: 100 }}>Base</th>
                        <th className="p-2 text-700" style={{ minWidth: 100 }}>Allowances</th>
                        <th className="p-2 text-700" style={{ minWidth: 100 }}>Deductions</th>
                        <th className="p-2 text-700" style={{ minWidth: 100 }}>Net</th>
                        <th className="p-2 text-700" style={{ minWidth: 120 }}>Paid On</th>
                      </tr>
                    </thead>
                    <tbody>
                      {record.payslips.map((p, i) => (
                        <tr key={i}>
                          <td className="p-2">{p.month}</td>
                          <td className="p-2">{p.base.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                          <td className="p-2">{p.allowances.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                          <td className="p-2">{p.deductions.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</td>
                          <td className="p-2"><strong style={{ color: '#4f46e5' }}>{p.net.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</strong></td>
                          <td className="p-2" style={{ wordBreak: 'break-word' }}>{p.paidOn}</td>
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
    { 
      label: 'Dashboard', 
      icon: 'pi pi-home', 
      command: () => navigate('/dashboard'),
      className: location.pathname === '/dashboard' ? 'active-menu-item' : ''
    },
    { 
      label: 'Attendance', 
      icon: 'pi pi-calendar', 
      command: () => navigate('/attendance'),
      className: location.pathname === '/attendance' ? 'active-menu-item' : ''
    },
    { 
      label: 'Salary', 
      icon: 'pi pi-wallet', 
      command: () => navigate('/salary'),
      className: location.pathname === '/salary' ? 'active-menu-item' : ''
    },
    ...(user?.role?.toLowerCase() === 'admin'
      ? [
          { 
            label: 'Employees', 
            icon: 'pi pi-users', 
            command: () => navigate('/employees'),
            className: location.pathname === '/employees' ? 'active-menu-item' : ''
          },
          { 
            label: 'Admin', 
            icon: 'pi pi-cog', 
            command: () => navigate('/admin'),
            className: location.pathname === '/admin' ? 'active-menu-item' : ''
          },
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
    <Link to="/dashboard" className="company-logo">
      <img src="/logo.jpg" alt="Logo" style={{ height: 'auto', width: 'auto', maxHeight: '80px' }} />
    </Link>
  );

  const end = user ? (
    <div className="user-info">
      <div className="user-details">
        <div className="user-name">{user.name || user.email}</div>
        <div className="user-role">{user.role || 'Employee'}</div>
      </div>
      <Menu model={profileItems} popup ref={profileMenuRef} id="profile_menu" />
      <Button 
        text 
        rounded
        className="user-menu-button"
        aria-haspopup
        aria-controls="profile_menu"
        onClick={(e) => profileMenuRef.current?.toggle(e)}
      >
        <Avatar icon="pi pi-user" size="normal" shape="circle" />
      </Button>
    </div>
  ) : (
    <Link to="/login">
      <Button label="Sign In" icon="pi pi-sign-in" className="p-button-outlined" />
    </Link>
  );

  return (
    <div className="app-shell">
      <Toast ref={toastRef} />
      <Menubar model={items} start={start} end={end} />
      
      <main className="app-main">
        <Suspense fallback={<div>Loading...</div>}>
          <Routes location={location}>
            <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            {/* Admin can access Employees; employees cannot */}
            <Route
              path="/employees"
              element={
                <AdminRoute>
                  <EmployeesPage />
                </AdminRoute>
              }
            />
            {/* Attendance is employee display-only route */}
            <Route
              path="/attendance"
              element={
                <ProtectedRoute>
                  <AttendancePage />
                </ProtectedRoute>
              }
            />
            {/* Salary and Profile accessible to authenticated users; per-page will restrict viewing to self */}
            <Route
              path="/salary"
              element={
                <ProtectedRoute>
                  <SalaryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            {/* Admin tools page */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      
      <footer className="app-footer">
        <div>© {new Date().getFullYear()} AttendanceHub. All rights reserved.</div>
        <div>Professional HR Management System</div>
      </footer>
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

export default function App() {
  return (
    <PrimeReactProvider>
      <AuthProvider>
        <SessionManager />
        <Layout />
      </AuthProvider>
    </PrimeReactProvider>
  );
}
