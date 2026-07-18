import { useState } from "react";
import { useListPostings, getListPostingsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function AdminPostings() {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  const { data: postings, isLoading } = useListPostings(
    filter === 'all' ? undefined : { status: filter },
    { query: { queryKey: getListPostingsQueryKey(filter === 'all' ? undefined : { status: filter }) } }
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Postings Directory</h2>
          <p className="text-muted-foreground mt-1">Manage all recruitment drives.</p>
        </div>
      </div>

      <div className="flex gap-2 pb-2 overflow-x-auto">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(f => (
          <Button 
            key={f} 
            variant={filter === f ? "default" : "outline"}
            onClick={() => setFilter(f)}
            className="capitalize"
            size="sm"
          >
            {f}
          </Button>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center font-mono text-muted-foreground">Loading directory...</div>
          ) : !postings || postings.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No postings found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-accent/50 text-muted-foreground font-mono text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">Company / Role</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 font-medium">Deadline</th>
                    <th className="px-6 py-4 font-medium text-right">Applicants</th>
                    <th className="px-6 py-4 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {postings.map(p => (
                    <tr key={p.id} className="hover:bg-accent/30 transition-colors">
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