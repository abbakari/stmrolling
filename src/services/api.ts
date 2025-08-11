/**
 * Django API service for STM Budget application
 */
import axios, { AxiosResponse, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          
          const { access } = response.data;
          localStorage.setItem('access_token', access);
          
          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Types
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role: 'admin' | 'manager' | 'salesperson' | 'viewer';
  department: string;
  phone?: string;
  is_active: boolean;
  customer_count?: number;
  sales_budget_count?: number;
}

export interface Customer {
  id: number;
  code: string;
  name: string;
  status: 'active' | 'inactive' | 'prospect' | 'suspended';
  category: 'premium' | 'standard' | 'basic';
  email?: string;
  phone?: string;
  address?: string;
  credit_limit: number;
  payment_terms: number;
  salesperson?: number;
  salesperson_name?: string;
  total_sales_ytd: number;
  last_order_date?: string;
  is_active: boolean;
  is_high_value: boolean;
  credit_utilization: number;
}

export interface Category {
  id: number;
  code: string;
  name: string;
  description?: string;
  parent?: number;
  full_path: string;
  default_discount_percentage: number;
  is_active: boolean;
  items_count: number;
}

export interface Brand {
  id: number;
  code: string;
  name: string;
  description?: string;
  default_discount_percentage: number;
  is_active: boolean;
  items_count: number;
}

export interface Item {
  id: number;
  code: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'discontinued';
  category: number;
  category_name: string;
  brand: number;
  brand_name: string;
  unit_price: number;
  cost_price: number;
  unit_type: string;
  current_stock: number;
  minimum_stock: number;
  total_sales_ytd: number;
  total_quantity_sold_ytd: number;
  is_active: boolean;
  profit_margin: number;
  is_low_stock: boolean;
  effective_discount: number;
  discounted_price: number;
}

export interface SalesBudget {
  id: number;
  customer: number;
  customer_info: Customer;
  item: number;
  item_info: Item;
  year: number;
  month: number;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  total_amount: number;
  distribution_type: 'equal' | 'percentage' | 'seasonal' | 'manual';
  seasonal_multiplier: number;
  is_manual_entry: boolean;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  salesperson?: number;
  salesperson_info?: User;
  notes?: string;
  gross_amount: number;
  discount_amount: number;
  quarter: number;
}

// API Services
export class AuthService {
  static async login(username: string, password: string) {
    const response = await api.post('/auth/login/', { username, password });
    return response.data;
  }

  static async logout(refreshToken: string) {
    await api.post('/auth/logout/', { refresh_token: refreshToken });
  }

  static async getCurrentUser(): Promise<User> {
    const response = await api.get('/auth/me/');
    return response.data;
  }

  static async changePassword(oldPassword: string, newPassword: string) {
    const response = await api.post('/auth/me/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response.data;
  }

  static async getUserStats() {
    const response = await api.get('/auth/me/stats/');
    return response.data;
  }
}

export class CustomerService {
  static async getCustomers(params?: Record<string, any>) {
    const response = await api.get('/customers/', { params });
    return response.data;
  }

  static async getCustomer(id: number): Promise<Customer> {
    const response = await api.get(`/customers/${id}/`);
    return response.data;
  }

  static async createCustomer(data: Partial<Customer>): Promise<Customer> {
    const response = await api.post('/customers/', data);
    return response.data;
  }

  static async updateCustomer(id: number, data: Partial<Customer>): Promise<Customer> {
    const response = await api.put(`/customers/${id}/`, data);
    return response.data;
  }

  static async deleteCustomer(id: number) {
    await api.delete(`/customers/${id}/`);
  }

  static async getCustomerSummary() {
    const response = await api.get('/customers/summary/');
    return response.data;
  }

  static async getCustomerStats() {
    const response = await api.get('/customers/stats/');
    return response.data;
  }

  static async getTopCustomers(limit = 10) {
    const response = await api.get('/customers/top/', { params: { limit } });
    return response.data;
  }
}

export class ItemService {
  static async getItems(params?: Record<string, any>) {
    const response = await api.get('/items/', { params });
    return response.data;
  }

  static async getItem(id: number): Promise<Item> {
    const response = await api.get(`/items/${id}/`);
    return response.data;
  }

  static async createItem(data: Partial<Item>): Promise<Item> {
    const response = await api.post('/items/', data);
    return response.data;
  }

