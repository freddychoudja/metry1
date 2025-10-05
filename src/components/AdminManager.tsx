import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Shield, ShieldCheck, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Profile {
  id: string;
  email: string;
  full_name: string;
  is_admin: boolean;
}

export function AdminManager() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, full_name, is_admin")
        .order("email");

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error("Error fetching profiles:", error);
    }
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: !currentStatus })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Admin Status Updated",
        description: `User ${!currentStatus ? "granted" : "revoked"} admin privileges.`,
      });

      fetchProfiles();
    } catch (error) {
      console.error("Error updating admin status:", error);
      toast({
        title: "Error",
        description: "Failed to update admin status.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const makeAdminByEmail = async () => {
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: true })
        .eq("email", email);

      if (error) throw error;

      toast({
        title: "Admin Role Granted",
        description: `${email} is now an admin.`,
      });

      setEmail("");
      fetchProfiles();
    } catch (error) {
      console.error("Error granting admin:", error);
      toast({
        title: "Error",
        description: "Failed to grant admin role. Check if email exists.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Admin Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Enter email to make admin"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Button onClick={makeAdminByEmail} disabled={loading || !email}>
            <Mail className="w-4 h-4 mr-1" />
            Grant Admin
          </Button>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">All Users</h4>
          {profiles.map((profile) => (
            <div key={profile.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
              <div>
                <p className="font-medium text-sm">{profile.email}</p>
                <p className="text-xs text-gray-500">{profile.full_name}</p>
              </div>
              <div className="flex items-center gap-2">
                {profile.is_admin ? (
                  <Badge className="bg-green-100 text-green-800">
                    <ShieldCheck className="w-3 h-3 mr-1" />
                    Admin
                  </Badge>
                ) : (
                  <Badge variant="secondary">User</Badge>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleAdmin(profile.id, profile.is_admin)}
                  disabled={loading}
                >
                  {profile.is_admin ? "Revoke" : "Grant"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}