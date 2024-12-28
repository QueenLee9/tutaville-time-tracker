import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Database } from "@/integrations/supabase/types";

type Subject = Database['public']['Tables']['subjects']['Row'];
type TutorSubject = Database['public']['Tables']['tutor_subjects']['Row'];

interface TutorSubjectFormProps {
  tutor?: {
    id: string;
  };
  subjects: Subject[];
  existingAssignments: TutorSubject[];
  onSuccess: () => void;
}

export const TutorSubjectForm = ({ tutor, subjects, existingAssignments, onSuccess }: TutorSubjectFormProps) => {
  const { toast } = useToast();
  const [assignments, setAssignments] = useState<Record<string, { assigned: boolean; rate: number }>>(() => {
    const initial: Record<string, { assigned: boolean; rate: number }> = {};
    subjects.forEach(subject => {
      const existing = existingAssignments.find(a => a.subject_id === subject.id);
      initial[subject.id] = {
        assigned: !!existing,
        rate: existing?.rate_per_hour ? Number(existing.rate_per_hour) : 0
      };
    });
    return initial;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tutor) return;

    try {
      // Remove existing assignments
      const { error: deleteError } = await supabase
        .from('tutor_subjects')
        .delete()
        .eq('tutor_id', tutor.id);

      if (deleteError) throw deleteError;

      // Add new assignments
      const newAssignments = Object.entries(assignments)
        .filter(([_, value]) => value.assigned)
        .map(([subjectId, value]) => ({
          tutor_id: tutor.id,
          subject_id: subjectId,
          rate_per_hour: value.rate
        }));

      if (newAssignments.length > 0) {
        const { error: insertError } = await supabase
          .from('tutor_subjects')
          .insert(newAssignments);

        if (insertError) throw insertError;
      }

      toast({
        title: "Success",
        description: "Subject assignments updated successfully",
      });
      
      onSuccess();
    } catch (error) {
      console.error('Error updating subject assignments:', error);
      toast({
        title: "Error",
        description: "Failed to update subject assignments",
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {subjects.map((subject) => (
        <div key={subject.id} className="flex items-center space-x-4 p-2 bg-gray-50 rounded">
          <input
            type="checkbox"
            checked={assignments[subject.id]?.assigned}
            onChange={(e) => setAssignments(prev => ({
              ...prev,
              [subject.id]: {
                ...prev[subject.id],
                assigned: e.target.checked
              }
            }))}
            className="h-4 w-4"
          />
          <span className="flex-grow">{subject.name}</span>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={assignments[subject.id]?.rate || 0}
            onChange={(e) => setAssignments(prev => ({
              ...prev,
              [subject.id]: {
                ...prev[subject.id],
                rate: parseFloat(e.target.value) || 0
              }
            }))}
            className="w-24"
            placeholder="Rate/hr"
            disabled={!assignments[subject.id]?.assigned}
          />
        </div>
      ))}
      <Button type="submit" className="w-full">Save Assignments</Button>
    </form>
  );
};