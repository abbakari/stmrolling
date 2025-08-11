import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole, AuthContextType, ROLE_PERMISSIONS, ROLE_DASHBOARDS } from '../types/auth';
import { supabase } from '../lib/supabase';
import { userService } from '../services/supabaseService';
import type { Database } from '../lib/types/supabase';

type UserRow = Database['public']['Tables']['users']['Row'];

// Convert Supabase user row to our User interface
const mapUserData = (userData: UserRow): User => ({
  id: userData.id,
  name: userData.name,
  email: userData.email,
  role: userData.role as UserRole,
  department: userData.department || 'Unknown',
  permissions: ROLE_PERMISSIONS[userData.role as UserRole] || [],
  isActive: userData.is_active,
  createdAt: userData.created_at,
  lastLogin: userData.last_login || undefined
});

// Fallback mock users for development/testing
const MOCK_USERS: Record<string, User> = {
  'admin@example.com': {
    id: '1',
    name: 'System Administrator',
    email: 'admin@example.com',
    role: 'admin',
    department: 'IT',
    permissions: ROLE_PERMISSIONS.admin,
    isActive: true,
    createdAt: '2024-01-01',
    lastLogin: new Date().toISOString()
  },
  'salesman@example.com': {
    id: '2',
    name: 'John Salesman',
    email: 'salesman@example.com',
    role: 'salesman',
    department: 'Sales',
    permissions: ROLE_PERMISSIONS.salesman,
    isActive: true,
    createdAt: '2024-01-01',
    lastLogin: new Date().toISOString()
  },
  'manager@example.com': {
    id: '3',
    name: 'Jane Manager',
    email: 'manager@example.com',
    role: 'manager',
    department: 'Sales',
    permissions: ROLE_PERMISSIONS.manager,
    isActive: true,
    createdAt: '2024-01-01',
    lastLogin: new Date().toISOString()
  }
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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Try to get current Supabase session
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user) {
          // Get user data from our users table
          const { data: userData } = await userService.getById(session.user.id);
          if (userData && Array.isArray(userData) && userData.length > 0) {
            setUser(mapUserData(userData[0]));
            await userService.updateLastLogin(session.user.id);
          }
        } else {
          // Check for mock/local session as fallback
          const savedUser = localStorage.getItem('user');
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              setUser(parsedUser);
            } catch (error) {
              console.error('Error parsing saved user:', error);
              localStorage.removeItem('user');
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        // Fallback to localStorage check
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
          } catch (error) {
            console.error('Error parsing saved user:', error);
            localStorage.removeItem('user');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        try {
          const { data: userData } = await userService.getById(session.user.id);
          if (userData && Array.isArray(userData) && userData.length > 0) {
            setUser(mapUserData(userData[0]));
            await userService.updateLastLogin(session.user.id);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        localStorage.removeItem('user');
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Try Supabase authentication first
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (!authError && data.user) {
        const { data: userData } = await userService.getById(data.user.id);
        if (userData && Array.isArray(userData) && userData.length > 0) {
          const userInfo = userData[0];

          if (!userInfo.is_active) {
            await supabase.auth.signOut();
            throw new Error('Account is deactivated. Please contact administrator.');
          }

          setUser(mapUserData(userInfo));
          await userService.updateLastLogin(data.user.id);
          return;
        } else {
          await supabase.auth.signOut();
          throw new Error('User profile not found. Please contact administrator.');
        }
      }

      // Fallback to mock authentication for development
      console.log('Supabase auth failed, falling back to mock auth:', authError?.message);

      const mockUser = MOCK_USERS[email];

      if (!mockUser) {
        throw new Error('Invalid email or password');
      }

      // Simple password check for mock auth
      if (password !== 'password') {
        throw new Error('Invalid email or password');
      }

      const updatedUser = {
        ...mockUser,
        lastLogin: new Date().toISOString()
      };

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      // Try to sign out from Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out from Supabase:', error);
    } finally {
      setUser(null);
      localStorage.removeItem('user');
      setIsLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    error
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Utility functions for role-based access
export const hasPermission = (user: User | null, resource: string, action: string): boolean => {
  if (!user) return false;
  
  return user.permissions.some(permission => 
    permission.resource === resource && permission.action === action
  );
};

export const canAccessDashboard = (user: User | null, dashboardName: string): boolean => {
  if (!user) return false;
  
  const userDashboards = ROLE_DASHBOARDS[user.role];
  return userDashboards.includes(dashboardName);
};

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
