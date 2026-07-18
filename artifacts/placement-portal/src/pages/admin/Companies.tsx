import { useGetCompanyAnalytics, getGetCompanyAnalyticsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Building, Users, FileText } from "lucide-react";

export default function AdminCompanies() {
  const { data: companies, isLoading } = useGetCompanyAnalytics({
    query: { queryKey: getGetCompanyAnalyticsQueryKey() }
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Partner Companies</h2>
        <p className="text-muted-foreground mt-1">Analytics breakdown by recruiting partner.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center font-mono text-muted-foreground">Loading records...</div>
          ) : !companies || companies.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No companies registered.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-accent/50 text-muted-foreground font-mono text-xs uppercase">
                  <tr>
                    <th className="px-6 py-4 font-medium">Company Name</th>
                    <th className="px-6 py-4 font-medium text-right">Total Postings</th>
                    <th className="px-6 py-4 font-medium text-right">Applications Rcvd</th>
                    <th className="px-6 py-4 font-medium text-right">Selected Candidates</th>
                    <th className="px-6 py-4 font-medium text-right">Conversion Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {companies.map(c => {
                    const conversionRate = c.applicationCount > 0 
                      ? Math.round((c.selectedCount / c.applicationCount) * 100) 
                      : 0;
                    return (
                      <tr key={c.companyId} className="hover:bg-accent/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center font-bold">
                              {c.companyName.charAt(0)}
                            </div>
                            <span className="font-semibold text-foreground">{c.companyName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          {c.postingCount}
                        </td>
                        <td className="px-6 py-4 text-right font-mono">
                          {c.applicationCount}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-emerald-600 font-bold">
                          {c.selectedCount}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <span className="font-mono">{conversionRate}%</span>
                            <div className="w-16 h-1.5 bg-accent rounded-full overflow-hidden">
                              <div className="h-full bg-emerald-500" style={{ width: `${conversionRate}%` }} />
                            </div>
                          </div>
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