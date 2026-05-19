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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
          conversation: Json
          last_activity_at: string
          locale: string
          org_id: string | null
          session_id: string
          started_at: string
          state: Json
          turns: Json
          user_id: string
        }
        Insert: {
          conversation?: Json
          last_activity_at?: string
          locale?: string
          org_id?: string | null
          session_id?: string
          started_at?: string
          state?: Json
          turns?: Json
          user_id: string
        }
        Update: {
          conversation?: Json
          last_activity_at?: string
          locale?: string
          org_id?: string | null
          session_id?: string
          started_at?: string
          state?: Json
          turns?: Json
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
          resolution_reason: string | null
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
          resolution_reason?: string | null
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
          resolution_reason?: string | null
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
          org_id: string | null
          reason: string | null
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
          org_id?: string | null
          reason?: string | null
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
          org_id?: string | null
          reason?: string | null
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
          line_number: number | null
          tax_code_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount: number
          amount_cad?: number
          amount_original?: number
          bill_id: string
          bill_line_id?: string
          description: string
          line_number?: number | null
          tax_code_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          amount_cad?: number
          amount_original?: number
          bill_id?: string
          bill_line_id?: string
          description?: string
          line_number?: number | null
          tax_code_id?: string | null
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
          {
            foreignKeyName: "bill_lines_tax_code_id_fkey"
            columns: ["tax_code_id"]
            isOneToOne: false
            referencedRelation: "tax_codes"
            referencedColumns: ["tax_code_id"]
          },
        ]
      }
      bill_payment_allocations: {
        Row: {
          amount_cad: number
          bill_id: string
          bill_payment_allocation_id: string
          created_at: string
          created_by: string
          org_id: string
          payment_id: string
          trace_id: string
        }
        Insert: {
          amount_cad: number
          bill_id: string
          bill_payment_allocation_id?: string
          created_at?: string
          created_by: string
          org_id: string
          payment_id: string
          trace_id: string
        }
        Update: {
          amount_cad?: number
          bill_id?: string
          bill_payment_allocation_id?: string
          created_at?: string
          created_by?: string
          org_id?: string
          payment_id?: string
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_payment_allocations_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "bill_payment_allocations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "bill_payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["payment_id"]
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
          lifecycle_state: Database["public"]["Enums"]["bill_lifecycle_state"]
          org_id: string
          override_evidence_completeness: boolean
          payment_terms_days: number | null
          posted_journal_entry_id: string | null
          purchase_order_id: string | null
          status: string
          tax_amount_total: number
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
          lifecycle_state?: Database["public"]["Enums"]["bill_lifecycle_state"]
          org_id: string
          override_evidence_completeness?: boolean
          payment_terms_days?: number | null
          posted_journal_entry_id?: string | null
          purchase_order_id?: string | null
          status?: string
          tax_amount_total?: number
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
          lifecycle_state?: Database["public"]["Enums"]["bill_lifecycle_state"]
          org_id?: string
          override_evidence_completeness?: boolean
          payment_terms_days?: number | null
          posted_journal_entry_id?: string | null
          purchase_order_id?: string | null
          status?: string
          tax_amount_total?: number
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
            foreignKeyName: "bills_posted_journal_entry_id_fkey"
            columns: ["posted_journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["journal_entry_id"]
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
      document_artifacts: {
        Row: {
          confidence: number | null
          created_at: string
          engine: Database["public"]["Enums"]["document_artifact_engine"]
          engine_version: string
          extraction_run_id: string
          id: string
          lines: Json
          ocr_run_id: string
          pages: Json
          pipeline_trace: Json
          quality_flags: string[]
          source_document_id: string
          words: Json
        }
        Insert: {
          confidence?: number | null
          created_at?: string
          engine: Database["public"]["Enums"]["document_artifact_engine"]
          engine_version: string
          extraction_run_id: string
          id?: string
          lines: Json
          ocr_run_id: string
          pages: Json
          pipeline_trace: Json
          quality_flags: string[]
          source_document_id: string
          words: Json
        }
        Update: {
          confidence?: number | null
          created_at?: string
          engine?: Database["public"]["Enums"]["document_artifact_engine"]
          engine_version?: string
          extraction_run_id?: string
          id?: string
          lines?: Json
          ocr_run_id?: string
          pages?: Json
          pipeline_trace?: Json
          quality_flags?: string[]
          source_document_id?: string
          words?: Json
        }
        Relationships: [
          {
            foreignKeyName: "document_artifacts_extraction_run_id_fkey"
            columns: ["extraction_run_id"]
            isOneToOne: false
            referencedRelation: "extraction_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_artifacts_ocr_run_id_fkey"
            columns: ["ocr_run_id"]
            isOneToOne: false
            referencedRelation: "ocr_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_artifacts_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "document_cards_view"
            referencedColumns: ["source_document_id"]
          },
          {
            foreignKeyName: "document_artifacts_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_case_sources: {
        Row: {
          created_at: string
          created_by: string
          document_case_id: string
          id: string
          role: Database["public"]["Enums"]["document_case_source_role"]
          source_document_id: string
          trace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          document_case_id: string
          id?: string
          role: Database["public"]["Enums"]["document_case_source_role"]
          source_document_id: string
          trace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          document_case_id?: string
          id?: string
          role?: Database["public"]["Enums"]["document_case_source_role"]
          source_document_id?: string
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_case_sources_document_case_id_fkey"
            columns: ["document_case_id"]
            isOneToOne: false
            referencedRelation: "document_cards_view"
            referencedColumns: ["case_id"]
          },
          {
            foreignKeyName: "document_case_sources_document_case_id_fkey"
            columns: ["document_case_id"]
            isOneToOne: false
            referencedRelation: "document_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_case_sources_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "document_cards_view"
            referencedColumns: ["source_document_id"]
          },
          {
            foreignKeyName: "document_case_sources_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_cases: {
        Row: {
          classification_confidence: number | null
          created_at: string
          created_by: string
          current_relationship_candidate_id: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          id: string
          org_id: string
          state: Database["public"]["Enums"]["document_case_state"]
          trace_id: string
        }
        Insert: {
          classification_confidence?: number | null
          created_at?: string
          created_by: string
          current_relationship_candidate_id?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          id?: string
          org_id: string
          state?: Database["public"]["Enums"]["document_case_state"]
          trace_id: string
        }
        Update: {
          classification_confidence?: number | null
          created_at?: string
          created_by?: string
          current_relationship_candidate_id?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          org_id?: string
          state?: Database["public"]["Enums"]["document_case_state"]
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_cases_current_relationship_candidate_id_fk"
            columns: ["current_relationship_candidate_id"]
            isOneToOne: false
            referencedRelation: "document_relationship_candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_cases_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      document_jobs: {
        Row: {
          attempt_count: number
          completed_at: string | null
          created_at: string
          created_by: string
          document_case_id: string
          id: string
          ingest_batch_id: string
          last_error_code: string | null
          last_error_message: string | null
          org_id: string
          pipeline_trace_id: string | null
          source_document_id: string
          started_at: string | null
          state: Database["public"]["Enums"]["document_job_state"]
          trace_id: string
        }
        Insert: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          created_by: string
          document_case_id: string
          id?: string
          ingest_batch_id: string
          last_error_code?: string | null
          last_error_message?: string | null
          org_id: string
          pipeline_trace_id?: string | null
          source_document_id: string
          started_at?: string | null
          state: Database["public"]["Enums"]["document_job_state"]
          trace_id: string
        }
        Update: {
          attempt_count?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string
          document_case_id?: string
          id?: string
          ingest_batch_id?: string
          last_error_code?: string | null
          last_error_message?: string | null
          org_id?: string
          pipeline_trace_id?: string | null
          source_document_id?: string
          started_at?: string | null
          state?: Database["public"]["Enums"]["document_job_state"]
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_jobs_document_case_id_fkey"
            columns: ["document_case_id"]
            isOneToOne: false
            referencedRelation: "document_cards_view"
            referencedColumns: ["case_id"]
          },
          {
            foreignKeyName: "document_jobs_document_case_id_fkey"
            columns: ["document_case_id"]
            isOneToOne: false
            referencedRelation: "document_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_jobs_ingest_batch_id_fkey"
            columns: ["ingest_batch_id"]
            isOneToOne: false
            referencedRelation: "document_cards_view"
            referencedColumns: ["ingest_batch_id"]
          },
          {
            foreignKeyName: "document_jobs_ingest_batch_id_fkey"
            columns: ["ingest_batch_id"]
            isOneToOne: false
            referencedRelation: "ingest_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_jobs_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "document_jobs_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "document_cards_view"
            referencedColumns: ["source_document_id"]
          },
          {
            foreignKeyName: "document_jobs_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_relationship_candidates: {
        Row: {
          candidate_features: Json
          confidence_score: number
          created_at: string
          created_by: string
          document_case_id: string
          id: string
          link_role: Database["public"]["Enums"]["link_role"]
          linked_entity_id: string
          linked_entity_type: Database["public"]["Enums"]["linked_entity_type"]
          org_id: string
          source_document_id: string
          supersedes_candidate_id: string | null
          trace_id: string
        }
        Insert: {
          candidate_features: Json
          confidence_score: number
          created_at?: string
          created_by: string
          document_case_id: string
          id?: string
          link_role: Database["public"]["Enums"]["link_role"]
          linked_entity_id: string
          linked_entity_type: Database["public"]["Enums"]["linked_entity_type"]
          org_id: string
          source_document_id: string
          supersedes_candidate_id?: string | null
          trace_id: string
        }
        Update: {
          candidate_features?: Json
          confidence_score?: number
          created_at?: string
          created_by?: string
          document_case_id?: string
          id?: string
          link_role?: Database["public"]["Enums"]["link_role"]
          linked_entity_id?: string
          linked_entity_type?: Database["public"]["Enums"]["linked_entity_type"]
          org_id?: string
          source_document_id?: string
          supersedes_candidate_id?: string | null
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_relationship_candidates_document_case_id_fkey"
            columns: ["document_case_id"]
            isOneToOne: false
            referencedRelation: "document_cards_view"
            referencedColumns: ["case_id"]
          },
          {
            foreignKeyName: "document_relationship_candidates_document_case_id_fkey"
            columns: ["document_case_id"]
            isOneToOne: false
            referencedRelation: "document_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_relationship_candidates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "document_relationship_candidates_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "document_cards_view"
            referencedColumns: ["source_document_id"]
          },
          {
            foreignKeyName: "document_relationship_candidates_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_relationship_candidates_supersedes_candidate_id_fkey"
            columns: ["supersedes_candidate_id"]
            isOneToOne: false
            referencedRelation: "document_relationship_candidates"
            referencedColumns: ["id"]
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
      exception_queue_entries: {
        Row: {
          created_at: string
          created_by: string | null
          document_case_id: string
          exception_queue_entry_id: string
          exception_reason: Database["public"]["Enums"]["exception_reason"]
          exception_status: Database["public"]["Enums"]["exception_status"]
          org_id: string
          resolution_action:
            | Database["public"]["Enums"]["resolution_action"]
            | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          source_document_id: string | null
          trace_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_case_id: string
          exception_queue_entry_id?: string
          exception_reason: Database["public"]["Enums"]["exception_reason"]
          exception_status?: Database["public"]["Enums"]["exception_status"]
          org_id: string
          resolution_action?:
            | Database["public"]["Enums"]["resolution_action"]
            | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          source_document_id?: string | null
          trace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_case_id?: string
          exception_queue_entry_id?: string
          exception_reason?: Database["public"]["Enums"]["exception_reason"]
          exception_status?: Database["public"]["Enums"]["exception_status"]
          org_id?: string
          resolution_action?:
            | Database["public"]["Enums"]["resolution_action"]
            | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          source_document_id?: string | null
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exception_queue_entries_document_case_id_fkey"
            columns: ["document_case_id"]
            isOneToOne: false
            referencedRelation: "document_cards_view"
            referencedColumns: ["case_id"]
          },
          {
            foreignKeyName: "exception_queue_entries_document_case_id_fkey"
            columns: ["document_case_id"]
            isOneToOne: false
            referencedRelation: "document_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exception_queue_entries_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "exception_queue_entries_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "document_cards_view"
            referencedColumns: ["source_document_id"]
          },
          {
            foreignKeyName: "exception_queue_entries_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      extraction_runs: {
        Row: {
          created_at: string
          created_by: string
          extraction_version: string
          id: string
          ocr_run_id: string
          source_document_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          extraction_version: string
          id?: string
          ocr_run_id: string
          source_document_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          extraction_version?: string
          id?: string
          ocr_run_id?: string
          source_document_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "extraction_runs_ocr_run_id_fkey"
            columns: ["ocr_run_id"]
            isOneToOne: false
            referencedRelation: "ocr_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "extraction_runs_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "document_cards_view"
            referencedColumns: ["source_document_id"]
          },
          {
            foreignKeyName: "extraction_runs_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
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
      industries: {
        Row: {
          created_at: string
          default_coa_template_industry:
            | Database["public"]["Enums"]["org_industry"]
            | null
          display_name: string
          industry_id: string
          is_active: boolean
          naics_code: string | null
          parent_industry_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          default_coa_template_industry?:
            | Database["public"]["Enums"]["org_industry"]
            | null
          display_name: string
          industry_id?: string
          is_active?: boolean
          naics_code?: string | null
          parent_industry_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          default_coa_template_industry?:
            | Database["public"]["Enums"]["org_industry"]
            | null
          display_name?: string
          industry_id?: string
          is_active?: boolean
          naics_code?: string | null
          parent_industry_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "industries_parent_industry_id_fkey"
            columns: ["parent_industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["industry_id"]
          },
        ]
      }
      ingest_batches: {
        Row: {
          channel_metadata: Json
          created_at: string
          created_by: string
          id: string
          ingest_channel: Database["public"]["Enums"]["ingest_channel"]
          org_id: string
          received_at: string
          trace_id: string
        }
        Insert: {
          channel_metadata: Json
          created_at?: string
          created_by: string
          id?: string
          ingest_channel: Database["public"]["Enums"]["ingest_channel"]
          org_id: string
          received_at: string
          trace_id: string
        }
        Update: {
          channel_metadata?: Json
          created_at?: string
          created_by?: string
          id?: string
          ingest_channel?: Database["public"]["Enums"]["ingest_channel"]
          org_id?: string
          received_at?: string
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingest_batches_org_id_fkey"
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
      internal_sender_allowlist: {
        Row: {
          added_at: string
          notes: string | null
          sender_address: string
        }
        Insert: {
          added_at?: string
          notes?: string | null
          sender_address: string
        }
        Update: {
          added_at?: string
          notes?: string | null
          sender_address?: string
        }
        Relationships: []
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
          adjustment_reason: string | null
          adjustment_status: Database["public"]["Enums"]["adjustment_status"]
          created_at: string
          created_by: string | null
          description: string
          entry_date: string
          entry_number: number
          entry_type: Database["public"]["Enums"]["entry_type"]
          fiscal_period_id: string
          idempotency_key: string | null
          intercompany_batch_id: string | null
          journal_entry_id: string
          org_id: string
          reference: string | null
          reversal_reason: string | null
          reverses_journal_entry_id: string | null
          source: Database["public"]["Enums"]["journal_entry_source"]
          source_external_id: string | null
          source_system: string
        }
        Insert: {
          adjustment_reason?: string | null
          adjustment_status?: Database["public"]["Enums"]["adjustment_status"]
          created_at?: string
          created_by?: string | null
          description: string
          entry_date: string
          entry_number: number
          entry_type?: Database["public"]["Enums"]["entry_type"]
          fiscal_period_id: string
          idempotency_key?: string | null
          intercompany_batch_id?: string | null
          journal_entry_id?: string
          org_id: string
          reference?: string | null
          reversal_reason?: string | null
          reverses_journal_entry_id?: string | null
          source: Database["public"]["Enums"]["journal_entry_source"]
          source_external_id?: string | null
          source_system: string
        }
        Update: {
          adjustment_reason?: string | null
          adjustment_status?: Database["public"]["Enums"]["adjustment_status"]
          created_at?: string
          created_by?: string | null
          description?: string
          entry_date?: string
          entry_number?: number
          entry_type?: Database["public"]["Enums"]["entry_type"]
          fiscal_period_id?: string
          idempotency_key?: string | null
          intercompany_batch_id?: string | null
          journal_entry_id?: string
          org_id?: string
          reference?: string | null
          reversal_reason?: string | null
          reverses_journal_entry_id?: string | null
          source?: Database["public"]["Enums"]["journal_entry_source"]
          source_external_id?: string | null
          source_system?: string
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
      journal_entry_attachments: {
        Row: {
          attachment_id: string
          journal_entry_id: string
          original_filename: string
          storage_path: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          attachment_id?: string
          journal_entry_id: string
          original_filename: string
          storage_path: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          attachment_id?: string
          journal_entry_id?: string
          original_filename?: string
          storage_path?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journal_entry_attachments_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
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
          invited_via: string | null
          is_org_owner: boolean
          membership_id: string
          org_id: string
          removed_at: string | null
          removed_by: string | null
          role: Database["public"]["Enums"]["user_role"]
          role_id: string
          status: Database["public"]["Enums"]["membership_status"]
          suspended_at: string | null
          suspended_by: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          invited_via?: string | null
          is_org_owner?: boolean
          membership_id?: string
          org_id: string
          removed_at?: string | null
          removed_by?: string | null
          role: Database["public"]["Enums"]["user_role"]
          role_id: string
          status?: Database["public"]["Enums"]["membership_status"]
          suspended_at?: string | null
          suspended_by?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          invited_via?: string | null
          is_org_owner?: boolean
          membership_id?: string
          org_id?: string
          removed_at?: string | null
          removed_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          role_id?: string
          status?: Database["public"]["Enums"]["membership_status"]
          suspended_at?: string | null
          suspended_by?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memberships_invited_via_fkey"
            columns: ["invited_via"]
            isOneToOne: false
            referencedRelation: "org_invitations"
            referencedColumns: ["invitation_id"]
          },
          {
            foreignKeyName: "memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "memberships_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      ocr_runs: {
        Row: {
          created_at: string
          created_by: string
          id: string
          source_document_id: string
          supersedes_ocr_run_id: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          source_document_id: string
          supersedes_ocr_run_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          source_document_id?: string
          supersedes_ocr_run_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ocr_runs_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "document_cards_view"
            referencedColumns: ["source_document_id"]
          },
          {
            foreignKeyName: "ocr_runs_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ocr_runs_supersedes_fk"
            columns: ["supersedes_ocr_run_id"]
            isOneToOne: false
            referencedRelation: "ocr_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      org_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by_user_id: string | null
          created_at: string
          expires_at: string
          invitation_id: string
          invited_by_user_id: string
          invited_email: string
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          token_hash: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          created_at?: string
          expires_at?: string
          invitation_id?: string
          invited_by_user_id: string
          invited_email: string
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token_hash: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by_user_id?: string | null
          created_at?: string
          expires_at?: string
          invitation_id?: string
          invited_by_user_id?: string
          invited_email?: string
          org_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          token_hash?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      organization_addresses: {
        Row: {
          address_id: string
          address_type: Database["public"]["Enums"]["address_type"]
          attention: string | null
          city: string | null
          country: string
          created_at: string
          created_by: string | null
          is_primary: boolean
          line1: string
          line2: string | null
          org_id: string
          postal_code: string | null
          region: string | null
        }
        Insert: {
          address_id?: string
          address_type: Database["public"]["Enums"]["address_type"]
          attention?: string | null
          city?: string | null
          country: string
          created_at?: string
          created_by?: string | null
          is_primary?: boolean
          line1: string
          line2?: string | null
          org_id: string
          postal_code?: string | null
          region?: string | null
        }
        Update: {
          address_id?: string
          address_type?: Database["public"]["Enums"]["address_type"]
          attention?: string | null
          city?: string | null
          country?: string
          created_at?: string
          created_by?: string | null
          is_primary?: boolean
          line1?: string
          line2?: string | null
          org_id?: string
          postal_code?: string | null
          region?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_addresses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      organizations: {
        Row: {
          accounting_framework: Database["public"]["Enums"]["accounting_framework"]
          books_start_date: string | null
          business_registration_number: string | null
          business_structure: Database["public"]["Enums"]["business_structure"]
          created_at: string
          created_by: string | null
          default_locale: string
          default_payment_terms_days: number
          default_report_basis: Database["public"]["Enums"]["report_basis"]
          description: string | null
          email: string | null
          external_ids: Json
          fiscal_year_start_month: number
          functional_currency: string
          gst_registration_date: string | null
          industry: Database["public"]["Enums"]["org_industry"]
          industry_id: string
          legal_name: string | null
          logo_storage_path: string | null
          mfa_required: boolean
          multi_currency_enabled: boolean
          name: string
          org_id: string
          parent_org_id: string | null
          phone: string | null
          phone_country_code: string | null
          status: Database["public"]["Enums"]["org_status"]
          tax_registration_number: string | null
          time_zone: string
          website: string | null
        }
        Insert: {
          accounting_framework?: Database["public"]["Enums"]["accounting_framework"]
          books_start_date?: string | null
          business_registration_number?: string | null
          business_structure: Database["public"]["Enums"]["business_structure"]
          created_at?: string
          created_by?: string | null
          default_locale?: string
          default_payment_terms_days?: number
          default_report_basis?: Database["public"]["Enums"]["report_basis"]
          description?: string | null
          email?: string | null
          external_ids?: Json
          fiscal_year_start_month?: number
          functional_currency?: string
          gst_registration_date?: string | null
          industry: Database["public"]["Enums"]["org_industry"]
          industry_id: string
          legal_name?: string | null
          logo_storage_path?: string | null
          mfa_required?: boolean
          multi_currency_enabled?: boolean
          name: string
          org_id?: string
          parent_org_id?: string | null
          phone?: string | null
          phone_country_code?: string | null
          status?: Database["public"]["Enums"]["org_status"]
          tax_registration_number?: string | null
          time_zone?: string
          website?: string | null
        }
        Update: {
          accounting_framework?: Database["public"]["Enums"]["accounting_framework"]
          books_start_date?: string | null
          business_registration_number?: string | null
          business_structure?: Database["public"]["Enums"]["business_structure"]
          created_at?: string
          created_by?: string | null
          default_locale?: string
          default_payment_terms_days?: number
          default_report_basis?: Database["public"]["Enums"]["report_basis"]
          description?: string | null
          email?: string | null
          external_ids?: Json
          fiscal_year_start_month?: number
          functional_currency?: string
          gst_registration_date?: string | null
          industry?: Database["public"]["Enums"]["org_industry"]
          industry_id?: string
          legal_name?: string | null
          logo_storage_path?: string | null
          mfa_required?: boolean
          multi_currency_enabled?: boolean
          name?: string
          org_id?: string
          parent_org_id?: string | null
          phone?: string | null
          phone_country_code?: string | null
          status?: Database["public"]["Enums"]["org_status"]
          tax_registration_number?: string | null
          time_zone?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_industry_id_fkey"
            columns: ["industry_id"]
            isOneToOne: false
            referencedRelation: "industries"
            referencedColumns: ["industry_id"]
          },
          {
            foreignKeyName: "organizations_parent_org_id_fkey"
            columns: ["parent_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          applied_to: string | null
          authorization_reference: string | null
          bank_or_card_last4: string | null
          created_at: string
          currency: string
          merchant_identifier: string | null
          org_id: string
          payment_date: string
          payment_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          payment_purpose: Database["public"]["Enums"]["payment_purpose"]
          payment_state: Database["public"]["Enums"]["payment_state"]
          reference_number: string | null
          statement_appearance_date: string | null
          vendor_id: string | null
        }
        Insert: {
          amount: number
          applied_to?: string | null
          authorization_reference?: string | null
          bank_or_card_last4?: string | null
          created_at?: string
          currency?: string
          merchant_identifier?: string | null
          org_id: string
          payment_date: string
          payment_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_purpose?: Database["public"]["Enums"]["payment_purpose"]
          payment_state?: Database["public"]["Enums"]["payment_state"]
          reference_number?: string | null
          statement_appearance_date?: string | null
          vendor_id?: string | null
        }
        Update: {
          amount?: number
          applied_to?: string | null
          authorization_reference?: string | null
          bank_or_card_last4?: string | null
          created_at?: string
          currency?: string
          merchant_identifier?: string | null
          org_id?: string
          payment_date?: string
          payment_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          payment_purpose?: Database["public"]["Enums"]["payment_purpose"]
          payment_state?: Database["public"]["Enums"]["payment_state"]
          reference_number?: string | null
          statement_appearance_date?: string | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "payments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      permissions: {
        Row: {
          category: string
          created_at: string
          description: string | null
          display_name: string
          permission_key: string
          sort_order: number
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          display_name: string
          permission_key: string
          sort_order?: number
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          display_name?: string
          permission_key?: string
          sort_order?: number
        }
        Relationships: []
      }
      recurring_journal_runs: {
        Row: {
          created_at: string
          journal_entry_id: string | null
          recurring_run_id: string
          recurring_template_id: string
          rejection_reason: string | null
          scheduled_for: string
          status: Database["public"]["Enums"]["recurring_run_status"]
        }
        Insert: {
          created_at?: string
          journal_entry_id?: string | null
          recurring_run_id?: string
          recurring_template_id: string
          rejection_reason?: string | null
          scheduled_for: string
          status?: Database["public"]["Enums"]["recurring_run_status"]
        }
        Update: {
          created_at?: string
          journal_entry_id?: string | null
          recurring_run_id?: string
          recurring_template_id?: string
          rejection_reason?: string | null
          scheduled_for?: string
          status?: Database["public"]["Enums"]["recurring_run_status"]
        }
        Relationships: [
          {
            foreignKeyName: "recurring_journal_runs_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "journal_entries"
            referencedColumns: ["journal_entry_id"]
          },
          {
            foreignKeyName: "recurring_journal_runs_recurring_template_id_fkey"
            columns: ["recurring_template_id"]
            isOneToOne: false
            referencedRelation: "recurring_journal_templates"
            referencedColumns: ["recurring_template_id"]
          },
        ]
      }
      recurring_journal_template_lines: {
        Row: {
          account_id: string
          credit_amount: number
          currency: string
          debit_amount: number
          description: string | null
          recurring_template_id: string
          tax_code_id: string | null
          template_line_id: string
        }
        Insert: {
          account_id: string
          credit_amount?: number
          currency?: string
          debit_amount?: number
          description?: string | null
          recurring_template_id: string
          tax_code_id?: string | null
          template_line_id?: string
        }
        Update: {
          account_id?: string
          credit_amount?: number
          currency?: string
          debit_amount?: number
          description?: string | null
          recurring_template_id?: string
          tax_code_id?: string | null
          template_line_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_journal_template_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["account_id"]
          },
          {
            foreignKeyName: "recurring_journal_template_lines_recurring_template_id_fkey"
            columns: ["recurring_template_id"]
            isOneToOne: false
            referencedRelation: "recurring_journal_templates"
            referencedColumns: ["recurring_template_id"]
          },
          {
            foreignKeyName: "recurring_journal_template_lines_tax_code_id_fkey"
            columns: ["tax_code_id"]
            isOneToOne: false
            referencedRelation: "tax_codes"
            referencedColumns: ["tax_code_id"]
          },
        ]
      }
      recurring_journal_templates: {
        Row: {
          auto_post: boolean
          created_at: string
          created_by: string | null
          description: string | null
          is_active: boolean
          org_id: string
          recurring_template_id: string
          template_name: string
        }
        Insert: {
          auto_post?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          is_active?: boolean
          org_id: string
          recurring_template_id?: string
          template_name: string
        }
        Update: {
          auto_post?: boolean
          created_at?: string
          created_by?: string | null
          description?: string | null
          is_active?: boolean
          org_id?: string
          recurring_template_id?: string
          template_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_journal_templates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          granted_at: string
          permission_key: string
          role_id: string
        }
        Insert: {
          granted_at?: string
          permission_key: string
          role_id: string
        }
        Update: {
          granted_at?: string
          permission_key?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_key_fkey"
            columns: ["permission_key"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["permission_key"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["role_id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string
          description: string | null
          display_name: string
          is_system: boolean
          org_id: string | null
          role_id: string
          role_key: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_name: string
          is_system?: boolean
          org_id?: string | null
          role_id?: string
          role_key: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          display_name?: string
          is_system?: boolean
          org_id?: string | null
          role_id?: string
          role_key?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
      source_document_links: {
        Row: {
          created_at: string
          created_by: string
          id: string
          link_role: Database["public"]["Enums"]["link_role"]
          link_status: Database["public"]["Enums"]["link_status"]
          linked_entity_id: string
          linked_entity_type: Database["public"]["Enums"]["linked_entity_type"]
          source_document_id: string
          trace_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          link_role: Database["public"]["Enums"]["link_role"]
          link_status?: Database["public"]["Enums"]["link_status"]
          linked_entity_id: string
          linked_entity_type: Database["public"]["Enums"]["linked_entity_type"]
          source_document_id: string
          trace_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          link_role?: Database["public"]["Enums"]["link_role"]
          link_status?: Database["public"]["Enums"]["link_status"]
          linked_entity_id?: string
          linked_entity_type?: Database["public"]["Enums"]["linked_entity_type"]
          source_document_id?: string
          trace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "source_document_links_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "document_cards_view"
            referencedColumns: ["source_document_id"]
          },
          {
            foreignKeyName: "source_document_links_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      source_document_versions: {
        Row: {
          byte_size: number
          capture_reason: Database["public"]["Enums"]["capture_reason"]
          captured_at: string
          content_hash: string
          created_at: string
          id: string
          source_document_id: string
          storage_key: string
          storage_provider: Database["public"]["Enums"]["storage_provider"]
          supersedes_version_id: string | null
          version_number: number
        }
        Insert: {
          byte_size: number
          capture_reason: Database["public"]["Enums"]["capture_reason"]
          captured_at: string
          content_hash: string
          created_at?: string
          id?: string
          source_document_id: string
          storage_key: string
          storage_provider: Database["public"]["Enums"]["storage_provider"]
          supersedes_version_id?: string | null
          version_number: number
        }
        Update: {
          byte_size?: number
          capture_reason?: Database["public"]["Enums"]["capture_reason"]
          captured_at?: string
          content_hash?: string
          created_at?: string
          id?: string
          source_document_id?: string
          storage_key?: string
          storage_provider?: Database["public"]["Enums"]["storage_provider"]
          supersedes_version_id?: string | null
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "source_document_versions_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "document_cards_view"
            referencedColumns: ["source_document_id"]
          },
          {
            foreignKeyName: "source_document_versions_source_document_id_fkey"
            columns: ["source_document_id"]
            isOneToOne: false
            referencedRelation: "source_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_document_versions_supersedes_version_id_fkey"
            columns: ["supersedes_version_id"]
            isOneToOne: false
            referencedRelation: "source_document_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      source_documents: {
        Row: {
          created_at: string
          created_by: string
          current_version_id: string | null
          id: string
          ingest_batch_id: string
          ingest_channel: Database["public"]["Enums"]["ingest_channel"]
          legal_entity_id: string | null
          mime_type: string
          org_id: string
          original_byte_size: number
          original_content_hash: string
          original_filename: string
          original_storage_key: string
          received_at: string
          storage_provider: Database["public"]["Enums"]["storage_provider"]
          storage_status: Database["public"]["Enums"]["storage_status"]
        }
        Insert: {
          created_at?: string
          created_by: string
          current_version_id?: string | null
          id?: string
          ingest_batch_id: string
          ingest_channel: Database["public"]["Enums"]["ingest_channel"]
          legal_entity_id?: string | null
          mime_type: string
          org_id: string
          original_byte_size: number
          original_content_hash: string
          original_filename: string
          original_storage_key: string
          received_at: string
          storage_provider: Database["public"]["Enums"]["storage_provider"]
          storage_status?: Database["public"]["Enums"]["storage_status"]
        }
        Update: {
          created_at?: string
          created_by?: string
          current_version_id?: string | null
          id?: string
          ingest_batch_id?: string
          ingest_channel?: Database["public"]["Enums"]["ingest_channel"]
          legal_entity_id?: string | null
          mime_type?: string
          org_id?: string
          original_byte_size?: number
          original_content_hash?: string
          original_filename?: string
          original_storage_key?: string
          received_at?: string
          storage_provider?: Database["public"]["Enums"]["storage_provider"]
          storage_status?: Database["public"]["Enums"]["storage_status"]
        }
        Relationships: [
          {
            foreignKeyName: "source_documents_current_version_id_fkey"
            columns: ["current_version_id"]
            isOneToOne: false
            referencedRelation: "source_document_versions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_documents_ingest_batch_id_fkey"
            columns: ["ingest_batch_id"]
            isOneToOne: false
            referencedRelation: "document_cards_view"
            referencedColumns: ["ingest_batch_id"]
          },
          {
            foreignKeyName: "source_documents_ingest_batch_id_fkey"
            columns: ["ingest_batch_id"]
            isOneToOne: false
            referencedRelation: "ingest_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "source_documents_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "source_documents_org_id_fkey"
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
      user_profiles: {
        Row: {
          avatar_storage_path: string | null
          created_at: string
          display_name: string | null
          first_name: string | null
          last_login_at: string | null
          last_name: string | null
          phone: string | null
          phone_country_code: string | null
          preferred_locale: string | null
          preferred_timezone: string | null
          user_id: string
        }
        Insert: {
          avatar_storage_path?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          phone_country_code?: string | null
          preferred_locale?: string | null
          preferred_timezone?: string | null
          user_id: string
        }
        Update: {
          avatar_storage_path?: string | null
          created_at?: string
          display_name?: string | null
          first_name?: string | null
          last_login_at?: string | null
          last_name?: string | null
          phone?: string | null
          phone_country_code?: string | null
          preferred_locale?: string | null
          preferred_timezone?: string | null
          user_id?: string
        }
        Relationships: []
      }
      vendor_credit_applications: {
        Row: {
          amount_cad: number
          amount_original: number
          applied_at: string
          bill_id: string
          created_at: string
          created_by: string
          id: string
          org_id: string
          trace_id: string
          vendor_credit_id: string
        }
        Insert: {
          amount_cad: number
          amount_original: number
          applied_at: string
          bill_id: string
          created_at?: string
          created_by: string
          id?: string
          org_id: string
          trace_id: string
          vendor_credit_id: string
        }
        Update: {
          amount_cad?: number
          amount_original?: number
          applied_at?: string
          bill_id?: string
          created_at?: string
          created_by?: string
          id?: string
          org_id?: string
          trace_id?: string
          vendor_credit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_credit_applications_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "vendor_credit_applications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "vendor_credit_applications_vendor_credit_id_fkey"
            columns: ["vendor_credit_id"]
            isOneToOne: false
            referencedRelation: "vendor_credits"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_credits: {
        Row: {
          amount_cad: number
          amount_original: number
          created_at: string
          created_by: string
          currency: string
          description: string | null
          fx_rate: number | null
          id: string
          issue_date: string
          legal_entity_id: string | null
          org_id: string
          status: string
          trace_id: string
          vendor_id: string
        }
        Insert: {
          amount_cad: number
          amount_original: number
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          fx_rate?: number | null
          id?: string
          issue_date: string
          legal_entity_id?: string | null
          org_id: string
          status?: string
          trace_id: string
          vendor_id: string
        }
        Update: {
          amount_cad?: number
          amount_original?: number
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          fx_rate?: number | null
          id?: string
          issue_date?: string
          legal_entity_id?: string | null
          org_id?: string
          status?: string
          trace_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_credits_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "vendor_credits_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "vendor_credits_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_id"]
          },
        ]
      }
      vendor_prepayment_applications: {
        Row: {
          amount_cad: number
          amount_original: number
          applied_at: string
          bill_id: string
          created_at: string
          created_by: string
          id: string
          org_id: string
          trace_id: string
          vendor_prepayment_id: string
        }
        Insert: {
          amount_cad: number
          amount_original: number
          applied_at: string
          bill_id: string
          created_at?: string
          created_by: string
          id?: string
          org_id: string
          trace_id: string
          vendor_prepayment_id: string
        }
        Update: {
          amount_cad?: number
          amount_original?: number
          applied_at?: string
          bill_id?: string
          created_at?: string
          created_by?: string
          id?: string
          org_id?: string
          trace_id?: string
          vendor_prepayment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_prepayment_applications_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["bill_id"]
          },
          {
            foreignKeyName: "vendor_prepayment_applications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "vendor_prepayment_applications_vendor_prepayment_id_fkey"
            columns: ["vendor_prepayment_id"]
            isOneToOne: false
            referencedRelation: "vendor_prepayments"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_prepayments: {
        Row: {
          amount_cad: number
          amount_original: number
          created_at: string
          created_by: string
          currency: string
          description: string | null
          expected_application_date: string | null
          fx_rate: number | null
          id: string
          legal_entity_id: string | null
          org_id: string
          payment_id: string
          prepayment_type: Database["public"]["Enums"]["vendor_prepayment_type"]
          recognized_at: string
          status: Database["public"]["Enums"]["vendor_prepayment_status"]
          tax_amount_at_payment: number | null
          tax_timing_choice: Database["public"]["Enums"]["tax_timing_choice"]
          trace_id: string
          vendor_id: string
        }
        Insert: {
          amount_cad: number
          amount_original: number
          created_at?: string
          created_by: string
          currency?: string
          description?: string | null
          expected_application_date?: string | null
          fx_rate?: number | null
          id?: string
          legal_entity_id?: string | null
          org_id: string
          payment_id: string
          prepayment_type: Database["public"]["Enums"]["vendor_prepayment_type"]
          recognized_at: string
          status: Database["public"]["Enums"]["vendor_prepayment_status"]
          tax_amount_at_payment?: number | null
          tax_timing_choice: Database["public"]["Enums"]["tax_timing_choice"]
          trace_id: string
          vendor_id: string
        }
        Update: {
          amount_cad?: number
          amount_original?: number
          created_at?: string
          created_by?: string
          currency?: string
          description?: string | null
          expected_application_date?: string | null
          fx_rate?: number | null
          id?: string
          legal_entity_id?: string | null
          org_id?: string
          payment_id?: string
          prepayment_type?: Database["public"]["Enums"]["vendor_prepayment_type"]
          recognized_at?: string
          status?: Database["public"]["Enums"]["vendor_prepayment_status"]
          tax_amount_at_payment?: number | null
          tax_timing_choice?: Database["public"]["Enums"]["tax_timing_choice"]
          trace_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_prepayments_legal_entity_id_fkey"
            columns: ["legal_entity_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "vendor_prepayments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
          {
            foreignKeyName: "vendor_prepayments_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["payment_id"]
          },
          {
            foreignKeyName: "vendor_prepayments_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["vendor_id"]
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
      document_cards_view: {
        Row: {
          case_created_at: string | null
          case_id: string | null
          channel_metadata: Json | null
          ingest_batch_id: string | null
          ingest_channel: Database["public"]["Enums"]["ingest_channel"] | null
          mime_type: string | null
          org_id: string | null
          original_filename: string | null
          received_at: string | null
          source_document_id: string | null
          state: Database["public"]["Enums"]["document_case_state"] | null
        }
        Relationships: [
          {
            foreignKeyName: "document_cases_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["org_id"]
          },
        ]
      }
    }
    Functions: {
      attach_document_case_source_with_audit: {
        Args: { p_audit: Json; p_link: Json }
        Returns: string
      }
      cancel_exception_with_audit: {
        Args: { p_audit: Json; p_entry_id: string }
        Returns: string
      }
      create_candidates_with_audit: {
        Args: { p_audit: Json; p_candidates: Json }
        Returns: string[]
      }
      create_document_case_with_audit: {
        Args: { p_audit: Json; p_case: Json }
        Returns: string
      }
      create_ingest_batch_for_test: {
        Args: {
          p_channel_metadata?: Json
          p_ingest_channel?: Database["public"]["Enums"]["ingest_channel"]
          p_org_id: string
          p_received_at?: string
          p_trace_id?: string
        }
        Returns: {
          ingest_batch_id: string
          trace_id: string
        }[]
      }
      create_ingest_batch_with_documents_with_audit: {
        Args: {
          p_audit: Json
          p_batch: Json
          p_case_sources: Json
          p_cases: Json
          p_documents: Json
          p_jobs: Json
        }
        Returns: string
      }
      create_source_document_link_with_audit: {
        Args: { p_audit: Json; p_link: Json }
        Returns: string
      }
      create_source_document_with_audit: {
        Args: { p_audit: Json; p_source_document: Json }
        Returns: string
      }
      enqueue_exception_with_audit: {
        Args: { p_audit: Json; p_entry: Json }
        Returns: string
      }
      get_account_balance: {
        Args: { p_account_id: string; p_as_of_date: string; p_org_id: string }
        Returns: {
          balance_cad: number
        }[]
      }
      get_account_ledger: {
        Args: { p_account_id: string; p_org_id: string; p_period_id?: string }
        Returns: {
          amount_cad: number
          credit_amount: number
          debit_amount: number
          description: string
          entry_date: string
          entry_number: number
          journal_entry_id: string
          running_balance: number
        }[]
      }
      get_accounts_by_type: {
        Args: { p_account_type: string; p_org_id: string; p_period_id?: string }
        Returns: {
          account_code: string
          account_id: string
          account_name: string
          credit_total_cad: number
          debit_total_cad: number
        }[]
      }
      get_balance_sheet: {
        Args: { p_as_of_date: string; p_org_id: string }
        Returns: {
          account_type: string
          total_cad: number
        }[]
      }
      get_profit_and_loss: {
        Args: { p_org_id: string; p_period_id: string }
        Returns: {
          account_type: string
          credit_total_cad: number
          debit_total_cad: number
        }[]
      }
      get_trial_balance: {
        Args: { p_org_id: string; p_period_id: string }
        Returns: {
          account_code: string
          account_id: string
          account_name: string
          account_type: string
          credit_total_cad: number
          debit_total_cad: number
        }[]
      }
      record_router_decision: {
        Args: { p_audit: Json; p_decision: Json }
        Returns: string
      }
      resolve_exception_with_audit: {
        Args: { p_audit: Json; p_entry_id: string; p_resolution: Json }
        Returns: string
      }
      reverse_source_document_link_with_audit: {
        Args: { p_audit: Json; p_input: Json }
        Returns: string[]
      }
      set_case_head_pointer_with_audit: {
        Args: {
          p_audit_decision: Json
          p_audit_mutation: Json
          p_decision: Json
        }
        Returns: string
      }
      update_document_case_state_with_audit: {
        Args: {
          p_audit: Json
          p_case_id: string
          p_target_state: Database["public"]["Enums"]["document_case_state"]
        }
        Returns: string
      }
      user_has_org_access: { Args: { target_org_id: string }; Returns: boolean }
      user_has_permission: {
        Args: { target_org_id: string; target_permission_key: string }
        Returns: boolean
      }
      user_is_controller: { Args: { target_org_id: string }; Returns: boolean }
      write_journal_entry_atomic: {
        Args: { p_audit: Json; p_entry: Json; p_lines: Json }
        Returns: {
          entry_number: number
          journal_entry_id: string
        }[]
      }
    }
    Enums: {
      account_type: "asset" | "liability" | "equity" | "revenue" | "expense"
      accounting_framework: "aspe" | "ifrs" | "us_gaap" | "other"
      address_type: "mailing" | "physical" | "registered" | "payment_stub"
      adjustment_status: "posted" | "pending_approval" | "approved" | "rejected"
      ai_action_status:
        | "pending"
        | "confirmed"
        | "rejected"
        | "auto_posted"
        | "stale"
        | "edited"
      autonomy_tier: "always_confirm" | "notify_auto" | "silent"
      bill_lifecycle_state:
        | "draft"
        | "pending_approval"
        | "approved_for_payment"
        | "partially_paid"
        | "fully_paid"
        | "voided"
        | "cancelled"
      business_structure:
        | "sole_prop"
        | "partnership"
        | "corporation"
        | "trust"
        | "non_profit"
        | "other"
      capture_reason:
        | "vendor_corrected_invoice"
        | "reformatted_pdf"
        | "accessibility_replacement"
        | "drift_auto_supersession"
        | "drift_controller_override"
        | "drift_rejected_kept_original"
        | "unknown_drift"
      confidence_level: "high" | "medium" | "low" | "novel"
      document_artifact_engine: "paddleocr" | "tesseract" | "claude_vision_3_5"
      document_case_source_role:
        | "primary"
        | "supporting"
        | "email_body"
        | "payment_evidence"
        | "superseded_source"
        | "related_prior_document"
      document_case_state:
        | "received"
        | "extracting"
        | "classified"
        | "matched"
        | "proposed"
        | "needs_review"
        | "approved"
        | "committed"
        | "rejected"
        | "archived"
      document_job_state:
        | "queued"
        | "in_flight"
        | "failed_retry"
        | "failed_permanent"
        | "completed"
      document_type:
        | "vendor_invoice"
        | "receipt"
        | "payment_confirmation"
        | "unknown"
        | "credit_memo"
        | "vendor_statement"
        | "purchase_order"
        | "receiving_document"
        | "retainer_request"
        | "deposit_request"
        | "bank_statement"
        | "card_statement"
        | "customer_invoice"
        | "customer_remittance"
        | "tax_form"
        | "contract"
        | "payroll_document"
        | "asset_purchase_support"
      entry_type: "regular" | "adjusting" | "closing" | "reversing"
      exception_reason:
        | "manual_route"
        | "low_confidence_classification"
        | "unknown_document_type"
        | "unmatched_router_candidate"
        | "multi_candidate_ambiguity"
        | "invariant_violation"
        | "wrong_entity_exception"
        | "drift_detected"
      exception_status: "open" | "resolved" | "cancelled"
      ingest_channel:
        | "drag_drop_pdf"
        | "forwarded_mailbox"
        | "direct_upload"
        | "api_ingest"
      invitation_status: "pending" | "accepted" | "expired" | "revoked"
      journal_entry_source: "manual" | "agent" | "import"
      link_role:
        | "primary_invoice"
        | "payment_evidence"
        | "receipt"
        | "supporting"
        | "duplicate_arrival"
        | "superseded_version"
        | "vendor_credit_memo"
        | "vendor_statement_excerpt"
        | "purchase_order"
        | "receiving_document"
        | "retainer_agreement"
        | "deposit_request"
        | "bank_statement_excerpt"
        | "card_statement_excerpt"
        | "reconciliation_evidence"
        | "failure_notice"
        | "customer_invoice_attachment"
        | "customer_remittance"
        | "tax_form"
        | "contract"
        | "payroll_document"
        | "asset_purchase_support"
        | "prior_period_evidence"
        | "correction_memo"
        | "controller_override_memo"
        | "audit_evidence"
        | "email_thread"
      link_status: "created" | "reversed"
      linked_entity_type:
        | "bill"
        | "bill_line"
        | "payment"
        | "bill_payment_allocation"
        | "vendor_prepayment"
        | "vendor_prepayment_application"
        | "vendor_credit"
        | "vendor_credit_application"
        | "bank_transaction"
        | "card_transaction"
        | "bank_account"
        | "card_account"
        | "customer_invoice"
        | "customer_invoice_line"
        | "customer_payment"
        | "customer_credit"
        | "vendor_statement_line"
        | "bank_reconciliation"
        | "card_reconciliation"
        | "fixed_asset"
        | "tax_filing"
        | "payroll_run"
        | "payroll_employee"
        | "journal_entry"
        | "journal_line"
        | "vendor_master"
        | "customer_master"
        | "period_close"
      membership_status: "active" | "invited" | "suspended" | "removed"
      org_industry:
        | "healthcare"
        | "real_estate"
        | "hospitality"
        | "trading"
        | "restaurant"
        | "holding_company"
      org_status: "active" | "trial" | "suspended" | "archived" | "closed"
      payment_method:
        | "check"
        | "eft"
        | "wire"
        | "cash"
        | "other"
        | "credit_card"
        | "ach"
        | "bank_transfer"
        | "money_order"
      payment_purpose:
        | "bill_payment"
        | "vendor_prepayment"
        | "vendor_refund"
        | "other"
        | "customer_payment"
        | "employee_reimbursement"
        | "owner_reimbursement"
        | "tax_payment"
      payment_state:
        | "pending"
        | "paid"
        | "failed"
        | "partially_returned"
        | "refunded"
      recurring_run_status:
        | "pending_approval"
        | "approved"
        | "posted"
        | "rejected"
      report_basis: "accrual" | "cash"
      resolution_action:
        | "attach_to_existing_bill"
        | "attach_to_existing_payment"
        | "record_bill_payment"
        | "mark_duplicate"
        | "mark_non_accounting"
        | "route_to_manual_entry"
        | "manual_born_paid_workflow"
        | "reprocess"
        | "archive"
        | "create_bill"
        | "create_vendor_prepayment"
        | "apply_vendor_prepayment"
        | "create_vendor_credit"
        | "apply_vendor_credit"
        | "request_missing_document"
        | "route_to_bank_reconciliation"
        | "route_to_AR_future"
        | "backfill_vendor_prepayment_suggested"
      storage_provider:
        | "supabase_storage"
        | "sharepoint_drive"
        | "s3_bucket"
        | "external_url"
      storage_status:
        | "available"
        | "pending_initial_verify"
        | "permission_loss"
        | "missing_file"
        | "hash_mismatch"
        | "provider_unavailable"
        | "verification_pending_retry"
      tax_timing_choice:
        | "at_payment"
        | "at_final_invoice"
        | "review_required"
        | "controller_chooses_per_invoice"
      user_role: "executive" | "controller" | "ap_specialist"
      vendor_prepayment_status:
        | "open"
        | "partially_applied"
        | "fully_applied"
        | "refunded"
        | "written_off"
        | "forfeited"
      vendor_prepayment_type:
        | "retainer"
        | "deposit"
        | "advance"
        | "other"
        | "security_deposit"
        | "prepaid_service"
        | "inventory_deposit"
        | "fixed_asset_deposit"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      account_type: ["asset", "liability", "equity", "revenue", "expense"],
      accounting_framework: ["aspe", "ifrs", "us_gaap", "other"],
      address_type: ["mailing", "physical", "registered", "payment_stub"],
      adjustment_status: ["posted", "pending_approval", "approved", "rejected"],
      ai_action_status: [
        "pending",
        "confirmed",
        "rejected",
        "auto_posted",
        "stale",
        "edited",
      ],
      autonomy_tier: ["always_confirm", "notify_auto", "silent"],
      bill_lifecycle_state: [
        "draft",
        "pending_approval",
        "approved_for_payment",
        "partially_paid",
        "fully_paid",
        "voided",
        "cancelled",
      ],
      business_structure: [
        "sole_prop",
        "partnership",
        "corporation",
        "trust",
        "non_profit",
        "other",
      ],
      capture_reason: [
        "vendor_corrected_invoice",
        "reformatted_pdf",
        "accessibility_replacement",
        "drift_auto_supersession",
        "drift_controller_override",
        "drift_rejected_kept_original",
        "unknown_drift",
      ],
      confidence_level: ["high", "medium", "low", "novel"],
      document_artifact_engine: ["paddleocr", "tesseract", "claude_vision_3_5"],
      document_case_source_role: [
        "primary",
        "supporting",
        "email_body",
        "payment_evidence",
        "superseded_source",
        "related_prior_document",
      ],
      document_case_state: [
        "received",
        "extracting",
        "classified",
        "matched",
        "proposed",
        "needs_review",
        "approved",
        "committed",
        "rejected",
        "archived",
      ],
      document_job_state: [
        "queued",
        "in_flight",
        "failed_retry",
        "failed_permanent",
        "completed",
      ],
      document_type: [
        "vendor_invoice",
        "receipt",
        "payment_confirmation",
        "unknown",
        "credit_memo",
        "vendor_statement",
        "purchase_order",
        "receiving_document",
        "retainer_request",
        "deposit_request",
        "bank_statement",
        "card_statement",
        "customer_invoice",
        "customer_remittance",
        "tax_form",
        "contract",
        "payroll_document",
        "asset_purchase_support",
      ],
      entry_type: ["regular", "adjusting", "closing", "reversing"],
      exception_reason: [
        "manual_route",
        "low_confidence_classification",
        "unknown_document_type",
        "unmatched_router_candidate",
        "multi_candidate_ambiguity",
        "invariant_violation",
        "wrong_entity_exception",
        "drift_detected",
      ],
      exception_status: ["open", "resolved", "cancelled"],
      ingest_channel: [
        "drag_drop_pdf",
        "forwarded_mailbox",
        "direct_upload",
        "api_ingest",
      ],
      invitation_status: ["pending", "accepted", "expired", "revoked"],
      journal_entry_source: ["manual", "agent", "import"],
      link_role: [
        "primary_invoice",
        "payment_evidence",
        "receipt",
        "supporting",
        "duplicate_arrival",
        "superseded_version",
        "vendor_credit_memo",
        "vendor_statement_excerpt",
        "purchase_order",
        "receiving_document",
        "retainer_agreement",
        "deposit_request",
        "bank_statement_excerpt",
        "card_statement_excerpt",
        "reconciliation_evidence",
        "failure_notice",
        "customer_invoice_attachment",
        "customer_remittance",
        "tax_form",
        "contract",
        "payroll_document",
        "asset_purchase_support",
        "prior_period_evidence",
        "correction_memo",
        "controller_override_memo",
        "audit_evidence",
        "email_thread",
      ],
      link_status: ["created", "reversed"],
      linked_entity_type: [
        "bill",
        "bill_line",
        "payment",
        "bill_payment_allocation",
        "vendor_prepayment",
        "vendor_prepayment_application",
        "vendor_credit",
        "vendor_credit_application",
        "bank_transaction",
        "card_transaction",
        "bank_account",
        "card_account",
        "customer_invoice",
        "customer_invoice_line",
        "customer_payment",
        "customer_credit",
        "vendor_statement_line",
        "bank_reconciliation",
        "card_reconciliation",
        "fixed_asset",
        "tax_filing",
        "payroll_run",
        "payroll_employee",
        "journal_entry",
        "journal_line",
        "vendor_master",
        "customer_master",
        "period_close",
      ],
      membership_status: ["active", "invited", "suspended", "removed"],
      org_industry: [
        "healthcare",
        "real_estate",
        "hospitality",
        "trading",
        "restaurant",
        "holding_company",
      ],
      org_status: ["active", "trial", "suspended", "archived", "closed"],
      payment_method: [
        "check",
        "eft",
        "wire",
        "cash",
        "other",
        "credit_card",
        "ach",
        "bank_transfer",
        "money_order",
      ],
      payment_purpose: [
        "bill_payment",
        "vendor_prepayment",
        "vendor_refund",
        "other",
        "customer_payment",
        "employee_reimbursement",
        "owner_reimbursement",
        "tax_payment",
      ],
      payment_state: [
        "pending",
        "paid",
        "failed",
        "partially_returned",
        "refunded",
      ],
      recurring_run_status: [
        "pending_approval",
        "approved",
        "posted",
        "rejected",
      ],
      report_basis: ["accrual", "cash"],
      resolution_action: [
        "attach_to_existing_bill",
        "attach_to_existing_payment",
        "record_bill_payment",
        "mark_duplicate",
        "mark_non_accounting",
        "route_to_manual_entry",
        "manual_born_paid_workflow",
        "reprocess",
        "archive",
        "create_bill",
        "create_vendor_prepayment",
        "apply_vendor_prepayment",
        "create_vendor_credit",
        "apply_vendor_credit",
        "request_missing_document",
        "route_to_bank_reconciliation",
        "route_to_AR_future",
        "backfill_vendor_prepayment_suggested",
      ],
      storage_provider: [
        "supabase_storage",
        "sharepoint_drive",
        "s3_bucket",
        "external_url",
      ],
      storage_status: [
        "available",
        "pending_initial_verify",
        "permission_loss",
        "missing_file",
        "hash_mismatch",
        "provider_unavailable",
        "verification_pending_retry",
      ],
      tax_timing_choice: [
        "at_payment",
        "at_final_invoice",
        "review_required",
        "controller_chooses_per_invoice",
      ],
      user_role: ["executive", "controller", "ap_specialist"],
      vendor_prepayment_status: [
        "open",
        "partially_applied",
        "fully_applied",
        "refunded",
        "written_off",
        "forfeited",
      ],
      vendor_prepayment_type: [
        "retainer",
        "deposit",
        "advance",
        "other",
        "security_deposit",
        "prepaid_service",
        "inventory_deposit",
        "fixed_asset_deposit",
      ],
    },
  },
} as const

