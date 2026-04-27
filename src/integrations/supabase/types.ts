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
      gl_accounts: {
        Row: {
          active: boolean
          code: string
          created_at: string
          id: string
          name: string
          type: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          id?: string
          name: string
          type: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          name?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      gl_entries: {
        Row: {
          account_id: string
          created_at: string
          credit: number
          debit: number
          description: string | null
          entry_date: string
          id: string
          posted_by: string | null
          reference: string | null
        }
        Insert: {
          account_id: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          entry_date?: string
          id?: string
          posted_by?: string | null
          reference?: string | null
        }
        Update: {
          account_id?: string
          created_at?: string
          credit?: number
          debit?: number
          description?: string | null
          entry_date?: string
          id?: string
          posted_by?: string | null
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gl_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "gl_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_repayments: {
        Row: {
          amount: number
          created_at: string
          due_date: string | null
          id: string
          interest_portion: number
          loan_id: string
          paid_at: string | null
          posted_by: string | null
          principal_portion: number
          reference: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date?: string | null
          id?: string
          interest_portion?: number
          loan_id: string
          paid_at?: string | null
          posted_by?: string | null
          principal_portion?: number
          reference?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string | null
          id?: string
          interest_portion?: number
          loan_id?: string
          paid_at?: string | null
          posted_by?: string | null
          principal_portion?: number
          reference?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_repayments_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          approved_by: string | null
          closed_at: string | null
          created_at: string
          created_by: string | null
          disbursed_at: string | null
          id: string
          interest_rate: number
          loan_number: string
          member_id: string
          outstanding_balance: number
          principal: number
          purpose: string | null
          status: string
          term_months: number
          updated_at: string
        }
        Insert: {
          approved_by?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          disbursed_at?: string | null
          id?: string
          interest_rate?: number
          loan_number: string
          member_id: string
          outstanding_balance?: number
          principal: number
          purpose?: string | null
          status?: string
          term_months: number
          updated_at?: string
        }
        Update: {
          approved_by?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          disbursed_at?: string | null
          id?: string
          interest_rate?: number
          loan_number?: string
          member_id?: string
          outstanding_balance?: number
          principal?: number
          purpose?: string | null
          status?: string
          term_months?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loans_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          email: string | null
          full_name: string
          gender: string | null
          id: string
          member_number: string
          phone: string | null
          region: string | null
          registration_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name: string
          gender?: string | null
          id?: string
          member_number: string
          phone?: string | null
          region?: string | null
          registration_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          email?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          member_number?: string
          phone?: string | null
          region?: string | null
          registration_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "members_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
            referencedColumns: ["id"]
          },
        ]
      }
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
      savings_accounts: {
        Row: {
          account_number: string
          balance: number
          created_at: string
          id: string
          interest_rate: number
          member_id: string
          opened_at: string
          product: string
          status: string
          updated_at: string
        }
        Insert: {
          account_number: string
          balance?: number
          created_at?: string
          id?: string
          interest_rate?: number
          member_id: string
          opened_at?: string
          product?: string
          status?: string
          updated_at?: string
        }
        Update: {
          account_number?: string
          balance?: number
          created_at?: string
          id?: string
          interest_rate?: number
          member_id?: string
          opened_at?: string
          product?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_accounts_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_transactions: {
        Row: {
          account_id: string
          amount: number
          created_at: string
          id: string
          note: string | null
          posted_at: string
          posted_by: string | null
          reference: string | null
          running_balance: number | null
          txn_type: string
        }
        Insert: {
          account_id: string
          amount: number
          created_at?: string
          id?: string
          note?: string | null
          posted_at?: string
          posted_by?: string | null
          reference?: string | null
          running_balance?: number | null
          txn_type: string
        }
        Update: {
          account_id?: string
          amount?: number
          created_at?: string
          id?: string
          note?: string | null
          posted_at?: string
          posted_by?: string | null
          reference?: string | null
          running_balance?: number | null
          txn_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "savings_accounts"
            referencedColumns: ["id"]
          },
        ]
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
