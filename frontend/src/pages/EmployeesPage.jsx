import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Toolbar } from 'primereact/toolbar';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { FloatLabel } from 'primereact/floatlabel';
import { Toast } from 'primereact/toast';
import { Tag } from 'primereact/tag';

import { useAuth } from '../context/useAuth.js';
import './styles/_employees.scss';

export default function EmployeesPage() {
  // Use seeded data via Auth context; admin-only DataTable
  const { data } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ id: '', name: '', email: '', role: '', department: '', phone: '', hireDate: '', salary: '', status: 'Active' });
  const toast = useRef(null);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setEmployees(data.getEmployees());
      setLoading(false);
    }, 200);
  }, [data]);

  function createEmployee() {
    // In-memory add for demo
    if (!form.id || !form.name || !form.email) {
      toast.current?.show({ severity: 'warn', summary: 'Validation', detail: 'ID, Name and Email are required' });
      return;
    }
    if (employees.some(e => e.id === form.id)) {
      toast.current?.show({ severity: 'error', summary: 'Duplicate ID', detail: 'Employee ID already exists' });
      return;
    }
    const newEmp = { ...form, salary: Number(form.salary || 0) };
    setEmployees(prev => [...prev, newEmp]);
    setShowCreate(false);
    setForm({ id: '', name: '', email: '', role: '', department: '', phone: '', hireDate: '', salary: '', status: 'Active' });
    toast.current?.show({ severity: 'success', summary: 'Employee created' });
  }

  function deleteEmployee(emp) {
    setEmployees(prev => prev.filter(e => e.id !== emp.id));
    toast.current?.show({ severity: 'success', summary: 'Deleted', detail: `Removed ${emp.name}` });
  }

  const header = useMemo(() => (
    <div className="p-d-flex p-ai-center p-jc-between w-full">
      <InputText value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder="Search..." />
      <Button label="Add Employee" icon="pi pi-plus" onClick={() => setShowCreate(true)} />
    </div>
  ), [globalFilter]);

  const actionTemplate = (row) => (
    <div className="p-d-flex p-gap-2">
      <Button icon="pi pi-eye" rounded text severity="info" tooltip="View Profile" />
      <Button icon="pi pi-wallet" rounded text severity="help" tooltip="View Salary" />
      <Button icon="pi pi-calendar" rounded text severity="secondary" tooltip="View Attendance" />
      <Button icon="pi pi-trash" rounded severity="danger" text onClick={() => deleteEmployee(row)} />
    </div>
  );

  const statusBody = (r) => <Tag value={r.status} severity={r.status === 'Active' ? 'success' : 'danger'} />;

  return (
    <div className="employees-page">
      <Toast ref={toast} />
      <div className="page-card shadow-1">
        <Card title="Employees Directory">
          <DataTable value={employees} loading={loading} paginator rows={10} removableSort stripedRows showGridlines
            header={header} globalFilter={globalFilter} emptyMessage="No employees found" dataKey="id" responsiveLayout="scroll">
            <Column field="id" header="ID" sortable style={{ minWidth: '8rem' }} />
            <Column field="name" header="Name" sortable />
            <Column field="role" header="Role" sortable />
            <Column field="department" header="Department" sortable />
            <Column field="email" header="Email" sortable />
            <Column field="phone" header="Phone" />
            <Column field="hireDate" header="Hire Date" sortable />
            <Column field="salary" header="Salary" body={(r) => r.salary?.toLocaleString?.('en-IN', { style: 'currency', currency: 'INR' })} sortable />
            <Column field="status" header="Status" body={statusBody} sortable />
            <Column header="Actions" body={actionTemplate} style={{ width: '14rem' }} />
          </DataTable>
        </Card>
      </div>

      <Dialog header="Add Employee" visible={showCreate} style={{ width: '36rem' }} modal onHide={() => setShowCreate(false)}>
        <div className="p-fluid p-formgrid p-grid">
          <div className="p-field p-col-12 md:p-col-6">
            <FloatLabel>
              <InputText id="id" value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} />
              <label htmlFor="id">Employee ID</label>
            </FloatLabel>
          </div>
          <div className="p-field p-col-12 md:p-col-6">
            <FloatLabel>
              <InputText id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              <label htmlFor="name">Full Name</label>
            </FloatLabel>
          </div>
          <div className="p-field p-col-12 md:p-col-6">
            <FloatLabel>
              <InputText id="email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <label htmlFor="email">Email</label>
            </FloatLabel>
          </div>
          <div className="p-field p-col-12 md:p-col-6">
            <FloatLabel>
              <InputText id="phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <label htmlFor="phone">Phone</label>
            </FloatLabel>
          </div>
          <div className="p-field p-col-12 md:p-col-6">
            <FloatLabel>
              <InputText id="role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              <label htmlFor="role">Role</label>
            </FloatLabel>
          </div>
          <div className="p-field p-col-12 md:p-col-6">
            <FloatLabel>
              <InputText id="department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
              <label htmlFor="department">Department</label>
            </FloatLabel>
          </div>
          <div className="p-field p-col-12 md:p-col-6">
            <FloatLabel>
              <InputText id="hireDate" value={form.hireDate} onChange={(e) => setForm({ ...form, hireDate: e.target.value })} />
              <label htmlFor="hireDate">Hire Date (YYYY-MM-DD)</label>
            </FloatLabel>
          </div>
          <div className="p-field p-col-12 md:p-col-6">
            <FloatLabel>
              <InputText id="salary" keyfilter="int" value={form.salary} onChange={(e) => setForm({ ...form, salary: e.target.value })} />
              <label htmlFor="salary">Salary</label>
            </FloatLabel>
          </div>
          <div className="p-col-12 p-mt-2">
            <Button label="Create" icon="pi pi-check" onClick={createEmployee} />
          </div>
        </div>
      </Dialog>
    </div>
  );
}
