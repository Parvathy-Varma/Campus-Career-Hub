import { useState } from "react";
import { useCreatePosting } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function NewPosting() {
  const [, setLocation] = useLocation();
  const createPosting = useCreatePosting();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eligibility: "",
    minCgpa: "",
    branches: "",
    ctc: "",
    location: "",
    slots: "",
    deadline: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPosting.mutateAsync({
        data: {
          ...formData,
          minCgpa: formData.minCgpa ? Number(formData.minCgpa) : undefined,
          slots: formData.slots ? Number(formData.slots) : undefined,
        }
      });
      setLocation("/company/dashboard");
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Create New Role</h2>
        <p className="text-muted-foreground mt-1">Submit a new job requirement for approval.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid gap-2">
                <label className="text-sm font-medium">Role Title</label>
                <Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Software Engineer II" />
              </div>
              
              <div className="grid gap-2">
                <label className="text-sm font-medium">Description</label>
                <textarea 
                  required
                  className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})} 
                  placeholder="Job responsibilities..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">CTC Package</label>
                  <Input value={formData.ctc} onChange={e => setFormData({...formData, ctc: e.target.value})} placeholder="e.g. 12 LPA" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Location</label>
                  <Input value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="e.g. Bangalore" />
                </div>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium">Eligible Branches (comma separated)</label>
                <Input value={formData.branches} onChange={e => setFormData({...formData, branches: e.target.value})} placeholder="CSE, IT, ECE" />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Min CGPA</label>
                  <Input type="number" step="0.1" value={formData.minCgpa} onChange={e => setFormData({...formData, minCgpa: e.target.value})} placeholder="7.5" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Available Slots</label>
                  <Input type="number" value={formData.slots} onChange={e => setFormData({...formData, slots: e.target.value})} placeholder="5" />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium">Application Deadline</label>
                  <Input type="date" required value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-border">
              <Button type="button" variant="outline" onClick={() => setLocation("/company/dashboard")}>Cancel</Button>
              <Button type="submit" disabled={createPosting.isPending}>
                {createPosting.isPending ? "Submitting..." : "Submit for Approval"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}