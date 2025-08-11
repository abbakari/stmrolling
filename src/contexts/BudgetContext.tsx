import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SalesBudgetService, RollingForecastService, CustomerService, ItemService, SalesBudget, RollingForecast, Customer, Item, handleApiError } from '../services/api';
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

export interface BudgetContextType {
  budgetData: YearlyBudgetData;
  forecastData: RollingForecast[];
  currentYear: number;
  selectedCustomer: Customer | null;
  selectedItems: Item[];
  customers: Customer[];
  items: Item[];
  categories: any[];
  brands: any[];
  isLoading: boolean;
  error: string | null;
  viewMode: 'customer-item' | 'item-wise';
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

      // Load customers, items, categories, and brands in parallel
      const [customersRes, itemsRes, categoriesRes, brandsRes] = await Promise.all([
        CustomerService.getCustomerSummary(),
        ItemService.getItemSummary(),
        ItemService.getCategorySummary(),
        ItemService.getBrandSummary()
      ]);

      setCustomers(customersRes);
      setItems(itemsRes);
      setCategories(categoriesRes);
      setBrands(brandsRes);

      // Load user's preferred view mode
      if (user?.profile?.preferred_view_mode) {
        setViewMode(user.profile.preferred_view_mode as 'customer-item' | 'item-wise');
      }
    } catch (error) {
      const errorMessage = handleApiError(error as any);
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

      const isDemoMode = localStorage.getItem('demo_mode') === 'true';

      if (isDemoMode) {
        // In demo mode, just update the existing demo data with some random variations
        console.log('Demo mode: Refreshing demo budget data');
        // The demo data is already set in loadInitialData, so just indicate success
        return;
      }

      // Load sales budget data for current year
      const budgetRes = await SalesBudgetService.getSalesBudget({
        year: currentYear,
        page_size: 1000 // Get all entries for the year
      });

      // Transform API data to match the existing interface
      const transformedData: YearlyBudgetData = {};
      transformedData[currentYear] = {};

      budgetRes.results?.forEach((entry: SalesBudget) => {
        const customerId = entry.customer;

        if (!transformedData[currentYear][customerId]) {
          transformedData[currentYear][customerId] = {
            customer: entry.customer_info,
            months: Array.from({ length: 12 }, (_, i) => ({
              month: new Date(0, i).toLocaleString('default', { month: 'long' }),
              budgetValue: 0,
              actualValue: 0,
              rate: 0,
              stock: 0,
              git: 0,
              discount: entry.discount_percentage || 0
            })),
            total: 0
          };
        }

        // Update month data
        const monthIndex = entry.month - 1;
        if (monthIndex >= 0 && monthIndex < 12) {
          transformedData[currentYear][customerId].months[monthIndex].budgetValue += entry.total_amount;
          transformedData[currentYear][customerId].months[monthIndex].rate = entry.unit_price;
          transformedData[currentYear][customerId].months[monthIndex].discount = entry.discount_percentage || 0;
          transformedData[currentYear][customerId].total += entry.total_amount;
        }
      });

      setBudgetData(transformedData);
    } catch (error) {
      const errorMessage = handleApiError(error as any);
      setError(errorMessage);
      console.error('Failed to refresh budget data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createBudgetEntry = async (data: Partial<SalesBudget>) => {
    try {
      setError(null);
      await SalesBudgetService.createSalesBudgetEntry(data);
      await refreshBudgetData();
    } catch (error) {
      const errorMessage = handleApiError(error as any);
      setError(errorMessage);
      throw error;
    }
  };

  const updateBudgetEntry = async (id: number, data: Partial<SalesBudget>) => {
    try {
      setError(null);
      await SalesBudgetService.updateSalesBudgetEntry(id, data);
      await refreshBudgetData();
    } catch (error) {
      const errorMessage = handleApiError(error as any);
      setError(errorMessage);
      throw error;
    }
  };

  const deleteBudgetEntry = async (id: number) => {
    try {
      setError(null);
      await SalesBudgetService.deleteSalesBudgetEntry(id);
      await refreshBudgetData();
    } catch (error) {
      const errorMessage = handleApiError(error as any);
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
      await SalesBudgetService.bulkCreateSalesBudget(data);
      await refreshBudgetData();
    } catch (error) {
      const errorMessage = handleApiError(error as any);
      setError(errorMessage);
      throw error;
    }
  };

  const getBudgetSummary = async () => {
    try {
      return await SalesBudgetService.getSalesBudgetSummary({ year: currentYear });
    } catch (error) {
      const errorMessage = handleApiError(error as any);
      setError(errorMessage);
      throw error;
    }
  };

  const getMonthlyBudget = async (year: number, month: number) => {
    try {
      return await SalesBudgetService.getMonthlyBudget({ year, month });
    } catch (error) {
      const errorMessage = handleApiError(error as any);
      setError(errorMessage);
      throw error;
    }
  };

  // Rolling Forecast Functions
  const refreshForecastData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const isDemoMode = localStorage.getItem('demo_mode') === 'true';

      if (isDemoMode) {
        // Create demo forecast data
        const demoForecastData: RollingForecast[] = customers.slice(0, 3).flatMap(customer =>
          items.slice(0, 2).map((item, index) => ({
            id: customer.id * 10 + item.id,
            customer: customer.id,
            customer_info: customer,
            item: item.id,
            item_info: item,
            year: currentYear,
            month: 3 + index, // March and April
            forecasted_quantity: Math.floor(Math.random() * 100) + 50,
            forecasted_amount: Math.floor(Math.random() * 15000) + 8000,
            budget_quantity: Math.floor(Math.random() * 80) + 40,
            budget_amount: Math.floor(Math.random() * 12000) + 6000,
            quantity_variance: 0,
            amount_variance: 0,
            quantity_variance_percentage: 0,
            amount_variance_percentage: 0,
            forecast_type: ['optimistic', 'realistic', 'pessimistic'][Math.floor(Math.random() * 3)] as any,
            confidence_level: Math.floor(Math.random() * 30) + 70, // 70-100%
            is_latest: true,
            version: 1,
            status: ['draft', 'submitted', 'approved'][Math.floor(Math.random() * 3)] as any,
            quarter: Math.floor((3 + index - 1) / 3) + 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        );

        // Calculate variances
        demoForecastData.forEach(forecast => {
          forecast.quantity_variance = forecast.forecasted_quantity - forecast.budget_quantity;
          forecast.amount_variance = forecast.forecasted_amount - forecast.budget_amount;
          forecast.quantity_variance_percentage = forecast.budget_quantity > 0
            ? (forecast.quantity_variance / forecast.budget_quantity) * 100
            : 0;
          forecast.amount_variance_percentage = forecast.budget_amount > 0
            ? (forecast.amount_variance / forecast.budget_amount) * 100
            : 0;
        });

        setForecastData(demoForecastData);
        console.log('Demo mode: Created demo forecast data');
        return;
      }

      // Load rolling forecast data for current year
      const forecastRes = await RollingForecastService.getRollingForecasts({
        year: currentYear,
        is_latest: true,
        page_size: 1000
      });

      setForecastData(forecastRes.results || []);
    } catch (error) {
      const errorMessage = handleApiError(error as any);
      setError(errorMessage);
      console.error('Failed to refresh forecast data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createForecastEntry = async (data: Partial<RollingForecast>) => {
    try {
      setError(null);
      await RollingForecastService.createRollingForecast(data);
      await refreshForecastData();
    } catch (error) {
      const errorMessage = handleApiError(error as any);
      setError(errorMessage);
      throw error;
    }
  };

  const updateForecastEntry = async (id: number, data: Partial<RollingForecast>) => {
    try {
      setError(null);
      await RollingForecastService.updateRollingForecast(id, data);
      await refreshForecastData();
    } catch (error) {
      const errorMessage = handleApiError(error as any);
      setError(errorMessage);
      throw error;
    }
  };

  const deleteForecastEntry = async (id: number) => {
    try {
      setError(null);
      await RollingForecastService.deleteRollingForecast(id);
      await refreshForecastData();
    } catch (error) {
      const errorMessage = handleApiError(error as any);
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
      await RollingForecastService.bulkCreateForecast(data);
      await refreshForecastData();
    } catch (error) {
      const errorMessage = handleApiError(error as any);
      setError(errorMessage);
      throw error;
    }
  };

  const getForecastSummary = async () => {
    try {
      return await RollingForecastService.getForecastSummary({ year: currentYear });
    } catch (error) {
      const errorMessage = handleApiError(error as any);
      setError(errorMessage);
      throw error;
    }
  };

  const getVarianceAnalysis = async () => {
    try {
      return await RollingForecastService.getForecastVarianceAnalysis({ year: currentYear });
    } catch (error) {
      const errorMessage = handleApiError(error as any);
      setError(errorMessage);
      throw error;
    }
  };

  const getMonthlyForecast = async (year: number, month: number) => {
    try {
      return await RollingForecastService.getMonthlyForecast({ year, month });
    } catch (error) {
      const errorMessage = handleApiError(error as any);
      setError(errorMessage);
      throw error;
    }
  };

  const value: BudgetContextType = {
    budgetData,
    forecastData,
    currentYear,
    selectedCustomer,
    selectedItems,
    customers,
    items,
    categories,
    brands,
    isLoading,
    error,
    viewMode,
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
    // Rolling Forecast functions
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
