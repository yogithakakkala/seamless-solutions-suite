export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      application_drafts: {
        Row: {
          completion_percentage: number
          created_at: string
          draft_data: Json
          id: string
          scheme_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completion_percentage?: number
          created_at?: string
          draft_data?: Json
          id?: string
          scheme_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completion_percentage?: number
          created_at?: string
          draft_data?: Json
          id?: string
          scheme_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_drafts_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      application_messages: {
        Row: {
          application_id: string
          created_at: string
          file_url: string | null
          id: string
          is_document_request: boolean
          message: string | null
          requested_document_type: string | null
          sender_type: string
        }
        Insert: {
          application_id: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_document_request?: boolean
          message?: string | null
          requested_document_type?: string | null
          sender_type: string
        }
        Update: {
          application_id?: string
          created_at?: string
          file_url?: string | null
          id?: string
          is_document_request?: boolean
          message?: string | null
          requested_document_type?: string | null
          sender_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_messages_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      application_status_history: {
        Row: {
          application_id: string
          changed_at: string
          changed_by_staff: boolean
          document_requested: string | null
          id: string
          note: string | null
          status: string
        }
        Insert: {
          application_id: string
          changed_at?: string
          changed_by_staff?: boolean
          document_requested?: string | null
          id?: string
          note?: string | null
          status: string
        }
        Update: {
          application_id?: string
          changed_at?: string
          changed_by_staff?: boolean
          document_requested?: string | null
          id?: string
          note?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_status_history_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applicant_details: Json
          created_at: string
          id: string
          scheme_id: string
          status: string
          submitted_documents: Json
          token_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          applicant_details?: Json
          created_at?: string
          id?: string
          scheme_id: string
          status?: string
          submitted_documents?: Json
          token_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          applicant_details?: Json
          created_at?: string
          id?: string
          scheme_id?: string
          status?: string
          submitted_documents?: Json
          token_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "schemes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      certificate_requests: {
        Row: {
          certificate_type: string
          citizen_name: string
          contact_email: string | null
          contact_phone: string | null
          id: string
          notes: string | null
          requested_at: string
          status: string
          token_number: string
          updated_at: string
        }
        Insert: {
          certificate_type: string
          citizen_name: string
          contact_email?: string | null
          contact_phone?: string | null
          id?: string
          notes?: string | null
          requested_at?: string
          status?: string
          token_number: string
          updated_at?: string
        }
        Update: {
          certificate_type?: string
          citizen_name?: string
          contact_email?: string | null
          contact_phone?: string | null
          id?: string
          notes?: string | null
          requested_at?: string
          status?: string
          token_number?: string
          updated_at?: string
        }
        Relationships: []
      }
      document_offices: {
        Row: {
          document_type: string
          id: string
          issuing_office_type: string
          notes: string | null
        }
        Insert: {
          document_type: string
          id?: string
          issuing_office_type: string
          notes?: string | null
        }
        Update: {
          document_type?: string
          id?: string
          issuing_office_type?: string
          notes?: string | null
        }
        Relationships: []
      }
      grievances: {
        Row: {
          acknowledged_at: string | null
          admin_response: string | null
          application_id: string
          id: string
          raised_at: string
          reason: string | null
          resolved_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string | null
          admin_response?: string | null
          application_id: string
          id?: string
          raised_at?: string
          reason?: string | null
          resolved_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string | null
          admin_response?: string | null
          application_id?: string
          id?: string
          raised_at?: string
          reason?: string | null
          resolved_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grievances_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      meeseva_centers: {
        Row: {
          address: string
          area: string | null
          created_at: string
          district: string | null
          id: string
          latitude: number
          longitude: number
          name: string
          name_telugu: string
          phone: string | null
          services: string[]
        }
        Insert: {
          address: string
          area?: string | null
          created_at?: string
          district?: string | null
          id?: string
          latitude: number
          longitude: number
          name: string
          name_telugu: string
          phone?: string | null
          services?: string[]
        }
        Update: {
          address?: string
          area?: string | null
          created_at?: string
          district?: string | null
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          name_telugu?: string
          phone?: string | null
          services?: string[]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          is_staff: boolean
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          is_staff?: boolean
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          is_staff?: boolean
        }
        Relationships: []
      }
      sachivalayam_centers: {
        Row: {
          address: string
          area: string
          busy_level: string
          busy_note: string | null
          busy_updated_at: string
          created_at: string
          district: string
          id: string
          latitude: number
          longitude: number
          name: string
          name_telugu: string | null
          phone: string | null
          secretariat_code: string | null
          ward: string | null
        }
        Insert: {
          address: string
          area: string
          busy_level?: string
          busy_note?: string | null
          busy_updated_at?: string
          created_at?: string
          district: string
          id?: string
          latitude: number
          longitude: number
          name: string
          name_telugu?: string | null
          phone?: string | null
          secretariat_code?: string | null
          ward?: string | null
        }
        Update: {
          address?: string
          area?: string
          busy_level?: string
          busy_note?: string | null
          busy_updated_at?: string
          created_at?: string
          district?: string
          id?: string
          latitude?: number
          longitude?: number
          name?: string
          name_telugu?: string | null
          phone?: string | null
          secretariat_code?: string | null
          ward?: string | null
        }
        Relationships: []
      }
      schemes: {
        Row: {
          created_at: string
          description: string
          eligibility_rules: Json
          id: string
          name: string
          name_telugu: string
          required_documents: string[]
        }
        Insert: {
          created_at?: string
          description: string
          eligibility_rules?: Json
          id: string
          name: string
          name_telugu: string
          required_documents?: string[]
        }
        Update: {
          created_at?: string
          description?: string
          eligibility_rules?: Json
          id?: string
          name?: string
          name_telugu?: string
          required_documents?: string[]
        }
        Relationships: []
      }
      user_documents: {
        Row: {
          document_type: string
          file_url: string
          id: string
          uploaded_at: string
          user_id: string
        }
        Insert: {
          document_type: string
          file_url: string
          id?: string
          uploaded_at?: string
          user_id: string
        }
        Update: {
          document_type?: string
          file_url?: string
          id?: string
          uploaded_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      citizen_add_submitted_document: {
        Args: {
          _application_id: string
          _document_type: string
          _file_url: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _uid: string }; Returns: boolean }
      lookup_application_by_token: {
        Args: { _token: string }
        Returns: {
          applicant_name: string
          created_at: string
          scheme_id: string
          scheme_name: string
          status: string
          token_number: string
          updated_at: string
        }[]
      }
      notify_stale_applications: { Args: never; Returns: undefined }
      send_email: {
        Args: { _html: string; _subject: string; _to: string }
        Returns: undefined
      }
      set_staff_status: {
        Args: { _new_value: boolean; _target_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "staff"],
    },
  },
} as const
