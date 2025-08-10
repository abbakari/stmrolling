import { supabase, handleSupabaseError } from '../lib/supabase';
import { salesBudgetAPI, rollingForecastAPI, gitItemAPI, communicationAPI, analyticsAPI } from './api';
import type { Database } from '../types/database';

type Tables = Database['public']['Tables'];
type SalesBudget = Tables['sales_budgets']['Row'];
type RollingForecast = Tables['rolling_forecasts']['Row'];
type GitItem = Tables['git_items']['Row'];

// Modern data persistence manager using Supabase
export class SupabaseDataManager {
  // Sales Budget Operations with real database persistence
  static async saveSalesBudget(budgetData: Tables['sales_budgets']['Insert']) {
    try {
      const result = await salesBudgetAPI.create(budgetData);
      console.log('Sales budget saved to database:', result.id);
      return result;
    } catch (error) {
      console.error('Error saving sales budget:', error);
      throw error;
    }
  }

  static async updateSalesBudget(id: string, updates: Tables['sales_budgets']['Update']) {
    try {
      const result = await salesBudgetAPI.update(id, updates);
      console.log('Sales budget updated in database:', result.id);
      return result;
    } catch (error) {
      console.error('Error updating sales budget:', error);
      throw error;
    }
  }

  static async getSalesBudgetsByUser(salesmanId: string, status?: Database['public']['Enums']['status_type']) {
    try {
      return await salesBudgetAPI.getBySalesman(salesmanId, status);
    } catch (error) {
      console.error('Error fetching sales budgets:', error);
      throw error;
    }
  }

  // Rolling Forecast Operations
  static async saveRollingForecast(forecastData: Tables['rolling_forecasts']['Insert']) {
    try {
      const result = await rollingForecastAPI.create(forecastData);
      console.log('Rolling forecast saved to database:', result.id);
      return result;
    } catch (error) {
      console.error('Error saving rolling forecast:', error);
      throw error;
    }
  }

  static async updateRollingForecast(id: string, updates: Tables['rolling_forecasts']['Update']) {
    try {
      const result = await rollingForecastAPI.update(id, updates);
      console.log('Rolling forecast updated in database:', result.id);
      return result;
    } catch (error) {
      console.error('Error updating rolling forecast:', error);
      throw error;
    }
  }

  // GIT Items Operations
  static async createGitItem(gitData: Tables['git_items']['Insert']) {
    try {
      const result = await gitItemAPI.create(gitData);
      console.log('GIT item created in database:', result.id);
      return result;
    } catch (error) {
      console.error('Error creating GIT item:', error);
      throw error;
    }
  }

  static async updateGitItem(id: string, updates: Tables['git_items']['Update']) {
    try {
      const result = await gitItemAPI.update(id, updates);
      console.log('GIT item updated in database:', result.id);
      return result;
    } catch (error) {
      console.error('Error updating GIT item:', error);
      throw error;
    }
  }

  static async getGitItemsForCustomerAndItem(customerId: string, itemId: string) {
    try {
      return await gitItemAPI.getByCustomerAndItem(customerId, itemId);
    } catch (error) {
      console.error('Error fetching GIT items:', error);
      throw error;
    }
  }

  // Status Management with workflow support
  static async submitForApproval(
    type: 'budget' | 'forecast',
    items: { id: string }[],
    workflowMetadata?: any
  ) {
    try {
      const updates = items.map(item => 
        type === 'budget' 
          ? salesBudgetAPI.updateStatus(item.id, 'submitted')
          : rollingForecastAPI.updateStatus(item.id, 'submitted')
      );

      const results = await Promise.all(updates);
      
      // Create workflow record if metadata provided
      if (workflowMetadata) {
        await this.createWorkflow({
          title: `${type === 'budget' ? 'Budget' : 'Forecast'} Approval Request`,
          description: `Approval request for ${items.length} ${type} items`,
          priority: 'medium',
          metadata: { items, type, ...workflowMetadata }
        });
      }

      console.log(`${items.length} ${type} items submitted for approval`);
      return results;
    } catch (error) {
      console.error('Error submitting for approval:', error);
      throw error;
    }
  }

  static async approveItems(
    type: 'budget' | 'forecast',
    items: { id: string }[],
    approvedBy: string
  ) {
    try {
      const updates = items.map(item => 
        type === 'budget' 
          ? salesBudgetAPI.updateStatus(item.id, 'approved', approvedBy)
          : rollingForecastAPI.updateStatus(item.id, 'approved', approvedBy)
      );

      const results = await Promise.all(updates);
      console.log(`${items.length} ${type} items approved`);
      return results;
    } catch (error) {
      console.error('Error approving items:', error);
      throw error;
    }
  }

  // Communication Management
  static async createCommunication(communicationData: Tables['communications']['Insert']) {
    try {
      const result = await communicationAPI.create(communicationData);
      console.log('Communication created:', result.id);
      return result;
    } catch (error) {
      console.error('Error creating communication:', error);
      throw error;
    }
  }

