export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      agent_sessions: {
        Row: {
          last_activity_at: string
          locale: string
          org_id: string
          session_id: string
          started_at: string
          state: Json
          user_id: string
        }
        Insert: {
          last_activity_at?: string
          locale?: string
          org_id: string
          session_id?: string
          started_at?: string
          state?: Json
          user_id: string
        }
        Update: {
          last_activity_at?: string
          locale?: string
          org_id?: string
          session_id?: string
          started_at?: string
          state?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_sessions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      ai_actions: {
        Row: {
          ai_action_id: string
          confidence: Database["public"]["Enums"]["confidence_level"] | null
          confirmed_at: string | null
          confirming_user_id: string | null
          created_at: string
          idempotency_key: string
          journal_entry_id: string | null
          org_id: string
          prompt: string | null
          rejection_reason: string | null
          response_payload: Json | null
          routing_path: string | null
          session_id: string | null
          staled_at: string | null
          status: Database["public"]["Enums"]["ai_action_status"]
          tool_input: Json | null
          tool_name: string
          trace_id: string
          user_id: string | null
        }
        Insert: {
          ai_action_id?: string
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          confirmed_at?: string | null
          confirming_user_id?: string | null
          created_at?: string
          idempotency_key: string
          journal_entry_id?: string | null
          org_id: string
          prompt?: string | null
          rejection_reason?: string | null
          response_payload?: Json | null
          routing_path?: string | null
          session_id?: string | null
          staled_at?: string | null
          status?: Database["public"]["Enums"]["ai_action_status"]
          tool_input?: Json | null
          tool_name: string
          trace_id: string
          user_id?: string | null
        }
        Update: {
          ai_action_id?: string
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          confirmed_at?: string | null
          confirming_user_id?: string | null
          created_at?: string
          idempotency_key?: string
          journal_entry_id?: string | null
          org_id?: string
          prompt?: string | null
          rejection_reason?: string | null
          response_payload?: Json | null
          routing_path?: string | null
          session_id?: string | null
          staled_at?: string | null
          status?: Database["public"]["Enums"]["ai_action_status"]
          tool_input?: Json | null
          tool_name?: string
          trace_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_actions_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["journal_entry_id"]
          },
          {
            foreignKeyName: "ai_actions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          after_state_id: string | null
          audit_log_id: string
          before_state: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          idempotency_key: string | null
          org_id: string
          session_id: string | null
          tool_name: string | null
          trace_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          after_state_id?: string | null
          audit_log_id?: string
          before_state?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          idempotency_key?: string | null
          org_id: string
          session_id?: string | null
          tool_name?: string | null
          trace_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          after_state_id?: string | null
          audit_log_id?: string
          before_state?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          idempotency_key?: string | null
          org_id?: string
          session_id?: string | null
          tool_name?: string | null
          trace_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_number_last_four: string | null
          bank_account_id: string
          currency: string
          institution: string | null
          is_active: boolean
          name: string
          org_id: string
        }
        Insert: {
          account_number_last_four?: string | null
          bank_account_id?: string
          currency?: string
          institution?: string | null
          is_active?: boolean
          name: string
          org_id: string
        }
        Update: {
          account_number_last_four?: string | null
          bank_account_id?: string
          currency?: string
          institution?: string | null
          is_active?: boolean
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount_cad: number
          amount_original: number
          bank_account_id: string
          bank_transaction_id: string
          currency: string
          description: string | null
          fx_rate: number
          org_id: string
          posted_at: string
        }
        Insert: {
          amount_cad?: number
          amount_original?: number
          bank_account_id: string
          bank_transaction_id?: string
          currency?: string
          description?: string | null
          fx_rate?: number
          org_id: string
          posted_at: string
        }
        Update: {
          amount_cad?: number
          amount_original?: number
          bank_account_id?: string
          bank_transaction_id?: string
          currency?: string
          description?: string | null
          fx_rate?: number
          org_id?: string
          posted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["bank_account_id"]
          },
          {
            foreignKeyName: "bank_transactions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      bill_lines: {
        Row: {
          account_id: string | null
          amount: number
          amount_cad: number
          amount_original: number
          bill_id: string
          bill_line_id: string
          description: string
        }
        Insert: {
          account_id?: string | null
          amount: number
          amount_cad?: number
          amount_original?: number
          bill_id: string
          bill_line_id?: string
          description: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          amount_cad?: number
          amount_original?: number
          bill_id?: string
          bill_line_id?: string
          description?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "bill_lines_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["bill_id"]
          },
        ]
      }
      bills: {
        Row: {
          amount_cad: number
          amount_original: number
          bill_id: string
          bill_number: string | null
          created_at: string
          currency: string
          due_date: string | null
          fx_rate: number
          issue_date: string
          org_id: string
          status: string
          vendor_id: string
        }
        Insert: {
          amount_cad?: number
          amount_original?: number
          bill_id?: string
          bill_number?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          fx_rate?: number
          issue_date: string
          org_id: string
          status?: string
          vendor_id: string
        }
        Update: {
          amount_cad?: number
          amount_original?: number
          bill_id?: string
          bill_number?: string | null
          created_at?: string
          currency?: string
          due_date?: string | null
          fx_rate?: number
          issue_date?: string
          org_id?: string
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bills_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "bills_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      chart_of_accounts: {
        Row: {
          account_code: string
          account_id: string
          account_name: string
          account_type: Database["public"]["Enums"]["account_type"]
          created_at: string
          is_active: boolean
          is_intercompany_capable: boolean
          org_id: string
          parent_account_id: string | null
        }
        Insert: {
          account_code: string
          account_id?: string
          account_name: string
          account_type: Database["public"]["Enums"]["account_type"]
          created_at?: string
          is_active?: boolean
          is_intercompany_capable?: boolean
          org_id: string
          parent_account_id?: string | null
        }
        Update: {
          account_code?: string
          account_id?: string
          account_name?: string
          account_type?: Database["public"]["Enums"]["account_type"]
          created_at?: string
          is_active?: boolean
          is_intercompany_capable?: boolean
          org_id?: string
          parent_account_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "chart_of_accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["account_id"]
          },
        ]
      }
      chart_of_accounts_templates: {
        Row: {
          account_code: string
          account_name: string
          account_type: Database["public"]["Enums"]["account_type"]
          industry: Database["public"]["Enums"]["org_industry"]
          is_intercompany_capable: boolean
          parent_account_code: string | null
          sort_order: number
          template_id: string
        }
        Insert: {
          account_code: string
          account_name: string
          account_type: Database["public"]["Enums"]["account_type"]
          industry: Database["public"]["Enums"]["org_industry"]
          is_intercompany_capable?: boolean
          parent_account_code?: string | null
          sort_order?: number
          template_id?: string
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: Database["public"]["Enums"]["account_type"]
          industry?: Database["public"]["Enums"]["org_industry"]
          is_intercompany_capable?: boolean
          parent_account_code?: string | null
          sort_order?: number
          template_id?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          created_at: string
          customer_id: string
          email: string | null
          is_active: boolean
          name: string
          org_id: string
          tax_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string
          email?: string | null
          is_active?: boolean
          name: string
          org_id: string
          tax_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          email?: string | null
          is_active?: boolean
          name?: string
          org_id?: string
          tax_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      events: {
        Row: {
          _event_version: string
          aggregate_id: string
          aggregate_type: string
          event_id: string
          event_type: string
          occurred_at: string
          org_id: string
          payload: Json
          recorded_at: string
          sequence_number: number
          trace_id: string
        }
        Insert: {
          _event_version?: string
          aggregate_id: string
          aggregate_type: string
          event_id?: string
          event_type: string
          occurred_at: string
          org_id: string
          payload: Json
          recorded_at?: string
          sequence_number?: number
          trace_id: string
        }
        Update: {
          _event_version?: string
          aggregate_id?: string
          aggregate_type?: string
          event_id?: string
          event_type?: string
          occurred_at?: string
          org_id?: string
          payload?: Json
          recorded_at?: string
          sequence_number?: number
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      fiscal_periods: {
        Row: {
          end_date: string
          is_locked: boolean
          locked_at: string | null
          locked_by_user_id: string | null
          name: string
          org_id: string
          period_id: string
          start_date: string
        }
        Insert: {
          end_date: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by_user_id?: string | null
          name: string
          org_id: string
          period_id?: string
          start_date: string
        }
        Update: {
          end_date?: string
          is_locked?: boolean
          locked_at?: string | null
          locked_by_user_id?: string | null
          name?: string
          org_id?: string
          period_id?: string
          start_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiscal_periods_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      intercompany_relationships: {
        Row: {
          created_at: string
          org_a_due_to_account_id: string | null
          org_a_id: string
          org_b_due_from_account_id: string | null
          org_b_id: string
          relationship_id: string
        }
        Insert: {
          created_at?: string
          org_a_due_to_account_id?: string | null
          org_a_id: string
          org_b_due_from_account_id?: string | null
          org_b_id: string
          relationship_id?: string
        }
        Update: {
          created_at?: string
          org_a_due_to_account_id?: string | null
          org_a_id?: string
          org_b_due_from_account_id?: string | null
          org_b_id?: string
          relationship_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "intercompany_relationships_org_a_due_to_account_id_fkey"
            columns: ["org_a_due_to_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "intercompany_relationships_org_a_id_fkey"
            columns: ["org_a_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "intercompany_relationships_org_b_due_from_account_id_fkey"
            columns: ["org_b_due_from_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "intercompany_relationships_org_b_id_fkey"
            columns: ["org_b_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      invoice_lines: {
        Row: {
          amount_cad: number
          amount_original: number
          description: string
          invoice_id: string
          invoice_line_id: string
          quantity: number
          unit_price: number
        }
        Insert: {
          amount_cad?: number
          amount_original?: number
          description: string
          invoice_id: string
          invoice_line_id?: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          amount_cad?: number
          amount_original?: number
          description?: string
          invoice_id?: string
          invoice_line_id?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_lines_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["invoice_id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cad: number
          amount_original: number
          created_at: string
          currency: string
          customer_id: string
          due_date: string | null
          fx_rate: number
          invoice_id: string
          invoice_number: string
          issue_date: string
          org_id: string
          status: string
        }
        Insert: {
          amount_cad?: number
          amount_original?: number
          created_at?: string
          currency?: string
          customer_id: string
          due_date?: string | null
          fx_rate?: number
          invoice_id?: string
          invoice_number: string
          issue_date: string
          org_id: string
          status?: string
        }
        Update: {
          amount_cad?: number
          amount_original?: number
          created_at?: string
          currency?: string
          customer_id?: string
          due_date?: string | null
          fx_rate?: number
          invoice_id?: string
          invoice_number?: string
          issue_date?: string
          org_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["customer_id"]
          },
          {
            foreignKeyName: "invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      journal_entries: {
        Row: {
          created_at: string
          created_by: string | null
          description: string
          entry_date: string
          fiscal_period_id: string
          idempotency_key: string | null
          intercompany_batch_id: string | null
          journal_entry_id: string
          org_id: string
          reference: string | null
          reverses_journal_entry_id: string | null
          source: Database["public"]["Enums"]["journal_entry_source"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description: string
          entry_date: string
          fiscal_period_id: string
          idempotency_key?: string | null
          intercompany_batch_id?: string | null
          journal_entry_id?: string
          org_id: string
          reference?: string | null
          reverses_journal_entry_id?: string | null
          source: Database["public"]["Enums"]["journal_entry_source"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string
          entry_date?: string
          fiscal_period_id?: string
          idempotency_key?: string | null
          intercompany_batch_id?: string | null
          journal_entry_id?: string
          org_id?: string
          reference?: string | null
          reverses_journal_entry_id?: string | null
          source?: Database["public"]["Enums"]["journal_entry_source"]
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_fiscal_period_id_fkey"
            columns: ["fiscal_period_id"]
            isOneToOne: false
            referencedRelation: "fiscal_periods"
            referencedColumns: ["period_id"]
          },
          {
            foreignKeyName: "journal_entries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "journal_entries_reverses_journal_entry_id_fkey"
            columns: ["reverses_journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["journal_entry_id"]
          },
        ]
      }
      journal_lines: {
        Row: {
          account_id: string
          amount_cad: number
          amount_original: number
          credit_amount: number
          currency: string
          debit_amount: number
          description: string | null
          fx_rate: number
          journal_entry_id: string
          journal_line_id: string
          tax_code_id: string | null
        }
        Insert: {
          account_id: string
          amount_cad?: number
          amount_original?: number
          credit_amount?: number
          currency?: string
          debit_amount?: number
          description?: string | null
          fx_rate?: number
          journal_entry_id: string
          journal_line_id?: string
          tax_code_id?: string | null
        }
        Update: {
          account_id?: string
          amount_cad?: number
          amount_original?: number
          credit_amount?: number
          currency?: string
          debit_amount?: number
          description?: string | null
          fx_rate?: number
          journal_entry_id?: string
          journal_line_id?: string
          tax_code_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "journal_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["journal_entry_id"]
          },
          {
            foreignKeyName: "journal_lines_tax_code_id_fkey"
            columns: ["tax_code_id"]
            isOneToOne: false
            referencedRelation: "tax_codes"
            referencedColumns: ["tax_code_id"]
          },
        ]
      }
      memberships: {
        Row: {
          created_at: string
          membership_id: string
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          membership_id?: string
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          membership_id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          created_by: string | null
          fiscal_year_start_month: number
          functional_currency: string
          industry: Database["public"]["Enums"]["org_industry"]
          legal_name: string | null
          name: string
          org_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          fiscal_year_start_month?: number
          functional_currency?: string
          industry: Database["public"]["Enums"]["org_industry"]
          legal_name?: string | null
          name: string
          org_id?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          fiscal_year_start_month?: number
          functional_currency?: string
          industry?: Database["public"]["Enums"]["org_industry"]
          legal_name?: string | null
          name?: string
          org_id?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          currency: string
          org_id: string
          payment_date: string
          payment_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          org_id: string
          payment_date: string
          payment_id?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          org_id?: string
          payment_date?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      tax_codes: {
        Row: {
          code: string
          effective_from: string
          effective_to: string | null
          jurisdiction: string
          org_id: string | null
          rate: number
          tax_code_id: string
        }
        Insert: {
          code: string
          effective_from: string
          effective_to?: string | null
          jurisdiction: string
          org_id?: string | null
          rate: number
          tax_code_id?: string
        }
        Update: {
          code?: string
          effective_from?: string
          effective_to?: string | null
          jurisdiction?: string
          org_id?: string | null
          rate?: number
          tax_code_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tax_codes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      vendor_rules: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          autonomy_tier: Database["public"]["Enums"]["autonomy_tier"]
          created_at: string
          created_by: string | null
          default_account_id: string | null
          org_id: string
          rule_id: string
          vendor_id: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          autonomy_tier?: Database["public"]["Enums"]["autonomy_tier"]
          created_at?: string
          created_by?: string | null
          default_account_id?: string | null
          org_id: string
          rule_id?: string
          vendor_id: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          autonomy_tier?: Database["public"]["Enums"]["autonomy_tier"]
          created_at?: string
          created_by?: string | null
          default_account_id?: string | null
          org_id?: string
          rule_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_rules_default_account_id_fkey"
            columns: ["default_account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "vendor_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "vendor_rules_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      vendors: {
        Row: {
          created_at: string
          default_currency: string
          email: string | null
          is_active: boolean
          is_intercompany_entity_id: string | null
          name: string
          org_id: string
          tax_id: string | null
          vendor_id: string
        }
        Insert: {
          created_at?: string
          default_currency?: string
          email?: string | null
          is_active?: boolean
          is_intercompany_entity_id?: string | null
          name: string
          org_id: string
          tax_id?: string | null
          vendor_id?: string
        }
        Update: {
          created_at?: string
          default_currency?: string
          email?: string | null
          is_active?: boolean
          is_intercompany_entity_id?: string | null
          name?: string
          org_id?: string
          tax_id?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendors_is_intercompany_entity_id_fkey"
            columns: ["is_intercompany_entity_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "vendors_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      user_has_org_access: {
        Args: {
          target_org_id: string
        }
        Returns: boolean
      }
      user_is_controller: {
        Args: {
          target_org_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      account_type: "asset" | "liability" | "equity" | "revenue" | "expense"
      ai_action_status:
        | "pending"
        | "confirmed"
        | "rejected"
        | "auto_posted"
        | "stale"
      autonomy_tier: "always_confirm" | "notify_auto" | "silent"
      confidence_level: "high" | "medium" | "low" | "novel"
      journal_entry_source: "manual" | "agent" | "import"
      org_industry:
        | "healthcare"
        | "real_estate"
        | "hospitality"
        | "trading"
        | "restaurant"
        | "holding_company"
      user_role: "executive" | "controller" | "ap_specialist"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

