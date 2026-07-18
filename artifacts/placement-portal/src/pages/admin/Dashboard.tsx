import { useGetAnalyticsOverview, getGetAnalyticsOverviewQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building, Users, Briefcase, FileCheck } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { DashboardCharts } from "./DashboardCharts";

export default function AdminDashboard() {
  const { data: analytics, isLoading } = useGetAnalyticsOverview({
    query: { queryKey: getGetAnalyticsOverviewQueryKey() }
  });

  if (isLoading || !analytics) return <div className="p-8 font-mono">Loading telemetry...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Placement Operations</h2>
          <p className="text-muted-foreground mt-1">Real-time campus recruitment metrics.</p>
        </div>
        <div className="flex gap-3">
           <Link href="/admin/postings">
             <Button variant="outline" className="relative">
               Review Postings
               {analytics.pendingApprovals > 0 && (
                 <span className="absolute -top-2 -right-2 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                   {analytics.pendingApprovals}
                 </span>
               )}
             </Button>
           </Link>
           <Link href="/admin/companies">
             <Button>Manage Companies</Button>
           </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Students" value={analytics.totalStudents} icon={Users} trend="+4.2%" />
        <StatCard title="Partner Companies" value={analytics.totalCompanies} icon={Building} trend="+12%" />
        <StatCard title="Placement Rate" value={`${analytics.placementRate}%`} icon={Briefcase} trend="+2.4%" />
        <StatCard title="Pending Approvals" value={analytics.pendingApprovals} icon={FileCheck} valueClass={analytics.pendingApprovals > 0 ? "text-amber-600" : ""} />
      </div>

      <DashboardCharts />
    </div>
  );
}

function StatCard({ title, value, icon: Icon, trend, valueClass }: any) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between space-y-0 pb-2">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Icon className="h-4 w-4 text-primary" />
          </div>
        </div>
        <div className="flex items-baseline gap-2 mt-2">
          <div className={`text-3xl font-bold font-mono tracking-tighter ${valueClass || ''}`}>{value}</div>
          {trend && <span className="text-xs text-emerald-600 font-medium bg-emerald-100 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded">{trend}</span>}
        </div>
      </CardContent>
    </Card>
  );
}