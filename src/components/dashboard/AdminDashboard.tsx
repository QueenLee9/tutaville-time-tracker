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
  DialogDescription,
  DialogFooter,
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
  const [showDeleteTutorDialog, setShowDeleteTutorDialog] = useState(false);
  const [showDeleteSubjectDialog, setShowDeleteSubjectDialog] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
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

      setTutors(tutorsResponse.data || []);
      setSubjects(subjectsResponse.data || []);
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
      console.log("Adding new subject:", name);
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

  const handleDeleteTutor = async () => {
    if (!selectedTutor) return;

    try {
      console.log("Deleting tutor:", selectedTutor.id);
      
      // First delete related tutor_subjects
      const { error: tsError } = await supabase
        .from('tutor_subjects')
        .delete()
        .eq('tutor_id', selectedTutor.id);

      if (tsError) throw tsError;

      // Then delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', selectedTutor.id);

      if (profileError) throw profileError;

      toast({
        title: "Success",
        description: "Tutor deleted successfully",
      });

      setShowDeleteTutorDialog(false);
      setSelectedTutor(null);
      fetchData(); // Refresh the data after deletion
    } catch (error) {
      console.error('Error deleting tutor:', error);
      toast({
        title: "Error",
        description: "Failed to delete tutor",
        variant: "destructive",
      });
    }
  };

  const handleDeleteSubject = async () => {
    if (!selectedSubject) return;

    try {
      console.log("Deleting subject:", selectedSubject.id);
      
      // First delete related tutor_subjects
      const { error: tsError } = await supabase
        .from('tutor_subjects')
        .delete()
        .eq('subject_id', selectedSubject.id);

      if (tsError) throw tsError;

      // Then delete the subject
      const { error: subjectError } = await supabase
        .from('subjects')
        .delete()
        .eq('id', selectedSubject.id);

      if (subjectError) throw subjectError;

      toast({
        title: "Success",
        description: "Subject deleted successfully",
      });

      setShowDeleteSubjectDialog(false);
      setSelectedSubject(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast({
        title: "Error",
        description: "Failed to delete subject",
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
                <Button 
                  variant="destructive"
                  onClick={() => {
                    setSelectedSubject(subject);
                    setShowDeleteSubjectDialog(true);
                  }}
                >
                  Delete
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
                    <h4 className="font-medium">
                      {tutor.first_name || tutor.last_name ? 
                        `${tutor.first_name || ''} ${tutor.last_name || ''}`.trim() :
                        tutor.email || 'Unnamed Tutor'}
                    </h4>
                    {tutor.email && <p className="text-sm text-gray-600">{tutor.email}</p>}
                  </div>
                  <div className="space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="bg-yellow-400 hover:bg-yellow-500 text-blue-900"
                        >
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Tutor</DialogTitle>
                        </DialogHeader>
                        <TutorForm tutor={tutor} onSuccess={fetchData} />
                      </DialogContent>
                    </Dialog>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="bg-blue-400 hover:bg-blue-500 text-white"
                        >
                          Assign Subjects
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Assign Subjects & Rates</DialogTitle>
                        </DialogHeader>
                        <TutorSubjectForm 
                          tutor={tutor} 
                          subjects={subjects}
                          existingAssignments={tutorSubjects.filter(ts => ts.tutor_id === tutor.id)}
                          onSuccess={fetchData} 
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        setSelectedTutor(tutor);
                        setShowDeleteTutorDialog(true);
                      }}
                    >
                      Delete
                    </Button>
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

      {/* Delete Tutor Confirmation Dialog */}
      <Dialog open={showDeleteTutorDialog} onOpenChange={setShowDeleteTutorDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Tutor</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tutor? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteTutorDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteTutor}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subject Confirmation Dialog */}
      <Dialog open={showDeleteSubjectDialog} onOpenChange={setShowDeleteSubjectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subject</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subject? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteSubjectDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteSubject}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
