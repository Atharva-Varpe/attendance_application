/**
 * Enhanced Employees Page with robust API integration
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Edit, Trash2, Search, RefreshCw } from 'lucide-react';
import { useEmployees } from '../hooks/useApi';
import { DataTable } from '../components/DataTable';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { validateObject, validationSchemas, formatters, sanitizeData } from '../utils/dataValidation';

export default function EmployeesPage() {
  const { employees, loading, error, refetch, createEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Employee',
    salary: '',
    department: '',
    phone: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      role: 'Employee',
      salary: '',
      department: '',
      phone: ''
    });
    setFormErrors({});
    setEditingEmployee(null);
  };

  const handleEdit = (employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.full_name || employee.name || '',
      email: employee.email || '',
      role: employee.role || 'Employee',
      salary: employee.gross_monthly_salary || employee.salary || '',
      department: employee.department || '',
      phone: employee.phone_number || employee.phone || ''
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Sanitize input data
    const sanitizedData = sanitizeData(formData);
    
    // Validate form data
    const { isValid, errors } = validateObject(sanitizedData, validationSchemas.employee);
    
    if (!isValid) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    setFormErrors({});

    try {
      const employeeData = {
        name: sanitizedData.name,
        email: sanitizedData.email.toLowerCase(),
        role: sanitizedData.role,
        salary: parseFloat(sanitizedData.salary),
        department: sanitizedData.department,
        phone: sanitizedData.phone
      };

      let response;
      if (editingEmployee) {
        response = await updateEmployee(editingEmployee.employee_id, employeeData);
      } else {
        response = await createEmployee(employeeData);
      }

      if (response.ok) {
        setDialogOpen(false);
        resetForm();
      } else {
        setFormErrors({ general: [response.error || 'Operation failed'] });
      }
    } catch (error) {
      setFormErrors({ general: [error.message] });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (employee) => {
    if (!window.confirm(`Are you sure you want to delete ${employee.full_name || employee.name}?`)) {
      return;
    }

    try {
      const response = await deleteEmployee(employee.employee_id);
      if (!response.ok) {
        alert(`Failed to delete employee: ${response.error}`);
      }
    } catch (error) {
      alert(`Error deleting employee: ${error.message}`);
    }
  };

  const columns = [
    {
      key: 'employee_id',
      header: 'ID',
      render: (value) => <Badge variant="outline">{value}</Badge>
    },
    {
      key: 'full_name',
      header: 'Name',
      render: (value, item) => value || item.name || 'N/A'
    },
    {
      key: 'email',
      header: 'Email'
    },
    {
      key: 'role',
      header: 'Role',
      render: (value) => <Badge variant={value === 'Admin' ? 'default' : 'secondary'}>{value}</Badge>
    },
    {
      key: 'department',
      header: 'Department',
      render: (value) => value || 'N/A'
    },
    {
      key: 'gross_monthly_salary',
      header: 'Salary',
      render: (value, item) => formatters.currency(value || item.salary)
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_, item) => (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleEdit(item)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleDelete(item)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Employees</h2>
          <p className="text-muted-foreground">
            Manage employee records and information
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>
                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
              </DialogTitle>
              <DialogDescription>
                {editingEmployee 
                  ? 'Update employee information below.'
                  : 'Enter the details for the new employee.'
                }
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter full name"
                />
                {formErrors.name && (
                  <p className="text-sm text-destructive">{formErrors.name[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Enter email address"
                />
                {formErrors.email && (
                  <p className="text-sm text-destructive">{formErrors.email[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Employee">Employee</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                    <SelectItem value="Gate">Gate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Monthly Salary *</Label>
                <Input
                  id="salary"
                  type="number"
                  value={formData.salary}
                  onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                  placeholder="Enter monthly salary"
                />
                {formErrors.salary && (
                  <p className="text-sm text-destructive">{formErrors.salary[0]}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Enter department"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
                {formErrors.phone && (
                  <p className="text-sm text-destructive">{formErrors.phone[0]}</p>
                )}
              </div>

              {formErrors.general && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                  <p className="text-sm text-destructive">{formErrors.general[0]}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      {editingEmployee ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingEmployee ? 'Update Employee' : 'Create Employee'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <DataTable
        data={employees || []}
        columns={columns}
        loading={loading}
        error={error}
        onRefresh={refetch}
        searchable={true}
        title="Employee List"
        description={`Total: ${employees?.length || 0} employees`}
        emptyMessage="No employees found. Add your first employee to get started."
      />
    </div>
  );
}
