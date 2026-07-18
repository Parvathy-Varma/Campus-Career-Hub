import { useGetPosting, getGetPostingQueryKey, useApprovePosting, useRejectPosting } from "@workspace/api-client-react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";

export default function AdminPostingDetail() {
  const params = useParams();
  const id = Number(params.id);
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const { data: posting, isLoading } = useGetPosting(id, {
    query: { enabled: !!id, queryKey: getGetPostingQueryKey(id) }
  });

  const approve = useApprovePosting();
  const reject = useRejectPosting();
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);

  const handleApprove = async () => {
    await approve.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getGetPostingQueryKey(id) });
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    await reject.mutateAsync({ id, data: { reason: rejectReason } });
    queryClient.invalidateQueries({ queryKey: getGetPostingQueryKey(id) });
    setShowRejectForm(false);
  };

  if (isLoading || !posting) return <div className="font-mono">Loading document...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight">{posting.companyName}</h2>
            <Badge variant={posting.status as any} className="text-sm px-3">{posting.status}</Badge>
          </div>
          <h3 className="text-lg text-muted-foreground mt-1">{posting.title}</h3>
        </div>
        
        {posting.status === 'pending' && !showRejectForm && (
          <div className="flex gap-3">
            <Button variant="destructive" onClick={() => setShowRejectForm(true)}>Reject</Button>
            <Button onClick={handleApprove} disabled={approve.isPending}>
              {approve.isPending ? "Approving..." : "Approve Posting"}
            </Button>
          </div>
        )}
      </div>

      {showRejectForm && (
        <Card className="border-destructive shadow-sm">
          <CardHeader className="bg-destructive/5 text-destructive border-b border-destructive/10">
            <CardTitle className="text-sm">Provide Rejection Reason</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleReject} className="space-y-4">
              <Input 
                value={rejectReason} 
                onChange={e => setRejectReason(e.target.value)} 
                placeholder="Reason for rejection (sent to company)..." 
                required 
              />
              <div className="flex justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setShowRejectForm(false)}>Cancel</Button>
                <Button type="submit" variant="destructive" disabled={reject.isPending}>Confirm Rejection</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Requirements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground mb-1">Package (CTC)</div>
                <div className="font-mono font-medium">{posting.ctc || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Location</div>
                <div className="font-medium">{posting.location || 'N/A'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Min CGPA</div>
                <div className="font-mono font-medium">{posting.minCgpa || 'None'}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground mb-1">Target Branches</div>
                <div className="font-medium">{posting.branches || 'All'}</div>
              </div>
            </div>
            <div className="pt-4 border-t border-border">
              <div className="text-sm text-muted-foreground mb-1">Application Deadline</div>
              <div className="font-mono text-amber-600 font-bold">{new Date(posting.deadline).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent className="prose dark:prose-invert max-w-none text-sm">
            <p className="whitespace-pre-wrap">{posting.description}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}