import React, { useEffect, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Input } from '../components/ui/input.jsx';
import { Tag } from 'primereact/tag';
import { Toast } from 'primereact/toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
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

  const header = (
    <div className="flex items-end justify-between gap-4 flex-wrap">
      <div>
        <h2 className="m-0 text-2xl font-semibold">Employee Directory</h2>
        <div className="text-sm text-muted-foreground">{employees.length} employees</div>
      </div>
      <div className="employees-search">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <Input
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            placeholder="Search employees..."
            className="employees-search-input"
          />
        </span>
      </div>
    </div>
  );

  return (
    <>
      <Toast ref={toast} />
      <div className="employees-page">
        <Card className="employees-card transition-all duration-300 hover:shadow-lg">
          <CardHeader>
            <CardTitle className="w-full">{header}</CardTitle>
          </CardHeader>
          <CardContent>
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
          </CardContent>
        </Card>
      </div>
    </>
  );
}
