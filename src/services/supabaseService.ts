import { supabase, queryBuilder, DatabaseTables, performanceHelpers } from '../lib/supabase'
import type { Database } from '../lib/types/supabase'

// Type aliases for cleaner code
type Tables = Database['public']['Tables']
type UserRow = Tables['users']['Row']
type CustomerRow = Tables['customers']['Row']
type ItemRow = Tables['items']['Row']
type CategoryRow = Tables['categories']['Row']
type BrandRow = Tables['brands']['Row']
type SalesBudgetRow = Tables['sales_budget']['Row']
type RollingForecastRow = Tables['rolling_forecast']['Row']

// Cache management
class CacheManager {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>()
  
  set(key: string, data: any, ttl: number = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    })
  }
  
  get(key: string) {
    const cached = this.cache.get(key)
    if (!cached) return null
    
    if (Date.now() - cached.timestamp > cached.ttl) {
      this.cache.delete(key)
      return null
    }
    
    return cached.data
  }
  
  invalidate(pattern: string) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }
  
  clear() {
    this.cache.clear()
  }
}

const cache = new CacheManager()

// Base service class with common functionality
class BaseService<T> {
  constructor(protected tableName: DatabaseTables) {}
  
  protected async executeQuery(queryFn: () => any, cacheKey?: string, ttl?: number) {
    // Check cache first
    if (cacheKey) {
      const cached = cache.get(cacheKey)
      if (cached) return { data: cached, error: null, fromCache: true }
    }
    
    try {
      const result = await queryFn()
      
      if (result.error) {
        console.error(`${this.tableName} query error:`, result.error)
        return { data: null, error: result.error, fromCache: false }
      }
      
      // Cache successful results
      if (cacheKey && result.data) {
        cache.set(cacheKey, result.data, ttl)
      }
      
      return { data: result.data, error: null, fromCache: false }
    } catch (error) {
      console.error(`${this.tableName} service error:`, error)
      return { data: null, error, fromCache: false }
    }
  }
  
  async getAll(options: {
    page?: number
    pageSize?: number
    orderBy?: string
    ascending?: boolean
    filters?: Record<string, any>
  } = {}) {
    const { page = 0, pageSize = 50, orderBy, ascending = true, filters = {} } = options
    const cacheKey = `${this.tableName}_all_${JSON.stringify(options)}`
    
    return this.executeQuery(async () => {
      let query = queryBuilder(this.tableName).select()
      
      if (page >= 0) {
        query = query.paginate(page, pageSize)
      }
      
      if (orderBy) {
        query = query.order(orderBy, ascending)
      }
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          query = query.filter(key, 'eq', value)
        }
      })
      
      return query.execute()
    }, cacheKey)
  }
  
  async getById(id: string) {
    const cacheKey = `${this.tableName}_${id}`
    
    return this.executeQuery(async () => {
      return queryBuilder(this.tableName)
        .select()
        .filter('id', 'eq', id)
        .execute()
    }, cacheKey)
  }
  
  async create(data: any) {
    cache.invalidate(this.tableName)
    
    return this.executeQuery(async () => {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .insert(data)
        .select()
        .single()
      
      return { data: result, error }
    })
  }
  
  async update(id: string, data: any) {
    cache.invalidate(this.tableName)
    cache.invalidate(id)
    
    return this.executeQuery(async () => {
      const { data: result, error } = await supabase
        .from(this.tableName)
        .update(data)
        .eq('id', id)
        .select()
        .single()
      
      return { data: result, error }
    })
  }
  
  async delete(id: string) {
    cache.invalidate(this.tableName)
    cache.invalidate(id)
    
    return this.executeQuery(async () => {
      const { error } = await supabase
        .from(this.tableName)
        .delete()
        .eq('id', id)
      
      return { data: { id }, error }
    })
  }
  
  async search(query: string, columns: string[], options: {
    page?: number
    pageSize?: number
  } = {}) {
    const { page = 0, pageSize = 50 } = options
    const cacheKey = `${this.tableName}_search_${query}_${JSON.stringify(options)}`
    
    return this.executeQuery(async () => {
      // Use full-text search if available, otherwise use ILIKE
      const searchQuery = supabase
        .from(this.tableName)
        .select()
        .range(page * pageSize, (page + 1) * pageSize - 1)
      
      // Apply search across multiple columns
      const orConditions = columns.map(col => `${col}.ilike.%${query}%`).join(',')
      return searchQuery.or(orConditions)
    }, cacheKey, 2 * 60 * 1000) // Shorter cache for search results
  }
}

