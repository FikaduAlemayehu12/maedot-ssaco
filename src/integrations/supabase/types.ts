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
      loan_application_guarantors: {
        Row: {
          application_id: string
          created_at: string
          document_url: string | null
          guarantor_member_id: string | null
          guarantor_name: string | null
          id: string
          notes: string | null
        }
        Insert: {
          application_id: string
          created_at?: string
          document_url?: string | null
          guarantor_member_id?: string | null
          guarantor_name?: string | null
          id?: string
          notes?: string | null
        }
        Update: {
          application_id?: string
          created_at?: string
          document_url?: string | null
          guarantor_member_id?: string | null
          guarantor_name?: string | null
          id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_application_guarantors_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "loan_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_applications: {
        Row: {
          application_number: string
          approved_at: string | null
          approved_by: string | null
          collateral_motor_chassis: string | null
          collateral_owner: string | null
          collateral_plate_or_title: string | null
          collateral_type: string | null
          collateral_value: number | null
          committee_decision_date: string | null
          created_at: string
          created_by: string | null
          doc_cheque: boolean
          doc_fayda_kebele: boolean
          doc_insurance: boolean
          doc_marriage_cert: boolean
          doc_member_booklet: boolean
          doc_restraint_letter: boolean
          doc_vehicle_house_title: boolean
          end_month: string | null
          id: string
          insurance_fee: number
          interest_rate: number
          is_mor_staff: boolean
          late_penalty_rate: number
          loan_id: string | null
          manager_name: string | null
          mandatory_savings: number
          member_id: string
          monthly_income: number | null
          monthly_installment: number
          net_to_member: number
          purpose: string | null
          registration_id: string | null
          rejected_reason: string | null
          requested_amount: number
          service_fee: number
          start_month: string | null
          status: string
          term_months: number
          total_payable: number
          total_upfront_fees: number
          updated_at: string
          witness_1: string | null
          witness_2: string | null
          witness_3: string | null
        }
        Insert: {
          application_number: string
          approved_at?: string | null
          approved_by?: string | null
          collateral_motor_chassis?: string | null
          collateral_owner?: string | null
          collateral_plate_or_title?: string | null
          collateral_type?: string | null
          collateral_value?: number | null
          committee_decision_date?: string | null
          created_at?: string
          created_by?: string | null
          doc_cheque?: boolean
          doc_fayda_kebele?: boolean
          doc_insurance?: boolean
          doc_marriage_cert?: boolean
          doc_member_booklet?: boolean
          doc_restraint_letter?: boolean
          doc_vehicle_house_title?: boolean
          end_month?: string | null
          id?: string
          insurance_fee?: number
          interest_rate?: number
          is_mor_staff?: boolean
          late_penalty_rate?: number
          loan_id?: string | null
          manager_name?: string | null
          mandatory_savings?: number
          member_id: string
          monthly_income?: number | null
          monthly_installment?: number
          net_to_member?: number
          purpose?: string | null
          registration_id?: string | null
          rejected_reason?: string | null
          requested_amount: number
          service_fee?: number
          start_month?: string | null
          status?: string
          term_months: number
          total_payable?: number
          total_upfront_fees?: number
          updated_at?: string
          witness_1?: string | null
          witness_2?: string | null
          witness_3?: string | null
        }
        Update: {
          application_number?: string
          approved_at?: string | null
          approved_by?: string | null
          collateral_motor_chassis?: string | null
          collateral_owner?: string | null
          collateral_plate_or_title?: string | null
          collateral_type?: string | null
          collateral_value?: number | null
          committee_decision_date?: string | null
          created_at?: string
          created_by?: string | null
          doc_cheque?: boolean
          doc_fayda_kebele?: boolean
          doc_insurance?: boolean
          doc_marriage_cert?: boolean
          doc_member_booklet?: boolean
          doc_restraint_letter?: boolean
          doc_vehicle_house_title?: boolean
          end_month?: string | null
          id?: string
          insurance_fee?: number
          interest_rate?: number
          is_mor_staff?: boolean
          late_penalty_rate?: number
          loan_id?: string | null
          manager_name?: string | null
          mandatory_savings?: number
          member_id?: string
          monthly_income?: number | null
          monthly_installment?: number
          net_to_member?: number
          purpose?: string | null
          registration_id?: string | null
          rejected_reason?: string | null
          requested_amount?: number
          service_fee?: number
          start_month?: string | null
          status?: string
          term_months?: number
          total_payable?: number
          total_upfront_fees?: number
          updated_at?: string
          witness_1?: string | null
          witness_2?: string | null
          witness_3?: string | null
        }
        Relationships: []
      }
      loan_disbursements: {
        Row: {
          disbursed_at: string
          id: string
          insurance_fee: number
          loan_id: string
          net_to_member: number
          posted_by: string | null
          principal: number
          service_fee: number
          total_fees: number
        }
        Insert: {
          disbursed_at?: string
          id?: string
          insurance_fee?: number
          loan_id: string
          net_to_member: number
          posted_by?: string | null
          principal: number
          service_fee?: number
          total_fees?: number
        }
        Update: {
          disbursed_at?: string
          id?: string
          insurance_fee?: number
          loan_id?: string
          net_to_member?: number
          posted_by?: string | null
          principal?: number
          service_fee?: number
          total_fees?: number
        }
        Relationships: [
          {
            foreignKeyName: "loan_disbursements_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_guarantors: {
        Row: {
          created_at: string
          document_url: string | null
          guarantor_member_id: string | null
          guarantor_name: string | null
          id: string
          kind: string
          loan_id: string
          notes: string | null
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          guarantor_member_id?: string | null
          guarantor_name?: string | null
          id?: string
          kind: string
          loan_id: string
          notes?: string | null
        }
        Update: {
          created_at?: string
          document_url?: string | null
          guarantor_member_id?: string | null
          guarantor_name?: string | null
          id?: string
          kind?: string
          loan_id?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loan_guarantors_guarantor_member_id_fkey"
            columns: ["guarantor_member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loan_guarantors_loan_id_fkey"
            columns: ["loan_id"]
            isOneToOne: false
            referencedRelation: "loans"
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
      loan_schedule: {
        Row: {
          balance_after: number
          due_date: string
          id: string
          installment_amount: number
          installment_no: number
          interest_portion: number
          loan_id: string
          paid_at: string | null
          principal_portion: number
          status: string
        }
        Insert: {
          balance_after: number
          due_date: string
          id?: string
          installment_amount: number
          installment_no: number
          interest_portion: number
          loan_id: string
          paid_at?: string | null
          principal_portion: number
          status?: string
        }
        Update: {
          balance_after?: number
          due_date?: string
          id?: string
          installment_amount?: number
          installment_no?: number
          interest_portion?: number
          loan_id?: string
          paid_at?: string | null
          principal_portion?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_schedule_loan_id_fkey"
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
      member_payments: {
        Row: {
          alloc_extra_savings: number
          alloc_initial_savings: number
          alloc_registration_fee: number
          alloc_share_capital: number
          amount: number
          bank_name: string | null
          bank_reference: string | null
          created_at: string
          created_by: string | null
          id: string
          member_id: string | null
          notes: string | null
          paid_at: string
          purpose: string
          registration_id: string | null
          screenshot_url: string | null
          verified: boolean
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          alloc_extra_savings?: number
          alloc_initial_savings?: number
          alloc_registration_fee?: number
          alloc_share_capital?: number
          amount: number
          bank_name?: string | null
          bank_reference?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          member_id?: string | null
          notes?: string | null
          paid_at?: string
          purpose?: string
          registration_id?: string | null
          screenshot_url?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          alloc_extra_savings?: number
          alloc_initial_savings?: number
          alloc_registration_fee?: number
          alloc_share_capital?: number
          amount?: number
          bank_name?: string | null
          bank_reference?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          member_id?: string | null
          notes?: string | null
          paid_at?: string
          purpose?: string
          registration_id?: string | null
          screenshot_url?: string | null
          verified?: boolean
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "member_payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "member_payments_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "registrations"
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
          employer: string | null
          full_name: string
          gender: string | null
          id: string
          is_mor_staff: boolean
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
          employer?: string | null
          full_name: string
          gender?: string | null
          id?: string
          is_mor_staff?: boolean
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
          employer?: string | null
          full_name?: string
          gender?: string | null
          id?: string
          is_mor_staff?: boolean
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
          employer: string | null
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
          is_mor_staff: boolean
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
          employer?: string | null
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
          is_mor_staff?: boolean
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
          employer?: string | null
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
          is_mor_staff?: boolean
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
      sacco_settings: {
        Row: {
          disbursement_fee_high: number
          disbursement_fee_low: number
          disbursement_fee_threshold: number
          id: number
          initial_savings: number
          loan_eligibility_multiplier: number
          loan_rate_3y: number
          loan_rate_4y: number
          loan_rate_5y: number
          monthly_min_savings: number
          registration_fee: number
          savings_annual_rate: number
          savings_tax_rate: number
          share_contribution: number
          updated_at: string
        }
        Insert: {
          disbursement_fee_high?: number
          disbursement_fee_low?: number
          disbursement_fee_threshold?: number
          id?: number
          initial_savings?: number
          loan_eligibility_multiplier?: number
          loan_rate_3y?: number
          loan_rate_4y?: number
          loan_rate_5y?: number
          monthly_min_savings?: number
          registration_fee?: number
          savings_annual_rate?: number
          savings_tax_rate?: number
          share_contribution?: number
          updated_at?: string
        }
        Update: {
          disbursement_fee_high?: number
          disbursement_fee_low?: number
          disbursement_fee_threshold?: number
          id?: number
          initial_savings?: number
          loan_eligibility_multiplier?: number
          loan_rate_3y?: number
          loan_rate_4y?: number
          loan_rate_5y?: number
          monthly_min_savings?: number
          registration_fee?: number
          savings_annual_rate?: number
          savings_tax_rate?: number
          share_contribution?: number
          updated_at?: string
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
      savings_interest_accruals: {
        Row: {
          account_id: string
          closing_balance: number
          gross_interest: number
          id: string
          net_interest: number
          opening_balance: number
          period: string
          posted_at: string
          posted_by: string | null
          tax: number
        }
        Insert: {
          account_id: string
          closing_balance: number
          gross_interest: number
          id?: string
          net_interest: number
          opening_balance: number
          period: string
          posted_at?: string
          posted_by?: string | null
          tax: number
        }
        Update: {
          account_id?: string
          closing_balance?: number
          gross_interest?: number
          id?: string
          net_interest?: number
          opening_balance?: number
          period?: string
          posted_at?: string
          posted_by?: string | null
          tax?: number
        }
        Relationships: [
          {
            foreignKeyName: "savings_interest_accruals_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "savings_accounts"
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
      share_capital: {
        Row: {
          balance: number
          id: string
          member_id: string
          updated_at: string
        }
        Insert: {
          balance?: number
          id?: string
          member_id: string
          updated_at?: string
        }
        Update: {
          balance?: number
          id?: string
          member_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "share_capital_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: true
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
        ]
      }
      share_dividends: {
        Row: {
          amount: number
          fiscal_year: number
          id: string
          member_id: string
          posted_at: string
          posted_by: string | null
          rate: number
          share_balance: number
        }
        Insert: {
          amount: number
          fiscal_year: number
          id?: string
          member_id: string
          posted_at?: string
          posted_by?: string | null
          rate: number
          share_balance: number
        }
        Update: {
          amount?: number
          fiscal_year?: number
          id?: string
          member_id?: string
          posted_at?: string
          posted_by?: string | null
          rate?: number
          share_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "share_dividends_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
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
      accrue_monthly_savings_interest: {
        Args: { _period?: string }
        Returns: {
          accounts_processed: number
          total_net_interest: number
        }[]
      }
      compute_disbursement_fee: {
        Args: { _principal: number }
        Returns: {
          insurance_fee: number
          net_to_member: number
          service_fee: number
          total_fees: number
        }[]
      }
      compute_loan_rate: { Args: { _term_months: number }; Returns: number }
      compute_loan_rate_v2: {
        Args: { _is_mor: boolean; _term_months: number }
        Returns: number
      }
      eligible_loan_max: { Args: { _member_id: string }; Returns: number }
      generate_loan_schedule: { Args: { _loan_id: string }; Returns: number }
      generate_referral_code: { Args: never; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      member_has_6_months: { Args: { _member_id: string }; Returns: boolean }
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
