import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug log environment variables
console.log('Environment check:', {
  url: supabaseUrl ? 'Set' : 'Missing',
  key: supabaseAnonKey ? 'Set' : 'Missing',
  urlValue: supabaseUrl,
  keyValue: supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'undefined'
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration error:', {
    VITE_SUPABASE_URL: supabaseUrl || 'MISSING',
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? 'PROVIDED' : 'MISSING'
  });
  throw new Error(`Missing Supabase environment variables. URL: ${supabaseUrl ? 'OK' : 'MISSING'}, Key: ${supabaseAnonKey ? 'OK' : 'MISSING'}`);
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Helper function for error handling
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  return error?.message || 'An unexpected error occurred';
};

// Pagination helper
export const createPaginationConfig = (
  page: number = 1, 
  pageSize: number = 20
) => {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  return { from, to };
};

// Query builder helper with filters
export const applyFilters = (
  query: any,
  filters: Record<string, any> = {},
  searchColumn?: string,
  searchTerm?: string
) => {
  let filteredQuery = query;

  // Apply standard filters
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      filteredQuery = filteredQuery.eq(key, value);
    }
  });

  // Apply search if provided
  if (searchColumn && searchTerm) {
    filteredQuery = filteredQuery.ilike(searchColumn, `%${searchTerm}%`);
  }

  return filteredQuery;
};
