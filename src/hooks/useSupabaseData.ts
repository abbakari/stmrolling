import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { 
  userService, 
  customerService, 
  itemService, 
  salesBudgetService, 
  rollingForecastService,
  discountRulesService,
  stockManagementService 
} from '../services/supabaseService'
import { realtimeManager } from '../lib/supabase'

// Generic data hook with advanced features
interface UseDataOptions {
  enabled?: boolean
  refetchOnWindowFocus?: boolean
  refetchInterval?: number
  staleTime?: number
  cacheTime?: number
  suspense?: boolean
  placeholderData?: any
  keepPreviousData?: boolean
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
}

interface UseDataResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  isStale: boolean
  fromCache: boolean
  refetch: () => Promise<void>
}

function useGenericData<T>(
  queryFn: () => Promise<{ data: T | null; error: any; fromCache?: boolean }>,
  deps: any[] = [],
  options: UseDataOptions = {}
): UseDataResult<T> {
  const {
    enabled = true,
    refetchOnWindowFocus = false,
    refetchInterval,
    staleTime = 5 * 60 * 1000, // 5 minutes
    keepPreviousData = false,
    onSuccess,
    onError,
    placeholderData
  } = options

  const [state, setState] = useState<{
    data: T | null
    loading: boolean
    error: string | null
    fromCache: boolean
    lastFetch: number
  }>({
    data: placeholderData || null,
    loading: enabled,
    error: null,
    fromCache: false,
    lastFetch: 0
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const executeQuery = useCallback(async (showLoading = true) => {
    if (!enabled) return

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    if (showLoading) {
      setState(prev => ({ 
        ...prev, 
        loading: true, 
        error: null 
      }))
    }

    try {
      const result = await queryFn()
      
      if (result.error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: result.error.message || 'An error occurred',
          fromCache: false
        }))
        onError?.(result.error)
      } else {
        setState(prev => ({
          ...prev,
          data: result.data,
          loading: false,
          error: null,
          fromCache: result.fromCache || false,
          lastFetch: Date.now()
        }))
        onSuccess?.(result.data)
      }
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'Network error',
          fromCache: false
        }))
        onError?.(error)
      }
    }
  }, [enabled, queryFn, onSuccess, onError])

  // Initial fetch and dependency updates
  useEffect(() => {
    if (enabled) {
      executeQuery(true)
    }
  }, [executeQuery, ...deps])

  // Window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return

    const handleFocus = () => {
      if (enabled && Date.now() - state.lastFetch > staleTime) {
        executeQuery(false)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetchOnWindowFocus, enabled, state.lastFetch, staleTime, executeQuery])

  // Interval refetch
  useEffect(() => {
    if (!refetchInterval || !enabled) return

    intervalRef.current = setInterval(() => {
      executeQuery(false)
    }, refetchInterval)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [refetchInterval, enabled, executeQuery])

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [])

  const refresh = useCallback(() => executeQuery(true), [executeQuery])
  const refetch = useCallback(() => executeQuery(false), [executeQuery])

  const isStale = useMemo(() => {
    return Date.now() - state.lastFetch > staleTime
  }, [state.lastFetch, staleTime])

  return {
    data: state.data,
    loading: state.loading,
    error: state.error,
    refresh,
    isStale,
    fromCache: state.fromCache,
    refetch
  }
}

// Specific hooks for each service

// Users
export function useCurrentUser(options?: UseDataOptions) {
  return useGenericData(
    () => userService.getCurrentUser(),
    [],
    { staleTime: 30 * 60 * 1000, ...options } // 30 minutes for user data
  )
}

export function useUsersByRole(role: string, options?: UseDataOptions) {
  return useGenericData(
    () => userService.getUsersByRole(role as any),
    [role],
    options
  )
}

// Customers
export function useCustomers(filters: any = {}, options?: UseDataOptions) {
  return useGenericData(
    () => customerService.getAll({ filters }),
    [JSON.stringify(filters)],
    options
  )
}

export function useCustomersByRegion(region: string, options?: UseDataOptions) {
  return useGenericData(
    () => customerService.getCustomersByRegion(region),
    [region],
    options
  )
}

export function useCustomerSearch(query: string, searchOptions: any = {}, options?: UseDataOptions) {
  return useGenericData(
    () => query ? customerService.searchCustomers(query, searchOptions) : Promise.resolve({ data: [], error: null }),
    [query, JSON.stringify(searchOptions)],
    { enabled: query.length >= 2, ...options }
  )
}

// Items
export function useItems(filters: any = {}, options?: UseDataOptions) {
  return useGenericData(
    () => itemService.getItemsWithDetails({ filters }),
    [JSON.stringify(filters)],
    options
  )
}

export function useItemSearch(query: string, searchOptions: any = {}, options?: UseDataOptions) {
  return useGenericData(
    () => query ? itemService.searchItems(query, searchOptions) : Promise.resolve({ data: [], error: null }),
    [query, JSON.stringify(searchOptions)],
    { enabled: query.length >= 2, ...options }
  )
}

