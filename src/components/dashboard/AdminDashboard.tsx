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
import { TutorSubjectForm } from "./TutorSubjectForm";
import { TimesheetApproval } from "./TimesheetApproval";

type Subject = Database['public']['Tables']['subjects']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];
type TutorSubject = Database['public']['Tables']['tutor_subjects']['Row'];

export const AdminDashboard = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tutors, setTutors] = useState<Profile[]>([]);
  const [tutorSubjects, setTutorSubjects] = useState<TutorSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTutor, setSelectedTutor] = useState<Profile | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    try {
      console.log("Fetching admin dashboard data...");
      const [subjectsResponse, tutorsResponse, tutorSubjectsResponse] = await Promise.all([
        supabase.from('subjects').select('*'),
        supabase.from('profiles').select('*').eq('role', 'tutor'),
        supabase.from('tutor_subjects').select('*')
      ]);
      
      if (subjectsResponse.error) throw subjectsResponse.error;
      if (tutorsResponse.error) throw tutorsResponse.error;
      if (tutorSubjectsResponse.error) throw tutorSubjectsResponse.error;

      console.log("Fetched subjects:", subjectsResponse.data);
      console.log("Fetched tutors:", tutorsResponse.data);
      console.log("Fetched tutor subjects:", tutorSubjectsResponse.data);

      setSubjects(subjectsResponse.data || []);
      setTutors(tutorsResponse.data || []);
      setTutorSubjects(tutorSubjectsResponse.data || []);
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

  const handleAddSubject = async (name: string) => {
    try {
      const { error } = await supabase
        .from('subjects')
        .insert([{ name }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Subject added successfully",
      });

      fetchData();
    } catch (error) {
      console.error('Error adding subject:', error);
      toast({
        title: "Error",
        description: "Failed to add subject",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">Manage Subjects</h3>
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-yellow-400 hover:bg-yellow-500 text-blue-900">
                  Add New Subject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Subject</DialogTitle>
                </DialogHeader>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleAddSubject(formData.get('name') as string);
                  (e.target as HTMLFormElement).reset();
                }} className="space-y-4">
                  <input
                    name="name"
                    className="w-full p-2 border rounded"
                    placeholder="Subject name"
                    required
                  />
                  <Button type="submit">Add Subject</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="grid gap-4">
            {subjects.map((subject) => (
              <div key={subject.id} className="flex items-center justify-between p-3 bg-warm-gray-50 rounded-lg">
                <span>{subject.name}</span>
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
                  <div className="space-x-2">
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
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="bg-blue-400 hover:bg-blue-500 text-white"
                          onClick={() => setSelectedTutor(tutor)}
                        >
                          Assign Subjects
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Subjects & Rates</DialogTitle>
                        </DialogHeader>
                        <TutorSubjectForm 
                          tutor={selectedTutor || undefined} 
                          subjects={subjects}
                          existingAssignments={tutorSubjects.filter(ts => ts.tutor_id === selectedTutor?.id)}
                          onSuccess={fetchData} 
                        />
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="timesheets">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Review Timesheets</h3>
            <TimesheetApproval onSuccess={fetchData} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};