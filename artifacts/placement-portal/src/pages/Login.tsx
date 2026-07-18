import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (role: 'company' | 'student' | 'admin') => {
    const credentials = {
      company: { email: 'hr@techcorp.com', password: 'company123' },
      student: { email: 'aanya@students.edu', password: 'student123' },
      admin:   { email: 'admin@university.edu', password: 'admin123' },
    };
    setLoading(true);
    try {
      await login(credentials[role]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary rounded-lg mx-auto flex items-center justify-center text-primary-foreground font-bold text-xl mb-6 shadow-sm">
            U
          </div>
          <h1 className="text-3xl font-bold tracking-tight">System Access</h1>
          <p className="text-muted-foreground">University Placement Portal</p>
        </div>

        <Card className="glass-panel border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address</label>
                <Input 
                  type="email" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@domain.edu"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Authenticating..." : "Sign In"}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-xs text-muted-foreground font-mono mb-4 text-center">DEMO ACCOUNTS</p>
              <div className="grid grid-cols-3 gap-2">
                <Button variant="outline" size="sm" onClick={() => demoLogin('company')} className="text-xs">Company</Button>
                <Button variant="outline" size="sm" onClick={() => demoLogin('student')} className="text-xs">Student</Button>
                <Button variant="outline" size="sm" onClick={() => demoLogin('admin')} className="text-xs">Admin</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
