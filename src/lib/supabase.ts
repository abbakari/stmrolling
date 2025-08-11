import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = 'https://syzsalhudyapayysgouh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN5enNhbGh1ZHlhcGF5eXNnb3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MDA1NDgsImV4cCI6MjA3MDQ3NjU0OH0.KR1N2rvOrC_Fx4vD43QG1Tj4eLktB6KHH9bhJGjATLs'

// Create Supabase client with optimizations for large datasets
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Enable automatic token refresh
    autoRefreshToken: true,
    // Persist session in localStorage
    persistSession: true,
    // Detect session recovery
    detectSessionInUrl: true
  },
  // Database optimizations
  db: {
    // Use connection pooling
    schema: 'public',
  },
  // Real-time optimizations
  realtime: {
    // Enable heartbeat to keep connection alive
    heartbeatIntervalMs: 30000,
    // Reconnect automatically
    reconnectAfterMs: 2000,
  },
  // Global fetch options for performance
  global: {
    headers: {
      'Cache-Control': 'max-age=3600', // Cache for 1 hour
    },
  }
})

// Database Tables Enum for type safety
export enum DatabaseTables {
  USERS = 'users',
  CUSTOMERS = 'customers', 
  ITEMS = 'items',
  CATEGORIES = 'categories',
  BRANDS = 'brands',
  SALES_BUDGET = 'sales_budget',
  MONTHLY_BUDGET = 'monthly_budget',
  ROLLING_FORECAST = 'rolling_forecast',
  MONTHLY_FORECAST = 'monthly_forecast',
  STOCK_MANAGEMENT = 'stock_management',
  GIT_TRACKING = 'git_tracking',
  WORKFLOW_APPROVALS = 'workflow_approvals',
  NOTIFICATIONS = 'notifications',
  DISCOUNT_RULES = 'discount_rules',
  MANUAL_BUDGET_ENTRIES = 'manual_budget_entries',
  SUBMISSION_COPIES = 'submission_copies',
  AUDIT_LOGS = 'audit_logs'
}

// Performance optimization helper functions
export const performanceHelpers = {
  // Pagination helper
  paginate: (page: number, pageSize: number = 50) => ({
    from: page * pageSize,
    to: (page + 1) * pageSize - 1
  }),

  // Search optimization
  fuzzySearch: (column: string, query: string) => 
    `${column}.ilike.%${query}%`,

  // Batch operations
  batchSize: 100,

  // Cache duration (5 minutes)
  cacheMs: 5 * 60 * 1000,

  // Connection retry settings
  maxRetries: 3,
  retryDelayMs: 1000
}

// Advanced query builder for complex operations
export class AdvancedQueryBuilder {
  private query: any
  private tableName: string

  constructor(table: DatabaseTables) {
    this.tableName = table
    this.query = supabase.from(table)
  }

  // Optimized select with specific columns
  select(columns?: string) {
    this.query = this.query.select(columns || '*')
    return this
  }

  // Paginated results
  paginate(page: number, pageSize: number = 50) {
    const { from, to } = performanceHelpers.paginate(page, pageSize)
    this.query = this.query.range(from, to)
    return this
  }

  // Filtered search
  filter(column: string, operator: string, value: any) {
    this.query = this.query.filter(column, operator, value)
    return this
  }

  // Fuzzy text search
  search(column: string, query: string) {
    this.query = this.query.ilike(column, `%${query}%`)
    return this
  }

  // Order results
  order(column: string, ascending: boolean = true) {
    this.query = this.query.order(column, { ascending })
    return this
  }

  // Execute query with error handling
  async execute() {
    try {
      const { data, error, count } = await this.query
      
      if (error) {
        console.error(`Query error on ${this.tableName}:`, error)
        throw error
      }

      return { data, count, error: null }
    } catch (err) {
      console.error(`Execution error:`, err)
      return { data: null, count: 0, error: err }
    }
  }

  // Execute with cache
  async executeWithCache(cacheKey: string) {
    // Check cache first
    const cached = sessionStorage.getItem(cacheKey)
    if (cached) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < performanceHelpers.cacheMs) {
        return { data, count: data?.length || 0, error: null, fromCache: true }
      }
    }

    // Execute query
    const result = await this.execute()
    
    // Cache successful results
    if (result.data && !result.error) {
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: result.data,
        timestamp: Date.now()
      }))
    }

    return { ...result, fromCache: false }
  }
}

// Real-time subscription manager
export class RealtimeManager {
  private subscriptions: Map<string, any> = new Map()

  // Subscribe to table changes
  subscribe(table: DatabaseTables, callback: (payload: any) => void, filter?: string) {
    const channel = supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table,
          filter 
        }, 
        callback
      )
      .subscribe()

    this.subscriptions.set(table, channel)
    return channel
  }

  // Unsubscribe from specific table
  unsubscribe(table: DatabaseTables) {
    const channel = this.subscriptions.get(table)
    if (channel) {
      supabase.removeChannel(channel)
      this.subscriptions.delete(table)
    }
  }

  // Unsubscribe from all tables
  unsubscribeAll() {
    this.subscriptions.forEach((channel) => {
      supabase.removeChannel(channel)
    })
    this.subscriptions.clear()
  }
}

// Connection health monitor
export class ConnectionMonitor {
  private isConnected: boolean = true
  private listeners: ((connected: boolean) => void)[] = []

  constructor() {
    this.startMonitoring()
  }

  private startMonitoring() {
    // Monitor connection status
    window.addEventListener('online', () => this.updateStatus(true))
    window.addEventListener('offline', () => this.updateStatus(false))

    // Periodic health check
    setInterval(async () => {
      try {
        const { error } = await supabase.from('users').select('id').limit(1)
        this.updateStatus(!error)
      } catch {
        this.updateStatus(false)
      }
    }, 30000) // Check every 30 seconds
  }

  private updateStatus(connected: boolean) {
    if (this.isConnected !== connected) {
      this.isConnected = connected
      this.listeners.forEach(listener => listener(connected))
    }
  }

  onStatusChange(callback: (connected: boolean) => void) {
    this.listeners.push(callback)
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) this.listeners.splice(index, 1)
    }
  }

  get connected() {
    return this.isConnected
  }
}

// Global instances
export const queryBuilder = (table: DatabaseTables) => new AdvancedQueryBuilder(table)
export const realtimeManager = new RealtimeManager()
export const connectionMonitor = new ConnectionMonitor()

// Export types for TypeScript
export type { Database } from './types/supabase'
