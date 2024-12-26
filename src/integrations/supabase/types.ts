export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface TimesheetWithSubject extends Database['public']['Tables']['timesheets']['Row'] {
  subjects: Database['public']['Tables']['subjects']['Row'] | null;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          created_at: string | null
          id: string
          role: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          role?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subjects: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      timesheets: {
        Row: {
          created_at: string
          date_worked: string
          hours_worked: number
          id: string
          notes: string | null
          status: string
          subject_id: string | null
          tutor_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          date_worked: string
          hours_worked: number
          id?: string
          notes?: string | null
          status?: string
          subject_id?: string | null
          tutor_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          date_worked?: string
          hours_worked?: number
          id?: string
          notes?: string | null
          status?: string
          subject_id?: string | null
          tutor_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheets_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      tutor_subjects: {
        Row: {
          assigned_at: string
          subject_id: string
          tutor_id: string
        }
        Insert: {
          assigned_at?: string
          subject_id: string
          tutor_id: string
        }
        Update: {
          assigned_at?: string
          subject_id?: string
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tutor_subjects_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tutor_subjects_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}