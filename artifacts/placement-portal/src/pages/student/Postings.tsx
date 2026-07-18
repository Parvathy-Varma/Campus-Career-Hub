import { useListPostings, getListPostingsQueryKey, useApplyToPosting } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, MapPin, CalendarClock, BookOpen, Clock } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function StudentPostings() {
  const queryClient = useQueryClient();
  const { data: postings, isLoading } = useListPostings(
    { status: 'approved' },
    { query: { queryKey: getListPostingsQueryKey({ status: 'approved' }) } }
  );
  
  const applyMutation = useApplyToPosting();

  const handleApply = async (postingId: number) => {
    try {
      await applyMutation.mutateAsync({ id: postingId, data: { coverLetter: "" } });
      queryClient.invalidateQueries({ queryKey: getListPostingsQueryKey({ status: 'approved' }) });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Browse Roles</h2>
        <p className="text-muted-foreground mt-1">Find and apply to active placement drives.</p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-accent rounded-xl" />)}
        </div>
      ) : !postings || postings.length === 0 ? (
        <Card className="border-dashed bg-transparent">
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <BookOpen className="w-8 h-8 mb-2 opacity-50" />
            <p>No active roles available right now.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {postings.map(posting => (
            <Card key={posting.id} className="transition-all hover:shadow-md border-border/50">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold text-primary">{posting.title}</h3>
                        {posting.hasApplied && <Badge variant="applied">Applied</Badge>}
                      </div>
                      <div className="flex items-center text-muted-foreground gap-2 mt-1">
                        <Building className="w-4 h-4" />
                        <span className="font-medium text-foreground">{posting.companyName}</span>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="w-3 h-3"/> Location</div>
                        <div className="font-medium">{posting.location || 'Not specified'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 flex items-center gap-1">CTC Package</div>
                        <div className="font-mono font-medium">{posting.ctc || 'Not specified'}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 flex items-center gap-1">Eligibility</div>
                        <div className="font-medium">{posting.branches || 'All Branches'} (Min {posting.minCgpa || 0} CGPA)</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 flex items-center gap-1"><CalendarClock className="w-3 h-3"/> Deadline</div>
                        <div className="font-mono text-amber-600 font-medium">{new Date(posting.deadline).toLocaleDateString()}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex lg:flex-col justify-end items-end gap-3 min-w-[140px] border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6">
                     <Button 
                       className="w-full" 
                       disabled={posting.hasApplied || applyMutation.isPending}
                       onClick={() => handleApply(posting.id)}
                       variant={posting.hasApplied ? "secondary" : "default"}
                     >
                       {posting.hasApplied ? "Application Sent" : "Apply Now"}
                     </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}