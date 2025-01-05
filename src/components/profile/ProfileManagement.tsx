import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const formSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export const ProfileManagement = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [assignedSubjects, setAssignedSubjects] = useState<Array<{
    name: string;
    rate_per_hour: number;
  }>>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: "",
      last_name: "",
      phone: "",
    },
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log("Loading profile for user:", user.id);

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) throw profileError;

        console.log("Loaded profile:", profile);

        if (profile) {
          form.reset({
            first_name: profile.first_name || "",
            last_name: profile.last_name || "",
            phone: profile.phone || "",
          });
        }

        // Load assigned subjects with rates
        const { data: subjects, error: subjectsError } = await supabase
          .from("tutor_subjects")
          .select(`
            subject_id,
            rate_per_hour,
            subjects (
              name
            )
          `)
          .eq("tutor_id", user.id);

        if (subjectsError) throw subjectsError;

        console.log("Loaded subjects:", subjects);

        setAssignedSubjects(
          subjects.map((s) => ({
            name: s.subjects?.name || "Unknown Subject",
            rate_per_hour: s.rate_per_hour || 0,
          }))
        );
      } catch (error) {
        console.error("Error loading profile:", error);
        toast({
          title: "Error",
          description: "Failed to load profile data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [form, toast]);

  const onSubmit = async (values: FormValues) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      console.log("Updating profile with values:", values);

      const { error } = await supabase
        .from("profiles")
        .update({
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      console.log("Profile updated successfully");

      toast({
        title: "Success",
        description: "Profile updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone (Optional)</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit">Update Profile</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Subjects</CardTitle>
        </CardHeader>
        <CardContent>
          {assignedSubjects.length > 0 ? (
            <div className="space-y-2">
              {assignedSubjects.map((subject, index) => (
                <div
                  key={index}
                  className="flex justify-between items-center p-3 bg-warm-gray-50 rounded-lg"
                >
                  <span className="font-medium">{subject.name}</span>
                  <span className="text-gray-600">
                    Rate: R{subject.rate_per_hour}/hour
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No subjects assigned yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};