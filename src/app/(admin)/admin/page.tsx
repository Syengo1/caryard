import { Suspense } from "react"
import { connection } from "next/server"
import { Activity, Car, CheckCircle2, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { requireStaffOrAdmin } from "@/lib/auth/roles"

async function DashboardContent() {
  await connection()
  await requireStaffOrAdmin()

  const metrics = [
    { title: "Total Inventory", value: "142", icon: Car, trend: "+4 from last week" },
    { title: "Active Leads", value: "28", icon: Activity, trend: "12 require follow-up" },
    { title: "Units Sold (MTD)", value: "15", icon: CheckCircle2, trend: "+20% vs last month" },
    { title: "Total Views", value: "24.5k", icon: TrendingUp, trend: "+15% from last week" },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-heading font-bold tracking-tight">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">Monitor your inventory, incoming leads, and sales performance.</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {metrics.map((metric) => (
          <Card key={metric.title} className="border-border/50 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {metric.title}
              </CardTitle>
              <metric.icon className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold font-heading">{metric.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {metric.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Placeholder for complex tables */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="col-span-1 lg:col-span-2 border-border/50 shadow-sm min-h-[400px]">
          <CardHeader>
            <CardTitle>Recent Leads Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground border-t border-dashed m-4 rounded-md">
            DataTable Component Goes Here
          </CardContent>
        </Card>
        <Card className="col-span-1 border-border/50 shadow-sm min-h-[400px]">
          <CardHeader>
            <CardTitle>Inventory Status</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground border-t border-dashed m-4 rounded-md">
            Doughnut Chart Goes Here
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function AdminDashboardPage() {
  return (
    <Suspense 
      fallback={
        <div className="p-8 space-y-8 w-full">
          <div className="h-10 w-64 bg-muted animate-pulse rounded-md" />
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-muted animate-pulse rounded-xl" />)}
          </div>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  )
}