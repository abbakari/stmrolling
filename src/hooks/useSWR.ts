import useSWR, { SWRConfiguration, mutate } from 'swr';
import { supabase, createPaginationConfig, applyFilters, handleSupabaseError } from '../lib/supabase';
import type { Database } from '../types/database';

type Tables = Database['public']['Tables'];

// Generic SWR configuration with optimizations
const defaultConfig: SWRConfiguration = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000,
  errorRetryCount: 3,
  errorRetryInterval: 1000,
};

// Pagination and filtering options
interface QueryOptions {
  page?: number;
  pageSize?: number;
  filters?: Record<string, any>;
  searchColumn?: string;
  searchTerm?: string;
  orderBy?: string;
  ascending?: boolean;
}

// Generic fetcher function with error handling
const fetcher = async (key: string) => {
  const { error, data } = JSON.parse(key);
  if (error) throw new Error(error);
  return data;
};

// Hook for profiles/users
export const useProfiles = (options: QueryOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, searchColumn, searchTerm, orderBy = 'created_at', ascending = false } = options;
  
  const key = `profiles-${JSON.stringify({ page, pageSize, filters, searchColumn, searchTerm, orderBy, ascending })}`;
  
  const { data, error, isLoading, mutate: mutateProfiles } = useSWR(
    key,
    async () => {
      try {
        const { from, to } = createPaginationConfig(page, pageSize);
        
        let query = supabase
          .from('profiles')
          .select('*', { count: 'exact' });

        query = applyFilters(query, filters, searchColumn, searchTerm);
        query = query.order(orderBy, { ascending });
        query = query.range(from, to);

        const { data, error, count } = await query;
        
        if (error) throw error;
        
        return {
          data: data || [],
          count: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize)
        };
      } catch (error) {
        throw new Error(handleSupabaseError(error));
      }
    },
    defaultConfig
  );

  return {
    profiles: data?.data || [],
    count: data?.count || 0,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    mutate: mutateProfiles
  };
};

// Hook for customers
export const useCustomers = (options: QueryOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, searchColumn, searchTerm, orderBy = 'created_at', ascending = false } = options;
  
  const key = `customers-${JSON.stringify({ page, pageSize, filters, searchColumn, searchTerm, orderBy, ascending })}`;
  
  const { data, error, isLoading, mutate: mutateCustomers } = useSWR(
    key,
    async () => {
      try {
        const { from, to } = createPaginationConfig(page, pageSize);
        
        let query = supabase
          .from('customers')
          .select(`
            *,
            created_by_profile:created_by(name, email)
          `, { count: 'exact' });

        query = applyFilters(query, filters, searchColumn, searchTerm);
        query = query.order(orderBy, { ascending });
        query = query.range(from, to);

        const { data, error, count } = await query;
        
        if (error) throw error;
        
        return {
          data: data || [],
          count: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize)
        };
      } catch (error) {
        throw new Error(handleSupabaseError(error));
      }
    },
    defaultConfig
  );

  return {
    customers: data?.data || [],
    count: data?.count || 0,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    mutate: mutateCustomers
  };
};

// Hook for sales budgets with optimized joins
export const useSalesBudgets = (options: QueryOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, searchColumn, searchTerm, orderBy = 'created_at', ascending = false } = options;
  
  const key = `sales_budgets-${JSON.stringify({ page, pageSize, filters, searchColumn, searchTerm, orderBy, ascending })}`;
  
  const { data, error, isLoading, mutate: mutateBudgets } = useSWR(
    key,
    async () => {
      try {
        const { from, to } = createPaginationConfig(page, pageSize);
        
        let query = supabase
          .from('sales_budgets')
          .select(`
            *,
            customer:customer_id(id, name, email),
            item:item_id(id, name, category:category_id(name), brand:brand_id(name)),
            salesman:salesman_id(id, name, email),
            approved_by_profile:approved_by(name, email)
          `, { count: 'exact' });

        query = applyFilters(query, filters, searchColumn, searchTerm);
        query = query.order(orderBy, { ascending });
        query = query.range(from, to);

        const { data, error, count } = await query;
        
        if (error) throw error;
        
        return {
          data: data || [],
          count: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize)
        };
      } catch (error) {
        throw new Error(handleSupabaseError(error));
      }
    },
    defaultConfig
  );

  return {
    budgets: data?.data || [],
    count: data?.count || 0,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    mutate: mutateBudgets
  };
};

// Hook for rolling forecasts
export const useRollingForecasts = (options: QueryOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, searchColumn, searchTerm, orderBy = 'created_at', ascending = false } = options;
  
  const key = `rolling_forecasts-${JSON.stringify({ page, pageSize, filters, searchColumn, searchTerm, orderBy, ascending })}`;
  
  const { data, error, isLoading, mutate: mutateForecasts } = useSWR(
    key,
    async () => {
      try {
        const { from, to } = createPaginationConfig(page, pageSize);
        
        let query = supabase
          .from('rolling_forecasts')
          .select(`
            *,
            customer:customer_id(id, name, email),
            item:item_id(id, name, category:category_id(name), brand:brand_id(name)),
            salesman:salesman_id(id, name, email),
            approved_by_profile:approved_by(name, email)
          `, { count: 'exact' });

        query = applyFilters(query, filters, searchColumn, searchTerm);
        query = query.order(orderBy, { ascending });
        query = query.range(from, to);

        const { data, error, count } = await query;
        
        if (error) throw error;
        
        return {
          data: data || [],
          count: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize)
        };
      } catch (error) {
        throw new Error(handleSupabaseError(error));
      }
    },
    defaultConfig
  );

  return {
    forecasts: data?.data || [],
    count: data?.count || 0,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    mutate: mutateForecasts
  };
};