// Sales Budget
export function useSalesBudget(queryOptions: any = {}, options?: UseDataOptions) {
  return useGenericData(
    () => salesBudgetService.getSalesBudgetWithDetails(queryOptions),
    [JSON.stringify(queryOptions)],
    options
  )
}

export function useBudgetSummary(userId?: string, year?: number, options?: UseDataOptions) {
  return useGenericData(
    () => salesBudgetService.getBudgetSummary(userId, year),
    [userId, year],
    { staleTime: 10 * 60 * 1000, ...options } // 10 minutes for summary
  )
}

// Rolling Forecast
export function useRollingForecast(queryOptions: any = {}, options?: UseDataOptions) {
  return useGenericData(
    () => rollingForecastService.getRollingForecastWithDetails(queryOptions),
    [JSON.stringify(queryOptions)],
    options
  )
}

// Discount Rules
export function useDiscountRules(options?: UseDataOptions) {
  return useGenericData(
    () => discountRulesService.getAllDiscountRules(),
    [],
    { staleTime: 30 * 60 * 1000, ...options } // 30 minutes for discount rules
  )
}

export function useDiscount(categoryId: string, brandId: string, options?: UseDataOptions) {
  return useGenericData(
    () => categoryId && brandId 
      ? discountRulesService.getDiscountByCategory(categoryId, brandId)
      : Promise.resolve({ data: null, error: null }),
    [categoryId, brandId],
    { enabled: !!(categoryId && brandId), staleTime: 30 * 60 * 1000, ...options }
  )
}

// Stock Management
export function useStockSummary(options?: UseDataOptions) {
  return useGenericData(
    () => stockManagementService.getStockSummary(),
    [],
    { staleTime: 5 * 60 * 1000, ...options } // 5 minutes for stock
  )
}

export function useStockByLocation(location: string, options?: UseDataOptions) {
  return useGenericData(
    () => stockManagementService.getStockByLocation(location),
    [location],
    { enabled: !!location, ...options }
  )
}

// Pagination hook
export function usePaginatedData<T>(
  fetchFn: (page: number, pageSize: number) => Promise<{ data: T[] | null; error: any }>,
  deps: any[] = [],
  pageSize: number = 50
) {
  const [page, setPage] = useState(0)
  const [allData, setAllData] = useState<T[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPage = useCallback(async (pageNum: number, append: boolean = false) => {
    setLoading(true)
    setError(null)

    try {
      const result = await fetchFn(pageNum, pageSize)
      
      if (result.error) {
        setError(result.error.message || 'Error loading data')
      } else {
        const newData = result.data || []
        setAllData(prev => append ? [...prev, ...newData] : newData)
        setHasMore(newData.length === pageSize)
        setPage(pageNum)
      }
    } catch (err: any) {
      setError(err.message || 'Network error')
    } finally {
      setLoading(false)
    }
  }, [fetchFn, pageSize])

  // Initial load
  useEffect(() => {
    loadPage(0, false)
  }, [...deps])

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadPage(page + 1, true)
    }
  }, [loading, hasMore, page, loadPage])

  const refresh = useCallback(() => {
    setAllData([])
    setPage(0)
    setHasMore(true)
    loadPage(0, false)
  }, [loadPage])

  return {
    data: allData,
    loading,
    error,
    hasMore,
    loadMore,
    refresh,
    page
  }
}

// Real-time data hook
export function useRealtimeData<T>(
  tableName: any,
  initialData: T[],
  filter?: string
) {
  const [data, setData] = useState<T[]>(initialData)

  useEffect(() => {
    setData(initialData)
  }, [initialData])

  useEffect(() => {
    const handleChange = (payload: any) => {
      console.log('Real-time update:', payload)
      
      switch (payload.eventType) {
        case 'INSERT':
          setData(prev => [payload.new, ...prev])
          break
        case 'UPDATE':
          setData(prev => prev.map(item => 
            (item as any).id === payload.new.id ? payload.new : item
          ))
          break
        case 'DELETE':
          setData(prev => prev.filter(item => 
            (item as any).id !== payload.old.id
          ))
          break
      }
    }

    const channel = realtimeManager.subscribe(tableName, handleChange, filter)

    return () => {
      realtimeManager.unsubscribe(tableName)
    }
  }, [tableName, filter])

  return data
}

// Optimistic updates hook
export function useOptimisticUpdate<T>() {
  const [optimisticData, setOptimisticData] = useState<T | null>(null)
  const [isOptimistic, setIsOptimistic] = useState(false)

  const performOptimisticUpdate = useCallback(
    async <R>(
      optimisticValue: T,
      asyncFn: () => Promise<R>
    ): Promise<R> => {
      setOptimisticData(optimisticValue)
      setIsOptimistic(true)

      try {
        const result = await asyncFn()
        setIsOptimistic(false)
        setOptimisticData(null)
        return result
      } catch (error) {
        setIsOptimistic(false)
        setOptimisticData(null)
        throw error
      }
    },
    []
  )

  return {
    optimisticData,
    isOptimistic,
    performOptimisticUpdate
  }
}
