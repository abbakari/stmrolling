import { UserRole } from '../types/auth';

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  department?: string;
  isActive: boolean;
}

interface LoginResponse {
  access: string;
  refresh: string;
  user: User;
}

// Mock user database
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  admin: {
    password: 'admin123',
    user: {
      id: '1',
      username: 'admin',
      email: 'admin@stmbudget.com',
      role: 'admin',
      first_name: 'System',
      last_name: 'Administrator',
      department: 'IT',
      isActive: true
    }
  },
  manager1: {
    password: 'manager123',
    user: {
      id: '2',
      username: 'manager1',
      email: 'manager@stmbudget.com',
      role: 'manager',
      first_name: 'John',
      last_name: 'Manager',
      department: 'Sales',
      isActive: true
    }
  },
  sales1: {
    password: 'sales123',
    user: {
      id: '3',
      username: 'sales1',
      email: 'sales@stmbudget.com',
      role: 'salesperson',
      first_name: 'Sarah',
      last_name: 'Sales',
      department: 'Sales',
      isActive: true
    }
  },
  viewer1: {
    password: 'viewer123',
    user: {
      id: '4',
      username: 'viewer1',
      email: 'viewer@stmbudget.com',
      role: 'viewer',
      first_name: 'Mike',
      last_name: 'Viewer',
      department: 'Operations',
      isActive: true
    }
  }
};

// Simulate network delay
const simulateDelay = (ms: number = 500) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const MockAuthService = {
  async login(username: string, password: string): Promise<LoginResponse> {
    await simulateDelay();
    
    const userCredentials = MOCK_USERS[username];
    
    if (!userCredentials || userCredentials.password !== password) {
      throw new Error('Invalid username or password');
    }
    
    const mockToken = `mock_token_${username}_${Date.now()}`;
    
    return {
      access: mockToken,
      refresh: `refresh_${mockToken}`,
      user: userCredentials.user
    };
  },

  async getCurrentUser(): Promise<User> {
    await simulateDelay(200);
    
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      throw new Error('No user found');
    }
    
    return JSON.parse(userStr);
  },

  async logout(refreshToken: string): Promise<void> {
    await simulateDelay(200);
    // Mock logout - just return success
    return;
  },

  async getUserStats(): Promise<any> {
    await simulateDelay(300);
    
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    const user = JSON.parse(userStr);
    
    // Return role-specific mock stats
    switch (user.role) {
      case 'admin':
        return {
          totalUsers: 156,
          totalSales: 2850000,
          systemPerformance: 98.2,
          budgetUtilization: 87.5,
          pendingApprovals: 12,
          recentActivities: 45
        };
      case 'manager':
        return {
          teamMembers: 8,
          teamSales: 580000,
          teamBudget: 650000,
          pendingApprovals: 5,
          completedTasks: 23,
          overdueTasks: 2
        };
      case 'salesperson':
        return {
          personalSales: 125000,
          personalTarget: 150000,
          completedDeals: 18,
          pipelineValue: 75000,
          monthlyProgress: 83.3,
          activeLead: 12
        };
      case 'viewer':
        return {
          accessibleReports: 15,
          viewedThisMonth: 8,
          favoriteReports: 5,
          lastAccess: new Date().toISOString(),
          dataUpdatedAt: new Date().toISOString()
        };
      default:
        return {};
    }
  }
};
