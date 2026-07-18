import { useListPostings, getListPostingsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Building, MapPin, Calendar, Users, ChevronRight } from "lucide-react";

export default function StudentDashboard() {
  const { data: postings, isLoading } = useListPostings(
    { status: 'approved' },
    { query: { queryKey: getListPostingsQueryKey({ status: 'approved' }) } }
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Student Dashboard</h2>
        <p className="text-muted-foreground mt-1">Opportunities matched to your profile.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Featured Opportunities</h3>
            <Link href="/student/postings">
              <Button variant="link" className="text-primary pr-0">View all <ChevronRight className="w-4 h-4 ml-1" /></Button>
            </Link>
          </div>
          
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[1, 2, 3].map(i => <div key={i} className="h-32 bg-accent rounded-xl" />)}
            </div>
          ) : (
            <div className="grid gap-4">
              {postings?.slice(0, 4).map(posting => (
                <Card key={posting.id} className="hover:border-primary/50 transition-colors">
                  <CardContent className="p-6 flex flex-col md:flex-row gap-6 md:items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-lg">{posting.title}</h4>
                        {posting.hasApplied && <Badge variant="applied">Applied</Badge>}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground gap-4">
                        <span className="flex items-center gap-1"><Building className="w-4 h-4" /> {posting.companyName}</span>
                        <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {posting.location || 'Remote'}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 md:text-right">
                      <div>
                        <div className="text-sm text-muted-foreground">Package</div>
                        <div className="font-mono font-medium">{posting.ctc || 'Not specified'}</div>
                      </div>
                      <Link href={`/student/postings`}>
                        <Button variant={posting.hasApplied ? "outline" : "default"}>
                          {posting.hasApplied ? "View Status" : "Apply Now"}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>My Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm">Total Applied</span>
                  <span className="font-mono font-bold">12</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-sm">Shortlisted</span>
                  <span className="font-mono font-bold text-purple-600">3</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm">Selected</span>
                  <span className="font-mono font-bold text-emerald-600">1</span>
                </div>
              </div>
              <Link href="/student/applications">
                <Button variant="outline" className="w-full mt-6">View Application History</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
