import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";

type Subject = Database['public']['Tables']['subjects']['Row'];

interface SubjectSelectProps {
  value: string;
  onChange: (value: string) => void;
}

export const SubjectSelect = ({ value, onChange }: SubjectSelectProps) => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        console.log("Fetching subjects for tutor...");
        const { data: session } = await supabase.auth.getSession();
        if (!session.session?.user.id) {
          console.log("No user session found");
          return;
        }

        const { data, error } = await supabase
          .from('tutor_subjects')
          .select(`
            subject_id,
            subjects (
              id,
              name
            )
          `)
          .eq('tutor_id', session.session.user.id);

        if (error) {
          console.error('Error fetching subjects:', error);
          return;
        }

        console.log("Fetched tutor subjects:", data);
        
        if (data) {
          const subjectsData = data
            .map(item => item.subjects as Subject)
            .filter(Boolean);
          console.log("Processed subjects data:", subjectsData);
          setSubjects(subjectsData);
        }
      } catch (error) {
        console.error('Error in fetchSubjects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  if (loading) {
    return (
      <Select disabled value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Loading subjects..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (subjects.length === 0) {
    return (
      <Select disabled value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="No subjects assigned" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select a subject" />
      </SelectTrigger>
      <SelectContent>
        {subjects.map((subject) => (
          <SelectItem key={subject.id} value={subject.id}>
            {subject.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};