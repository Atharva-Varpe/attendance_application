import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Toast } from 'primereact/toast';
import { Skeleton } from 'primereact/skeleton';
import { useAuth } from '../context/useAuth.js';
import './styles/_attendance.scss';

// Attendance Report: display-only for employees to view their own records
export default function AttendancePage() {
  const { user, data } = useAuth();
  const toast = useRef(null);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState(null);
  const [range, setRange] = useState(null);

  const statusOptions = [
    { label: 'Present', value: 'Present' },
    { label: 'Absent', value: 'Absent' },
    { label: 'Late', value: 'Late' },
    { label: 'Leave', value: 'Leave' },
  ];

  useEffect(() => {
    setLoading(true);
    // simulate fetch delay
    setTimeout(() => {
      const empId = user?.employeeId;
      const dataRows = empId ? data.getAttendanceByEmployee(empId) : [];
      setRows(dataRows);
      setLoading(false);
    }, 300);
  }, [user]);

  const filtered = useMemo(() => {
    let out = rows;
    if (status) out = out.filter(r => r.status === status);
    if (range?.[0] && range?.[1]) {
      const [s, e] = range;
      const sYMD = ymd(s), eYMD = ymd(e);
      out = out.filter(r => r.date >= sYMD && r.date <= eYMD);
    }
    return out.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [rows, status, range]);

  const summary = useMemo(() => {
    const acc = { Present: 0, Absent: 0, Late: 0, Leave: 0 };
    for (const r of filtered) acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, [filtered]);

  function ymd(d) {
    const dt = new Date(d);
    return dt.toISOString().slice(0, 10);
  }

  const statusBody = (r) => {
    const map = { Present: 'success', Absent: 'danger', Late: 'warning', Leave: 'info' };
    return <Tag value={r.status} severity={map[r.status] || 'secondary'} />;
  };
  const time = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-');

  return (
    <div className="attendance-page">
      <Toast ref={toast} />
      <div className="grid">
        <div className="col-12 lg:col-9">
          <Card title="Attendance Report" subTitle="Last month">
            <div className="p-d-flex p-ai-center p-gap-3 mb-3 p-flex-wrap">
              <div>
                <label className="p-mb-1 block">Status</label>
                <Dropdown value={status} options={statusOptions} onChange={(e) => setStatus(e.value)} showClear placeholder="Filter status" />
              </div>
              <div>
                <label className="p-mb-1 block">Date Range</label>
                <Calendar value={range} onChange={(e) => setRange(e.value)} selectionMode="range" readOnlyInput placeholder="Select range" />
              </div>
            </div>

            {loading ? (
              <div className="p-d-flex p-flex-column p-gap-2">
                <Skeleton height="2rem" />
                <Skeleton height="2rem" />
                <Skeleton height="2rem" />
              </div>
            ) : (
              <DataTable value={filtered} stripedRows showGridlines paginator rows={10} responsiveLayout="scroll" emptyMessage="No records">
                <Column field="date" header="Date" sortable />
                <Column field="status" header="Status" body={statusBody} sortable />
                <Column header="Check-in" body={(r) => time(r.checkIn)} />
                <Column header="Check-out" body={(r) => time(r.checkOut)} />
              </DataTable>
            )}
          </Card>
        </div>
        <div className="col-12 lg:col-3">
          <Card title="Monthly Summary">
            {loading ? (
              <>
                <Skeleton height="1.5rem" className="mb-2" />
                <Skeleton height="1.5rem" className="mb-2" />
                <Skeleton height="1.5rem" className="mb-2" />
                <Skeleton height="1.5rem" />
              </>
            ) : (
              <ul className="p-0" style={{ listStyle: 'none' }}>
                <li className="p-d-flex p-jc-between p-my-2"><span>Present</span><Tag value={summary.Present} severity="success" /></li>
                <li className="p-d-flex p-jc-between p-my-2"><span>Absent</span><Tag value={summary.Absent} severity="danger" /></li>
                <li className="p-d-flex p-jc-between p-my-2"><span>Late</span><Tag value={summary.Late} severity="warning" /></li>
                <li className="p-d-flex p-jc-between p-my-2"><span>Leave</span><Tag value={summary.Leave} severity="info" /></li>
              </ul>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
