import React from 'react';
import { Card } from 'primereact/card';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { FloatLabel } from 'primereact/floatlabel';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';
import './styles/_admin.scss';

// Admin tools only. No dashboard widgets here.
export default function AdminDashboard() {
  const toast = React.useRef(null);

  // Local state placeholders (to be wired to API later)
  const [employees, setEmployees] = React.useState([]);
  const [attendanceCorrections, setAttendanceCorrections] = React.useState([]);
  const [salaryAdjustments, setSalaryAdjustments] = React.useState([]);

  const [showCreateEmp, setShowCreateEmp] = React.useState(false);
  const [empForm, setEmpForm] = React.useState({ name: '', email: '', role: 'employee', department: '', phone: '' });

  const [showAttendanceModal, setShowAttendanceModal] = React.useState(false);
  const [attendanceForm, setAttendanceForm] = React.useState({ employeeId: '', date: '', status: 'Present', checkIn: '', checkOut: '' });

  const [showSalaryModal, setShowSalaryModal] = React.useState(false);
  const [salaryForm, setSalaryForm] = React.useState({ employeeId: '', base: '', allowance: '', deduction: '' });

  // Stubs for now: display toast feedback
  function onCreateEmployee() {
    if (!empForm.name || !empForm.email) {
      toast.current?.show({ severity: 'warn', summary: 'Validation', detail: 'Name and email are required' });
      return;
    }
    setEmployees((prev) => [...prev, { id: Date.now(), ...empForm }]);
    setShowCreateEmp(false);
    setEmpForm({ name: '', email: '', role: 'employee', department: '', phone: '' });
    toast.current?.show({ severity: 'success', summary: 'Employee created' });
  }

  function onAttendanceCorrection() {
    if (!attendanceForm.employeeId || !attendanceForm.date) {
      toast.current?.show({ severity: 'warn', summary: 'Validation', detail: 'Employee and date are required' });
      return;
    }
    setAttendanceCorrections((prev) => [...prev, { id: Date.now(), ...attendanceForm }]);
    setShowAttendanceModal(false);
    setAttendanceForm({ employeeId: '', date: '', status: 'Present', checkIn: '', checkOut: '' });
    toast.current?.show({ severity: 'success', summary: 'Attendance corrected' });
  }

  function onSalaryAdjustment() {
    if (!salaryForm.employeeId) {
      toast.current?.show({ severity: 'warn', summary: 'Validation', detail: 'Employee is required' });
      return;
    }
    setSalaryAdjustments((prev) => [...prev, { id: Date.now(), ...salaryForm }]);
    setShowSalaryModal(false);
    setSalaryForm({ employeeId: '', base: '', allowance: '', deduction: '' });
    toast.current?.show({ severity: 'success', summary: 'Salary adjusted' });
  }

  const empHeader = (
    <div className="p-d-flex p-ai-center p-jc-between w-full">
      <span className="text-700">Employees</span>
      <Button label="Add Employee" icon="pi pi-plus" onClick={() => setShowCreateEmp(true)} />
    </div>
  );

  return (
    <div className="admin-page">
      <Toast ref={toast} />

      {/* Employees CRUD */}
      <div className="page-card shadow-1">
        <Card title="Manage Employees">
          <DataTable value={employees} header={empHeader} stripedRows showGridlines emptyMessage="No employees yet" paginator rows={5}>
            <Column field="name" header="Name" sortable />
            <Column field="email" header="Email" sortable />
            <Column field="role" header="Role" body={(r) => <Tag value={r.role} severity={r.role === 'admin' ? 'danger' : 'info'} />} />
            <Column field="department" header="Department" />
            <Column field="phone" header="Phone" />
          </DataTable>
        </Card>
      </div>

      {/* Attendance corrections */}
      <div className="page-card shadow-1 mt-4">
        <Card title="Attendance Corrections" subTitle={<Button label="New Correction" icon="pi pi-pencil" onClick={() => setShowAttendanceModal(true)} className="p-button-sm" />}>
          <DataTable value={attendanceCorrections} stripedRows showGridlines emptyMessage="No corrections" paginator rows={5}>
            <Column field="employeeId" header="Employee ID" />
            <Column field="date" header="Date" />
            <Column field="status" header="Status" />
            <Column field="checkIn" header="Check-in" />
            <Column field="checkOut" header="Check-out" />
          </DataTable>
        </Card>
      </div>

      {/* Salary adjustments */}
      <div className="page-card shadow-1 mt-4">
        <Card title="Salary Adjustments" subTitle={<Button label="New Adjustment" icon="pi pi-wallet" onClick={() => setShowSalaryModal(true)} className="p-button-sm" />}>
          <DataTable value={salaryAdjustments} stripedRows showGridlines emptyMessage="No adjustments" paginator rows={5}>
            <Column field="employeeId" header="Employee ID" />
            <Column field="base" header="Base" />
            <Column field="allowance" header="Allowance" />
            <Column field="deduction" header="Deduction" />
          </DataTable>
        </Card>
      </div>

      {/* Dialogs */}
      <Dialog header="Add Employee" visible={showCreateEmp} style={{ width: '32rem' }} modal onHide={() => setShowCreateEmp(false)}>
        <div className="p-fluid">
          <FloatLabel>
            <InputText id="emp_name" value={empForm.name} onChange={(e) => setEmpForm({ ...empForm, name: e.target.value })} />
            <label htmlFor="emp_name">Full Name</label>
          </FloatLabel>
          <div className="p-mt-3">
            <FloatLabel>
              <InputText id="emp_email" type="email" value={empForm.email} onChange={(e) => setEmpForm({ ...empForm, email: e.target.value })} />
              <label htmlFor="emp_email">Email</label>
            </FloatLabel>
          </div>
          <div className="p-mt-3">
            <FloatLabel>
              <InputText id="emp_department" value={empForm.department} onChange={(e) => setEmpForm({ ...empForm, department: e.target.value })} />
              <label htmlFor="emp_department">Department</label>
            </FloatLabel>
          </div>
          <div className="p-mt-3">
            <FloatLabel>
              <InputText id="emp_phone" value={empForm.phone} onChange={(e) => setEmpForm({ ...empForm, phone: e.target.value })} />
              <label htmlFor="emp_phone">Phone</label>
            </FloatLabel>
          </div>
          <div className="p-mt-4">
            <Button label="Create" icon="pi pi-check" onClick={onCreateEmployee} />
          </div>
        </div>
      </Dialog>

      <Dialog header="Attendance Correction" visible={showAttendanceModal} style={{ width: '32rem' }} modal onHide={() => setShowAttendanceModal(false)}>
        <div className="p-fluid">
          <FloatLabel>
            <InputText id="ac_emp" value={attendanceForm.employeeId} onChange={(e) => setAttendanceForm({ ...attendanceForm, employeeId: e.target.value })} />
            <label htmlFor="ac_emp">Employee ID</label>
          </FloatLabel>
          <div className="p-mt-3">
            <FloatLabel>
              <InputText id="ac_date" value={attendanceForm.date} onChange={(e) => setAttendanceForm({ ...attendanceForm, date: e.target.value })} />
              <label htmlFor="ac_date">Date (YYYY-MM-DD)</label>
            </FloatLabel>
          </div>
          <div className="p-mt-3">
            <FloatLabel>
              <InputText id="ac_status" value={attendanceForm.status} onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })} />
              <label htmlFor="ac_status">Status</label>
            </FloatLabel>
          </div>
          <div className="p-mt-3">
            <FloatLabel>
              <InputText id="ac_in" value={attendanceForm.checkIn} onChange={(e) => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })} />
              <label htmlFor="ac_in">Check-in (HH:mm)</label>
            </FloatLabel>
          </div>
          <div className="p-mt-3">
            <FloatLabel>
              <InputText id="ac_out" value={attendanceForm.checkOut} onChange={(e) => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })} />
              <label htmlFor="ac_out">Check-out (HH:mm)</label>
            </FloatLabel>
          </div>
          <div className="p-mt-4">
            <Button label="Save Correction" icon="pi pi-check" onClick={onAttendanceCorrection} />
          </div>
        </div>
      </Dialog>

      <Dialog header="Salary Adjustment" visible={showSalaryModal} style={{ width: '32rem' }} modal onHide={() => setShowSalaryModal(false)}>
        <div className="p-fluid">
          <FloatLabel>
            <InputText id="sa_emp" value={salaryForm.employeeId} onChange={(e) => setSalaryForm({ ...salaryForm, employeeId: e.target.value })} />
            <label htmlFor="sa_emp">Employee ID</label>
          </FloatLabel>
          <div className="p-mt-3">
            <FloatLabel>
              <InputText id="sa_base" value={salaryForm.base} onChange={(e) => setSalaryForm({ ...salaryForm, base: e.target.value })} />
              <label htmlFor="sa_base">Base</label>
            </FloatLabel>
          </div>
          <div className="p-mt-3">
            <FloatLabel>
              <InputText id="sa_allowance" value={salaryForm.allowance} onChange={(e) => setSalaryForm({ ...salaryForm, allowance: e.target.value })} />
              <label htmlFor="sa_allowance">Allowance</label>
            </FloatLabel>
          </div>
          <div className="p-mt-3">
            <FloatLabel>
              <InputText id="sa_deduction" value={salaryForm.deduction} onChange={(e) => setSalaryForm({ ...salaryForm, deduction: e.target.value })} />
              <label htmlFor="sa_deduction">Deduction</label>
            </FloatLabel>
          </div>
          <div className="p-mt-4">
            <Button label="Save Adjustment" icon="pi pi-check" onClick={onSalaryAdjustment} />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
