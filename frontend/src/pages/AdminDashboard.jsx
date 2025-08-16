import React from 'react';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import { useAuth } from '../context/useAuth.js';
import './styles/_admin.scss';

export default function AdminDashboard() {
  const { getEmployees, getAdminSummary, createEmployee } = useAuth();
  const toast = React.useRef(null);

  // Local state for API data
  const [employees, setEmployees] = React.useState([]);
  const [summary, setSummary] = React.useState({
    total_employees: 0,
    present_today: 0,
    absent_today: 0,
    total_departments: 0
  });
  const [loading, setLoading] = React.useState(true);

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

  const renderStatusTag = (rowData) => {
    const severity = rowData.status === 'Active' ? 'success' : 'danger';
    return <Tag value={rowData.status} severity={severity} />;
  };

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
          <h1>Admin Dashboard</h1>
          <p>Manage your organization's employees, attendance records, and salary information</p>
        </div>

        {/* Statistics Overview */}
        <div className="statistics-grid">
          <div className="stat-card">
            <i className="pi pi-users stat-icon"></i>
            <div className="stat-value">{summary.total_employees}</div>
            <div className="stat-label">Total Employees</div>
          </div>
          <div className="stat-card">
            <i className="pi pi-calendar-check stat-icon"></i>
            <div className="stat-value">{summary.present_today}</div>
            <div className="stat-label">Present Today</div>
          </div>
          <div className="stat-card">
            <i className="pi pi-calendar-times stat-icon"></i>
            <div className="stat-value">{summary.absent_today}</div>
            <div className="stat-label">Absent Today</div>
          </div>
          <div className="stat-card">
            <i className="pi pi-building stat-icon"></i>
            <div className="stat-value">{summary.total_departments}</div>
            <div className="stat-label">Departments</div>
          </div>
        </div>

        {/* Admin Management Sections */}
        <div className="admin-sections">
          {/* Employee Management Section */}
          <div className="admin-section">
            <div className="section-header">
              <h3 className="section-title">Employee Management</h3>
              <div className="section-action">
                <Button 
                  label="Add Employee" 
                  icon="pi pi-user-plus" 
                  onClick={() => setShowCreateEmp(true)}
                  className="p-button-success"
                />
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
                <DataTable value={employees} stripedRows showGridlines paginator rows={5}>
                  <Column field="employee_id" header="Employee ID" />
                  <Column field="name" header="Name" />
                  <Column field="email" header="Email" />
                  <Column field="role" header="Role" />
                  <Column field="department" header="Department" />
                  <Column field="status" header="Status" body={renderStatusTag} />
                </DataTable>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Create Employee Dialog */}
      <Dialog 
        header="Create New Employee" 
        visible={showCreateEmp} 
        style={{ width: '600px' }} 
        modal 
        onHide={() => setShowCreateEmp(false)}
        className="admin-dialog"
      >
        <div className="dialog-content">
          <div className="form-grid">
            <div className="form-field">
              <label className="field-label">Full Name *</label>
              <InputText 
                value={empForm.name} 
                onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} 
                placeholder="Enter full name"
                className="w-full"
              />
            </div>
            
            <div className="form-field">
              <label className="field-label">Email Address *</label>
              <InputText 
                value={empForm.email} 
                onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} 
                placeholder="Enter email address"
                type="email"
                className="w-full"
              />
            </div>
            
            <div className="form-field">
              <label className="field-label">Role *</label>
              <Dropdown 
                value={empForm.role} 
                options={roleOptions} 
                onChange={(e) => setEmpForm({ ...empForm, role: e.target.value })} 
                placeholder="Select role"
                className="w-full"
              />
            </div>
            
            <div className="form-field">
              <label className="field-label">Department *</label>
              <InputText 
                value={empForm.department} 
                onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })} 
                placeholder="Enter department"
                className="w-full"
              />
            </div>
            
            <div className="form-field">
              <label className="field-label">Phone</label>
              <InputText 
                value={empForm.phone} 
                onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })} 
                placeholder="Enter phone number"
                className="w-full"
              />
            </div>
            
            <div className="form-field">
              <label className="field-label">Salary</label>
              <InputText 
                value={empForm.salary} 
                onChange={(e) => setEmpForm({ ...empForm, salary: parseFloat(e.target.value) || 0 })} 
                placeholder="Enter salary"
                type="number"
                className="w-full"
              />
            </div>
          </div>
          
          <div className="form-actions">
            <Button 
              label="Cancel" 
              icon="pi pi-times" 
              onClick={() => setShowCreateEmp(false)} 
              className="p-button-text"
            />
            <Button 
              label="Create Employee" 
              icon="pi pi-check" 
              onClick={onCreateEmployee}
              className="p-button-success"
            />
          </div>
        </div>
      </Dialog>
    </>
  );
}
