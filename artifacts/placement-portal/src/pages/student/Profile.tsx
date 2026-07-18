import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUpdateMyProfile, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UserCircle } from "lucide-react";

export default function StudentProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const updateProfile = useUpdateMyProfile();
  
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    department: user?.department || "",
    cgpa: user?.cgpa?.toString() || "",
    graduationYear: user?.graduationYear?.toString() || "",
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile.mutateAsync({
      data: {
        name: formData.name,
        department: formData.department,
        cgpa: parseFloat(formData.cgpa) || 0,
        graduationYear: parseInt(formData.graduationYear, 10) || 0,
      }
    });
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <UserCircle className="w-8 h-8 text-primary" />
        <h2 className="text-2xl font-bold tracking-tight">My Profile</h2>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Personal Information</CardTitle>
          {!isEditing && (
            <Button variant="outline" size="sm" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  required 
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input value={user?.email || ""} disabled className="bg-muted" />
              </div>
              <div>
                <label className="text-sm font-medium">Department</label>
                <Input 
                  value={formData.department} 
                  onChange={e => setFormData({ ...formData, department: e.target.value })} 
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">CGPA</label>
                  <Input 
                    type="number" 
                    step="0.1" 
                    min="0" 
                    max="10" 
                    value={formData.cgpa} 
                    onChange={e => setFormData({ ...formData, cgpa: e.target.value })} 
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Graduation Year</label>
                  <Input 
                    type="number" 
                    value={formData.graduationYear} 
                    onChange={e => setFormData({ ...formData, graduationYear: e.target.value })} 
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-sm text-muted-foreground">Name</div>
                  <div className="font-medium">{user?.name}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Email</div>
                  <div className="font-medium">{user?.email}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Department</div>
                  <div className="font-medium">{user?.department || 'Not specified'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">CGPA</div>
                  <div className="font-mono font-medium">{user?.cgpa || 'Not specified'}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Graduation Year</div>
                  <div className="font-mono font-medium">{user?.graduationYear || 'Not specified'}</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
