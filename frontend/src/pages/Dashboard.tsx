import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { Skeleton } from 'primereact/skeleton';
import { useAuth } from '../context/useAuth';

interface Employee {
  id: string;
  name: string;
}

interface AttendanceRecord {
  date: string;
  status: string;
  checkIn: string;
  checkOut: string;
}

interface RecentRecord extends AttendanceRecord {
  name: string;
}

const Dashboard: React.FC = () => {
  const authData = useAuth() as any;
  const data = authData?.data;

  const [loading, setLoading] = useState(true);
  const [presentToday, setPresentToday] = useState(0);
  const [absentToday, setAbsentToday] = useState(0);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [recent, setRecent] = useState<RecentRecord[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setLoading(true);
    setError('');
    
    try {
      // Mock data for testing
      const mockEmployees = [
        { id: '1', name: 'John Doe' },
        { id: '2', name: 'Jane Smith' },
        { id: '3', name: 'Mike Johnson' },
        { id: '4', name: 'Sarah Wilson' },
        { id: '5', name: 'David Brown' }
      ];

      const mockAttendanceData = {
        '1': [
          { date: '2025-08-10', status: 'Present', checkIn: '2025-08-10T09:00:00Z', checkOut: '2025-08-10T17:30:00Z' },
          { date: '2025-08-09', status: 'Present', checkIn: '2025-08-09T09:15:00Z', checkOut: '2025-08-09T17:45:00Z' }
        ],
        '2': [
          { date: '2025-08-10', status: 'Late', checkIn: '2025-08-10T09:30:00Z', checkOut: '2025-08-10T17:30:00Z' },
          { date: '2025-08-09', status: 'Present', checkIn: '2025-08-09T08:45:00Z', checkOut: '2025-08-09T17:15:00Z' }
        ],
        '3': [
          { date: '2025-08-10', status: 'Absent', checkIn: '', checkOut: '' },
          { date: '2025-08-09', status: 'Present', checkIn: '2025-08-09T09:00:00Z', checkOut: '2025-08-09T17:30:00Z' }
        ],
        '4': [
          { date: '2025-08-10', status: 'Present', checkIn: '2025-08-10T08:55:00Z', checkOut: '2025-08-10T17:25:00Z' },
          { date: '2025-08-09', status: 'Leave', checkIn: '', checkOut: '' }
        ],
        '5': [
          { date: '2025-08-10', status: 'Present', checkIn: '2025-08-10T09:05:00Z', checkOut: '' },
          { date: '2025-08-09', status: 'Present', checkIn: '2025-08-09T09:10:00Z', checkOut: '2025-08-09T17:40:00Z' }
        ]
      };

      setTimeout(() => {
        try {
          let employees = mockEmployees;
          let getAttendanceData = (id: string) => mockAttendanceData[id as keyof typeof mockAttendanceData] || [];

          // Try to use real data if available
          if (data && typeof data.getEmployees === 'function') {
            try {
              employees = data.getEmployees();
              if (typeof data.getAttendanceByEmployee === 'function') {
                getAttendanceData = (id: string) => data.getAttendanceByEmployee(id);
              }
            } catch (err) {
              console.warn('Using mock data due to error with real data:', err);
            }
          } else {
            console.info('Using mock data for dashboard');
          }

          const today = new Date().toISOString().slice(0, 10);
          let present = 0, absent = 0;
          const recentRows: RecentRecord[] = [];
          
          for (const e of employees) {
            const list = getAttendanceData(e.id);
            const todayRec = list.find((r: AttendanceRecord) => r.date === today);
            if (todayRec?.status === 'Present' || todayRec?.status === 'Late') present++;
            else absent++;
            const last = list.slice(-1)[0];
            if (last) recentRows.push({ ...last, name: e.name });
          }
          
          recentRows.sort((a, b) => (a.date < b.date ? 1 : -1));
          setTotalEmployees(employees.length);
          setPresentToday(present);
          setAbsentToday(absent);
          setRecent(recentRows.slice(0, 5));
          setLoading(false);
        } catch (err) {
          console.error('Error processing data:', err);
          setError('Error processing attendance data');
          setLoading(false);
        }
      }, 500);
    } catch (err) {
      console.error('Error in useEffect:', err);
      setError('Error loading dashboard');
      setLoading(false);
    }
  }, [data]);
  const tagSeverity = (status: string) => {
    switch (status) {
      case 'Present': return 'success';
      case 'Late': return 'warning';
      case 'Leave': return 'info';
      case 'Absent': return 'danger';
      default: return 'secondary';
    }
  };

  const formatTime = (iso: string) => iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-';

  const countCard = (title: string, value: number, icon: string, color: string) => (
    <div className="col-12 md:col-4">
      <Card className="shadow-1" style={{ borderRadius: 14 }}>
        <div className="p-d-flex p-jc-between p-ai-center">
          <div>
            <div className="p-card-title" style={{ fontSize: 18, marginBottom: 8 }}>{title}</div>
            <div className="p-card-subtitle">Today</div>
          </div>
          <span className={`pi ${icon}`} style={{ fontSize: 30, color }} />
        </div>
        <div className="p-mt-3" style={{ fontSize: 34, fontWeight: 800, color }}>{value}</div>
      </Card>
    </div>
  );

  const statusBodyTemplate = (rowData: RecentRecord) => {
    return <Tag value={rowData.status} severity={tagSeverity(rowData.status)} />;
  };

  const timeBodyTemplate = (field: 'checkIn' | 'checkOut') => (rowData: RecentRecord) => {
    return formatTime(rowData[field]);
  };

  return (
    <div className="p-0">
      <div
        className="p-3"
        style={{
          background: 'linear-gradient(135deg, rgba(79,70,229,0.08), rgba(14,165,233,0.08))',
          borderRadius: 12,
          marginBottom: '1rem'
        }}
      >
        <div className="p-d-flex p-jc-between p-ai-center p-flex-wrap" style={{ gap: '0.75rem' }}>
          <div>
            <h2 style={{ margin: 0 }}>Dashboard</h2>
            <div className="text-600">Overview and recent activity</div>
          </div>
          <div className="p-d-flex p-gap-2">
            <Link to="/attendance">
              <Button label="Attendance" icon="pi pi-calendar" className="p-button-outlined" />
            </Link>
            <Link to="/employees">
              <Button label="Employees" icon="pi pi-users" className="p-button-outlined" />
            </Link>
          </div>
        </div>
      </div>

      {error ? (
        <div className="p-3">
          <div className="p-message p-message-error">
            <div className="p-message-wrapper">
              <span className="pi pi-exclamation-triangle"></span>
              <div className="p-message-detail">{error}</div>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="grid">
          <div className="col-12 md:col-4">
            <Skeleton height="180px" />
          </div>
          <div className="col-12 md:col-4">
            <Skeleton height="180px" />
          </div>
          <div className="col-12 md:col-4">
            <Skeleton height="180px" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid">
            {countCard('Total Employees', totalEmployees, 'pi-users', '#4f46e5')}
            {countCard('Present Today', presentToday, 'pi-user-check', '#059669')}
            {countCard('Absent Today', absentToday, 'pi-user-times', '#dc2626')}
          </div>

          <div className="grid mt-6">
            <div className="col-12">
              <Card title="Recent Attendance" subTitle="Latest updates" className="shadow-1" style={{ borderRadius: 14 }}>
                <div className="p-d-flex p-jc-between p-ai-center p-mb-3">
                  <span></span>
                  <Link to="/attendance">
                    <Button label="View All" icon="pi pi-external-link" className="p-button-text" />
                  </Link>
                </div>
                <DataTable 
                  value={recent} 
                  responsiveLayout="scroll"
                  emptyMessage="No recent entries"
                  className="p-datatable-sm"
                >
                  <Column field="name" header="Employee" />
                  <Column field="date" header="Date" />
                  <Column field="status" header="Status" body={statusBodyTemplate} />
                  <Column field="checkIn" header="Check In" body={timeBodyTemplate('checkIn')} />
                  <Column field="checkOut" header="Check Out" body={timeBodyTemplate('checkOut')} />
                </DataTable>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