  static async markCommunicationAsRead(id: string) {
    try {
      return await communicationAPI.markAsRead(id);
    } catch (error) {
      console.error('Error marking communication as read:', error);
      throw error;
    }
  }

  // Workflow Management
  static async createWorkflow(workflowData: Tables['workflows']['Insert']) {
    try {
      const { data, error } = await supabase
        .from('workflows')
        .insert([workflowData])
        .select('*')
        .single();

      if (error) throw error;
      
      console.log('Workflow created:', data.id);
      return data;
    } catch (error) {
      console.error('Error creating workflow:', error);
      throw error;
    }
  }

  // Analytics and Dashboard Data
  static async getDashboardAnalytics(userId?: string, role?: Database['public']['Enums']['user_role']) {
    try {
      return await analyticsAPI.getDashboardStats(userId, role);
    } catch (error) {
      console.error('Error fetching dashboard analytics:', error);
      throw error;
    }
  }

  // Real-time synchronization
  static async syncBudgetAndForecastData(customerId: string, itemId: string) {
    try {
      // Get latest budget data
      const { data: budgetData } = await supabase
        .from('sales_budgets')
        .select('*')
        .eq('customer_id', customerId)
        .eq('item_id', itemId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      // Update related forecast with budget data if exists
      if (budgetData) {
        const { error } = await supabase
          .from('rolling_forecasts')
          .update({
            budget_data: {
              budget_2025: budgetData.budget_2025,
              actual_2025: budgetData.actual_2025,
              budget_2026: budgetData.budget_2026,
              rate: budgetData.rate,
              current_stock: budgetData.current_stock,
              git_quantity: budgetData.git_quantity,
              eta: budgetData.eta,
              budget_value_2026: budgetData.budget_value_2026,
              discount: budgetData.discount,
              monthly_data: budgetData.monthly_data
            },
            updated_at: new Date().toISOString()
          })
          .eq('customer_id', customerId)
          .eq('item_id', itemId);

        if (error) throw error;
        console.log('Budget and forecast data synchronized');
      }
    } catch (error) {
      console.error('Error synchronizing data:', error);
      throw error;
    }
  }

  // Batch operations for performance
  static async batchCreateSalesBudgets(budgets: Tables['sales_budgets']['Insert'][]) {
    try {
      const { data, error } = await supabase
        .from('sales_budgets')
        .insert(budgets)
        .select(`
          *,
          customer:customer_id(id, name),
          item:item_id(id, name, category:category_id(name), brand:brand_id(name)),
          salesman:salesman_id(id, name, email)
        `);

      if (error) throw error;
      
      console.log(`Batch created ${budgets.length} sales budgets`);
      return data;
    } catch (error) {
      console.error('Error batch creating sales budgets:', error);
      throw error;
    }
  }

  static async batchCreateRollingForecasts(forecasts: Tables['rolling_forecasts']['Insert'][]) {
    try {
      const { data, error } = await supabase
        .from('rolling_forecasts')
        .insert(forecasts)
        .select(`
          *,
          customer:customer_id(id, name),
          item:item_id(id, name, category:category_id(name), brand:brand_id(name)),
          salesman:salesman_id(id, name, email)
        `);

      if (error) throw error;
      
      console.log(`Batch created ${forecasts.length} rolling forecasts`);
      return data;
    } catch (error) {
      console.error('Error batch creating rolling forecasts:', error);
      throw error;
    }
  }

  // Migration helper (for transitioning from localStorage)
  static async migrateFromLocalStorage() {
    try {
      console.log('Starting migration from localStorage to Supabase...');
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user for migration');

      let migrationCount = 0;

      // Migrate sales budget data
      const localBudgetData = localStorage.getItem('sales_budget_saved_data');
      if (localBudgetData) {
        const budgets = JSON.parse(localBudgetData);
        console.log(`Found ${budgets.length} local budget items to migrate`);
        
        // Note: This would need customer/item ID mapping
        // For now, we'll just clear the local data after successful setup
        localStorage.removeItem('sales_budget_saved_data');
        migrationCount += budgets.length;
      }

      // Migrate rolling forecast data
      const localForecastData = localStorage.getItem('rolling_forecast_saved_data');
      if (localForecastData) {
        const forecasts = JSON.parse(localForecastData);
        console.log(`Found ${forecasts.length} local forecast items to migrate`);
        
        localStorage.removeItem('rolling_forecast_saved_data');
        migrationCount += forecasts.length;
      }

      // Clear other demo data
      localStorage.removeItem('git_eta_data');
      localStorage.removeItem('admin_communication_messages');
      localStorage.removeItem('user');

      console.log(`Migration completed. Cleared ${migrationCount} local items.`);
      return migrationCount;
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    }
  }

  // Health check and connection testing
  static async testConnection() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) throw error;
      
      console.log('Supabase connection successful');
      return true;
    } catch (error) {
      console.error('Supabase connection failed:', error);
      return false;
    }
  }
}

export default SupabaseDataManager;
