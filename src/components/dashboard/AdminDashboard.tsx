import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Subject = Database['public']['Tables']['subjects']['Row'];

export const AdminDashboard = () => {
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