// User service
export class UserService extends BaseService<UserRow> {
  constructor() {
    super(DatabaseTables.USERS)
  }
  
  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Not authenticated' }
    
    return this.getById(user.id)
  }
  
  async updateLastLogin(userId: string) {
    return this.update(userId, { last_login: new Date().toISOString() })
  }
  
  async getUsersByRole(role: UserRow['role']) {
    return this.getAll({ filters: { role, is_active: true } })
  }
}

// Customer service
export class CustomerService extends BaseService<CustomerRow> {
  constructor() {
    super(DatabaseTables.CUSTOMERS)
  }
  
  async getCustomersByRegion(region: string) {
    return this.getAll({ 
      filters: { region, is_active: true },
      orderBy: 'name',
      ascending: true
    })
  }
  
  async getCustomersByTier(tier: CustomerRow['tier']) {
    return this.getAll({ 
      filters: { tier, is_active: true },
      orderBy: 'name',
      ascending: true
    })
  }
  
  async searchCustomers(query: string, options: any = {}) {
    return this.search(query, ['name', 'code', 'email'], options)
  }
}

// Item service with category and brand details
export class ItemService extends BaseService<ItemRow> {
  constructor() {
    super(DatabaseTables.ITEMS)
  }
  
  async getItemsWithDetails(options: any = {}) {
    const cacheKey = `items_with_details_${JSON.stringify(options)}`
    
    return this.executeQuery(async () => {
      const { page = 0, pageSize = 50, filters = {} } = options
      
      let query = supabase
        .from('items')
        .select(`
          *,
          category:categories(id, name, code),
          brand:brands(id, name, code)
        `)
        .eq('is_active', true)
        .range(page * pageSize, (page + 1) * pageSize - 1)
      
      if (filters.category_id) {
        query = query.eq('category_id', filters.category_id)
      }
      
      if (filters.brand_id) {
        query = query.eq('brand_id', filters.brand_id)
      }
      
      return query
    }, cacheKey)
  }
  
  async searchItems(query: string, options: any = {}) {
    return this.search(query, ['name', 'code', 'description'], options)
  }
}

// Sales Budget service with optimizations
export class SalesBudgetService extends BaseService<SalesBudgetRow> {
  constructor() {
    super(DatabaseTables.SALES_BUDGET)
  }
  
  async getSalesBudgetWithDetails(options: {
    page?: number
    pageSize?: number
    userId?: string
    year?: number
    status?: string
    customerIds?: string[]
    itemIds?: string[]
  } = {}) {
    const cacheKey = `sales_budget_details_${JSON.stringify(options)}`
    
    return this.executeQuery(async () => {
      const { page = 0, pageSize = 50, userId, year, status, customerIds, itemIds } = options
      
      let query = supabase
        .from('sales_budget')
        .select(`
          *,
          customer:customers(id, name, code, region, tier),
          item:items(id, name, code, category:categories(name), brand:brands(name)),
          monthly_budgets:monthly_budget(*)
        `)
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: false })
      
      if (userId) query = query.eq('created_by', userId)
      if (year) query = query.eq('year', year)
      if (status) query = query.eq('status', status)
      if (customerIds?.length) query = query.in('customer_id', customerIds)
      if (itemIds?.length) query = query.in('item_id', itemIds)
      
      return query
    }, cacheKey)
  }
  
  async createSalesBudgetWithMonthly(budgetData: any, monthlyData: any[]) {
    cache.invalidate('sales_budget')
    
    return this.executeQuery(async () => {
      // Start transaction
      const { data: budget, error: budgetError } = await supabase
        .from('sales_budget')
        .insert(budgetData)
        .select()
        .single()
      
      if (budgetError) return { data: null, error: budgetError }
      
      // Insert monthly data
      const monthlyInserts = monthlyData.map(monthly => ({
        ...monthly,
        sales_budget_id: budget.id
      }))
      
      const { data: monthlyResults, error: monthlyError } = await supabase
        .from('monthly_budget')
        .insert(monthlyInserts)
        .select()
      
      if (monthlyError) {
        // Rollback budget insert
        await supabase.from('sales_budget').delete().eq('id', budget.id)
        return { data: null, error: monthlyError }
      }
      
      return { 
        data: { 
          budget, 
          monthly: monthlyResults 
        }, 
        error: null 
      }
    })
  }
  
  async updateBudgetStatus(ids: string[], status: SalesBudgetRow['status']) {
    cache.invalidate('sales_budget')
    
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('sales_budget')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', ids)
        .select()
      
      return { data, error }
    })
  }
  
  async getBudgetSummary(userId?: string, year?: number) {
    const cacheKey = `budget_summary_${userId}_${year}`
    
    return this.executeQuery(async () => {
      let query = supabase
        .from('sales_budget')
        .select('status, budget_2025, budget_2026, budget_value_2026')
      
      if (userId) query = query.eq('created_by', userId)
      if (year) query = query.eq('year', year)
      
      return query
    }, cacheKey, 10 * 60 * 1000) // Cache summary for 10 minutes
  }
}

