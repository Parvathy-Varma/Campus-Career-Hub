import { useGetTimelineAnalytics, getGetTimelineAnalyticsQueryKey, useGetPostingsSummary, getGetPostingsSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, PieChart, Pie, Cell } from "recharts";

export function DashboardCharts() {
  const { data: timeline } = useGetTimelineAnalytics({
    query: { queryKey: getGetTimelineAnalyticsQueryKey() }
  });
  
  const { data: summary } = useGetPostingsSummary({
    query: { queryKey: getGetPostingsSummaryQueryKey() }
  });

  const pieData = summary ? [
    { name: 'Approved', value: summary.approved, color: 'hsl(var(--chart-3))' },
    { name: 'Pending', value: summary.pending, color: 'hsl(var(--chart-2))' },
    { name: 'Closed', value: summary.closed, color: 'hsl(var(--muted-foreground))' },
    { name: 'Rejected', value: summary.rejected, color: 'hsl(var(--chart-4))' },
  ].filter(d => d.value > 0) : [];

  return (
    <div className="grid lg:grid-cols-2 gap-6 mt-6">
      <Card>
        <CardHeader>
          <CardTitle>Placement Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {timeline ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeline} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                  />
                  <Line type="monotone" dataKey="applications" name="Applications" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="placements" name="Placements" stroke="hsl(var(--chart-3))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-mono text-muted-foreground">Loading chart...</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Posting Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={110}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-mono text-muted-foreground">Loading chart...</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}