// Shared data persistence utility for sales budget and forecast data
// This ensures data saved by salesman is visible to managers

export interface SavedForecastData {
  id: string;
  customer: string;
  item: string;
  category: string;
  brand: string;
  type: 'sales_budget' | 'rolling_forecast';
  createdBy: string;
  createdAt: string;
  lastModified: string;
  budgetData?: {
    bud25: number;
    ytd25: number;
    budget2026: number;
    rate: number;
    stock: number;
    git: number;
    eta?: string;
    budgetValue2026: number;
    discount: number;
    monthlyData: Array<{
      month: string;
      budgetValue: number;
      actualValue: number;
      rate: number;
      stock: number;
      git: number;
      discount: number;
    }>;
  };
  forecastData?: {
    [month: string]: number; // Monthly forecast units
  };
  forecastTotal: number;
  status: 'draft' | 'saved' | 'submitted' | 'approved';
}

export interface SavedBudgetData {
  id: string;
  customer: string;
  item: string;
  category: string;
  brand: string;
  type: 'sales_budget';
  createdBy: string;
  createdAt: string;
  lastModified: string;
  budget2025: number;
  actual2025: number;
  budget2026: number;
  rate: number;
  stock: number;
  git: number;
  budgetValue2026: number;
  discount: number;
  monthlyData: Array<{
    month: string;
    budgetValue: number;
    actualValue: number;
    rate: number;
    stock: number;
    git: number;
    discount: number;
  }>;
  status: 'draft' | 'saved' | 'submitted' | 'approved';
}

const SALES_BUDGET_STORAGE_KEY = 'sales_budget_saved_data';
const ROLLING_FORECAST_STORAGE_KEY = 'rolling_forecast_saved_data';

export class DataPersistenceManager {
  // Save sales budget data
  static saveSalesBudgetData(data: SavedBudgetData[]): void {
    try {
      const existingData = this.getSalesBudgetData();
      const mergedData = [...existingData];

      data.forEach(newItem => {
        const existingIndex = mergedData.findIndex(item => 
          item.id === newItem.id || 
          (item.customer === newItem.customer && item.item === newItem.item)
        );
        
        if (existingIndex >= 0) {
          // Update existing item
          mergedData[existingIndex] = {
            ...newItem,
            lastModified: new Date().toISOString()
          };
        } else {
          // Add new item
          mergedData.push({
            ...newItem,
            lastModified: new Date().toISOString()
          });
        }
      });

      localStorage.setItem(SALES_BUDGET_STORAGE_KEY, JSON.stringify(mergedData));
      console.log('Sales budget data saved successfully:', mergedData.length, 'items');
    } catch (error) {
      console.error('Error saving sales budget data:', error);
    }
  }

