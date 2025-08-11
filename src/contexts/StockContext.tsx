import React, { createContext, useContext, useState, ReactNode } from 'react';

interface StockRequest {
  id: string;
  item: string;
  quantity: number;
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  createdAt: string;
}

interface StockAlert {
  id: string;
  item: string;
  currentStock: number;
  minimumStock: number;
  severity: 'low' | 'critical';
}

interface StockProjection {
  item: string;
  currentStock: number;
  projectedStock: number;
  projectionDate: string;
}

interface StockOverview {
  totalItems: number;
  lowStockItems: number;
  totalValue: number;
  criticalAlerts: number;
}

interface StockContextType {
  stockRequests: StockRequest[];
  stockAlerts: StockAlert[];
  stockProjections: StockProjection[];
  stockOverviews: StockOverview;
  getRequestsBySalesman: (salesmanId: string) => StockRequest[];
  addStockRequest: (request: Omit<StockRequest, 'id' | 'createdAt'>) => void;
  updateStockRequest: (id: string, updates: Partial<StockRequest>) => void;
}

const StockContext = createContext<StockContextType | undefined>(undefined);

interface StockProviderProps {
  children: ReactNode;
}

export const StockProvider: React.FC<StockProviderProps> = ({ children }) => {
  const [stockRequests] = useState<StockRequest[]>([]);
  const [stockAlerts] = useState<StockAlert[]>([]);
  const [stockProjections] = useState<StockProjection[]>([]);
  const [stockOverviews] = useState<StockOverview>({
    totalItems: 0,
    lowStockItems: 0,
    totalValue: 0,
    criticalAlerts: 0
  });

  const getRequestsBySalesman = (salesmanId: string): StockRequest[] => {
    return stockRequests.filter(request => request.requestedBy === salesmanId);
  };

  const addStockRequest = (request: Omit<StockRequest, 'id' | 'createdAt'>) => {
    // Implementation would go here
    console.log('Adding stock request:', request);
  };

  const updateStockRequest = (id: string, updates: Partial<StockRequest>) => {
    // Implementation would go here
    console.log('Updating stock request:', id, updates);
  };

  const value: StockContextType = {
    stockRequests,
    stockAlerts,
    stockProjections,
    stockOverviews,
    getRequestsBySalesman,
    addStockRequest,
    updateStockRequest
  };

  return (
    <StockContext.Provider value={value}>
      {children}
    </StockContext.Provider>
  );
};

export const useStock = (): StockContextType => {
  const context = useContext(StockContext);
  if (context === undefined) {
    throw new Error('useStock must be used within a StockProvider');
  }
  return context;
};

export default StockContext;
