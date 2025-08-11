// Generated TypeScript types for Supabase database schema

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          role: 'admin' | 'manager' | 'salesman'
          avatar_url?: string
          created_at: string
          updated_at: string
          last_login?: string
          is_active: boolean
          department?: string
          region?: string
        }
        Insert: {
          id?: string
          email: string
          name: string
          role: 'admin' | 'manager' | 'salesman'
          avatar_url?: string
          created_at?: string
          updated_at?: string
          last_login?: string
          is_active?: boolean
          department?: string
          region?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          role?: 'admin' | 'manager' | 'salesman'
          avatar_url?: string
          updated_at?: string
          last_login?: string
          is_active?: boolean
          department?: string
          region?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          code: string
          email?: string
          phone?: string
          region: string
          segment: string
          credit_limit: number
          currency: string
          channels: string[]
          seasonality: 'low' | 'medium' | 'high'
          tier: 'bronze' | 'silver' | 'gold' | 'platinum'
          manager_id?: string
          created_at: string
          updated_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          name: string
          code: string
          email?: string
          phone?: string
          region: string
          segment: string
          credit_limit: number
          currency: string
          channels: string[]
          seasonality: 'low' | 'medium' | 'high'
          tier: 'bronze' | 'silver' | 'gold' | 'platinum'
          manager_id?: string
          created_at?: string
          updated_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          name?: string
          code?: string
          email?: string
          phone?: string
          region?: string
          segment?: string
          credit_limit?: number
          currency?: string
          channels?: string[]
          seasonality?: 'low' | 'medium' | 'high'
          tier?: 'bronze' | 'silver' | 'gold' | 'platinum'
          manager_id?: string
          updated_at?: string
          is_active?: boolean
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          code: string
          description?: string
          parent_id?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string
          parent_id?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string
          parent_id?: string
          is_active?: boolean
          updated_at?: string
        }
      }
      brands: {
        Row: {
          id: string
          name: string
          code: string
          description?: string
          country?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string
          country?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string
          country?: string
          is_active?: boolean
          updated_at?: string
        }
      }
      items: {
        Row: {
          id: string
          name: string
          code: string
          category_id: string
          brand_id: string
          description?: string
          unit_price: number
          currency: string
          weight?: number
          dimensions?: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          category_id: string
          brand_id: string
          description?: string
          unit_price: number
          currency: string
          weight?: number
          dimensions?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          category_id?: string
          brand_id?: string
          description?: string
          unit_price?: number
          currency?: string
          weight?: number
          dimensions?: string
          is_active?: boolean
          updated_at?: string
        }
      }
      sales_budget: {
        Row: {
          id: string
          customer_id: string
          item_id: string
          year: number
          budget_2025: number
          actual_2025: number
          budget_2026: number
          budget_value_2026: number
          rate: number
          stock: number
          git: number
          discount: number
          created_by: string
          created_at: string
          updated_at: string
          status: 'draft' | 'submitted' | 'approved' | 'rejected'
        }
        Insert: {
          id?: string
          customer_id: string
          item_id: string
          year: number
          budget_2025: number
          actual_2025: number
          budget_2026: number
          budget_value_2026: number
          rate: number
          stock: number
          git: number
          discount: number
          created_by: string
          created_at?: string
          updated_at?: string
          status?: 'draft' | 'submitted' | 'approved' | 'rejected'
        }
        Update: {
          id?: string
          customer_id?: string
          item_id?: string
          year?: number
          budget_2025?: number
          actual_2025?: number
          budget_2026?: number
          budget_value_2026?: number
          rate?: number
          stock?: number
          git?: number
          discount?: number
          updated_at?: string
          status?: 'draft' | 'submitted' | 'approved' | 'rejected'
        }
      }
      monthly_budget: {
        Row: {
          id: string
          sales_budget_id: string
          month: string
          budget_value: number
          actual_value: number
          rate: number
          stock: number
          git: number
          discount: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sales_budget_id: string
          month: string
          budget_value: number
          actual_value: number
          rate: number
          stock: number
          git: number
          discount: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sales_budget_id?: string
          month?: string
          budget_value?: number
          actual_value?: number
          rate?: number
          stock?: number
          git?: number
          discount?: number
          updated_at?: string
        }
      }
      rolling_forecast: {
        Row: {
          id: string
          customer_id: string
          item_id: string
          year: number
          bud25: number
          ytd25: number
          forecast: number
          stock: number
          git: number
          created_by: string
          created_at: string
          updated_at: string
          status: 'draft' | 'submitted' | 'approved' | 'rejected'
        }
        Insert: {
          id?: string
          customer_id: string
          item_id: string
          year: number
          bud25: number
          ytd25: number
          forecast: number
          stock: number
          git: number
          created_by: string
          created_at?: string
          updated_at?: string
          status?: 'draft' | 'submitted' | 'approved' | 'rejected'
        }
        Update: {
          id?: string
          customer_id?: string
          item_id?: string
          year?: number
          bud25?: number
          ytd25?: number
          forecast?: number
          stock?: number
          git?: number
          updated_at?: string
          status?: 'draft' | 'submitted' | 'approved' | 'rejected'
        }
      }
      monthly_forecast: {
        Row: {
          id: string
          rolling_forecast_id: string
          month: string
          forecast_value: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rolling_forecast_id: string
          month: string
          forecast_value: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          rolling_forecast_id?: string
          month?: string
          forecast_value?: number
          updated_at?: string
        }
      }
      stock_management: {
        Row: {
          id: string
          item_id: string
          location: string
          quantity: number
          reserved_quantity: number
          available_quantity: number
          reorder_level: number
          max_stock_level: number
          cost_per_unit: number
          last_stock_date: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          item_id: string
          location: string
          quantity: number
          reserved_quantity: number
          available_quantity: number
          reorder_level: number
          max_stock_level: number
          cost_per_unit: number
          last_stock_date: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          item_id?: string
          location?: string
          quantity?: number
          reserved_quantity?: number
          available_quantity?: number
          reorder_level?: number
          max_stock_level?: number
          cost_per_unit?: number
          last_stock_date?: string
          updated_at?: string
        }
      }
      git_tracking: {
        Row: {
          id: string
          customer_id: string
          item_id: string
          git_quantity: number
          status: 'ordered' | 'shipped' | 'in_transit' | 'arrived' | 'delayed'
          estimated_arrival: string
          actual_arrival?: string
          supplier?: string
          tracking_number?: string
          notes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          item_id: string
          git_quantity: number
          status: 'ordered' | 'shipped' | 'in_transit' | 'arrived' | 'delayed'
          estimated_arrival: string
          actual_arrival?: string
          supplier?: string
          tracking_number?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          item_id?: string
          git_quantity?: number
          status?: 'ordered' | 'shipped' | 'in_transit' | 'arrived' | 'delayed'
          estimated_arrival?: string
          actual_arrival?: string
          supplier?: string
          tracking_number?: string
          notes?: string
          updated_at?: string
        }
      }
      discount_rules: {
        Row: {
          id: string
          category_id: string
          brand_id: string
          discount_percentage: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: string
          brand_id: string
          discount_percentage: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          category_id?: string
          brand_id?: string
          discount_percentage?: number
          is_active?: boolean
          updated_at?: string
        }
      }
      manual_budget_entries: {
        Row: {
          id: string
          customer_id: string
          item_id: string
          budget_2026: number
          created_by: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          item_id: string
          budget_2026: number
          created_by: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          item_id?: string
          budget_2026?: number
          updated_at?: string
        }
      }
      workflow_approvals: {
        Row: {
          id: string
          workflow_id: string
          submitted_by: string
          submitted_at: string
          approved_by?: string
          approved_at?: string
          status: 'pending' | 'approved' | 'rejected'
          comments?: string
          data_type: 'sales_budget' | 'rolling_forecast'
          data_ids: string[]
        }
        Insert: {
          id?: string
          workflow_id: string
          submitted_by: string
          submitted_at: string
          approved_by?: string
          approved_at?: string
          status?: 'pending' | 'approved' | 'rejected'
          comments?: string
          data_type: 'sales_budget' | 'rolling_forecast'
          data_ids: string[]
        }
        Update: {
          id?: string
          workflow_id?: string
          approved_by?: string
          approved_at?: string
          status?: 'pending' | 'approved' | 'rejected'
          comments?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          is_read: boolean
          related_id?: string
          related_type?: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: 'info' | 'success' | 'warning' | 'error'
          is_read?: boolean
          related_id?: string
          related_type?: string
          created_at?: string
        }
        Update: {
          id?: string
          is_read?: boolean
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_values?: any
          new_values?: any
          ip_address?: string
          user_agent?: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          action: string
          table_name: string
          record_id: string
          old_values?: any
          new_values?: any
          ip_address?: string
          user_agent?: string
          created_at?: string
        }
        Update: never
      }
    }
    Views: {
      // Add views here if needed
    }
    Functions: {
      // Add functions here if needed
    }
    Enums: {
      user_role: 'admin' | 'manager' | 'salesman'
      customer_seasonality: 'low' | 'medium' | 'high'
      customer_tier: 'bronze' | 'silver' | 'gold' | 'platinum'
      budget_status: 'draft' | 'submitted' | 'approved' | 'rejected'
      git_status: 'ordered' | 'shipped' | 'in_transit' | 'arrived' | 'delayed'
      notification_type: 'info' | 'success' | 'warning' | 'error'
      approval_status: 'pending' | 'approved' | 'rejected'
    }
  }
}
