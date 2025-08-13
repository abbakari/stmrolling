// Mock data structures matching the API types
export interface SalesBudget {
  id: number;
  customer: number;
  item: number;
  year: number;
  month: number;
  budget_amount: number;
  actual_amount: number;
  created_at: string;
  updated_at: string;
}

export interface RollingForecast {
  id: number;
  customer: number;
  item: number;
  year: number;
  month: number;
  forecasted_amount: number;
  budget_amount: number;
  forecast_type: string;
  confidence_level: number;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  region: string;
  sales_representative: string;
  created_at: string;
}

export interface Item {
  id: number;
  name: string;
  code: string;
  category: string;
  brand: string;
  unit_price: number;
  description: string;
  created_at: string;
}

// Mock data generators
const generateCustomers = (): Customer[] => [
  {
    id: 1,
    name: "Acme Corp",
    email: "contact@acme.com",
    phone: "+1-555-0101",
    address: "123 Business St, City, State",
    region: "North",
    sales_representative: "John Doe",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "Global Industries",
    email: "info@global.com",
    phone: "+1-555-0102",
    address: "456 Commerce Ave, City, State",
    region: "South",
    sales_representative: "Jane Smith",
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    name: "TechStart Solutions",
    email: "hello@techstart.com",
    phone: "+1-555-0103",
    address: "789 Innovation Blvd, City, State",
    region: "East",
    sales_representative: "Mike Johnson",
    created_at: new Date().toISOString()
  }
];

const generateItems = (): Item[] => [
  {
    id: 1,
    name: "Professional Software License",
    code: "PSL-001",
    category: "Software",
    brand: "TechBrand",
    unit_price: 299.99,
    description: "Annual software license for professional use",
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    name: "Enterprise Hardware Kit",
    code: "EHK-002",
    category: "Hardware",
    brand: "HardwarePlus",
    unit_price: 1599.99,
    description: "Complete hardware solution for enterprise clients",
    created_at: new Date().toISOString()
  },
  {
    id: 3,
    name: "Consulting Services Package",
    code: "CSP-003",
    category: "Services",
    brand: "ConsultPro",
    unit_price: 2500.00,
    description: "Comprehensive consulting services for business optimization",
    created_at: new Date().toISOString()
  },
  {
    id: 4,
    name: "Cloud Storage Solution",
    code: "CSS-004",
    category: "Cloud",
    brand: "CloudTech",
    unit_price: 99.99,
    description: "Scalable cloud storage solution with advanced security",
    created_at: new Date().toISOString()
  }
];

