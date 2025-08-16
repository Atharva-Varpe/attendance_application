import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';
import { Toolbar } from 'primereact/toolbar';
import { useAuth } from '../context/useAuth.js';
import './styles/_employees.scss';

export default function EmployeesPage() {
  const { getEmployees } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');
  const toast = useRef(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  async function loadEmployees() {
    setLoading(true);
    try {
      const response = await getEmployees();
      if (response.ok) {
        setEmployees(response.data);
      } else {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load employees'
        });
      }
    } catch (error) {
      toast.current?.show({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load employees'
      });
    } finally {
      setLoading(false);
    }
  }

  function renderStatusTag(rowData) {
    const severity = rowData.status === 'Active' ? 'success' : 'danger';
    return <Tag value={rowData.status} severity={severity} />;
  }

  const leftToolbarTemplate = () => (
    <div className="employees-toolbar-left">
      <h2>Employee Directory</h2>
      <span className="employees-count">{employees.length} employees</span>
    </div>
  );

  const rightToolbarTemplate = () => (
    <div className="employees-search">
      <span className="p-input-icon-left">
        <i className="pi pi-search" />
        <InputText
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search employees..."
          className="employees-search-input"
        />
      </span>
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <div className="employees-page">
        <Card className="employees-card">
          <Toolbar
            className="employees-toolbar"
            left={leftToolbarTemplate}
            right={rightToolbarTemplate}
          />
          <DataTable
            value={employees}
            loading={loading}
            stripedRows
            showGridlines
            paginator
            rows={10}
            rowsPerPageOptions={[5, 10, 25]}
            globalFilter={globalFilter}
            emptyMessage="No employees found"
            className="employees-table"
          >
            <Column field="employee_id" header="Employee ID" sortable />
            <Column field="name" header="Name" sortable />
            <Column field="email" header="Email" sortable />
            <Column field="role" header="Role" sortable />
            <Column field="department" header="Department" sortable />
            <Column field="phone" header="Phone" />
            <Column field="status" header="Status" body={renderStatusTag} sortable />
          </DataTable>
        </Card>
      </div>
    </>
  );
}
