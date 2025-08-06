import React, { useState } from 'react';
import Layout from '../components/Layout';
import { ChevronRight, Eye, CheckCircle, Plus, ChevronUp, ChevronDown, Minus, X, List, UserPlus, Target } from 'lucide-react';
import { Customer } from '../types/forecast';
import { useBudget } from '../contexts/BudgetContext';

const RollingForecast: React.FC = () => {
  const { yearlyBudgets, getBudgetsByCustomer } = useBudget();
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectAll, setSelectAll] = useState(false);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [monthlyForecastData, setMonthlyForecastData] = useState<{[key: string]: {[month: string]: number}}>({});
  const [isNewAdditionModalOpen, setIsNewAdditionModalOpen] = useState(false);
  const [selectedCustomerOption, setSelectedCustomerOption] = useState<'existing' | 'new'>('existing');
  const [selectedItemOption, setSelectedItemOption] = useState<'existing'>('existing');
  const [newCustomerData, setNewCustomerData] = useState({
    name: '',
    code: '',
    email: '',
    phone: '',
    region: '',
    segment: ''
  });
  const [selectedExistingCustomer, setSelectedExistingCustomer] = useState('');
  const [selectedExistingItem, setSelectedExistingItem] = useState('');
  const [showBudgetData, setShowBudgetData] = useState(true);

  // Sample data
  const [customers, setCustomers] = useState<Customer[]>([
    {
      id: '1',
      name: 'Action Aid International (Tz)',
      code: 'AAI001',
      email: 'orders@actionaid.tz',
      phone: '+255-22-123-4567',
      region: 'Africa',
      segment: 'NGO',
      creditLimit: 500000,
      currency: 'USD',
      active: true,
      createdAt: '2024-01-15',
      lastActivity: '2024-12-01',
      channels: ['Direct Sales'],
      seasonality: 'medium',
      tier: 'platinum',
      manager: 'John Smith'
    },
    {
      id: '2',
      name: 'ADVENT CONSTRUCTION LTD.',
      code: 'ADV002',
      email: 'orders@advent.com',
      phone: '+1-555-0101',
      region: 'North America',
      segment: 'Enterprise',
      creditLimit: 750000,
      currency: 'USD',
      active: true,
      createdAt: '2024-02-20',
      lastActivity: '2024-11-28',
      channels: ['Direct Sales'],
      seasonality: 'low',
      tier: 'platinum',
      manager: 'Sarah Johnson'
    }
  ]);

  const [items] = useState([
    {
      id: '1',
      name: 'BF GOODRICH TYRE 235/85R16 120/116S TL ATT/A KO2 LRERWLGO',
      category: 'TYRE SERVICE',
      brand: 'BF GOODRICH'
    },
    {
      id: '2',
      name: 'BF GOODRICH TYRE 265/65R17 120/117S TL ATT/A KO2 LRERWLGO',
      category: 'TYRE SERVICE',
      brand: 'BF GOODRICH'
    },
    {
      id: '3',
      name: 'MICHELIN TYRE 265/65R17 112T TL LTX TRAIL',
      category: 'TYRE SERVICE',
      brand: 'MICHELIN'
    },
    {
      id: '4',
      name: 'WHEEL BALANCE ALLOYD RIMS',
      category: 'TYRE SERVICE',
      brand: 'TYRE SERVICE'
    }
  ]);

  const [tableData, setTableData] = useState([
    {
      id: '1',
      customer: 'Action Aid International (Tz)',
      item: 'BF GOODRICH TYRE 235/85R16 120/116S TL ATT/A KO2 LRERWLGO',
      bud25: 120,
      ytd25: 45,
      forecast: 0,
      stock: 86,
      git: 0,
      eta: '',
      budgetDistribution: { JAN: 10, FEB: 8, MAR: 12, APR: 15, MAY: 10, JUN: 8, JUL: 12, AUG: 15, SEP: 10, OCT: 8, NOV: 6, DEC: 6 }
    },
    {
      id: '2',
      customer: 'Action Aid International (Tz)',
      item: 'BF GOODRICH TYRE 265/65R17 120/117S TL ATT/A KO2 LRERWLGO',
      bud25: 80,
      ytd25: 25,
      forecast: 0,
      stock: 7,
      git: 0,
      eta: '',
      budgetDistribution: { JAN: 8, FEB: 6, MAR: 10, APR: 12, MAY: 8, JUN: 6, JUL: 10, AUG: 12, SEP: 8, OCT: 0, NOV: 0, DEC: 0 }
    },
    {
      id: '3',
      customer: 'Action Aid International (Tz)',
      item: 'MICHELIN TYRE 265/65R17 112T TL LTX TRAIL',
      bud25: 150,
      ytd25: 60,
      forecast: 0,
      stock: 22,
      git: 100,
      eta: '2025-08-24',
      budgetDistribution: { JAN: 15, FEB: 12, MAR: 18, APR: 20, MAY: 15, JUN: 12, JUL: 18, AUG: 20, SEP: 15, OCT: 5, NOV: 0, DEC: 0 }
    },
    {
      id: '4',
      customer: 'ADVENT CONSTRUCTION LTD.',
      item: 'WHEEL BALANCE ALLOYD RIMS',
      bud25: 200,
      ytd25: 85,
      forecast: 0,
      stock: 0,
      git: 0,
      eta: '',
      budgetDistribution: { JAN: 20, FEB: 15, MAR: 25, APR: 30, MAY: 20, JUN: 15, JUL: 25, AUG: 30, SEP: 20, OCT: 0, NOV: 0, DEC: 0 }
    },
    {
      id: '5',
      customer: 'ADVENT CONSTRUCTION LTD.',
      item: 'BF GOODRICH TYRE 235/85R16 120/116S TL ATT/A KO2 LRERWLGO',
      bud25: 90,
      ytd25: 30,
      forecast: 0,
      stock: 15,
      git: 50,
      eta: '2025-09-15',
      budgetDistribution: { JAN: 10, FEB: 8, MAR: 12, APR: 15, MAY: 10, JUN: 8, JUL: 12, AUG: 15, SEP: 0, OCT: 0, NOV: 0, DEC: 0 }
    }
  ]);

  const categories = ['TYRE SERVICE'];
  const brands = ['TYRE SERVICE'];

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-gray-600" />
      : <ChevronDown className="w-4 h-4 text-gray-600" />;
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(filteredData.map(item => item.id)));
    }
    setSelectAll(!selectAll);
  };

  const handleRowSelect = (id: string) => {
    const newSelected = new Set(selectedRows);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedRows(newSelected);
    setSelectAll(newSelected.size === filteredData.length);
  };



  const handleSubmit = () => {
    // Handle submit action
    console.log('Submit clicked');
  };

  const handleSaveNewAddition = () => {
    // Handle save logic for new customer/item
    if (selectedCustomerOption === 'new' && newCustomerData.name && newCustomerData.code) {
      // Add new customer to customers list
      const newCustomer: Customer = {
        id: (customers.length + 1).toString(),
        name: newCustomerData.name,
        code: newCustomerData.code,
        email: newCustomerData.email,
        phone: newCustomerData.phone,
        region: newCustomerData.region,
        segment: newCustomerData.segment,
        creditLimit: 100000,
        currency: 'USD',
        active: true,
        createdAt: new Date().toISOString().split('T')[0],
        lastActivity: new Date().toISOString().split('T')[0],
        channels: ['Direct Sales'],
        seasonality: 'medium',
        tier: 'bronze',
        manager: 'System'
      };
      
      setCustomers(prev => [...prev, newCustomer]);
      
      // Add new row to table data
      const newTableRow = {
        id: (tableData.length + 1).toString(),
        customer: newCustomerData.name,
        item: selectedExistingItem || 'Default Item',
        bud25: 0,
        ytd25: 0,
        forecast: 0,
        stock: 0,
        git: 0,
        eta: ''
      };
      
      setTableData(prev => [...prev, newTableRow]);
      
      console.log('New customer added:', newCustomer);
      console.log('New table row added:', newTableRow);
    } else if (selectedCustomerOption === 'existing' && selectedExistingCustomer && selectedExistingItem) {
      // Add existing customer with selected item
      const newTableRow = {
        id: (tableData.length + 1).toString(),
        customer: selectedExistingCustomer,
        item: selectedExistingItem,
        bud25: 0,
        ytd25: 0,
        forecast: 0,
        stock: 0,
        git: 0,
        eta: ''
      };
      
      setTableData(prev => [...prev, newTableRow]);
      
      console.log('New table row added with existing customer:', newTableRow);
    }
    
    // Reset form
    setSelectedCustomerOption('existing');
    setSelectedItemOption('existing');
    setNewCustomerData({
      name: '',
      code: '',
      email: '',
      phone: '',
      region: '',
      segment: ''
    });
    setSelectedExistingCustomer('');
    setSelectedExistingItem('');
    
    // Close modal
    setIsNewAdditionModalOpen(false);
  };

  const handleExpandRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const handleMonthlyForecastChange = (rowId: string, month: string, value: number) => {
    setMonthlyForecastData(prev => ({
      ...prev,
      [rowId]: {
        ...prev[rowId],
        [month]: value
      }
    }));

    // Update the main table forecast value for this row
    setTableData(prevData =>
      prevData.map(row => {
        if (row.id === rowId) {
          const updatedMonthlyData = {
            ...monthlyForecastData[rowId],
            [month]: value
          };
          const newForecastTotal = Object.values(updatedMonthlyData).reduce((sum, val) => sum + (val || 0), 0);
          return { ...row, forecast: newForecastTotal };
        }
        return row;
      })
    );
  };

  const getMonthlyData = (rowId: string) => {
    if (!monthlyForecastData[rowId]) {
      monthlyForecastData[rowId] = {};
    }
    return monthlyForecastData[rowId];
  };

  // Calculate dynamic summary statistics based on forecasts
  const calculateSummaryStats = () => {
    let totalBudget2025 = 0;
    let totalSales2025 = 0;
    let totalForecast2025 = 0;
    let totalUnitsBudget = 0;
    let totalUnitsSales = 0;
    let totalUnitsForecast = 0;

    // Calculate from table data
    tableData.forEach(row => {
      // Budget 2025 (existing budget units)
      totalBudget2025 += row.bud25 * 100; // Convert units to currency
      totalUnitsBudget += row.bud25;

      // Sales 2025 (YTD actuals units)
      totalSales2025 += row.ytd25 * 100; // Convert units to currency
      totalUnitsSales += row.ytd25;

      // Forecast 2025 (user input forecasts units)
      const monthlyData = getMonthlyData(row.id);
      const forecastTotalUnits = Object.values(monthlyData).reduce((sum, value) => sum + (value || 0), 0);
      totalForecast2025 += forecastTotalUnits * 100; // Convert units to currency
      totalUnitsForecast += forecastTotalUnits;
    });

    return {
      budget: totalBudget2025,
      sales: totalSales2025,
      forecast: totalForecast2025,
      unitsBudget: totalUnitsBudget,
      unitsSales: totalUnitsSales,
      unitsForecast: totalUnitsForecast
    };
  };

  // Calculate inventory insights
  const calculateInventoryInsights = () => {
    const totalStock = tableData.reduce((sum, row) => sum + row.stock, 0);
    const totalGit = tableData.reduce((sum, row) => sum + row.git, 0);
    const totalDemand = calculateSummaryStats().forecast;
    
    const stockTurnover = totalDemand > 0 ? (totalStock / totalDemand) * 12 : 0;
    const safetyStock = totalDemand * 0.2; // 20% safety stock
    const reorderPoint = totalDemand / 12 + safetyStock;
    
    return {
      totalStock,
      totalGit,
      stockTurnover,
      safetyStock,
      reorderPoint,
      stockHealth: totalStock > reorderPoint ? 'Good' : 'Low'
    };
  };

  const summaryStats = calculateSummaryStats();
  const inventoryInsights = calculateInventoryInsights();

  const filteredData = tableData.filter((item: any) => {
    return (!selectedCustomer || item.customer.includes(selectedCustomer)) &&
           (!selectedCategory || categories.includes(selectedCategory)) &&
           (!selectedBrand || brands.includes(selectedBrand)) &&
           (!selectedItem || item.item.includes(selectedItem));
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortField) return 0;
    
    const aValue = a[sortField as keyof typeof a];
    const bValue = b[sortField as keyof typeof b];
    
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }
    
    if (typeof aValue === 'number' && typeof bValue === 'number') {
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
    
    return 0;
  });

  return (
    <Layout>
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-gray-600">
          <span className="cursor-pointer hover:text-blue-600">Dashboards</span>
          <ChevronRight className="w-4 h-4 mx-2" />
          <span className="text-blue-600 font-medium">Rolling Forecast</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Rolling Forecast for 2025-2026</h1>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span className="text-sm text-gray-700">Item-wise</span>
            </label>
            <button className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">
              Customer-Item
            </button>
          </div>
        </div>

        {/* Top Bar Metrics */}
        <div className="flex items-center justify-between bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">Stock</div>
              <div className="text-xl font-bold text-green-600">{inventoryInsights.totalStock.toLocaleString()} units</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-sm text-gray-600">GIT</div>
              <div className="text-xl font-bold text-red-600">{inventoryInsights.totalGit.toLocaleString()} units</div>
            </div>
          </div>

          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2">
            <Eye className="w-4 h-4" />
            View Rolling Forecast Report
          </button>
        </div>

        {/* Budget Data from Sales Budget */}
        {yearlyBudgets.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Sales Budget Data</h2>
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  {yearlyBudgets.length} budget{yearlyBudgets.length !== 1 ? 's' : ''} available
                </span>
              </div>
              <button
                onClick={() => setShowBudgetData(!showBudgetData)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {showBudgetData ? 'Hide' : 'Show'} Budget Data
              </button>
            </div>

            {showBudgetData && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {yearlyBudgets.map((budget) => (
                    <div key={budget.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="font-medium text-gray-900 truncate">{budget.item}</h3>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {budget.year}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Customer:</span>
                          <span className="font-medium truncate ml-2">{budget.customer}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Category:</span>
                          <span className="font-medium">{budget.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Brand:</span>
                          <span className="font-medium">{budget.brand}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total Budget:</span>
                          <span className="font-bold text-green-600">
                            ${(budget.totalBudget / 1000).toFixed(0)}k
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Created by:</span>
                          <span className="text-xs text-gray-500">{budget.createdBy}</span>
                        </div>
                      </div>

                      {/* Monthly breakdown preview */}
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="text-xs text-gray-600 mb-2">Monthly Budget Summary:</div>
                        <div className="grid grid-cols-3 gap-1 text-xs">
                          {budget.monthlyData.slice(0, 3).map((month, idx) => (
                            <div key={idx} className="text-center">
                              <div className="font-medium">{month.month}</div>
                              <div className="text-gray-600">${(month.budgetValue * month.rate / 1000).toFixed(0)}k</div>
                            </div>
                          ))}
                        </div>
                        {budget.monthlyData.length > 3 && (
                          <div className="text-xs text-gray-500 text-center mt-1">
                            +{budget.monthlyData.length - 3} more months
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">Budget Integration</span>
                  </div>
                  <p className="text-sm text-blue-800">
                    These budgets were created by salesman users in the Sales Budget dashboard and are automatically
                    integrated into your rolling forecast calculations. Use this data to align your forecasts with planned sales targets.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Filters and Notes */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-start gap-6">
            {/* Filters */}
            <div className="grid grid-cols-2 gap-4 flex-1">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CUSTOMER:</label>
                <select
                  value={selectedCustomer}
                  onChange={(e) => setSelectedCustomer(e.target.value)}
                  className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-yellow-50"
                >
                  <option value="">Select value</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.name}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">CATEGORY:</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-yellow-50"
                >
                  <option value="">Select value</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">BRAND:</label>
                <select
                  value={selectedBrand}
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-yellow-50"
                >
                  <option value="">Select value</option>
                  {brands.map(brand => (
                    <option key={brand} value={brand}>
                      {brand}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ITEM:</label>
                <select
                  value={selectedItem}
                  onChange={(e) => setSelectedItem(e.target.value)}
                  className="w-full px-3 py-2 border border-yellow-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-yellow-50"
                >
                  <option value="">Select value</option>
                  {items.map(item => (
                    <option key={item.id} value={item.name}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-4 min-w-[300px]">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-yellow-800 mb-2">Note:</h3>
                <p className="text-sm text-yellow-700">ACT 2025 = ACT + Future Forecast</p>
                <p className="text-sm text-yellow-700">(For future months (above August))</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-600">Sales Without Budget</span>
                  <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">i</span>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => setIsNewAdditionModalOpen(true)}
                className="w-full bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors text-sm flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                New Addition
              </button>
              
              <div className="space-y-2">
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-700">With 2025 Forecast</span>
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" className="rounded" />
                  <span className="text-sm text-gray-700">Without 2025 Forecast</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Budget 2025</div>
              <div className="text-2xl font-bold text-gray-900">${summaryStats.budget.toLocaleString()}</div>
              <div className="text-sm text-gray-500">{summaryStats.unitsBudget.toLocaleString()} Units</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Sales 2025</div>
              <div className="text-2xl font-bold text-gray-900">${summaryStats.sales.toLocaleString()}</div>
              <div className="text-sm text-gray-500">{summaryStats.unitsSales.toLocaleString()} Units</div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-1">Forecast 2025</div>
              <div className="text-2xl font-bold text-gray-900">${summaryStats.forecast.toLocaleString()}</div>
              <div className="text-sm text-gray-500">{summaryStats.unitsForecast.toLocaleString()} Units</div>
            </div>
          </div>
          
          {/* Inventory Management Insights */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Inventory Insights</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock Turnover:</span>
                  <span className="font-medium">{inventoryInsights.stockTurnover.toFixed(1)}x/year</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Safety Stock:</span>
                  <span className="font-medium">{inventoryInsights.safetyStock.toFixed(0)} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reorder Point:</span>
                  <span className="font-medium">{inventoryInsights.reorderPoint.toFixed(0)} units</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock Health:</span>
                  <span className={`font-medium ${inventoryInsights.stockHealth === 'Good' ? 'text-green-600' : 'text-red-600'}`}>
                    {inventoryInsights.stockHealth}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-green-800 mb-2">Growth Opportunities</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Forecast vs Budget:</span>
                  <span className={`font-medium ${summaryStats.forecast > summaryStats.budget ? 'text-green-600' : 'text-red-600'}`}>
                    {summaryStats.budget > 0 ? ((summaryStats.forecast - summaryStats.budget) / summaryStats.budget * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Demand Coverage:</span>
                  <span className="font-medium">
                    {inventoryInsights.totalStock + inventoryInsights.totalGit > 0 ? 
                      ((inventoryInsights.totalStock + inventoryInsights.totalGit) / summaryStats.forecast * 100).toFixed(1) : 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Pipeline Value:</span>
                  <span className="font-medium">${(inventoryInsights.totalGit * 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Growth Potential:</span>
                  <span className="font-medium text-green-600">
                    {summaryStats.forecast > summaryStats.sales ? 'High' : 'Moderate'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden content-container">
          <div className="max-h-[500px] overflow-auto">
            <table className="w-full responsive-table table-responsive">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                <tr>
                  <th className="px-1 sm:px-2 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                    <input 
                      type="checkbox" 
                      className="rounded" 
                      checked={selectAll}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th
                    className="px-1 sm:px-2 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-48"
                    onClick={() => handleSort('customer')}
                  >
                    <div className="flex items-center gap-1">
                      CUSTOMER
                      {getSortIcon('customer')}
                    </div>
                  </th>
                  <th
                    className="px-1 sm:px-2 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-64"
                    onClick={() => handleSort('item')}
                  >
                    <div className="flex items-center gap-1">
                      ITEM
                      {getSortIcon('item')}
                    </div>
                  </th>
                  <th
                    className="px-1 sm:px-2 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20"
                    onClick={() => handleSort('bud25')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      BUD 25'
                      {getSortIcon('bud25')}
                    </div>
                  </th>
                  <th
                    className="px-1 sm:px-2 py-2 sm:py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20 hide-mobile"
                    onClick={() => handleSort('ytd25')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      YTD 25'
                      {getSortIcon('ytd25')}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20"
                    onClick={() => handleSort('forecast')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      FORECAST
                      {getSortIcon('forecast')}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20"
                    onClick={() => handleSort('stock')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      STOCK
                      {getSortIcon('stock')}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-20"
                    onClick={() => handleSort('git')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      GIT
                      {getSortIcon('git')}
                    </div>
                  </th>
                  <th 
                    className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 w-24"
                    onClick={() => handleSort('eta')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      ETA
                      {getSortIcon('eta')}
                    </div>
                  </th>
                  <th className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                    ACTION
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedData.map((row) => (
                  <React.Fragment key={row.id}>
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="px-2 py-3 whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          className="rounded" 
                          checked={selectedRows.has(row.id)}
                          onChange={() => handleRowSelect(row.id)}
                        />
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {row.customer}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-sm text-gray-900">
                        {row.item}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                        {row.bud25}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                        {row.ytd25}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                        {row.forecast}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                        {row.stock}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                        {row.git}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-center text-sm text-gray-900">
                        {row.eta || ''}
                      </td>
                      <td className="px-2 py-3 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleExpandRow(row.id)}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            expandedRows.has(row.id) 
                              ? 'bg-red-500 hover:bg-red-600 text-white' 
                              : 'bg-green-500 hover:bg-green-600 text-white'
                          }`}
                          title={expandedRows.has(row.id) ? "Close Forecast" : "Make Forecast"}
                        >
                          {expandedRows.has(row.id) ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                      </td>
                    </tr>
                    
                    {/* Nested Monthly Forecast Table */}
                    {expandedRows.has(row.id) && (
                      <tr>
                        <td colSpan={10} className="px-0 py-0">
                          <div className="bg-gray-50 border-t border-gray-200">
                            <div className="px-4 py-3">
                              <h4 className="text-sm font-medium text-gray-700 mb-3">Monthly Forecast Breakdown</h4>
                              <div className="overflow-x-auto">
                                <table className="w-full text-xs">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th className="px-2 py-2 text-left font-medium text-gray-600">Period</th>
                                      <th className="px-2 py-2 text-center font-medium text-gray-600">JAN</th>
                                      <th className="px-2 py-2 text-center font-medium text-gray-600">FEB</th>
                                      <th className="px-2 py-2 text-center font-medium text-gray-600">MAR</th>
                                      <th className="px-2 py-2 text-center font-medium text-gray-600">APR</th>
                                      <th className="px-2 py-2 text-center font-medium text-gray-600">MAY</th>
                                      <th className="px-2 py-2 text-center font-medium text-gray-600">JUN</th>
                                      <th className="px-2 py-2 text-center font-medium text-gray-600">JUL</th>
                                      <th className="px-2 py-2 text-center font-medium text-gray-600">AUG</th>
                                      <th className="px-2 py-2 text-center font-medium text-gray-600">SEP</th>
                                      <th className="px-2 py-2 text-center font-medium text-gray-600">OCT</th>
                                      <th className="px-2 py-2 text-center font-medium text-gray-600">NOV</th>
                                      <th className="px-2 py-2 text-center font-medium text-gray-600">DEC</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    <tr className="border-b border-gray-200">
                                      <td className="px-2 py-2 font-medium text-gray-700">2024</td>
                                      {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(month => (
                                        <td key={month} className="px-2 py-2 text-center text-gray-600">0</td>
                                      ))}
                                    </tr>
                                    <tr className="border-b border-gray-200 bg-orange-100">
                                      <td className="px-2 py-2 font-medium text-gray-700">BUD 2025'</td>
                                      {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(month => (
                                        <td key={month} className="px-2 py-2 text-center text-gray-600">0</td>
                                      ))}
                                    </tr>
                                    <tr className="bg-purple-100">
                                      <td className="px-2 py-2 font-medium text-gray-700">ACT 2025'</td>
                                      {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(month => {
                                        const currentDate = new Date();
                                        const currentMonth = currentDate.getMonth(); // 0-11
                                        const monthIndex = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].indexOf(month);
                                        const isEditable = monthIndex > currentMonth;
                                        
                                        return (
                                          <td key={month} className="px-2 py-2 text-center">
                                            {isEditable ? (
                                              <input
                                                type="number"
                                                className="w-12 px-1 py-1 text-center border border-gray-300 rounded text-xs bg-white"
                                                value={getMonthlyData(row.id)[month] || 0}
                                                onChange={(e) => handleMonthlyForecastChange(row.id, month, parseInt(e.target.value) || 0)}
                                                min="0"
                                              />
                                            ) : (
                                              <span className="text-gray-500">0</span>
                                            )}
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {sortedData.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-500 text-sm">No data found matching your filters</div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            onClick={handleSubmit}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-lg transition-colors font-medium"
          >
            Submit
          </button>
        </div>
      </div>

      {/* New Addition Modal */}
      {isNewAdditionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Add Customer/Item</h2>
                <button
                  onClick={() => setIsNewAdditionModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Customer Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Customer</h3>
                
                {/* Customer Selection Options */}
                <div className="space-y-3 mb-4">
                  <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCustomerOption === 'existing' ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="customerOption"
                      value="existing"
                      checked={selectedCustomerOption === 'existing'}
                      onChange={(e) => setSelectedCustomerOption(e.target.value as 'existing' | 'new')}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedCustomerOption === 'existing' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                    }`}>
                      {selectedCustomerOption === 'existing' && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <List className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Select from existing customers list</span>
                    </div>
                  </label>

                  <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCustomerOption === 'new' ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="customerOption"
                      value="new"
                      checked={selectedCustomerOption === 'new'}
                      onChange={(e) => setSelectedCustomerOption(e.target.value as 'existing' | 'new')}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedCustomerOption === 'new' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                    }`}>
                      {selectedCustomerOption === 'new' && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <UserPlus className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Create New Customer</span>
                    </div>
                  </label>
                </div>

                {/* Customer Details */}
                <div className="space-y-4">
                  {selectedCustomerOption === 'existing' ? (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Customer</label>
                      <div className="relative">
                        <select
                          value={selectedExistingCustomer}
                          onChange={(e) => setSelectedExistingCustomer(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                        >
                          <option value="">Search customer</option>
                          {customers.map(customer => (
                            <option key={customer.id} value={customer.name}>
                              {customer.name}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">CUSTOMER NAME</label>
                          <input
                            type="text"
                            placeholder="Enter customer name"
                            value={newCustomerData.name}
                            onChange={(e) => setNewCustomerData({...newCustomerData, name: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">CUSTOMER CODE</label>
                          <input
                            type="text"
                            placeholder="Enter customer code"
                            value={newCustomerData.code}
                            onChange={(e) => setNewCustomerData({...newCustomerData, code: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">EMAIL</label>
                          <input
                            type="email"
                            placeholder="Enter email address"
                            value={newCustomerData.email}
                            onChange={(e) => setNewCustomerData({...newCustomerData, email: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">PHONE</label>
                          <input
                            type="tel"
                            placeholder="Enter phone number"
                            value={newCustomerData.phone}
                            onChange={(e) => setNewCustomerData({...newCustomerData, phone: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">REGION</label>
                          <select
                            value={newCustomerData.region}
                            onChange={(e) => setNewCustomerData({...newCustomerData, region: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select region</option>
                            <option value="Africa">Africa</option>
                            <option value="North America">North America</option>
                            <option value="Europe">Europe</option>
                            <option value="Asia">Asia</option>
                            <option value="Latin America">Latin America</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">SEGMENT</label>
                          <select
                            value={newCustomerData.segment}
                            onChange={(e) => setNewCustomerData({...newCustomerData, segment: e.target.value})}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select segment</option>
                            <option value="Enterprise">Enterprise</option>
                            <option value="SMB">SMB</option>
                            <option value="Government">Government</option>
                            <option value="NGO">NGO</option>
                            <option value="Retail">Retail</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Item Section */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Item</h3>
                
                {/* Item Selection Options */}
                <div className="space-y-3 mb-4">
                  <label className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedItemOption === 'existing' ? 'border-orange-500 bg-orange-50' : 'border-gray-300 hover:bg-gray-50'
                  }`}>
                    <input
                      type="radio"
                      name="itemOption"
                      value="existing"
                      checked={selectedItemOption === 'existing'}
                      onChange={(e) => setSelectedItemOption(e.target.value as 'existing')}
                      className="sr-only"
                    />
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selectedItemOption === 'existing' ? 'border-orange-500 bg-orange-500' : 'border-gray-300'
                    }`}>
                      {selectedItemOption === 'existing' && <div className="w-2.5 h-2.5 bg-white rounded-full"></div>}
                    </div>
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                        <List className="w-5 h-5 text-orange-600" />
                      </div>
                      <span className="text-sm font-medium text-gray-900">Select from existing items list</span>
                    </div>
                  </label>
                </div>

                {/* Item Details */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Item</label>
                  <div className="relative">
                    <select
                      value={selectedExistingItem}
                      onChange={(e) => setSelectedExistingItem(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none"
                    >
                      <option value="">Search item</option>
                      {items.map(item => (
                        <option key={item.id} value={item.name}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex gap-3">
                <button
                  onClick={handleSaveNewAddition}
                  className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors font-medium"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsNewAdditionModalOpen(false)}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default RollingForecast;
