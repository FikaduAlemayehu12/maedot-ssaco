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
      registrations: {
        Row: {
          account_number: string
          account_type: Database["public"]["Enums"]["account_type"]
          annual_income: number | null
          branch: string | null
          created_at: string
          customer_number: string
          date_of_birth: string
          education: string | null
          email: string
          full_name: string
          gender: string
          heir_full_name: string | null
          heir_phone: string | null
          heir_relationship: string | null
          heir2_full_name: string | null
          heir2_phone: string | null
          heir2_relationship: string | null
          id: string
          id_back_url: string | null
          id_document_url: string | null
          id_front_url: string | null
          id_number: string
          id_type: string
          live_photo_url: string | null
          marital_status: string | null
          monthly_income: number | null
          mothers_name: string | null
          nationality: string
          occupation: string | null
          optional_photo_url: string | null
          phone: string
          photo_url: string | null
          referral_code: string | null
          region: string
          reviewed_at: string | null
          reviewed_by: string | null
          signature_data_url: string | null
          status: Database["public"]["Enums"]["registration_status"]
          tin_number: string | null
          updated_at: string
          witness_1: string | null
          witness_2: string | null
          witness_3: string | null
        }
        Insert: {
          account_number: string
          account_type: Database["public"]["Enums"]["account_type"]
          annual_income?: number | null
          branch?: string | null
          created_at?: string
          customer_number: string
          date_of_birth: string
          education?: string | null
          email: string
          full_name: string
          gender: string
          heir_full_name?: string | null
          heir_phone?: string | null
          heir_relationship?: string | null
          heir2_full_name?: string | null
          heir2_phone?: string | null
          heir2_relationship?: string | null
          id?: string
          id_back_url?: string | null
          id_document_url?: string | null
          id_front_url?: string | null
          id_number: string
          id_type: string
          live_photo_url?: string | null
          marital_status?: string | null
          monthly_income?: number | null
          mothers_name?: string | null
          nationality: string
          occupation?: string | null
          optional_photo_url?: string | null
          phone: string
          photo_url?: string | null
          referral_code?: string | null
          region: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          signature_data_url?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          tin_number?: string | null
          updated_at?: string
          witness_1?: string | null
          witness_2?: string | null
          witness_3?: string | null
        }
        Update: {
          account_number?: string
          account_type?: Database["public"]["Enums"]["account_type"]
          annual_income?: number | null
          branch?: string | null
          created_at?: string
          customer_number?: string
          date_of_birth?: string
          education?: string | null
          email?: string
          full_name?: string
          gender?: string
          heir_full_name?: string | null
          heir_phone?: string | null
          heir_relationship?: string | null
          heir2_full_name?: string | null
          heir2_phone?: string | null
          heir2_relationship?: string | null
          id?: string
          id_back_url?: string | null
          id_document_url?: string | null
          id_front_url?: string | null
          id_number?: string
          id_type?: string
          live_photo_url?: string | null
          marital_status?: string | null
          monthly_income?: number | null
          mothers_name?: string | null
          nationality?: string
          occupation?: string | null
          optional_photo_url?: string | null
          phone?: string
          photo_url?: string | null
          referral_code?: string | null
          region?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          signature_data_url?: string | null
          status?: Database["public"]["Enums"]["registration_status"]
          tin_number?: string | null
          updated_at?: string
          witness_1?: string | null
          witness_2?: string | null
          witness_3?: string | null
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          address: string | null
          email: string | null
          id: number
          logo_url: string | null
          motto_am: string
          motto_en: string
          org_name_am: string
          org_name_en: string
          phone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          email?: string | null
          id?: number
          logo_url?: string | null
          motto_am?: string
          motto_en?: string
          org_name_am?: string
          org_name_en?: string
          phone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          email?: string | null
          id?: number
          logo_url?: string | null
          motto_am?: string
          motto_en?: string
          org_name_am?: string
          org_name_en?: string
          phone?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          active: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          phone: string | null
          referral_code: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          email: string
          full_name: string
          id?: string
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          phone?: string | null
          referral_code?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      submit_registration: {
        Args: { payload: Json }
        Returns: {
          account_number: string
          customer_number: string
        }[]
      }
    }
    Enums: {
      account_type: "saving" | "cheque" | "mobile_wallet"
      app_role:
        | "admin"
        | "checker"
        | "maker"
        | "hr_manager"
        | "finance_officer"
        | "inventory_clerk"
        | "cashier"
        | "loan_officer"
        | "savings_officer"
      registration_status: "pending" | "approved" | "rejected"
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
      account_type: ["saving", "cheque", "mobile_wallet"],
      app_role: [
        "admin",
        "checker",
        "maker",
        "hr_manager",
        "finance_officer",
        "inventory_clerk",
        "cashier",
        "loan_officer",
        "savings_officer",
      ],
      registration_status: ["pending", "approved", "rejected"],
    },
  },
} as const
