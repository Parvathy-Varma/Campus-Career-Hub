import { useGetPosting, getGetPostingQueryKey, useListPostingApplications, getListPostingApplicationsQueryKey, useUpdateApplicationStatus, useClosePosting } from "@workspace/api-client-react";
import { useParams } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { Download, XCircle } from "lucide-react";
import { useState } from "react";

export default function CompanyPostingDetail() {
  const params = useParams();
  const id = Number(params.id);
  const queryClient = useQueryClient();

  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const { data: posting, isLoading: postingLoading } = useGetPosting(id, {
    query: { enabled: !!id, queryKey: getGetPostingQueryKey(id) }
  });

  const { data: applications, isLoading: appsLoading } = useListPostingApplications(id, {
    query: { enabled: !!id, queryKey: getListPostingApplicationsQueryKey(id) }
  });

  const updateStatus = useUpdateApplicationStatus();
  const closePostingMutation = useClosePosting();

  const handleUpdateStatus = async (appId: number, status: 'shortlisted' | 'selected' | 'rejected') => {
    await updateStatus.mutateAsync({ id: appId, data: { status } });
    queryClient.invalidateQueries({ queryKey: getListPostingApplicationsQueryKey(id) });
  };

  const handleClosePosting = async () => {
    await closePostingMutation.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getGetPostingQueryKey(id) });
    setShowCloseConfirm(false);
  };

  const exportCSV = () => {
    if (!applications || applications.length === 0) return;
    const headers = ['Name', 'Email', 'Department', 'CGPA', 'Status', 'Applied Date'];
    const rows = applications.map(a => [
      a.studentName || '',
      a.studentEmail || '',
      a.studentDepartment || '',
      a.studentCgpa || '',
      a.status,
      new Date(a.appliedAt).toLocaleDateString()
    ]);
    const csv = [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'applicants.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (postingLoading || !posting) return <div className="font-mono">Loading details...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">{posting.title}</h2>
            <Badge variant={posting.status as any}>{posting.status}</Badge>
          </div>
          <p className="text-muted-foreground mt-1">Created on {new Date(posting.createdAt).toLocaleDateString()}</p>
        </div>
        
        {posting.status === 'approved' && (
          <div className="flex items-center gap-2">
            {showCloseConfirm ? (
              <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-3 py-1.5 rounded-md text-sm border border-destructive/20">
                <span className="font-medium">Are you sure? This cannot be undone.</span>
                <Button size="sm" variant="destructive" onClick={handleClosePosting} disabled={closePostingMutation.isPending}>Confirm</Button>
                <Button size="sm" variant="ghost" className="hover:bg-destructive/10" onClick={() => setShowCloseConfirm(false)}>Cancel</Button>
              </div>
            ) : (
              <Button variant="outline" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => setShowCloseConfirm(true)}>
                <XCircle className="w-4 h-4 mr-2" />
                Close Posting
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Role Description</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none text-sm">
              <p className="whitespace-pre-wrap">{posting.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Applications ({applications?.length || 0})</CardTitle>
              {applications && applications.length > 0 && (
                <Button variant="outline" size="sm" onClick={exportCSV}>
                  <Download className="w-4 h-4 mr-2" />
                  Export CSV
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {appsLoading ? (
                <div className="animate-pulse h-20 bg-accent rounded" />
              ) : !applications || applications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No applications received yet.</div>
              ) : (
                <div className="divide-y divide-border">
                  {applications.map(app => (
                    <div key={app.id} className="py-4 flex items-center justify-between">
                      <div>
                        <div className="font-medium">{app.studentName}</div>
                        <div className="text-sm text-muted-foreground flex gap-3 font-mono mt-1">
                          <span>{app.studentDepartment}</span>
                          <span>CGPA: {app.studentCgpa}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={app.status as any}>{app.status}</Badge>
                        {app.status === 'applied' && (
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(app.id, 'shortlisted')}>Shortlist</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(app.id, 'rejected')}>Reject</Button>
                          </div>
                        )}
                        {app.status === 'shortlisted' && (
                          <div className="flex gap-2 ml-4">
                            <Button size="sm" onClick={() => handleUpdateStatus(app.id, 'selected')}>Select</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleUpdateStatus(app.id, 'rejected')}>Reject</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <div className="text-muted-foreground mb-1">Package</div>
                <div className="font-mono font-medium">{posting.ctc || 'N/A'}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Location</div>
                <div className="font-medium">{posting.location || 'N/A'}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Eligible Branches</div>
                <div className="font-medium">{posting.branches || 'All'}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Min CGPA</div>
                <div className="font-mono font-medium">{posting.minCgpa || 'No requirement'}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-1">Deadline</div>
                <div className="font-medium">{new Date(posting.deadline).toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}