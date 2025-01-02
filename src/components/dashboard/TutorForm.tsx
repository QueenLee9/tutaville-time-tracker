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

  console.log("TutorForm initialized with tutor:", tutor);

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
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            ...values,
            updated_at: new Date().toISOString(),
          })
          .eq("id", tutor.id);

        if (updateError) throw updateError;
        console.log("Successfully updated tutor profile");
      } else {
        console.log("Creating new tutor with values:", values);
        
        // First check if user exists in profiles
        const { data: existingProfile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", values.email)
          .maybeSingle();

        if (profileError) throw profileError;

        if (existingProfile) {
          toast({
            title: "Tutor Already Exists",
            description: "A tutor with this email address is already registered in the system.",
            variant: "destructive",
          });
          return;
        }

        // Use Supabase's invite user functionality
        const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(values.email, {
          data: {
            first_name: values.first_name,
            last_name: values.last_name,
            phone: values.phone,
            role: 'tutor'
          }
        });

        if (inviteError) {
          console.error("Invite error:", inviteError);
          if (inviteError.message.includes("already registered")) {
            toast({
              title: "Tutor Already Exists",
              description: "A tutor with this email address is already registered in the system.",
              variant: "destructive",
            });
            return;
          }
          throw inviteError;
        }

        console.log("Successfully invited tutor:", inviteData);
      }

      console.log("Operation successful");
      toast({
        title: "Success",
        description: `Tutor ${isEditing ? "updated" : "added"} successfully${!isEditing ? ". An invitation email has been sent." : ""}`,
      });
      
      onSuccess();
      if (!isEditing) {
        form.reset();
      }
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
                <Input type="email" {...field} />
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