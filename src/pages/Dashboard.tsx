import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'admin' | 'tutor' | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }
        
        if (!session) {
          console.log('No session found, redirecting to login');
          navigate('/');
          return;
        }

        console.log("Session found for user:", session.user.id);

        // Fetch user role from profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          toast({
            title: "Error",
            description: "Could not fetch user profile",
            variant: "destructive",
          });
          return;
        }

        console.log("Profile data:", profile);
        
        if (!profile) {
          console.log("No profile found for user:", session.user.id);
          toast({
            title: "Profile Not Found",
            description: "Your profile could not be loaded. Please try logging out and back in.",
            variant: "destructive",
          });
          return;
        }

        setUserRole(profile.role as 'admin' | 'tutor');
      } catch (error) {
        console.error('Auth check error:', error);
        toast({
          title: "Error",
          description: "Authentication error occurred",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [navigate, toast]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: "Error",
        description: "Failed to sign out",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Profile Not Found</h2>
          <p className="text-gray-600 mb-4">Your profile could not be loaded.</p>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">
            {userRole === 'admin' ? 'Admin Dashboard' : 'Tutor Dashboard'}
          </h1>
          <Button variant="outline" onClick={handleSignOut}>
            Sign Out
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <p className="text-gray-600">
            Welcome to your {userRole} dashboard. More features coming soon!
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;