const generateBudgetData = (): SalesBudget[] => {
  const customers = generateCustomers();
  const items = generateItems();
  const currentYear = new Date().getFullYear();
  const budgets: SalesBudget[] = [];
  
  customers.forEach(customer => {
    items.forEach(item => {
      for (let month = 1; month <= 12; month++) {
        budgets.push({
          id: budgets.length + 1,
          customer: customer.id,
          item: item.id,
          year: currentYear,
          month,
          budget_amount: Math.floor(Math.random() * 10000) + 1000,
          actual_amount: Math.floor(Math.random() * 8000) + 800,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });
  });
  
  return budgets;
};

const generateForecastData = (): RollingForecast[] => {
  const customers = generateCustomers();
  const items = generateItems();
  const currentYear = new Date().getFullYear();
  const forecasts: RollingForecast[] = [];
  
  customers.forEach(customer => {
    items.forEach(item => {
      for (let month = 1; month <= 12; month++) {
        forecasts.push({
          id: forecasts.length + 1,
          customer: customer.id,
          item: item.id,
          year: currentYear,
          month,
          forecasted_amount: Math.floor(Math.random() * 12000) + 1200,
          budget_amount: Math.floor(Math.random() * 10000) + 1000,
          forecast_type: ['optimistic', 'realistic', 'pessimistic'][Math.floor(Math.random() * 3)],
          confidence_level: Math.floor(Math.random() * 30) + 70,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
      }
    });
  });
  
  return forecasts;
};

// Simulate async operations
const simulateDelay = (ms: number = 300) => 
  new Promise(resolve => setTimeout(resolve, ms));

export const MockBudgetService = {
  async getSalesBudget(params: any = {}): Promise<SalesBudget[]> {
    await simulateDelay();
    return generateBudgetData();
  },

  async createSalesBudget(data: Partial<SalesBudget>): Promise<SalesBudget> {
    await simulateDelay();
    return {
      id: Date.now(),
      customer: data.customer || 1,
      item: data.item || 1,
      year: data.year || new Date().getFullYear(),
      month: data.month || 1,
      budget_amount: data.budget_amount || 0,
      actual_amount: data.actual_amount || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  async updateSalesBudget(id: number, data: Partial<SalesBudget>): Promise<SalesBudget> {
    await simulateDelay();
    return {
      id,
      customer: data.customer || 1,
      item: data.item || 1,
      year: data.year || new Date().getFullYear(),
      month: data.month || 1,
      budget_amount: data.budget_amount || 0,
      actual_amount: data.actual_amount || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  async deleteSalesBudget(id: number): Promise<void> {
    await simulateDelay();
  },

  async getBudgetSummary(): Promise<any> {
    await simulateDelay();
    return {
      total_budget: 1250000,
      total_actual: 980000,
      variance: 270000,
      variance_percentage: 21.6,
      entries_count: 144
    };
  }
};

export const MockRollingForecastService = {
  async getRollingForecasts(params: any = {}): Promise<RollingForecast[]> {
    await simulateDelay();
    return generateForecastData();
  },

  async createRollingForecast(data: Partial<RollingForecast>): Promise<RollingForecast> {
    await simulateDelay();
    return {
      id: Date.now(),
      customer: data.customer || 1,
      item: data.item || 1,
      year: data.year || new Date().getFullYear(),
      month: data.month || 1,
      forecasted_amount: data.forecasted_amount || 0,
      budget_amount: data.budget_amount || 0,
      forecast_type: data.forecast_type || 'realistic',
      confidence_level: data.confidence_level || 80,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  async updateRollingForecast(id: number, data: Partial<RollingForecast>): Promise<RollingForecast> {
    await simulateDelay();
    return {
      id,
      customer: data.customer || 1,
      item: data.item || 1,
      year: data.year || new Date().getFullYear(),
      month: data.month || 1,
      forecasted_amount: data.forecasted_amount || 0,
      budget_amount: data.budget_amount || 0,
      forecast_type: data.forecast_type || 'realistic',
      confidence_level: data.confidence_level || 80,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  },

  async deleteForecast(id: number): Promise<void> {
    await simulateDelay();
  },

  async getForecastSummary(): Promise<any> {
    await simulateDelay();
    return {
      total_forecast: 1450000,
      total_budget: 1250000,
      variance: 200000,
      variance_percentage: 16.0,
      average_confidence: 82.5,
      entries_count: 144
    };
  }
};

export const MockCustomerService = {
  async getCustomers(): Promise<Customer[]> {
    await simulateDelay();
    return generateCustomers();
  },

  async createCustomer(data: Partial<Customer>): Promise<Customer> {
    await simulateDelay();
    return {
      id: Date.now(),
      name: data.name || '',
      email: data.email || '',
      phone: data.phone || '',
      address: data.address || '',
      region: data.region || '',
      sales_representative: data.sales_representative || '',
      created_at: new Date().toISOString()
    };
  }
};

export const MockItemService = {
  async getItems(): Promise<Item[]> {
    await simulateDelay();
    return generateItems();
  },

  async getItemSummary(): Promise<any> {
    await simulateDelay();
    return {
      total_items: 4,
      categories: 4,
      avg_price: 1124.98,
      most_expensive: 2500.00,
      least_expensive: 99.99
    };
  },

  async getCategorySummary(): Promise<any> {
    await simulateDelay();
    return {
      categories: [
        { name: 'Software', count: 1, total_value: 299.99 },
        { name: 'Hardware', count: 1, total_value: 1599.99 },
        { name: 'Services', count: 1, total_value: 2500.00 },
        { name: 'Cloud', count: 1, total_value: 99.99 }
      ]
    };
  },

  async createItem(data: Partial<Item>): Promise<Item> {
    await simulateDelay();
    return {
      id: Date.now(),
      name: data.name || '',
      code: data.code || '',
      category: data.category || '',
      brand: data.brand || '',
      unit_price: data.unit_price || 0,
      description: data.description || '',
      created_at: new Date().toISOString()
    };
  }
};
