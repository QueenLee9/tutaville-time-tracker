import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import type { TimesheetWithSubject } from "@/integrations/supabase/types/timesheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TimesheetForm } from "@/components/timesheet/TimesheetForm"
import { ProfileManagement } from "@/components/profile/ProfileManagement"

export const TutorDashboard = () => {
  const [timesheets, setTimesheets] = useState<TimesheetWithSubject[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchTimesheets = async () => {
    try {
      const { data, error } = await supabase
        .from('timesheets')
        .select(`
          *,
          subjects (
            *
          )
        `)
        .order('date_worked', { ascending: false })
      
      if (error) throw error
      setTimesheets(data || [])
    } catch (error) {
      console.error('Error fetching timesheets:', error)
      toast({
        title: "Error",
        description: "Failed to load timesheets",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTimesheets()
  }, [toast])

  if (loading) {
    return <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-900"></div>
    </div>
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="submit" className="w-full">
        <TabsList className="bg-blue-900/10">
          <TabsTrigger value="submit">Submit Hours</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="profile">Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="submit" className="p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Submit Hours</h3>
          <TimesheetForm onSuccess={fetchTimesheets} />
        </TabsContent>
        <TabsContent value="history">
          <div className="p-4 bg-white rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Submission History</h3>
            <div className="space-y-4">
              {timesheets.map((timesheet) => (
                <div key={timesheet.id} className="p-4 bg-warm-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{timesheet.subjects?.name || 'Unknown Subject'}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(timesheet.date_worked).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{timesheet.hours_worked} hours</p>
                      <span className={`inline-block px-2 py-1 text-xs rounded ${
                        timesheet.status === 'approved' ? 'bg-green-100 text-green-800' :
                        timesheet.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {timesheet.status.charAt(0).toUpperCase() + timesheet.status.slice(1)}
                      </span>
                    </div>
                  </div>
                  {timesheet.notes && (
                    <p className="mt-2 text-sm text-gray-600">{timesheet.notes}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="profile">
          <ProfileManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}
