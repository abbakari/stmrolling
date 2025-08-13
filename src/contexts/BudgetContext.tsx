import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { MockBudgetService, MockRollingForecastService, MockCustomerService, MockItemService, SalesBudget, RollingForecast, Customer, Item } from '../services/mockBudget';
import { useAuth } from './AuthContext';

export interface MonthlyBudget {
  month: string;
  budgetValue: number;
  actualValue: number;
  rate: number;
  stock: number;
  git: number;
  discount: number;
}

export interface YearlyBudgetData {
  [year: number]: {
    [customerId: number]: {
      customer: Customer;
      months: MonthlyBudget[];
      total: number;
    };
  };
}

interface BudgetContextType {
  // State
  budgetData: YearlyBudgetData;
  forecastData: RollingForecast[];
  customers: Customer[];
  items: Item[];
  categories: any[];
  brands: any[];
  isLoading: boolean;
  error: string | null;
  currentYear: number;
  selectedCustomer: Customer | null;
  selectedItems: Item[];
  viewMode: 'customer-item' | 'item-wise';
  
  // Actions
  setCurrentYear: (year: number) => void;
  setSelectedCustomer: (customer: Customer | null) => void;
  setSelectedItems: (items: Item[]) => void;
  setViewMode: (mode: 'customer-item' | 'item-wise') => void;
  createBudgetEntry: (data: Partial<SalesBudget>) => Promise<void>;
  updateBudgetEntry: (id: number, data: Partial<SalesBudget>) => Promise<void>;
  deleteBudgetEntry: (id: number) => Promise<void>;
  bulkCreateBudget: (data: {
    customer: number;
    items: number[];
    year: number;
    total_amount: number;
    distribution_type: string;
  }) => Promise<void>;
  refreshBudgetData: () => Promise<void>;
  getBudgetSummary: () => Promise<any>;
  getMonthlyBudget: (year: number, month: number) => Promise<any>;
  // Rolling Forecast functions
  createForecastEntry: (data: Partial<RollingForecast>) => Promise<void>;
  updateForecastEntry: (id: number, data: Partial<RollingForecast>) => Promise<void>;
  deleteForecastEntry: (id: number) => Promise<void>;
  bulkCreateForecast: (data: {
    customer: number;
    items: number[];
    year: number;
    forecast_data: Array<{
      month: number;
      forecasted_amount: number;
      forecast_type: string;
    }>;
  }) => Promise<void>;
  refreshForecastData: () => Promise<void>;
  getForecastSummary: () => Promise<any>;
  getVarianceAnalysis: () => Promise<any>;
  getMonthlyForecast: (year: number, month: number) => Promise<any>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

interface BudgetProviderProps {
  children: ReactNode;
}

export const BudgetProvider: React.FC<BudgetProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [budgetData, setBudgetData] = useState<YearlyBudgetData>({});
  const [forecastData, setForecastData] = useState<RollingForecast[]>([]);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedItems, setSelectedItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'customer-item' | 'item-wise'>('customer-item');

