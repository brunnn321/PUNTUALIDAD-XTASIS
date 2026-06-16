export type UserRole = 'director' | 'member'
export type SectionName = 'vientos' | 'voces' | 'bailarines' | 'armonia' | 'percusion' | 'staff'
export type AttendanceStatus = 'present' | 'late' | 'absent'
export type EventStatus = 'scheduled' | 'open' | 'closed'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          photo_url: string | null
          role: UserRole
          section: SectionName | null
          instrument: string | null
          active: boolean
          welcomed: boolean
          name_edited: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          photo_url?: string | null
          role?: UserRole
          section?: SectionName | null
          instrument?: string | null
          active?: boolean
          welcomed?: boolean
          name_edited?: boolean
        }
        Update: {
          full_name?: string
          photo_url?: string | null
          role?: UserRole
          section?: SectionName | null
          instrument?: string | null
          active?: boolean
          welcomed?: boolean
          name_edited?: boolean
        }
      }
      event_types: {
        Row: {
          id: string
          name: string
          fine_absent: number
          fine_late: number
          created_at: string
        }
        Insert: {
          name: string
          fine_absent?: number
          fine_late?: number
        }
        Update: {
          name?: string
          fine_absent?: number
          fine_late?: number
        }
      }
      events: {
        Row: {
          id: string
          title: string
          event_type_id: string
          target_sections: SectionName[] | null
          starts_at: string
          checkin_window_min: number
          checkin_opens_at: string
          status: EventStatus
          notes: string | null
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          title: string
          event_type_id: string
          target_sections?: SectionName[] | null
          starts_at: string
          checkin_window_min?: number
          status?: EventStatus
          notes?: string | null
          created_by: string
        }
        Update: {
          title?: string
          event_type_id?: string
          target_sections?: SectionName[] | null
          starts_at?: string
          checkin_window_min?: number
          status?: EventStatus
          notes?: string | null
        }
      }
      attendances: {
        Row: {
          id: string
          event_id: string
          user_id: string
          status: AttendanceStatus
          checked_in_at: string | null
          photo_url: string | null
          fine_amount: number
          edited_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          event_id: string
          user_id: string
          status: AttendanceStatus
          checked_in_at?: string | null
          photo_url?: string | null
          fine_amount?: number
        }
        Update: {
          status?: AttendanceStatus
          checked_in_at?: string | null
          photo_url?: string | null
          fine_amount?: number
          edited_by?: string | null
        }
      }
      push_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          created_at: string
        }
        Insert: {
          user_id: string
          token: string
        }
        Update: never
      }
    }
    Functions: {
      is_director: {
        Args: Record<string, never>
        Returns: boolean
      }
      resolve_attendance_status: {
        Args: { p_event_id: string; p_checked_in_at: string }
        Returns: AttendanceStatus
      }
      close_event: {
        Args: { p_event_id: string }
        Returns: void
      }
    }
  }
}

// Tipos de conveniencia con joins
export type Profile = Database['public']['Tables']['profiles']['Row']
export type EventType = Database['public']['Tables']['event_types']['Row']
export type Event = Database['public']['Tables']['events']['Row']
export type Attendance = Database['public']['Tables']['attendances']['Row']

export type EventWithType = Event & {
  event_types: EventType
}

export type AttendanceWithProfile = Attendance & {
  profiles: Pick<Profile, 'id' | 'full_name' | 'photo_url' | 'section' | 'instrument'>
}
