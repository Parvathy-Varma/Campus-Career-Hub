import { useState } from "react";
import { useListApplications, getListApplicationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Search } from "lucide-react";

export default function AdminApplications() {
  const [filterStatus, setFilterStatus] = useState<'all' | 'applied' | 'shortlisted' | 'selected' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState("");

  const { data: applications, isLoading } = useListApplications({
    query: { queryKey: getListApplicationsQueryKey() }
  });

  const filteredApps = applications?.filter(app => {
    const statusMatch = filterStatus === 'all' || app.status === filterStatus;
    const searchMatch = !searchTerm || 
      (app.studentName && app.studentName.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (app.postingTitle && app.postingTitle.toLowerCase().includes(searchTerm.toLowerCase()));
    return statusMatch && searchMatch;
  });

  const exportCSV = () => {
    if (!filteredApps || filteredApps.length === 0) return;
    const headers = ['Student Name', 'Email', 'Department', 'CGPA', 'Posting Title', 'Company', 'Status', 'Applied Date'];
    const rows = filteredApps.map(a => [
      a.studentName || '',
      a.studentEmail || '',
      a.studentDepartment || '',
      a.studentCgpa || '',
      a.postingTitle || '',
      a.companyName || '',
      a.status,
      new Date(a.appliedAt).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'all_applications.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">All Applications</h2>
          <p className="text-muted-foreground mt-1">Overview of all student applications.</p>
        </div>
        <Button onClick={exportCSV} variant="outline" disabled={!filteredApps || filteredApps.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto">
          {(['all', 'applied', 'shortlisted', 'selected', 'rejected'] as const).map(f => (
            <Button 
              key={f} 
              variant={filterStatus === f ? "default" : "outline"}
              onClick={() => setFilterStatus(f)}
              className="capitalize"
              size="sm"
            >
              {f}
            </Button>
          ))}
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search student or role..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 border-b border-border bg-muted/20 font-medium">
            Applications ({filteredApps?.length || 0})
          </div>
          {isLoading ? (
            <div className="p-8 text-center font-mono text-muted-foreground">Loading applications...</div>
          ) : !filteredApps || filteredApps.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No applications found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-accent/50 text-muted-foreground font-mono text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">Student</th>
                    <th className="px-6 py-4 font-medium">Department</th>
                    <th className="px-6 py-4 font-medium">CGPA</th>
                    <th className="px-6 py-4 font-medium">Role</th>
                    <th className="px-6 py-4 font-medium">Company</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium text-right">Applied Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredApps.map(app => (
                    <tr key={app.id} className="hover:bg-accent/30 transition-colors">
                      <td className="px-6 py-4 font-medium">{app.studentName}</td>
                      <td className="px-6 py-4">{app.studentDepartment}</td>
                      <td className="px-6 py-4 font-mono">{app.studentCgpa}</td>
                      <td className="px-6 py-4 font-medium text-primary">{app.postingTitle}</td>
                      <td className="px-6 py-4">{app.companyName}</td>
                      <td className="px-6 py-4">
                        <Badge variant={app.status as any}>{app.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-muted-foreground">
                        {new Date(app.appliedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
