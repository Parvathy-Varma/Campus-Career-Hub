import { useListPostings, getListPostingsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { FileText, PlusCircle, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function CompanyDashboard() {
  const { user } = useAuth();
  const { data: postings, isLoading } = useListPostings(
    { companyId: user?.id },
    { query: { enabled: !!user?.id, queryKey: getListPostingsQueryKey({ companyId: user?.id }) } }
  );

  const activePostings = postings?.filter(p => p.status === 'approved') || [];
  const pendingPostings = postings?.filter(p => p.status === 'pending') || [];

  const chartData = postings?.map(p => ({
    name: p.title.length > 15 ? p.title.substring(0, 15) + '...' : p.title,
    applications: p.applicationCount || 0
  })) || [];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Company Dashboard</h2>
          <p className="text-muted-foreground mt-1">Manage your recruitment drives.</p>
        </div>
        <Link href="/company/postings/new">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Posting
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Roles</p>
              <p className="text-3xl font-bold font-mono mt-1">{activePostings.length}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
              <p className="text-3xl font-bold font-mono mt-1">{pendingPostings.length}</p>
            </div>
            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
              <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
              <p className="text-3xl font-bold font-mono mt-1">
                {postings?.reduce((sum, p) => sum + (p.applicationCount || 0), 0) || 0}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {postings && postings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Application Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} tickMargin={10} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--card))' }}
                  />
                  <Bar dataKey="applications" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Recent Postings</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2].map(i => <div key={i} className="h-16 bg-accent rounded-lg" />)}
            </div>
          ) : !postings || postings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No postings yet. Create one to start recruiting.
            </div>
          ) : (
            <div className="border border-border rounded-lg divide-y divide-border">
              {postings.map(posting => (
                <div key={posting.id} className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors">
                  <div>
                    <Link href={`/company/postings/${posting.id}`}>
                      <h4 className="font-medium hover:underline cursor-pointer">{posting.title}</h4>
                    </Link>
                    <div className="text-sm text-muted-foreground flex gap-4 mt-1">
                      <span>Posted: {new Date(posting.createdAt).toLocaleDateString()}</span>
                      <span>Applicants: <strong className="font-mono text-foreground">{posting.applicationCount || 0}</strong></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={posting.status as any}>{posting.status}</Badge>
                    <Link href={`/company/postings/${posting.id}`}>
                      <Button variant="ghost" size="sm">Manage</Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}