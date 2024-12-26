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

  useEffect(() => {
    const fetchSubjects = async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session?.user.id) return;

      const { data } = await supabase
        .from('tutor_subjects')
        .select('subject_id, subjects(*)')
        .eq('tutor_id', session.session.user.id);

      if (data) {
        const subjectsData = data.map(item => item.subjects as Subject).filter(Boolean);
        setSubjects(subjectsData);
      }
    };

    fetchSubjects();
  }, []);

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