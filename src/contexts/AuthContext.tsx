import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthService, User, handleApiError } from '../services/api';
import { UserRole, Permission, ROLE_PERMISSIONS, ROLE_DASHBOARDS } from '../types/auth';

interface LoginCredentials {
  username: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  userStats: any;
  refreshUserStats: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userStats, setUserStats] = useState<any>(null);

  // Check for existing auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (token) {
        const userData = await AuthService.getCurrentUser();
        setUser(userData);
        await refreshUserStats();
      }
    } catch (error) {
      // Token is invalid, clear storage
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await AuthService.login(credentials.username, credentials.password);

      // Store tokens
      localStorage.setItem('access_token', response.access);
      localStorage.setItem('refresh_token', response.refresh);

      // Store user data
      setUser(response.user);
      localStorage.setItem('user', JSON.stringify(response.user));

      // Get user stats
      await refreshUserStats();
    } catch (error) {
      const errorMessage = handleApiError(error as any);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local storage regardless of API call success
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      setUser(null);
      setUserStats(null);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const refreshUserStats = async () => {
    try {
      const stats = await AuthService.getUserStats();
      setUserStats(stats);
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const isAuthenticated = !!user;

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    updateUser,
    userStats,
    refreshUserStats
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Utility functions for role-based access control
export const getUserRoleName = (role: string | undefined): string => {
  if (!role) return 'Unknown';

  const roleMap: Record<string, string> = {
    'admin': 'Administrator',
    'manager': 'Manager',
    'salesperson': 'Salesperson',
    'viewer': 'Viewer',
    'salesman': 'Salesman',
    'supply_chain': 'Supply Chain'
  };

  return roleMap[role] || role.charAt(0).toUpperCase() + role.slice(1);
};

export const hasPermission = (user: User | null, resource: string, action: string): boolean => {
  if (!user) return false;

  // Admin has all permissions
  if (user.role === 'admin') return true;

  // Map API roles to auth types
  const roleMap: Record<string, UserRole> = {
    'manager': 'manager',
    'salesperson': 'salesman',
    'viewer': 'supply_chain',
    'admin': 'admin'
  };

  const mappedRole = roleMap[user.role] || 'salesman';
  const permissions = ROLE_PERMISSIONS[mappedRole] || [];

  return permissions.some(perm =>
    perm.resource === resource &&
    (perm.action === action || perm.action === 'manage')
  );
};

export const canAccessDashboard = (user: User | null, dashboard: string): boolean => {
  if (!user) return false;

  // Admin can access everything
  if (user.role === 'admin') return true;

  // Map API roles to auth types
  const roleMap: Record<string, UserRole> = {
    'manager': 'manager',
    'salesperson': 'salesman',
    'viewer': 'supply_chain',
    'admin': 'admin'
  };

  const mappedRole = roleMap[user.role] || 'salesman';
  const allowedDashboards = ROLE_DASHBOARDS[mappedRole] || [];

  return allowedDashboards.includes(dashboard);
};

export default AuthContext;