  // Initialize data when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadInitialData();
    }
  }, [isAuthenticated, user]);

  // Load budget and forecast data when current year changes
  useEffect(() => {
    if (isAuthenticated) {
      refreshBudgetData();
      refreshForecastData();
    }
  }, [currentYear, isAuthenticated]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load customers, items, and categories in parallel
      const [customersRes, itemsRes, categoriesRes] = await Promise.all([
        MockCustomerService.getCustomers(),
        MockItemService.getItems(),
        MockItemService.getCategorySummary()
      ]);

      setCustomers(customersRes);
      setItems(itemsRes);
      setCategories(categoriesRes.categories || []);
      setBrands([]);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      console.error('Failed to load initial data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshBudgetData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load sales budget data for current year
      const budgetRes = await MockBudgetService.getSalesBudget({
        year: currentYear
      });

      // Transform mock data to match the existing interface
      const transformedData: YearlyBudgetData = {};
      transformedData[currentYear] = {};

      // Group by customer and create monthly structure
      budgetRes.forEach(entry => {
        const customerId = entry.customer;
        
        if (!transformedData[currentYear][customerId]) {
          const customer = customers.find(c => c.id === customerId) || {
            id: customerId,
            name: `Customer ${customerId}`,
            email: '',
            phone: '',
            address: '',
            region: '',
            sales_representative: '',
            created_at: new Date().toISOString()
          };

          transformedData[currentYear][customerId] = {
            customer,
            months: Array.from({ length: 12 }, (_, i) => ({
              month: new Date(0, i).toLocaleDateString('en', { month: 'short' }),
              budgetValue: 0,
              actualValue: 0,
              rate: 100,
              stock: 0,
              git: 0,
              discount: 0
            })),
            total: 0
          };
        }

        // Update month data
        const monthIndex = entry.month - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          transformedData[currentYear][customerId].months[monthIndex].budgetValue += entry.budget_amount;
          transformedData[currentYear][customerId].months[monthIndex].actualValue += entry.actual_amount;
          transformedData[currentYear][customerId].total += entry.budget_amount;
        }
      });

      setBudgetData(transformedData);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      console.error('Failed to refresh budget data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBudgetEntry = async (data: Partial<SalesBudget>) => {
    try {
      setError(null);
      await MockBudgetService.createSalesBudget(data);
      await refreshBudgetData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      throw error;
    }
  };

  const updateBudgetEntry = async (id: number, data: Partial<SalesBudget>) => {
    try {
      setError(null);
      await MockBudgetService.updateSalesBudget(id, data);
      await refreshBudgetData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      throw error;
    }
  };

  const deleteBudgetEntry = async (id: number) => {
    try {
      setError(null);
      await MockBudgetService.deleteSalesBudget(id);
      await refreshBudgetData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      throw error;
    }
  };

  const bulkCreateBudget = async (data: {
    customer: number;
    items: number[];
    year: number;
    total_amount: number;
    distribution_type: string;
  }) => {
    try {
      setError(null);
      // Mock bulk create by creating individual entries
      for (const itemId of data.items) {
        await MockBudgetService.createSalesBudget({
          customer: data.customer,
          item: itemId,
          year: data.year,
          month: 1,
          budget_amount: data.total_amount / data.items.length,
          actual_amount: 0
        });
      }
      await refreshBudgetData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      throw error;
    }
  };

  const getBudgetSummary = async () => {
    try {
      return await MockBudgetService.getBudgetSummary();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      throw error;
    }
  };

  const getMonthlyBudget = async (year: number, month: number) => {
    try {
      return { budget_amount: 50000, actual_amount: 45000, variance: 5000 };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      throw error;
    }
  };

  // Rolling Forecast functions
  const refreshForecastData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load rolling forecast data for current year
      const forecastRes = await MockRollingForecastService.getRollingForecasts({
        year: currentYear
      });

      setForecastData(forecastRes || []);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      console.error('Failed to refresh forecast data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createForecastEntry = async (data: Partial<RollingForecast>) => {
    try {
      setError(null);
      await MockRollingForecastService.createRollingForecast(data);
      await refreshForecastData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      throw error;
    }
  };

  const updateForecastEntry = async (id: number, data: Partial<RollingForecast>) => {
    try {
      setError(null);
      await MockRollingForecastService.updateRollingForecast(id, data);
      await refreshForecastData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      throw error;
    }
  };

  const deleteForecastEntry = async (id: number) => {
    try {
      setError(null);
      await MockRollingForecastService.deleteForecast(id);
      await refreshForecastData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      throw error;
    }
  };

  const bulkCreateForecast = async (data: {
    customer: number;
    items: number[];
    year: number;
    forecast_data: Array<{
      month: number;
      forecasted_amount: number;
      forecast_type: string;
    }>;
  }) => {
    try {
      setError(null);
      // Mock bulk create by creating individual entries
      for (const itemId of data.items) {
        for (const forecastMonth of data.forecast_data) {
          await MockRollingForecastService.createRollingForecast({
            customer: data.customer,
            item: itemId,
            year: data.year,
            month: forecastMonth.month,
            forecasted_amount: forecastMonth.forecasted_amount,
            budget_amount: forecastMonth.forecasted_amount * 0.9, // Mock budget amount
            forecast_type: forecastMonth.forecast_type,
            confidence_level: 80
          });
        }
      }
      await refreshForecastData();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      throw error;
    }
  };

  const getForecastSummary = async () => {
    try {
      return await MockRollingForecastService.getForecastSummary();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      throw error;
    }
  };

  const getVarianceAnalysis = async () => {
    try {
      return {
        total_variance: 200000,
        variance_percentage: 16.0,
        positive_variance_count: 75,
        negative_variance_count: 69,
        average_confidence: 82.5
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      throw error;
    }
  };

  const getMonthlyForecast = async (year: number, month: number) => {
    try {
      return { 
        forecast_amount: 120000, 
        budget_amount: 100000, 
        variance: 20000,
        confidence: 85
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      throw error;
    }
  };

  const value: BudgetContextType = {
    // State
    budgetData,
    forecastData,
    customers,
    items,
    categories,
    brands,
    isLoading,
    error,
    currentYear,
    selectedCustomer,
    selectedItems,
    viewMode,
    
    // Actions
    setCurrentYear,
    setSelectedCustomer,
    setSelectedItems,
    setViewMode,
    createBudgetEntry,
    updateBudgetEntry,
    deleteBudgetEntry,
    bulkCreateBudget,
    refreshBudgetData,
    getBudgetSummary,
    getMonthlyBudget,
    createForecastEntry,
    updateForecastEntry,
    deleteForecastEntry,
    bulkCreateForecast,
    refreshForecastData,
    getForecastSummary,
    getVarianceAnalysis,
    getMonthlyForecast
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = (): BudgetContextType => {
  const context = useContext(BudgetContext);
  if (context === undefined) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};

export default BudgetContext;
