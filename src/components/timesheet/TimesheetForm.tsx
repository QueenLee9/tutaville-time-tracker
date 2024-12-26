import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { DatePicker } from "./DatePicker"
import { SubjectSelect } from "./SubjectSelect"

// Define the prop types for TimesheetForm
interface TimesheetFormProps {
  onSuccess?: () => Promise<void> | void;
}

const timesheetSchema = z.object({
  subject_id: z.string().uuid("Please select a subject"),
  hours_worked: z.coerce.number().min(0.1, "Hours must be greater than 0"),
  date_worked: z.date(),
  notes: z.string().optional()
})

export const TimesheetForm: React.FC<TimesheetFormProps> = ({ onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof timesheetSchema>>({
    resolver: zodResolver(timesheetSchema),
    defaultValues: {
      hours_worked: 0,
      notes: ""
    }
  })

  const onSubmit = async (data: z.infer<typeof timesheetSchema>) => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error("No active session")
      }

      const { error } = await supabase.from('timesheets').insert({
        tutor_id: session.user.id,
        subject_id: data.subject_id,
        hours_worked: data.hours_worked,
        date_worked: data.date_worked,
        notes: data.notes || null
      })

      if (error) throw error

      toast({
        title: "Success",
        description: "Timesheet submitted successfully",
        variant: "default"
      })

      form.reset()
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        await onSuccess()
      }
    } catch (error) {
      console.error("Timesheet submission error:", error)
      toast({
        title: "Error",
        description: "Failed to submit timesheet",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <SubjectSelect form={form} />
        
        <FormField
          control={form.control}
          name="hours_worked"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Hours Worked</FormLabel>
              <FormControl>
                <Input 
                  type="number" 
                  step="0.1" 
                  placeholder="Enter hours worked" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <DatePicker form={form} />

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Additional notes" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading}>
          {loading ? "Submitting..." : "Submit Timesheet"}
        </Button>
      </form>
    </Form>
  )
}