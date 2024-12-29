import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

const formSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface TutorFormProps {
  tutor?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  };
  onSuccess: () => void;
}

export const TutorForm = ({ tutor, onSuccess }: TutorFormProps) => {
  const { toast } = useToast();
  const isEditing = !!tutor;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      first_name: tutor?.first_name || "",
      last_name: tutor?.last_name || "",
      email: tutor?.email || "",
      phone: tutor?.phone || "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      console.log("Submitting tutor form:", { isEditing, values });
      
      if (isEditing && tutor) {
        console.log("Updating existing tutor:", { tutorId: tutor.id, values });
        const { error } = await supabase
          .from("profiles")
          .update({
            ...values,
            updated_at: new Date().toISOString(),
          })
          .eq("id", tutor.id);

        if (error) {
          console.error("Error updating tutor:", error);
          throw error;
        }

        // Verify the update was successful
        const { data: updatedTutor, error: fetchError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", tutor.id)
          .single();

        if (fetchError) {
          console.error("Error fetching updated tutor:", fetchError);
          throw fetchError;
        }

        console.log("Successfully updated tutor:", updatedTutor);
      } else {
        console.log("Creating new tutor with values:", values);
        const { data: existingUser, error: checkError } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", values.email)
          .single();

        if (existingUser) {
          console.log("User already exists with email:", values.email);
          toast({
            title: "Error",
            description: "A tutor with this email already exists",
            variant: "destructive",
          });
          return;
        }

        const { data: authUser, error: authError } = await supabase.auth.signUp({
          email: values.email,
          password: "tempPassword123", // You might want to generate this randomly
        });

        if (authError) {
          console.error("Auth error:", authError);
          if (authError.message.includes("already registered")) {
            toast({
              title: "Error",
              description: "A user with this email already exists",
              variant: "destructive",
            });
            return;
          }
          throw authError;
        }

        if (!authUser.user?.id) {
          throw new Error("Failed to create auth user");
        }

        console.log("Created auth user:", authUser.user.id);

        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            ...values,
            role: 'tutor',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", authUser.user.id);

        if (profileError) throw profileError;
      }

      console.log("Operation successful");
      toast({
        title: "Success",
        description: `Tutor ${isEditing ? "updated" : "added"} successfully`,
      });
      
      onSuccess();
      form.reset();
    } catch (error) {
      console.error("Error saving tutor:", error);
      toast({
        title: "Error",
        description: `Failed to ${isEditing ? "update" : "add"} tutor`,
        variant: "destructive",
      });
    }
  };

  return (
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" {...field} disabled={isEditing} />
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

        <Button type="submit">
          {isEditing ? "Update Tutor" : "Add Tutor"}
        </Button>
      </form>
    </Form>
  );
};