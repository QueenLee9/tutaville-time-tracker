import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TutorForm } from "./TutorForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type Subject = Database['public']['Tables']['subjects']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export const AdminDashboard = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tutors, setTutors] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTutor, setSelectedTutor] = useState<Profile | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [subjectsResponse, tutorsResponse] = await Promise.all([
        supabase.from('subjects').select('*'),
        supabase.from('profiles').select('*').eq('role', 'tutor')
      ]);
      
      if (subjectsResponse.error) throw subjectsResponse.error;
      if (tutorsResponse.error) throw tutorsResponse.error;

      setSubjects(subjectsResponse.data || []);
      setTutors(tutorsResponse.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">Manage Tutors</h3>
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="bg-yellow-400 hover:bg-yellow-500 text-blue-900">
                    Add New Tutor
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Tutor</DialogTitle>
                  </DialogHeader>
                  <TutorForm onSuccess={fetchData} />
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid gap-4">
              {tutors.map((tutor) => (
                <div key={tutor.id} className="flex items-center justify-between p-4 bg-warm-gray-50 rounded-lg">
                  <div>
                    <h4 className="font-medium">{tutor.first_name} {tutor.last_name}</h4>
                    <p className="text-sm text-gray-600">{tutor.email}</p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="bg-yellow-400 hover:bg-yellow-500 text-blue-900"
                        onClick={() => setSelectedTutor(tutor)}
                      >
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Edit Tutor</DialogTitle>
                      </DialogHeader>
                      <TutorForm tutor={selectedTutor || undefined} onSuccess={fetchData} />
                    </DialogContent>
                  </Dialog>
                </div>
              ))}
            </div>
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