import { useListApplications, getListApplicationsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Calendar, CheckCircle2, Clock, XCircle } from "lucide-react";

export default function StudentApplications() {
  const { data: applications, isLoading } = useListApplications({
    query: { queryKey: getListApplicationsQueryKey() }
  });

  if (isLoading) return <div className="font-mono">Loading applications...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Applications</h2>
        <p className="text-muted-foreground mt-1">Track the status of your placement drives.</p>
      </div>

      {!applications || applications.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="h-48 flex items-center justify-center text-muted-foreground">
            You haven't applied to any roles yet.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {applications.map(app => (
            <Card key={app.id}>
              <CardContent className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-lg">{app.postingTitle}</h3>
                  <div className="flex items-center text-muted-foreground text-sm gap-4 mt-1">
                    <span className="flex items-center gap-1"><Building className="w-4 h-4" /> {app.companyName}</span>
                    <span className="flex items-center gap-1 font-mono"><Calendar className="w-4 h-4" /> {new Date(app.appliedAt).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 border border-border px-4 py-2 rounded-lg bg-accent/30">
                  <div className="text-sm font-medium text-muted-foreground mr-2">Status</div>
                  <Badge variant={app.status as any} className="text-sm px-3 py-1">
                    {app.status === 'applied' && <Clock className="w-3 h-3 mr-1.5 inline" />}
                    {app.status === 'shortlisted' && <CheckCircle2 className="w-3 h-3 mr-1.5 inline" />}
                    {app.status === 'selected' && <CheckCircle2 className="w-3 h-3 mr-1.5 inline text-emerald-600" />}
                    {app.status === 'rejected' && <XCircle className="w-3 h-3 mr-1.5 inline" />}
                    <span className="capitalize">{app.status}</span>
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}