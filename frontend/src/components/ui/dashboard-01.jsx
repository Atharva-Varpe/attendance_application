import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card"
import { Badge } from "./badge"
import { Button } from "./button"
import { Skeleton } from "./skeleton"
import { Alert, AlertDescription } from "./alert"
import { useAuth } from "../../context/useAuth"
import { Link } from "react-router-dom"

export function Dashboard01() {
  const { user } = useAuth()
  const [stats, setStats] = React.useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    loading: true,
    error: null
  })
  const [recentActivity, setRecentActivity] = React.useState([])

  React.useEffect(() => {
    const loadData = async () => {
      try {
        // Fetch real employee data
        const employeesRes = await fetch('/api/employees', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })

        if (!employeesRes.ok) throw new Error('Failed to fetch employees')

        const employees = await employeesRes.json()
        const today = new Date().toISOString().slice(0, 10)

        let presentToday = 0
        let absentToday = 0
        const recentRows = []

        // Process each employee's attendance
        for (const emp of employees) {
          try {
            const attendanceRes = await fetch(`/api/attendance/${emp.employee_id}`, {
              headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            })

            if (attendanceRes.ok) {
              const attendanceData = await attendanceRes.json()

              // Find today's attendance record
              const todayRecord = attendanceData.find((record) =>
                record.attendance_date === today
              )

              if (todayRecord) {
                if (todayRecord.clock_in_time) {
                  presentToday++
                } else {
                  absentToday++
                }
              } else {
                absentToday++
              }

              // Get most recent record for recent activity
              if (attendanceData.length > 0) {
                const latest = attendanceData[attendanceData.length - 1]
                recentRows.push({
                  name: emp.full_name,
                  date: latest.attendance_date,
                  status: latest.clock_in_time ? 'Present' : 'Absent',
                  checkIn: latest.clock_in_time,
                  checkOut: latest.clock_out_time
                })
              }
            }
          } catch (error) {
            console.error(`Error fetching attendance for ${emp.full_name}:`, error)
          }
        }

        setStats({
          totalEmployees: employees.length,
          presentToday,
          absentToday,
          loading: false,
          error: null
        })

        setRecentActivity(recentRows.slice(0, 5))
      } catch (error) {
        console.error('Error loading dashboard data:', error)
        setStats(prev => ({ ...prev, loading: false, error: error.message }))
      }
    }

    loadData()
  }, [])

  const StatCard = ({ title, value, description, icon: Icon }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  )

  const RecentActivity = () => (
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest attendance records from your team
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {recentActivity.length === 0 ? (
          <p className="text-sm text-muted-foreground">No recent activity</p>
        ) : (
          recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center">
              <div className="ml-4 space-y-1">
                <p className="text-sm font-medium leading-none">{activity.name}</p>
                <p className="text-sm text-muted-foreground">
                  {activity.status === 'Present'
                    ? `Checked in at ${activity.checkIn ? new Date(activity.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown time'}`
                    : 'Absent today'
                  }
                </p>
              </div>
              <div className="ml-auto font-medium">
                <Badge variant={activity.status === 'Present' ? 'secondary' : 'destructive'}>
                  {activity.status}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )

  if (stats.loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
          <Skeleton className="h-[120px]" />
        </div>
        <Skeleton className="h-[300px]" />
      </div>
    )
  }

  if (stats.error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{stats.error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Welcome back, {user?.name || 'User'}! Here's what's happening today.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Link to="/attendance">
            <Button variant="outline">
              View Attendance
            </Button>
          </Link>
          {user?.role?.toLowerCase() === 'admin' && (
            <Link to="/employees">
              <Button variant="outline">
                Manage Employees
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Employees"
          value={stats.totalEmployees}
          description="Active team members"
        />
        <StatCard
          title="Present Today"
          value={stats.presentToday}
          description={`${stats.totalEmployees > 0 ? Math.round((stats.presentToday / stats.totalEmployees) * 100) : 0}% attendance rate`}
        />
        <StatCard
          title="Absent Today"
          value={stats.absentToday}
          description="Employees not present"
        />
        <StatCard
          title="On Time"
          value={stats.presentToday}
          description="Arrived on time today"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <RecentActivity />
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and shortcuts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/attendance">
              <Button variant="outline" className="w-full justify-start">
                📅 Check Attendance
              </Button>
            </Link>
            <Link to="/salary">
              <Button variant="outline" className="w-full justify-start">
                💼 View Salary
              </Button>
            </Link>
            <Link to="/profile">
              <Button variant="outline" className="w-full justify-start">
                👤 Update Profile
              </Button>
            </Link>
            {user?.role?.toLowerCase() === 'admin' && (
              <>
                <Link to="/employees">
                  <Button variant="outline" className="w-full justify-start">
                    👥 Manage Employees
                  </Button>
                </Link>
                <Link to="/payslips">
                  <Button variant="outline" className="w-full justify-start">
                    💰 Generate Payslips
                  </Button>
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}