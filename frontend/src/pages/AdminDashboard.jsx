import React from 'react';
import { Button } from '../components/ui/button.jsx';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog.jsx';
import { Input } from '../components/ui/input.jsx';
import { Label } from '../components/ui/label.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { useAuth } from '../context/useAuth.js';
import './styles/_admin.scss';

export default function AdminDashboard() {
  const { getEmployees, getAdminSummary, createEmployee, deleteEmployee, checkIn, checkOut } = useAuth();
  const toast = React.useRef(null);

  // Local state for API data
  const [employees, setEmployees] = React.useState([]);
  const [summary, setSummary] = React.useState({
    employeeCount: 0,
    activeEmployeeCount: 0,
    todayAttendanceCount: 0,
    lateCount: 0,
  });
  const [loading, setLoading] = React.useState(true);
  const [markEmployeeId, setMarkEmployeeId] = React.useState('');

  const [showCreateEmp, setShowCreateEmp] = React.useState(false);
  const [empForm, setEmpForm] = React.useState({ 
    name: '', 
    email: '', 
    role: 'Software Engineer', 
    department: '', 
    phone: '', 
    salary: 50000 
  });

  // Load data on component mount
  React.useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [employeesRes, summaryRes] = await Promise.all([
        getEmployees(),
        getAdminSummary()
      ]);

      if (employeesRes.ok) {
        setEmployees(employeesRes.data);
      }

      if (summaryRes.ok) {
        setSummary(summaryRes.data);
      }
    } catch (error) {
      toast.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Failed to load dashboard data' 
      });
    } finally {
      setLoading(false);
    }
  }

  const roleOptions = [
    { label: 'Lab Team', value: 'Lab Team' },
    { label: 'Login Team', value: 'Login Team' },
    { label: 'Sales Team', value: 'Sales Team' },
    { label: 'Management Team', value: 'Management Team' }
  ];

  async function onCreateEmployee() {
    if (!empForm.name || !empForm.email || !empForm.role || !empForm.department) {
      toast.current?.show({ 
        severity: 'warn', 
        summary: 'Validation', 
        detail: 'Name, email, role, and department are required' 
      });
      return;
    }

    try {
      const response = await createEmployee({
        name: empForm.name,
        email: empForm.email,
        role: empForm.role,
        department: empForm.department,
        phone: empForm.phone,
        salary: empForm.salary || 50000
      });

      if (response.ok) {
        setShowCreateEmp(false);
        setEmpForm({ name: '', email: '', role: 'Software Engineer', department: '', phone: '', salary: 50000 });
        toast.current?.show({ 
          severity: 'success', 
          summary: 'Success', 
          detail: 'Employee created successfully' 
        });
        loadData(); // Refresh data
      } else {
        toast.current?.show({ 
          severity: 'error', 
          summary: 'Error', 
          detail: response.error || 'Failed to create employee' 
        });
      }
    } catch (error) {
      toast.current?.show({ 
        severity: 'error', 
        summary: 'Error', 
        detail: 'Failed to create employee' 
      });
    }
  }

  async function onDeactivateEmployee(emp) {
    const res = await deleteEmployee(emp.employee_id);
    if (res.ok) {
      toast.current?.show({ severity: 'success', summary: 'Deactivated', detail: 'Employee deactivated' });
      loadData();
    } else {
      toast.current?.show({ severity: 'error', summary: 'Error', detail: res.error || 'Failed to deactivate' });
    }
  }

  if (loading) {
    return (
      <div className="admin-page">
        <div className="page-header">
          <h1>Admin Dashboard</h1>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Toast ref={toast} />
      
      <div className="admin-page">
        <div className="page-header">
          <h1 className="m-0 text-2xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your organization's employees, attendance records, and salary information</p>
        </div>

        {/* Statistics Overview */}
        <div className="statistics-grid">
          <div className="stat-card">
            <i className="pi pi-users stat-icon"></i>
            <div className="stat-value">{summary.employeeCount}</div>
            <div className="stat-label">Total Employees</div>
          </div>
          <div className="stat-card">
            <i className="pi pi-user-plus stat-icon"></i>
            <div className="stat-value">{summary.activeEmployeeCount}</div>
            <div className="stat-label">Active Employees</div>
          </div>
          <div className="stat-card">
            <i className="pi pi-calendar-check stat-icon"></i>
            <div className="stat-value">{summary.todayAttendanceCount}</div>
            <div className="stat-label">Present Today</div>
          </div>
          <div className="stat-card">
            <i className="pi pi-clock stat-icon"></i>
            <div className="stat-value">{summary.lateCount}</div>
            <div className="stat-label">Late Today</div>
          </div>
        </div>

        {/* Admin Management Sections */}
        <div className="admin-sections">
          {/* Quick Check-in/Out */}
          <div className="admin-section">
            <div className="section-header">
              <h3 className="section-title">Quick Check-in/Out</h3>
            </div>
            <div className="section-content" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <Input value={markEmployeeId} onChange={(e) => setMarkEmployeeId(e.target.value)} placeholder="Employee ID" />
              <Button onClick={async () => {
                if (!markEmployeeId) return;
                const res = await checkIn(Number(markEmployeeId));
                toast.current?.show({ severity: res.ok ? 'success' : 'error', summary: res.ok ? 'Checked in' : 'Error', detail: res.ok ? 'Check-in recorded' : res.error });
              }}>Check-in</Button>
              <Button variant="secondary" onClick={async () => {
                if (!markEmployeeId) return;
                const res = await checkOut(Number(markEmployeeId));
                toast.current?.show({ severity: res.ok ? 'success' : 'error', summary: res.ok ? 'Checked out' : 'Error', detail: res.ok ? 'Check-out recorded' : res.error });
              }}>Check-out</Button>
            </div>
          </div>
          {/* Employee Management Section */}
          <div className="admin-section">
            <div className="section-header">
              <h3 className="section-title">Employee Management</h3>
              <div className="section-action">
                <Button onClick={() => setShowCreateEmp(true)}>
                  <span className="pi pi-user-plus mr-2" /> Add Employee
                </Button>
              </div>
            </div>
            <div className="section-content">
              {employees.length === 0 ? (
                <div className="empty-state">
                  <i className="pi pi-users empty-icon"></i>
                  <div className="empty-title">No Employees Yet</div>
                  <div className="empty-description">Add your first employee to get started</div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employee ID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {employees.map((employee, index) => (
                      <TableRow key={index}>
                        <TableCell>{employee.employee_id}</TableCell>
                        <TableCell>{employee.name}</TableCell>
                        <TableCell>{employee.email}</TableCell>
                        <TableCell>{employee.designation}</TableCell>
                        <TableCell>
                          <Button variant="destructive" className="h-8 px-2" onClick={() => onDeactivateEmployee(employee)}>
                            Deactivate
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Employee Dialog */}
      <Dialog open={showCreateEmp} onOpenChange={setShowCreateEmp}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Employee</DialogTitle>
          </DialogHeader>
          <div className="form-grid">
            <div className="form-field">
              <Label className="field-label">Full Name *</Label>
              <Input
                value={empForm.name}
                onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })}
                placeholder="Enter full name"
                className="w-full"
              />
            </div>
            
            <div className="form-field">
              <Label className="field-label">Email Address *</Label>
              <Input
                value={empForm.email}
                onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })}
                placeholder="Enter email address"
                type="email"
                className="w-full"
              />
            </div>
            
            <div className="form-field">
              <Label className="field-label">Role *</Label>
              <select
                value={empForm.role}
                onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {roleOptions.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>
            
            <div className="form-field">
              <Label className="field-label">Department *</Label>
              <Input
                value={empForm.department}
                onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })}
                placeholder="Enter department"
                className="w-full"
              />
            </div>
            
            <div className="form-field">
              <Label className="field-label">Phone</Label>
              <Input
                value={empForm.phone}
                onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })}
                placeholder="Enter phone number"
                className="w-full"
              />
            </div>
            
            <div className="form-field">
              <Label className="field-label">Salary</Label>
              <Input
                value={empForm.salary}
                onChange={(e) => setEmpForm({ ...empForm, salary: parseFloat(e.target.value) || 0 })}
                placeholder="Enter salary"
                type="number"
                className="w-full"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateEmp(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={onCreateEmployee}
            >
              Create Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