  // Get sales budget data
  static getSalesBudgetData(): SavedBudgetData[] {
    try {
      const data = localStorage.getItem(SALES_BUDGET_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading sales budget data:', error);
      return [];
    }
  }

  // Save rolling forecast data
  static saveRollingForecastData(data: SavedForecastData[]): void {
    try {
      const existingData = this.getRollingForecastData();
      const mergedData = [...existingData];

      data.forEach(newItem => {
        const existingIndex = mergedData.findIndex(item => 
          item.id === newItem.id || 
          (item.customer === newItem.customer && item.item === newItem.item)
        );
        
        if (existingIndex >= 0) {
          // Update existing item
          mergedData[existingIndex] = {
            ...newItem,
            lastModified: new Date().toISOString()
          };
        } else {
          // Add new item
          mergedData.push({
            ...newItem,
            lastModified: new Date().toISOString()
          });
        }
      });

      localStorage.setItem(ROLLING_FORECAST_STORAGE_KEY, JSON.stringify(mergedData));
      console.log('Rolling forecast data saved successfully:', mergedData.length, 'items');
    } catch (error) {
      console.error('Error saving rolling forecast data:', error);
    }
  }

  // Get rolling forecast data
  static getRollingForecastData(): SavedForecastData[] {
    try {
      const data = localStorage.getItem(ROLLING_FORECAST_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading rolling forecast data:', error);
      return [];
    }
  }

  // Get data by user (for managers to see salesman data)
  static getSalesBudgetDataByUser(userName?: string): SavedBudgetData[] {
    const allData = this.getSalesBudgetData();
    if (!userName) return allData;
    return allData.filter(item => item.createdBy === userName);
  }

  static getRollingForecastDataByUser(userName?: string): SavedForecastData[] {
    const allData = this.getRollingForecastData();
    if (!userName) return allData;
    return allData.filter(item => item.createdBy === userName);
  }

  // Get data by customer (for managers to see customer breakdown)
  static getSalesBudgetDataByCustomer(customerName: string): SavedBudgetData[] {
    const allData = this.getSalesBudgetData();
    return allData.filter(item => item.customer.toLowerCase().includes(customerName.toLowerCase()));
  }

  static getRollingForecastDataByCustomer(customerName: string): SavedForecastData[] {
    const allData = this.getRollingForecastData();
    return allData.filter(item => item.customer.toLowerCase().includes(customerName.toLowerCase()));
  }

  // Update status of saved data
  static updateSalesBudgetStatus(itemId: string, status: 'draft' | 'saved' | 'submitted' | 'approved'): void {
    const allData = this.getSalesBudgetData();
    const updatedData = allData.map(item => 
      item.id === itemId 
        ? { ...item, status, lastModified: new Date().toISOString() }
        : item
    );
    localStorage.setItem(SALES_BUDGET_STORAGE_KEY, JSON.stringify(updatedData));
  }

  static updateRollingForecastStatus(itemId: string, status: 'draft' | 'saved' | 'submitted' | 'approved'): void {
    const allData = this.getRollingForecastData();
    const updatedData = allData.map(item => 
      item.id === itemId 
        ? { ...item, status, lastModified: new Date().toISOString() }
        : item
    );
    localStorage.setItem(ROLLING_FORECAST_STORAGE_KEY, JSON.stringify(updatedData));
  }

  // Clear all data (admin function)
  static clearAllData(): void {
    localStorage.removeItem(SALES_BUDGET_STORAGE_KEY);
    localStorage.removeItem(ROLLING_FORECAST_STORAGE_KEY);
    console.log('All sales budget and forecast data cleared');
  }

  // Get summary statistics for managers
  static getSummaryStats() {
    const budgetData = this.getSalesBudgetData();
    const forecastData = this.getRollingForecastData();

    const totalBudgetItems = budgetData.length;
    const totalForecastItems = forecastData.length;
    const totalBudgetValue = budgetData.reduce((sum, item) => sum + item.budgetValue2026, 0);
    const totalForecastValue = forecastData.reduce((sum, item) => sum + item.forecastTotal * 100, 0);

    const uniqueCustomers = new Set([
      ...budgetData.map(item => item.customer),
      ...forecastData.map(item => item.customer)
    ]);

    const uniqueSalesmen = new Set([
      ...budgetData.map(item => item.createdBy),
      ...forecastData.map(item => item.createdBy)
    ]);

    return {
      totalBudgetItems,
      totalForecastItems,
      totalBudgetValue,
      totalForecastValue,
      uniqueCustomers: uniqueCustomers.size,
      uniqueSalesmen: uniqueSalesmen.size,
      lastUpdated: new Date().toISOString()
    };
  }

  // Sync data between budget and forecast (for consistency)
  static syncBudgetToForecast(): void {
    const budgetData = this.getSalesBudgetData();
    const forecastData = this.getRollingForecastData();

    // Update forecast data with latest budget information
    const updatedForecastData = forecastData.map(forecastItem => {
      const matchingBudget = budgetData.find(budgetItem =>
        budgetItem.customer === forecastItem.customer &&
        budgetItem.item === forecastItem.item
      );

      if (matchingBudget && matchingBudget.lastModified > forecastItem.lastModified) {
        return {
          ...forecastItem,
          budgetData: {
            bud25: matchingBudget.budget2025,
            ytd25: matchingBudget.actual2025,
            budget2026: matchingBudget.budget2026,
            rate: matchingBudget.rate,
            stock: matchingBudget.stock,
            git: matchingBudget.git,
            budgetValue2026: matchingBudget.budgetValue2026,
            discount: matchingBudget.discount,
            monthlyData: matchingBudget.monthlyData
          },
          lastModified: new Date().toISOString()
        };
      }

      return forecastItem;
    });

    this.saveRollingForecastData(updatedForecastData);
  }

  // Get GIT data uploaded by admin
  static getGitData() {
    try {
      const data = localStorage.getItem('git_eta_data');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading GIT data:', error);
      return [];
    }
  }

  // Get GIT data for a specific customer and item
  static getGitDataForItem(customer: string, item: string) {
    const gitData = this.getGitData();
    return gitData.filter((gitItem: any) =>
      gitItem.customer.toLowerCase().includes(customer.toLowerCase()) &&
      gitItem.item.toLowerCase().includes(item.toLowerCase())
    );
  }

  // Get aggregated GIT quantity and ETA for customer/item combination
  static getGitSummaryForItem(customer: string, item: string) {
    const gitItems = this.getGitDataForItem(customer, item);

    if (gitItems.length === 0) {
      return { gitQuantity: 0, eta: '', status: 'none' };
    }

    const totalGitQuantity = gitItems.reduce((sum: number, gitItem: any) => sum + gitItem.gitQuantity, 0);

    // Get the earliest ETA that's not yet arrived
    const futureEtas = gitItems
      .filter((item: any) => item.status !== 'arrived' && new Date(item.eta) >= new Date())
      .sort((a: any, b: any) => new Date(a.eta).getTime() - new Date(b.eta).getTime());

    const earliestEta = futureEtas.length > 0 ? futureEtas[0].eta : '';
    const overallStatus = this.determineOverallGitStatus(gitItems);

    return {
      gitQuantity: totalGitQuantity,
      eta: earliestEta,
      status: overallStatus,
      itemCount: gitItems.length
    };
  }

  // Determine overall status from multiple GIT items
  private static determineOverallGitStatus(gitItems: any[]) {
    if (gitItems.length === 0) return 'none';

    const statuses = gitItems.map(item => item.status);

    if (statuses.includes('delayed')) return 'delayed';
    if (statuses.includes('in_transit')) return 'in_transit';
    if (statuses.includes('shipped')) return 'shipped';
    if (statuses.includes('ordered')) return 'ordered';
    if (statuses.every(status => status === 'arrived')) return 'arrived';

    return 'mixed';
  }
}

export default DataPersistenceManager;
