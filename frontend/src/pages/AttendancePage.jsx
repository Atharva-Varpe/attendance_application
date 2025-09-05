import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.jsx';
import { Calendar } from '../components/ui/calendar.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Skeleton } from '../components/ui/skeleton.jsx';
import { useAuth } from '../context/useAuth.js';
import './styles/_attendance.scss';

// Attendance Report: display-only for employees to view their own records
export default function AttendancePage() {
  const { user, getAttendanceByEmployee } = useAuth();
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
    let ignore = false;
    async function load() {
      setLoading(true);
      const empId = user?.employee_id || user?.employeeId;
      if (!empId) {
        setRows([]);
        setLoading(false);
        return;
      }
      const res = await getAttendanceByEmployee(empId);
      if (!ignore) {
        if (res.ok) {
          const mapped = (res.data || []).map(r => ({
            date: r.attendance_date,
            checkIn: r.clock_in_time,
            checkOut: r.clock_out_time,
            status: r.clock_in_time ? 'Present' : 'Absent',
          }));
          setRows(mapped);
        }
        setLoading(false);
      }
    }
    load();
    return () => { ignore = true };
  }, [user, getAttendanceByEmployee]);

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
    const map = { Present: 'success', Absent: 'destructive', Late: 'warning', Leave: 'info' };
    return <Badge variant={map[r.status] || 'secondary'}>{r.status}</Badge>;
  };
  const time = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-');

  return (
    <div className="attendance-page">
      <Toast ref={toast} />
      <Card className="mb-4 transition-all duration-300 hover:shadow-lg">
        <CardHeader>
          <CardTitle>
            <div className="page-header">
              <h1 className="m-0 text-2xl font-semibold">Attendance Report</h1>
              <p className="text-sm text-muted-foreground">View your attendance history and monthly summary</p>
            </div>
          </CardTitle>
        </CardHeader>
      </Card>

      <div className="attendance-grid">
        <div className="attendance-main">
          <div className="section-title">Attendance Records</div>
          
          <div className="controls">
            <div className="selector">
              <label>Filter by Status</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="selector">
              <label>Date Range</label>
              <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                numberOfMonths={2}
              />
            </div>
          </div>

          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
              <Skeleton className="h-8" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead>Check-out Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No attendance records found
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((record, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(record.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="attendance-status">
                          <span className={`status-icon ${record.status.toLowerCase()}`}></span>
                          {statusBody(record)}
                        </div>
                      </TableCell>
                      <TableCell>{time(record.checkIn)}</TableCell>
                      <TableCell>{time(record.checkOut)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="attendance-sidebar">
          <Card className="transition-all duration-300 hover:shadow-lg">
            <CardHeader>
              <CardTitle>Monthly Summary</CardTitle>
            </CardHeader>
            <CardContent>
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
                  <span className="item-value text-green-600 dark:text-green-400">{summary.Present}</span>
                </div>
                <div className="summary-item">
                  <span className="item-label">Absent Days</span>
                  <span className="item-value text-red-600 dark:text-red-400">{summary.Absent}</span>
                </div>
                <div className="summary-item">
                  <span className="item-label">Late Arrivals</span>
                  <span className="item-value text-yellow-600 dark:text-yellow-400">{summary.Late}</span>
                </div>
                <div className="summary-item">
                  <span className="item-label">Leaves Taken</span>
                  <span className="item-value text-blue-600 dark:text-blue-400">{summary.Leave}</span>
                </div>
              </>
            )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
