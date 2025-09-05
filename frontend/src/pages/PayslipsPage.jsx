import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card.jsx';
import { Input } from '../components/ui/input.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select.jsx';
import { Button } from '../components/ui/button.jsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table.jsx';
import { useAuth } from '../context/useAuth.js';

export default function PayslipsPage() {
  const { generatePayslips, listPayslips, updatePayslipStatus, exportPayslipCsvUrl } = useAuth();
  const toast = React.useRef(null);
  const [month, setMonth] = React.useState('');
  const [employeeId, setEmployeeId] = React.useState('');
  const [status, setStatus] = React.useState('');
  const [rows, setRows] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  async function reload() {
    setLoading(true);
    const params = {};
    if (month) params.month = month;
    if (status) params.status = status;
    const res = await listPayslips(params);
    if (res.ok) setRows(res.data || []);
    setLoading(false);
  }

  React.useEffect(() => { reload(); }, []);

  async function onGenerate() {
    if (!month) {
      toast.current?.show({ severity: 'warn', summary: 'Validation', detail: 'Month is required (YYYY-MM)' });
      return;
    }
    const res = await generatePayslips(month, employeeId ? Number(employeeId) : undefined);
    toast.current?.show({ severity: res.ok ? 'success' : 'error', summary: res.ok ? 'Generated' : 'Error', detail: res.ok ? 'Payslips generated' : res.error });
    reload();
  }

  async function onFinalize(row) {
    const res = await updatePayslipStatus(row.payslip_id, 'Finalized');
    toast.current?.show({ severity: res.ok ? 'success' : 'error', summary: res.ok ? 'Finalized' : 'Error', detail: res.ok ? 'Payslip finalized' : res.error });
    reload();
  }

  return (
    <div className="p-3">
      <Toast ref={toast} />
      <div className="page-header">
        <h1>Payslips</h1>
        <p>Generate and manage monthly payslips</p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Generate Payslips</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Input value={month} onChange={(e) => setMonth(e.target.value)} placeholder="Month (YYYY-MM)" />
            <Input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} placeholder="Employee ID (optional)" />
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All</SelectItem>
                <SelectItem value="Draft">Draft</SelectItem>
                <SelectItem value="Finalized">Finalized</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={onGenerate}>
              <span className="mr-2">⚙️</span>
              Generate
            </Button>
            <Button variant="outline" onClick={reload}>
              <span className="mr-2">🔄</span>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead>Days</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Gross</TableHead>
            <TableHead>Payable</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted-foreground">
                No payslips
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.payslip_id}</TableCell>
                <TableCell>{row.employee_id}</TableCell>
                <TableCell>{row.pay_period_start}</TableCell>
                <TableCell>{row.pay_period_end}</TableCell>
                <TableCell>{row.days_present}</TableCell>
                <TableCell>{row.total_days_in_month}</TableCell>
                <TableCell>{row.gross_salary_at_time}</TableCell>
                <TableCell>{row.payable_salary}</TableCell>
                <TableCell>{row.status}</TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <a href={exportPayslipCsvUrl(row.payslip_id)} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm">
                        <span className="mr-1">📥</span>
                        CSV
                      </Button>
                    </a>
                    {row.status !== 'Finalized' && (
                      <Button variant="outline" size="sm" onClick={() => onFinalize(row)}>
                        <span className="mr-1">✅</span>
                        Finalize
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}


