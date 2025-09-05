import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from './components/ui/button';
import { Avatar, AvatarFallback } from './components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu';
import { SidebarProvider, SidebarTrigger, SidebarInset } from './components/ui/sidebar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Skeleton } from './components/ui/skeleton';
import { LogOut, User, Moon, Sun } from 'lucide-react';

import AuthProvider from './context/AuthContext.jsx';
import { useAuth } from './context/useAuth';
import SessionManager from './components/SessionManager';
import { AppSidebar } from './components/app-sidebar';
import { ThemeProvider, useTheme } from './context/ThemeProvider';
import { apiService } from './services/apiService';
import ErrorBoundary from './components/ErrorBoundary';
import { LoadingSpinner } from './components/LoadingSpinner';

// Lazy load pages
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage.jsx'));
const AttendancePage = lazy(() => import('./pages/AttendancePage.jsx'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.tsx'));
const PayslipsPage = lazy(() => import('./pages/PayslipsPage.jsx'));

// Salary page (employees can view their own salary)
function SalaryPage() {
  const { user } = useAuth();
  const [employee, setEmployee] = React.useState(null);
  const [payslips, setPayslips] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    async function loadData() {
      if (!user?.employeeId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        // Use API service for employee data
        const empResponse = await apiService.getEmployee(user.employeeId);
        if (empResponse.ok) {
          setEmployee(empResponse.data);
        } else {
          throw new Error(empResponse.error || 'Failed to load employee data');
        }

        // Use API service for payslips
        const payslipResponse = await apiService.getPayslips({ employee_id: user.employeeId });
        if (payslipResponse.ok) {
          setPayslips(payslipResponse.data || []);
        } else {
          console.warn('Failed to load payslips:', payslipResponse.error);
          setPayslips([]);
        }
      } catch (error) {
        console.error('Error loading salary data:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (user?.role?.toLowerCase() !== 'admin' && !user?.employeeId) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-muted-foreground">Not authorized</h3>
          <p className="text-sm text-muted-foreground">You don't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive">Error Loading Data</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const baseSalary = employee?.gross_monthly_salary || 0;
  const allowances = 0; // Placeholder
  const deductions = 0; // Placeholder
  const netSalary = baseSalary + allowances - deductions;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Salary Information</h2>
        <p className="text-muted-foreground">
          View your salary details and payslip history
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Base Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{baseSalary.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div>
            <p className="text-xs text-muted-foreground">Monthly salary</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Allowances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allowances.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div>
            <p className="text-xs text-muted-foreground">Additional benefits</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deductions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{deductions.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div>
            <p className="text-xs text-muted-foreground">Tax and other deductions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Salary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{netSalary.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}</div>
            <p className="text-xs text-muted-foreground">Take-home pay</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payslip History</CardTitle>
          <CardDescription>
            Your recent payslips and payment records
          </CardDescription>
        </CardHeader>
        <CardContent>
          {payslips.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-muted-foreground">No payslips found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payslips.map((payslip, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">
                      {new Date(payslip.pay_period_start).toLocaleDateString()} - {new Date(payslip.pay_period_end).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Generated on {new Date(payslip.generated_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-primary">
                      {payslip.payable_salary.toLocaleString('en-IN', { style: 'currency', currency: 'INR' })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Status: <Badge variant={payslip.status === 'Finalized' ? 'secondary' : 'outline'}>{payslip.status}</Badge>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Profile page with conditional edit
function ProfilePage() {
  const { user } = useAuth();
  const [employee, setEmployee] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState({
    name: '',
    email: '',
    department: '',
    phone: ''
  });

  React.useEffect(() => {
    async function loadProfile() {
      if (!user?.employeeId) {
        setForm({
          name: user?.name || '',
          email: user?.email || '',
          department: '',
          phone: ''
        });
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await apiService.getEmployee(user.employeeId);
        if (response.ok) {
          const empData = response.data;
          setEmployee(empData);
          setForm({
            name: empData.full_name || empData.fullName || '',
            email: empData.email || '',
            department: empData.department || '',
            phone: empData.phone_number || empData.phoneNumber || ''
          });
        } else {
          throw new Error(response.error || 'Failed to load profile');
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    
    try {
      const response = await apiService.updateProfile({
        fullName: form.name,
        email: form.email,
        phoneNumber: form.phone,
        department: form.department
      });

      if (response.ok) {
        setEditing(false);
        // Reload profile data
        if (user?.employeeId) {
          const empResponse = await apiService.getEmployee(user.employeeId);
          if (empResponse.ok) {
            const empData = empResponse.data;
            setEmployee(empData);
            setForm({
              name: empData.full_name || empData.fullName || '',
              email: empData.email || '',
              department: empData.department || '',
              phone: empData.phone_number || empData.phoneNumber || ''
            });
          }
        }
      } else {
        throw new Error(response.error || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setError(error.message);
    } finally {
      setSaving(false);
    }
  };

  const isSelf = user?.role?.toLowerCase() === 'employee';

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 md:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-destructive">Error Loading Profile</h3>
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
        <p className="text-muted-foreground">
          Manage your account information and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>
              Update your personal details and contact information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Full Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                readOnly={!isSelf || !editing}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                readOnly={!isSelf || !editing}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Phone</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                readOnly={!isSelf || !editing}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Department</label>
              <input
                type="text"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                readOnly={!isSelf || !editing}
                className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm"
              />
            </div>

            {isSelf && (
              <div className="flex gap-2 pt-4">
                {!editing ? (
                  <Button onClick={() => setEditing(true)} disabled={saving}>
                    Edit Profile
                  </Button>
                ) : (
                  <>
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setEditing(false);
                        setError(null);
                      }}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                  </>
                )}
              </div>
            )}
            
            {error && (
              <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
            <CardDescription>
              Your account information and role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Employee ID</label>
              <input
                type="text"
                value={employee?.employee_id || user?.employeeId || 'N/A'}
                readOnly
                className="w-full px-3 py-2 border border-input rounded-md bg-muted text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <input
                type="text"
                value={employee?.role || user?.role || 'N/A'}
                readOnly
                className="w-full px-3 py-2 border border-input rounded-md bg-muted text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <input
                type="text"
                value={employee?.is_active ? 'Active' : 'Inactive'}
                readOnly
                className="w-full px-3 py-2 border border-input rounded-md bg-muted text-sm"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Hire Date</label>
              <input
                type="text"
                value={employee?.date_of_joining ? new Date(employee.date_of_joining).toLocaleDateString() : 'N/A'}
                readOnly
                className="w-full px-3 py-2 border border-input rounded-md bg-muted text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  // If not logged in, show login page
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-foreground animate-gradient-x">
        <Suspense fallback={<div className="text-foreground">Loading...</div>}>
          <Routes location={location}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </Suspense>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold">AttendanceHub</h1>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{(user.name || user.email || 'U').slice(0,2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={toggleTheme}>
                    {theme === 'dark' ? (
                      <>
                        <Sun className="mr-2 h-4 w-4" /> Light Mode
                      </>
                    ) : (
                      <>
                        <Moon className="mr-2 h-4 w-4" /> Dark Mode
                      </>
                    )}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout}>
                  <LogOut className="mr-2 h-4 w-4" /> Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4">
          <ErrorBoundary>
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <LoadingSpinner size="lg" className="mx-auto" />
                  <p className="text-muted-foreground">Loading page...</p>
                </div>
              </div>
            }>
              <Routes location={location}>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/salary" element={<SalaryPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                {user?.role?.toLowerCase() === 'admin' && (
                  <>
                    <Route path="/employees" element={<EmployeesPage />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/payslips" element={<PayslipsPage />} />
                  </>
                )}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </main>
      </SidebarInset>
    </SidebarProvider>
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
    <ThemeProvider>
      <AuthProvider>
        <SessionManager />
        <Layout />
      </AuthProvider>
    </ThemeProvider>
  );
}