// Hook for GIT items
export const useGitItems = (options: QueryOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, searchColumn, searchTerm, orderBy = 'created_at', ascending = false } = options;
  
  const key = `git_items-${JSON.stringify({ page, pageSize, filters, searchColumn, searchTerm, orderBy, ascending })}`;
  
  const { data, error, isLoading, mutate: mutateGitItems } = useSWR(
    key,
    async () => {
      try {
        const { from, to } = createPaginationConfig(page, pageSize);
        
        let query = supabase
          .from('git_items')
          .select(`
            *,
            customer:customer_id(id, name),
            item:item_id(id, name, category:category_id(name), brand:brand_id(name)),
            created_by_profile:created_by(name, email)
          `, { count: 'exact' });

        query = applyFilters(query, filters, searchColumn, searchTerm);
        query = query.order(orderBy, { ascending });
        query = query.range(from, to);

        const { data, error, count } = await query;
        
        if (error) throw error;
        
        return {
          data: data || [],
          count: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize)
        };
      } catch (error) {
        throw new Error(handleSupabaseError(error));
      }
    },
    defaultConfig
  );

  return {
    gitItems: data?.data || [],
    count: data?.count || 0,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    mutate: mutateGitItems
  };
};

// Hook for items with stock information
export const useItems = (options: QueryOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, searchColumn, searchTerm, orderBy = 'created_at', ascending = false } = options;
  
  const key = `items-${JSON.stringify({ page, pageSize, filters, searchColumn, searchTerm, orderBy, ascending })}`;
  
  const { data, error, isLoading, mutate: mutateItems } = useSWR(
    key,
    async () => {
      try {
        const { from, to } = createPaginationConfig(page, pageSize);
        
        let query = supabase
          .from('items')
          .select(`
            *,
            category:category_id(id, name),
            brand:brand_id(id, name),
            created_by_profile:created_by(name, email)
          `, { count: 'exact' });

        query = applyFilters(query, filters, searchColumn, searchTerm);
        query = query.order(orderBy, { ascending });
        query = query.range(from, to);

        const { data, error, count } = await query;
        
        if (error) throw error;
        
        return {
          data: data || [],
          count: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize)
        };
      } catch (error) {
        throw new Error(handleSupabaseError(error));
      }
    },
    defaultConfig
  );

  return {
    items: data?.data || [],
    count: data?.count || 0,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    mutate: mutateItems
  };
};

// Hook for communications/messages
export const useCommunications = (userId?: string, options: QueryOptions = {}) => {
  const { page = 1, pageSize = 20, filters = {}, orderBy = 'created_at', ascending = false } = options;
  
  const key = `communications-${userId}-${JSON.stringify({ page, pageSize, filters, orderBy, ascending })}`;
  
  const { data, error, isLoading, mutate: mutateCommunications } = useSWR(
    key,
    async () => {
      try {
        const { from, to } = createPaginationConfig(page, pageSize);
        
        let query = supabase
          .from('communications')
          .select(`
            *,
            from_user:from_user_id(id, name, email, role),
            to_user:to_user_id(id, name, email, role),
            reply_to:reply_to_id(id, subject)
          `, { count: 'exact' });

        // Filter by user if provided
        if (userId) {
          query = query.or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`);
        }

        query = applyFilters(query, filters);
        query = query.order(orderBy, { ascending });
        query = query.range(from, to);

        const { data, error, count } = await query;
        
        if (error) throw error;
        
        return {
          data: data || [],
          count: count || 0,
          page,
          pageSize,
          totalPages: Math.ceil((count || 0) / pageSize)
        };
      } catch (error) {
        throw new Error(handleSupabaseError(error));
      }
    },
    defaultConfig
  );

  return {
    communications: data?.data || [],
    count: data?.count || 0,
    totalPages: data?.totalPages || 0,
    isLoading,
    error,
    mutate: mutateCommunications
  };
};

// Helper function to invalidate related caches
export const invalidateRelatedCaches = (table: string, id?: string) => {
  // Invalidate all related cache keys
  const cacheKeys = [
    `${table}-`,
    'profiles-',
    'customers-',
    'items-',
    'sales_budgets-',
    'rolling_forecasts-',
    'git_items-',
    'communications-'
  ];

  cacheKeys.forEach(key => {
    mutate(
      (k) => typeof k === 'string' && k.startsWith(key),
      undefined,
      { revalidate: true }
    );
  });
};

// Real-time subscription hooks
export const useRealtimeSubscription = (table: string, callback: (payload: any) => void) => {
  return supabase
    .channel(`realtime-${table}`)
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: table 
      }, 
      callback
    )
    .subscribe();
};
