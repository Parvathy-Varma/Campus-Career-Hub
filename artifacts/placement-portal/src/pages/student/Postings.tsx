import { useState } from "react";
import { useListPostings, getListPostingsQueryKey, useApplyToPosting } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building, MapPin, CalendarClock, BookOpen, Search } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

export default function StudentPostings() {
  const queryClient = useQueryClient();
  const { data: postings, isLoading } = useListPostings(
    { status: 'approved' },
    { query: { queryKey: getListPostingsQueryKey({ status: 'approved' }) } }
  );
  
  const applyMutation = useApplyToPosting();

  const [searchTerm, setSearchTerm] = useState("");
  const [minCgpa, setMinCgpa] = useState("");
  const [branch, setBranch] = useState("");

  const handleApply = async (postingId: number) => {
    try {
      await applyMutation.mutateAsync({ id: postingId, data: { coverLetter: "" } });
      queryClient.invalidateQueries({ queryKey: getListPostingsQueryKey({ status: 'approved' }) });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPostings = postings?.filter(p => {
    const searchMatch = !searchTerm || p.title.toLowerCase().includes(searchTerm.toLowerCase()) || p.companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const cgpaMatch = !minCgpa || (p.minCgpa || 0) <= parseFloat(minCgpa);
    const branchMatch = !branch || (p.branches && p.branches.toLowerCase().includes(branch.toLowerCase()));
    return searchMatch && cgpaMatch && branchMatch;
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Browse Roles</h2>
        <p className="text-muted-foreground mt-1">Find and apply to active placement drives.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl border border-border/50 shadow-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search role or company..." 
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="w-full md:w-56">
          <Input 
            type="number" 
            placeholder="Max CGPA Requirement" 
            step="0.1"
            className="bg-background"
            value={minCgpa}
            onChange={(e) => setMinCgpa(e.target.value)}
          />
        </div>
        <div className="w-full md:w-64">
          <Input 
            placeholder="Filter by branch keyword..." 
            className="bg-background"
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 animate-pulse">
          {[1,2,3].map(i => <div key={i} className="h-40 bg-accent rounded-xl" />)}
        </div>
      ) : !filteredPostings || filteredPostings.length === 0 ? (
        <Card className="border-dashed bg-transparent">
          <CardContent className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <BookOpen className="w-8 h-8 mb-2 opacity-50" />
            <p>No roles match your search criteria.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredPostings.map(posting => {
            const daysLeft = Math.ceil((new Date(posting.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            const isClosed = daysLeft < 0;

            return (
              <Card key={posting.id} className="transition-all hover:shadow-md border-border/50">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row justify-between gap-6">
                    <div className="space-y-4 flex-1">
                      <div>
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-bold text-primary">{posting.title}</h3>
                          {posting.hasApplied && <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">Applied</Badge>}
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
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-foreground font-medium">{new Date(posting.deadline).toLocaleDateString()}</span>
                            {isClosed ? (
                              <Badge variant="secondary" className="bg-muted text-muted-foreground">Closed</Badge>
                            ) : daysLeft <= 2 ? (
                              <Badge variant="destructive">{daysLeft} {daysLeft === 1 ? 'day' : 'days'} left</Badge>
                            ) : daysLeft <= 7 ? (
                              <Badge variant="outline" className="text-amber-600 border-amber-600 bg-amber-50 dark:bg-amber-950/30">{daysLeft} days left</Badge>
                            ) : (
                              <Badge variant="secondary" className="text-muted-foreground">{daysLeft} days left</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex lg:flex-col justify-end items-end gap-3 min-w-[140px] border-t lg:border-t-0 lg:border-l border-border pt-4 lg:pt-0 lg:pl-6">
                       <Button 
                         className="w-full" 
                         disabled={posting.hasApplied || applyMutation.isPending || isClosed}
                         onClick={() => handleApply(posting.id)}
                         variant={posting.hasApplied || isClosed ? "secondary" : "default"}
                       >
                         {posting.hasApplied ? "Application Sent" : isClosed ? "Closed" : "Apply Now"}
                       </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}