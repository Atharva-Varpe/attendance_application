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
      
      <div className="page-header">
        <h1>Attendance Report</h1>
        <p>View your attendance history and monthly summary</p>
      </div>

      <div className="attendance-grid">
        <div className="attendance-main">
          <div className="section-title">Attendance Records</div>
          
          <div className="controls">
            <div className="selector">
              <label>Filter by Status</label>
              <Dropdown 
                value={status} 
                options={statusOptions} 
                onChange={(e) => setStatus(e.value)} 
                showClear 
                placeholder="All statuses" 
              />
            </div>
            <div className="selector">
              <label>Date Range</label>
              <Calendar 
                value={range} 
                onChange={(e) => setRange(e.value)} 
                selectionMode="range" 
                readOnlyInput 
                placeholder="Select date range" 
              />
            </div>
          </div>

          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <Skeleton height="2rem" />
              <Skeleton height="2rem" />
              <Skeleton height="2rem" />
              <Skeleton height="2rem" />
              <Skeleton height="2rem" />
            </div>
          ) : (
            <DataTable 
              value={filtered} 
              paginator 
              rows={15} 
              responsiveLayout="scroll" 
              emptyMessage="No attendance records found"
              className="professional-table"
            >
              <Column 
                field="date" 
                header="Date" 
                sortable 
                body={(rowData) => new Date(rowData.date).toLocaleDateString('en-US', { 
                  weekday: 'short', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              />
              <Column 
                field="status" 
                header="Status" 
                body={(rowData) => (
                  <div className="attendance-status">
                    <span className={`status-icon ${rowData.status.toLowerCase()}`}></span>
                    <Tag 
                      value={rowData.status} 
                      severity={
                        rowData.status === 'Present' ? 'success' :
                        rowData.status === 'Absent' ? 'danger' :
                        rowData.status === 'Late' ? 'warning' : 'info'
                      }
                    />
                  </div>
                )}
                sortable 
              />
              <Column 
                header="Check-in Time" 
                body={(r) => time(r.checkIn)} 
              />
              <Column 
                header="Check-out Time" 
                body={(r) => time(r.checkOut)} 
              />
            </DataTable>
          )}
        </div>

        <div className="attendance-sidebar">
          <div className="today-summary">
            <div className="summary-title">Monthly Summary</div>
            {loading ? (
              <>
                <Skeleton height="1.5rem" className="mb-2" />
                <Skeleton height="1.5rem" className="mb-2" />
                <Skeleton height="1.5rem" className="mb-2" />
                <Skeleton height="1.5rem" />
              </>
            ) : (
              <>
                <div className="summary-item">
                  <span className="item-label">Present Days</span>
                  <span className="item-value" style={{ color: '#10b981' }}>{summary.Present}</span>
                </div>
                <div className="summary-item">
                  <span className="item-label">Absent Days</span>
                  <span className="item-value" style={{ color: '#ef4444' }}>{summary.Absent}</span>
                </div>
                <div className="summary-item">
                  <span className="item-label">Late Arrivals</span>
                  <span className="item-value" style={{ color: '#f59e0b' }}>{summary.Late}</span>
                </div>
                <div className="summary-item">
                  <span className="item-label">Leaves Taken</span>
                  <span className="item-value" style={{ color: '#3b82f6' }}>{summary.Leave}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