// Rolling Forecast service
export class RollingForecastService extends BaseService<RollingForecastRow> {
  constructor() {
    super(DatabaseTables.ROLLING_FORECAST)
  }
  
  async getRollingForecastWithDetails(options: {
    page?: number
    pageSize?: number
    userId?: string
    year?: number
    status?: string
  } = {}) {
    const cacheKey = `rolling_forecast_details_${JSON.stringify(options)}`
    
    return this.executeQuery(async () => {
      const { page = 0, pageSize = 50, userId, year, status } = options
      
      let query = supabase
        .from('rolling_forecast')
        .select(`
          *,
          customer:customers(id, name, code, region),
          item:items(id, name, code, category:categories(name), brand:brands(name)),
          monthly_forecasts:monthly_forecast(*)
        `)
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: false })
      
      if (userId) query = query.eq('created_by', userId)
      if (year) query = query.eq('year', year)
      if (status) query = query.eq('status', status)
      
      return query
    }, cacheKey)
  }
}

// Discount Rules service
export class DiscountRulesService extends BaseService<any> {
  constructor() {
    super(DatabaseTables.DISCOUNT_RULES)
  }
  
  async getDiscountByCategory(categoryId: string, brandId: string) {
    const cacheKey = `discount_${categoryId}_${brandId}`
    
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('discount_rules')
        .select('discount_percentage')
        .eq('category_id', categoryId)
        .eq('brand_id', brandId)
        .eq('is_active', true)
        .single()
      
      return { data, error }
    }, cacheKey, 30 * 60 * 1000) // Cache discounts for 30 minutes
  }
  
  async getAllDiscountRules() {
    const cacheKey = 'all_discount_rules'
    
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('discount_rules')
        .select(`
          *,
          category:categories(name, code),
          brand:brands(name, code)
        `)
        .eq('is_active', true)
        .order('category_id')
      
      return { data, error }
    }, cacheKey, 30 * 60 * 1000)
  }
}

// Stock Management service
export class StockManagementService extends BaseService<any> {
  constructor() {
    super(DatabaseTables.STOCK_MANAGEMENT)
  }
  
  async getStockByLocation(location: string) {
    return this.getAll({ filters: { location } })
  }
  
  async updateStock(itemId: string, location: string, quantity: number) {
    cache.invalidate('stock_management')
    
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('stock_management')
        .upsert({
          item_id: itemId,
          location,
          quantity,
          last_stock_date: new Date().toISOString()
        })
        .select()
        .single()
      
      return { data, error }
    })
  }
  
  async getStockSummary() {
    const cacheKey = 'stock_summary'
    
    return this.executeQuery(async () => {
      const { data, error } = await supabase
        .from('stock_management')
        .select(`
          item:items(name, code, category:categories(name)),
          quantity,
          available_quantity,
          location
        `)
      
      return { data, error }
    }, cacheKey, 5 * 60 * 1000)
  }
}

// Create service instances
export const userService = new UserService()
export const customerService = new CustomerService()
export const itemService = new ItemService()
export const salesBudgetService = new SalesBudgetService()
export const rollingForecastService = new RollingForecastService()
export const discountRulesService = new DiscountRulesService()
export const stockManagementService = new StockManagementService()

// Utility functions
export const clearAllCaches = () => cache.clear()
export const invalidateCache = (pattern: string) => cache.invalidate(pattern)

// Performance monitoring
export const getServiceMetrics = () => ({
  cacheSize: cache['cache'].size,
  cacheEntries: Array.from(cache['cache'].keys())
})