  static async updateItem(id: number, data: Partial<Item>): Promise<Item> {
    const response = await api.put(`/items/${id}/`, data);
    return response.data;
  }

  static async deleteItem(id: number) {
    await api.delete(`/items/${id}/`);
  }

  static async getItemSummary(params?: Record<string, any>) {
    const response = await api.get('/items/summary/', { params });
    return response.data;
  }

  static async getItemStats() {
    const response = await api.get('/items/stats/');
    return response.data;
  }

  static async getTopSellingItems(limit = 10) {
    const response = await api.get('/items/top-selling/', { params: { limit } });
    return response.data;
  }

  static async getLowStockItems() {
    const response = await api.get('/items/low-stock/');
    return response.data;
  }

  static async getCategories(params?: Record<string, any>) {
    const response = await api.get('/items/categories/', { params });
    return response.data;
  }

  static async getCategorySummary() {
    const response = await api.get('/items/categories/summary/');
    return response.data;
  }

  static async getBrands(params?: Record<string, any>) {
    const response = await api.get('/items/brands/', { params });
    return response.data;
  }

  static async getBrandSummary() {
    const response = await api.get('/items/brands/summary/');
    return response.data;
  }
}

export class SalesBudgetService {
  static async getSalesBudget(params?: Record<string, any>) {
    const response = await api.get('/sales-budget/', { params });
    return response.data;
  }

  static async getSalesBudgetEntry(id: number): Promise<SalesBudget> {
    const response = await api.get(`/sales-budget/${id}/`);
    return response.data;
  }

  static async createSalesBudgetEntry(data: Partial<SalesBudget>): Promise<SalesBudget> {
    const response = await api.post('/sales-budget/', data);
    return response.data;
  }

  static async updateSalesBudgetEntry(id: number, data: Partial<SalesBudget>): Promise<SalesBudget> {
    const response = await api.put(`/sales-budget/${id}/`, data);
    return response.data;
  }

  static async deleteSalesBudgetEntry(id: number) {
    await api.delete(`/sales-budget/${id}/`);
  }

  static async bulkCreateSalesBudget(data: {
    customer: number;
    items: number[];
    year: number;
    total_amount: number;
    distribution_type: string;
  }) {
    const response = await api.post('/sales-budget/bulk-create/', data);
    return response.data;
  }

  static async getSalesBudgetSummary(params?: Record<string, any>) {
    const response = await api.get('/sales-budget/summary/', { params });
    return response.data;
  }

  static async getMonthlyBudget(params?: Record<string, any>) {
    const response = await api.get('/sales-budget/monthly/', { params });
    return response.data;
  }

  static async approveBudgetEntries(entryIds: number[]) {
    const response = await api.post('/sales-budget/approve/', { entry_ids: entryIds });
    return response.data;
  }
}

export class UserService {
  static async getUsers(params?: Record<string, any>) {
    const response = await api.get('/auth/users/', { params });
    return response.data;
  }

  static async getUser(id: number): Promise<User> {
    const response = await api.get(`/auth/users/${id}/`);
    return response.data;
  }

  static async createUser(data: Partial<User & { password: string; password_confirm: string }>): Promise<User> {
    const response = await api.post('/auth/users/', data);
    return response.data;
  }

  static async updateUser(id: number, data: Partial<User>): Promise<User> {
    const response = await api.put(`/auth/users/${id}/`, data);
    return response.data;
  }

  static async deleteUser(id: number) {
    await api.delete(`/auth/users/${id}/`);
  }

  static async searchUsers(params?: Record<string, any>) {
    const response = await api.get('/auth/users/search/', { params });
    return response.data;
  }
}

// Error handling utility
export const handleApiError = (error: AxiosError) => {
  if (error.response?.data) {
    const errorData = error.response.data as any;
    if (typeof errorData === 'string') {
      return errorData;
    }
    if (errorData.detail) {
      return errorData.detail;
    }
    if (errorData.error) {
      return errorData.error;
    }
    // Handle field-specific errors
    const fieldErrors = [];
    for (const [field, messages] of Object.entries(errorData)) {
      if (Array.isArray(messages)) {
        fieldErrors.push(`${field}: ${messages.join(', ')}`);
      } else if (typeof messages === 'string') {
        fieldErrors.push(`${field}: ${messages}`);
      }
    }
    if (fieldErrors.length > 0) {
      return fieldErrors.join('\n');
    }
  }
  
  if (error.message) {
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

export default api;
