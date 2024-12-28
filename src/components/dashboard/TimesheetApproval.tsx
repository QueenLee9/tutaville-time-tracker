import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import type { Database } from "@/integrations/supabase/types";

type Timesheet = Database['public']['Tables']['timesheets']['Row'] & {
  profiles: {
    first_name: string | null;
    last_name: string | null;
  } | null;
  subjects: {
    name: string;
  } | null;
};

interface TimesheetApprovalProps {
  onSuccess: () => void;
}

export const TimesheetApproval = ({ onSuccess }: TimesheetApprovalProps) => {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTimesheets = async () => {
    try {
      const { data, error } = await supabase
        .from('timesheets')
        .select(`
          *,
          profiles (
            first_name,
            last_name
          ),
          subjects (
            name
          )
        `)
        .eq('status', 'pending')
        .order('date_worked', { ascending: false });

      if (error) throw error;
      console.log("Fetched timesheets:", data);
      setTimesheets(data || []);
    } catch (error) {
      console.error('Error fetching timesheets:', error);
      toast({
        title: "Error",
        description: "Failed to load timesheets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (timesheetId: string, approved: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No active session");

      const { error } = await supabase
        .from('timesheets')
        .update({
          status: approved ? 'approved' : 'rejected',
          approved_by: approved ? session.user.id : null,
          approval_date: approved ? new Date().toISOString() : null
        })
        .eq('id', timesheetId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Timesheet ${approved ? 'approved' : 'rejected'} successfully`,
      });

      fetchTimesheets();
      onSuccess();
    } catch (error) {
      console.error('Error updating timesheet:', error);
      toast({
        title: "Error",
        description: "Failed to update timesheet",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchTimesheets();
  }, []);

  if (loading) {
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>;
  }

  return (
    <div className="space-y-4">
      {timesheets.length === 0 ? (
        <p className="text-gray-500 text-center py-4">No pending timesheets to review</p>
      ) : (
        timesheets.map((timesheet) => (
          <div key={timesheet.id} className="p-4 bg-warm-gray-50 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium">
                  {timesheet.profiles?.first_name} {timesheet.profiles?.last_name}
                </h4>
                <p className="text-sm text-gray-600">{timesheet.subjects?.name}</p>
              </div>
              <div className="text-right">
                <p className="font-medium">{timesheet.hours_worked} hours</p>
                <p className="text-sm text-gray-600">
                  {new Date(timesheet.date_worked).toLocaleDateString()}
                </p>
              </div>
            </div>
            {timesheet.notes && (
              <p className="text-sm text-gray-600 mb-4">{timesheet.notes}</p>
            )}
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                className="bg-red-100 hover:bg-red-200 text-red-700"
                onClick={() => handleApproval(timesheet.id, false)}
              >
                Reject
              </Button>
              <Button
                className="bg-green-500 hover:bg-green-600 text-white"
                onClick={() => handleApproval(timesheet.id, true)}
              >
                Approve
              </Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};