import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AdminDashboard } from "@/components/dashboard/AdminDashboard";
import { TutorDashboard } from "@/components/dashboard/TutorDashboard";
import Footer from "@/components/layout/Footer";
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
        console.log("User email:", session.user.email);

        // First, try to get the existing profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profileError) {
          if (profileError.code === 'PGRST116') {
            console.log("No profile found, creating one...");
            // Set role based on email
            const role = session.user.email === 'demo@admin.com' ? 'admin' : 'tutor';
            console.log("Setting role to:", role);
            
            // Create a default profile with the determined role
            const { data: newProfile, error: insertError } = await supabase
              .from('profiles')
              .insert([
                { 
                  id: session.user.id,
                  role: role,
                  email: session.user.email
                }
              ])
              .select()
              .single();

            if (insertError) {
              console.error('Error creating profile:', insertError);
              throw insertError;
            }

            setUserRole(newProfile.role as 'admin' | 'tutor');
          } else {
            console.error('Error fetching profile:', profileError);
            throw profileError;
          }
        } else {
          console.log("Profile found:", profile);
          // If the user is demo@admin.com and doesn't have admin role, update it
          if (session.user.email === 'demo@admin.com' && profile.role !== 'admin') {
            console.log("Updating demo@admin.com to admin role");
            const { error: updateError } = await supabase
              .from('profiles')
              .update({ role: 'admin' })
              .eq('id', session.user.id);

            if (updateError) {
              console.error('Error updating profile:', updateError);
              throw updateError;
            }
            setUserRole('admin');
          } else {
            setUserRole(profile.role as 'admin' | 'tutor');
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        toast({
          title: "Error",
          description: "Failed to load user profile",
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900"></div>
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
    <div className="min-h-screen flex flex-col bg-warm-gray-50">
      <header className="bg-blue-900 text-white shadow-lg w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-semibold">
            {userRole === 'admin' ? 'Admin Dashboard' : 'Tutor Dashboard'}
          </h1>
          <Button 
            variant="outline" 
            onClick={handleSignOut}
            className="bg-yellow-400 hover:bg-yellow-500 text-blue-900"
          >
            Sign Out
          </Button>
        </div>
      </header>

      <main className="flex-grow w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {userRole === 'admin' ? <AdminDashboard /> : <TutorDashboard />}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Dashboard;