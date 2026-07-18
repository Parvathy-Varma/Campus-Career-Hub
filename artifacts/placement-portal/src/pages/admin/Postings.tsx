import { useState } from "react";
import { useListPostings, getListPostingsQueryKey, useBulkApprovePostings, useBulkRejectPostings } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Link } from "wouter";
import { Search, CheckCircle2, XCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function AdminPostings() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [rejectReason, setRejectReason] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  const { data: postings, isLoading } = useListPostings(
    filter === 'all' ? undefined : { status: filter },
    { query: { queryKey: getListPostingsQueryKey(filter === 'all' ? undefined : { status: filter }) } }
  );

  const bulkApprove = useBulkApprovePostings();
  const bulkReject = useBulkRejectPostings();

  const handleBulkApprove = async () => {
    if (selectedIds.length === 0) return;
    await bulkApprove.mutateAsync({ data: { ids: selectedIds } });
    setSelectedIds([]);
    queryClient.invalidateQueries({ queryKey: getListPostingsQueryKey() });
  };

  const handleBulkReject = async () => {
    if (!rejectReason || selectedIds.length === 0) return;
    await bulkReject.mutateAsync({ data: { ids: selectedIds, reason: rejectReason } });
    setSelectedIds([]);
    setRejectReason("");
    setIsRejecting(false);
    queryClient.invalidateQueries({ queryKey: getListPostingsQueryKey() });
  };

  const filteredPostings = postings?.filter(p => {
    return !searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.companyName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const pendingPostings = filteredPostings?.filter(p => p.status === 'pending') || [];
  const allPendingSelected = pendingPostings.length > 0 && selectedIds.length === pendingPostings.length;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(pendingPostings.map(p => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelection = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Postings Directory</h2>
          <p className="text-muted-foreground mt-1">Manage all recruitment drives.</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <div className="flex gap-2 overflow-x-auto w-full sm:w-auto">
          {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
            <Button 
              key={f} 
              variant={filter === f ? "default" : "outline"}
              onClick={() => { setFilter(f); setSelectedIds([]); setIsRejecting(false); }}
              className="capitalize"
              size="sm"
            >
              {f}
            </Button>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search company or role..." 
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {selectedIds.length > 0 && (
        <Card className="border-primary/50 bg-primary/5 shadow-md">
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="font-medium text-primary">
              {selectedIds.length} posting{selectedIds.length === 1 ? '' : 's'} selected
            </div>
            
            {isRejecting ? (
              <div className="flex w-full sm:w-auto gap-2 items-center">
                <Input 
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection..."
                  className="w-full sm:w-64 bg-background"
                />
                <Button size="sm" variant="destructive" onClick={handleBulkReject} disabled={!rejectReason || bulkReject.isPending}>
                  Confirm Reject
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setIsRejecting(false)}>Cancel</Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setSelectedIds([])}>Clear</Button>
                <Button size="sm" variant="destructive" onClick={() => setIsRejecting(true)}>
                  <XCircle className="w-4 h-4 mr-2" /> Reject All
                </Button>
                <Button size="sm" onClick={handleBulkApprove} disabled={bulkApprove.isPending}>
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Approve All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center font-mono text-muted-foreground">Loading directory...</div>
          ) : !filteredPostings || filteredPostings.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No postings found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-accent/50 text-muted-foreground font-mono text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium w-12">
                      <Checkbox 
                        checked={allPendingSelected && pendingPostings.length > 0} 
                        onCheckedChange={handleSelectAll}
                        disabled={pendingPostings.length === 0}
                      />
                    </th>
                    <th className="px-6 py-4 font-medium">Company / Role</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Deadline</th>
                    <th className="px-6 py-4 font-medium text-right">Applicants</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPostings.map(p => {
                    const isPending = p.status === 'pending';
                    return (
                      <tr key={p.id} className={`hover:bg-accent/30 transition-colors ${selectedIds.includes(p.id) ? 'bg-primary/5' : ''}`}>
                        <td className="px-6 py-4">
                          {isPending && (
                            <Checkbox 
                              checked={selectedIds.includes(p.id)}
                              onCheckedChange={(checked) => toggleSelection(p.id, checked as boolean)}
                            />
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold text-foreground">{p.companyName}</div>
                          <div className="text-muted-foreground">{p.title}</div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant={p.status as any}>{p.status}</Badge>
                        </td>
                        <td className="px-6 py-4 font-mono text-muted-foreground">
                          {new Date(p.deadline).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right font-mono font-medium">
                          {p.applicationCount || 0}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link href={`/admin/postings/${p.id}`}>
                            <Button variant="ghost" size="sm">Review</Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}