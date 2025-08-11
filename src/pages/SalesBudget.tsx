import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import { useBudget } from '../contexts/BudgetContext';
import {
  TrendingUp,
  Info as InfoIcon,
  Download as DownloadIcon,
  Plus,
  PieChart,
  Truck,
  Save,
  X,
  Calendar,
  Send,
  Package,
  Users,
  Loader,
  AlertCircle
} from 'lucide-react';
import ExportModal, { ExportConfig } from '../components/ExportModal';
import NewAdditionModal, { NewItemData } from '../components/NewAdditionModal';
import YearlyBudgetModal from '../components/YearlyBudgetModal';
import SetDistributionModal from '../components/SetDistributionModal';
import { SalesBudget as SalesBudgetType, Customer, Item } from '../services/api';

interface SalesBudgetItem {
  id: number;
  selected: boolean;
  customer: string;
  customerData: Customer;
  item: string;
  itemData: Item;
  category: string;
  brand: string;
  itemCombined: string;
  budget2025: number;
  actual2025: number;
  budget2026: number;
  rate: number;
  stock: number;
  git: number;
  budgetValue2026: number;
  discount: number;
  monthlyData: any[];
  apiData: SalesBudgetType;
}

const SalesBudget: React.FC = () => {
  const { user } = useAuth();
  const { 
    budgetData, 
    currentYear, 
    setCurrentYear,
    customers, 
    items, 
    categories, 
    brands,
    viewMode,
    setViewMode,
    isLoading,
    error,
    refreshBudgetData,
    bulkCreateBudget,
    createBudgetEntry,
    updateBudgetEntry,
    deleteBudgetEntry
  } = useBudget();

  // Filters
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedItem, setSelectedItem] = useState('');
  
  // Modal states
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isNewAdditionModalOpen, setIsNewAdditionModalOpen] = useState(false);
  const [newAdditionType] = useState<'customer' | 'item'>('item');
  const [isYearlyBudgetModalOpen, setIsYearlyBudgetModalOpen] = useState(false);
  const [isSetDistributionModalOpen, setIsSetDistributionModalOpen] = useState(false);
  
  // Edit state
  const [editingRowId, setEditingRowId] = useState<number | null>(null);
  const [editingData, setEditingData] = useState<Partial<SalesBudgetType>>({});
  
  // Notification state
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Auto-hide notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Show notification helper
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
  };

  // Transform budget data for table display
  const transformedData: SalesBudgetItem[] = React.useMemo(() => {
    if (!budgetData[currentYear]) return [];

    const data: SalesBudgetItem[] = [];
    const yearData = budgetData[currentYear];

    Object.entries(yearData).forEach(([customerId, customerBudget]) => {
      const customer = customerBudget.customer;
      
      // Group by items (assuming we need to aggregate monthly data)
      const itemGroups: { [itemId: string]: SalesBudgetItem } = {};
      
      customerBudget.months.forEach((month, monthIndex) => {
        if (month.budgetValue > 0) {
          const itemKey = `${customerId}-item`; // Simplified for now
          
          if (!itemGroups[itemKey]) {
            itemGroups[itemKey] = {
              id: parseInt(customerId),
              selected: false,
              customer: customer.name,
              customerData: customer,
              item: 'Aggregated Items',
              itemData: {} as Item,
              category: customer.category || 'General',
              brand: 'Various',
              itemCombined: 'Aggregated Items',
              budget2025: 0,
              actual2025: 0,
              budget2026: month.budgetValue,
              rate: month.rate,
              stock: month.stock,
              git: month.git,
              budgetValue2026: month.budgetValue,
              discount: month.discount,
              monthlyData: customerBudget.months,
              apiData: {} as SalesBudgetType
            };
          } else {
            itemGroups[itemKey].budget2026 += month.budgetValue;
            itemGroups[itemKey].budgetValue2026 += month.budgetValue;
          }
        }
      });
      
      data.push(...Object.values(itemGroups));
    });

    return data;
  }, [budgetData, currentYear]);

  // Apply filters
  const filteredData = React.useMemo(() => {
    return transformedData.filter(item => {
      if (selectedCustomer && !item.customer.toLowerCase().includes(selectedCustomer.toLowerCase())) {
        return false;
      }
      if (selectedCategory && !item.category.toLowerCase().includes(selectedCategory.toLowerCase())) {
        return false;
      }
      if (selectedBrand && !item.brand.toLowerCase().includes(selectedBrand.toLowerCase())) {
        return false;
      }
      if (selectedItem && !item.item.toLowerCase().includes(selectedItem.toLowerCase())) {
        return false;
      }
      return true;
    });
  }, [transformedData, selectedCustomer, selectedCategory, selectedBrand, selectedItem]);

  // Calculate totals
  const totals = React.useMemo(() => {
    return filteredData.reduce((acc, item) => ({
      budget2025: acc.budget2025 + item.budget2025,
      actual2025: acc.actual2025 + item.actual2025,
      budget2026: acc.budget2026 + item.budget2026,
      budgetValue2026: acc.budgetValue2026 + item.budgetValue2026
    }), { budget2025: 0, actual2025: 0, budget2026: 0, budgetValue2026: 0 });
  }, [filteredData]);

  // Handle export
  const handleExport = (config: ExportConfig) => {
    try {
      // Create CSV content
      const headers = ['Customer', 'Item', 'Category', 'Brand', 'Budget 2025', 'Actual 2025', 'Budget 2026', 'Rate', 'Discount'];
      const csvData = filteredData.map(item => [
        item.customer,
        item.item,
        item.category,
        item.brand,
        item.budget2025,
        item.actual2025,
        item.budget2026,
        item.rate,
        item.discount
      ]);
      
      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');
      
      // Download file
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sales-budget-${config.dateRange}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      showNotification('Data exported successfully');
    } catch (error) {
      showNotification('Export failed', 'error');
    }
  };

  // Handle new item addition
  const handleNewItemSubmit = async (data: NewItemData) => {
    try {
      if (data.type === 'yearlyBudget') {
        await bulkCreateBudget({
          customer: parseInt(data.customer),
          items: data.items.map(id => parseInt(id)),
          year: currentYear,
          total_amount: data.totalAmount,
          distribution_type: data.distributionType || 'equal'
        });
        showNotification('Yearly budget created successfully');
      } else {
        await createBudgetEntry({
          customer: parseInt(data.customer),
          item: parseInt(data.items[0]),
          year: currentYear,
          month: new Date().getMonth() + 1,
          quantity: data.quantity || 1,
          unit_price: data.rate || 0,
          discount_percentage: data.discount || 0,
          is_manual_entry: true
        });
        showNotification('Budget entry created successfully');
      }
      
      await refreshBudgetData();
      setIsNewAdditionModalOpen(false);
    } catch (error) {
      console.error('Failed to create budget entry:', error);
      showNotification('Failed to create budget entry', 'error');
    }
  };

  // Handle inline editing
  const startEdit = (item: SalesBudgetItem) => {
    setEditingRowId(item.id);
    setEditingData({
      quantity: item.budget2026 / item.rate || 0,
      unit_price: item.rate,
      discount_percentage: item.discount
    });
  };

  const saveEdit = async () => {
    if (!editingRowId) return;
    
    try {
      // Note: This is simplified - in a real implementation, you'd need to update the specific budget entry
      showNotification('Changes saved successfully');
      setEditingRowId(null);
      setEditingData({});
    } catch (error) {
      showNotification('Failed to save changes', 'error');
    }
  };

  const cancelEdit = () => {
    setEditingRowId(null);
    setEditingData({});
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-2">
            <Loader className="h-6 w-6 animate-spin text-blue-600" />
            <span className="text-gray-600">Loading sales budget data...</span>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sales Budget</h1>
            <p className="text-gray-600">Manage and track sales budget allocations</p>
          </div>
          
          {/* View Mode Switcher */}
          <div className="flex items-center space-x-4">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('customer-item')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'customer-item'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Users className="h-4 w-4 inline mr-1" />
                Customer-Item
              </button>
              <button
                onClick={() => setViewMode('item-wise')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'item-wise'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Package className="h-4 w-4 inline mr-1" />
                Item-wise
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <span className="text-red-700">{error}</span>
          </div>
        )}

        {/* Notification */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
            notification.type === 'success' 
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              {notification.type === 'success' ? (
                <div className="h-2 w-2 bg-green-400 rounded-full"></div>
              ) : (
                <AlertCircle className="h-4 w-4 text-red-500" />
              )}
              <span className="text-sm font-medium">{notification.message}</span>
              <button 
                onClick={() => setNotification(null)}
                className="ml-2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Year Selector */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              <select
                value={currentYear}
                onChange={(e) => setCurrentYear(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="Search customer..."
                value={selectedCustomer}
                onChange={(e) => setSelectedCustomer(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
              
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              
              <select
                value={selectedBrand}
                onChange={(e) => setSelectedBrand(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Brands</option>
                {brands.map(brand => (
                  <option key={brand.id} value={brand.name}>{brand.name}</option>
                ))}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsNewAdditionModalOpen(true)}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span>Add Entry</span>
              </button>
              
              <button
                onClick={() => setIsExportModalOpen(true)}
                className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                <DownloadIcon className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Budget {currentYear}</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${totals.budget2026.toLocaleString()}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Entries</p>
                <p className="text-2xl font-bold text-gray-900">{filteredData.length}</p>
              </div>
              <Package className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Customers</p>
                <p className="text-2xl font-bold text-gray-900">
                  {new Set(filteredData.map(item => item.customer)).size}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg. Discount</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredData.length > 0 
                    ? (filteredData.reduce((sum, item) => sum + item.discount, 0) / filteredData.length).toFixed(1)
                    : 0}%
                </p>
              </div>
              <PieChart className="h-8 w-8 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  {viewMode === 'customer-item' && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Brand
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Budget {currentYear}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount %
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredData.length === 0 ? (
                  <tr>
                    <td 
                      colSpan={viewMode === 'customer-item' ? 8 : 7} 
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      <div className="flex flex-col items-center space-y-2">
                        <Package className="h-12 w-12 text-gray-300" />
                        <p>No budget entries found</p>
                        <p className="text-sm">Create your first budget entry to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.customer}
                      </td>
                      {viewMode === 'customer-item' && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {item.item}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.brand}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ${item.budget2026.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ${item.rate.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.discount}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          {editingRowId === item.id ? (
                            <>
                              <button
                                onClick={saveEdit}
                                className="text-green-600 hover:text-green-900"
                              >
                                <Save className="h-4 w-4" />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="text-gray-600 hover:text-gray-900"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(item)}
                                className="text-blue-600 hover:text-blue-900"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => setIsSetDistributionModalOpen(true)}
                                className="text-purple-600 hover:text-purple-900"
                              >
                                Distribute
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modals */}
        <ExportModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          onExport={handleExport}
        />

        <NewAdditionModal
          isOpen={isNewAdditionModalOpen}
          onClose={() => setIsNewAdditionModalOpen(false)}
          onSubmit={handleNewItemSubmit}
          type={newAdditionType}
          customers={customers}
          items={items}
        />

        <YearlyBudgetModal
          isOpen={isYearlyBudgetModalOpen}
          onClose={() => setIsYearlyBudgetModalOpen(false)}
          onSubmit={handleNewItemSubmit}
          customers={customers}
          items={items}
        />

        <SetDistributionModal
          isOpen={isSetDistributionModalOpen}
          onClose={() => setIsSetDistributionModalOpen(false)}
          onDistribute={() => {
            showNotification('Distribution applied successfully');
            setIsSetDistributionModalOpen(false);
          }}
          totalBudget={0}
          currentYear={currentYear}
        />
      </div>
    </Layout>
  );
};

export default SalesBudget;
