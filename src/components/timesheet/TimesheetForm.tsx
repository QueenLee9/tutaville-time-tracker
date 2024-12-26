import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { SubjectSelect } from "./SubjectSelect";
import { DatePicker } from "./DatePicker";

const formSchema = z.object({
  subject_id: z.string().min(1, "Please select a subject"),
  hours_worked: z.number().min(0.5).max(24),
  date_worked: z.date(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const TimesheetForm = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hours_worked: 1,
      notes: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const { data: session } = await supabase.auth.getSession();
      
      if (!session.session?.user.id) {
        throw new Error("No authenticated user");
      }

      const { error } = await supabase.from("timesheets").insert({
        tutor_id: session.session.user.id,
        subject_id: values.subject_id,
        hours_worked: values.hours_worked,
        date_worked: values.date_worked.toISOString().split('T')[0],
        notes: values.notes,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Timesheet submitted successfully",
      });
      
      form.reset();
    } catch (error) {
      console.error("Error submitting timesheet:", error);
      toast({
        title: "Error",
        description: "Failed to submit timesheet",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="subject_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Subject</FormLabel>
              <FormControl>
                <SubjectSelect value={field.value} onChange={field.onChange} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hours_worked"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hours Worked</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="24"
                  {...field}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="date_worked"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date Worked</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  onSelect={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Timesheet"}
        </Button>
      </form>
    </Form>
  );
};