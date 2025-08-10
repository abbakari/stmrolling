import { supabase, handleSupabaseError } from '../lib/supabase';
import type { Database } from '../types/database';
import { invalidateRelatedCaches } from '../hooks/useSWR';

type Tables = Database['public']['Tables'];
type Profile = Tables['profiles']['Row'];
type Customer = Tables['customers']['Row'];
type Item = Tables['items']['Row'];
type SalesBudget = Tables['sales_budgets']['Row'];
type RollingForecast = Tables['rolling_forecasts']['Row'];
type GitItem = Tables['git_items']['Row'];
type Communication = Tables['communications']['Row'];

// Generic CRUD operations with optimized performance

// Customer operations
export const customerAPI = {
  async create(customer: Tables['customers']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .insert([customer])
        .select('*, created_by_profile:created_by(name, email)')
        .single();
      
      if (error) throw error;
      
      invalidateRelatedCaches('customers');
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  async update(id: string, updates: Tables['customers']['Update']) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select('*, created_by_profile:created_by(name, email)')
        .single();
      
      if (error) throw error;
      
      invalidateRelatedCaches('customers', id);
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  async delete(id: string) {
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      
      invalidateRelatedCaches('customers', id);
      return true;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  async getById(id: string) {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*, created_by_profile:created_by(name, email)')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  }
};

// Item operations
export const itemAPI = {
  async create(item: Tables['items']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('items')
        .insert([item])
        .select(`
          *,
          category:category_id(id, name),
          brand:brand_id(id, name),
          created_by_profile:created_by(name, email)
        `)
        .single();
      
      if (error) throw error;
      
      invalidateRelatedCaches('items');
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  async update(id: string, updates: Tables['items']['Update']) {
    try {
      const { data, error } = await supabase
        .from('items')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          category:category_id(id, name),
          brand:brand_id(id, name),
          created_by_profile:created_by(name, email)
        `)
        .single();
      
      if (error) throw error;
      
      invalidateRelatedCaches('items', id);
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  async updateStock(id: string, newStock: number) {
    try {
      const { data, error } = await supabase
        .from('items')
        .update({ 
          current_stock: newStock,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, name, current_stock')
        .single();
      
      if (error) throw error;
      
      invalidateRelatedCaches('items', id);
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  async getLowStockItems(threshold?: number) {
    try {
      let query = supabase
        .from('items')
        .select(`
          *,
          category:category_id(name),
          brand:brand_id(name)
        `)
        .filter('current_stock', 'lte', threshold || 10)
        .filter('is_active', 'eq', true)
        .order('current_stock', { ascending: true });

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  }
};

// Sales Budget operations
export const salesBudgetAPI = {
  async create(budget: Tables['sales_budgets']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('sales_budgets')
        .insert([budget])
        .select(`
          *,
          customer:customer_id(id, name),
          item:item_id(id, name, category:category_id(name), brand:brand_id(name)),
          salesman:salesman_id(id, name, email)
        `)
        .single();
      
      if (error) throw error;
      
      invalidateRelatedCaches('sales_budgets');
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  async update(id: string, updates: Tables['sales_budgets']['Update']) {
    try {
      const { data, error } = await supabase
        .from('sales_budgets')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          customer:customer_id(id, name),
          item:item_id(id, name, category:category_id(name), brand:brand_id(name)),
          salesman:salesman_id(id, name, email)
        `)
        .single();
      
      if (error) throw error;
      
      invalidateRelatedCaches('sales_budgets', id);
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  async updateStatus(id: string, status: Database['public']['Enums']['status_type'], approvedBy?: string) {
    try {
      const updates: Tables['sales_budgets']['Update'] = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'submitted') {
        updates.submitted_at = new Date().toISOString();
      } else if (status === 'approved' && approvedBy) {
        updates.approved_at = new Date().toISOString();
        updates.approved_by = approvedBy;
      }

      const { data, error } = await supabase
        .from('sales_budgets')
        .update(updates)
        .eq('id', id)
        .select('id, status, submitted_at, approved_at')
        .single();
      
      if (error) throw error;
      
      invalidateRelatedCaches('sales_budgets', id);
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  async getBySalesman(salesmanId: string, status?: Database['public']['Enums']['status_type']) {
    try {
      let query = supabase
        .from('sales_budgets')
        .select(`
          *,
          customer:customer_id(id, name),
          item:item_id(id, name, category:category_id(name), brand:brand_id(name))
        `)
        .eq('salesman_id', salesmanId);

      if (status) {
        query = query.eq('status', status);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  }
};

// Rolling Forecast operations
export const rollingForecastAPI = {
  async create(forecast: Tables['rolling_forecasts']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('rolling_forecasts')
        .insert([forecast])
        .select(`
          *,
          customer:customer_id(id, name),
          item:item_id(id, name, category:category_id(name), brand:brand_id(name)),
          salesman:salesman_id(id, name, email)
        `)
        .single();
      
      if (error) throw error;
      
      invalidateRelatedCaches('rolling_forecasts');
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  async update(id: string, updates: Tables['rolling_forecasts']['Update']) {
    try {
      const { data, error } = await supabase
        .from('rolling_forecasts')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          customer:customer_id(id, name),
          item:item_id(id, name, category:category_id(name), brand:brand_id(name)),
          salesman:salesman_id(id, name, email)
        `)
        .single();
      
      if (error) throw error;
      
      invalidateRelatedCaches('rolling_forecasts', id);
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  async updateStatus(id: string, status: Database['public']['Enums']['status_type'], approvedBy?: string) {
    try {
      const updates: Tables['rolling_forecasts']['Update'] = {
        status,
        updated_at: new Date().toISOString()
      };

      if (status === 'submitted') {
        updates.submitted_at = new Date().toISOString();
      } else if (status === 'approved' && approvedBy) {
        updates.approved_at = new Date().toISOString();
        updates.approved_by = approvedBy;
      }

      const { data, error } = await supabase
        .from('rolling_forecasts')
        .update(updates)
        .eq('id', id)
        .select('id, status, submitted_at, approved_at')
        .single();
      
      if (error) throw error;
      
      invalidateRelatedCaches('rolling_forecasts', id);
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  }
};

// GIT Items operations
export const gitItemAPI = {
  async create(gitItem: Tables['git_items']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('git_items')
        .insert([gitItem])
        .select(`
          *,
          customer:customer_id(id, name),
          item:item_id(id, name, category:category_id(name), brand:brand_id(name)),
          created_by_profile:created_by(name, email)
        `)
        .single();
      
      if (error) throw error;
      
      invalidateRelatedCaches('git_items');
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  async update(id: string, updates: Tables['git_items']['Update']) {
    try {
      const { data, error } = await supabase
        .from('git_items')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          customer:customer_id(id, name),
          item:item_id(id, name, category:category_id(name), brand:brand_id(name)),
          created_by_profile:created_by(name, email)
        `)
        .single();
      
      if (error) throw error;
      
      invalidateRelatedCaches('git_items', id);
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  async updateStatus(id: string, status: Database['public']['Enums']['git_status']) {
    try {
      const { data, error } = await supabase
        .from('git_items')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, status, updated_at')
        .single();
      
      if (error) throw error;
      
      invalidateRelatedCaches('git_items', id);
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  async getByCustomerAndItem(customerId: string, itemId: string) {
    try {
      const { data, error } = await supabase
        .from('git_items')
        .select(`
          *,
          customer:customer_id(name),
          item:item_id(name)
        `)
        .eq('customer_id', customerId)
        .eq('item_id', itemId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  }
};

// Communication operations
export const communicationAPI = {
  async create(communication: Tables['communications']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('communications')
        .insert([communication])
        .select(`
          *,
          from_user:from_user_id(id, name, email, role),
          to_user:to_user_id(id, name, email, role)
        `)
        .single();
      
      if (error) throw error;
      
      invalidateRelatedCaches('communications');
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  async markAsRead(id: string) {
    try {
      const { data, error } = await supabase
        .from('communications')
        .update({ 
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, is_read, read_at')
        .single();
      
      if (error) throw error;
      
      invalidateRelatedCaches('communications', id);
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  async updateStatus(id: string, status: Database['public']['Enums']['workflow_status']) {
    try {
      const { data, error } = await supabase
        .from('communications')
        .update({ status })
        .eq('id', id)
        .select('id, status')
        .single();
      
      if (error) throw error;
      
      invalidateRelatedCaches('communications', id);
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  }
};

// Categories and Brands
export const categoryAPI = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  async create(category: Tables['categories']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .insert([category])
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  }
};

export const brandAPI = {
  async getAll() {
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('name');
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  },

  async create(brand: Tables['brands']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('brands')
        .insert([brand])
        .select('*')
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  }
};

// Dashboard analytics
export const analyticsAPI = {
  async getDashboardStats(userId?: string, role?: Database['public']['Enums']['user_role']) {
    try {
      const promises = [];

      // Sales budgets count
      promises.push(
        supabase
          .from('sales_budgets')
          .select('id', { count: 'exact', head: true })
          .then(({ count }) => ({ salesBudgets: count || 0 }))
      );

      // Rolling forecasts count
      promises.push(
        supabase
          .from('rolling_forecasts')
          .select('id', { count: 'exact', head: true })
          .then(({ count }) => ({ rollingForecasts: count || 0 }))
      );

      // Pending approvals (for managers/admins)
      if (role === 'manager' || role === 'admin') {
        promises.push(
          supabase
            .from('sales_budgets')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'submitted')
            .then(({ count }) => ({ pendingBudgetApprovals: count || 0 }))
        );

        promises.push(
          supabase
            .from('rolling_forecasts')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'submitted')
            .then(({ count }) => ({ pendingForecastApprovals: count || 0 }))
        );
      }

      // Low stock items (for supply chain/admins)
      if (role === 'supply_chain' || role === 'admin') {
        promises.push(
          supabase
            .from('items')
            .select('id', { count: 'exact', head: true })
            .lte('current_stock', 10)
            .then(({ count }) => ({ lowStockItems: count || 0 }))
        );
      }

      // Unread communications
      if (userId) {
        promises.push(
          supabase
            .from('communications')
            .select('id', { count: 'exact', head: true })
            .eq('to_user_id', userId)
            .eq('is_read', false)
            .then(({ count }) => ({ unreadMessages: count || 0 }))
        );
      }

      const results = await Promise.all(promises);
      return results.reduce((acc, result) => ({ ...acc, ...result }), {});
    } catch (error) {
      throw new Error(handleSupabaseError(error));
    }
  }
};
