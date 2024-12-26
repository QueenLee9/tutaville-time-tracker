import type { Database } from "./database"

export type Timesheet = Database["public"]["Tables"]["timesheets"]["Row"]
export type TimesheetInsert = Database["public"]["Tables"]["timesheets"]["Insert"]

export interface TimesheetWithSubject extends Timesheet {
  subjects: {
    id: string
    name: string
    created_at: string
  }
}

export type TimesheetFormData = {
  subject_id: string
  hours_worked: number
  date_worked: string
  notes?: string
}