import React, { useState } from 'react';
import { Users, ChevronDown, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const DEMO_USERS = [
  {
    username: 'admin',
    password: 'admin123',
    role: 'admin',
    name: 'System Administrator',
    color: 'bg-red-500'
  },
  {
    username: 'manager1',
    password: 'manager123',
    role: 'manager',
    name: 'John Manager',
    color: 'bg-blue-500'
  },
  {
    username: 'sales1',
    password: 'sales123',
    role: 'salesperson',
    name: 'Sarah Sales',
    color: 'bg-green-500'
  },
  {
    username: 'viewer1',
    password: 'viewer123',
    role: 'viewer',
    name: 'Mike Viewer',
    color: 'bg-purple-500'
  }
];

const UserSwitcher: React.FC = () => {
  const { user, login, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleUserSwitch = async (demoUser: typeof DEMO_USERS[0]) => {
    if (user?.username === demoUser.username) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      await login({
        username: demoUser.username,
        password: demoUser.password
      });
      setIsOpen(false);
    } catch (error) {
      console.error('Switch user failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentUser = DEMO_USERS.find(u => u.username === user?.username);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        disabled={isLoading}
      >
        <div className={`w-8 h-8 ${currentUser?.color || 'bg-gray-400'} rounded-full flex items-center justify-center`}>
          <User className="w-4 h-4 text-white" />
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-gray-900">{currentUser?.name || 'Unknown User'}</div>
          <div className="text-xs text-gray-500">{user?.role || 'No Role'}</div>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
            <div className="p-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                <Users className="w-4 h-4" />
                Switch Demo User
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Experience different user roles
              </div>
            </div>
            
            <div className="p-2">
              {DEMO_USERS.map((demoUser) => (
                <button
                  key={demoUser.username}
                  onClick={() => handleUserSwitch(demoUser)}
                  disabled={isLoading}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-gray-50 transition-colors ${
                    user?.username === demoUser.username 
                      ? 'bg-blue-50 border border-blue-200' 
                      : ''
                  }`}
                >
                  <div className={`w-6 h-6 ${demoUser.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                    <User className="w-3 h-3 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-gray-900">{demoUser.name}</div>
                    <div className="text-xs text-gray-500 capitalize">{demoUser.role}</div>
                  </div>
                  {user?.username === demoUser.username && (
                    <div className="text-xs text-blue-600 font-medium">Current</div>
                  )}
                </button>
              ))}
            </div>

            <div className="border-t border-gray-100 p-2">
              <button
                onClick={handleLogout}
                disabled={isLoading}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left hover:bg-red-50 text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default UserSwitcher;
