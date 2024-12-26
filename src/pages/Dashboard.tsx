import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Database, TimesheetWithSubject } from "@/integrations/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Subject = Database['public']['Tables']['subjects']['Row'];

const AdminDashboard = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('*');
        
        if (error) throw error;
        setSubjects(data || []);
      } catch (error) {
        console.error('Error fetching subjects:', error);
        toast({
          title: "Error",
          description: "Failed to load subjects",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [toast]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="subjects" className="w-full">
        <TabsList className="bg-blue-900/10">
          <TabsTrigger value="subjects">Subjects</TabsTrigger>
          <TabsTrigger value="tutors">Tutors</TabsTrigger>
          <TabsTrigger value="timesheets">Timesheets</TabsTrigger>
        </TabsList>
        <TabsContent value="subjects" className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Manage Subjects</h3>
          <div className="grid gap-4">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex items-center justify-between p-3 bg-warm-gray-50 rounded-lg">
                <span>{subject.name}</span>
                <Button variant="outline" className="bg-yellow-400 hover:bg-yellow-500 text-blue-900">
                  Assign Tutors
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="tutors">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Manage Tutors</h3>
            <p className="text-gray-500">Tutor management coming soon...</p>
          </div>
        </TabsContent>
        <TabsContent value="timesheets">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Review Timesheets</h3>
            <p className="text-gray-500">Timesheet review coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

const TutorDashboard = () => {
  const [timesheets, setTimesheets] = useState<TimesheetWithSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchTimesheets = async () => {
      try {
        const { data, error } = await supabase
          .from('timesheets')
          .select(`
            *,
            subjects (
              name
            )
          `)
          .order('date_worked', { ascending: false });
        
        if (error) throw error;
        setTimesheets(data || []);
      } catch (error) {
        console.error('Error fetching timesheets:', error);
        toast({
          title: "Error",
          description: "Failed to load timesheets",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTimesheets();
  }, [toast]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="submit" className="w-full">
        <TabsList className="bg-blue-900/10">
          <TabsTrigger value="submit">Submit Hours</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="submit" className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Submit Hours</h3>
          <p className="text-gray-500">Hours submission coming soon...</p>
        </TabsContent>
        <TabsContent value="history">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Submission History</h3>
            <div className="space-y-4">
              {timesheets.map((timesheet) => (
                <div key={timesheet.id} className="p-4 bg-warm-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{timesheet.subjects?.name || 'Unknown Subject'}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(timesheet.date_worked).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{timesheet.hours_worked} hours</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        timesheet.status === 'approved' ? 'bg-green-100 text-green-800' :
                        timesheet.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  {timesheet.notes && (
                    <p className="mt-2 text-sm text-gray-600">{timesheet.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="profile">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Profile Management</h3>
            <p className="text-gray-500">Profile management coming soon...</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

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
    <div className="min-h-screen bg-warm-gray-50">
      <header className="bg-blue-900 text-white shadow-lg">
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {userRole === 'admin' ? <AdminDashboard /> : <TutorDashboard />}
      </main>
    </div>
  );
};

export default Dashboard;
