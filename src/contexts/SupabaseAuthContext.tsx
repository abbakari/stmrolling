import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase, handleSupabaseError } from '../lib/supabase';
import type { Database } from '../types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type UserRole = Database['public']['Enums']['user_role'];

interface AuthUser extends Profile {
  supabaseUser: SupabaseUser;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, metadata: { name: string; role: UserRole; department: string }) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
  canAccessDashboard: (dashboardName: string) => boolean;
}

// Role-based permissions
const ROLE_PERMISSIONS = {
  admin: [
    { resource: 'users', action: 'create' },
    { resource: 'users', action: 'read' },
    { resource: 'users', action: 'update' },
    { resource: 'users', action: 'delete' },
    { resource: 'budgets', action: 'create' },
    { resource: 'budgets', action: 'read' },
    { resource: 'budgets', action: 'update' },
    { resource: 'budgets', action: 'approve' },
    { resource: 'forecasts', action: 'create' },
    { resource: 'forecasts', action: 'read' },
    { resource: 'forecasts', action: 'update' },
    { resource: 'forecasts', action: 'approve' },
    { resource: 'inventory', action: 'create' },
    { resource: 'inventory', action: 'read' },
    { resource: 'inventory', action: 'update' },
    { resource: 'inventory', action: 'delete' },
    { resource: 'communications', action: 'read' },
    { resource: 'communications', action: 'create' },
    { resource: 'reports', action: 'read' },
    { resource: 'settings', action: 'update' }
  ],
  manager: [
    { resource: 'budgets', action: 'read' },
    { resource: 'budgets', action: 'approve' },
    { resource: 'forecasts', action: 'read' },
    { resource: 'forecasts', action: 'approve' },
    { resource: 'inventory', action: 'read' },
    { resource: 'communications', action: 'read' },
    { resource: 'communications', action: 'create' },
    { resource: 'reports', action: 'read' },
    { resource: 'users', action: 'read' }
  ],
  salesman: [
    { resource: 'budgets', action: 'create' },
    { resource: 'budgets', action: 'read' },
    { resource: 'budgets', action: 'update' },
    { resource: 'forecasts', action: 'create' },
    { resource: 'forecasts', action: 'read' },
    { resource: 'forecasts', action: 'update' },
    { resource: 'inventory', action: 'read' },
    { resource: 'communications', action: 'read' },
    { resource: 'communications', action: 'create' },
    { resource: 'customers', action: 'create' },
    { resource: 'customers', action: 'read' },
    { resource: 'customers', action: 'update' }
  ],
  supply_chain: [
    { resource: 'inventory', action: 'create' },
    { resource: 'inventory', action: 'read' },
    { resource: 'inventory', action: 'update' },
    { resource: 'git', action: 'create' },
    { resource: 'git', action: 'read' },
    { resource: 'git', action: 'update' },
    { resource: 'communications', action: 'read' },
    { resource: 'communications', action: 'create' },
    { resource: 'reports', action: 'read' }
  ]
};

// Role-based dashboard access
const ROLE_DASHBOARDS = {
  admin: ['dashboard', 'user-management', 'data-sources', 'admin-panel', 'admin-inventory', 'advanced-admin', 'bi-dashboard'],
  manager: ['dashboard', 'approval-center', 'bi-dashboard'],
  salesman: ['dashboard', 'sales-budget', 'rolling-forecast'],
  supply_chain: ['dashboard', 'inventory-management', 'distribution-management']
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile from database
  const fetchUserProfile = async (supabaseUser: SupabaseUser): Promise<AuthUser | null> => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single();

      if (error) throw error;

      if (!profile) {
        throw new Error('Profile not found');
      }

      // Update last login
      await supabase
        .from('profiles')
        .update({ last_login: new Date().toISOString() })
        .eq('id', supabaseUser.id);

      return {
        ...profile,
        supabaseUser
      };
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  };

  // Initialize auth state
  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (initialSession?.user && mounted) {
          const userProfile = await fetchUserProfile(initialSession.user);
          setUser(userProfile);
          setSession(initialSession);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setError(handleSupabaseError(error));
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          try {
            const userProfile = await fetchUserProfile(session.user);
            setUser(userProfile);
            setSession(session);
            setError(null);
          } catch (error) {
            console.error('Error on sign in:', error);
            setError(handleSupabaseError(error));
          }
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setSession(null);
          setError(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          try {
            const userProfile = await fetchUserProfile(session.user);
            setUser(userProfile);
            setSession(session);
          } catch (error) {
            console.error('Error refreshing user profile:', error);
          }
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // User profile will be set by the auth state change listener
    } catch (error) {
      setError(handleSupabaseError(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    metadata: { name: string; role: UserRole; department: string }
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });

      if (error) throw error;

      // Profile will be created automatically by the database trigger
    } catch (error) {
      setError(handleSupabaseError(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      setError(handleSupabaseError(error));
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');

    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) throw error;

      // Update local user state
      setUser(prev => prev ? { ...prev, ...updates } : null);
    } catch (error) {
      setError(handleSupabaseError(error));
      throw error;
    }
  };

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false;
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    return userPermissions.some(permission => 
      permission.resource === resource && permission.action === action
    );
  };

  const canAccessDashboard = (dashboardName: string): boolean => {
    if (!user) return false;
    
    const userDashboards = ROLE_DASHBOARDS[user.role] || [];
    return userDashboards.includes(dashboardName);
  };

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    updateProfile,
    hasPermission,
    canAccessDashboard
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Utility functions for role-based access (keeping compatibility)
export const getUserRoleName = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'Administrator';
    case 'salesman':
      return 'Salesman';
    case 'manager':
      return 'Manager';
    case 'supply_chain':
      return 'Supply Chain';
    default:
      return 'Unknown';
  }
};

// Export permission checking functions
export { ROLE_PERMISSIONS, ROLE_DASHBOARDS };
