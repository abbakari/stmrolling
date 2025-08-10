export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'salesman' | 'manager' | 'supply_chain'
          department: string
          is_active: boolean
          created_at: string
          last_login: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          email: string
          name: string
          role: 'admin' | 'salesman' | 'manager' | 'supply_chain'
          department: string
          is_active?: boolean
          created_at?: string
          last_login?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'salesman' | 'manager' | 'supply_chain'
          department?: string
          is_active?: boolean
          created_at?: string
          last_login?: string | null
          avatar_url?: string | null
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address: string | null
          contact_person: string | null
          created_at: string
          updated_at: string
          created_by: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address?: string | null
          contact_person?: string | null
          created_at?: string
          updated_at?: string
          created_by: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address?: string | null
          contact_person?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
          is_active?: boolean
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          created_by: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          created_by: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          created_by?: string
          is_active?: boolean
        }
      }
      brands: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          created_by: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          created_by: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          created_by?: string
          is_active?: boolean
        }
      }
      items: {
        Row: {
          id: string
          name: string
          description: string | null
          category_id: string
          brand_id: string
          current_stock: number
          min_stock_level: number
          max_stock_level: number
          unit_price: number
          created_at: string
          updated_at: string
          created_by: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category_id: string
          brand_id: string
          current_stock?: number
          min_stock_level?: number
          max_stock_level?: number
          unit_price?: number
          created_at?: string
          updated_at?: string
          created_by: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category_id?: string
          brand_id?: string
          current_stock?: number
          min_stock_level?: number
          max_stock_level?: number
          unit_price?: number
          created_at?: string
          updated_at?: string
          created_by?: string
          is_active?: boolean
        }
      }
      sales_budgets: {
        Row: {
          id: string
          customer_id: string
          item_id: string
          salesman_id: string
          budget_2025: number
          actual_2025: number
          budget_2026: number
          rate: number
          current_stock: number
          git_quantity: number
          eta: string | null
          budget_value_2026: number
          discount: number
          monthly_data: Json
          status: 'draft' | 'saved' | 'submitted' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
          submitted_at: string | null
          approved_at: string | null
          approved_by: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          item_id: string
          salesman_id: string
          budget_2025?: number
          actual_2025?: number
          budget_2026?: number
          rate?: number
          current_stock?: number
          git_quantity?: number
          eta?: string | null
          budget_value_2026?: number
          discount?: number
          monthly_data?: Json
          status?: 'draft' | 'saved' | 'submitted' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
          submitted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          item_id?: string
          salesman_id?: string
          budget_2025?: number
          actual_2025?: number
          budget_2026?: number
          rate?: number
          current_stock?: number
          git_quantity?: number
          eta?: string | null
          budget_value_2026?: number
          discount?: number
          monthly_data?: Json
          status?: 'draft' | 'saved' | 'submitted' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
          submitted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          notes?: string | null
        }
      }
      rolling_forecasts: {
        Row: {
          id: string
          customer_id: string
          item_id: string
          salesman_id: string
          forecast_data: Json
          forecast_total: number
          budget_data: Json | null
          status: 'draft' | 'saved' | 'submitted' | 'approved' | 'rejected'
          created_at: string
          updated_at: string
          submitted_at: string | null
          approved_at: string | null
          approved_by: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          customer_id: string
          item_id: string
          salesman_id: string
          forecast_data: Json
          forecast_total: number
          budget_data?: Json | null
          status?: 'draft' | 'saved' | 'submitted' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
          submitted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          customer_id?: string
          item_id?: string
          salesman_id?: string
          forecast_data?: Json
          forecast_total?: number
          budget_data?: Json | null
          status?: 'draft' | 'saved' | 'submitted' | 'approved' | 'rejected'
          created_at?: string
          updated_at?: string
          submitted_at?: string | null
          approved_at?: string | null
          approved_by?: string | null
          notes?: string | null
        }
      }
      git_items: {
        Row: {
          id: string
          customer_id: string
          item_id: string
          git_quantity: number
          eta: string | null
          supplier: string | null
          po_number: string | null
          status: 'ordered' | 'shipped' | 'in_transit' | 'delayed' | 'arrived'
          priority: 'low' | 'medium' | 'high' | 'urgent'
          tracking_number: string | null
          estimated_value: number | null
          notes: string | null
          created_at: string
          updated_at: string
          created_by: string
        }
        Insert: {
          id?: string
          customer_id: string
          item_id: string
          git_quantity: number
          eta?: string | null
          supplier?: string | null
          po_number?: string | null
          status?: 'ordered' | 'shipped' | 'in_transit' | 'delayed' | 'arrived'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          tracking_number?: string | null
          estimated_value?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by: string
        }
        Update: {
          id?: string
          customer_id?: string
          item_id?: string
          git_quantity?: number
          eta?: string | null
          supplier?: string | null
          po_number?: string | null
          status?: 'ordered' | 'shipped' | 'in_transit' | 'delayed' | 'arrived'
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          tracking_number?: string | null
          estimated_value?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
        }
      }
      communications: {
        Row: {
          id: string
          from_user_id: string
          to_user_id: string
          subject: string
          message: string
          priority: 'low' | 'medium' | 'high' | 'critical'
          category: 'stock_request' | 'budget_approval' | 'forecast_inquiry' | 'supply_chain' | 'general' | 'system_alert'
          status: 'pending' | 'responded' | 'resolved' | 'escalated'
          is_read: boolean
          reply_to_id: string | null
          created_at: string
          read_at: string | null
        }
        Insert: {
          id?: string
          from_user_id: string
          to_user_id: string
          subject: string
          message: string
          priority?: 'low' | 'medium' | 'high' | 'critical'
          category?: 'stock_request' | 'budget_approval' | 'forecast_inquiry' | 'supply_chain' | 'general' | 'system_alert'
          status?: 'pending' | 'responded' | 'resolved' | 'escalated'
          is_read?: boolean
          reply_to_id?: string | null
          created_at?: string
          read_at?: string | null
        }
        Update: {
          id?: string
          from_user_id?: string
          to_user_id?: string
          subject?: string
          message?: string
          priority?: 'low' | 'medium' | 'high' | 'critical'
          category?: 'stock_request' | 'budget_approval' | 'forecast_inquiry' | 'supply_chain' | 'general' | 'system_alert'
          status?: 'pending' | 'responded' | 'resolved' | 'escalated'
          is_read?: boolean
          reply_to_id?: string | null
          created_at?: string
          read_at?: string | null
        }
      }
      workflows: {
        Row: {
          id: string
          title: string
          description: string | null
          status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed'
          priority: 'low' | 'medium' | 'high' | 'critical'
          assignee_id: string | null
          created_by: string
          created_at: string
          updated_at: string
          due_date: string | null
          completed_at: string | null
          metadata: Json | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          status?: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          assignee_id?: string | null
          created_by: string
          created_at?: string
          updated_at?: string
          due_date?: string | null
          completed_at?: string | null
          metadata?: Json | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          status?: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed'
          priority?: 'low' | 'medium' | 'high' | 'critical'
          assignee_id?: string | null
          created_by?: string
          created_at?: string
          updated_at?: string
          due_date?: string | null
          completed_at?: string | null
          metadata?: Json | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_role: 'admin' | 'salesman' | 'manager' | 'supply_chain'
      status_type: 'draft' | 'saved' | 'submitted' | 'approved' | 'rejected'
      priority_type: 'low' | 'medium' | 'high' | 'critical' | 'urgent'
      git_status: 'ordered' | 'shipped' | 'in_transit' | 'delayed' | 'arrived'
      communication_category: 'stock_request' | 'budget_approval' | 'forecast_inquiry' | 'supply_chain' | 'general' | 'system_alert'
      workflow_status: 'pending' | 'in_review' | 'approved' | 'rejected' | 'completed'
    }
  }
}
