import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { queryBuilder, DatabaseTables, performanceHelpers } from '../lib/supabase'

interface QueryState<T> {
  data: T[] | null
  loading: boolean
  error: string | null
  count: number
  page: number
  hasMore: boolean
  fromCache: boolean
}

interface QueryOptions {
  pageSize?: number
  enableCache?: boolean
  enableRealtime?: boolean
  searchColumns?: string[]
  orderBy?: { column: string; ascending: boolean }
  filters?: Array<{ column: string; operator: string; value: any }>
  select?: string
  dependencies?: any[]
}

export function useAdvancedQuery<T = any>(
  table: DatabaseTables,
  options: QueryOptions = {}
) {
  const {
    pageSize = 50,
    enableCache = true,
    enableRealtime = false,
    searchColumns = [],
    orderBy,
    filters = [],
    select,
    dependencies = []
  } = options

  const [state, setState] = useState<QueryState<T>>({
    data: null,
    loading: true,
    error: null,
    count: 0,
    page: 0,
    hasMore: true,
    fromCache: false
  })

  const [searchQuery, setSearchQuery] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)
  const cacheKeyRef = useRef<string>('')

  // Generate cache key based on parameters
  const cacheKey = useMemo(() => {
    return `${table}_${JSON.stringify({
      page: state.page,
      pageSize,
      searchQuery,
      orderBy,
      filters,
      select
    })}`
  }, [table, state.page, pageSize, searchQuery, orderBy, filters, select])

  // Update cache key ref
  useEffect(() => {
    cacheKeyRef.current = cacheKey
  }, [cacheKey])

  // Build and execute query
  const executeQuery = useCallback(async (page: number = 0, append: boolean = false) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      page: append ? prev.page : page
    }))

    try {
      let query = queryBuilder(table)

      // Select specific columns
      if (select) {
        query = query.select(select)
      } else {
        query = query.select('*')
      }

      // Apply pagination
      query = query.paginate(page, pageSize)

      // Apply filters
      filters.forEach(filter => {
        query = query.filter(filter.column, filter.operator, filter.value)
      })

      // Apply search across multiple columns
      if (searchQuery && searchColumns.length > 0) {
        // For multiple columns, we'll use OR logic
        searchColumns.forEach((column, index) => {
          if (index === 0) {
            query = query.search(column, searchQuery)
          } else {
            // Note: This is a limitation of the current implementation
            // For true multi-column search, we'd need to use raw SQL
            query = query.search(column, searchQuery)
          }
        })
      }

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, orderBy.ascending)
      }

      // Execute with or without cache
      const result = enableCache 
        ? await query.executeWithCache(cacheKeyRef.current)
        : await query.execute()

      if (result.error) {
        throw result.error
      }

      setState(prev => ({
        ...prev,
        data: append && prev.data ? [...prev.data, ...(result.data || [])] : result.data,
        loading: false,
        count: result.count || 0,
        hasMore: (result.data?.length || 0) === pageSize,
        fromCache: result.fromCache || false
      }))

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error.message || 'An error occurred'
        }))
      }
    }
  }, [table, pageSize, searchQuery, orderBy, filters, select, searchColumns, enableCache])

  // Initial load and dependency changes
  useEffect(() => {
    executeQuery(0, false)
  }, [executeQuery, ...dependencies])

  // Search functionality
  const search = useCallback((query: string) => {
    setSearchQuery(query)
    setState(prev => ({ ...prev, page: 0 }))
  }, [])

  // Load more (pagination)
  const loadMore = useCallback(() => {
    if (!state.loading && state.hasMore) {
      const nextPage = state.page + 1
      setState(prev => ({ ...prev, page: nextPage }))
      executeQuery(nextPage, true)
    }
  }, [state.loading, state.hasMore, state.page, executeQuery])

  // Refresh data
  const refresh = useCallback(() => {
    executeQuery(0, false)
  }, [executeQuery])

  // Reset to first page
  const reset = useCallback(() => {
    setState(prev => ({ ...prev, page: 0 }))
    executeQuery(0, false)
  }, [executeQuery])

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  return {
    ...state,
    search,
    loadMore,
    refresh,
    reset,
    searchQuery
  }
}

// Specialized hook for virtual scrolling
export function useVirtualizedQuery<T = any>(
  table: DatabaseTables,
  options: QueryOptions & { 
    itemHeight: number
    containerHeight: number
    overscan?: number
  }
) {
  const { itemHeight, containerHeight, overscan = 5, ...queryOptions } = options
  
  const visibleItems = Math.ceil(containerHeight / itemHeight)
  const effectivePageSize = Math.max(visibleItems + (overscan * 2), 20)

  const query = useAdvancedQuery<T>(table, {
    ...queryOptions,
    pageSize: effectivePageSize
  })

  const [scrollTop, setScrollTop] = useState(0)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    (query.data?.length || 0) - 1,
    startIndex + visibleItems + (overscan * 2)
  )

  const visibleData = query.data?.slice(startIndex, endIndex + 1) || []

  const totalHeight = (query.data?.length || 0) * itemHeight
  const offsetY = startIndex * itemHeight

  return {
    ...query,
    visibleData,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    setScrollTop,
    itemHeight,
    visibleItems
  }
}

// Hook for infinite scroll
export function useInfiniteQuery<T = any>(
  table: DatabaseTables,
  options: QueryOptions = {}
) {
  const query = useAdvancedQuery<T>(table, options)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const loadMore = useCallback(async () => {
    if (query.loading || isLoadingMore || !query.hasMore) return

    setIsLoadingMore(true)
    await query.loadMore()
    setIsLoadingMore(false)
  }, [query.loading, isLoadingMore, query.hasMore, query.loadMore])

  // Intersection Observer for auto-loading
  const loadMoreRef = useCallback((node: HTMLElement | null) => {
    if (!node || query.loading || isLoadingMore || !query.hasMore) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          loadMore()
        }
      },
      { threshold: 1.0 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [loadMore, query.loading, isLoadingMore, query.hasMore])

  return {
    ...query,
    loadMore,
    loadMoreRef,
    isLoadingMore
  }
}
